// ============================================================
//  YCA Cerámica — Admin: Laboratorio de Materiales (etapa 2)
//  Archivo independiente: no modifica script.js.
//  Depende de: script.js (API, getSesion, toast) y ../lab-markdown.js
//  Backend: Código.gs → getLaboratorioAdmin, guardarMaterialLab,
//           eliminarMaterialLab, subirFotoLab, quitarFotoLab
// ============================================================

var LAB_URL_BASE = 'https://ycaceramica.com.ar/laboratorio/'
var LAB_SUGERENCIAS_TEC = ['Composición', 'Temperatura de trabajo', 'Compatibilidades', 'Condiciones de aplicación', 'Recomendaciones']

var _lab = { data: [], muestras: [], tab: 'publicados', busqueda: '', cargado: false }
var _labForm = null      // estado del modal abierto
var _labEliminando = null
var _labConfirmFn = null

// ── Enganche con el router de secciones (sin tocar script.js) ──
;(function () {
  var original = window.cargarSeccion
  if (typeof original !== 'function') { console.error('laboratorio.js: cargarSeccion no encontrada'); return }
  window.cargarSeccion = async function (nombre) {
    if (nombre === 'laboratorio') { await cargarLaboratorio(); return }
    return original.apply(this, arguments)
  }
})()

// ── Utilidades ───────────────────────────────────────────────

function labEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function labSlugify(s) {
  s = String(s || '').toLowerCase()
  try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') } catch (e) {}
  return s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 60).replace(/-+$/, '')
}

function labPost(action, payload) {
  var sesion = getSesion()
  var body = Object.assign({ action: action, token: sesion && sesion.token }, payload || {})
  return fetch(API, { method: 'POST', body: JSON.stringify(body) }).then(function (r) { return r.json() })
}

function labBuscar(id) {
  for (var i = 0; i < _lab.data.length; i++) if (String(_lab.data[i].id) === String(id)) return _lab.data[i]
  return null
}

function labCopiar(texto) {
  var ok = function () { toast('📋 Enlace copiado', 'ok') }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto).then(ok, function () { labCopiarFallback(texto); ok() })
  } else { labCopiarFallback(texto); ok() }
}
function labCopiarFallback(texto) {
  var ta = document.createElement('textarea')
  ta.value = texto; ta.style.position = 'fixed'; ta.style.opacity = '0'
  document.body.appendChild(ta); ta.select()
  try { document.execCommand('copy') } catch (e) {}
  document.body.removeChild(ta)
}

function labCerrar(idModal) { var m = document.getElementById(idModal); if (m) m.style.display = 'none' }
function labAbrirOverlay(idModal) { var m = document.getElementById(idModal); if (m) m.style.display = 'flex' }

// ── Imágenes: redimensionar + comprimir antes de subir ───────
// (convertirAJpg de script.js comprime pero no redimensiona; esta función
//  es propia del módulo para no alterar el comportamiento de los demás.)

function labKB(dataUrl) { return Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75 / 1024) }

function labCargarImg(file) {
  return new Promise(function (resolve, reject) {
    var url = URL.createObjectURL(file)
    var img = new Image()
    img.onload = function () { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')) }
    img.src = url
  })
}

async function labPrepararImagen(file, maxLado, calidad) {
  maxLado = maxLado || 1600
  calidad = calidad || 0.82
  var fuente = null, w, h
  if (window.createImageBitmap) {
    try { fuente = await createImageBitmap(file, { imageOrientation: 'from-image' }) } catch (e) { fuente = null }
  }
  if (fuente) { w = fuente.width; h = fuente.height }
  else { fuente = await labCargarImg(file); w = fuente.naturalWidth; h = fuente.naturalHeight }

  var escala = Math.min(1, maxLado / Math.max(w, h))
  var cw = Math.max(1, Math.round(w * escala)), ch = Math.max(1, Math.round(h * escala))
  var canvas = document.createElement('canvas')
  canvas.width = cw; canvas.height = ch
  var ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cw, ch)
  ctx.drawImage(fuente, 0, 0, cw, ch)
  if (fuente.close) fuente.close()

  var q = calidad
  var url = canvas.toDataURL('image/jpeg', q)
  while (labKB(url) > 900 && q > 0.55) { q -= 0.08; url = canvas.toDataURL('image/jpeg', q) }
  return { dataUrl: url, w: cw, h: ch, kb: labKB(url) }
}

// ── Listado ──────────────────────────────────────────────────

async function cargarLaboratorio() {
  var load = document.getElementById('loading-laboratorio')
  if (load) load.style.display = 'block'
  try {
    var sesion = getSesion()
    var res = await fetch(API + '?action=getLaboratorioAdmin&token=' + encodeURIComponent(sesion.token) + '&t=' + Date.now())
    var data = await res.json()
    if (!data.ok) throw new Error(data.error || 'Error')
    _lab.data = data.data || []
    _lab.muestras = data.muestras || []
    _lab.cargado = true
    labRenderLista()
  } catch (e) {
    toast('❌ No se pudo cargar el Laboratorio', 'err')
  } finally {
    if (load) load.style.display = 'none'
  }
}

function labSetTab(tab) {
  _lab.tab = tab
  document.querySelectorAll('#seccion-laboratorio .utab').forEach(function (b) { b.classList.remove('activo') })
  var t = document.getElementById('labtab-' + tab)
  if (t) t.classList.add('activo')
  labRenderLista()
}

function labFiltrar() {
  var i = document.getElementById('labBuscar')
  _lab.busqueda = i ? i.value.trim().toLowerCase() : ''
  labRenderLista()
}

function labRenderLista() {
  var lista = document.getElementById('lista-laboratorio')
  if (!lista) return
  var pub = _lab.data.filter(function (m) { return m.publicado })
  var bor = _lab.data.filter(function (m) { return !m.publicado })
  document.getElementById('cnt-lab-publicados').textContent = pub.length
  document.getElementById('cnt-lab-borradores').textContent = bor.length

  var items = _lab.tab === 'publicados' ? pub : bor
  var q = _lab.busqueda
  if (q) items = items.filter(function (m) {
    return (m.nombre + ' ' + m.codigo + ' ' + (m.categoria || '')).toLowerCase().indexOf(q) >= 0
  })

  if (!items.length) {
    lista.innerHTML = '<div class="vacio"><i class="fa-solid fa-flask-vial"></i><p>' +
      (q ? 'No hay resultados para esa búsqueda' : (_lab.tab === 'publicados' ? 'Todavía no hay fichas publicadas' : 'No hay borradores')) + '</p></div>'
    return
  }

  lista.innerHTML = items.map(function (m) {
    var foto = m.foto
      ? '<img src="' + labEsc(m.foto) + '" alt="" loading="lazy">'
      : '<span>🧪</span>'
    var n = m.muestras_count || 0
    var id = labEsc(m.id)
    return '<div class="lab-card">' +
      '<div class="lab-card-foto">' + foto + '</div>' +
      '<div class="lab-card-info">' +
        '<div class="lab-card-nombre">' + labEsc(m.nombre) + '</div>' +
        '<div class="lab-card-meta">' + labEsc(m.codigo || '') + (m.categoria ? ' · ' + labEsc(m.categoria) : '') + ' · ' + n + (n === 1 ? ' muestra' : ' muestras') + '</div>' +
        '<div class="lab-card-url">/laboratorio/' + labEsc(m.slug) + '/</div>' +
        '<span class="estado-badge ' + (m.publicado ? 'activo' : 'pausado') + '">' + (m.publicado ? 'Publicado' : 'Borrador') + '</span>' +
      '</div>' +
      '<div class="lab-card-acc">' +
        '<button class="lab-btn" title="Editar" onclick="labAbrirModal(\'' + id + '\')"><i class="fa-solid fa-pen"></i></button>' +
        '<button class="lab-btn" title="Copiar enlace público" onclick="labCopiarEnlace(\'' + id + '\')"><i class="fa-solid fa-link"></i></button>' +
        '<button class="lab-btn" title="' + (m.publicado ? 'Despublicar' : 'Publicar') + '" onclick="labTogglePublicar(\'' + id + '\')"><i class="fa-solid ' + (m.publicado ? 'fa-eye-slash' : 'fa-eye') + '"></i></button>' +
        '<button class="lab-btn lab-btn-borrar" title="Eliminar" onclick="labPedirEliminar(\'' + id + '\')"><i class="fa-solid fa-trash"></i></button>' +
      '</div>' +
    '</div>'
  }).join('')
}

function labCopiarEnlace(id) {
  var m = labBuscar(id)
  if (m) labCopiar(LAB_URL_BASE + m.slug + '/')
}

// ── Publicar / despublicar desde la lista ────────────────────

function labTogglePublicar(id) {
  var m = labBuscar(id)
  if (!m) return
  if (m.publicado) {
    labConfirmar('¿Despublicar "' + m.nombre + '"?',
      'La ficha dejará de verse en la web. Si hay QR impresos con este enlace, mostrarán "material no disponible" hasta que vuelvas a publicarla.',
      'Despublicar', function () { labCambiarPublicado(m, false) })
  } else {
    labCambiarPublicado(m, true)
  }
}

async function labCambiarPublicado(m, valor) {
  try {
    var r = await labPost('guardarMaterialLab', { fila: { id: m.id, nombre: m.nombre, publicado: valor } })
    if (!r.ok) { toast('❌ ' + (r.error || 'Error'), 'err'); return }
    await cargarLaboratorio()
    toast(valor ? '✅ Ficha publicada' : '✅ Ficha despublicada', 'ok')
  } catch (e) { toast('❌ Error de conexión', 'err') }
}

function labConfirmar(titulo, mensaje, textoBoton, fn) {
  _labConfirmFn = fn
  document.getElementById('labConfirmTitulo').textContent = titulo
  document.getElementById('labConfirmMensaje').textContent = mensaje
  document.getElementById('labConfirmBoton').textContent = textoBoton
  labAbrirOverlay('modalLabConfirm')
}
function labConfirmarOk() {
  labCerrar('modalLabConfirm')
  var fn = _labConfirmFn; _labConfirmFn = null
  if (fn) fn()
}

// ── Modal de ficha ───────────────────────────────────────────

function labAbrirModal(id) {
  var item = id ? labBuscar(id) : null
  _labForm = {
    item: item,
    slugManual: !!item,                 // en fichas existentes no se re-autogenera
    slugBloqueado: !!(item && item.publicadoEn),
    fotoNueva: null,                    // dataURL ya redimensionada, pendiente de subir
    fotoQuitar: false
  }
  document.getElementById('modalLabTitulo').textContent = item ? 'Editar ficha' : 'Nueva ficha de material'

  var cats = {}
  _lab.data.forEach(function (m) { if (m.categoria) cats[m.categoria] = 1 })
  var datalist = Object.keys(cats).map(function (c) { return '<option value="' + labEsc(c) + '">' }).join('')

  var car = (item && item.caracteristicas) || []
  var tec = (item && item.tecnicas) || []

  document.getElementById('modalLabBody').innerHTML =
    '<div class="lab-tabs">' +
      '<button type="button" class="lab-tab activo" data-pane="general" onclick="labTab(\'general\')">General</button>' +
      '<button type="button" class="lab-tab" data-pane="tecnica" onclick="labTab(\'tecnica\')">Técnica</button>' +
      '<button type="button" class="lab-tab" data-pane="muestras" onclick="labTab(\'muestras\')">Muestras</button>' +
      '<button type="button" class="lab-tab" data-pane="uso" onclick="labTab(\'uso\')">Formas de uso</button>' +
      '<button type="button" class="lab-tab" data-pane="publicacion" onclick="labTab(\'publicacion\')">Publicación</button>' +
    '</div>' +

    // ── General
    '<div class="lab-pane activo" data-pane="general">' +
      '<div class="mform-grupo"><label>Nombre del material *</label>' +
        '<input id="labNombre" maxlength="150" value="' + labEsc(item ? item.nombre : '') + '" placeholder="Ej: Bronce en polvo" oninput="labOnNombre()"></div>' +
      '<div class="mform-grupo"><label>Dirección (slug)</label>' +
        '<input id="labSlug" maxlength="60" value="' + labEsc(item ? item.slug : '') + '" placeholder="bronce-en-polvo"' +
          (_labForm.slugBloqueado ? ' readonly' : '') + ' oninput="labOnSlug()" onblur="labOnSlugBlur()">' +
        '<div class="lab-hint" id="labSlugHint"></div></div>' +
      '<div class="mform-grupo"><label>Categoría <small>(opcional)</small></label>' +
        '<input id="labCategoria" maxlength="80" list="labCategorias" value="' + labEsc(item ? item.categoria : '') + '" placeholder="Ej: Metálicos, Óxidos…">' +
        '<datalist id="labCategorias">' + datalist + '</datalist></div>' +
      '<div class="mform-grupo"><label>Descripción</label>' +
        '<textarea id="labDescripcion" rows="4" maxlength="5000" placeholder="Qué es el material y para qué se usa">' + labEsc(item ? item.descripcion : '') + '</textarea></div>' +
      '<div class="mform-grupo"><label>Observaciones importantes</label>' +
        '<textarea id="labObservaciones" rows="3" maxlength="3000" placeholder="Avisos que quien compra tiene que ver primero">' + labEsc(item ? item.observaciones : '') + '</textarea></div>' +
      '<div class="mform-grupo"><label>Fotografía principal</label>' +
        '<div class="lab-foto-area" id="labFotoArea" onclick="document.getElementById(\'labFotoInput\').click()"></div>' +
        '<input type="file" id="labFotoInput" accept="image/*" style="display:none" onchange="labOnFoto(this)">' +
        '<div class="lab-hint" id="labFotoInfo">Se redimensiona y comprime automáticamente. Se sube al guardar.</div></div>' +
    '</div>' +

    // ── Técnica
    '<div class="lab-pane" data-pane="tecnica">' +
      '<div class="mform-grupo"><label>Características generales</label>' +
        '<div class="lab-hint">Datos libres en pares «título → detalle». Agregá solo lo que corresponda a este material.</div>' +
        '<div class="lab-pares" id="labPares-car">' + car.map(function (p) { return labParHTML(p.etiqueta, p.valor) }).join('') + '</div>' +
        '<button type="button" class="lab-btn-add" onclick="labAgregarPar(\'car\')"><i class="fa-solid fa-plus"></i> Agregar característica</button></div>' +
      '<div class="mform-grupo"><label>Características técnicas</label>' +
        '<div class="lab-hint">Composición, temperaturas, compatibilidades, condiciones de aplicación… lo carga YCA; no se completa nada automáticamente.</div>' +
        '<div class="lab-pares" id="labPares-tec">' + tec.map(function (p) { return labParHTML(p.etiqueta, p.valor) }).join('') + '</div>' +
        '<div class="lab-chips">' + LAB_SUGERENCIAS_TEC.map(function (s) {
          return '<button type="button" class="lab-chip" onclick="labAgregarPar(\'tec\',\'' + s + '\')">+ ' + s + '</button>'
        }).join('') + '</div>' +
        '<button type="button" class="lab-btn-add" onclick="labAgregarPar(\'tec\')"><i class="fa-solid fa-plus"></i> Agregar campo técnico</button></div>' +
      '<div class="mform-grupo"><label>Precauciones de manipulación</label>' +
        '<textarea id="labPrecauciones" rows="4" maxlength="3000" placeholder="Elementos de protección, ventilación, almacenamiento…">' + labEsc(item ? item.precauciones : '') + '</textarea></div>' +
    '</div>' +

    // ── Muestras
    '<div class="lab-pane" data-pane="muestras"><div id="labMuestrasPane"></div></div>' +

    // ── Formas de uso
    '<div class="lab-pane" data-pane="uso">' +
      '<div class="mform-grupo"><label>Formas de uso</label>' +
        '<div class="lab-md-bar">' +
          '<button type="button" title="Subtítulo" onclick="labMd(\'h\')"><i class="fa-solid fa-heading"></i></button>' +
          '<button type="button" title="Negrita" onclick="labMd(\'b\')"><i class="fa-solid fa-bold"></i></button>' +
          '<button type="button" title="Cursiva" onclick="labMd(\'i\')"><i class="fa-solid fa-italic"></i></button>' +
          '<button type="button" title="Lista" onclick="labMd(\'ul\')"><i class="fa-solid fa-list-ul"></i></button>' +
          '<button type="button" title="Lista numerada" onclick="labMd(\'ol\')"><i class="fa-solid fa-list-ol"></i></button>' +
          '<button type="button" title="Aviso / cita" onclick="labMd(\'q\')"><i class="fa-solid fa-triangle-exclamation"></i></button>' +
          '<button type="button" title="Enlace" onclick="labMd(\'link\')"><i class="fa-solid fa-link"></i></button>' +
          '<button type="button" title="Insertar foto de esta ficha" onclick="labMdImagen()"><i class="fa-solid fa-image"></i></button>' +
          '<span class="lab-md-sep"></span>' +
          '<button type="button" class="lab-md-modo activo" id="labModoEscribir" onclick="labMdVista(\'escribir\')">Escribir</button>' +
          '<button type="button" class="lab-md-modo" id="labModoVer" onclick="labMdVista(\'ver\')">Vista previa</button>' +
        '</div>' +
        '<textarea id="labUso" class="lab-md-area" rows="14" maxlength="40000" oninput="labContarUso()" ' +
          'placeholder="## Preparación&#10;Explicá el procedimiento…&#10;&#10;- Paso uno&#10;- Paso dos">' + labEsc(item ? item.formas_uso : '') + '</textarea>' +
        '<div class="lab-md-preview lab-md" id="labUsoVista" style="display:none"></div>' +
        '<div class="lab-hint"><span id="labUsoCont">0</span> / 40000 caracteres · Usá <b>##</b> para subtítulos, <b>-</b> para listas, <b>&gt;</b> para avisos.</div></div>' +
    '</div>' +

    // ── Publicación
    '<div class="lab-pane" data-pane="publicacion">' +
      '<div class="elaboracion-config-box" style="margin-bottom:6px">' +
        '<div><div class="elaboracion-config-titulo">🌐 Publicar ficha</div>' +
        '<div class="elaboracion-config-desc">Cuando está activa, cualquiera con el enlace o el QR puede ver la ficha.</div></div>' +
        '<label class="toggle-switch"><input type="checkbox" id="labPublicado"' + (item && item.publicado ? ' checked' : '') + '><span class="toggle-slider"></span></label>' +
      '</div>' +
      '<div class="mform-grupo"><label>Enlace público permanente</label>' +
        '<div class="lab-url-box"><span id="labUrlTexto"></span>' +
        '<button type="button" class="lab-btn-add" onclick="labCopiarEnlaceForm()"><i class="fa-solid fa-copy"></i> Copiar</button></div>' +
        '<div class="lab-hint" id="labUrlNota"></div></div>' +
      (item ? '<div class="lab-hint">Código: <b>' + labEsc(item.codigo) + '</b> · ' + (item.muestras_count || 0) + ' muestras</div>' : '') +
    '</div>'

  labAbrirOverlay('modalLabOverlay')
  document.getElementById('modalLabBody').scrollTop = 0
  labRenderFoto()
  labActualizarSlug()
  labContarUso()
  labRenderMuestras()
}

function labCerrarModal() { labCerrar('modalLabOverlay'); _labForm = null }

function labTab(nombre) {
  document.querySelectorAll('#modalLabBody .lab-tab').forEach(function (b) { b.classList.toggle('activo', b.dataset.pane === nombre) })
  document.querySelectorAll('#modalLabBody .lab-pane').forEach(function (p) { p.classList.toggle('activo', p.dataset.pane === nombre) })
}

// ── Nombre / slug / URL ──────────────────────────────────────

function labOnNombre() {
  if (_labForm && !_labForm.slugManual && !_labForm.slugBloqueado) {
    document.getElementById('labSlug').value = labSlugify(document.getElementById('labNombre').value)
  }
  labActualizarSlug()
}

function labOnSlug() {
  if (!_labForm || _labForm.slugBloqueado) return
  _labForm.slugManual = true
  var i = document.getElementById('labSlug')
  i.value = i.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-{2,}/g, '-')
  labActualizarSlug()
}

function labOnSlugBlur() {
  if (!_labForm || _labForm.slugBloqueado) return
  var i = document.getElementById('labSlug')
  i.value = labSlugify(i.value)
  labActualizarSlug()
}

function labActualizarSlug() {
  if (!_labForm) return
  var slug = document.getElementById('labSlug').value
  var hint = document.getElementById('labSlugHint')
  hint.innerHTML = _labForm.slugBloqueado
    ? '🔒 Permanente: la ficha ya fue publicada y su URL/QR no puede cambiar.'
    : 'Será la dirección de la ficha. Después de publicarla ya no se podrá cambiar.'
  var url = slug ? LAB_URL_BASE + slug + '/' : '—'
  document.getElementById('labUrlTexto').textContent = url
  document.getElementById('labUrlNota').textContent = slug
    ? 'El QR del envase debe apuntar a esta dirección.'
    : 'Completá el nombre para generar la dirección.'
}

function labCopiarEnlaceForm() {
  var slug = document.getElementById('labSlug').value
  if (!slug) { toast('Completá el nombre primero', 'err'); return }
  labCopiar(LAB_URL_BASE + slug + '/')
}

// ── Foto principal ───────────────────────────────────────────

function labRenderFoto() {
  var area = document.getElementById('labFotoArea')
  if (!area || !_labForm) return
  var actual = _labForm.fotoNueva || (!_labForm.fotoQuitar && _labForm.item && _labForm.item.foto) || ''
  if (actual) {
    area.innerHTML = '<img src="' + labEsc(actual) + '" alt="Vista previa">' +
      '<div class="lab-foto-acc">' +
        '<button type="button" class="lab-btn-add" onclick="event.stopPropagation();document.getElementById(\'labFotoInput\').click()"><i class="fa-solid fa-camera"></i> Cambiar</button>' +
        '<button type="button" class="lab-btn-add lab-btn-peligro" onclick="event.stopPropagation();labQuitarFoto()"><i class="fa-solid fa-trash"></i> Quitar</button>' +
      '</div>'
  } else {
    area.innerHTML = '<div class="lab-foto-vacia"><i class="fa-solid fa-camera"></i><span>Tocá para elegir una foto</span></div>'
  }
}

async function labOnFoto(input) {
  var file = input.files && input.files[0]
  input.value = ''
  if (!file || !_labForm) return
  if (!/^image\//.test(file.type)) { toast('Elegí un archivo de imagen', 'err'); return }
  var info = document.getElementById('labFotoInfo')
  info.textContent = 'Procesando imagen…'
  try {
    var r = await labPrepararImagen(file, 1600, 0.82)
    _labForm.fotoNueva = r.dataUrl
    _labForm.fotoQuitar = false
    info.textContent = 'Lista para subir: ' + r.w + '×' + r.h + ' px · ' + r.kb + ' KB (se sube al guardar).'
    labRenderFoto()
  } catch (e) {
    info.textContent = 'No se pudo procesar esa imagen. Probá con otra.'
    toast('❌ No se pudo leer la imagen', 'err')
  }
}

function labQuitarFoto() {
  if (!_labForm) return
  _labForm.fotoNueva = null
  _labForm.fotoQuitar = true
  document.getElementById('labFotoInfo').textContent = 'La foto se quitará al guardar.'
  labRenderFoto()
}

// ── Pares etiqueta/valor ─────────────────────────────────────

function labParHTML(et, val) {
  return '<div class="lab-par">' +
    '<input class="lab-par-et" maxlength="80" placeholder="Título (ej: Temperatura de trabajo)" value="' + labEsc(et) + '">' +
    '<textarea class="lab-par-val" rows="2" maxlength="2000" placeholder="Detalle">' + labEsc(val) + '</textarea>' +
    '<button type="button" class="lab-par-del" title="Quitar" onclick="labQuitarPar(this)"><i class="fa-solid fa-xmark"></i></button>' +
  '</div>'
}

function labAgregarPar(tipo, etiqueta) {
  var cont = document.getElementById('labPares-' + tipo)
  if (!cont) return
  if (cont.children.length >= 40) { toast('Máximo 40 campos', 'err'); return }
  cont.insertAdjacentHTML('beforeend', labParHTML(etiqueta || '', ''))
  var ultimo = cont.lastElementChild
  var foco = etiqueta ? ultimo.querySelector('.lab-par-val') : ultimo.querySelector('.lab-par-et')
  if (foco) foco.focus()
}

function labQuitarPar(btn) { var p = btn.closest('.lab-par'); if (p) p.remove() }

function labLeerPares(tipo) {
  var out = []
  document.querySelectorAll('#labPares-' + tipo + ' .lab-par').forEach(function (p) {
    var et = p.querySelector('.lab-par-et').value.trim()
    var val = p.querySelector('.lab-par-val').value.trim()
    if (et || val) out.push({ etiqueta: et, valor: val })
  })
  return out
}

// ── Editor Markdown (formas de uso) ──────────────────────────

function labContarUso() {
  var ta = document.getElementById('labUso'), c = document.getElementById('labUsoCont')
  if (ta && c) c.textContent = ta.value.length
}

function labMdVista(modo) {
  var ta = document.getElementById('labUso'), vista = document.getElementById('labUsoVista')
  var ver = modo === 'ver'
  if (ver) vista.innerHTML = window.LabMarkdown ? LabMarkdown.render(ta.value) || '<p class="lab-hint">Todavía no escribiste nada.</p>' : ''
  ta.style.display = ver ? 'none' : ''
  vista.style.display = ver ? '' : 'none'
  document.getElementById('labModoEscribir').classList.toggle('activo', !ver)
  document.getElementById('labModoVer').classList.toggle('activo', ver)
}

function labMd(accion) {
  var ta = document.getElementById('labUso')
  if (ta.style.display === 'none') labMdVista('escribir')
  var v = ta.value, s = ta.selectionStart, e = ta.selectionEnd, sel = v.substring(s, e)

  function poner(texto, selIni, selFin) {
    ta.value = v.substring(0, s) + texto + v.substring(e)
    ta.focus(); ta.setSelectionRange(s + selIni, s + selFin)
    labContarUso()
  }
  function porLineas(prefijoFn) {
    var ls = v.lastIndexOf('\n', s - 1) + 1
    var le = v.indexOf('\n', e); if (le < 0) le = v.length
    var nuevo = v.substring(ls, le).split('\n').map(prefijoFn).join('\n')
    ta.value = v.substring(0, ls) + nuevo + v.substring(le)
    ta.focus(); ta.setSelectionRange(ls, ls + nuevo.length)
    labContarUso()
  }

  if (accion === 'b')  { var t1 = sel || 'texto'; poner('**' + t1 + '**', 2, 2 + t1.length) }
  else if (accion === 'i') { var t2 = sel || 'texto'; poner('*' + t2 + '*', 1, 1 + t2.length) }
  else if (accion === 'link') { var t3 = sel || 'texto del enlace'; poner('[' + t3 + '](https://)', t3.length + 3, t3.length + 11) }
  else if (accion === 'h')  porLineas(function (l) { return l.replace(/^#{1,3}\s+/, '') === l ? '## ' + l : l.replace(/^#{1,3}\s+/, '') })
  else if (accion === 'ul') porLineas(function (l) { return /^\s*[-*+]\s+/.test(l) ? l.replace(/^\s*[-*+]\s+/, '') : '- ' + l })
  else if (accion === 'ol') porLineas(function (l, i) { return /^\s*\d+[.)]\s+/.test(l) ? l.replace(/^\s*\d+[.)]\s+/, '') : (i + 1) + '. ' + l })
  else if (accion === 'q')  porLineas(function (l) { return /^>\s?/.test(l) ? l.replace(/^>\s?/, '') : '> ' + l })
}

// ── Guardar ──────────────────────────────────────────────────

function labRecolectar() {
  var f = _labForm
  var fila = {
    nombre:          document.getElementById('labNombre').value.trim(),
    categoria:       document.getElementById('labCategoria').value.trim(),
    descripcion:     document.getElementById('labDescripcion').value,
    observaciones:   document.getElementById('labObservaciones').value,
    caracteristicas: labLeerPares('car'),
    tecnicas:        labLeerPares('tec'),
    precauciones:    document.getElementById('labPrecauciones').value,
    formas_uso:      document.getElementById('labUso').value,
    publicado:       document.getElementById('labPublicado').checked
  }
  if (f.item) fila.id = f.item.id
  if (!f.slugBloqueado) fila.slug = document.getElementById('labSlug').value.trim()
  return fila
}

async function labGuardar(opts) {
  opts = opts || {}
  if (!_labForm) return
  var fila = labRecolectar()
  if (!fila.nombre) { labTab('general'); toast('El nombre es obligatorio', 'err'); document.getElementById('labNombre').focus(); return }

  var btn = document.getElementById('btnLabGuardar')
  var htmlBtn = btn.innerHTML
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...'
  btn.disabled = true

  try {
    var r = await labPost('guardarMaterialLab', { fila: fila })
    if (!r.ok) { toast('❌ ' + (r.error || 'Error al guardar'), 'err'); return }

    var avisoFoto = ''
    if (_labForm.fotoNueva) {
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo foto...'
      var rf = await labPost('subirFotoLab', {
        hoja: 'laboratorio', id: r.id, campo: 'foto', b64: _labForm.fotoNueva,
        nombre: r.slug + '_principal_' + Date.now()
      })
      if (!rf.ok) avisoFoto = rf.error || 'No se pudo subir la foto'
    } else if (_labForm.fotoQuitar && _labForm.item && _labForm.item.foto) {
      var rq = await labPost('quitarFotoLab', { hoja: 'laboratorio', id: r.id, campo: 'foto' })
      if (!rq.ok) avisoFoto = rq.error || 'No se pudo quitar la foto'
    }

    labCerrarModal()
    await cargarLaboratorio()
    if (opts.abrirMuestras) { labAbrirModal(r.id); labTab('muestras') }
    if (avisoFoto) toast('⚠️ Ficha guardada, pero la foto falló: ' + avisoFoto, 'err')
    else toast('✅ Ficha guardada', 'ok')
  } catch (e) {
    toast('❌ Error de conexión', 'err')
  } finally {
    btn.innerHTML = htmlBtn
    btn.disabled = false
  }
}

// ── Eliminar (con protecciones) ──────────────────────────────

function labPedirEliminar(id) {
  var m = labBuscar(id)
  if (!m) return
  _labEliminando = m
  var body = document.getElementById('modalLabEliminarBody')

  if (m.publicado) {
    body.innerHTML =
      '<p class="lab-del-txt">«<b>' + labEsc(m.nombre) + '</b>» está <b>publicada</b>. Su enlace y su QR pueden estar impresos en envases.</p>' +
      '<p class="lab-del-txt">Por seguridad, primero hay que despublicarla.</p>' +
      '<div class="lab-del-acc">' +
        '<button class="btn-guardar-modal" onclick="labCerrar(\'modalLabEliminar\');labTogglePublicar(\'' + labEsc(m.id) + '\')"><i class="fa-solid fa-eye-slash"></i> Despublicar ahora</button>' +
        '<button class="btn-cancelar" style="width:100%" onclick="labCerrar(\'modalLabEliminar\')">Cancelar</button>' +
      '</div>'
  } else {
    var n = m.muestras_count || 0
    body.innerHTML =
      '<p class="lab-del-txt">Vas a eliminar «<b>' + labEsc(m.nombre) + '</b>»' + (n ? ' y sus <b>' + n + '</b> muestras' : '') + '.</p>' +
      '<div class="mform-grupo"><label>Para confirmar, escribí la dirección: <b>' + labEsc(m.slug) + '</b></label>' +
        '<input id="labDelConfirm" autocomplete="off" oninput="labDelValidar()" placeholder="' + labEsc(m.slug) + '"></div>' +
      '<div class="lab-del-acc">' +
        '<button class="btn-guardar-modal lab-del-btn" id="labDelSolo" disabled onclick="labConfirmarEliminar(false)"><i class="fa-solid fa-eye-slash"></i> Solo quitar de la web</button>' +
        '<button class="btn-guardar-modal lab-del-btn lab-del-rojo" id="labDelTodo" disabled onclick="labConfirmarEliminar(true)"><i class="fa-solid fa-trash"></i> Quitar y borrar fotos del Drive</button>' +
        '<button class="btn-cancelar" style="width:100%" onclick="labCerrar(\'modalLabEliminar\')">Cancelar</button>' +
      '</div>'
  }
  labAbrirOverlay('modalLabEliminar')
}

function labDelValidar() {
  var ok = _labEliminando && document.getElementById('labDelConfirm').value.trim() === _labEliminando.slug
  document.getElementById('labDelSolo').disabled = !ok
  document.getElementById('labDelTodo').disabled = !ok
}

async function labConfirmarEliminar(borrarDrive) {
  var m = _labEliminando
  if (!m) return
  var slugEscrito = document.getElementById('labDelConfirm').value.trim()
  labCerrar('modalLabEliminar')
  try {
    var r = await labPost('eliminarMaterialLab', { id: m.id, borrarDrive: !!borrarDrive, confirmarSlug: slugEscrito })
    if (!r.ok) { toast('❌ ' + (r.error || 'No se pudo eliminar'), 'err'); return }
    _labEliminando = null
    await cargarLaboratorio()
    toast('✅ Ficha eliminada', 'ok')
  } catch (e) { toast('❌ Error de conexión', 'err') }
}


// ============================================================
//  MUESTRAS (etapa 3): pruebas con hasta 4 fotos cada una
// ============================================================

var LAB_CAMPOS_FOTO = ['foto', 'foto2', 'foto3', 'foto4']
var _labMuestraForm = null
var _labSlotActivo = 0
var _labMuestraEliminando = null

function labMuestrasDe(materialId) {
  return _lab.muestras.filter(function (m) { return String(m.material_id) === String(materialId) })
    .sort(function (a, b) { return (Number(a.orden) || 0) - (Number(b.orden) || 0) })
}

function labFotosDe(m) {
  return LAB_CAMPOS_FOTO.map(function (c) { return m[c] || '' }).filter(Boolean)
}

function labRenderMuestras() {
  var cont = document.getElementById('labMuestrasPane')
  if (!cont || !_labForm) return
  var item = _labForm.item
  if (!item) {
    cont.innerHTML =
      '<div class="lab-muestras-vacio"><i class="fa-solid fa-camera-retro"></i>' +
      '<p>Primero hay que guardar la ficha para poder agregarle muestras.</p>' +
      '<button type="button" class="lab-btn-add" onclick="labGuardar({abrirMuestras:true})"><i class="fa-solid fa-floppy-disk"></i> Guardar ficha y agregar muestras</button></div>'
    return
  }
  var lista = labMuestrasDe(item.id)
  var html =
    '<div class="lab-hint">Cada muestra es una prueba con sus fotos y su explicación. El orden de abajo es el que verá el público.</div>' +
    '<button type="button" class="lab-btn-add" onclick="labAbrirMuestra()"><i class="fa-solid fa-plus"></i> Agregar muestra</button>'
  if (!lista.length) {
    html += '<div class="lab-muestras-vacio"><i class="fa-solid fa-flask-vial"></i><p>Todavía no hay muestras en esta ficha.</p></div>'
  } else {
    html += '<div class="lab-muestras">' + lista.map(function (m, i) {
      var fotos = labFotosDe(m)
      var id = labEsc(m.id)
      return '<div class="lab-muestra">' +
        '<div class="lab-muestra-foto">' + (fotos[0] ? '<img src="' + labEsc(fotos[0]) + '" alt="" loading="lazy">' : '<span>📷</span>') +
          (fotos.length > 1 ? '<em>' + fotos.length + '</em>' : '') + '</div>' +
        '<div class="lab-muestra-info"><div class="lab-muestra-titulo">' + (i + 1) + '. ' + labEsc(m.titulo) + '</div>' +
          '<div class="lab-card-meta">' + fotos.length + (fotos.length === 1 ? ' foto' : ' fotos') + '</div></div>' +
        '<div class="lab-card-acc">' +
          '<button type="button" class="lab-btn" title="Subir" ' + (i === 0 ? 'disabled' : '') + ' onclick="labMoverMuestra(\'' + id + '\',-1)"><i class="fa-solid fa-arrow-up"></i></button>' +
          '<button type="button" class="lab-btn" title="Bajar" ' + (i === lista.length - 1 ? 'disabled' : '') + ' onclick="labMoverMuestra(\'' + id + '\',1)"><i class="fa-solid fa-arrow-down"></i></button>' +
          '<button type="button" class="lab-btn" title="Editar" onclick="labAbrirMuestra(\'' + id + '\')"><i class="fa-solid fa-pen"></i></button>' +
          '<button type="button" class="lab-btn lab-btn-borrar" title="Eliminar" onclick="labPedirEliminarMuestra(\'' + id + '\')"><i class="fa-solid fa-trash"></i></button>' +
        '</div></div>'
    }).join('') + '</div>'
  }
  cont.innerHTML = html
}

async function labMoverMuestra(id, dir) {
  if (!_labForm || !_labForm.item) return
  var matId = _labForm.item.id
  var lista = labMuestrasDe(matId)
  var i = lista.findIndex(function (m) { return String(m.id) === String(id) })
  var j = i + dir
  if (i < 0 || j < 0 || j >= lista.length) return
  var tmp = lista[i]; lista[i] = lista[j]; lista[j] = tmp
  lista.forEach(function (m, k) { m.orden = k + 1 })   // optimista
  labRenderMuestras()
  try {
    var r = await labPost('reordenarMuestrasLab', { material_id: matId, ids: lista.map(function (m) { return m.id }) })
    if (!r.ok) throw new Error(r.error || 'Error')
  } catch (e) {
    toast('❌ No se pudo guardar el orden', 'err')
    await cargarLaboratorio(); labRenderMuestras()
  }
}

// ── Modal de muestra ─────────────────────────────────────────

function labAbrirMuestra(id) {
  if (!_labForm || !_labForm.item) return
  var m = id ? _lab.muestras.filter(function (x) { return String(x.id) === String(id) })[0] : null
  _labMuestraForm = {
    item: m || null,
    material_id: _labForm.item.id,
    slots: LAB_CAMPOS_FOTO.map(function (c) {
      var url = m ? (m[c] || '') : ''
      return { origen: url ? c : null, url: url, nueva: null }
    })
  }
  document.getElementById('modalLabMuestraTitulo').textContent = m ? 'Editar muestra' : 'Nueva muestra'
  document.getElementById('modalLabMuestraBody').innerHTML =
    '<div class="mform-grupo"><label>Título de la muestra *</label>' +
      '<input id="labMTitulo" maxlength="150" value="' + labEsc(m ? m.titulo : '') + '" placeholder="Ej: Sobre gres, cocción 1240 °C"></div>' +
    '<div class="mform-grupo"><label>Descripción</label>' +
      '<textarea id="labMDescripcion" rows="3" maxlength="3000" placeholder="Qué se ve en esta prueba">' + labEsc(m ? m.descripcion : '') + '</textarea></div>' +
    '<div class="mform-grupo"><label>Condiciones de la prueba</label>' +
      '<textarea id="labMCondiciones" rows="3" maxlength="3000" placeholder="Superficie, temperatura, atmósfera…">' + labEsc(m ? m.condiciones : '') + '</textarea></div>' +
    '<div class="mform-grupo"><label>Forma de uso o aplicación</label>' +
      '<textarea id="labMAplicacion" rows="3" maxlength="3000" placeholder="Cómo se aplicó el material">' + labEsc(m ? m.aplicacion : '') + '</textarea></div>' +
    '<div class="mform-grupo"><label>Observaciones sobre el resultado</label>' +
      '<textarea id="labMObservaciones" rows="3" maxlength="3000" placeholder="Qué resultado se obtuvo">' + labEsc(m ? m.observaciones : '') + '</textarea></div>' +
    '<div class="mform-grupo"><label>Fotografías <small>(hasta 4 · la primera es la principal)</small></label>' +
      '<div class="lab-slots" id="labSlots"></div>' +
      '<input type="file" id="labSlotInput" accept="image/*" style="display:none" onchange="labSlotOnFoto(this)">' +
      '<div class="lab-hint" id="labSlotInfo">Se redimensionan y comprimen automáticamente. Se suben al guardar.</div></div>'
  labAbrirOverlay('modalLabMuestra')
  document.getElementById('modalLabMuestraBody').scrollTop = 0
  labRenderSlots()
}

function labCerrarMuestra() { labCerrar('modalLabMuestra'); _labMuestraForm = null }

function labRenderSlots() {
  var cont = document.getElementById('labSlots')
  if (!cont || !_labMuestraForm) return
  var slots = _labMuestraForm.slots
  cont.innerHTML = slots.map(function (s, i) {
    var src = s.nueva || s.url
    var lleno = !!src
    return '<div class="lab-slot' + (lleno ? ' lleno' : '') + '">' +
      '<div class="lab-slot-box" onclick="labSlotElegir(' + i + ')">' +
        (lleno ? '<img src="' + labEsc(src) + '" alt="Foto ' + (i + 1) + '">' : '<div class="lab-foto-vacia"><i class="fa-solid fa-plus"></i><span>Foto ' + (i + 1) + '</span></div>') +
        '<b>' + (i + 1) + '</b>' +
      '</div>' +
      (lleno
        ? '<div class="lab-slot-acc">' +
            '<button type="button" class="lab-btn" title="Mover antes" ' + (i === 0 ? 'disabled' : '') + ' onclick="labSlotMover(' + i + ',-1)"><i class="fa-solid fa-arrow-left"></i></button>' +
            '<button type="button" class="lab-btn" title="Mover después" ' + (i === slots.length - 1 ? 'disabled' : '') + ' onclick="labSlotMover(' + i + ',1)"><i class="fa-solid fa-arrow-right"></i></button>' +
            '<button type="button" class="lab-btn lab-btn-borrar" title="Quitar" onclick="labSlotQuitar(' + i + ')"><i class="fa-solid fa-xmark"></i></button>' +
          '</div>'
        : '') +
    '</div>'
  }).join('')
}

function labSlotElegir(i) {
  _labSlotActivo = i
  document.getElementById('labSlotInput').click()
}

async function labSlotOnFoto(input) {
  var file = input.files && input.files[0]
  input.value = ''
  if (!file || !_labMuestraForm) return
  if (!/^image\//.test(file.type)) { toast('Elegí un archivo de imagen', 'err'); return }
  var info = document.getElementById('labSlotInfo')
  info.textContent = 'Procesando imagen…'
  try {
    var r = await labPrepararImagen(file, 1600, 0.82)
    var slot = _labMuestraForm.slots[_labSlotActivo]
    slot.nueva = r.dataUrl          // reemplaza (o crea) la foto de esa posición
    info.textContent = 'Foto ' + (_labSlotActivo + 1) + ': ' + r.w + '×' + r.h + ' px · ' + r.kb + ' KB (se sube al guardar).'
    labRenderSlots()
  } catch (e) {
    info.textContent = 'No se pudo procesar esa imagen. Probá con otra.'
    toast('❌ No se pudo leer la imagen', 'err')
  }
}

function labSlotMover(i, dir) {
  var s = _labMuestraForm.slots, j = i + dir
  if (j < 0 || j >= s.length) return
  var t = s[i]; s[i] = s[j]; s[j] = t
  labRenderSlots()
}

function labSlotQuitar(i) {
  _labMuestraForm.slots[i] = { origen: null, url: '', nueva: null }
  labRenderSlots()
}

async function labGuardarMuestra() {
  if (!_labMuestraForm) return
  var f = _labMuestraForm
  var titulo = document.getElementById('labMTitulo').value.trim()
  if (!titulo) { toast('El título es obligatorio', 'err'); document.getElementById('labMTitulo').focus(); return }

  var fila = {
    material_id: f.material_id,
    titulo: titulo,
    descripcion: document.getElementById('labMDescripcion').value,
    condiciones: document.getElementById('labMCondiciones').value,
    aplicacion: document.getElementById('labMAplicacion').value,
    observaciones: document.getElementById('labMObservaciones').value
  }
  // Orden final de fotos: cada posición toma el campo de origen de su foto;
  // las posiciones vacías o nuevas reciben los campos sobrantes (se limpian/reemplazan después).
  var ord = null
  if (f.item) {
    fila.id = f.item.id
    var usados = f.slots.map(function (s) { return s.origen }).filter(Boolean)
    var sobrantes = LAB_CAMPOS_FOTO.filter(function (c) { return usados.indexOf(c) < 0 })
    ord = f.slots.map(function (s) { return s.origen || sobrantes.shift() })
    fila.fotos_orden = ord
  }

  var btn = document.getElementById('btnLabGuardarMuestra')
  var htmlBtn = btn.innerHTML
  btn.disabled = true
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...'
  var fallos = 0

  try {
    var r = await labPost('guardarMuestraLab', { fila: fila })
    if (!r.ok) { toast('❌ ' + (r.error || 'Error al guardar'), 'err'); return }

    var total = f.slots.filter(function (s) { return s.nueva }).length, hechas = 0
    for (var i = 0; i < f.slots.length; i++) {
      var campo = LAB_CAMPOS_FOTO[i], slot = f.slots[i]
      if (slot.nueva) {
        hechas++
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo foto ' + hechas + ' de ' + total + '...'
        var rf = await labPost('subirFotoLab', {
          hoja: 'laboratorio_muestras', id: r.id, campo: campo, b64: slot.nueva,
          nombre: 'muestra_' + r.id + '_' + (i + 1) + '_' + Date.now()
        })
        if (!rf.ok) fallos++
      } else if (!slot.origen && f.item && f.item[ord[i]]) {
        // posición vacía que, tras reordenar, heredó una foto descartada: se borra
        var rq = await labPost('quitarFotoLab', { hoja: 'laboratorio_muestras', id: r.id, campo: campo })
        if (!rq.ok) fallos++
      }
    }

    labCerrarMuestra()
    var matId = _labForm && _labForm.item && _labForm.item.id
    await cargarLaboratorio()
    if (_labForm && matId) _labForm.item = labBuscar(matId)
    labRenderMuestras()
    toast(fallos ? '⚠️ Muestra guardada, pero ' + fallos + (fallos === 1 ? ' foto falló' : ' fotos fallaron') : '✅ Muestra guardada', fallos ? 'err' : 'ok')
  } catch (e) {
    toast('❌ Error de conexión', 'err')
  } finally {
    btn.disabled = false
    btn.innerHTML = htmlBtn
  }
}

// ── Eliminar muestra ─────────────────────────────────────────

function labPedirEliminarMuestra(id) {
  var m = _lab.muestras.filter(function (x) { return String(x.id) === String(id) })[0]
  if (!m) return
  _labMuestraEliminando = m
  document.getElementById('labMEliminarTxt').innerHTML = 'Vas a eliminar la muestra «<b>' + labEsc(m.titulo) + '</b>». ¿Qué hacemos con sus fotos?'
  labAbrirOverlay('modalLabMuestraEliminar')
}

async function labConfirmarEliminarMuestra(borrarDrive) {
  var m = _labMuestraEliminando
  if (!m) return
  labCerrar('modalLabMuestraEliminar')
  try {
    var r = await labPost('eliminarMuestraLab', { id: m.id, borrarDrive: !!borrarDrive })
    if (!r.ok) { toast('❌ ' + (r.error || 'No se pudo eliminar'), 'err'); return }
    _labMuestraEliminando = null
    var matId = _labForm && _labForm.item && _labForm.item.id
    await cargarLaboratorio()
    if (_labForm && matId) _labForm.item = labBuscar(matId)
    labRenderMuestras()
    toast('✅ Muestra eliminada', 'ok')
  } catch (e) { toast('❌ Error de conexión', 'err') }
}

// ── Insertar fotos de la ficha dentro de «Formas de uso» ─────

function labFotosDisponibles() {
  var out = []
  var item = _labForm && _labForm.item
  if (!item) return out
  if (item.foto) out.push({ url: item.foto, nombre: 'Foto principal' })
  labMuestrasDe(item.id).forEach(function (m) {
    labFotosDe(m).forEach(function (u, i) { out.push({ url: u, nombre: m.titulo + (i ? ' (foto ' + (i + 1) + ')' : '') }) })
  })
  return out
}

function labMdImagen() {
  if (!_labForm || !_labForm.item) { toast('Guardá la ficha y subí fotos primero', 'err'); return }
  var fotos = labFotosDisponibles()
  if (!fotos.length) { toast('Esta ficha todavía no tiene fotos subidas', 'err'); return }
  document.getElementById('modalLabImgBody').innerHTML =
    '<div class="lab-hint">Tocá una foto para insertarla en el texto. El pie de foto se puede editar.</div>' +
    '<div class="lab-picker">' + fotos.map(function (f, i) {
      return '<button type="button" class="lab-picker-item" onclick="labMdInsertarImg(' + i + ')">' +
        '<img src="' + labEsc(f.url) + '" alt="" loading="lazy"><span>' + labEsc(f.nombre) + '</span></button>'
    }).join('') + '</div>'
  _labFotosPicker = fotos
  labAbrirOverlay('modalLabImg')
}
var _labFotosPicker = []

function labMdInsertarImg(i) {
  var f = _labFotosPicker[i]
  if (!f) return
  var ta = document.getElementById('labUso')
  if (ta.style.display === 'none') labMdVista('escribir')
  var url = f.url.replace(/=w\d+$/, '') + '=w1000'
  var texto = '\n\n![' + f.nombre.replace(/[\[\]\n]/g, ' ') + '](' + url + ')\n\n'
  var pos = ta.selectionEnd == null ? ta.value.length : ta.selectionEnd
  ta.value = ta.value.substring(0, pos) + texto + ta.value.substring(pos)
  ta.focus(); ta.setSelectionRange(pos + texto.length, pos + texto.length)
  labContarUso()
  labCerrar('modalLabImg')
  labTab('uso')
}
