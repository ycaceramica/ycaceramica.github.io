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
// VERIFICAR SESIÓN ADMIN
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

// ─────────────────────────────────────────────
// SECCIONES
// ─────────────────────────────────────────────

let seccionActual = 'piezas'

function setSeccion(nombre){
  // Ocultar todas
  document.querySelectorAll('.seccion').forEach(s => s.style.display = 'none')
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('activo'))

  // Mostrar la seleccionada
  document.getElementById('seccion-' + nombre).style.display = 'block'
  document.getElementById('nav-' + nombre).classList.add('activo')

  seccionActual = nombre

  // Cerrar sidebar en mobile
  document.getElementById('adminSidebar').classList.remove('abierto')
  document.getElementById('sidebarOverlay').classList.remove('activo')

  cargarSeccion(nombre)
}

// ─────────────────────────────────────────────
// CARGAR DATOS
// ─────────────────────────────────────────────

const cache = {}

async function cargarSeccion(nombre){
  if(nombre === 'usuarios') { await cargarUsuarios(); return }

  const grid    = document.getElementById('grid-' + nombre)
  const loading = document.getElementById('loading-' + nombre)

  if(cache[nombre]){
    renderGrid(nombre, cache[nombre])
    return
  }

  loading.style.display = 'block'
  grid.innerHTML = ''

  try {
    const sesion = getSesion()
    const res    = await fetch(`${API}?action=getAll&hoja=${nombre}&token=${sesion.token}`)
    const data   = await res.json()
    cache[nombre] = data.data || []
    renderGrid(nombre, cache[nombre])
  } catch(e) {
    grid.innerHTML = '<p style="opacity:0.5;padding:20px">Error al cargar datos</p>'
  }
  loading.style.display = 'none'
}

// ─────────────────────────────────────────────
// RENDER GRID
// ─────────────────────────────────────────────

function renderGrid(hoja, items){
  const grid = document.getElementById('grid-' + hoja)
  grid.innerHTML = ''

  if(!items || items.length === 0){
    grid.innerHTML = `
      <div class="vacio" style="grid-column:1/-1">
        <i class="fa-solid fa-box-open"></i>
        <p>No hay items todavía. ¡Agregá el primero!</p>
      </div>`
    return
  }

  items.forEach(item => {
    const publicado = item.publicado === true || item.publicado === 'TRUE' || item.publicado === 'true'
    const icono     = hoja === 'insumos' ? 'fa-flask' : hoja === 'moldes' ? 'fa-layer-group' : hoja === 'apuntes' ? 'fa-book-open' : 'fa-jar'

    const card = document.createElement('div')
    card.className = 'item-card'
    card.innerHTML = `
      <div class="item-card-img">
        ${item.foto
          ? `<img src="${item.foto}" alt="${item.nombre}" loading="lazy">`
          : `<div class="item-card-img-placeholder"><i class="fa-solid ${icono}"></i></div>`
        }
        <button class="item-card-foto-btn" onclick="subirFotoItem('${hoja}','${item.id}','${item.codigo || item.id}')">
          <i class="fa-solid fa-camera"></i> ${item.foto ? 'Cambiar foto' : 'Agregar foto'}
        </button>
        ${!item.foto ? `<span class="item-card-foto-hint">📷 desde cámara o galería</span>` : ''}
      </div>
      <div class="item-card-body">
        <div class="item-card-codigo">${item.codigo || ''}</div>
        <div class="item-card-nombre">${item.nombre || ''}</div>
        <div class="item-card-cat">${item.categoria || ''}</div>
        ${item.precio ? `<div class="item-card-precio">$${item.precio}</div>` : ''}
        <div class="item-card-acciones">
          <button class="btn-editar" onclick='editarItem("${hoja}", ${JSON.stringify(item).replace(/'/g,"&#39;")})'>
            <i class="fa-solid fa-pen"></i> Editar
          </button>
          ${hoja !== 'moldes' ? `
          <button class="btn-toggle-pub ${publicado ? 'publicado' : ''}" 
            onclick="togglePublicado('${hoja}','${item.id}',${publicado})"
            title="${publicado ? 'Visible en la web — clic para ocultar' : 'Oculto — clic para publicar'}">
            <i class="fa-solid ${publicado ? 'fa-eye' : 'fa-eye-slash'}"></i>
            ${publicado ? 'Publicado' : 'Oculto'}
          </button>` : ''}
          <button class="btn-borrar" onclick="borrarItem('${hoja}','${item.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `
    grid.appendChild(card)
  })
}

// ─────────────────────────────────────────────
// CATEGORÍAS POR HOJA
// ─────────────────────────────────────────────

const CATEGORIAS = {
  piezas:  ['Vasijas','Tazas','Platos','Decorativos','Macetas','Otros'],
  insumos: ['Arcillas','Engobes','Esmaltes','Óxidos','Herramientas','Otros'],
  moldes:  ['Decorativos','Macetas','Tazas / Vasos / Jarras','Platos / Bandejas','Otros'],
  apuntes: ['Taller de Cerámica Inicial','General']
}

// ─────────────────────────────────────────────
// MODAL — ABRIR
// ─────────────────────────────────────────────

let modalHoja    = ''
let modalItem    = null

function abrirModal(hoja, item = null){
  modalHoja = hoja
  modalItem = item

  const esPiezas  = hoja === 'piezas'
  const esInsumos = hoja === 'insumos'
  const esMoldes  = hoja === 'moldes'
  const esApuntes = hoja === 'apuntes'

  document.getElementById('modalTitulo').innerText = item
    ? `Editar ${hoja.slice(0,-1)}`
    : `Nuevo/a ${hoja === 'apuntes' ? 'apunte' : hoja.slice(0,-1)}`

  const cats = CATEGORIAS[hoja] || []
  const opsCat = cats.map(c =>
    `<option value="${c}" ${item && item.categoria === c ? 'selected' : ''}>${c}</option>`
  ).join('')

  let html = ''

  if(esApuntes){
    html = `
      <div class="mform-grupo">
        <label>Título *</label>
        <input id="mTitulo" value="${item?.titulo || ''}" placeholder="Título del apunte">
      </div>
      <div class="mform-grupo">
        <label>Curso</label>
        <select id="mCategoria"><option value="">Seleccioná</option>${opsCat}</select>
      </div>
      <div class="mform-grupo">
        <label>Contenido</label>
        <textarea id="mContenido" rows="5" placeholder="Escribí el contenido del apunte...">${item?.contenido || ''}</textarea>
      </div>
      <div class="mform-grupo">
        <label>URL de archivo (PDF, etc.)</label>
        <input id="mArchivoUrl" value="${item?.archivoUrl || ''}" placeholder="https://...">
      </div>
    `
  } else {
    html = `
      <div class="mform-fila">
        <div class="mform-grupo">
          <label>Categoría *</label>
          <select id="mCategoria" onchange="generarCodigo()">${opsCat}</select>
        </div>
        <div class="mform-grupo">
          <label>Código</label>
          <div class="mform-codigo-wrapper">
            <input id="mCodigo" value="${item?.codigo || ''}" placeholder="AUTO">
            <button class="btn-generar-codigo" onclick="generarCodigo()">↺ Auto</button>
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
            <label>Precio</label>
            <input id="mPrecio" type="number" value="${item?.precio || ''}" placeholder="0">
          </div>
        </div>
        <div class="mform-fila">
          <div class="mform-grupo">
            <label>Cantidad</label>
            <input id="mCantidad" type="number" value="${item?.cantidad || ''}" placeholder="0">
          </div>
          ${esInsumos ? `
          <div class="mform-grupo">
            <label>Unidad</label>
            <input id="mUnidad" value="${item?.unidad || ''}" placeholder="kg, litros...">
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
          <span>Publicar en la web</span>
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
          <label>Notas</label>
          <textarea id="mNotas" rows="2" placeholder="Notas internas...">${item?.notas || ''}</textarea>
        </div>
      `
    }
  }

  document.getElementById('modalBody').innerHTML = html
  document.getElementById('modalOverlay').style.display = 'flex'

  // Generar código automático si es nuevo
  if(!item && !esApuntes){
    setTimeout(() => generarCodigo(), 100)
  }
}

function editarItem(hoja, item){
  abrirModal(hoja, item)
}

function cerrarModal(e){
  if(e && e.target !== document.getElementById('modalOverlay')) return
  document.getElementById('modalOverlay').style.display = 'none'
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
    const res  = await fetch(`${API}?action=siguienteCodigo&hoja=${modalHoja}&categoria=${encodeURIComponent(cat)}&token=${sesion.token}`)
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
  btn.querySelector('span') && (btn.querySelector('span').innerText = 'Guardando...')

  try {
    const sesion = getSesion()
    const fila   = construirFila()

    if(!fila) { btn.classList.remove('cargando'); return }

    const res  = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'guardar', hoja: modalHoja, fila, token: sesion.token })
    })
    const data = await res.json()

    if(data.ok){
      delete cache[modalHoja]
      cerrarModal()
      await cargarSeccion(modalHoja)
      toast('✅ Guardado correctamente', 'ok')
    } else {
      toast('❌ Error: ' + (data.error || 'Error desconocido'), 'err')
    }
  } catch(e) {
    toast('❌ Error de conexión', 'err')
  }

  btn.classList.remove('cargando')
}

function construirFila(){
  const id   = modalItem?.id || (modalHoja.toUpperCase().slice(0,3) + '-' + Date.now())
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
      creadoEn:   modalItem?.creadoEn || new Date().toLocaleDateString('es-AR')
    }
  }

  const nombre = document.getElementById('mNombre')?.value.trim()
  if(!nombre){ toast('El nombre es obligatorio', 'err'); return null }

  const base = {
    id,
    codigo:     document.getElementById('mCodigo')?.value.trim() || '',
    nombre,
    categoria:  document.getElementById('mCategoria')?.value || '',
    descripcion:document.getElementById('mDescripcion')?.value.trim() || '',
    foto:       modalItem?.foto || '',
    creadoEn:   modalItem?.creadoEn || new Date().toLocaleDateString('es-AR')
  }

  if(hoja === 'piezas'){
    return { ...base,
      tecnica:   document.getElementById('mTipo')?.value.trim() || '',
      precio:    document.getElementById('mPrecio')?.value || '',
      cantidad:  document.getElementById('mCantidad')?.value || '',
      medidas:   document.getElementById('mMedidas')?.value.trim() || '',
      esmalte:   document.getElementById('mEsmalte')?.value.trim() || '',
      publicado: document.getElementById('mPublicado')?.checked ? 'true' : 'false'
    }
  }

  if(hoja === 'insumos'){
    return { ...base,
      tipo:        document.getElementById('mTipo')?.value.trim() || '',
      precio:      document.getElementById('mPrecio')?.value || '',
      cantidad:    document.getElementById('mCantidad')?.value || '',
      unidad:      document.getElementById('mUnidad')?.value.trim() || '',
      temperatura: document.getElementById('mTemperatura')?.value.trim() || '',
      publicado:   document.getElementById('mPublicado')?.checked ? 'true' : 'false'
    }
  }

  if(hoja === 'moldes'){
    return { ...base,
      cantidad:    document.getElementById('mCantidad')?.value || '',
      material:    document.getElementById('mMaterial')?.value.trim() || '',
      dimensiones: document.getElementById('mDimensiones')?.value.trim() || '',
      notas:       document.getElementById('mNotas')?.value.trim() || ''
    }
  }

  return base
}

// ─────────────────────────────────────────────
// SUBIR FOTO
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
      if(data.ok){
        delete cache[hoja]
        await cargarSeccion(hoja)
        toast('✅ Foto subida correctamente', 'ok')
      } else {
        toast('❌ Error al subir foto', 'err')
      }
    } catch(e) {
      toast('❌ Error de conexión', 'err')
    }
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
      toast(nuevoValor === 'true' ? '✅ Publicado' : '👁 Ocultado', 'ok')
    }
  } catch(e) {
    toast('❌ Error', 'err')
  }
}

// ─────────────────────────────────────────────
// BORRAR
// ─────────────────────────────────────────────

async function borrarItem(hoja, id){
  if(!confirm('¿Seguro que querés borrar este ítem? No se puede deshacer.')) return
  try {
    const sesion = getSesion()
    const res  = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'eliminar', hoja, id, token: sesion.token })
    })
    const data = await res.json()
    if(data.ok){
      delete cache[hoja]
      await cargarSeccion(hoja)
      toast('🗑 Eliminado', 'ok')
    }
  } catch(e) {
    toast('❌ Error', 'err')
  }
}

// ─────────────────────────────────────────────
// USUARIOS
// ─────────────────────────────────────────────

let tabUsuarioActual = 'pendientes'
let usuariosData     = []

async function cargarUsuarios(){
  const loading = document.getElementById('loading-usuarios')
  loading.style.display = 'block'

  try {
    const sesion = getSesion()
    const res  = await fetch(`${API}?action=getUsuarios&token=${sesion.token}`)
    const data = await res.json()
    usuariosData = data.data || []
    renderUsuarios()
  } catch(e) {
    toast('❌ Error al cargar usuarios', 'err')
  }
  loading.style.display = 'none'
}

function setUsuarioTab(tab){
  tabUsuarioActual = tab
  document.querySelectorAll('.utab').forEach(b => b.classList.remove('activo'))
  document.getElementById('utab-' + tab).classList.add('activo')
  renderUsuarios()
}

function renderUsuarios(){
  const lista = document.getElementById('lista-usuarios')
  lista.innerHTML = ''

  const pendientes  = usuariosData.filter(u => u.estado === 'pendiente')
  const activos     = usuariosData.filter(u => u.estado === 'activo')
  const rechazados  = usuariosData.filter(u => u.estado === 'rechazado')

  document.getElementById('cnt-pendientes').innerText = pendientes.length
  document.getElementById('cnt-activos').innerText    = activos.length
  document.getElementById('cnt-rechazados').innerText = rechazados.length

  // Badge en sidebar
  const badge = document.getElementById('badgePendientes')
  badge.style.display = pendientes.length > 0 ? 'inline' : 'none'
  badge.innerText = pendientes.length

  const filtrados = tabUsuarioActual === 'pendientes' ? pendientes
                  : tabUsuarioActual === 'activos'    ? activos
                  : rechazados

  if(filtrados.length === 0){
    lista.innerHTML = `
      <div class="vacio">
        <i class="fa-solid fa-users"></i>
        <p>No hay usuarios en esta categoría</p>
      </div>`
    return
  }

  filtrados.forEach(u => {
    const inicial = (u.nombre || '?')[0].toUpperCase()
    const card    = document.createElement('div')
    card.className = 'usuario-card'
    card.innerHTML = `
      <div class="usuario-avatar">${inicial}</div>
      <div class="usuario-info">
        <div class="usuario-nombre">${u.nombre || ''}</div>
        <div class="usuario-meta">${u.email || ''} · ${u.curso || 'Sin curso'} · ${u.fechaRegistro || ''}</div>
      </div>
      <div class="usuario-acciones">
        <span class="estado-badge ${u.estado}">${u.estado}</span>
        ${u.estado === 'pendiente' ? `
          <button class="btn-aprobar" onclick="gestionarUsuario('${u.id}','aprobar')">✓ Aprobar</button>
          <button class="btn-rechazar" onclick="gestionarUsuario('${u.id}','rechazar')">✗ Rechazar</button>
        ` : ''}
        ${u.estado === 'rechazado' ? `
          <button class="btn-aprobar" onclick="gestionarUsuario('${u.id}','aprobar')">✓ Aprobar</button>
        ` : ''}
      </div>
    `
    lista.appendChild(card)
  })
}

async function gestionarUsuario(id, accion){
  try {
    const sesion = getSesion()
    const res  = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({
        action: accion === 'aprobar' ? 'aprobarUsuario' : 'rechazarUsuario',
        id,
        token: sesion.token
      })
    })
    const data = await res.json()
    if(data.ok){
      await cargarUsuarios()
      toast(accion === 'aprobar' ? '✅ Usuario aprobado' : '✗ Usuario rechazado', 'ok')
    }
  } catch(e) {
    toast('❌ Error', 'err')
  }
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────

function toast(msg, tipo){
  const t = document.getElementById('toast')
  t.innerText = msg
  t.className = 'toast show' + (tipo ? ' ' + tipo : '')
  setTimeout(() => t.classList.remove('show'), 3000)
}
