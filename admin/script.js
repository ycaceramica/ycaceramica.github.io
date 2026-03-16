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

// ─────────────────────────────────────────────
// SECCIONES
// ─────────────────────────────────────────────

let seccionActual = 'piezas'

function setSeccion(nombre){
  document.querySelectorAll('.seccion').forEach(s => s.style.display = 'none')
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('activo'))
  document.getElementById('seccion-' + nombre).style.display = 'block'
  document.getElementById('nav-' + nombre)?.classList.add('activo')
  seccionActual = nombre
  cerrarSidebar()
  cargarSeccion(nombre)
}

// ─────────────────────────────────────────────
// CACHÉ Y CARGA
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
  if(!grid) return

  if(cache[nombre]){
    renderGrid(nombre, cache[nombre])
    armarFiltrosAdmin(nombre, cache[nombre])
    return
  }

  if(loading) loading.style.display = 'block'
  grid.innerHTML = ''

  try {
    const sesion = getSesion()
    const res    = await fetch(`${API}?action=getAll&hoja=${nombre}&token=${encodeURIComponent(sesion.token)}`)
    const data   = await res.json()
    cache[nombre] = data.data || []
    renderGrid(nombre, cache[nombre])
    armarFiltrosAdmin(nombre, cache[nombre])
  } catch(e) {
    if(grid) grid.innerHTML = '<p style="opacity:0.5;padding:20px;grid-column:1/-1">Error al cargar. Revisá tu conexión.</p>'
  }
  if(loading) loading.style.display = 'none'
}

// Precarga silenciosa de cursos
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
// ORDENAR
// ─────────────────────────────────────────────

let ordenActual = {} // hoja -> 'az' | 'za'

function ordenarItems(items, orden, hoja){
  // Para inventarios privados ordenar por código
  const porCodigo = hoja === 'moldes' || (hoja && hoja.endsWith('_inv'))

  return [...items].sort((a, b) => {
    if(porCodigo){
      // Ordenar por prefijo luego por número
      const codA = String(a.codigo || '').toUpperCase()
      const codB = String(b.codigo || '').toUpperCase()
      const matchA = codA.match(/^([A-Z]+)-?(\d+)$/)
      const matchB = codB.match(/^([A-Z]+)-?(\d+)$/)
      if(matchA && matchB){
        if(matchA[1] !== matchB[1]) return matchA[1] < matchB[1] ? -1 : 1
        const numA = parseInt(matchA[2])
        const numB = parseInt(matchB[2])
        return orden === 'za' ? numB - numA : numA - numB
      }
      return orden === 'za' ? codB.localeCompare(codA) : codA.localeCompare(codB)
    }

    // Para catálogos públicos ordenar por categoría + nombre
    const catA = (a.categoria || '').toLowerCase()
    const catB = (b.categoria || '').toLowerCase()
    const nomA = (a.nombre || a.titulo || '').toLowerCase()
    const nomB = (b.nombre || b.titulo || '').toLowerCase()
    if(catA !== catB) return catA < catB ? -1 : 1
    if(orden === 'za') return nomA < nomB ? 1 : -1
    return nomA < nomB ? -1 : 1
  })
}

// ─────────────────────────────────────────────
// FILTROS Y BÚSQUEDA
// ─────────────────────────────────────────────

const filtroActivo    = {}
const filtroPubActivo = {} // hoja -> 'todos' | 'publicado' | 'oculto'

function armarFiltrosAdmin(hoja, items){
  const contenedor = document.getElementById('filtros-' + hoja)
  if(!contenedor) return

  const cats = ['Todos', ...new Set(items.map(i => i.categoria).filter(Boolean))]
  contenedor.innerHTML = ''
  if(!filtroActivo[hoja]) filtroActivo[hoja] = 'Todos'

  cats.forEach(cat => {
    const btn = document.createElement('button')
    btn.className = 'admin-filtro-btn' + (cat === filtroActivo[hoja] ? ' activo' : '')
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
  const busqueda  = (document.getElementById('buscar-' + hoja)?.value || '').toLowerCase().trim()
  const catActiva = filtroActivo[hoja] || 'Todos'
  const pubActivo = filtroPubActivo[hoja] || 'todos'
  const cards     = document.querySelectorAll(`#grid-${hoja} .item-card`)
  let visibles    = 0

  cards.forEach(card => {
    const nombre    = (card.querySelector('.item-card-nombre')?.innerText || '').toLowerCase()
    const categoria = (card.querySelector('.item-card-cat')?.innerText    || '')
    const codigo    = (card.querySelector('.item-card-codigo')?.innerText  || '').toLowerCase()
    const publicado = card.dataset.publicado === 'true'

    const matchCat  = catActiva === 'Todos' || categoria === catActiva
    const matchBus  = !busqueda || nombre.includes(busqueda) || codigo.includes(busqueda)
    const matchPub  = pubActivo === 'todos' || (pubActivo === 'publicado' && publicado) || (pubActivo === 'oculto' && !publicado)
    const mostrar   = matchCat && matchBus && matchPub

    card.style.display = mostrar ? 'flex' : 'none'
    if(mostrar) visibles++
  })

  let sinRes = document.querySelector(`#grid-${hoja} .sin-resultados-admin`)
  if(visibles === 0){
    if(!sinRes){
      sinRes = document.createElement('div')
      sinRes.className = 'vacio sin-resultados-admin'
      sinRes.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i><p>No hay items que coincidan</p>`
      document.getElementById('grid-' + hoja)?.appendChild(sinRes)
    }
    sinRes.style.display = 'flex'
  } else if(sinRes){
    sinRes.style.display = 'none'
  }
}

function setFiltroPublicado(hoja, valor, btn){
  filtroPubActivo[hoja] = valor
  btn.closest('.admin-pub-filtros').querySelectorAll('.admin-pub-btn').forEach(b => b.classList.remove('activo'))
  btn.classList.add('activo')
  filtrarGrid(hoja)
}

function setOrden(hoja, orden, btn){
  ordenActual[hoja] = orden
  btn.closest('.admin-orden-btns').querySelectorAll('button').forEach(b => b.classList.remove('activo'))
  btn.classList.add('activo')
  const items = cache[hoja] || []
  renderGrid(hoja, ordenarItems(items, orden, hoja))
}

// ─────────────────────────────────────────────
// RENDER GRID
// ─────────────────────────────────────────────

const CATEGORIAS = {
  piezas:  ['Vasijas','Tazas','Platos','Decorativos','Macetas','Otros'],
  insumos: ['Arcillas','Engobes','Esmaltes','Óxidos','Herramientas','Otros'],
  moldes:  ['Decorativos','Macetas','Tazas / Vasos / Jarras','Platos / Bandejas','Otros'],
  apuntes: ['General']
}

function renderGrid(hoja, items){
  const grid = document.getElementById('grid-' + hoja)
  if(!grid) return
  grid.innerHTML = ''

  if(!items || items.length === 0){
    grid.innerHTML = `
      <div class="vacio">
        <i class="fa-solid fa-box-open"></i>
        <p>No hay items todavía. ¡Agregá el primero!</p>
      </div>`
    return
  }

  const orden     = ordenActual[hoja] || 'az'
  const ordenados = ordenarItems(items, orden, hoja)

  ordenados.forEach(item => {
    const publicado = item.publicado === true || item.publicado === 'TRUE' || item.publicado === 'true'
    const esMolde   = hoja === 'moldes' || hoja.endsWith('_inv')
    const esApunte  = hoja === 'apuntes'
    const mostrarPub = !esMolde
    const icono     = hoja === 'insumos' ? 'fa-flask' : hoja === 'moldes' ? 'fa-layer-group' : esApunte ? 'fa-book-open' : 'fa-jar'

    const card = document.createElement('div')
    card.className = 'item-card'
    card.dataset.publicado = publicado

    card.innerHTML = `
      <div class="item-card-img">
        ${item.foto
          ? `<img src="${item.foto}" alt="${item.nombre || ''}" loading="lazy">`
          : `<div class="item-card-img-placeholder"><i class="fa-solid ${icono}"></i></div>`
        }
        ${!esApunte ? `
        <button class="item-card-foto-btn" onclick="subirFotoItem('${hoja}','${item.id}','${item.codigo || item.id}','${item.categoria || ''}')">
          <i class="fa-solid fa-camera"></i> ${item.foto ? 'Cambiar' : 'Agregar foto'}
        </button>
        ${!item.foto ? `<span class="item-card-foto-hint">📐 1:1 para verse mejor</span>` : ''}
        ` : ''}
      </div>
      <div class="item-card-body">
        <div class="item-card-codigo">${item.codigo || (esApunte ? item.curso || '' : '')}</div>
        <div class="item-card-nombre">${item.nombre || item.titulo || ''}</div>
        <div class="item-card-cat">${item.categoria || ''}</div>
        <div class="item-card-acciones">
          <button class="btn-editar" onclick='editarItem("${hoja}", ${JSON.stringify(item).replace(/'/g,"&#39;").replace(/"/g,'&quot;')})'>
            <i class="fa-solid fa-pen"></i>
          </button>
          ${mostrarPub ? `
          <button class="btn-toggle-pub ${publicado ? 'publicado' : ''}"
            onclick="togglePublicado('${hoja}','${item.id}',${publicado})">
            <i class="fa-solid ${publicado ? 'fa-eye' : 'fa-eye-slash'}"></i>
          </button>` : ''}
          <button class="btn-borrar" onclick="abrirModalBorrarItem('${hoja}','${item.id}','${item.foto || ''}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `
    grid.appendChild(card)
  })
}

// ─────────────────────────────────────────────
// MODAL BORRAR ITEMS (universal)
// ─────────────────────────────────────────────

let borrarItemData = null

function abrirModalBorrarItem(hoja, id, fotoUrl){
  borrarItemData = { hoja, id, fotoUrl }
  const tieneFoto = fotoUrl && fotoUrl.includes('lh3.googleusercontent.com')
  const modal     = document.getElementById('modalBorrarItem')
  const btnDrive  = document.getElementById('btnBorrarItemDrive')
  btnDrive.style.display = tieneFoto ? 'flex' : 'none'
  btnDrive.onclick  = () => ejecutarBorrarItem(true)
  document.getElementById('btnBorrarItemWeb').onclick = () => ejecutarBorrarItem(false)
  modal.style.display = 'flex'
}

function cerrarModalBorrarItem(e){
  if(e && e.target !== document.getElementById('modalBorrarItem')) return
  document.getElementById('modalBorrarItem').style.display = 'none'
  borrarItemData = null
}

async function ejecutarBorrarItem(borrarDrive){
  if(!borrarItemData) return
  const { hoja, id, fotoUrl } = borrarItemData
  cerrarModalBorrarItem()
  try {
    const sesion = getSesion()
    const res    = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({
        action:  borrarDrive ? 'eliminarConFoto' : 'eliminar',
        hoja, id, fotoUrl,
        token:   sesion.token
      })
    })
    const data = await res.json()
    if(data.ok){
      delete cache[hoja]
      await cargarSeccion(hoja)
      toast(borrarDrive ? '🗑 Eliminado de la web y del Drive' : '🗑 Eliminado de la web', 'ok')
    } else toast('❌ Error al eliminar', 'err')
  } catch(e) { toast('❌ Error de conexión', 'err') }
}

// ─────────────────────────────────────────────
// FOTO EN ITEMS
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
    const area = document.getElementById('mFotoArea')
    if(area){
      area.innerHTML = `
        <img class="mform-foto-preview" src="${fotoModalBase64}" alt="Preview">
        <button class="mform-foto-cambiar" onclick="elegirFotoModal()" type="button">
          <i class="fa-solid fa-camera"></i> Cambiar
        </button>`
    }
  }
  reader.readAsDataURL(file)
}

function subirFotoItem(hoja, id, nombre, categoria){
  const input  = document.createElement('input')
  input.type   = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if(!file) return
    toast('⏳ Subiendo foto...', '')
    const b64 = await fileToBase64(file)
    try {
      const sesion = getSesion()
      const res    = await fetch(API, {
        method: 'POST',
        body: JSON.stringify({ action: 'subirFoto', hoja, id, b64, nombre: nombre + '_' + Date.now(), categoria, token: sesion.token })
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
// MODAL UNIVERSAL
// ─────────────────────────────────────────────

let modalHoja = ''
let modalItem = null

function abrirModal(hoja, item = null){
  modalHoja        = hoja
  modalItem        = item
  fotoModalBase64  = null
  fotoModalNombre  = null

  const esApuntes = hoja === 'apuntes'
  const esMoldes  = hoja === 'moldes' || hoja.endsWith('_inv')
  const esPiezas  = hoja === 'piezas'
  const esInsumos = hoja === 'insumos'

  document.getElementById('modalTitulo').innerText = item
    ? `Editar ${esApuntes ? 'apunte' : 'item'}`
    : `Nuevo ${esApuntes ? 'apunte' : 'item'}`

  const cats   = CATEGORIAS[hoja] || ['General','Otros']
  const opsCat = cats.map(c =>
    `<option value="${c}" ${item?.categoria === c || item?.curso === c ? 'selected' : ''}>${c}</option>`
  ).join('')

  const cursosOps = cursosData.length > 0
    ? cursosData.map(c => `<option value="${c.hojaId}" ${item?.curso === c.hojaId ? 'selected' : ''}>${c.nombre}</option>`).join('')
    : opsCat

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

function editarItem(hoja, item){ abrirModal(hoja, item) }

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
    const res  = await fetch(`${API}?action=siguienteCodigo&hoja=${modalHoja}&categoria=${encodeURIComponent(cat)}`)
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

    const res  = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'guardar', hoja: modalHoja, fila, token: sesion.token })
    })
    const data = await res.json()

    if(!data.ok){ toast('❌ ' + (data.error || 'Error al guardar'), 'err'); btn.classList.remove('cargando'); btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar'; return }

    // Subir foto si hay
    if(fotoModalBase64 && modalHoja !== 'apuntes'){
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo foto...'
      const nombre = (fila.codigo || fila.id) + '_' + Date.now()
      await fetch(API, {
        method: 'POST',
        body: JSON.stringify({ action: 'subirFoto', hoja: modalHoja, id: fila.id, b64: fotoModalBase64, nombre, categoria: fila.categoria || '', token: sesion.token })
      })
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
  const id   = modalItem?.id || (modalHoja.toUpperCase().slice(0,3) + '-' + Date.now())
  const hoja = modalHoja

  if(hoja === 'apuntes'){
    const titulo = document.getElementById('mTitulo')?.value.trim()
    if(!titulo){ toast('El título es obligatorio', 'err'); return null }
    return {
      id, titulo,
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

  // Moldes e inventarios privados
  return { ...base,
    cantidad:    document.getElementById('mCantidad')?.value || '',
    material:    document.getElementById('mMaterial')?.value.trim() || '',
    dimensiones: document.getElementById('mDimensiones')?.value.trim() || '',
    notas:       document.getElementById('mNotas')?.value.trim() || ''
  }
}

// ─────────────────────────────────────────────
// TOGGLE PUBLICADO
// ─────────────────────────────────────────────

async function togglePublicado(hoja, id, publicadoActual){
  const nuevoValor = publicadoActual ? 'false' : 'true'
  try {
    const sesion = getSesion()
    const res    = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'actualizarCampo', hoja, id, campo: 'publicado', valor: nuevoValor, token: sesion.token })
    })
    const data = await res.json()
    if(data.ok){
      delete cache[hoja]
      await cargarSeccion(hoja)
      toast(nuevoValor === 'true' ? '✅ Publicado' : '👁 Ocultado', 'ok')
    }
  } catch(e) { toast('❌ Error', 'err') }
}

// ─────────────────────────────────────────────
// GALERÍA DEL INDEX
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
        <div style="display:flex;gap:8px;align-items:center">
          <span class="galeria-slot-size">📐 1200×675px · JPG</span>
          ${slot.foto ? `
          <button class="btn-borrar" style="padding:4px 8px;font-size:10px"
            onclick="abrirModalBorrarGaleria('${slot.id}','${slot.foto}')">
            <i class="fa-solid fa-trash"></i>
          </button>` : ''}
        </div>
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
    if(file.size > 1.5 * 1024 * 1024) toast('⚠️ La foto pesa más de 1.5MB', '')
    toast('⏳ Subiendo foto de galería...', '')
    const b64  = await fileToBase64(file)
    try {
      const sesion = getSesion()
      const res    = await fetch(API, {
        method: 'POST',
        body: JSON.stringify({ action: 'subirFoto', hoja: 'galeria', id, b64, nombre: 'galeria_' + slot + '_' + Date.now(), categoria: 'galeria', token: sesion.token })
      })
      const data = await res.json()
      if(data.ok){ await cargarGaleria(); toast('✅ Foto ' + slot + ' actualizada', 'ok') }
      else toast('❌ Error al subir foto', 'err')
    } catch(e) { toast('❌ Error de conexión', 'err') }
  }
  input.click()
}

// Borrar galería con opción Drive
let borrarGaleriaData = null

function abrirModalBorrarGaleria(id, fotoUrl){
  borrarGaleriaData = { id, fotoUrl }
  const modal = document.getElementById('modalBorrarItem')
  document.getElementById('btnBorrarItemDrive').style.display = 'flex'
  document.getElementById('btnBorrarItemDrive').onclick = () => ejecutarBorrarGaleria(true)
  document.getElementById('btnBorrarItemWeb').onclick   = () => ejecutarBorrarGaleria(false)
  modal.style.display = 'flex'
}

async function ejecutarBorrarGaleria(borrarDrive){
  if(!borrarGaleriaData) return
  const { id, fotoUrl } = borrarGaleriaData
  cerrarModalBorrarItem()
  try {
    const sesion = getSesion()
    await fetch(API, {
      method: 'POST',
      body: JSON.stringify({
        action:  borrarDrive ? 'eliminarConFoto' : 'actualizarCampo',
        hoja:    'galeria', id,
        campo:   'foto', valor: '',
        fotoUrl, token: sesion.token
      })
    })
    await cargarGaleria()
    toast(borrarDrive ? '🗑 Foto eliminada de la web y del Drive' : '🗑 Foto eliminada de la web', 'ok')
  } catch(e) { toast('❌ Error', 'err') }
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
    const publicado   = m.publicado === true || m.publicado === 'TRUE' || m.publicado === 'true'
    const cursoObj    = cursosData.find(c => c.hojaId === m.curso)
    const cursoNombre = cursoObj ? cursoObj.nombre : (m.curso || 'General')
    const esVideo     = m.tipo === 'video'

    let mediaHTML = ''
    if(esVideo && m.url){
      const embedUrl = getEmbedUrl(m.url)
      mediaHTML = embedUrl
        ? `<iframe src="${embedUrl}" allowfullscreen loading="lazy"></iframe>`
        : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,0.5);font-size:12px;padding:10px;text-align:center">Vista previa no disponible</div>`
    } else if(m.foto){
      mediaHTML = `<img src="${m.foto}" alt="${m.titulo || ''}" loading="lazy">`
    } else {
      mediaHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:32px">🖼️</div>`
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
            onclick="togglePublicado('multimedia','${m.id}',${publicado})">
            <i class="fa-solid ${publicado ? 'fa-eye' : 'fa-eye-slash'}"></i>
            ${publicado ? 'Visible' : 'Oculto'}
          </button>
          <button class="btn-borrar" onclick="borrarMultimedia('${m.id}')">
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
  const yt  = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if(yt)  return `https://www.youtube.com/embed/${yt[1]}`
  const yts = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/)
  if(yts) return `https://www.youtube.com/embed/${yts[1]}`
  return null
}

function abrirModalMultimedia(){
  tipoMultimedia    = 'foto'
  fotoMultimediaB64 = null

  document.getElementById('mMultimediaTitulo').value      = ''
  document.getElementById('mMultimediaPublicado').checked = true
  document.getElementById('mMultimediaFotoArea').innerHTML = `
    <div class="mform-foto-placeholder">
      <i class="fa-solid fa-camera"></i>
      <strong>Tocá para agregar foto</strong>
    </div>`
  if(document.getElementById('mMultimediaUrl'))
    document.getElementById('mMultimediaUrl').value = ''
  document.getElementById('mMultimediaPreview').style.display = 'none'

  const sel = document.getElementById('mMultimediaCurso')
  sel.innerHTML = '<option value="">Seleccioná</option><option value="General">General (todos los alumnos)</option>'
  cursosData.forEach(c => {
    const opt = document.createElement('option')
    opt.value = c.hojaId; opt.textContent = c.nombre
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

function elegirFotoMultimedia(){ document.getElementById('inputFotoMultimedia').click() }

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

async function guardarMultimedia(){
  const titulo    = document.getElementById('mMultimediaTitulo').value.trim()
  const curso     = document.getElementById('mMultimediaCurso').value
  const publicado = document.getElementById('mMultimediaPublicado').checked ? 'true' : 'false'
  const id        = 'MUL-' + Date.now()

  const btn = document.querySelector('#modalMultimedia .btn-guardar-modal')
  btn.classList.add('cargando')

  try {
    const sesion = getSesion()

    if(tipoMultimedia === 'video'){
      const url = document.getElementById('mMultimediaUrl').value.trim()
      if(!url){ toast('Ingresá el link del video', 'err'); btn.classList.remove('cargando'); return }
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...'
      const res  = await fetch(API, {
        method: 'POST',
        body: JSON.stringify({ action: 'guardar', hoja: 'multimedia',
          fila: { id, tipo: 'video', titulo, curso, url, foto: '', publicado, creadoEn: new Date().toLocaleDateString('es-AR') },
          token: sesion.token })
      })
      const data = await res.json()
      if(data.ok){ cerrarModalMultimedia(); multimediaData = []; await cargarMultimedia(); toast('✅ Video agregado', 'ok') }
      else toast('❌ ' + (data.error || 'Error'), 'err')
    } else {
      if(!fotoMultimediaB64){ toast('Seleccioná una foto', 'err'); btn.classList.remove('cargando'); return }
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...'
      const res = await fetch(API, {
        method: 'POST',
        body: JSON.stringify({ action: 'guardar', hoja: 'multimedia',
          fila: { id, tipo: 'foto', titulo, curso, url: '', foto: '', publicado, creadoEn: new Date().toLocaleDateString('es-AR') },
          token: sesion.token })
      })
      const data = await res.json()
      if(!data.ok){ toast('❌ Error al guardar', 'err'); btn.classList.remove('cargando'); btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar'; return }

      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo foto...'
      const resF = await fetch(API, {
        method: 'POST',
        body: JSON.stringify({ action: 'subirFoto', hoja: 'multimedia', id, b64: fotoMultimediaB64,
          nombre: 'multimedia_' + id, categoria: curso || 'General', token: sesion.token })
      })
      const dataF = await resF.json()
      cerrarModalMultimedia()
      multimediaData = []
      await cargarMultimedia()
      toast(dataF.ok ? '✅ Foto agregada correctamente' : '⚠️ Guardado pero error al subir foto', dataF.ok ? 'ok' : 'err')
    }
  } catch(e) { toast('❌ Error de conexión', 'err') }

  btn.classList.remove('cargando')
  btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar'
}

// Borrar multimedia
let borrarMultimediaId = null

function borrarMultimedia(id){ abrirModalBorrarMultimedia(id) }

function abrirModalBorrarMultimedia(id){
  const item      = multimediaData.find(m => m.id === id)
  borrarMultimediaId = id
  const tieneFoto = item?.foto && item.tipo === 'foto'
  const modal     = document.getElementById('modalBorrarMultimedia')
  document.getElementById('btnBorrarConDrive').style.display = tieneFoto ? 'flex' : 'none'
  document.querySelector('#modalBorrarMultimedia h3').innerText = tieneFoto ? '🗑 Eliminar foto' : '🗑 Eliminar video'
  document.getElementById('btnBorrarConDrive').onclick = () => ejecutarBorrarMultimedia(id, true)
  document.getElementById('btnBorrarSoloWeb').onclick  = () => ejecutarBorrarMultimedia(id, false)
  modal.style.display = 'flex'
}

function cerrarModalBorrar(e){
  if(e && e.target !== document.getElementById('modalBorrarMultimedia')) return
  document.getElementById('modalBorrarMultimedia').style.display = 'none'
  borrarMultimediaId = null
}

async function ejecutarBorrarMultimedia(id, borrarDrive){
  document.getElementById('modalBorrarMultimedia').style.display = 'none'
  const item = multimediaData.find(m => m.id === id)
  try {
    const sesion = getSesion()
    const res    = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: borrarDrive ? 'eliminarConFoto' : 'eliminar', hoja: 'multimedia', id, fotoUrl: item?.foto || '', token: sesion.token })
    })
    const data = await res.json()
    if(data.ok){ multimediaData = []; await cargarMultimedia(); toast(borrarDrive ? '🗑 Eliminado de la web y del Drive' : '🗑 Eliminado de la web', 'ok') }
  } catch(e) { toast('❌ Error', 'err') }
}

// Preview video en modal
document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('mMultimediaUrl')
  if(urlInput){
    urlInput.addEventListener('input', () => {
      const embed   = getEmbedUrl(urlInput.value)
      const preview = document.getElementById('mMultimediaPreview')
      if(embed){ preview.style.display = 'block'; preview.innerHTML = `<iframe src="${embed}" allowfullscreen></iframe>` }
      else { preview.style.display = 'none'; preview.innerHTML = '' }
    })
  }

  const invNombre  = document.getElementById('invNombre')
  const invPrefijo = document.getElementById('invPrefijo')
  if(invNombre){
    invNombre.addEventListener('input', () => {
      if(!invPrefijo.value){
        const auto = invNombre.value.trim().substring(0,3).toUpperCase()
        invPrefijo.value = auto
        actualizarPreviewCodigo(auto)
      }
    })
  }
  if(invPrefijo){
    invPrefijo.addEventListener('input', () => {
      invPrefijo.value = invPrefijo.value.toUpperCase()
      actualizarPreviewCodigo(invPrefijo.value)
    })
  }
})

// ─────────────────────────────────────────────
// USUARIOS
// ─────────────────────────────────────────────

let tabUsuarioActual = 'pendientes'
let usuariosData     = []

async function cargarUsuarios(){
  document.getElementById('loading-usuarios').style.display = 'block'
  try {
    const sesion = getSesion()
    const [resU, resC] = await Promise.all([
      fetch(`${API}?action=getUsuarios&token=${encodeURIComponent(sesion.token)}`),
      cursosData.length > 0
        ? Promise.resolve(null)
        : fetch(`${API}?action=getCursosAdmin&token=${encodeURIComponent(sesion.token)}`)
    ])
    const dataU = await resU.json()
    usuariosData = dataU.data || []
    if(resC){ const dataC = await resC.json(); cursosData = dataC.data || [] }
    renderUsuarios()
  } catch(e) { toast('❌ Error al cargar usuarios', 'err') }
  document.getElementById('loading-usuarios').style.display = 'none'
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
    const inicial      = (u.nombre || '?')[0].toUpperCase()
    const fecha        = formatearFecha(u.fechaRegistro)
    const cursoActual  = u.curso || ''
    const cursosActuales = cursoActual ? cursoActual.split(',').map(c => c.trim()) : []
    const nombresC     = cursosActuales.map(c => { const obj = cursosData.find(x => x.hojaId === c); return obj ? obj.nombre : c }).join(', ')
    const card         = document.createElement('div')
    card.className = 'usuario-card'

    let botones = `<span class="estado-badge ${u.estado}">${u.estado}</span>`
    if(u.estado === 'pendiente'){
      botones += `
        <button class="btn-aprobar"  onclick="gestionarUsuario('${u.id}','aprobar')"><i class="fa-solid fa-check"></i> Aprobar</button>
        <button class="btn-rechazar" onclick="gestionarUsuario('${u.id}','rechazar')"><i class="fa-solid fa-xmark"></i> Rechazar</button>
        <button class="btn-eliminar-usr" onclick="eliminarUsuario('${u.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>`
    } else if(u.estado === 'activo'){
      botones += `
        <button class="btn-pausar"   onclick="gestionarUsuario('${u.id}','pausar')"><i class="fa-solid fa-pause"></i> Pausar</button>
        <button class="btn-rechazar" onclick="gestionarUsuario('${u.id}','rechazar')"><i class="fa-solid fa-xmark"></i> Revocar</button>
        <button class="btn-eliminar-usr" onclick="eliminarUsuario('${u.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>`
    } else {
      botones += `
        <button class="btn-reactivar" onclick="gestionarUsuario('${u.id}','aprobar')"><i class="fa-solid fa-rotate-left"></i> Reactivar</button>
        <button class="btn-eliminar-usr" onclick="eliminarUsuario('${u.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>`
    }

    const checkboxes = cursosData.map(c => `
      <label class="curso-check-item">
        <input type="checkbox" value="${c.hojaId}" ${cursosActuales.includes(c.hojaId) ? 'checked' : ''}>
        <span>${c.nombre}</span>
      </label>`).join('')

    card.innerHTML = `
      <div class="usuario-avatar">${inicial}</div>
      <div class="usuario-info">
        <div class="usuario-nombre">${u.nombre || ''}</div>
        <div class="usuario-meta">${u.email || ''} · ${fecha}</div>
        <div class="usuario-curso-row">
          <span class="usuario-curso-label"><i class="fa-solid fa-graduation-cap"></i> ${nombresC || 'Sin curso'}</span>
          <button class="btn-cambiar-curso" onclick="toggleCursoSelector('${u.id}')"><i class="fa-solid fa-pen"></i> Editar</button>
        </div>
        <div class="usuario-curso-selector" id="cselector-${u.id}" style="display:none">
          <div class="curso-checks-lista" id="cchecks-${u.id}">${checkboxes}</div>
          <div class="curso-checks-acciones">
            <button class="btn-guardar-curso" onclick="asignarCurso('${u.id}')"><i class="fa-solid fa-check"></i> Guardar</button>
            <button class="btn-cancelar-curso" onclick="toggleCursoSelector('${u.id}')">Cancelar</button>
          </div>
        </div>
      </div>
      <div class="usuario-acciones">${botones}</div>
    `
    lista.appendChild(card)
  })
}

function toggleCursoSelector(userId){
  const sel = document.getElementById('cselector-' + userId)
  sel.style.display = sel.style.display === 'none' ? 'flex' : 'none'
}

async function asignarCurso(userId){
  const checks  = document.querySelectorAll(`#cchecks-${userId} input[type="checkbox"]:checked`)
  const cursos  = Array.from(checks).map(c => c.value).join(',')
  try {
    const sesion = getSesion()
    const res    = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'actualizarCampo', hoja: 'usuarios', id: userId, campo: 'curso', valor: cursos, token: sesion.token })
    })
    const data = await res.json()
    if(data.ok){
      const u = usuariosData.find(u => u.id === userId)
      if(u) u.curso = cursos
      renderUsuarios()
      const nombres = cursos ? cursos.split(',').map(c => { const obj = cursosData.find(x => x.hojaId === c.trim()); return obj ? obj.nombre : c }).join(', ') : 'Sin curso'
      toast(`✅ Cursos actualizados: ${nombres}`, 'ok')
    }
  } catch(e) { toast('❌ Error', 'err') }
}

async function gestionarUsuario(id, accion){
  const acciones = { aprobar: 'aprobarUsuario', rechazar: 'rechazarUsuario', pausar: 'pausarUsuario' }
  try {
    const sesion = getSesion()
    const res    = await fetch(API, { method: 'POST', body: JSON.stringify({ action: acciones[accion], id, token: sesion.token }) })
    const data   = await res.json()
    if(data.ok){ await cargarUsuarios(); const msgs = { aprobar: '✅ Aprobado', rechazar: '✗ Revocado', pausar: '⏸ Pausado' }; toast(msgs[accion], 'ok') }
  } catch(e) { toast('❌ Error', 'err') }
}

async function eliminarUsuario(id){
  if(!confirm('¿Eliminar este usuario? Perderá el acceso permanentemente.')) return
  try {
    const sesion = getSesion()
    const res    = await fetch(API, { method: 'POST', body: JSON.stringify({ action: 'eliminarUsuario', id, token: sesion.token }) })
    const data   = await res.json()
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
    lista.innerHTML = `<div class="vacio"><i class="fa-solid fa-chalkboard-teacher"></i><p>No hay cursos todavía. ¡Creá el primero!</p></div>`
    return
  }
  const estados = ['proximamente','activo','finalizado']
  const labels  = { proximamente: '🟡 Próximamente', activo: '🟢 Activo', finalizado: '🔴 Finalizado' }
  cursosData.forEach(c => {
    const estadoActual = c.estado || 'proximamente'
    const visible      = c.visible !== 'false'
    const botonesEstado = estados.map(est => `
      <button class="btn-estado-curso sel-${est} ${estadoActual === est ? 'activo' : ''}"
        onclick="cambiarEstadoCurso('${c.id}', '${est}', this)">
        ${labels[est]}
      </button>`).join('')
    const card = document.createElement('div')
    card.className = 'curso-admin-card'
    card.id = 'curso-card-' + c.id
    card.innerHTML = `
      ${c.foto ? `<img src="${c.foto}" style="width:80px;height:45px;object-fit:cover;border-radius:8px;flex-shrink:0">` : `<div style="width:80px;height:45px;background:var(--color-fondo);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🎓</div>`}
      <div class="curso-admin-info">
        <div class="curso-admin-nombre">${c.nombre || ''}</div>
        <div class="curso-admin-meta">${c.dia || ''} ${c.horario || ''} · ${c.duracion || ''}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
        <div class="curso-estado-selector">${botonesEstado}</div>
        <div style="display:flex;gap:6px">
          <button class="btn-toggle-pub ${visible ? 'publicado' : ''}"
            onclick="toggleVisibleCurso('${c.id}', ${visible})"
            title="${visible ? 'Visible en cursos — clic para ocultar' : 'Oculto — clic para mostrar'}">
            <i class="fa-solid ${visible ? 'fa-eye' : 'fa-eye-slash'}"></i>
            ${visible ? 'Visible' : 'Oculto'}
          </button>
          <button class="btn-editar" onclick="abrirModalCurso('${c.id}')">
            <i class="fa-solid fa-pen"></i> Editar
          </button>
          <button class="btn-borrar" onclick="eliminarCurso('${c.id}','${c.nombre?.replace(/'/g,"\\'")}','${c.foto || ''}')" title="Eliminar">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `
    lista.appendChild(card)
  })
}

async function cambiarEstadoCurso(id, nuevoEstado, btn){
  try {
    const sesion = getSesion()
    const res    = await fetch(API, { method:'POST', body:JSON.stringify({ action:'actualizarEstadoCurso', id, estado:nuevoEstado, token:sesion.token }) })
    const data   = await res.json()
    if(data.ok){
      btn.closest('.curso-admin-card').querySelectorAll('.btn-estado-curso').forEach(b => b.classList.remove('activo'))
      btn.classList.add('activo')
      const curso = cursosData.find(c => c.id === id)
      if(curso) curso.estado = nuevoEstado
      const labels = { proximamente:'Próximamente', activo:'Activo', finalizado:'Finalizado' }
      toast(`✅ Curso: ${labels[nuevoEstado]}`, 'ok')
    }
  } catch(e) { toast('❌ Error', 'err') }
}

async function toggleVisibleCurso(id, visibleActual){
  const nuevoValor = visibleActual ? 'false' : 'true'
  try {
    const sesion = getSesion()
    const res    = await fetch(API, { method:'POST', body:JSON.stringify({ action:'actualizarCampo', hoja:'cursos', id, campo:'visible', valor:nuevoValor, token:sesion.token }) })
    const data   = await res.json()
    if(data.ok){
      const curso = cursosData.find(c => c.id === id)
      if(curso) curso.visible = nuevoValor
      renderCursos()
      toast(nuevoValor === 'true' ? '✅ Visible en cursos' : '👁 Oculto de cursos', 'ok')
    }
  } catch(e) { toast('❌ Error', 'err') }
}

// ─────────────────────────────────────────────
// MODAL NUEVO/EDITAR CURSO
// ─────────────────────────────────────────────

let fotoCursoBase64 = null
let editandoCursoId = null

function abrirModalCurso(id = null){
  editandoCursoId = id
  fotoCursoBase64 = null

  const curso = id ? cursosData.find(c => c.id === id) : null
  document.getElementById('modalCursoTitulo').innerText = curso ? '✏️ Editar curso' : '🎓 Nuevo curso'

  // Rellenar campos
  document.getElementById('mCursoNombre').value      = curso?.nombre      || ''
  document.getElementById('mCursoSubtitulo').value   = curso?.subtitulo   || ''
  document.getElementById('mCursoDescripcion').value = curso?.descripcion || ''
  document.getElementById('mCursoDia').value         = curso?.dia         || ''
  document.getElementById('mCursoHorario').value     = curso?.horario     || ''
  document.getElementById('mCursoDuracion').value    = curso?.duracion    || ''
  document.getElementById('mCursoCupo').value        = curso?.cupo        || ''
  document.getElementById('mCursoHojaId').value      = curso?.hojaId      || ''
  document.getElementById('mCursoEstado').value      = curso?.estado      || 'proximamente'
  document.getElementById('mCursoVisible').checked   = curso?.visible !== 'false'

  // Chips y proceso
  const chips = curso?.chips ? curso.chips.split('|').join('\n') : ''
  document.getElementById('mCursoChips').value   = chips

  const proceso = curso?.proceso ? curso.proceso.split('||').map(p => p.replace('|', '|')).join('\n') : ''
  document.getElementById('mCursoProceso').value = proceso

  // Foto
  const fotoActual = curso?.foto || ''
  const fotoArea   = document.getElementById('mCursoFotoArea')
  fotoArea.innerHTML = fotoActual
    ? `<img src="${fotoActual}" style="width:100%;height:100%;object-fit:cover">
       <button class="mform-foto-cambiar" onclick="elegirFotoCurso()" type="button">
         <i class="fa-solid fa-camera"></i> Cambiar
       </button>`
    : `<div class="mform-foto-placeholder" style="aspect-ratio:16/9">
         <i class="fa-solid fa-camera"></i>
         <strong>Tocá para agregar foto</strong>
         <small>Recomendado: 1200×675px (16:9)</small>
       </div>`

  document.getElementById('modalCurso').style.display = 'flex'
}

function cerrarModalCurso(e){
  if(e && e.target !== document.getElementById('modalCurso')) return
  document.getElementById('modalCurso').style.display = 'none'
  fotoCursoBase64 = null
  editandoCursoId = null
}

function elegirFotoCurso(){ document.getElementById('inputFotoCurso').click() }

function previsualizarFotoCurso(e){
  const file = e.target.files[0]
  if(!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    fotoCursoBase64 = ev.target.result
    const area = document.getElementById('mCursoFotoArea')
    area.innerHTML = `
      <img src="${fotoCursoBase64}" style="width:100%;height:100%;object-fit:cover">
      <button class="mform-foto-cambiar" onclick="elegirFotoCurso()" type="button">
        <i class="fa-solid fa-camera"></i> Cambiar
      </button>`
  }
  reader.readAsDataURL(file)
}

function generarHojaId(){
  const nombre = document.getElementById('mCursoNombre').value.trim()
  if(!editandoCursoId && nombre){
    const id = nombre.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim().replace(/\s+/g, '-')
    document.getElementById('mCursoHojaId').value = id
  }
}

async function guardarCurso(){
  const nombre  = document.getElementById('mCursoNombre').value.trim()
  const hojaId  = document.getElementById('mCursoHojaId').value.trim()
  if(!nombre){ toast('El nombre es obligatorio', 'err'); return }
  if(!hojaId){ toast('El ID es obligatorio', 'err'); return }

  const btn = document.getElementById('btnGuardarCurso')
  btn.classList.add('cargando')
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...'

  // Armar chips — convertir líneas a pipe-separated
  const chipsRaw   = document.getElementById('mCursoChips').value.trim()
  const chips      = chipsRaw ? chipsRaw.split('\n').filter(l => l.trim()).join('|') : ''

  // Armar proceso — convertir líneas a doble-pipe-separated
  const procesoRaw = document.getElementById('mCursoProceso').value.trim()
  const proceso    = procesoRaw ? procesoRaw.split('\n').filter(l => l.trim()).join('||') : ''

  const curso = cursosData.find(c => c.id === editandoCursoId)
  const fila  = {
    id:          editandoCursoId || 'CUR-' + Date.now(),
    nombre,
    subtitulo:   document.getElementById('mCursoSubtitulo').value.trim(),
    descripcion: document.getElementById('mCursoDescripcion').value.trim(),
    dia:         document.getElementById('mCursoDia').value.trim(),
    horario:     document.getElementById('mCursoHorario').value.trim(),
    duracion:    document.getElementById('mCursoDuracion').value.trim(),
    cupo:        document.getElementById('mCursoCupo').value.trim(),
    estado:      document.getElementById('mCursoEstado').value,
    hojaId,
    foto:        curso?.foto || '',
    chips,
    proceso,
    visible:     document.getElementById('mCursoVisible').checked ? 'true' : 'false',
    creadoEn:    curso?.creadoEn || new Date().toLocaleDateString('es-AR')
  }

  try {
    const sesion = getSesion()

    // 1. Guardar datos
    const res  = await fetch(API, { method:'POST', body:JSON.stringify({ action:'guardar', hoja:'cursos', fila, token:sesion.token }) })
    const data = await res.json()
    if(!data.ok){ toast('❌ Error al guardar', 'err'); btn.classList.remove('cargando'); btn.innerHTML='<i class="fa-solid fa-floppy-disk"></i> Guardar curso'; return }

    // 2. Subir foto si hay nueva
    if(fotoCursoBase64){
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo foto...'
      await fetch(API, { method:'POST', body:JSON.stringify({ action:'subirFoto', hoja:'cursos', id:fila.id, b64:fotoCursoBase64, nombre:'curso_'+hojaId+'_'+Date.now(), categoria:nombre, token:sesion.token }) })
    }

    cerrarModalCurso()
    cursosData = []
    await cargarCursos()
    toast('✅ Curso guardado correctamente', 'ok')

  } catch(e) { toast('❌ Error de conexión', 'err') }

  btn.classList.remove('cargando')
  btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar curso'
}

function eliminarCurso(id, nombre, fotoUrl){
  borrarItemData = { hoja: 'cursos', id, fotoUrl: fotoUrl || '' }
  const modal    = document.getElementById('modalBorrarItem')
  const btnDrive = document.getElementById('btnBorrarItemDrive')

  // Mostrar opción Drive solo si tiene foto
  btnDrive.style.display = fotoUrl ? 'flex' : 'none'
  document.querySelector('#modalBorrarItem h3').innerText = `🗑 Eliminar "${nombre}"`

  btnDrive.onclick  = () => ejecutarBorrarCurso(id, true)
  document.getElementById('btnBorrarItemWeb').onclick = () => ejecutarBorrarCurso(id, false)

  modal.style.display = 'flex'
}

async function ejecutarBorrarCurso(id, borrarDrive){
  cerrarModalBorrarItem()
  try {
    const sesion = getSesion()
    const curso  = cursosData.find(c => c.id === id)
    const res    = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({
        action:  borrarDrive ? 'eliminarConFoto' : 'eliminar',
        hoja:    'cursos',
        id,
        fotoUrl: curso?.foto || '',
        token:   sesion.token
      })
    })
    const data = await res.json()
    if(data.ok){
      cursosData = []
      await cargarCursos()
      toast(borrarDrive ? '🗑 Curso eliminado de la web y del Drive' : '🗑 Curso eliminado', 'ok')
    }
  } catch(e) { toast('❌ Error', 'err') }
}

// ─────────────────────────────────────────────
// INVENTARIOS PRIVADOS
// ─────────────────────────────────────────────

let inventariosData = []

async function cargarInventarios(){
  if(inventariosData.length > 0){ renderSidebarInventarios(); return }
  try {
    const sesion = getSesion()
    const res    = await fetch(`${API}?action=getInventarios&token=${encodeURIComponent(sesion.token)}`)
    const data   = await res.json()
    inventariosData = (data.data || []).filter(i => i.hojaId !== 'moldes')
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
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('activo'))
  document.getElementById('nav-inv-' + inv.hojaId)?.classList.add('activo')
  document.querySelectorAll('.seccion').forEach(s => s.style.display = 'none')

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
    CATEGORIAS[inv.hojaId] = ['General','Otros']
  }

  sec.style.display = 'block'
  seccionActual = inv.hojaId
  cerrarSidebar()
  if(!cache[inv.hojaId]) cargarSeccion(inv.hojaId)
}

// Modal nuevo inventario
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
    const res    = await fetch(API, { method: 'POST', body: JSON.stringify({ action: 'crearInventario', nombre, prefijo, privado: true, token: sesion.token }) })
    const data   = await res.json()
    if(data.ok){
      cerrarModalInventario()
      inventariosData = []
      await cargarInventarios()
      toast(`✅ Inventario "${nombre}" creado`, 'ok')
      const nuevo = inventariosData.find(i => i.prefijo === prefijo)
      if(nuevo) setSeccionInventario(nuevo)
    } else toast('❌ ' + (data.error || 'Error al crear'), 'err')
  } catch(e) { toast('❌ Error de conexión', 'err') }

  btn.classList.remove('cargando')
  btn.innerHTML = '<i class="fa-solid fa-plus"></i> Crear inventario'
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function formatearFecha(str){
  if(!str) return ''
  if(String(str).includes('T')){
    const d = new Date(str)
    return d.toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' })
  }
  return str
}

function toast(msg, tipo){
  const t = document.getElementById('toast')
  t.innerText = msg
  t.className = 'toast show' + (tipo ? ' ' + tipo : '')
  setTimeout(() => t.classList.remove('show'), 3000)
}
