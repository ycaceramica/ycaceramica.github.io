// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────

const API = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'

// ─────────────────────────────────────────────
// MODO OSCURO
// ─────────────────────────────────────────────

function aplicarModoOscuro(){
  if(localStorage.getItem('dark') === 'true') document.body.classList.add('dark')
  actualizarIconoDark()
}

function toggleDark(){
  document.body.classList.toggle('dark')
  localStorage.setItem('dark', document.body.classList.contains('dark'))
  actualizarIconoDark()
}

function actualizarIconoDark(){
  const btn = document.getElementById('btnDark')
  if(btn) btn.innerText = document.body.classList.contains('dark') ? '☀️' : '🌙'
}

aplicarModoOscuro()

// ─────────────────────────────────────────────
// SESIÓN
// ─────────────────────────────────────────────

function getSesion(){
  try { return JSON.parse(sessionStorage.getItem('yca_sesion')) }
  catch(e) { return null }
}

window.addEventListener('DOMContentLoaded', () => {
  const sesion = getSesion()
  if(!sesion || sesion.rol !== 'admin'){
    window.location.href = '../login/index.html'
    return
  }
  cargarSeccion('piezas')
  cargarInventarios()
  // Precargar cursos para usarlos en modales de apuntes y usuarios
  cargarCursosSilencioso()
})

function cerrarSesion(){
  sessionStorage.removeItem('yca_sesion')
  window.location.href = '../login/index.html'
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────

function toggleSidebar(){
  const sidebar = document.getElementById('adminSidebar')
  const overlay = document.getElementById('sidebarOverlay')
  const abierto = sidebar.classList.toggle('abierto')
  overlay.classList.toggle('activo', abierto)
  document.body.style.overflow = abierto ? 'hidden' : ''
}

function cerrarSidebar(){
  document.getElementById('adminSidebar').classList.remove('abierto')
  document.getElementById('sidebarOverlay').classList.remove('activo')
  document.body.style.overflow = ''
}

// Precarga silenciosa de cursos al iniciar
async function cargarCursosSilencioso(){
  if(cursosData.length > 0) return
  try {
    const sesion = getSesion()
    const res    = await fetch(`${API}?action=getCursosAdmin&token=${encodeURIComponent(sesion.token)}`)
    const data   = await res.json()
    cursosData   = data.data || []
  } catch(e) {}
}

// ─────────────────────────────────────────────
// SECCIONES
// ─────────────────────────────────────────────

let seccionActual = 'piezas'

function setSeccion(nombre){
  document.querySelectorAll('.seccion').forEach(s => s.style.display = 'none')
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('activo'))
  document.getElementById('seccion-' + nombre).style.display = 'block'
  document.getElementById('nav-' + nombre).classList.add('activo')
  seccionActual = nombre
  cerrarSidebar()
  cargarSeccion(nombre)
}

// ─────────────────────────────────────────────
// CACHÉ Y CARGA DE DATOS
// ─────────────────────────────────────────────

const cache = {}

function limpiarCache(){
  Object.keys(cache).forEach(k => delete cache[k])
  cargarSeccion(seccionActual)
  toast('🔄 Datos actualizados', 'ok')
}

async function cargarSeccion(nombre){
  if(nombre === 'usuarios')   { await cargarUsuarios();   return }
  if(nombre === 'cursos')     { await cargarCursos();     return }
  if(nombre === 'galeria')    { await cargarGaleria();    return }
  if(nombre === 'multimedia') { await cargarMultimedia(); return }

  const grid    = document.getElementById('grid-' + nombre)
  const loading = document.getElementById('loading-' + nombre)

  if(cache[nombre]){
    renderGrid(nombre, cache[nombre])
    armarFiltrosAdmin(nombre, cache[nombre])
    return
  }

  loading.style.display = 'block'
  grid.innerHTML = ''

  try {
    const sesion = getSesion()
    const res    = await fetch(`${API}?action=getAll&hoja=${nombre}&token=${encodeURIComponent(sesion.token)}`)
    const data   = await res.json()
    cache[nombre] = data.data || []
    renderGrid(nombre, cache[nombre])
    armarFiltrosAdmin(nombre, cache[nombre])
  } catch(e) {
    grid.innerHTML = '<p style="opacity:0.5;padding:20px;grid-column:1/-1">Error al cargar. Revisá tu conexión.</p>'
  }
  loading.style.display = 'none'
}

// ─────────────────────────────────────────────
// FILTROS Y BÚSQUEDA
// ─────────────────────────────────────────────

// Estado de filtros por hoja
const filtroActivo = {}

function armarFiltrosAdmin(hoja, items){
  const contenedor = document.getElementById('filtros-' + hoja)
  if(!contenedor) return

  // Obtener categorías únicas
  const cats = ['Todos', ...new Set(items.map(i => i.categoria).filter(Boolean))]

  contenedor.innerHTML = ''
  filtroActivo[hoja] = 'Todos'

  cats.forEach(cat => {
    const btn = document.createElement('button')
    btn.className = 'admin-filtro-btn' + (cat === 'Todos' ? ' activo' : '')
    btn.innerText = cat
    btn.onclick = () => {
      filtroActivo[hoja] = cat
      contenedor.querySelectorAll('.admin-filtro-btn').forEach(b => b.classList.remove('activo'))
      btn.classList.add('activo')
      filtrarGrid(hoja)
    }
    contenedor.appendChild(btn)
  })
}

function filtrarGrid(hoja){
  const busqueda = (document.getElementById('buscar-' + hoja)?.value || '').toLowerCase().trim()
  const catActiva = filtroActivo[hoja] || 'Todos'
  const cards     = document.querySelectorAll(`#grid-${hoja} .item-card`)
  let visibles    = 0

  cards.forEach(card => {
    const nombre    = (card.querySelector('.item-card-nombre')?.innerText || '').toLowerCase()
    const categoria = (card.querySelector('.item-card-cat')?.innerText || '')
    const codigo    = (card.querySelector('.item-card-codigo')?.innerText || '').toLowerCase()

    const matchCat    = catActiva === 'Todos' || categoria === catActiva
    const matchBuscar = !busqueda || nombre.includes(busqueda) || codigo.includes(busqueda)
    const mostrar     = matchCat && matchBuscar

    card.style.display = mostrar ? 'flex' : 'none'
    if(mostrar) visibles++
  })

  // Mostrar mensaje si no hay resultados
  let sinRes = document.querySelector(`#grid-${hoja} .sin-resultados-admin`)
  if(visibles === 0){
    if(!sinRes){
      sinRes = document.createElement('div')
      sinRes.className = 'vacio sin-resultados-admin'
      sinRes.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i><p>No hay items que coincidan</p>`
      document.getElementById('grid-' + hoja).appendChild(sinRes)
    }
    sinRes.style.display = 'flex'
  } else if(sinRes){
    sinRes.style.display = 'none'
  }
}

// ─────────────────────────────────────────────
// RENDER GRID — actualizado con filtros
// ─────────────────────────────────────────────

function renderGrid(hoja, items){
  const grid = document.getElementById('grid-' + hoja)
  grid.innerHTML = ''

  if(!items || items.length === 0){
    grid.innerHTML = `
      <div class="vacio">
        <i class="fa-solid fa-box-open"></i>
        <p>No hay items todavía. ¡Agregá el primero!</p>
      </div>`
    return
  }

  items.forEach(item => {
    const publicado = item.publicado === true || item.publicado === 'TRUE' || item.publicado === 'true'
    const icono     = hoja === 'insumos' ? 'fa-flask' : hoja === 'moldes' ? 'fa-layer-group' : hoja === 'apuntes' ? 'fa-book-open' : 'fa-jar'
    const esMolde   = hoja === 'moldes'
    const esApunte  = hoja === 'apuntes'
    const mostrarPub = !esMolde
    const card = document.createElement('div')
    card.className = 'item-card'
    card.innerHTML = `
      <div class="item-card-img">
        ${item.foto
          ? `<img src="${item.foto}" alt="${item.nombre || ''}" loading="lazy">`
          : `<div class="item-card-img-placeholder"><i class="fa-solid ${icono}"></i></div>`
        }
        ${!esApunte ? `
        <button class="item-card-foto-btn" onclick="subirFotoItem('${hoja}','${item.id}','${item.codigo || item.id}')">
          <i class="fa-solid fa-camera"></i> ${item.foto ? 'Cambiar foto' : 'Agregar foto'}
        </button>
        ${!item.foto ? `<span class="item-card-foto-hint">📐 Usá foto cuadrada (1:1)</span>` : ''}
        ` : ''}
      </div>
      <div class="item-card-body">
        <div class="item-card-codigo">${item.codigo || (esApunte ? item.curso || '' : '')}</div>
        <div class="item-card-nombre">${item.nombre || item.titulo || ''}</div>
        <div class="item-card-cat">${item.categoria || ''}</div>
        <div class="item-card-acciones">
          <button class="btn-editar" onclick='editarItem("${hoja}", ${JSON.stringify(item).replace(/'/g,"&#39;").replace(/"/g,'&quot;')})'>
            <i class="fa-solid fa-pen"></i> Editar
          </button>
          ${mostrarPub ? `
          <button class="btn-toggle-pub ${publicado ? 'publicado' : ''}"
            onclick="togglePublicado('${hoja}','${item.id}',${publicado})"
            title="${publicado ? 'Visible — clic para ocultar' : 'Oculto — clic para publicar'}">
            <i class="fa-solid ${publicado ? 'fa-eye' : 'fa-eye-slash'}"></i>
            ${publicado ? 'Visible' : 'Oculto'}
          </button>` : ''}
          <button class="btn-borrar" onclick="borrarItem('${hoja}','${item.id}')" title="Eliminar">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `
    grid.appendChild(card)
  })
}

// ─────────────────────────────────────────────
// CATEGORÍAS
// ─────────────────────────────────────────────

const CATEGORIAS = {
  piezas:  ['Vasijas','Tazas','Platos','Decorativos','Macetas','Otros'],
  insumos: ['Arcillas','Engobes','Esmaltes','Óxidos','Herramientas','Otros'],
  moldes:  ['Decorativos','Macetas','Tazas / Vasos / Jarras','Platos / Bandejas','Otros'],
  apuntes: ['Taller de Cerámica Inicial','General']
}

// ─────────────────────────────────────────────
// FOTO EN MODAL
// ─────────────────────────────────────────────

let fotoModalBase64 = null
let fotoModalNombre = null

function elegirFotoModal(){
  document.getElementById('inputFotoModal').click()
}

function previsualizarFoto(e){
  const file = e.target.files[0]
  if(!file) return

  fotoModalNombre = file.name.split('.')[0]

  const reader = new FileReader()
  reader.onload = (ev) => {
    fotoModalBase64 = ev.target.result

    // Actualizar previsualización en modal
    const area = document.getElementById('mFotoArea')
    if(area){
      area.innerHTML = `
        <img class="mform-foto-preview" src="${fotoModalBase64}" alt="Preview">
        <button class="mform-foto-cambiar" onclick="elegirFotoModal()" type="button">
          <i class="fa-solid fa-camera"></i> Cambiar
        </button>
      `
    }
  }
  reader.readAsDataURL(file)
}

// ─────────────────────────────────────────────
// MODAL — ABRIR
// ─────────────────────────────────────────────

let modalHoja = ''
let modalItem = null

function abrirModal(hoja, item = null){
  modalHoja        = hoja
  modalItem        = item
  fotoModalBase64  = null
  fotoModalNombre  = null

  const esApuntes = hoja === 'apuntes'
  const esMoldes  = hoja === 'moldes'
  const esPiezas  = hoja === 'piezas'
  const esInsumos = hoja === 'insumos'

  document.getElementById('modalTitulo').innerText = item
    ? `Editar ${esApuntes ? 'apunte' : hoja.slice(0,-1)}`
    : `Nuevo ${esApuntes ? 'apunte' : hoja.slice(0,-1)}`

  const cats   = CATEGORIAS[hoja] || []
  const opsCat = cats.map(c =>
    `<option value="${c}" ${item?.categoria === c || item?.curso === c ? 'selected' : ''}>${c}</option>`
  ).join('')

  // Foto actual si existe
  const fotoActual = item?.foto || ''
  const bloqFoto = !esApuntes ? `
    <div class="mform-grupo">
      <label>📷 Foto <small style="opacity:0.5;font-weight:400">(cuadrada 1:1 para verse mejor)</small></label>
      <div class="mform-foto-area" id="mFotoArea" onclick="elegirFotoModal()">
        ${fotoActual
          ? `<img class="mform-foto-preview" src="${fotoActual}" alt="Foto actual">
             <button class="mform-foto-cambiar" onclick="elegirFotoModal()" type="button">
               <i class="fa-solid fa-camera"></i> Cambiar
             </button>`
          : `<div class="mform-foto-placeholder">
               <i class="fa-solid fa-camera"></i>
               <strong>Tocá para agregar foto</strong>
               <small>Recomendado: formato cuadrado (1:1)</small>
             </div>`
        }
      </div>
    </div>
  ` : ''

  let html = bloqFoto

  if(esApuntes){
    // Cursos dinámicos desde Sheets
    const cursosOps = cursosData.length > 0
      ? cursosData.map(c => `<option value="${c.hojaId}" ${item?.curso === c.hojaId ? 'selected' : ''}>${c.nombre}</option>`).join('')
      : cats.map(c => `<option value="${c}" ${item?.curso === c ? 'selected' : ''}>${c}</option>`).join('')

    html = `
      <div class="mform-grupo">
        <label>Título *</label>
        <input id="mTitulo" value="${item?.titulo || ''}" placeholder="Título del apunte">
      </div>
      <div class="mform-grupo">
        <label>Curso</label>
        <select id="mCategoria">
          <option value="">Seleccioná</option>
          ${cursosOps}
          <option value="General" ${item?.curso === 'General' ? 'selected' : ''}>General (todos los alumnos)</option>
        </select>
      </div>
      <div class="mform-grupo">
        <label>Contenido</label>
        <textarea id="mContenido" rows="5" placeholder="Escribí el contenido...">${item?.contenido || ''}</textarea>
      </div>
      <div class="mform-grupo">
        <label>URL de archivo (PDF, video, etc.)</label>
        <input id="mArchivoUrl" value="${item?.archivoUrl || ''}" placeholder="https://...">
      </div>
      <label class="publicado-toggle">
        <input type="checkbox" id="mPublicado" ${(item?.publicado === true || item?.publicado === 'TRUE' || item?.publicado === 'true') ? 'checked' : ''}>
        <span>✅ Visible para los alumnos</span>
      </label>
    `
  } else {
    html += `
      <div class="mform-fila">
        <div class="mform-grupo">
          <label>Categoría *</label>
          <select id="mCategoria" onchange="generarCodigo()">${opsCat}</select>
        </div>
        <div class="mform-grupo">
          <label>Código</label>
          <div class="mform-codigo-wrapper">
            <input id="mCodigo" value="${item?.codigo || ''}" placeholder="Auto">
            <button class="btn-generar-codigo" onclick="generarCodigo()" type="button">↺ Auto</button>
          </div>
        </div>
      </div>
      <div class="mform-grupo">
        <label>Nombre *</label>
        <input id="mNombre" value="${item?.nombre || ''}" placeholder="Nombre del ítem">
      </div>
      <div class="mform-grupo">
        <label>Descripción</label>
        <textarea id="mDescripcion" rows="2" placeholder="Descripción...">${item?.descripcion || ''}</textarea>
      </div>
    `

    if(esPiezas || esInsumos){
      html += `
        <div class="mform-fila">
          <div class="mform-grupo">
            <label>${esInsumos ? 'Tipo / Variedad' : 'Técnica'}</label>
            <input id="mTipo" value="${item?.tipo || item?.tecnica || ''}" placeholder="${esInsumos ? 'Tipo...' : 'Técnica...'}">
          </div>
          <div class="mform-grupo">
            <label>Precio (solo admin)</label>
            <input id="mPrecio" type="number" value="${item?.precio || ''}" placeholder="$0">
          </div>
        </div>
        <div class="mform-fila">
          <div class="mform-grupo">
            <label>Cantidad en stock</label>
            <input id="mCantidad" type="number" value="${item?.cantidad || ''}" placeholder="0">
          </div>
          ${esInsumos ? `
          <div class="mform-grupo">
            <label>Unidad</label>
            <input id="mUnidad" value="${item?.unidad || ''}" placeholder="kg, litros, unidades...">
          </div>` : `
          <div class="mform-grupo">
            <label>Medidas</label>
            <input id="mMedidas" value="${item?.medidas || ''}" placeholder="10x10cm...">
          </div>`}
        </div>
        ${esInsumos ? `
        <div class="mform-grupo">
          <label>Temperatura</label>
          <input id="mTemperatura" value="${item?.temperatura || ''}" placeholder="°C">
        </div>` : `
        <div class="mform-grupo">
          <label>Esmalte</label>
          <input id="mEsmalte" value="${item?.esmalte || ''}" placeholder="Tipo de esmalte...">
        </div>`}
        <label class="publicado-toggle">
          <input type="checkbox" id="mPublicado" ${(item?.publicado === true || item?.publicado === 'TRUE' || item?.publicado === 'true') ? 'checked' : ''}>
          <span>✅ Publicar en la web pública</span>
        </label>
      `
    }

    if(esMoldes){
      html += `
        <div class="mform-fila">
          <div class="mform-grupo">
            <label>Cantidad</label>
            <input id="mCantidad" type="number" value="${item?.cantidad || ''}" placeholder="0">
          </div>
          <div class="mform-grupo">
            <label>Material</label>
            <input id="mMaterial" value="${item?.material || ''}" placeholder="Yeso, silicona...">
          </div>
        </div>
        <div class="mform-grupo">
          <label>Dimensiones</label>
          <input id="mDimensiones" value="${item?.dimensiones || ''}" placeholder="Ej: 20x15cm">
        </div>
        <div class="mform-grupo">
          <label>Notas internas</label>
          <textarea id="mNotas" rows="2" placeholder="Notas...">${item?.notas || ''}</textarea>
        </div>
      `
    }
  }

  document.getElementById('modalBody').innerHTML = html
  document.getElementById('modalOverlay').style.display = 'flex'

  if(!item && !esApuntes) setTimeout(() => generarCodigo(), 100)
}

function editarItem(hoja, item){
  abrirModal(hoja, item)
}

function cerrarModal(e){
  if(e && e.target !== document.getElementById('modalOverlay')) return
  document.getElementById('modalOverlay').style.display = 'none'
  fotoModalBase64 = null
  fotoModalNombre = null
  modalHoja = ''
  modalItem = null
}

// ─────────────────────────────────────────────
// CÓDIGO AUTOMÁTICO
// ─────────────────────────────────────────────

async function generarCodigo(){
  const catEl = document.getElementById('mCategoria')
  const codEl = document.getElementById('mCodigo')
  if(!catEl || !codEl) return
  const cat = catEl.value
  if(!cat) return

  try {
    const sesion = getSesion()
    const res  = await fetch(`${API}?action=siguienteCodigo&hoja=${modalHoja}&categoria=${encodeURIComponent(cat)}&token=${encodeURIComponent(sesion.token)}`)
    const data = await res.json()
    if(data.codigo) codEl.value = data.codigo
  } catch(e) {}
}

// ─────────────────────────────────────────────
// GUARDAR MODAL
// ─────────────────────────────────────────────

async function guardarModal(){
  const btn = document.getElementById('btnGuardarModal')
  btn.classList.add('cargando')
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...'

  try {
    const sesion = getSesion()
    const fila   = construirFila()
    if(!fila){ btn.classList.remove('cargando'); btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar'; return }

    // 1. Guardar datos
    const res  = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'guardar', hoja: modalHoja, fila, token: sesion.token })
    })
    const data = await res.json()

    if(!data.ok){ toast('❌ ' + (data.error || 'Error al guardar'), 'err'); btn.classList.remove('cargando'); btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar'; return }

    // 2. Si hay foto nueva, subirla
    if(fotoModalBase64 && modalHoja !== 'apuntes'){
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo foto...'
      const nombre = (fila.codigo || fila.id) + '_' + Date.now()
      const resF = await fetch(API, {
        method: 'POST',
        body: JSON.stringify({ action: 'subirFoto', hoja: modalHoja, id: fila.id, b64: fotoModalBase64, nombre, token: sesion.token })
      })
      const dataF = await resF.json()
      if(!dataF.ok) toast('⚠️ Item guardado pero hubo un error al subir la foto', 'err')
    }

    delete cache[modalHoja]
    cerrarModal()
    await cargarSeccion(modalHoja)
    toast('✅ Guardado correctamente', 'ok')

  } catch(e) {
    toast('❌ Error de conexión', 'err')
  }

  btn.classList.remove('cargando')
  btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar'
}

function construirFila(){
  const id  = modalItem?.id || (modalHoja.toUpperCase().slice(0,3) + '-' + Date.now())
  const hoja = modalHoja

  if(hoja === 'apuntes'){
    const titulo = document.getElementById('mTitulo')?.value.trim()
    if(!titulo){ toast('El título es obligatorio', 'err'); return null }
    return {
      id,
      titulo,
      curso:      document.getElementById('mCategoria')?.value || '',
      contenido:  document.getElementById('mContenido')?.value.trim() || '',
      archivoUrl: document.getElementById('mArchivoUrl')?.value.trim() || '',
      publicado:  document.getElementById('mPublicado')?.checked ? 'true' : 'false',
      creadoEn:   modalItem?.creadoEn || new Date().toLocaleDateString('es-AR')
    }
  }

  const nombre = document.getElementById('mNombre')?.value.trim()
  if(!nombre){ toast('El nombre es obligatorio', 'err'); return null }

  const base = {
    id,
    codigo:      document.getElementById('mCodigo')?.value.trim() || '',
    nombre,
    categoria:   document.getElementById('mCategoria')?.value || '',
    descripcion: document.getElementById('mDescripcion')?.value.trim() || '',
    foto:        modalItem?.foto || '',
    creadoEn:    modalItem?.creadoEn || new Date().toLocaleDateString('es-AR')
  }

  if(hoja === 'piezas') return { ...base,
    tecnica:   document.getElementById('mTipo')?.value.trim() || '',
    precio:    document.getElementById('mPrecio')?.value || '',
    cantidad:  document.getElementById('mCantidad')?.value || '',
    medidas:   document.getElementById('mMedidas')?.value.trim() || '',
    esmalte:   document.getElementById('mEsmalte')?.value.trim() || '',
    publicado: document.getElementById('mPublicado')?.checked ? 'true' : 'false'
  }

  if(hoja === 'insumos') return { ...base,
    tipo:        document.getElementById('mTipo')?.value.trim() || '',
    precio:      document.getElementById('mPrecio')?.value || '',
    cantidad:    document.getElementById('mCantidad')?.value || '',
    unidad:      document.getElementById('mUnidad')?.value.trim() || '',
    temperatura: document.getElementById('mTemperatura')?.value.trim() || '',
    publicado:   document.getElementById('mPublicado')?.checked ? 'true' : 'false'
  }

  if(hoja === 'moldes') return { ...base,
    cantidad:    document.getElementById('mCantidad')?.value || '',
    material:    document.getElementById('mMaterial')?.value.trim() || '',
    dimensiones: document.getElementById('mDimensiones')?.value.trim() || '',
    notas:       document.getElementById('mNotas')?.value.trim() || ''
  }

  return base
}

// ─────────────────────────────────────────────
// SUBIR FOTO DESDE TARJETA
// ─────────────────────────────────────────────

function subirFotoItem(hoja, id, nombre){
  const input = document.createElement('input')
  input.type  = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if(!file) return
    toast('⏳ Subiendo foto...', '')
    const b64 = await fileToBase64(file)
    try {
      const sesion = getSesion()
      const res  = await fetch(API, {
        method: 'POST',
        body: JSON.stringify({ action: 'subirFoto', hoja, id, b64, nombre: nombre + '_' + Date.now(), token: sesion.token })
      })
      const data = await res.json()
      if(data.ok){ delete cache[hoja]; await cargarSeccion(hoja); toast('✅ Foto actualizada', 'ok') }
      else toast('❌ Error al subir foto', 'err')
    } catch(e) { toast('❌ Error de conexión', 'err') }
  }
  input.click()
}

function fileToBase64(file){
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.readAsDataURL(file)
  })
}

// ─────────────────────────────────────────────
// TOGGLE PUBLICADO
// ─────────────────────────────────────────────

async function togglePublicado(hoja, id, publicadoActual){
  const nuevoValor = publicadoActual ? 'false' : 'true'
  try {
    const sesion = getSesion()
    const res  = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'actualizarCampo', hoja, id, campo: 'publicado', valor: nuevoValor, token: sesion.token })
    })
    const data = await res.json()
    if(data.ok){
      delete cache[hoja]
      await cargarSeccion(hoja)
      toast(nuevoValor === 'true' ? '✅ Publicado en la web' : '👁 Ocultado de la web', 'ok')
    }
  } catch(e) { toast('❌ Error', 'err') }
}

// ─────────────────────────────────────────────
// BORRAR
// ─────────────────────────────────────────────

async function borrarItem(hoja, id){
  if(!confirm('¿Seguro que querés eliminar este ítem? No se puede deshacer.')) return
  try {
    const sesion = getSesion()
    const res  = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'eliminar', hoja, id, token: sesion.token })
    })
    const data = await res.json()
    if(data.ok){ delete cache[hoja]; await cargarSeccion(hoja); toast('🗑 Eliminado', 'ok') }
  } catch(e) { toast('❌ Error', 'err') }
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function formatearFecha(str){
  if(!str) return ''
  // Si es fecha ISO (2026-03-14T03:00:00.000Z)
  if(String(str).includes('T')){
    const d = new Date(str)
    return d.toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' })
  }
  return str
}

// ─────────────────────────────────────────────
// USUARIOS
// ─────────────────────────────────────────────

let tabUsuarioActual = 'pendientes'
let usuariosData     = []

async function cargarUsuarios(){
  document.getElementById('loading-usuarios').style.display = 'block'
  try {
    const sesion = getSesion()

    // Cargar cursos y usuarios en paralelo
    const [resUsuarios, resCursos] = await Promise.all([
      fetch(`${API}?action=getUsuarios&token=${encodeURIComponent(sesion.token)}`),
      cursosData.length > 0
        ? Promise.resolve({ json: () => ({ data: cursosData }) })
        : fetch(`${API}?action=getCursosAdmin&token=${encodeURIComponent(sesion.token)}`)
    ])

    const dataUsuarios = await resUsuarios.json()
    usuariosData = dataUsuarios.data || []

    if(cursosData.length === 0){
      const dataCursos = await resCursos.json()
      cursosData = dataCursos.data || []
    }

    renderUsuarios()
  } catch(e) { toast('❌ Error al cargar usuarios', 'err') }
  document.getElementById('loading-usuarios').style.display = 'none'
}

function toggleCursoSelector(userId){
  const sel = document.getElementById('cselector-' + userId)
  sel.style.display = sel.style.display === 'none' ? 'flex' : 'none'
}

async function asignarCurso(userId){
  const checks     = document.querySelectorAll(`#cchecks-${userId} input[type="checkbox"]:checked`)
  const cursosSeleccionados = Array.from(checks).map(c => c.value).join(',')

  try {
    const sesion = getSesion()
    const res    = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({
        action: 'actualizarCampo',
        hoja:   'usuarios',
        id:     userId,
        campo:  'curso',
        valor:  cursosSeleccionados,
        token:  sesion.token
      })
    })
    const data = await res.json()
    if(data.ok){
      const u = usuariosData.find(u => u.id === userId)
      if(u) u.curso = cursosSeleccionados
      renderUsuarios()
      const nombres = cursosSeleccionados
        ? cursosSeleccionados.split(',').map(c => {
            const obj = cursosData.find(x => x.hojaId === c.trim())
            return obj ? obj.nombre : c
          }).join(', ')
        : 'Sin curso'
      toast(`✅ Cursos actualizados: ${nombres}`, 'ok')
    }
  } catch(e) { toast('❌ Error', 'err') }
}

function setUsuarioTab(tab){
  tabUsuarioActual = tab
  document.querySelectorAll('.utab').forEach(b => b.classList.remove('activo'))
  document.getElementById('utab-' + tab).classList.add('activo')
  renderUsuarios()
}

function renderUsuarios(){
  const lista      = document.getElementById('lista-usuarios')
  const pendientes = usuariosData.filter(u => u.estado === 'pendiente')
  const activos    = usuariosData.filter(u => u.estado === 'activo')
  const rechazados = usuariosData.filter(u => u.estado === 'rechazado' || u.estado === 'pausado')

  document.getElementById('cnt-pendientes').innerText = pendientes.length
  document.getElementById('cnt-activos').innerText    = activos.length
  document.getElementById('cnt-rechazados').innerText = rechazados.length

  const badge = document.getElementById('badgePendientes')
  badge.style.display = pendientes.length > 0 ? 'inline' : 'none'
  badge.innerText = pendientes.length

  lista.innerHTML = ''
  const filtrados = tabUsuarioActual === 'pendientes' ? pendientes
                  : tabUsuarioActual === 'activos'    ? activos : rechazados

  if(filtrados.length === 0){
    lista.innerHTML = `<div class="vacio"><i class="fa-solid fa-users"></i><p>No hay usuarios en esta categoría</p></div>`
    return
  }

  filtrados.forEach(u => {
    const inicial    = (u.nombre || '?')[0].toUpperCase()
    const fecha      = formatearFecha(u.fechaRegistro)
    const cursoActual = u.curso || ''

    // Buscar nombre real del curso
    const cursoObj   = cursosData.find(c => c.hojaId === cursoActual || c.id === cursoActual)
    const cursoNombre = cursoObj ? cursoObj.nombre : (cursoActual || 'Sin curso')

    const card = document.createElement('div')
    card.className = 'usuario-card'
    card.id = 'ucard-' + u.id

    let botones = `<span class="estado-badge ${u.estado}">${u.estado}</span>`

    if(u.estado === 'pendiente'){
      botones += `
        <button class="btn-aprobar"  onclick="gestionarUsuario('${u.id}','aprobar')"><i class="fa-solid fa-check"></i> Aprobar</button>
        <button class="btn-rechazar" onclick="gestionarUsuario('${u.id}','rechazar')"><i class="fa-solid fa-xmark"></i> Rechazar</button>
        <button class="btn-eliminar-usr" onclick="eliminarUsuario('${u.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
      `
    } else if(u.estado === 'activo'){
      botones += `
        <button class="btn-pausar"   onclick="gestionarUsuario('${u.id}','pausar')"><i class="fa-solid fa-pause"></i> Pausar</button>
        <button class="btn-rechazar" onclick="gestionarUsuario('${u.id}','rechazar')"><i class="fa-solid fa-xmark"></i> Revocar</button>
        <button class="btn-eliminar-usr" onclick="eliminarUsuario('${u.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
      `
    } else {
      botones += `
        <button class="btn-reactivar" onclick="gestionarUsuario('${u.id}','aprobar')"><i class="fa-solid fa-rotate-left"></i> Reactivar</button>
        <button class="btn-eliminar-usr" onclick="eliminarUsuario('${u.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
      `
    }

    // Selector de cursos — múltiple con checkboxes
    const cursosActuales = cursoActual ? cursoActual.split(',').map(c => c.trim()) : []
    const checkboxes = cursosData.map(c => `
      <label class="curso-check-item">
        <input type="checkbox" value="${c.hojaId}"
          ${cursosActuales.includes(c.hojaId) ? 'checked' : ''}>
        <span>${c.nombre}</span>
      </label>
    `).join('')

    card.innerHTML = `
      <div class="usuario-avatar">${inicial}</div>
      <div class="usuario-info">
        <div class="usuario-nombre">${u.nombre || ''}</div>
        <div class="usuario-meta">${u.email || ''} · ${fecha}</div>
        <div class="usuario-curso-row">
          <span class="usuario-curso-label">
            <i class="fa-solid fa-graduation-cap"></i>
            ${cursosActuales.length > 0
              ? cursosActuales.map(c => {
                  const obj = cursosData.find(x => x.hojaId === c)
                  return obj ? obj.nombre : c
                }).join(', ')
              : 'Sin curso'}
          </span>
          <button class="btn-cambiar-curso" onclick="toggleCursoSelector('${u.id}')">
            <i class="fa-solid fa-pen"></i> Editar
          </button>
        </div>
        <div class="usuario-curso-selector" id="cselector-${u.id}" style="display:none">
          <div class="curso-checks-lista" id="cchecks-${u.id}">
            ${checkboxes}
          </div>
          <div class="curso-checks-acciones">
            <button class="btn-guardar-curso" onclick="asignarCurso('${u.id}')">
              <i class="fa-solid fa-check"></i> Guardar
            </button>
            <button class="btn-cancelar-curso" onclick="toggleCursoSelector('${u.id}')">
              Cancelar
            </button>
          </div>
        </div>
      </div>
      <div class="usuario-acciones">${botones}</div>
    `
    lista.appendChild(card)
  })
}

async function gestionarUsuario(id, accion){
  const acciones = {
    aprobar:  'aprobarUsuario',
    rechazar: 'rechazarUsuario',
    pausar:   'pausarUsuario'
  }
  try {
    const sesion = getSesion()
    const res    = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: acciones[accion], id, token: sesion.token })
    })
    const data = await res.json()
    if(data.ok){
      await cargarUsuarios()
      const msgs = { aprobar: '✅ Usuario aprobado', rechazar: '✗ Acceso revocado', pausar: '⏸ Usuario pausado' }
      toast(msgs[accion], 'ok')
    }
  } catch(e) { toast('❌ Error', 'err') }
}

async function eliminarUsuario(id){
  if(!confirm('¿Eliminar este usuario? Perderá el acceso y no podrá recuperar su cuenta.')) return
  try {
    const sesion = getSesion()
    const res    = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'eliminarUsuario', id, token: sesion.token })
    })
    const data = await res.json()
    if(data.ok){ await cargarUsuarios(); toast('🗑 Usuario eliminado', 'ok') }
  } catch(e) { toast('❌ Error', 'err') }
}

// ─────────────────────────────────────────────
// CURSOS
// ─────────────────────────────────────────────

let cursosData = []

async function cargarCursos(){
  const lista   = document.getElementById('lista-cursos')
  const loading = document.getElementById('loading-cursos')
  loading.style.display = 'block'
  lista.innerHTML = ''

  try {
    const sesion = getSesion()
    const res    = await fetch(`${API}?action=getCursosAdmin&token=${encodeURIComponent(sesion.token)}`)
    const data   = await res.json()
    cursosData   = data.data || []
    renderCursos()
  } catch(e) { toast('❌ Error al cargar cursos', 'err') }
  loading.style.display = 'none'
}

function renderCursos(){
  const lista = document.getElementById('lista-cursos')
  lista.innerHTML = ''

  if(cursosData.length === 0){
    lista.innerHTML = `<div class="vacio"><i class="fa-solid fa-chalkboard-teacher"></i><p>No hay cursos cargados todavía</p></div>`
    return
  }

  cursosData.forEach(c => {
    const estados = ['proximamente','activo','finalizado']
    const labels  = { proximamente: '🟡 Próximamente', activo: '🟢 Activo', finalizado: '🔴 Finalizado' }
    const estadoActual = c.estado || 'proximamente'

    const botonesEstado = estados.map(est => `
      <button
        class="btn-estado-curso sel-${est} ${estadoActual === est ? 'activo' : ''}"
        onclick="cambiarEstadoCurso('${c.id}', '${est}', this)">
        ${labels[est]}
      </button>
    `).join('')

    const card = document.createElement('div')
    card.className = 'curso-admin-card'
    card.id = 'curso-card-' + c.id
    card.innerHTML = `
      <div class="curso-admin-info">
        <div class="curso-admin-nombre">${c.nombre || ''}</div>
        <div class="curso-admin-meta">${c.dia || ''} ${c.horario || ''} · ${c.duracion || ''}</div>
      </div>
      <div class="curso-estado-selector">${botonesEstado}</div>
    `
    lista.appendChild(card)
  })
}

async function cambiarEstadoCurso(id, nuevoEstado, btn){
  try {
    const sesion = getSesion()
    const res    = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'actualizarEstadoCurso', id, estado: nuevoEstado, token: sesion.token })
    })
    const data = await res.json()
    if(data.ok){
      // Actualizar botones visualmente sin recargar todo
      const card = btn.closest('.curso-admin-card')
      card.querySelectorAll('.btn-estado-curso').forEach(b => b.classList.remove('activo'))
      btn.classList.add('activo')

      // Actualizar en cursosData
      const curso = cursosData.find(c => c.id === id)
      if(curso) curso.estado = nuevoEstado

      const labels = { proximamente: 'Próximamente', activo: 'Activo', finalizado: 'Finalizado' }
      toast(`✅ Curso marcado como: ${labels[nuevoEstado]}`, 'ok')
    }
  } catch(e) { toast('❌ Error', 'err') }
}

// ─────────────────────────────────────────────
// GALERÍA
// ─────────────────────────────────────────────

async function cargarGaleria(){
  const grid    = document.getElementById('grid-galeria')
  const loading = document.getElementById('loading-galeria')
  loading.style.display = 'block'
  grid.innerHTML = ''

  try {
    const sesion = getSesion()
    const res    = await fetch(`${API}?action=getAll&hoja=galeria&token=${encodeURIComponent(sesion.token)}`)
    const data   = await res.json()
    const slots  = data.data || []
    renderGaleria(slots)
  } catch(e) {
    grid.innerHTML = '<p style="opacity:0.5;padding:20px">Error al cargar la galería.</p>'
  }
  loading.style.display = 'none'
}

function renderGaleria(slots){
  const grid = document.getElementById('grid-galeria')
  grid.innerHTML = ''

  // Asegurar 4 slots aunque vengan menos
  const slotsRender = [1,2,3,4].map(n =>
    slots.find(s => String(s.slot) === String(n) || s.id === 'GAL-' + n) ||
    { id: 'GAL-' + n, slot: n, foto: '', alt: 'Foto de galería ' + n }
  )

  slotsRender.forEach(slot => {
    const div = document.createElement('div')
    div.className = 'galeria-slot'
    div.id = 'galeria-slot-' + slot.slot
    div.innerHTML = `
      <div class="galeria-slot-img" onclick="subirFotoGaleria('${slot.id}', ${slot.slot})">
        ${slot.foto
          ? `<img src="${slot.foto}" alt="${slot.alt || ''}" loading="lazy">`
          : `<div class="galeria-slot-placeholder">
               <i class="fa-solid fa-image"></i>
               <span>Sin foto — clic para agregar</span>
             </div>`
        }
        <div class="galeria-slot-overlay">
          <button class="galeria-slot-cambiar" type="button">
            <i class="fa-solid fa-camera"></i>
            ${slot.foto ? 'Cambiar foto' : 'Agregar foto'}
          </button>
        </div>
      </div>
      <div class="galeria-slot-body">
        <span class="galeria-slot-num">Foto ${slot.slot} de 4</span>
        <span class="galeria-slot-size">📐 1200×675px · JPG · máx 500kb</span>
      </div>
    `
    grid.appendChild(div)
  })
}

function subirFotoGaleria(id, slot){
  const input  = document.createElement('input')
  input.type   = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if(!file) return

    // Advertir si el archivo es muy pesado
    if(file.size > 1.5 * 1024 * 1024){
      toast('⚠️ La foto pesa más de 1.5MB — puede cargar lento en la web', '')
    }

    toast('⏳ Subiendo foto de galería...', '')
    const b64  = await fileToBase64(file)

    try {
      const sesion = getSesion()
      const res    = await fetch(API, {
        method: 'POST',
        body: JSON.stringify({
          action: 'subirFoto',
          hoja:   'galeria',
          id,
          b64,
          nombre: 'galeria_' + slot + '_' + Date.now(),
          token:  sesion.token
        })
      })
      const data = await res.json()
      if(data.ok){
        await cargarGaleria()
        toast('✅ Foto ' + slot + ' actualizada — se ve en la web al recargar', 'ok')
      } else {
        toast('❌ Error al subir foto', 'err')
      }
    } catch(e) {
      toast('❌ Error de conexión', 'err')
    }
  }
  input.click()
}

// ─────────────────────────────────────────────
// MULTIMEDIA
// ─────────────────────────────────────────────

let multimediaData    = []
let tipoMultimedia    = 'foto'
let fotoMultimediaB64 = null

async function cargarMultimedia(){
  const grid    = document.getElementById('grid-multimedia')
  const loading = document.getElementById('loading-multimedia')
  loading.style.display = 'block'
  grid.innerHTML = ''

  try {
    const sesion = getSesion()
    const res    = await fetch(`${API}?action=getAll&hoja=multimedia&token=${encodeURIComponent(sesion.token)}`)
    const data   = await res.json()
    multimediaData = data.data || []
    renderMultimedia()
  } catch(e) {
    grid.innerHTML = '<p style="opacity:0.5;padding:20px;grid-column:1/-1">Error al cargar.</p>'
  }
  loading.style.display = 'none'
}

function renderMultimedia(){
  const grid = document.getElementById('grid-multimedia')
  grid.innerHTML = ''

  if(multimediaData.length === 0){
    grid.innerHTML = `
      <div class="vacio">
        <i class="fa-solid fa-photo-film"></i>
        <p>No hay multimedia todavía. ¡Agregá fotos o videos!</p>
      </div>`
    return
  }

  multimediaData.forEach(m => {
    const publicado    = m.publicado === true || m.publicado === 'TRUE' || m.publicado === 'true'
    const cursoObj     = cursosData.find(c => c.hojaId === m.curso)
    const cursoNombre  = cursoObj ? cursoObj.nombre : (m.curso || 'General')
    const esVideo      = m.tipo === 'video'

    let mediaHTML = ''
    if(esVideo && m.url){
      const embedUrl = getEmbedUrl(m.url)
      mediaHTML = embedUrl
        ? `<iframe src="${embedUrl}" allowfullscreen loading="lazy"></iframe>`
        : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,0.5);font-size:13px;">Vista previa no disponible</div>`
    } else if(m.foto){
      mediaHTML = `<img src="${m.foto}" alt="${m.titulo || ''}" loading="lazy">`
    } else {
      mediaHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:32px;">🖼️</div>`
    }

    const card = document.createElement('div')
    card.className = 'multimedia-card'
    card.innerHTML = `
      <div class="multimedia-card-media">
        ${mediaHTML}
        <span class="multimedia-tipo-badge">
          <i class="fa-solid ${esVideo ? 'fa-play' : 'fa-image'}"></i>
          ${esVideo ? 'Video' : 'Foto'}
        </span>
      </div>
      <div class="multimedia-card-body">
        <div class="multimedia-card-titulo">${m.titulo || (esVideo ? 'Video' : 'Foto')}</div>
        <div class="multimedia-card-curso">${cursoNombre}</div>
        <div class="multimedia-card-acciones">
          <button class="btn-toggle-pub ${publicado ? 'publicado' : ''}"
            onclick="togglePublicado('multimedia','${m.id}',${publicado})"
            title="${publicado ? 'Visible — clic para ocultar' : 'Oculto — clic para mostrar'}">
            <i class="fa-solid ${publicado ? 'fa-eye' : 'fa-eye-slash'}"></i>
            ${publicado ? 'Visible' : 'Oculto'}
          </button>
          <button class="btn-borrar" onclick="borrarMultimedia('${m.id}')" title="Eliminar">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `
    grid.appendChild(card)
  })
}

function getEmbedUrl(url){
  if(!url) return null
  // YouTube
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if(yt) return `https://www.youtube.com/embed/${yt[1]}`
  // YouTube shorts
  const yts = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/)
  if(yts) return `https://www.youtube.com/embed/${yts[1]}`
  // Instagram — no tiene embed directo, mostramos link
  if(url.includes('instagram.com')) return null
  // TikTok — no tiene embed directo
  if(url.includes('tiktok.com')) return null
  return null
}

// ── MODAL MULTIMEDIA ──

function abrirModalMultimedia(){
  tipoMultimedia    = 'foto'
  fotoMultimediaB64 = null

  // Resetear form
  document.getElementById('mMultimediaTitulo').value   = ''
  document.getElementById('mMultimediaPublicado').checked = true
  document.getElementById('mMultimediaFotoArea').innerHTML = `
    <div class="mform-foto-placeholder">
      <i class="fa-solid fa-camera"></i>
      <strong>Tocá para agregar foto</strong>
    </div>`

  if(document.getElementById('mMultimediaUrl'))
    document.getElementById('mMultimediaUrl').value = ''

  document.getElementById('mMultimediaPreview').style.display = 'none'

  // Cargar cursos en el select
  const sel = document.getElementById('mMultimediaCurso')
  sel.innerHTML = '<option value="">Seleccioná</option><option value="General">General (todos los alumnos)</option>'
  cursosData.forEach(c => {
    const opt = document.createElement('option')
    opt.value       = c.hojaId
    opt.textContent = c.nombre
    sel.appendChild(opt)
  })

  setTipoMultimedia('foto')
  document.getElementById('modalMultimedia').style.display = 'flex'
}

function cerrarModalMultimedia(e){
  if(e && e.target !== document.getElementById('modalMultimedia')) return
  document.getElementById('modalMultimedia').style.display = 'none'
  fotoMultimediaB64 = null
}

function setTipoMultimedia(tipo){
  tipoMultimedia = tipo
  document.getElementById('mtipo-foto').classList.toggle('activo',  tipo === 'foto')
  document.getElementById('mtipo-video').classList.toggle('activo', tipo === 'video')
  document.getElementById('mMultimediaFotoBloque').style.display  = tipo === 'foto'  ? 'block' : 'none'
  document.getElementById('mMultimediaVideoBloque').style.display = tipo === 'video' ? 'block' : 'none'
}

function elegirFotoMultimedia(){
  document.getElementById('inputFotoMultimedia').click()
}

function previsualizarFotoMultimedia(e){
  const file = e.target.files[0]
  if(!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    fotoMultimediaB64 = ev.target.result
    document.getElementById('mMultimediaFotoArea').innerHTML = `
      <img class="mform-foto-preview" src="${fotoMultimediaB64}" alt="Preview">
      <button class="mform-foto-cambiar" onclick="elegirFotoMultimedia()" type="button">
        <i class="fa-solid fa-camera"></i> Cambiar
      </button>`
  }
  reader.readAsDataURL(file)
}

// Preview de video al escribir URL
document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('mMultimediaUrl')
  if(urlInput){
    urlInput.addEventListener('input', () => {
      const embed   = getEmbedUrl(urlInput.value)
      const preview = document.getElementById('mMultimediaPreview')
      if(embed){
        preview.style.display = 'block'
        preview.innerHTML = `<iframe src="${embed}" allowfullscreen></iframe>`
      } else {
        preview.style.display = 'none'
        preview.innerHTML = ''
      }
    })
  }
})

async function guardarMultimedia(){
  const titulo    = document.getElementById('mMultimediaTitulo').value.trim()
  const curso     = document.getElementById('mMultimediaCurso').value
  const publicado = document.getElementById('mMultimediaPublicado').checked ? 'true' : 'false'
  const id        = 'MUL-' + Date.now()

  if(tipoMultimedia === 'foto' && !fotoMultimediaB64){
    toast('Seleccioná una foto', 'err'); return
  }

  if(tipoMultimedia === 'video'){
    const url = document.getElementById('mMultimediaUrl').value.trim()
    if(!url){ toast('Ingresá el link del video', 'err'); return }

    const btn = document.querySelector('#modalMultimedia .btn-guardar-modal')
    btn.classList.add('cargando')
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...'

    try {
      const sesion = getSesion()
      const res    = await fetch(API, {
        method: 'POST',
        body: JSON.stringify({
          action: 'guardar', hoja: 'multimedia',
          fila: { id, tipo: 'video', titulo, curso, url, foto: '', publicado, creadoEn: new Date().toLocaleDateString('es-AR') },
          token: sesion.token
        })
      })
      const data = await res.json()
      if(data.ok){
        cerrarModalMultimedia()
        multimediaData = []
        await cargarMultimedia()
        toast('✅ Video agregado', 'ok')
      } else toast('❌ ' + (data.error || 'Error'), 'err')
    } catch(e) { toast('❌ Error de conexión', 'err') }

    btn.classList.remove('cargando')
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar'
    return
  }

  // Es foto — primero guardar el item, después subir foto
  const btn = document.querySelector('#modalMultimedia .btn-guardar-modal')
  btn.classList.add('cargando')
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...'

  try {
    const sesion = getSesion()

    // 1. Guardar fila
    const res = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({
        action: 'guardar', hoja: 'multimedia',
        fila: { id, tipo: 'foto', titulo, curso, url: '', foto: '', publicado, creadoEn: new Date().toLocaleDateString('es-AR') },
        token: sesion.token
      })
    })
    const data = await res.json()
    if(!data.ok){ toast('❌ Error al guardar', 'err'); btn.classList.remove('cargando'); btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar'; return }

    cerrarModalMultimedia()
    multimediaData = []
    await cargarMultimedia()
    toast('✅ Guardado — subiendo foto...', 'ok')

    // 2. Subir foto en segundo plano
    fetch(API, {
      method: 'POST',
      body: JSON.stringify({
        action: 'subirFoto', hoja: 'multimedia', id,
        b64: fotoMultimediaB64, nombre: 'multimedia_' + id,
        token: sesion.token
      })
    }).then(r => r.json()).then(d => {
      if(d.ok){
        multimediaData = []
        cargarMultimedia()
        toast('✅ Foto subida correctamente', 'ok')
      }
    })

  } catch(e) { toast('❌ Error de conexión', 'err') }

  btn.classList.remove('cargando')
  btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar'
}

async function borrarMultimedia(id){
  if(!confirm('¿Eliminar este item de multimedia?')) return
  try {
    const sesion = getSesion()
    const res    = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'eliminar', hoja: 'multimedia', id, token: sesion.token })
    })
    const data = await res.json()
    if(data.ok){ multimediaData = []; await cargarMultimedia(); toast('🗑 Eliminado', 'ok') }
  } catch(e) { toast('❌ Error', 'err') }
}

// ─────────────────────────────────────────────
// INVENTARIOS PRIVADOS
// ─────────────────────────────────────────────

let inventariosData = []

async function cargarInventarios(){
  try {
    const sesion = getSesion()
    const res    = await fetch(`${API}?action=getInventarios&token=${encodeURIComponent(sesion.token)}`)
    const data   = await res.json()
    inventariosData = (data.data || []).filter(i => i.hojaId !== 'moldes') // moldes ya está fijo
    renderSidebarInventarios()
  } catch(e) {}
}

function renderSidebarInventarios(){
  const contenedor = document.getElementById('inventariosSidebar')
  contenedor.innerHTML = ''

  inventariosData.forEach(inv => {
    const btn = document.createElement('button')
    btn.className = 'sidebar-item'
    btn.id = 'nav-inv-' + inv.hojaId
    btn.innerHTML = `<i class="fa-solid fa-box"></i> ${inv.nombre}`
    btn.onclick = () => setSeccionInventario(inv)
    contenedor.appendChild(btn)
  })
}

function setSeccionInventario(inv){
  // Quitar activo de todos
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('activo'))
  document.getElementById('nav-inv-' + inv.hojaId)?.classList.add('activo')

  // Ocultar todas las secciones
  document.querySelectorAll('.seccion').forEach(s => s.style.display = 'none')

  // Crear o mostrar sección dinámica
  let sec = document.getElementById('seccion-inv-' + inv.hojaId)
  if(!sec){
    sec = document.createElement('div')
    sec.className = 'seccion'
    sec.id = 'seccion-inv-' + inv.hojaId
    sec.innerHTML = `
      <div class="seccion-header">
        <div>
          <h2>📦 ${inv.nombre}</h2>
          <p>Inventario privado — solo visible en el panel admin</p>
        </div>
        <button class="btn-nuevo" onclick="abrirModal('${inv.hojaId}')">
          <i class="fa-solid fa-plus"></i> Nuevo item
        </button>
      </div>
      <div class="admin-filtros-wrapper">
        <div class="admin-buscador-wrapper">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input class="admin-buscador" id="buscar-${inv.hojaId}" placeholder="Buscar por nombre..." oninput="filtrarGrid('${inv.hojaId}')">
        </div>
        <div class="admin-filtros-cats" id="filtros-${inv.hojaId}"></div>
      </div>
      <div class="items-grid" id="grid-${inv.hojaId}"></div>
      <div class="loading" id="loading-${inv.hojaId}"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>
    `
    document.getElementById('adminMain').appendChild(sec)

    // Registrar categorías para este inventario
    CATEGORIAS[inv.hojaId] = ['General', 'Otros']
  }

  sec.style.display = 'block'
  seccionActual = inv.hojaId
  cerrarSidebar()

  // Cargar datos si no están en caché
  if(!cache[inv.hojaId]) cargarSeccion(inv.hojaId)
}

// ─────────────────────────────────────────────
// MODAL NUEVO INVENTARIO
// ─────────────────────────────────────────────

function abrirModalInventario(){
  document.getElementById('invNombre').value  = ''
  document.getElementById('invPrefijo').value = ''
  document.getElementById('invPreviewCodigo').innerText  = 'XXX-001'
  document.getElementById('invPreviewCodigo2').innerText = 'XXX-002'
  document.getElementById('modalInventario').style.display = 'flex'
}

function cerrarModalInventario(e){
  if(e && e.target !== document.getElementById('modalInventario')) return
  document.getElementById('modalInventario').style.display = 'none'
}

// Preview del código mientras escribe
document.addEventListener('DOMContentLoaded', () => {
  const inputNombre  = document.getElementById('invNombre')
  const inputPrefijo = document.getElementById('invPrefijo')

  if(inputNombre){
    inputNombre.addEventListener('input', () => {
      if(!inputPrefijo.value){
        const auto = inputNombre.value.trim().substring(0,3).toUpperCase()
        inputPrefijo.value = auto
        actualizarPreviewCodigo(auto)
      }
    })
  }

  if(inputPrefijo){
    inputPrefijo.addEventListener('input', () => {
      inputPrefijo.value = inputPrefijo.value.toUpperCase()
      actualizarPreviewCodigo(inputPrefijo.value)
    })
  }
})

function actualizarPreviewCodigo(prefijo){
  const p = prefijo || 'XXX'
  document.getElementById('invPreviewCodigo').innerText  = p + '-001'
  document.getElementById('invPreviewCodigo2').innerText = p + '-002'
}

async function crearInventario(){
  const nombre  = document.getElementById('invNombre').value.trim()
  const prefijo = document.getElementById('invPrefijo').value.trim().toUpperCase()

  if(!nombre){ toast('El nombre es obligatorio', 'err'); return }
  if(!prefijo || prefijo.length < 2){ toast('El código debe tener al menos 2 letras', 'err'); return }

  const btn = document.querySelector('#modalInventario .btn-guardar-modal')
  btn.classList.add('cargando')
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creando...'

  try {
    const sesion = getSesion()
    const res    = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({
        action:  'crearInventario',
        nombre,
        prefijo,
        privado: true,
        token:   sesion.token
      })
    })
    const data = await res.json()

    if(data.ok){
      cerrarModalInventario()
      await cargarInventarios()
      toast(`✅ Inventario "${nombre}" creado`, 'ok')

      // Abrir el inventario recién creado
      const nuevo = inventariosData.find(i => i.prefijo === prefijo)
      if(nuevo) setSeccionInventario(nuevo)
    } else {
      toast('❌ ' + (data.error || 'Error al crear'), 'err')
    }
  } catch(e) {
    toast('❌ Error de conexión', 'err')
  }

  btn.classList.remove('cargando')
  btn.innerHTML = '<i class="fa-solid fa-plus"></i> Crear inventario'
}

function toast(msg, tipo){
  const t = document.getElementById('toast')
  t.innerText = msg
  t.className = 'toast show' + (tipo ? ' ' + tipo : '')
  setTimeout(() => t.classList.remove('show'), 3000)
}
