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
  if(!sesion || (sesion.rol !== 'admin' && sesion.rol !== 'superadmin')){
    window.location.href = '../login/index.html'
    return
  }
  cargarSeccion('piezas')
  cargarInventarios()
  cargarCursosSilencioso()

  // Superadmin: mostrar panel de mantenimiento y cargar estado actual
  if(sesion.rol === 'superadmin'){
    const panelSA = document.getElementById('sidebar-superadmin')
    if(panelSA) panelSA.style.display = ''
    cargarEstadoMantenimiento()
  }
})

async function cargarEstadoMantenimiento(delay = 0){
  try {
    if(delay) await new Promise(r => setTimeout(r, delay))
    const res  = await fetch(API + '?action=getConfigIndex&t=' + Date.now())
    const data = await res.json()
    const sw   = document.getElementById('switchMantenimiento')
    if(sw && data.data) sw.checked = data.data.mantenimiento === 'true'
  } catch(e){}
}

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
// CONVERSIÓN DE IMÁGENES A JPG LIVIANO
// ─────────────────────────────────────────────

function convertirAJpg(b64, calidad){
  calidad = calidad || 0.75
  return new Promise(function(resolve){
    var img = new Image()
    img.onload = function(){
      var canvas = document.createElement('canvas')
      canvas.width  = img.width
      canvas.height = img.height
      var ctx = canvas.getContext('2d')
      // Fondo blanco para imágenes con transparencia (PNG)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', calidad))
    }
    img.onerror = function(){ resolve(b64) } // si falla, usar original
    img.src = b64
  })
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
  if(nombre === 'galeria')      { await cargarGaleria();      return }
  if(nombre === 'elaboracion')  { await cargarElaboracion();  return }
  if(nombre === 'multimedia')   { await cargarMultimediaTabs(); return }
  if(nombre === 'apuntes')      { await cargarApuntesTabs();    return }
  if(nombre === 'suscriptores') { await cargarSuscriptores(); return }
  if(nombre === 'emails')       { await cargarEmails();       return }
  if(nombre === 'notas')        { await cargarNotas();        return }
  if(nombre === 'pastas')       { await cargarPastas();       return }
  if(nombre === 'engobes')      { await cargarEngobes();      return }
  if(nombre === 'piezas')       { cargarConfigPiezas() }
  if(nombre === 'insumos')      { cargarConfigInsumos() }

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
  // Ordenar por código: moldes, inventarios privados, piezas e insumos
  const porCodigo = hoja === 'moldes' || hoja === 'piezas' || hoja === 'insumos' || hoja === 'pastas' || hoja === 'engobes' || (hoja && hoja.endsWith('_inv'))

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
    const nomA = String(a.nombre || a.titulo || '').toLowerCase()
    const nomB = String(b.nombre || b.titulo || '').toLowerCase()
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

  const campo = (hoja === 'apuntes' || hoja === 'multimedia') ? 'curso' : 'categoria'
  const vals  = ['Todos', ...new Set(items.map(i => i[campo]).filter(Boolean))]
  contenedor.innerHTML = ''
  if(!filtroActivo[hoja]) filtroActivo[hoja] = 'Todos'

  vals.forEach(val => {
    let label = val
    if(campo === 'curso' && val !== 'Todos'){
      const cursoObj = cursosData.find(c => c.hojaId === val || c.id === val)
      label = cursoObj ? cursoObj.nombre : (val === 'General' ? 'General' : val)
    }
    const btn = document.createElement('button')
    btn.className = 'admin-filtro-btn' + (val === filtroActivo[hoja] ? ' activo' : '')
    btn.innerText = label
    btn.onclick = () => {
      filtroActivo[hoja] = val
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
  const cards     = document.querySelectorAll(`#grid-${hoja} .item-card, #grid-${hoja} .multimedia-card`)
  const filtraPorCurso = hoja === 'apuntes' || hoja === 'multimedia'
  let visibles    = 0

  cards.forEach(card => {
    const nombre    = (card.querySelector('.item-card-nombre')?.innerText || card.querySelector('.multimedia-card-titulo')?.innerText || '').toLowerCase()
    const categoria = (card.querySelector('.item-card-cat')?.innerText    || '')
    const codigo    = (card.querySelector('.item-card-codigo')?.innerText  || '').toLowerCase()
    const publicado = card.dataset.publicado === 'true'
    const cursoCard = card.dataset.curso || ''

    const matchCat  = catActiva === 'Todos' || (filtraPorCurso ? cursoCard === catActiva : categoria === catActiva)
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
  apuntes: ['General'],
  pastas:  []   // Sin categorías fijas — se ordena por nombre
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
    const esApunte  = hoja === 'apuntes' || hoja === 'apuntes_ceramistas'
    const mostrarPub = !esMolde
    const icono     = hoja === 'insumos' ? 'fa-flask' : hoja === 'moldes' ? 'fa-layer-group' : esApunte ? 'fa-book-open' : 'fa-jar'

    const card = document.createElement('div')
    card.className = 'item-card'
    card.dataset.publicado = publicado

    card.innerHTML = `
      <div class="item-card-img">
        ${(esApunte ? item.miniatura : item.foto)
          ? `<img src="${esApunte ? item.miniatura : item.foto}" alt="${item.nombre || item.titulo || ''}" loading="lazy">`
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
    // Para ceramistas usar acción específica
    let body
    if(hoja === 'apuntes_ceramistas'){
      body = JSON.stringify({ action: 'eliminarApunteCeramista', id, token: sesion.token })
    } else if(hoja === 'multimedia_ceramistas'){
      body = JSON.stringify({ action: 'eliminarMultimediaCeramista', id, token: sesion.token })
    } else {
      body = JSON.stringify({ action: borrarDrive ? 'eliminarConFoto' : 'eliminar', hoja, id, fotoUrl, token: sesion.token })
    }
    const res  = await fetch(API, { method: 'POST', body })
    const data = await res.json()
    if(data.ok){
      delete cache[hoja]
      await cargarSeccion(hoja)
      toast('🗑 Eliminado', 'ok')
    } else toast('❌ Error al eliminar', 'err')
  } catch(e) { toast('❌ Error de conexión', 'err') }
}

// ─────────────────────────────────────────────
// FOTO EN ITEMS
// ─────────────────────────────────────────────

let fotoModalBase64  = null
let fotosExtra       = { foto2: null, foto3: null, foto4: null }
let fotoModalNombre = null

function elegirFotoModal(){
  document.getElementById('inputFotoModal').click()
}

function previsualizarFoto(e){
  const file = e.target.files[0]
  if(!file) return
  fotoModalNombre = file.name.split('.')[0]
  const reader = new FileReader()
  reader.onload = async (ev) => {
    fotoModalBase64 = await convertirAJpg(ev.target.result)
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
    const b64Raw = await fileToBase64(file)
    const b64    = await convertirAJpg(b64Raw)
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
  fotosExtra        = { foto2: null, foto3: null, foto4: null }

  const esApuntes = hoja === 'apuntes' || hoja === 'apuntes_ceramistas'
  const esMoldes  = hoja === 'moldes' || hoja.endsWith('_inv')
  const esPiezas  = hoja === 'piezas'
  const esInsumos = hoja === 'insumos'
  const esPastas  = hoja === 'pastas'
  const esEngobes = hoja === 'engobes'

  document.getElementById('modalTitulo').innerText = item
    ? `Editar ${esApuntes ? 'apunte' : esPastas ? 'pasta' : esEngobes ? 'engobe' : 'item'}`
    : `Nuevo ${esPastas ? 'pasta' : esEngobes ? 'engobe' : esApuntes ? 'apunte' : 'item'}`

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

  const conFotosExtra  = !esApuntes && !esPastas && !esEngobes
  const bloqFotosExtra = conFotosExtra ? (() => {
    const slots = [2,3,4].map(n => {
      const fUrl = (item && item['foto'+n]) || ''
      const img  = fUrl
        ? '<img src="'+fUrl+'" class="mform-foto-extra-img">'
          + '<button class="mform-foto-extra-quitar" onclick="event.stopPropagation();quitarFotoExtra('+n+')" type="button">×</button>'
        : '<div class="mform-foto-extra-placeholder"><i class="fa-solid fa-plus"></i><span>Foto '+(n-1)+'</span></div>'
      return '<div class="mform-foto-extra-slot" id="mFotoExtraSlot'+n+'" onclick="elegirFotoExtra('+n+')">'+img+'</div>'
    }).join('')
    return '<div class="mform-grupo mform-fotos-extra">'
      + '<label>📷 Fotos adicionales <small style="opacity:0.5;font-weight:400">(hasta 3 fotos extra)</small></label>'
      + '<div class="mform-fotos-extra-grid">'+slots+'</div>'
      + '<input type="file" id="mFotoExtraInput" accept="image/*" style="display:none" onchange="onFotoExtraChange(this)">'
      + '</div>'
  })() : ''

  let html = bloqFoto

  if(esApuntes){
    const esCeramistas = hoja === 'apuntes_ceramistas'
    html = `
      <div class="mform-grupo">
        <label>Título *</label>
        <input id="mTitulo" value="${item?.titulo || ''}" placeholder="Título del apunte">
      </div>
      ${!esCeramistas ? `
      <div class="mform-grupo">
        <label>Curso</label>
        <select id="mCategoria">
          <option value="">Seleccioná</option>
          ${cursosOps}
          <option value="General" ${item?.curso === 'General' ? 'selected' : ''}>General (todos los alumnos)</option>
        </select>
      </div>` : '<input type="hidden" id="mCategoria" value="">'}
      <div class="mform-grupo">
        <label>Contenido</label>
        <textarea id="mContenido" rows="5" placeholder="Escribí el contenido...">${item?.contenido || ''}</textarea>
      </div>
      <div class="mform-grupo">
        <label>📎 PDF</label>
        <div class="apunte-pdf-area">
          <div class="apunte-pdf-fila">
            <span class="apunte-pdf-label">Subir desde PC</span>
            <button class="email-pdf-btn" type="button" onclick="elegirPdfApunte()">
              <i class="fa-solid fa-upload"></i> Elegir PDF
            </button>
            <span class="email-pdf-nombre" id="apuntePdfNombre">${item?.archivoUrl ? '✅ PDF cargado' : ''}</span>
          </div>
          <div class="apunte-pdf-fila">
            <span class="apunte-pdf-label">O pegar link</span>
            <input id="mArchivoUrl" value="${item?.archivoUrl || ''}" placeholder="https://drive.google.com/...">
          </div>
        </div>
      </div>
      <div class="mform-grupo">
        <label>🖼 Miniatura <span style="font-weight:400;opacity:0.5;font-size:12px">(opcional — si no elegís se muestra el PDF)</span></label>
        <div class="apunte-miniatura-area" id="apunteMiniaturaArea" onclick="elegirMiniaturaApunte()">
          ${item?.miniatura
            ? `<img src="${item.miniatura}" style="width:100%;height:100%;object-fit:cover;border-radius:10px">`
            : `<div class="email-img-placeholder"><i class="fa-solid fa-image"></i><span>Tocá para subir miniatura</span></div>`
          }
        </div>
        ${item?.miniatura ? `<button class="email-quitar-btn" id="apunteMiniaturaQuitar" onclick="quitarMiniaturaApunte()"><i class="fa-solid fa-xmark"></i> Quitar miniatura</button>` : `<button class="email-quitar-btn" id="apunteMiniaturaQuitar" style="display:none" onclick="quitarMiniaturaApunte()"><i class="fa-solid fa-xmark"></i> Quitar miniatura</button>`}
      </div>
      <label class="publicado-toggle">
        <input type="checkbox" id="mPublicado" ${(item?.publicado === true || item?.publicado === 'TRUE' || item?.publicado === 'true') ? 'checked' : ''}>
        <span>✅ Visible para ${modalHoja === 'apuntes_ceramistas' ? 'ceramistas' : 'los alumnos'}</span>
      </label>
    `
  } else if(esEngobes){
    // Parsear componentes existentes
    let compExistentes = []
    try { compExistentes = JSON.parse(item?.componentes || '[]') } catch(e){}
    const compHtml = compExistentes.length > 0
      ? compExistentes.map((c,i) => `
          <div class="pasta-comp-fila engobe-comp-fila" id="pcomp-${i}">
            <input class="pasta-comp-nombre" type="text" placeholder="Ingrediente" value="${c.nombre||''}" oninput="recalcularEngobes()">
            <input class="pasta-comp-pct engobe-valor" type="number" min="0" step="0.1" placeholder="0" value="${c.valor||c.porcentaje||0}" oninput="recalcularEngobes()">
            <select class="engobe-unidad" onchange="recalcularEngobes()">
              <option value="%" ${(c.unidad||'%')==='%' ? 'selected' : ''}>%</option>
              <option value="g"  ${c.unidad==='g' ? 'selected' : ''}>g</option>
            </select>
            <button class="pasta-btn-quitar" onclick="quitarComponente(this)" type="button"><i class="fa-solid fa-xmark"></i></button>
          </div>`).join('')
      : ''
    html += `
      <div class="mform-fila">
        <div class="mform-grupo">
          <label>Código</label>
          <div class="mform-codigo-wrapper">
            <input id="mCodigo" value="${item?.codigo || ''}" placeholder="Auto">
            <button class="btn-generar-codigo" onclick="generarCodigoEngobe()" type="button">↺ Auto</button>
          </div>
        </div>
        <div class="mform-grupo">
          <label>Nombre del engobe *</label>
          <input id="mNombre" value="${item?.nombre || ''}" placeholder="Ej: Engobe blanco base, Engobe negro...">
        </div>
      </div>
      <div class="mform-grupo">
        <label>Descripción <small style="opacity:0.5;font-weight:400">(opcional)</small></label>
        <textarea id="mDescripcion" rows="2" placeholder="Características, temperatura, notas...">${item?.descripcion || ''}</textarea>
      </div>
      <div class="mform-grupo">
        <label>Componentes <span id="pastaTotalLabel" style="font-size:12px;font-weight:700;margin-left:8px;color:#c85028"></span></label>
        <div class="pasta-comp-headers">
          <span>Ingrediente</span><span>%</span>
        </div>
        <div id="pastaComponentes">${compHtml}</div>
        <div class="pasta-comp-agregar">
          <div class="pasta-ingredientes-predefinidos">
            ${['Arcilla','Agua','Fundente','Colorante']
              .map(ing => `<button class="pasta-ing-btn" onclick="agregarEngobeComponente('${ing}')" type="button">${ing}</button>`)
              .join('')}
          </div>
          <button class="pasta-btn-agregar" onclick="agregarEngobeComponente('')" type="button">
            <i class="fa-solid fa-plus"></i> Agregar otro
          </button>
        </div>
      </div>
      <label class="publicado-toggle">
        <input type="checkbox" id="mPublicado" ${(item?.publicado === true || item?.publicado === 'TRUE' || item?.publicado === 'true') ? 'checked' : ''}>
        <span>✅ Visible en la web</span>
      </label>
    `
  } else if(esPastas){
    // Parsear componentes existentes
    let compExistentes = []
    try { compExistentes = JSON.parse(item?.componentes || '[]') } catch(e){}
    const compHtml = compExistentes.length > 0
      ? compExistentes.map((c,i) => `
          <div class="pasta-comp-fila" id="pcomp-${i}">
            <input class="pasta-comp-nombre" type="text" placeholder="Ej: Caolín" value="${c.nombre||''}" oninput="recalcularPorcentajes()">
            <input class="pasta-comp-pct" type="number" min="0" max="100" step="1" placeholder="%" value="${c.porcentaje||0}" oninput="recalcularPorcentajes()">
            <span class="pasta-comp-pct-label">%</span>
            <button class="pasta-btn-quitar" onclick="quitarComponente(this)" type="button"><i class="fa-solid fa-xmark"></i></button>
          </div>`).join('')
      : ''
    html += `
      <div class="mform-fila">
        <div class="mform-grupo">
          <label>Código</label>
          <div class="mform-codigo-wrapper">
            <input id="mCodigo" value="${item?.codigo || ''}" placeholder="Auto">
            <button class="btn-generar-codigo" onclick="generarCodigoPasta()" type="button">↺ Auto</button>
          </div>
        </div>
        <div class="mform-grupo">
          <label>Nombre de la pasta *</label>
          <input id="mNombre" value="${item?.nombre || ''}" placeholder="Ej: Stoneware blanco, Porcelana...">
        </div>
      </div>
      <div class="mform-grupo">
        <label>Descripción <small style="opacity:0.5;font-weight:400">(opcional)</small></label>
        <textarea id="mDescripcion" rows="2" placeholder="Características, temperatura de cocción...">${item?.descripcion || ''}</textarea>
      </div>
      <div class="mform-grupo">
        <label>Componentes <span id="pastaTotalLabel" style="font-size:12px;font-weight:700;margin-left:8px;color:#c85028"></span></label>
        <div class="pasta-comp-headers">
          <span>Ingrediente</span><span>%</span>
        </div>
        <div id="pastaComponentes">${compHtml}</div>
        <div class="pasta-comp-agregar">
          <div class="pasta-ingredientes-predefinidos">
            ${['Caolín','Talco','Tinkar','APM','Arena','Chamote','Perlita','Vermiculita','Hierro','Manganeso','Óxido de cobre','Feldespato','Cuarzo','Cobalto','Carbonato de calcio','Dolomita']
              .map(ing => `<button class="pasta-ing-btn" onclick="agregarComponentePredefinido('${ing}')" type="button">${ing}</button>`)
              .join('')}
          </div>
          <button class="pasta-btn-agregar" onclick="agregarComponenteLibre()" type="button">
            <i class="fa-solid fa-plus"></i> Agregar otro
          </button>
        </div>
      </div>
      <label class="publicado-toggle">
        <input type="checkbox" id="mPublicado" ${(item?.publicado === true || item?.publicado === 'TRUE' || item?.publicado === 'true') ? 'checked' : ''}>
        <span>✅ Visible en la web</span>
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
      html += bloqFotosExtra
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
      html += bloqFotosExtra
    }
  }

  document.getElementById('modalBody').innerHTML = html
  document.getElementById('modalOverlay').style.display = 'flex'

  if(!item && !esApuntes && !esPastas) setTimeout(() => generarCodigo(), 100)
  if(!item && esPastas)  setTimeout(() => generarCodigoPasta(), 100)
  if(!item && esEngobes) setTimeout(() => generarCodigoEngobe(), 100)
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
// FOTOS EXTRA
// ─────────────────────────────────────────────

let _fotoExtraSlot = 2

function elegirFotoExtra(n){
  _fotoExtraSlot = n
  document.getElementById('mFotoExtraInput').click()
}

function onFotoExtraChange(input){
  const file = input.files[0]
  if(!file) return
  const n = _fotoExtraSlot
  const reader = new FileReader()
  reader.onload = async e => {
    const b64  = await convertirAJpg(e.target.result)
    fotosExtra['foto'+n] = b64
    const slot = document.getElementById('mFotoExtraSlot'+n)
    if(slot){
      slot.innerHTML = '<img src="'+b64+'" class="mform-foto-extra-img">'
        + '<button class="mform-foto-extra-quitar" onclick="event.stopPropagation();quitarFotoExtra('+n+')" type="button">×</button>'
    }
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function quitarFotoExtra(n){
  fotosExtra['foto'+n]    = null
  fotosExtra['_borrar'+n] = true
  const slot = document.getElementById('mFotoExtraSlot'+n)
  if(slot){
    slot.innerHTML = '<div class="mform-foto-extra-placeholder"><i class="fa-solid fa-plus"></i><span>Foto '+(n-1)+'</span></div>'
  }
}

// TOGGLES CONFIG PIEZAS
// ─────────────────────────────────────────────

async function cargarConfigPiezas(){
  try {
    const res  = await fetch(API + '?action=getConfigIndex')
    const data = await res.json()
    const cfg  = data.data || {}
    const sw1  = document.getElementById('switchMostrarPrecio')
    const sw2  = document.getElementById('switchMostrarStock')
    const sw3  = document.getElementById('switchPermitirCantidad')
    if(sw1) sw1.checked = cfg.piezas_mostrar_precio   === 'true'
    if(sw2) sw2.checked = cfg.piezas_mostrar_stock     === 'true'
    if(sw3) sw3.checked = cfg.piezas_permitir_cantidad === 'true'
  } catch(e){}
}

async function toggleConfigPiezas(clave, valor){
  try {
    const sesion = getSesion()
    const id = clave === 'piezas_mostrar_precio'   ? 'CFG-precio'   :
               clave === 'piezas_mostrar_stock'     ? 'CFG-stock'    : 'CFG-cantidad'
    await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'guardar', hoja: 'config_index',
        fila: { id, clave, valor: valor ? 'true' : 'false',
                creadoEn: new Date().toLocaleDateString('es-AR') },
        token: sesion.token })
    })
    toast(valor ? '✅ Activado' : '⭕ Desactivado', 'ok')
  } catch(e){ toast('❌ Error al guardar', 'err') }
}

// TOGGLES CONFIG INSUMOS
// ─────────────────────────────────────────────

async function cargarConfigInsumos(){
  try {
    const res  = await fetch(API + '?action=getConfigIndex')
    const data = await res.json()
    const cfg  = data.data || {}
    const sw1  = document.getElementById('switchInsumoMostrarPrecio')
    const sw2  = document.getElementById('switchInsumoMostrarStock')
    const sw3  = document.getElementById('switchInsumoPermitirCantidad')
    if(sw1) sw1.checked = cfg.insumos_mostrar_precio    === 'true'
    if(sw2) sw2.checked = cfg.insumos_mostrar_stock      === 'true'
    if(sw3) sw3.checked = cfg.insumos_permitir_cantidad  === 'true'
  } catch(e){}
}

async function toggleConfigInsumos(clave, valor){
  try {
    const sesion = getSesion()
    const id = clave === 'insumos_mostrar_precio'    ? 'CFG-ins-precio'   :
               clave === 'insumos_mostrar_stock'      ? 'CFG-ins-stock'    : 'CFG-ins-cantidad'
    await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'guardar', hoja: 'config_index',
        fila: { id, clave, valor: valor ? 'true' : 'false',
                creadoEn: new Date().toLocaleDateString('es-AR') },
        token: sesion.token })
    })
    toast(valor ? '✅ Activado' : '⭕ Desactivado', 'ok')
  } catch(e){ toast('❌ Error al guardar', 'err') }
}

// CÓDIGO AUTOMÁTICO
// ─────────────────────────────────────────────

async function generarCodigo(){
  const catEl = document.getElementById('mCategoria')
  const codEl = document.getElementById('mCodigo')
  if(!catEl || !codEl) return
  const cat = catEl.value
  if(!cat) return

  // Si el inventario tiene prefijo custom, usarlo directamente
  if(PREFIJOS_CUSTOM[modalHoja]){
    try {
      const res  = await fetch(`${API}?action=siguienteCodigo&hoja=${modalHoja}&categoria=${encodeURIComponent(PREFIJOS_CUSTOM[modalHoja])}`)
      const data = await res.json()
      if(data.codigo) codEl.value = data.codigo
    } catch(e) {}
    return
  }

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

    // Si es apunte — subir PDF y/o miniatura antes de guardar
    if(modalHoja === 'apuntes' || modalHoja === 'apuntes_ceramistas'){
      if(apuntePdfB64){
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo PDF...'
        try {
          const resPdf = await fetch(API, {
            method: 'POST',
            body: JSON.stringify({ action: modalHoja === 'apuntes_ceramistas' ? 'subirPdfApunteCeramista' : 'subirPdfApunte', b64: apuntePdfB64, nombre: apuntePdfNombreStr, token: sesion.token })
          })
          const dataPdf = await resPdf.json()
          if(dataPdf.ok && dataPdf.url) fila.archivoUrl = dataPdf.url
        } catch(e) {}
        apuntePdfB64 = null
        apuntePdfNombreStr = ''
      }
      if(apunteMiniaturaB64){
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo miniatura...'
        try {
          const resMin = await fetch(API, {
            method: 'POST',
            body: JSON.stringify({ action: modalHoja === 'apuntes_ceramistas' ? 'subirMiniaturaCeramista' : 'subirMiniaturaApunte', b64: apunteMiniaturaB64, nombre: 'miniatura_' + Date.now(), token: sesion.token })
          })
          const dataMin = await resMin.json()
          if(dataMin.ok && dataMin.url){
            fila.miniatura = dataMin.url
          } else {
            toast('⚠️ Error al subir miniatura: ' + (dataMin.error || 'sin respuesta'), 'err')
          }
        } catch(e) { toast('⚠️ Error al subir miniatura: ' + e.message, 'err') }
        apunteMiniaturaB64 = null
      }
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...'
    }

    // Para apuntes/multimedia ceramistas usar acción específica
    const accionGuardar = modalHoja === 'apuntes_ceramistas' ? 'guardarApunteCeramista'
      : modalHoja === 'pastas'  ? 'guardarPasta'
      : modalHoja === 'engobes' ? 'guardarEngobe'
      : 'guardar'
    const bodyGuardar   = (modalHoja === 'apuntes_ceramistas')
      ? JSON.stringify({ action: accionGuardar, fila, token: sesion.token })
      : (modalHoja === 'pastas' || modalHoja === 'engobes')
      ? JSON.stringify({ action: accionGuardar, fila, token: sesion.token })
      : JSON.stringify({ action: accionGuardar, hoja: modalHoja, fila, token: sesion.token })
    const res  = await fetch(API, {
      method: 'POST',
      body: bodyGuardar
    })
    const data = await res.json()

    if(!data.ok){ toast('❌ ' + (data.error || 'Error al guardar'), 'err'); btn.classList.remove('cargando'); btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar'; return }

    // Subir foto en segundo plano — el modal se cierra al instante
    if(fotoModalBase64 && modalHoja !== 'apuntes'){
      const nombre    = (fila.codigo || fila.id) + '_' + Date.now()
      const b64       = fotoModalBase64
      const hojaGuard = modalHoja
      const idGuard   = fila.id
      const catGuard  = fila.categoria || ''
      const sesionTok = sesion.token

      // No esperamos — se sube en background
      fetch(API, {
        method: 'POST',
        body: JSON.stringify({ action: 'subirFoto', hoja: hojaGuard, id: idGuard, b64, nombre, categoria: catGuard, token: sesionTok })
      }).then(r => r.json()).then(d => {
        if(d.ok){
          // Actualizar la tarjeta con la foto cuando esté lista
          delete cache[hojaGuard]
          cargarSeccion(hojaGuard)
          toast('✅ Foto subida correctamente', 'ok')
        }
      }).catch(() => {})
    }

    ;[2,3,4].forEach(n => {
      const b64e = fotosExtra['foto'+n]
      if(b64e){
        const nomE = (fila.codigo||fila.id)+'_foto'+n+'_'+Date.now()
        fetch(API, { method:'POST', body:JSON.stringify({
          action:'subirFoto', hoja:modalHoja, id:fila.id,
          b64:b64e, nombre:nomE, campo:'foto'+n,
          categoria:fila.categoria||'', token:sesion.token
        })}).catch(()=>{})
      }
    })
    delete cache[modalHoja]
    cerrarModal()
    await cargarSeccion(modalHoja)
    toast('✅ Guardado — la foto se sube en segundo plano', 'ok')

  } catch(e) {
    toast('❌ Error de conexión', 'err')
  }

  btn.classList.remove('cargando')
  btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar'
}

function construirFila(){
  const id   = modalItem?.id || (modalHoja.toUpperCase().slice(0,3) + '-' + Date.now())
  const hoja = modalHoja

  if(hoja === 'apuntes' || hoja === 'apuntes_ceramistas'){
    const titulo = document.getElementById('mTitulo')?.value.trim()
    if(!titulo){ toast('El título es obligatorio', 'err'); return null }
    const esCer = hoja === 'apuntes_ceramistas'
    return {
      id, titulo,
      curso:       esCer ? '' : (document.getElementById('mCategoria')?.value || ''),
      descripcion: esCer ? (document.getElementById('mContenido')?.value.trim() || '') : '',
      contenido:   esCer ? '' : (document.getElementById('mContenido')?.value.trim() || ''),
      archivoUrl:  document.getElementById('mArchivoUrl')?.value.trim() || '',
      miniatura:   modalItem?.miniatura || '',
      publicado:   document.getElementById('mPublicado')?.checked ? 'true' : 'false',
      creadoEn:    modalItem?.creadoEn || new Date().toLocaleDateString('es-AR')
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
    foto2:       fotosExtra._borrar2 ? '' : (modalItem?.foto2 || ''),
    foto3:       fotosExtra._borrar3 ? '' : (modalItem?.foto3 || ''),
    foto4:       fotosExtra._borrar4 ? '' : (modalItem?.foto4 || ''),
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

  if(hoja === 'engobes'){
    const componentes = leerComponentes()
    const total = componentes.reduce((s, c) => s + c.porcentaje, 0)
    return {
      id,
      codigo:      document.getElementById('mCodigo')?.value.trim() || '',
      nombre,
      descripcion: document.getElementById('mDescripcion')?.value.trim() || '',
      componentes: JSON.stringify(componentes),
      foto:        modalItem?.foto || '',
      publicado:   document.getElementById('mPublicado')?.checked ? 'true' : 'false',
      creadoEn:    modalItem?.creadoEn || new Date().toLocaleDateString('es-AR')
    }
  }

  if(hoja === 'pastas'){
    const componentes = leerComponentes()
    const total = componentes.reduce((s, c) => s + c.porcentaje, 0)
    // Permitir fórmulas que superen 100% (cargas sobre base)
    // El cálculo se normaliza al momento de preparar
    return {
      id,
      codigo:      document.getElementById('mCodigo')?.value.trim() || '',
      nombre,
      descripcion: document.getElementById('mDescripcion')?.value.trim() || '',
      componentes: JSON.stringify(componentes),
      foto:        modalItem?.foto || '',
      publicado:   document.getElementById('mPublicado')?.checked ? 'true' : 'false',
      creadoEn:    modalItem?.creadoEn || new Date().toLocaleDateString('es-AR')
    }
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
// CÓDIGO DE PASTAS
// ─────────────────────────────────────────────

async function generarCodigoPasta(){
  const codEl = document.getElementById('mCodigo')
  if(!codEl) return
  try {
    const res  = await fetch(`${API}?action=siguienteCodigo&hoja=pastas&categoria=PAS`)
    const data = await res.json()
    if(data.codigo) codEl.value = data.codigo
  } catch(e){}
}

async function generarCodigoEngobe(){
  const codEl = document.getElementById('mCodigo')
  if(!codEl) return
  try {
    const res  = await fetch(`${API}?action=siguienteCodigo&hoja=engobes&categoria=ENG`)
    const data = await res.json()
    if(data.codigo) codEl.value = data.codigo
  } catch(e){}
}

// ─────────────────────────────────────────────
// COMPONENTES DE PASTAS
// ─────────────────────────────────────────────

function agregarComponentePredefinido(nombre){
  const cont = document.getElementById('pastaComponentes')
  if(!cont) return
  const idx = cont.children.length
  const div = document.createElement('div')
  div.className = 'pasta-comp-fila'
  div.id = `pcomp-${idx}`
  div.innerHTML = `
    <input class="pasta-comp-nombre" type="text" placeholder="Ej: Caolín" value="${nombre}" oninput="recalcularPorcentajes()">
    <input class="pasta-comp-pct" type="number" min="0" max="100" step="1" placeholder="%" value="0" oninput="recalcularPorcentajes()">
    <span class="pasta-comp-pct-label">%</span>
    <button class="pasta-btn-quitar" onclick="quitarComponente(this)" type="button"><i class="fa-solid fa-xmark"></i></button>
  `
  cont.appendChild(div)
  recalcularPorcentajes()
}

function agregarComponenteLibre(){
  agregarComponentePredefinido('')
  // Enfocar el input de nombre del último componente
  const cont  = document.getElementById('pastaComponentes')
  const filas = cont?.querySelectorAll('.pasta-comp-nombre')
  if(filas?.length) filas[filas.length - 1].focus()
}

function quitarComponente(btn){
  btn.closest('.pasta-comp-fila').remove()
  recalcularPorcentajes()
}

function leerComponentes(){
  const filas = document.querySelectorAll('#pastaComponentes .pasta-comp-fila')
  const comp  = []
  filas.forEach(fila => {
    const nombre  = fila.querySelector('.pasta-comp-nombre')?.value.trim()
    const esEngobe = fila.classList.contains('engobe-comp-fila')
    if(false){ // engobe-unidad eliminado, usa la rama estándar
    } else {
      const pct = parseFloat(fila.querySelector('.pasta-comp-pct')?.value) || 0
      if(nombre) comp.push({ nombre, porcentaje: pct })
    }
  })
  return comp
}

function recalcularPorcentajes(){
  const comp  = leerComponentes()
  const total = comp.reduce((s, c) => s + c.porcentaje, 0)
  const label = document.getElementById('pastaTotalLabel')
  if(!label) return
  if(total === 100){
    label.style.color = '#2d7a2d'
    label.innerText   = '✅ 100%'
  } else if(total < 100){
    label.style.color = '#c85028'
    label.innerText   = `⚠️ ${total}% (falta ${100 - total}%)`
  } else {
    label.style.color = 'var(--color-primario)'
    label.innerText   = `✅ ${total}% (base + ${total - 100}% cargas)`
  }
}

// ─────────────────────────────────────────────
// COMPONENTES DE ENGOBES
// ─────────────────────────────────────────────

function agregarEngobeComponente(nombre){
  const cont = document.getElementById('pastaComponentes')
  if(!cont) return
  const div = document.createElement('div')
  div.className = 'pasta-comp-fila'
  div.innerHTML = `
    <input class="pasta-comp-nombre" type="text" placeholder="Ej: Arcilla" value="${nombre}" oninput="recalcularEngobes()">
    <input class="pasta-comp-pct" type="number" min="0" max="200" step="1" placeholder="%" value="0" oninput="recalcularEngobes()">
    <span class="pasta-comp-pct-label">%</span>
    <button class="pasta-btn-quitar" onclick="quitarComponente(this)" type="button"><i class="fa-solid fa-xmark"></i></button>
  `
  cont.appendChild(div)
  div.querySelector('.pasta-comp-nombre')?.focus()
  recalcularEngobes()
}

function recalcularEngobes(){
  const filas = document.querySelectorAll('#pastaComponentes .pasta-comp-fila')
  const label = document.getElementById('pastaTotalLabel')
  if(!label) return
  let total = 0
  filas.forEach(fila => {
    total += parseFloat(fila.querySelector('.pasta-comp-pct')?.value) || 0
  })
  if(total === 100){
    label.style.color = '#2d7a2d'
    label.innerText   = '✅ 100%'
  } else if(total < 100){
    label.style.color = '#c85028'
    label.innerText   = `⚠️ ${total}% (falta ${100 - total}%)`
  } else {
    label.style.color = 'var(--color-primario)'
    label.innerText   = `✅ ${total}% (base + ${total - 100}% cargas)`
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
// ELABORACIÓN
// ─────────────────────────────────────────────

let elaboracionData = []

async function cargarElaboracion(){
  const loading = document.getElementById('loading-elaboracion')
  loading.style.display = 'block'

  try {
    const sesion = getSesion()

    // Cargar slots y config en paralelo
    const [resSlots, resConfig] = await Promise.all([
      fetch(`${API}?action=getAll&hoja=elaboracion&token=${encodeURIComponent(sesion.token)}`),
      fetch(`${API}?action=getConfigIndex`)
    ])

    const dataSlots  = await resSlots.json()
    const dataConfig = await resConfig.json()

    elaboracionData = dataSlots.data || []

    // Actualizar switch — maneja 'true','false','0','1',true,false
    const val     = String(dataConfig.data?.elaboracion_visible ?? 'true')
    const visible = val !== 'false' && val !== '0'
    document.getElementById('switchElaboracionVisible').checked = visible

    renderElaboracion()
  } catch(e) { toast('❌ Error al cargar elaboración', 'err') }

  loading.style.display = 'none'
}

function renderElaboracion(){
  const gridEtapas = document.getElementById('grid-elaboracion-etapas')
  const gridTaller = document.getElementById('grid-elaboracion-taller')
  gridEtapas.innerHTML = ''
  gridTaller.innerHTML = ''

  const etapas = [1,2,3,4,5,6].map(n =>
    elaboracionData.find(s => s.seccion === 'etapa' && String(s.slot) === String(n)) ||
    { id: 'ELAB-' + n, seccion: 'etapa', slot: n, foto: '', descripcion: '' }
  )

  const taller = [1,2,3,4,5,6].map(n =>
    elaboracionData.find(s => s.seccion === 'taller' && String(s.slot) === String(n)) ||
    { id: 'TALL-' + n, seccion: 'taller', slot: n, foto: '', descripcion: '' }
  )

  const titulos = [
    'Preparación de la arcilla',
    'Modelado en torno',
    'Trabajo con moldes',
    'Secado y retoque',
    'Esmaltado y decoración',
    'Horneado'
  ]

  etapas.forEach((slot, i) => {
    gridEtapas.appendChild(crearSlotElaboracion(slot, `Etapa ${i+1} — ${titulos[i]}`))
  })

  taller.forEach((slot, i) => {
    gridTaller.appendChild(crearSlotElaboracion(slot, `Foto del taller ${i+1}`))
  })
}

function crearSlotElaboracion(slot, label){
  const div = document.createElement('div')
  div.className = 'elaboracion-slot'
  div.innerHTML = `
    <div class="elaboracion-slot-img" onclick="subirFotoElaboracion('${slot.id}', '${slot.seccion}', ${slot.slot})">
      ${slot.foto
        ? `<img src="${slot.foto}" alt="${label}" loading="lazy">`
        : `<div class="elaboracion-slot-placeholder">
             <i class="fa-solid fa-camera"></i>
             <span>${slot.descripcion || 'Sin foto — tocá para agregar'}</span>
           </div>`
      }
      <div class="elaboracion-slot-overlay">
        <button class="elaboracion-slot-cambiar" type="button">
          <i class="fa-solid fa-camera"></i>
          ${slot.foto ? 'Cambiar foto' : 'Agregar foto'}
        </button>
      </div>
    </div>
    <div class="elaboracion-slot-body">
      <div class="elaboracion-slot-num">${label}</div>
      ${slot.descripcion ? `<div class="elaboracion-slot-desc">📸 ${slot.descripcion}</div>` : ''}
      ${slot.foto ? `
        <button class="btn-borrar-elab" onclick="borrarFotoElaboracion('${slot.id}', '${slot.foto}')">
          <i class="fa-solid fa-trash"></i> Borrar foto
        </button>` : ''}
    </div>
  `
  return div
}

async function borrarFotoElaboracion(id, fotoUrl){
  // Reusar el modal de borrar multimedia
  const modal = document.getElementById('modalBorrarMultimedia')
  document.querySelector('#modalBorrarMultimedia h3').innerText = '🗑 Borrar foto'
  document.getElementById('btnBorrarConDrive').style.display = 'flex'

  document.getElementById('btnBorrarConDrive').onclick = () => ejecutarBorrarElaboracion(id, fotoUrl, true)
  document.getElementById('btnBorrarSoloWeb').onclick  = () => ejecutarBorrarElaboracion(id, fotoUrl, false)

  modal.style.display = 'flex'
}

async function ejecutarBorrarElaboracion(id, fotoUrl, borrarDrive){
  document.getElementById('modalBorrarMultimedia').style.display = 'none'
  try {
    const sesion = getSesion()
    // Siempre usamos borrarFotoSlot — solo vacía el campo foto, nunca borra la fila
    const res  = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({
        action:  borrarDrive ? 'borrarFotoSlot' : 'actualizarCampo',
        hoja:    'elaboracion',
        id,
        fotoUrl, // usado por borrarFotoSlot para borrar del Drive
        campo:   'foto', // usado por actualizarCampo
        valor:   '',     // usado por actualizarCampo
        token:   sesion.token
      })
    })
    const data = await res.json()
    if(data.ok){
      elaboracionData = []
      await cargarElaboracion()
      toast(borrarDrive ? '🗑 Foto borrada de la web y del Drive' : '🗑 Foto borrada de la web', 'ok')
    }
  } catch(e) { toast('❌ Error', 'err') }
}

function subirFotoElaboracion(id, seccion, slot){
  const input  = document.createElement('input')
  input.type   = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if(!file) return

    if(file.size > 1.5 * 1024 * 1024){
      toast('⚠️ La foto pesa más de 1.5MB — puede cargar lento', '')
    }

    toast('⏳ Subiendo foto...', '')
    const b64Raw = await fileToBase64(file)
    const b64    = await convertirAJpg(b64Raw)

    try {
      const sesion = getSesion()
      const res    = await fetch(API, {
        method: 'POST',
        body: JSON.stringify({
          action: 'subirFoto',
          hoja:   'elaboracion',
          id,
          b64,
          nombre: 'elaboracion_' + seccion + '_' + slot + '_' + Date.now(),
          token:  sesion.token
        })
      })
      const data = await res.json()
      if(data.ok){
        elaboracionData = []
        await cargarElaboracion()
        toast('✅ Foto actualizada', 'ok')
      } else {
        toast('❌ Error al subir foto', 'err')
      }
    } catch(e) { toast('❌ Error de conexión', 'err') }
  }
  input.click()
}

async function toggleElaboracionVisible(visible){
  const switchEl = document.getElementById('switchElaboracionVisible')
  try {
    const sesion = getSesion()
    const res    = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({
        action: 'actualizarCampo',
        hoja:   'config_index',
        id:     'CFG-elaboracion',
        campo:  'valor',
        valor:  visible ? 'true' : 'false',  // siempre string, nunca booleano
        token:  sesion.token
      })
    })
    const data = await res.json()
    if(data.ok){
      toast(visible ? '✅ Sección visible en el inicio' : '👁 Sección oculta del inicio', 'ok')
    } else {
      // Revertir el switch si falló
      switchEl.checked = !visible
      toast('❌ Error al guardar: ' + (data.error || 'desconocido'), 'err')
    }
  } catch(e) {
    switchEl.checked = !visible
    toast('❌ Error de conexión', 'err')
  }
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
        action:  borrarDrive ? 'borrarFotoSlot' : 'actualizarCampo',
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
  if(!grid) return
  if(loading) loading.style.display = 'block'
  grid.innerHTML = ''

  try {
    const sesion = getSesion()
    const res    = await fetch(`${API}?action=getAll&hoja=multimedia&token=${encodeURIComponent(sesion.token)}`)
    const data   = await res.json()
    multimediaData = data.data || []
    cache['multimedia'] = multimediaData
    renderMultimedia()
    armarFiltrosAdmin('multimedia', multimediaData)
  } catch(e) {
    grid.innerHTML = '<p style="opacity:0.5;padding:20px;grid-column:1/-1">Error al cargar.</p>'
  }
  if(loading) loading.style.display = 'none'
}

function renderMultimediaGrid(items){
  // Alias para re-renderizar con items filtrados
  const grid = document.getElementById('grid-multimedia')
  if(!grid) return
  multimediaData = items
  renderMultimedia()
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
    card.dataset.curso = m.curso || ''
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
          <button class="btn-editar-item" onclick="editarMultimediaAlumno('${m.id}')">
            <i class="fa-solid fa-pen"></i>
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

function abrirModalMultimediaCer(){
  multimediaHojaActual = 'multimedia_ceramistas'
  abrirModalMultimediaBase()
}

function abrirModalMultimedia(){
  // Solo setea la hoja si se llama directamente (no desde abrirNuevoMultimedia)
  if(multimediaHojaActual !== 'multimedia_ceramistas') multimediaHojaActual = 'multimedia'
  abrirModalMultimediaBase()
}

let multimediaHojaActual = 'multimedia'

function abrirModalMultimediaBase(){
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
  const cursoBloq = document.getElementById('mMultimediaCursoBloq')
  if(multimediaHojaActual === 'multimedia_ceramistas'){
    sel.innerHTML = '<option value="">Sin categoría</option>'
    if(cursoBloq) cursoBloq.style.display = 'none'
  } else {
    sel.innerHTML = '<option value="">Seleccioná</option><option value="General">General (todos los alumnos)</option>'
    cursosData.forEach(c => {
      const opt = document.createElement('option')
      opt.value = c.hojaId; opt.textContent = c.nombre
      sel.appendChild(opt)
    })
    if(cursoBloq) cursoBloq.style.display = 'block'
  }

  // Label dinámico según la hoja
  const labelSpan = document.querySelector('#modalMultimedia .publicado-toggle span')
  if(labelSpan) labelSpan.innerText = multimediaHojaActual === 'multimedia_ceramistas'
    ? '✅ Visible para ceramistas'
    : '✅ Visible para los alumnos'

  setTipoMultimedia('foto')
  document.getElementById('modalMultimedia').style.display = 'flex'
}

function editarMultimediaAlumno(id){
  const item = (cache['multimedia'] || []).find(i => i.id === id)
  if(!item) return

  // Reusar el modal existente de multimedia alumnos
  multimediaHojaActual = 'multimedia'
  fotoMultimediaB64    = null

  // Título del modal
  const tit = document.getElementById('tituloModalMultimedia')
  if(tit) tit.innerText = 'Editar multimedia'

  // Guardar id para el guardado
  if(!document.getElementById('mMultimediaEditId')){
    const inp = document.createElement('input')
    inp.type = 'hidden'
    inp.id   = 'mMultimediaEditId'
    document.getElementById('modalMultimedia')?.appendChild(inp)
  }
  document.getElementById('mMultimediaEditId').value = item.id

  // Rellenar campos
  document.getElementById('mMultimediaTitulo').value = item.titulo || ''
  const pub = item.publicado === true || item.publicado === 'TRUE' || item.publicado === 'true'
  document.getElementById('mMultimediaPublicado').checked = pub

  // Curso
  const sel = document.getElementById('mMultimediaCurso')
  if(sel){
    sel.innerHTML = '<option value="">Seleccioná</option><option value="General">General (todos los alumnos)</option>'
    cursosData.forEach(cur => {
      const opt = document.createElement('option')
      opt.value = cur.hojaId; opt.textContent = cur.nombre
      sel.appendChild(opt)
    })
    sel.value = item.curso || ''
  }

  // Tipo y preview
  const tipo = item.tipo || 'foto'
  setTipoMultimedia(tipo)

  if(tipo === 'video'){
    const urlEl = document.getElementById('mMultimediaUrl')
    if(urlEl) urlEl.value = item.url || ''
    const prev = document.getElementById('mMultimediaPreview')
    if(prev && item.url){
      const embed = getEmbedUrl(item.url)
      if(embed){
        prev.style.display = 'block'
        prev.innerHTML = `<iframe src="${embed}" allowfullscreen style="width:100%;aspect-ratio:16/9;border:none;border-radius:8px"></iframe>`
      }
    }
  } else {
    // Foto existente
    const area = document.getElementById('mMultimediaFotoArea')
    if(area && item.foto){
      area.innerHTML = `<img class="mform-foto-preview" src="${item.foto}" alt="Foto actual">
        <button class="mform-foto-cambiar" onclick="elegirFotoMultimedia()" type="button">
          <i class="fa-solid fa-camera"></i> Cambiar
        </button>`
    }
  }

  // Label
  const labelSpan = document.querySelector('#modalMultimedia .publicado-toggle span')
  if(labelSpan) labelSpan.innerText = '✅ Visible para los alumnos'

  document.getElementById('modalMultimedia').style.display = 'flex'
}

function cerrarModalMultimedia(e){
  if(e && e.target !== document.getElementById('modalMultimedia')) return
  document.getElementById('modalMultimedia').style.display = 'none'
  fotoMultimediaB64 = null
  const editId = document.getElementById('mMultimediaEditId')
  if(editId) editId.value = ''
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
  reader.onload = async (ev) => {
    fotoMultimediaB64 = await convertirAJpg(ev.target.result)
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
  const editId     = document.getElementById('mMultimediaEditId')?.value || ''
  const id         = editId || 'MUL-' + Date.now()
  const esEdicion  = !!editId

  const btn = document.querySelector('#modalMultimedia .btn-guardar-modal')
  btn.classList.add('cargando')

  try {
    const sesion = getSesion()

    if(tipoMultimedia === 'video'){
      const url = document.getElementById('mMultimediaUrl').value.trim()
      if(!url){ toast('Ingresá el link del video', 'err'); btn.classList.remove('cargando'); return }
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...'
      const accionM = multimediaHojaActual === 'multimedia_ceramistas' ? 'guardarMultimediaCeramista' : 'guardar'
      const bodyM   = multimediaHojaActual === 'multimedia_ceramistas'
        ? JSON.stringify({ action: accionM, fila: { id, tipo: 'video', titulo, url, foto: '', publicado, creadoEn: new Date().toLocaleDateString('es-AR') }, token: sesion.token })
        : JSON.stringify({ action: accionM, hoja: multimediaHojaActual, fila: { id, tipo: 'video', titulo, curso, url, foto: '', publicado, ...(esEdicion ? {} : {creadoEn: new Date().toLocaleDateString('es-AR')}) }, token: sesion.token })
      const res  = await fetch(API, { method: 'POST', body: bodyM })
      const data = await res.json()
      if(data.ok){
        cerrarModalMultimedia()
        delete cache[multimediaHojaActual]
        multimediaHojaActual === 'multimedia_ceramistas' ? await cargarSeccionCeramista('multimedia_ceramistas') : await cargarMultimedia()
        toast('✅ Video agregado', 'ok')
      }
      else toast('❌ ' + (data.error || 'Error'), 'err')
    } else {
      if(!fotoMultimediaB64 && !esEdicion){ toast('Seleccioná una foto', 'err'); btn.classList.remove('cargando'); return }
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...'
      const accionFoto = multimediaHojaActual === 'multimedia_ceramistas' ? 'guardarMultimediaCeramista' : 'guardar'
      const bodyFoto   = multimediaHojaActual === 'multimedia_ceramistas'
        ? JSON.stringify({ action: accionFoto, fila: { id, tipo: 'foto', titulo, url: '', foto: '', publicado, creadoEn: new Date().toLocaleDateString('es-AR') }, token: sesion.token })
        : JSON.stringify({ action: accionFoto, hoja: multimediaHojaActual, fila: {
            id, tipo: 'foto', titulo, curso, url: '',
            foto: esEdicion && !fotoMultimediaB64 ? ((cache['multimedia']||[]).find(i=>i.id===id)?.foto||'') : '',
            publicado, ...(esEdicion ? {} : {creadoEn: new Date().toLocaleDateString('es-AR')})
          }, token: sesion.token })
      const res = await fetch(API, { method: 'POST', body: bodyFoto })
      const data = await res.json()
      if(!data.ok){ toast('❌ Error al guardar', 'err'); btn.classList.remove('cargando'); btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar'; return }

      if(fotoMultimediaB64){
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo foto...'
        const resF = await fetch(API, {
          method: 'POST',
          body: JSON.stringify({ action: 'subirFoto', hoja: multimediaHojaActual, id, b64: fotoMultimediaB64,
            nombre: 'multimedia_' + id, categoria: curso || 'General', token: sesion.token })
        })
        const dataF = await resF.json()
        cerrarModalMultimedia()
        delete cache[multimediaHojaActual]
        multimediaHojaActual === 'multimedia_ceramistas' ? await cargarSeccionCeramista('multimedia_ceramistas') : await cargarMultimedia()
        toast(dataF.ok ? '✅ Guardado correctamente' : '⚠️ Guardado pero error al subir foto', dataF.ok ? 'ok' : 'err')
      } else {
        cerrarModalMultimedia()
        delete cache[multimediaHojaActual]
        multimediaHojaActual === 'multimedia_ceramistas' ? await cargarSeccionCeramista('multimedia_ceramistas') : await cargarMultimedia()
        toast('✅ Guardado correctamente', 'ok')
      }
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

let tabUsuarioActual  = 'pendientes'
let usuariosData      = []
let tabCeramistaActual = 'activos'
let ceramistasData    = []
let rolTabActual      = 'alumnos'

async function cargarUsuarios(){
  document.getElementById('loading-usuarios').style.display = 'block'
  try {
    const sesion = getSesion()
    const [resU, resC, resCer] = await Promise.all([
      fetch(`${API}?action=getUsuarios&token=${encodeURIComponent(sesion.token)}`),
      cursosData.length > 0
        ? Promise.resolve(null)
        : fetch(`${API}?action=getCursosAdmin&token=${encodeURIComponent(sesion.token)}`),
      fetch(`${API}?action=getCeramistas&token=${encodeURIComponent(sesion.token)}`)
    ])
    const dataU   = await resU.json()
    const dataCer = await resCer.json()
    usuariosData   = dataU.data   || []
    ceramistasData = dataCer.data || []
    if(resC){ const dataC = await resC.json(); cursosData = dataC.data || [] }

    // Actualizar contadores de tabs de rol
    document.getElementById('cnt-rol-alumnos').innerText    = usuariosData.length   || ''
    document.getElementById('cnt-rol-ceramistas').innerText = ceramistasData.length || ''

    renderUsuarios()
    renderCeramistas()
  } catch(e) { toast('❌ Error al cargar usuarios', 'err') }
  document.getElementById('loading-usuarios').style.display = 'none'
}

function setRolTab(rol){
  rolTabActual = rol
  document.getElementById('roltab-alumnos').classList.toggle('activo',    rol === 'alumnos')
  document.getElementById('roltab-ceramistas').classList.toggle('activo', rol === 'ceramistas')
  document.getElementById('seccionAlumnos').style.display    = rol === 'alumnos'    ? 'block' : 'none'
  document.getElementById('seccionCeramistas').style.display = rol === 'ceramistas' ? 'block' : 'none'
}

function setCeramistaTab(tab){
  tabCeramistaActual = tab
  document.querySelectorAll('[id^="ctab-"]').forEach(b => b.classList.remove('activo'))
  document.getElementById('ctab-' + tab)?.classList.add('activo')
  renderCeramistas()
}

function renderCeramistas(){
  const lista   = document.getElementById('lista-ceramistas')
  if(!lista) return

  const activos  = ceramistasData.filter(c => c.estado === 'activo')
  const pausados = ceramistasData.filter(c => c.estado === 'pausado')

  document.getElementById('cnt-cer-activos').innerText  = activos.length  || 0
  document.getElementById('cnt-cer-pausados').innerText = pausados.length || 0

  const filtrados = tabCeramistaActual === 'activos' ? activos : pausados

  lista.innerHTML = ''
  if(filtrados.length === 0){
    lista.innerHTML = `<div class="vacio"><i class="fa-solid fa-mortar-pestle"></i><p>No hay ceramistas en esta categoría</p></div>`
    return
  }

  filtrados.forEach(c => {
    const inicial   = (c.nombre || '?')[0].toUpperCase()
    const fecha     = formatearFecha(c.fechaRegistro)
    const intereses = c.intereses ? c.intereses.split(',').map(i => i.trim()).join(' · ') : '—'
    const card      = document.createElement('div')
    card.className  = 'usuario-card'

    const esProC = (c.plan === 'pro')
    const planBadgeC = esProC
      ? `<span class="plan-badge pro">⭐ Pro</span>`
      : `<span class="plan-badge free">Free</span>`
    const planBtnC = c.estado === 'activo'
      ? `<button class="btn-toggle-plan ${esProC ? 'btn-quitar-pro' : 'btn-dar-pro'}" onclick="togglePlanUsuario('${c.id}','ceramistas','${esProC ? 'free' : 'pro'}')">
           ${esProC ? '<i class="fa-solid fa-star-half-stroke"></i> Quitar Pro' : '<i class="fa-solid fa-star"></i> Dar Pro'}
         </button>`
      : ''

    let botones = `<span class="estado-badge ${c.estado}">${c.estado === 'activo' ? 'Activo' : 'Pausado'}</span>${planBadgeC}`
    if(c.estado === 'activo'){
      botones += `
        <button class="btn-pausar" onclick="gestionarCeramista('${c.id}','pausar')"><i class="fa-solid fa-pause"></i> Pausar</button>
        <button class="btn-eliminar-usr" onclick="eliminarCeramista('${c.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>`
    } else {
      botones += `
        <button class="btn-reactivar" onclick="gestionarCeramista('${c.id}','activar')"><i class="fa-solid fa-rotate-left"></i> Reactivar</button>
        <button class="btn-eliminar-usr" onclick="eliminarCeramista('${c.id}')" title="Eliminar"><i class="fa-solid fa-trash"></i></button>`
    }

    // Selector de curso (para asignar a futuro)
    const checkboxes = cursosData.map(cu => `
      <label class="curso-check-item">
        <input type="checkbox" value="${cu.hojaId}" ${c.curso === cu.hojaId ? 'checked' : ''}>
        <span>${cu.nombre}</span>
      </label>`).join('')

    const cursoNombre = c.curso
      ? (cursosData.find(x => x.hojaId === c.curso)?.nombre || c.curso)
      : 'Sin curso asignado'

    card.innerHTML = `
      <div class="usuario-avatar" style="background:var(--color-primario)">${inicial}</div>
      <div class="usuario-info">
        <div class="usuario-nombre">${c.nombre || ''}</div>
        <div class="usuario-meta">${c.email || ''} · ${fecha}</div>
        <div class="usuario-meta" style="margin-top:2px">🎯 ${intereses}</div>
        <div class="usuario-curso-row">
          <span class="usuario-curso-label"><i class="fa-solid fa-graduation-cap"></i> ${cursoNombre}</span>
          ${cursosData.length > 0 ? `<button class="btn-cambiar-curso" onclick="toggleCursoSelectorCer('${c.id}')"><i class="fa-solid fa-pen"></i> Asignar curso</button>` : ''}
        </div>
        <div class="usuario-curso-selector" id="cerselector-${c.id}" style="display:none">
          <div class="curso-checks-lista">${checkboxes}</div>
          <div class="curso-checks-acciones">
            <button class="btn-cancelar" onclick="toggleCursoSelectorCer('${c.id}')">Cancelar</button>
            <button class="btn-guardar-modal" onclick="guardarCursoCeramista('${c.id}')">Guardar</button>
          </div>
        </div>
      </div>
      <div class="usuario-acciones">${botones}${planBtnC}</div>`
    lista.appendChild(card)
  })
}

function toggleCursoSelectorCer(id){
  const sel = document.getElementById(`cerselector-${id}`)
  if(sel) sel.style.display = sel.style.display === 'none' ? 'block' : 'none'
}

async function guardarCursoCeramista(id){
  const checks  = document.querySelectorAll(`#cerselector-${id} input:checked`)
  const cursoId = checks.length > 0 ? checks[0].value : ''
  try {
    const sesion = getSesion()
    const res    = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'asignarCursoCeramista', id, curso: cursoId, token: sesion.token })
    })
    const data = await res.json()
    if(data.ok){
      toggleCursoSelectorCer(id)
      await cargarUsuarios()
      toast('✅ Curso asignado', 'ok')
    } else toast('❌ Error al asignar curso', 'err')
  } catch(e){ toast('❌ Error de conexión', 'err') }
}

async function gestionarCeramista(id, accion){
  try {
    const sesion  = getSesion()
    const actions = { pausar: 'pausarCeramista', activar: 'activarCeramista' }
    const res     = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: actions[accion], id, token: sesion.token })
    })
    const data = await res.json()
    if(data.ok){
      await cargarUsuarios()
      const msgs = { pausar: '⏸ Ceramista pausado', activar: '✅ Ceramista reactivado' }
      toast(msgs[accion], 'ok')
    } else toast('❌ Error', 'err')
  } catch(e){ toast('❌ Error de conexión', 'err') }
}

async function eliminarCeramista(id){
  abrirModalConfirmarAccion(
    '¿Eliminar este ceramista?',
    'Perderá el acceso permanentemente. Esta acción no se puede deshacer.',
    async () => {
      try {
        const sesion = getSesion()
        const res    = await fetch(API, {
          method: 'POST',
          body: JSON.stringify({ action: 'eliminarCeramista', id, token: sesion.token })
        })
        const data = await res.json()
        if(data.ok){ await cargarUsuarios(); toast('🗑 Ceramista eliminado', 'ok') }
      } catch(e){ toast('❌ Error', 'err') }
    }
  )
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
  const pausados   = usuariosData.filter(u => u.estado === 'pausado')
  const rechazados = usuariosData.filter(u => u.estado === 'rechazado')

  document.getElementById('cnt-pendientes').innerText = pendientes.length
  document.getElementById('cnt-activos').innerText    = activos.length
  document.getElementById('cnt-pausados').innerText   = pausados.length || 0
  document.getElementById('cnt-rechazados').innerText = rechazados.length

  const badge = document.getElementById('badgePendientes')
  badge.style.display = pendientes.length > 0 ? 'inline' : 'none'
  badge.innerText = pendientes.length

  // Actualizar selector de curso en filtro
  const selFiltro = document.getElementById('filtroCursoUsuarios')
  const cursoSeleccionado = selFiltro?.value || ''
  if(selFiltro && cursosData.length > 0 && selFiltro.options.length === 1){
    cursosData.forEach(c => {
      const opt = document.createElement('option')
      opt.value = c.hojaId; opt.textContent = c.nombre
      selFiltro.appendChild(opt)
    })
  }

  lista.innerHTML = ''
  let filtrados = tabUsuarioActual === 'pendientes'  ? pendientes
                : tabUsuarioActual === 'activos'     ? activos
                : tabUsuarioActual === 'pausados'    ? pausados
                : rechazados

  // Filtrar por curso
  if(cursoSeleccionado){
    filtrados = filtrados.filter(u => {
      const cursosU = (u.curso || '').split(',').map(c => c.trim())
      return cursosU.includes(cursoSeleccionado)
    })
  }

  if(filtrados.length === 0){
    lista.innerHTML = `<div class="vacio"><i class="fa-solid fa-users"></i><p>No hay usuarios en esta categoría</p></div>`
    return
  }

  const estadoLabels = { pendiente:'Pendiente', activo:'Activo', pausado:'Pausado', rechazado:'Rechazado' }

  filtrados.forEach(u => {
    const inicial      = (u.nombre || '?')[0].toUpperCase()
    const fecha        = formatearFecha(u.fechaRegistro)
    const cursoActual  = u.curso || ''
    const cursosActuales = cursoActual ? cursoActual.split(',').map(c => c.trim()) : []
    const nombresC     = cursosActuales.map(c => { const obj = cursosData.find(x => x.hojaId === c); return obj ? obj.nombre : c }).join(', ')
    const card         = document.createElement('div')
    card.className = 'usuario-card'

    const esPro = (u.plan === 'pro')
    const planBadge = esPro
      ? `<span class="plan-badge pro">⭐ Pro</span>`
      : `<span class="plan-badge free">Free</span>`
    const planBtn = u.estado === 'activo'
      ? `<button class="btn-toggle-plan ${esPro ? 'btn-quitar-pro' : 'btn-dar-pro'}" onclick="togglePlanUsuario('${u.id}','usuarios','${esPro ? 'free' : 'pro'}')">
           ${esPro ? '<i class="fa-solid fa-star-half-stroke"></i> Quitar Pro' : '<i class="fa-solid fa-star"></i> Dar Pro'}
         </button>`
      : ''

    let botones = `<span class="estado-badge ${u.estado}">${estadoLabels[u.estado] || u.estado}</span>${planBadge}`
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
    } else if(u.estado === 'pausado'){
      botones += `
        <button class="btn-reactivar" onclick="gestionarUsuario('${u.id}','aprobar')"><i class="fa-solid fa-rotate-left"></i> Reactivar</button>
        <button class="btn-rechazar"  onclick="gestionarUsuario('${u.id}','rechazar')"><i class="fa-solid fa-xmark"></i> Revocar</button>
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
      <div class="usuario-acciones">${botones}${planBtn}</div>
    `
    lista.appendChild(card)
  })
}

// ─────────────────────────────────────────────
// EXPORTAR LISTA PDF
// ─────────────────────────────────────────────

function abrirModalExportarLista(){
  const sel = document.getElementById('exportCurso')
  sel.innerHTML = '<option value="">Todos los cursos</option>'
  cursosData.forEach(c => {
    const opt = document.createElement('option')
    opt.value = c.hojaId; opt.textContent = c.nombre
    sel.appendChild(opt)
  })
  document.getElementById('modalExportar').style.display = 'flex'
}

function cerrarModalExportar(e){
  if(e && e.target !== document.getElementById('modalExportar')) return
  document.getElementById('modalExportar').style.display = 'none'
}

function exportarListaPDF(){
  const cursoFiltro = document.getElementById('exportCurso').value
  const incActivos  = document.getElementById('expActivos').checked
  const incPausados = document.getElementById('expPausados').checked
  const colNombre   = document.getElementById('expNombre').checked
  const colEmail    = document.getElementById('expEmail').checked
  const colCursos   = document.getElementById('expCursos').checked
  const colEstado   = document.getElementById('expEstado').checked
  const colFecha    = document.getElementById('expFecha').checked

  let alumnos = usuariosData.filter(u => {
    if(u.estado === 'pendiente' || u.estado === 'rechazado') return false
    if(u.estado === 'activo'  && !incActivos)  return false
    if(u.estado === 'pausado' && !incPausados) return false
    if(cursoFiltro){
      const cursosU = (u.curso || '').split(',').map(c => c.trim())
      if(!cursosU.includes(cursoFiltro)) return false
    }
    return true
  })

  if(alumnos.length === 0){ toast('No hay alumnos para exportar', 'err'); return }

  const activos  = alumnos.filter(u => u.estado === 'activo')
  const pausados = alumnos.filter(u => u.estado === 'pausado')

  const nombreCurso = cursoFiltro
    ? (cursosData.find(c => c.hojaId === cursoFiltro)?.nombre || cursoFiltro)
    : 'Todos los cursos'

  const cols = []
  if(colNombre) cols.push({ key:'nombre',        label:'Nombre' })
  if(colEmail)  cols.push({ key:'email',          label:'Email' })
  if(colCursos) cols.push({ key:'cursos_nombres', label:'Curso/s' })
  if(colEstado) cols.push({ key:'estado',         label:'Estado' })
  if(colFecha)  cols.push({ key:'fechaRegistro',  label:'Registro' })

  const estadoLabels = { activo:'Activo', pausado:'Pausado' }

  function buildTable(lista, titulo){
    if(lista.length === 0) return ''
    const rows = lista.map(u => {
      const cursosNombres = (u.curso || '').split(',').map(c => {
        const obj = cursosData.find(x => x.hojaId === c.trim())
        return obj ? obj.nombre : c
      }).join(', ')
      const item = { ...u, cursos_nombres: cursosNombres }
      return `<tr>${cols.map(col => {
        let val = item[col.key] || ''
        if(col.key === 'estado') val = estadoLabels[val] || val
        if(col.key === 'fechaRegistro') val = formatearFecha(val)
        return `<td>${val}</td>`
      }).join('')}</tr>`
    }).join('')
    return `
      <tr class="sec-row"><td colspan="${cols.length}">${titulo} (${lista.length})</td></tr>
      <tr class="col-headers">${cols.map(c => `<th>${c.label}</th>`).join('')}</tr>
      ${rows}
    `
  }

  const fecha  = new Date().toLocaleDateString('es-AR')
  const tablas = buildTable(activos, 'Activos') + buildTable(pausados, 'Pausados')

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
    body{ font-family:'Plus Jakarta Sans',Arial,sans-serif; margin:0; padding:32px; color:#2d2016; }
    .header{ display:flex; align-items:center; gap:16px; border-bottom:2px solid #8b6f56; padding-bottom:16px; margin-bottom:24px; }
    .header img{ width:52px; height:52px; border-radius:50%; }
    .header h1{ margin:0; font-size:20px; color:#8b6f56; }
    .header p{ margin:4px 0 0; font-size:13px; opacity:0.6; }
    table{ width:100%; border-collapse:collapse; }
    .sec-row td{ background:#8b6f56; color:white; font-weight:700; font-size:13px; padding:8px 12px; margin-top:16px; }
    .col-headers th{ background:#f0e8df; color:#8b6f56; font-weight:700; font-size:12px; padding:8px 12px; text-align:left; border-bottom:1px solid #d8cfc4; }
    td{ padding:10px 12px; font-size:13px; border-bottom:1px solid #f5f0ea; }
    .footer{ margin-top:24px; font-size:11px; opacity:0.4; text-align:right; }
    @media print{ body{ padding:0; } }
  </style></head><body>
  <div class="header">
    <img src="../imagenes/logo.png" alt="YCA">
    <div>
      <h1>YCA Cerámica — Lista de alumnos</h1>
      <p>${nombreCurso} · ${fecha}</p>
    </div>
  </div>
  <table>${tablas}</table>
  <div class="footer">YCA Cerámica · ycaceramica.com.ar</div>
  </body></html>`

  const ventana = window.open('', '_blank')
  ventana.document.write(html)
  ventana.document.close()
  ventana.focus()
  setTimeout(() => ventana.print(), 600)
  cerrarModalExportar()
  toast('✅ PDF generado', 'ok')
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
  abrirModalConfirmarAccion(
    '¿Eliminar este usuario?',
    'Perderá el acceso permanentemente. Esta acción no se puede deshacer.',
    async () => {
      try {
        const sesion = getSesion()
        const res    = await fetch(API, { method: 'POST', body: JSON.stringify({ action: 'eliminarUsuario', id, token: sesion.token }) })
        const data   = await res.json()
        if(data.ok){ await cargarUsuarios(); toast('🗑 Usuario eliminado', 'ok') }
      } catch(e) { toast('❌ Error', 'err') }
    }
  )
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
const PREFIJOS_CUSTOM = {}

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
        <div style="display:flex;gap:10px;align-items:center">
          <button class="btn-nuevo" onclick="abrirModal('${inv.hojaId}')">
            <i class="fa-solid fa-plus"></i> Nuevo item
          </button>
          <button class="btn-eliminar-inventario" onclick="confirmarEliminarInventario('${inv.hojaId}', '${inv.nombre}')" title="Eliminar inventario">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
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
    // Usar prefijo del inventario como código automático
    CATEGORIAS[inv.hojaId] = ['General', 'Otros']
    PREFIJOS_CUSTOM[inv.hojaId] = inv.prefijo || inv.hojaId.replace('_inv','').toUpperCase()
  }

  sec.style.display = 'block'
  seccionActual = inv.hojaId
  cerrarSidebar()
  if(!cache[inv.hojaId]) cargarSeccion(inv.hojaId)
}

async function confirmarEliminarInventario(hojaId, nombre){
  const modal = document.getElementById('modalEliminarInventario')
  document.getElementById('elimInvNombre').innerText = nombre
  document.getElementById('btnElimInvSolo').onclick      = () => ejecutarEliminarInventario(hojaId, false)
  document.getElementById('btnElimInvConDrive').onclick  = () => ejecutarEliminarInventario(hojaId, true)
  modal.style.display = 'flex'
}

async function ejecutarEliminarInventario(hojaId, borrarDrive){
  document.getElementById('modalEliminarInventario').style.display = 'none'
  try {
    const sesion = getSesion()
    const res    = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'eliminarInventario', hojaId, borrarDrive, token: sesion.token })
    })
    const data = await res.json()
    if(data.ok){
      // Quitar del sidebar y recargar inventarios
      const btn = document.getElementById('nav-inv-' + hojaId)
      if(btn) btn.remove()
      const sec = document.getElementById('seccion-inv-' + hojaId)
      if(sec) sec.remove()
      inventariosData = inventariosData.filter(i => i.hojaId !== hojaId)
      setSeccion('piezas')
      toast('🗑 Inventario eliminado', 'ok')
    } else {
      toast('❌ ' + (data.error || 'Error al eliminar'), 'err')
    }
  } catch(e) { toast('❌ Error de conexión', 'err') }
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

// ─────────────────────────────────────────────
// SUSCRIPTORES
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// PASTAS
// ─────────────────────────────────────────────

async function cargarPastas(){
  const grid    = document.getElementById('grid-pastas')
  const loading = document.getElementById('loading-pastas')
  if(!grid) return

  // Cargar toggle de acceso libre
  try {
    const sesion    = getSesion()
    const resConfig = await fetch(`${API}?action=getConfigIndex`)
    const dataConfig = await resConfig.json()
    const val = String(dataConfig.data?.pastas_acceso_libre ?? 'true')
    const sw  = document.getElementById('switchPastasAcceso')
    if(sw) sw.checked = val !== 'false'
  } catch(e){}

  if(cache['pastas']){
    renderGrid('pastas', cache['pastas'])
    return
  }
  if(loading) loading.style.display = 'block'
  grid.innerHTML = ''
  try {
    const sesion = getSesion()
    const res    = await fetch(`${API}?action=getPastasAdmin&token=${encodeURIComponent(sesion.token)}`)
    const data   = await res.json()
    cache['pastas'] = data.data || []
    renderGrid('pastas', cache['pastas'])
  } catch(e) {
    grid.innerHTML = '<p style="opacity:0.5;padding:20px;grid-column:1/-1">Error al cargar. Revisá tu conexión.</p>'
  }
  if(loading) loading.style.display = 'none'
}

async function togglePastasAcceso(activo){
  const sw = document.getElementById('switchPastasAcceso')
  try {
    const sesion = getSesion()
    const res    = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({
        action: 'actualizarCampo',
        hoja:   'config_index',
        id:     'CFG-pastas',
        campo:  'valor',
        valor:  activo ? 'true' : 'false',
        token:  sesion.token
      })
    })
    const data = await res.json()
    if(data.ok){
      toast(activo ? '🔓 Calculadora libre abierta para todos' : '🔒 Calculadora libre restringida a ceramistas', 'ok')
    } else {
      toast('❌ Error al actualizar', 'err')
      if(sw) sw.checked = !activo
    }
  } catch(e) {
    toast('❌ Error de conexión', 'err')
    if(sw) sw.checked = !activo
  }
}

async function cargarEngobes(){
  const grid    = document.getElementById('grid-engobes')
  const loading = document.getElementById('loading-engobes')
  if(!grid) return

  // Cargar toggle de acceso libre
  try {
    const resConfig  = await fetch(`${API}?action=getConfigIndex`)
    const dataConfig = await resConfig.json()
    const val = String(dataConfig.data?.engobes_acceso_libre ?? 'true')
    const sw  = document.getElementById('switchEngobesAcceso')
    if(sw) sw.checked = val !== 'false'
  } catch(e){}

  if(cache['engobes']){
    renderGrid('engobes', cache['engobes'])
    return
  }
  if(loading) loading.style.display = 'block'
  grid.innerHTML = ''
  try {
    const sesion = getSesion()
    const res    = await fetch(`${API}?action=getEngobesAdmin&token=${encodeURIComponent(sesion.token)}`)
    const data   = await res.json()
    cache['engobes'] = data.data || []
    renderGrid('engobes', cache['engobes'])
  } catch(e) {
    grid.innerHTML = '<p style="opacity:0.5;padding:20px;grid-column:1/-1">Error al cargar. Revisá tu conexión.</p>'
  }
  if(loading) loading.style.display = 'none'
}

async function toggleEngobesAcceso(activo){
  const sw = document.getElementById('switchEngobesAcceso')
  try {
    const sesion = getSesion()
    const res    = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({
        action: 'actualizarCampo',
        hoja:   'config_index',
        id:     'CFG-engobes',
        campo:  'valor',
        valor:  activo ? 'true' : 'false',
        token:  sesion.token
      })
    })
    const data = await res.json()
    if(data.ok){
      toast(activo ? '🔓 Calculadora libre abierta para todos' : '🔒 Calculadora libre restringida a ceramistas', 'ok')
    } else {
      toast('❌ Error al actualizar', 'err')
      if(sw) sw.checked = !activo
    }
  } catch(e) {
    toast('❌ Error de conexión', 'err')
    if(sw) sw.checked = !activo
  }
}

let suscriptoresData = []

async function cargarSuscriptores(){
  document.getElementById('loading-suscriptores').style.display = 'block'
  document.getElementById('lista-suscriptores').innerHTML = ''
  const sesion = getSesion()
  fetch(`${API}?action=getAll&hoja=suscriptores&token=${encodeURIComponent(sesion.token)}`)
    .then(r => r.json())
    .then(data => {
      suscriptoresData = data.data || []
      document.getElementById('loading-suscriptores').style.display = 'none'
      renderSuscriptores(suscriptoresData)
      armarFiltrosSuscriptores()
    })
    .catch(() => {
      document.getElementById('loading-suscriptores').style.display = 'none'
      toast('❌ Error al cargar suscriptores', 'err')
    })
}

function armarFiltrosSuscriptores(){
  const contenedor = document.getElementById('filtros-suscriptores')
  contenedor.innerHTML = ''
  const items = [
    { valor:'Todos', label:'Todos' }, { valor:'cursos', label:'🎓 Cursos' },
    { valor:'insumos', label:'🧪 Insumos' }, { valor:'piezas', label:'🏺 Piezas' },
    { valor:'todo', label:'✨ Todo' }
  ]
  items.forEach((item, idx) => {
    const btn = document.createElement('button')
    btn.className = 'admin-filtro-btn' + (idx === 0 ? ' activo' : '')
    btn.innerText = item.label
    btn.onclick = () => {
      contenedor.querySelectorAll('.admin-filtro-btn').forEach(b => b.classList.remove('activo'))
      btn.classList.add('activo')
      filtrarSuscriptores(item.valor)
    }
    contenedor.appendChild(btn)
  })
}

function filtrarSuscriptores(filtro = 'Todos'){
  const busqueda = document.getElementById('buscar-suscriptores')?.value.toLowerCase() || ''
  let filtrados  = suscriptoresData
  if(filtro && filtro !== 'Todos'){
    filtrados = filtrados.filter(s => (s.intereses||'').includes(filtro)||(s.intereses||'').includes('todo'))
  }
  if(busqueda){
    filtrados = filtrados.filter(s =>
      (s.nombre||'').toLowerCase().includes(busqueda)||(s.email||'').toLowerCase().includes(busqueda))
  }
  renderSuscriptores(filtrados)
}

function renderSuscriptores(lista){
  const contenedor = document.getElementById('lista-suscriptores')
  contenedor.innerHTML = ''
  if(lista.length === 0){
    contenedor.innerHTML = `<div class="vacio"><i class="fa-solid fa-users"></i><p>No hay suscriptores en esta categoría</p></div>`
    return
  }
  const labels = { cursos:'🎓 Cursos', insumos:'🧪 Insumos', piezas:'🏺 Piezas', todo:'✨ Todo' }
  lista.forEach(s => {
    const inicial = (s.nombre||'?')[0].toUpperCase()
    const tags    = (s.intereses||'').split(',').filter(Boolean)
      .map(i => `<span class="suscriptor-tag">${labels[i.trim()]||i}</span>`).join('')
    const card = document.createElement('div')
    card.className = 'suscriptor-card'
    card.innerHTML = `
      <div class="suscriptor-avatar">${inicial}</div>
      <div class="suscriptor-info">
        <div class="suscriptor-nombre">${s.nombre||''}</div>
        <div class="suscriptor-meta">${s.email||''} ${s.instagram?'· @'+s.instagram:''} · ${s.fecha||''}</div>
      </div>
      <div class="suscriptor-intereses">${tags}</div>
      <button class="btn-borrar" onclick="eliminarSuscriptor('${s.id}')" title="Eliminar">
        <i class="fa-solid fa-trash"></i>
      </button>`
    contenedor.appendChild(card)
  })
}

// ─────────────────────────────────────────────
// ELIMINAR SUSCRIPTOR
// ─────────────────────────────────────────────

async function eliminarSuscriptor(id){
  const sus = suscriptoresData.find(s => s.id === id)
  document.getElementById('elimSusNombre').innerText = sus ? sus.nombre : 'este suscriptor'
  document.getElementById('modalEliminarSuscriptor').style.display = 'flex'
  const btn  = document.getElementById('btnConfirmarElimSus')
  const nuevo = btn.cloneNode(true)
  btn.parentNode.replaceChild(nuevo, btn)
  nuevo.onclick = async () => {
    document.getElementById('modalEliminarSuscriptor').style.display = 'none'
    try {
      const sesion = getSesion()
      const res    = await fetch(API, {
        method: 'POST',
        body: JSON.stringify({ action: 'eliminar', hoja: 'suscriptores', id, token: sesion.token })
      })
      const data = await res.json()
      if(data.ok){
        suscriptoresData = suscriptoresData.filter(s => s.id !== id)
        renderSuscriptores(suscriptoresData)
        toast('🗑 Suscriptor eliminado', 'ok')
      } else {
        toast('❌ ' + (data.error || 'Error al eliminar'), 'err')
      }
    } catch(e) { toast('❌ Error de conexión', 'err') }
  }
}


// ─────────────────────────────────────────────
// EMAILS
// ─────────────────────────────────────────────

let tipoEmailActual    = 'oferta'
let destinatarioActual = 'todos'
let emailPayload       = null
let emailImgB64        = null
let emailPdfB64        = null
let emailPdfNombreStr  = ''
let apuntePdfB64       = null
let apuntePdfNombreStr = ''
let apunteMiniaturaB64 = null

async function cargarEmails(){
  // Siempre recargar cursos para que el selector esté actualizado
  cursosData = []
  await cargarCursosSilencioso()

  const sel = document.getElementById('eCursoSelect')
  if(sel){
    sel.innerHTML = '<option value="">Seleccioná un curso</option>'
    cursosData.forEach(c => {
      const opt = document.createElement('option')
      opt.value = c.hojaId || c.id
      opt.textContent = c.nombre
      sel.appendChild(opt)
    })
  }

  setTipoEmail('oferta')
  actualizarInfoDestinatarios()
}

function setTipoEmail(tipo){
  tipoEmailActual = tipo
  document.querySelectorAll('.email-tipo-btn[id^="etipo"]').forEach(b => b.classList.remove('activo'))
  const btnTipo = document.getElementById('etipo-' + tipo)
  if(btnTipo) btnTipo.classList.add('activo')
  ;['oferta','curso','libre'].forEach(b => {
    const el = document.getElementById('email-campos-' + b)
    if(el){ el.style.display = b === tipo ? 'flex' : 'none'; if(b===tipo) el.style.flexDirection='column' }
  })
}

function setDestinatario(dest){
  destinatarioActual = dest
  document.querySelectorAll('.email-tipo-btn[id^="edest"]').forEach(b => b.classList.remove('activo'))
  const btnDest = document.getElementById('edest-' + dest)
  if(btnDest) btnDest.classList.add('activo')
  actualizarInfoDestinatarios()
}

async function actualizarInfoDestinatarios(){
  const infoMsg = document.getElementById('emailInfoMsg')
  if(!infoMsg) return
  try {
    const sesion = getSesion()
    if(suscriptoresData.length === 0){
      const res = await fetch(`${API}?action=getAll&hoja=suscriptores&token=${encodeURIComponent(sesion.token)}`)
      suscriptoresData = (await res.json()).data || []
    }
    let alumnos = usuariosData.filter(u => u.estado === 'activo')
    if(alumnos.length === 0 && usuariosData.length === 0){
      const res = await fetch(`${API}?action=getUsuarios&token=${encodeURIComponent(sesion.token)}`)
      alumnos = ((await res.json()).data || []).filter(u => u.estado === 'activo')
    }
    if(destinatarioActual === 'todos'){
      infoMsg.innerText = `Se enviará a ${suscriptoresData.length} suscriptores + ${alumnos.length} alumnos = ${suscriptoresData.length + alumnos.length} destinatarios`
    } else if(destinatarioActual === 'alumnos'){
      infoMsg.innerText = `Se enviará a ${alumnos.length} alumnos activos`
    } else if(destinatarioActual === 'ceramistas'){
      // Cargar ceramistas si no están
      let ceramistas = []
      try {
        const res = await fetch(`${API}?action=getCeramistas&token=${encodeURIComponent(sesion.token)}`)
        ceramistas = ((await res.json()).data || []).filter(c => c.estado === 'activo')
      } catch(e){}
      infoMsg.innerText = `Se enviará a ${ceramistas.length} ceramistas activos`
    } else {
      const sus = suscriptoresData.filter(s => (s.intereses||'').includes(destinatarioActual)||(s.intereses||'').includes('todo')).length
      infoMsg.innerText = `Se enviará a ${sus} suscriptores interesados en "${destinatarioActual}"`
    }
  } catch(e) { if(infoMsg) infoMsg.innerText = 'No se pudo calcular destinatarios' }
}

function elegirImagenEmail(){ document.getElementById('inputImagenEmail').click() }

function previsualizarImagenEmail(e){
  const file = e.target.files[0]
  if(!file) return
  const reader = new FileReader()
  reader.onload = ev => {
    emailImgB64 = ev.target.result
    const area = document.getElementById('emailImgArea')
    area.innerHTML = `<img src="${emailImgB64}" alt="Preview" style="width:100%;height:100%;object-fit:cover;">`
    document.getElementById('emailImgQuitar').style.display = 'flex'
  }
  reader.readAsDataURL(file)
}

function quitarImagenEmail(){
  emailImgB64 = null
  document.getElementById('emailImgArea').innerHTML = `
    <div class="email-img-placeholder">
      <i class="fa-solid fa-image"></i>
      <span>Tocá para subir una imagen</span>
    </div>`
  document.getElementById('emailImgQuitar').style.display = 'none'
  document.getElementById('inputImagenEmail').value = ''
}

function elegirPdfEmail(){ document.getElementById('inputPdfEmail').click() }

function seleccionarPdfEmail(e){
  const file = e.target.files[0]
  if(!file) return
  emailPdfNombreStr = file.name
  document.getElementById('emailPdfNombre').innerText = file.name
  const reader = new FileReader()
  reader.onload = ev => { emailPdfB64 = ev.target.result }
  reader.readAsDataURL(file)
}

async function enviarEmailMasivo(){
  let asunto = '', cuerpo = ''

  if(tipoEmailActual === 'oferta'){
    const titulo = document.getElementById('eOfertaTitulo').value.trim()
    const desc   = document.getElementById('eOfertaDesc').value.trim()
    if(!titulo){ toast('Ingresá el título de la oferta', 'err'); return }
    asunto = '🧪 Oferta especial — YCA Cerámica: ' + titulo
    cuerpo = desc || ''
  } else if(tipoEmailActual === 'curso'){
    const hojaId  = document.getElementById('eCursoSelect').value
    const mensaje = document.getElementById('eCursoMensaje').value.trim()
    if(!hojaId){ toast('Seleccioná un curso', 'err'); return }
    const curso = cursosData.find(c => (c.hojaId||c.id) === hojaId)
    asunto = '🎓 Nuevo curso disponible — ' + (curso?.nombre || hojaId)
    cuerpo = mensaje || ''
  } else {
    asunto = document.getElementById('eLibreAsunto').value.trim()
    cuerpo = document.getElementById('eLibreMensaje').value.trim()
    if(!asunto){ toast('Ingresá el asunto', 'err'); return }
    if(!cuerpo){ toast('Ingresá el mensaje', 'err'); return }
  }

  const pdfLink = document.getElementById('emailPdfLink')?.value.trim() || ''

  emailPayload = {
    asunto, cuerpo,
    destinatario: destinatarioActual,
    tipoEmail:    tipoEmailActual,
    cursoHojaId:  document.getElementById('eCursoSelect')?.value || '',
    imgB64:       emailImgB64 || null,
    pdfB64:       emailPdfB64 || null,
    pdfNombre:    emailPdfNombreStr || '',
    pdfLink
  }

  document.getElementById('confirmAsunto').innerText        = asunto
  document.getElementById('confirmDestinatarios').innerText = document.getElementById('emailInfoMsg').innerText

  const imgFila = document.getElementById('confirmImagenFila')
  const pdfFila = document.getElementById('confirmPdfFila')
  if(imgFila) imgFila.style.display = emailImgB64 ? 'flex' : 'none'
  if(pdfFila){
    pdfFila.style.display = (emailPdfB64 || pdfLink) ? 'flex' : 'none'
    const pdfNomEl = document.getElementById('confirmPdfNombre')
    if(pdfNomEl) pdfNomEl.innerText = emailPdfB64 ? emailPdfNombreStr : '🔗 Link de Drive'
  }

  document.getElementById('modalConfirmarEmail').style.display = 'flex'
}

function cerrarModalConfirmarEmail(e){
  if(e && e.target !== document.getElementById('modalConfirmarEmail')) return
  document.getElementById('modalConfirmarEmail').style.display = 'none'
  emailPayload = null
}

async function confirmarEnvioEmail(){
  if(!emailPayload) return
  const btn = document.getElementById('btnConfirmarEnvio')
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...'
  btn.disabled  = true
  try {
    const sesion = getSesion()
    const res    = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'enviarEmailMasivo', ...emailPayload, token: sesion.token })
    })
    const data = await res.json()
    document.getElementById('modalConfirmarEmail').style.display = 'none'
    emailPayload = null
    if(data.ok) toast(`✅ Email enviado a ${data.enviados} destinatarios`, 'ok')
    else toast('❌ ' + (data.error || 'Error al enviar'), 'err')
  } catch(e) { toast('❌ Error de conexión', 'err') }
  btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Confirmar y enviar'
  btn.disabled  = false
}

// ─────────────────────────────────────────────
// PDF Y MINIATURA EN APUNTES
// ─────────────────────────────────────────────

function elegirPdfApunte(){
  document.getElementById('inputPdfApunte').click()
}

function seleccionarPdfApunte(e){
  const file = e.target.files[0]
  if(!file) return
  apuntePdfNombreStr = file.name
  document.getElementById('apuntePdfNombre').innerText = '📎 ' + file.name
  const reader = new FileReader()
  reader.onload = ev => { apuntePdfB64 = ev.target.result }
  reader.readAsDataURL(file)
}

function elegirMiniaturaApunte(){
  document.getElementById('inputMiniaturaApunte').click()
}

function previsualizarMiniaturaApunte(e){
  const file = e.target.files[0]
  if(!file) return
  const reader = new FileReader()
  reader.onload = ev => {
    apunteMiniaturaB64 = ev.target.result
    const area = document.getElementById('apunteMiniaturaArea')
    area.innerHTML = `<img src="${apunteMiniaturaB64}" style="width:100%;height:100%;object-fit:cover;border-radius:10px">`
    document.getElementById('apunteMiniaturaQuitar').style.display = 'flex'
  }
  reader.readAsDataURL(file)
}

function quitarMiniaturaApunte(){
  apunteMiniaturaB64 = null
  // Si había miniatura guardada, marcar para borrar
  if(modalItem) modalItem.miniatura = ''
  const area = document.getElementById('apunteMiniaturaArea')
  if(area) area.innerHTML = `<div class="email-img-placeholder"><i class="fa-solid fa-image"></i><span>Tocá para subir miniatura</span></div>`
  const btn = document.getElementById('apunteMiniaturaQuitar')
  if(btn) btn.style.display = 'none'
  document.getElementById('inputMiniaturaApunte').value = ''
}

// ─────────────────────────────────────────────
// ELIMINAR SUSCRIPTOR

// ─────────────────────────────────────────────
// MODAL CONFIRMACIÓN SIMPLE (para acciones destructivas)
// ─────────────────────────────────────────────
let _accionConfirmarModal = null

function abrirModalConfirmarAccion(titulo, texto, accion){
  document.getElementById('modalConfirmarAccionTitulo').innerText = titulo
  document.getElementById('modalConfirmarAccionTexto').innerText  = texto
  _accionConfirmarModal = accion || null
  document.getElementById('modalConfirmarAccion').style.display = 'flex'
}

function cerrarModalConfirmarAccion(e){
  if(e && e.target !== document.getElementById('modalConfirmarAccion')) return
  document.getElementById('modalConfirmarAccion').style.display = 'none'
  _accionConfirmarModal = null
}

function ejecutarModalConfirmarAccion(){
  const cb = _accionConfirmarModal
  document.getElementById('modalConfirmarAccion').style.display = 'none'
  _accionConfirmarModal = null
  if(cb) cb()
}

// ─────────────────────────────────────────────
// APUNTES Y MULTIMEDIA CERAMISTAS
// ─────────────────────────────────────────────

async function cargarSeccionCeramista(hoja){
  const grid    = document.getElementById('grid-' + hoja)
  const loading = document.getElementById('loading-' + hoja)
  if(!grid) return
  // apuntes_ceramistas usa renderGrid genérico — igual que apuntes de alumnos
  if(hoja === 'apuntes_ceramistas'){
    if(cache[hoja]){ renderGrid(hoja, cache[hoja]); armarFiltrosAdmin(hoja, cache[hoja]); return }
    if(loading) loading.style.display = 'block'
    grid.innerHTML = ''
    try {
      const sesion = getSesion()
      const res    = await fetch(`${API}?action=getApuntesCeramistaAdmin&token=${encodeURIComponent(sesion.token)}`)
      const data   = await res.json()
      cache[hoja]  = data.data || []
      renderGrid(hoja, cache[hoja])
      armarFiltrosAdmin(hoja, cache[hoja])
    } catch(e) {
      if(grid) grid.innerHTML = '<p style="opacity:0.5;padding:20px;grid-column:1/-1">Error al cargar.</p>'
    }
    if(loading) loading.style.display = 'none'
    return
  }
  // multimedia_ceramistas usa renderGridCeramista (grid especial)
  if(cache[hoja]){ renderGridCeramistaMul(hoja, cache[hoja]); if(loading) loading.style.display = 'none'; return }
  if(loading) loading.style.display = 'block'
  grid.innerHTML = ''
  try {
    const sesion = getSesion()
    const res    = await fetch(`${API}?action=getMultimediaCeramistaAdmin&token=${encodeURIComponent(sesion.token)}`)
    const data   = await res.json()
    if(!data.ok && data.error) throw new Error(data.error)
    cache[hoja]  = data.data || []
    renderGridCeramistaMul(hoja, cache[hoja])
    // Actualizar contador
    const cntEl = document.getElementById('cnt-multimedia-ceramistas')
    if(cntEl) cntEl.innerText = cache[hoja].length
  } catch(e) {
    console.error('Error cargarSeccionCeramista multimedia:', e)
    if(grid) grid.innerHTML = '<p style="opacity:0.5;padding:20px;grid-column:1/-1">Error al cargar. Revisá tu conexión.</p>'
  }
  if(loading) loading.style.display = 'none'
}

function renderGridCeramistaMul(hoja, items){
  const grid = document.getElementById('grid-' + hoja)
  if(!grid) return
  const busq      = (document.getElementById('buscar-' + hoja)?.value || '').toLowerCase()
  const pubFiltro = (filtroPubActivo[hoja] || 'todos')
  const filtrados = items.filter(i => {
    const matchBusq = !busq || (i.titulo||'').toLowerCase().includes(busq)
    const pub = i.publicado === true || i.publicado === 'TRUE' || i.publicado === 'true'
    const matchPub  = pubFiltro === 'todos' || (pubFiltro === 'publicado' ? pub : !pub)
    return matchBusq && matchPub
  })
  if(filtrados.length === 0){
    grid.innerHTML = `
      <div class="vacio">
        <i class="fa-solid fa-photo-film"></i>
        <p>No hay multimedia todavía. ¡Agregá fotos o videos!</p>
      </div>`
    return
  }
  {
    // Multimedia ceramistas — usa el mismo grid de multimedia
    grid.innerHTML = ''
    filtrados.forEach(item => {
      const pub = item.publicado === true || item.publicado === 'TRUE' || item.publicado === 'true'
      const div = document.createElement('div')
      div.className = 'multimedia-admin-item'
      const esVideo = item.tipo === 'video'
      div.innerHTML = `
        <div class="multimedia-admin-thumb">
          ${item.foto
            ? `<img src="${item.foto}" alt="${item.titulo}" loading="lazy">`
            : `<div class="multimedia-thumb-placeholder"><i class="fa-solid ${esVideo ? 'fa-play-circle' : 'fa-link'}"></i></div>`}
        </div>
        <div class="multimedia-admin-info">
          <div class="multimedia-admin-titulo">${item.titulo || 'Sin título'}</div>
          ${item.descripcion ? `<div class="multimedia-admin-meta">${item.descripcion}</div>` : ''}
          ${item.url ? `<a href="${item.url}" target="_blank" class="multimedia-admin-meta" style="color:var(--color-primario)"><i class="fa-solid fa-external-link-alt"></i> Ver</a>` : ''}
          <div class="item-acciones" style="margin-top:8px">
            <span class="estado-badge ${pub ? 'activo' : 'pausado'}">${pub ? 'Visible' : 'Oculto'}</span>
            <button class="btn-editar-item" onclick="editarMultimediaCeramista('${item.id}')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-eliminar-item" onclick="eliminarMultimediaCeramista('${item.id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`
      grid.appendChild(div)
    })
  }
}

// ── APUNTES CERAMISTAS ──
let apunteCerEditandoId = null
let multiCerTipoActual  = 'video'

function abrirModalApunteCeramista(id){
  apunteCerEditandoId = id || null
  document.getElementById('tituloModalApunteCer').innerText = id ? 'Editar recurso' : 'Nuevo recurso ceramista'
  if(!id){
    document.getElementById('mApunteCerId').value       = ''
    document.getElementById('mApunteCerTitulo').value   = ''
    document.getElementById('mApunteCerDesc').value     = ''
    document.getElementById('mApunteCerUrl').value      = ''
    document.getElementById('mApunteCerMini').value     = ''
    document.getElementById('mApunteCerPublicado').value= 'true'
  } else {
    const item = (cache['apuntes_ceramistas'] || []).find(i => i.id === id)
    if(item){
      document.getElementById('mApunteCerId').value       = item.id
      document.getElementById('mApunteCerTitulo').value   = item.titulo      || ''
      document.getElementById('mApunteCerDesc').value     = item.descripcion || ''
      document.getElementById('mApunteCerUrl').value      = item.archivoUrl  || ''
      document.getElementById('mApunteCerMini').value     = item.miniatura   || ''
      const pub = item.publicado === true || item.publicado === 'TRUE' || item.publicado === 'true'
      document.getElementById('mApunteCerPublicado').value = pub ? 'true' : 'false'
    }
  }
  document.getElementById('modalApunteCeramista').style.display = 'flex'
}

function editarApunteCeramista(id){ abrirModalApunteCeramista(id) }

function cerrarModalApunteCeramista(e){
  if(e && e.target !== document.getElementById('modalApunteCeramista')) return
  document.getElementById('modalApunteCeramista').style.display = 'none'
}

async function guardarApunteCeramista(){
  const titulo = document.getElementById('mApunteCerTitulo').value.trim()
  const url    = document.getElementById('mApunteCerUrl').value.trim()
  if(!titulo || !url){ toast('⚠️ Completá título y URL', 'err'); return }

  const sesion = getSesion()
  const fila   = {
    id:          apunteCerEditandoId || 'ACE-' + Date.now(),
    titulo,
    descripcion: document.getElementById('mApunteCerDesc').value.trim(),
    archivoUrl:  url,
    miniatura:   document.getElementById('mApunteCerMini').value.trim(),
    publicado:   document.getElementById('mApunteCerPublicado').value,
    creadoEn:    apunteCerEditandoId ? undefined : new Date().toLocaleDateString('es-AR')
  }

  try {
    const res  = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'guardarApunteCeramista', fila, token: sesion.token })
    })
    const data = await res.json()
    if(data.ok){
      delete cache['apuntes_ceramistas']
      document.getElementById('modalApunteCeramista').style.display = 'none'
      await cargarSeccionCeramista('apuntes_ceramistas')
      toast(apunteCerEditandoId ? '✅ Recurso actualizado' : '✅ Recurso agregado', 'ok')
    } else { toast('❌ Error al guardar', 'err') }
  } catch(e){ toast('❌ Error de conexión', 'err') }
}

function eliminarApunteCeramista(id){
  abrirModalConfirmarAccion('¿Eliminar este recurso?', 'Esta acción no se puede deshacer.', async () => {
    try {
      const sesion = getSesion()
      const res    = await fetch(API, {
        method: 'POST',
        body: JSON.stringify({ action: 'eliminarApunteCeramista', id, token: sesion.token })
      })
      const data = await res.json()
      if(data.ok){
        delete cache['apuntes_ceramistas']
        await cargarSeccionCeramista('apuntes_ceramistas')
        toast('🗑 Recurso eliminado', 'ok')
      }
    } catch(e){ toast('❌ Error', 'err') }
  })
}

// ── MULTIMEDIA CERAMISTAS ──
let multiCerEditandoId = null

function setMultiCerTipo(tipo, btn){
  multiCerTipoActual = tipo
  document.querySelectorAll('#modalMultimediaCeramista .mtipo-btn').forEach(b => b.classList.remove('activo'))
  btn.classList.add('activo')
  previewMultiCer()
}

function previewMultiCer(){
  const url     = document.getElementById('mMultiCerUrl').value.trim()
  const preview = document.getElementById('mMultiCerPreview')
  if(!url || multiCerTipoActual !== 'video'){ preview.style.display = 'none'; return }
  let embedUrl = url
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&\s]+)/)
  if(ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`
  preview.style.display = 'block'
  preview.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allowfullscreen style="width:100%;aspect-ratio:16/9;border-radius:8px"></iframe>`
}

function abrirModalMultimediaCeramista(id){
  multiCerEditandoId = id || null
  document.getElementById('tituloModalMultiCer').innerText = id ? 'Editar multimedia' : 'Agregar multimedia ceramista'
  if(!id){
    document.getElementById('mMultiCerId').value        = ''
    document.getElementById('mMultiCerTitulo').value    = ''
    document.getElementById('mMultiCerDesc').value      = ''
    document.getElementById('mMultiCerUrl').value       = ''
    document.getElementById('mMultiCerFoto').value      = ''
    document.getElementById('mMultiCerPublicado').value = 'true'
    document.getElementById('mMultiCerPreview').style.display = 'none'
    setMultiCerTipo('video', document.getElementById('mcerTipoVideo'))
  } else {
    const item = (cache['multimedia_ceramistas'] || []).find(i => i.id === id)
    if(item){
      document.getElementById('mMultiCerId').value        = item.id
      document.getElementById('mMultiCerTitulo').value    = item.titulo      || ''
      document.getElementById('mMultiCerDesc').value      = item.descripcion || ''
      document.getElementById('mMultiCerUrl').value       = item.url         || ''
      document.getElementById('mMultiCerFoto').value      = item.foto        || ''
      const pub = item.publicado === true || item.publicado === 'TRUE' || item.publicado === 'true'
      document.getElementById('mMultiCerPublicado').value = pub ? 'true' : 'false'
      const tipo = item.tipo || 'video'
      multiCerTipoActual = tipo
      const btnTipo = document.getElementById(tipo === 'video' ? 'mcerTipoVideo' : 'mcerTipoLink')
      if(btnTipo) setMultiCerTipo(tipo, btnTipo)
      previewMultiCer()
    }
  }
  document.getElementById('modalMultimediaCeramista').style.display = 'flex'
}

function editarMultimediaCeramista(id){ abrirModalMultimediaCeramista(id) }

function cerrarModalMultimediaCeramista(e){
  if(e && e.target !== document.getElementById('modalMultimediaCeramista')) return
  document.getElementById('modalMultimediaCeramista').style.display = 'none'
}

async function guardarMultimediaCeramista(){
  const titulo = document.getElementById('mMultiCerTitulo').value.trim()
  const url    = document.getElementById('mMultiCerUrl').value.trim()
  if(!titulo || !url){ toast('⚠️ Completá título y URL', 'err'); return }

  const sesion = getSesion()
  const fila   = {
    id:          multiCerEditandoId || 'MCE-' + Date.now(),
    tipo:        multiCerTipoActual,
    titulo,
    descripcion: document.getElementById('mMultiCerDesc').value.trim(),
    url,
    foto:        document.getElementById('mMultiCerFoto').value.trim(),
    publicado:   document.getElementById('mMultiCerPublicado').value,
    creadoEn:    multiCerEditandoId ? undefined : new Date().toLocaleDateString('es-AR')
  }

  try {
    const res  = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'guardarMultimediaCeramista', fila, token: sesion.token })
    })
    const data = await res.json()
    if(data.ok){
      delete cache['multimedia_ceramistas']
      document.getElementById('modalMultimediaCeramista').style.display = 'none'
      await cargarSeccionCeramista('multimedia_ceramistas')
      toast(multiCerEditandoId ? '✅ Actualizado' : '✅ Multimedia agregada', 'ok')
    } else { toast('❌ Error al guardar', 'err') }
  } catch(e){ toast('❌ Error de conexión', 'err') }
}

function eliminarMultimediaCeramista(id){
  abrirModalConfirmarAccion('¿Eliminar este item?', 'Esta acción no se puede deshacer.', async () => {
    try {
      const sesion = getSesion()
      const res    = await fetch(API, {
        method: 'POST',
        body: JSON.stringify({ action: 'eliminarMultimediaCeramista', id, token: sesion.token })
      })
      const data = await res.json()
      if(data.ok){
        delete cache['multimedia_ceramistas']
        await cargarSeccionCeramista('multimedia_ceramistas')
        toast('🗑 Eliminado', 'ok')
      }
    } catch(e){ toast('❌ Error', 'err') }
  })
}

// ─────────────────────────────────────────────
// TABS APUNTES (Alumnos / Ceramistas)
// ─────────────────────────────────────────────

let apuntesTabActual = 'alumnos'

function setApuntesTab(tab){
  apuntesTabActual = tab
  document.getElementById('apuntesTab-alumnos').classList.toggle('activo',    tab === 'alumnos')
  document.getElementById('apuntesTab-ceramistas').classList.toggle('activo', tab === 'ceramistas')
  document.getElementById('seccionApuntesAlumnos').style.display    = tab === 'alumnos'    ? 'block' : 'none'
  document.getElementById('seccionApuntesCeramistas').style.display = tab === 'ceramistas' ? 'block' : 'none'

  // Actualizar buscador placeholder
  const buscador = document.getElementById('buscar-apuntes')
  if(buscador) buscador.placeholder = tab === 'alumnos' ? 'Buscar apunte...' : 'Buscar recurso ceramista...'

  // Cargar si no hay datos
  if(tab === 'alumnos' && !cache['apuntes'])         cargarApuntesTabs()
  if(tab === 'ceramistas' && !cache['apuntes_ceramistas']) cargarSeccionCeramista('apuntes_ceramistas')
}

function abrirNuevoApunte(){
  if(apuntesTabActual === 'alumnos') abrirModal('apuntes')
  else                               abrirModal('apuntes_ceramistas')
}

function filtrarApuntesActual(){
  const hoja = apuntesTabActual === 'alumnos' ? 'apuntes' : 'apuntes_ceramistas'
  filtrarGrid(hoja)
}

function setFiltroApuntesActual(tipo, btn){
  const hoja = apuntesTabActual === 'alumnos' ? 'apuntes' : 'apuntes_ceramistas'
  // Actualizar botones activos
  btn.closest('.admin-pub-filtros').querySelectorAll('.admin-pub-btn').forEach(b => b.classList.remove('activo'))
  btn.classList.add('activo')
  setFiltroPublicado(hoja, tipo, btn)
}

async function cargarApuntesTabs(){
  // Cargar alumnos siempre, ceramistas en background
  const sesion  = getSesion()
  const loading = document.getElementById('loading-apuntes')
  const grid    = document.getElementById('grid-apuntes')
  if(!grid) return

  if(!cache['apuntes']){
    if(loading) loading.style.display = 'block'
    try {
      const res  = await fetch(`${API}?action=getAll&hoja=apuntes&token=${encodeURIComponent(sesion.token)}`)
      const data = await res.json()
      cache['apuntes'] = data.data || []
      renderGrid('apuntes', cache['apuntes'])
      armarFiltrosAdmin('apuntes', cache['apuntes'])
    } catch(e) {
      if(grid) grid.innerHTML = '<p style="opacity:0.5;padding:20px;grid-column:1/-1">Error al cargar.</p>'
    }
    if(loading) loading.style.display = 'none'
  } else {
    renderGrid('apuntes', cache['apuntes'])
  }

  // Actualizar contadores
  const totalAlu = (cache['apuntes'] || []).length
  const totalCer = (cache['apuntes_ceramistas'] || []).length
  const cntAlu = document.getElementById('cnt-apuntes-alumnos')
  const cntCer = document.getElementById('cnt-apuntes-ceramistas')
  if(cntAlu) cntAlu.innerText = totalAlu
  if(cntCer) cntCer.innerText = totalCer

  // Precargar ceramistas en background
  if(!cache['apuntes_ceramistas']){
    fetch(`${API}?action=getApuntesCeramistaAdmin&token=${encodeURIComponent(sesion.token)}`)
      .then(r => r.json())
      .then(d => {
        cache['apuntes_ceramistas'] = d.data || []
        const cntCerBg = document.getElementById('cnt-apuntes-ceramistas'); if(cntCerBg) cntCerBg.innerText = cache['apuntes_ceramistas'].length
      }).catch(() => {})
  }
}

// ─────────────────────────────────────────────
// TABS MULTIMEDIA (Alumnos / Ceramistas)
// ─────────────────────────────────────────────

let multimediaTabActual = 'alumnos'

function setMultimediaTab(tab){
  multimediaTabActual = tab
  multimediaHojaActual = tab === 'alumnos' ? 'multimedia' : 'multimedia_ceramistas'

  document.getElementById('multimediaTab-alumnos').classList.toggle('activo',    tab === 'alumnos')
  document.getElementById('multimediaTab-ceramistas').classList.toggle('activo', tab === 'ceramistas')
  document.getElementById('seccionMultimediaAlumnos').style.display    = tab === 'alumnos'    ? 'block' : 'none'
  document.getElementById('seccionMultimediaCeramistas').style.display = tab === 'ceramistas' ? 'block' : 'none'

  if(tab === 'alumnos' && !cache['multimedia'])               cargarMultimediaTabs()
  if(tab === 'ceramistas' && !cache['multimedia_ceramistas']) cargarSeccionCeramista('multimedia_ceramistas')
}

function abrirNuevoMultimedia(){
  multimediaHojaActual = multimediaTabActual === 'alumnos' ? 'multimedia' : 'multimedia_ceramistas'
  abrirModalMultimediaBase()
}

function filtrarMultimediaActual(){
  // Re-renderizar el grid activo con el filtro
  const hoja = multimediaTabActual === 'alumnos' ? 'multimedia' : 'multimedia_ceramistas'
  const busq = (document.getElementById('buscar-multimedia')?.value || '').toLowerCase()
  const grid = document.getElementById('grid-' + hoja)
  if(!grid || !cache[hoja]) return
  const filtrados = cache[hoja].filter(i => !busq || (i.titulo||'').toLowerCase().includes(busq))
  if(hoja === 'multimedia'){
    multimediaData = filtrados
    renderMultimediaGrid(filtrados)
  } else {
    renderGridCeramistaMul(hoja, filtrados)
  }
}

async function cargarMultimediaTabs(){
  if(!cache['multimedia']){
    await cargarMultimedia()
  } else {
    multimediaData = cache['multimedia']
    renderMultimedia()
  }
  // Actualizar contadores
  const totalAlu = (cache['multimedia'] || []).length
  const totalCer = (cache['multimedia_ceramistas'] || []).length
  const cntMAlu = document.getElementById('cnt-multimedia-alumnos')
  const cntMCer = document.getElementById('cnt-multimedia-ceramistas')
  if(cntMAlu) cntMAlu.innerText = totalAlu
  if(cntMCer) cntMCer.innerText = totalCer

  // Precargar ceramistas
  if(!cache['multimedia_ceramistas']){
    const sesion = getSesion()
    fetch(`${API}?action=getMultimediaCeramistaAdmin&token=${encodeURIComponent(sesion.token)}`)
      .then(r => r.json())
      .then(d => {
        cache['multimedia_ceramistas'] = d.data || []
        const cntMCerBg = document.getElementById('cnt-multimedia-ceramistas'); if(cntMCerBg) cntMCerBg.innerText = cache['multimedia_ceramistas'].length
      }).catch(() => {})
  }
}

// ─────────────────────────────────────────────
// TOGGLE PLAN PRO
// ─────────────────────────────────────────────

async function togglePlanUsuario(id, hoja, plan) {
  try {
    const sesion = getSesion()
    const res    = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'togglePlan', id, hoja, plan, token: sesion.token })
    })
    const data = await res.json()
    if(data.ok){
      await cargarUsuarios()
      toast(plan === 'pro' ? '⭐ Plan Pro activado' : '✓ Plan cambiado a Free', 'ok')
    } else {
      toast('❌ Error al cambiar el plan', 'err')
    }
  } catch(e) {
    toast('❌ Error de conexión', 'err')
  }
}

// ─────────────────────────────────────────────
// GENERADOR PDF CON IA
// ─────────────────────────────────────────────

let tipoDocActual    = 'general'
let contenidoFormateado = null

function setTipo(btn){
  document.querySelectorAll('.pdfgen-tipo').forEach(b => b.classList.remove('activo'))
  btn.classList.add('activo')
  tipoDocActual = btn.dataset.tipo
}

const PROMPTS_TIPO = {
  general: 'Sos un asistente experto de YCA Ceramica, un taller de ceramica artesanal argentino. Toma el contenido y convertilo en un documento profesional completo. REGLAS: mejora y expande el contenido si es necesario, no lo copies tal cual. Usa tono calido y ceramistero. Titulos con ##, subtitulos con ###, listas con -, negritas con **texto**. Agrega emojis en los titulos. Si hay placeholders como [nombre] mantenelos. Responde SOLO con el documento sin comentarios.',
  presupuesto: 'Sos un asistente experto de YCA Ceramica. Convierte el contenido en un presupuesto profesional completo. REGLAS: estructura con datos del cliente, descripcion del trabajo, materiales, mano de obra y total. Agrega condiciones (validez, forma de pago, entrega). Usa ## para secciones, - para items, **negrita** para montos. Si hay placeholders como [nombre] mantenelos. Responde SOLO con el documento.',
  certificado: 'Sos un asistente experto de YCA Ceramica. Crea un certificado de participacion profesional y emotivo. REGLAS: empieza con ## CERTIFICADO DE PARTICIPACION. El nombre del alumno va en linea propia con ## en mayusculas. Incluye nombre del curso, duracion, habilidades desarrolladas, fecha y lugar. Tono formal calido y motivador. Termina con una frase inspiradora sobre ceramica. USA GUIONES - para listas, NUNCA asteriscos *. Si hay placeholders como [nombre] mantenelos. Responde SOLO con el certificado.',
  ficha: 'Sos un asistente experto de YCA Ceramica. Convierte el contenido en una ficha tecnica clara y detallada. REGLAS: secciones con ##, propiedades con -, incluye datos tecnicos como temperaturas y tiempos. Tono tecnico y preciso. Responde SOLO con la ficha.',
  receta: 'Sos un asistente experto de YCA Ceramica. Convierte el contenido en una receta o formula ceramica profesional. REGLAS: secciones ## para Nombre, Materiales, Proceso, Temperatura, Notas. Materiales con - y porcentaje en **negrita**. Proceso numerado. Incluye temperatura de coccion y cono. Responde SOLO con la receta.',
}

async function generarConIA(){
  const contenido = document.getElementById('pdfgenContenido').value.trim()
  if(!contenido){
    toast('⚠ Pegá el contenido primero', 'err')
    return
  }

  const sesion = getSesion()
  if(!sesion || !sesion.token){
    toast('⚠ Necesitás estar logueado como admin', 'err')
    return
  }

  const btn = document.getElementById('btnGenerarPDF')
  btn.disabled = true
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Formateando...'

  document.getElementById('pdfgenVacio').style.display    = 'none'
  document.getElementById('pdfgenPreview').style.display  = 'none'
  document.getElementById('pdfgenLoading').style.display  = 'flex'
  document.getElementById('btnDescargaPDF').style.display = 'none'

  try {
    const titulo = document.getElementById('pdfgenTitulo').value.trim()

    const res  = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({
        action:    'geminiFormat',
        token:     sesion.token,
        contenido: contenido,
        tipo:      tipoDocActual,
        titulo:    titulo
      })
    })

    const data = await res.json()

    if(!data.ok){
      throw new Error(data.error || 'Error al formatear')
    }

    contenidoFormateado = { markdown: data.markdown, titulo, tipo: tipoDocActual }
    renderizarPreview(data.markdown, titulo)

  } catch(e) {
    toast('❌ ' + (e.message || 'Error al conectar'), 'err')
    document.getElementById('pdfgenVacio').style.display = 'flex'
  } finally {
    document.getElementById('pdfgenLoading').style.display = 'none'
    btn.disabled = false
    btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Formatear con IA y previsualizar'
  }
}

// ─────────────────────────────────────────────
// RENDERIZAR PREVIEW
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// TWEMOJI — cargar emoji como imagen PNG desde CDN
// ─────────────────────────────────────────────

const _twemojiCache = {}

function emojiToCodepoint(emoji){
  // Convierte emoji a codepoint hex para URL de Twemoji
  const points = []
  let i = 0
  while(i < emoji.length){
    const code = emoji.codePointAt(i)
    if(code !== 0xFE0F && code !== 0x200D) points.push(code.toString(16))
    i += code > 0xFFFF ? 2 : 1
  }
  return points.join('-')
}

async function cargarTwemoji(emoji){
  const cp  = emojiToCodepoint(emoji)
  if(!cp) return null
  if(_twemojiCache[cp]) return _twemojiCache[cp]
  try {
    const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${cp}.png`
    const res = await fetch(url)
    if(!res.ok) return null
    const blob   = await res.blob()
    const base64 = await new Promise(resolve => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
    _twemojiCache[cp] = base64
    return base64
  } catch(e){ return null }
}

// Detectar emojis en un string
function extraerEmojis(txt){
  const regex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu
  return [...new Set((txt.match(regex) || []))]
}

// Pre-cargar todos los emojis de un markdown
async function precargarEmojis(markdown){
  const todos = extraerEmojis(markdown)
  await Promise.all(todos.map(e => cargarTwemoji(e)))
}

// Renderizar línea con emojis en jsPDF
// Devuelve el nuevo valor de y
function normalizarUnicode(txt){
  if(!txt) return ''
  var r = txt
  // Subindices numericos
  var sub = {'\u2080':'0','\u2081':'1','\u2082':'2','\u2083':'3','\u2084':'4',
             '\u2085':'5','\u2086':'6','\u2087':'7','\u2088':'8','\u2089':'9'}
  // Superindices
  var sup = {'\u2070':'0','\u00B9':'1','\u00B2':'2','\u00B3':'3','\u2074':'4',
             '\u2075':'5','\u2076':'6','\u2077':'7','\u2078':'8','\u2079':'9'}
  // Caracteres especiales
  var map = {
    '\u2192':'->','\u2190':'<-','\u2191':'^','\u2193':'v',
    '\u2248':'~','\u2260':'!=','\u2264':'<=','\u2265':'>=',
    '\u00B1':'+/-','\u00D7':'x','\u00F7':'/',
    '\u2014':'-','\u2013':'-','\u2026':'...',
    '\u00B7':'.','\u00B0':' grados ',
    '\u2018':"'",'\u2019':"'",'\u201C':'"','\u201D':'"',
    '\u00E1':'a','\u00E9':'e','\u00ED':'i','\u00F3':'o','\u00FA':'u',
    '\u00C1':'A','\u00C9':'E','\u00CD':'I','\u00D3':'O','\u00DA':'U',
    '\u00F1':'n','\u00D1':'N','\u00FC':'u','\u00DC':'U',
    '\u00E0':'a','\u00E8':'e','\u00EC':'i','\u00F2':'o','\u00F9':'u',
    '\u00E7':'c','\u00C7':'C'
  }
  var result = ''
  for(var i = 0; i < r.length; i++){
    var ch = r[i]
    var code = r.charCodeAt(i)
    if(sub[ch] !== undefined){ result += sub[ch] }
    else if(sup[ch] !== undefined){ result += sup[ch] }
    else if(map[ch] !== undefined){ result += map[ch] }
    else if(code <= 255){ result += ch }
    // chars > 255 que no estan en el map se eliminan
  }
  return result
}

async function renderLineaConEmojis(doc, texto, x, y, fontSize, maxW){
  const EMOJI_RE = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu
  const partes   = []
  let ultimo = 0
  let match

  EMOJI_RE.lastIndex = 0
  while((match = EMOJI_RE.exec(texto)) !== null){
    if(match.index > ultimo) partes.push({ tipo:'texto', val: texto.slice(ultimo, match.index) })
    partes.push({ tipo:'emoji', val: match[0] })
    ultimo = match.index + match[0].length
  }
  if(ultimo < texto.length) partes.push({ tipo:'texto', val: texto.slice(ultimo) })

  if(partes.length === 0 || (partes.length === 1 && partes[0].tipo === 'texto')){
    // Sin emojis — render normal
    const lines = doc.splitTextToSize(texto, maxW)
    doc.text(lines, x, y)
    return y + lines.length * (fontSize * 0.352778 * 1.4)
  }

  // Con emojis — render inline
  const emojiSizeMM = fontSize * 0.352778 * 1.1
  let cx = x

  for(const parte of partes){
    if(parte.tipo === 'texto' && parte.val.trim()){
      doc.setFontSize(fontSize)
      const w = doc.getTextWidth(parte.val)
      if(cx + w > x + maxW){ cx = x; y += fontSize * 0.352778 * 1.4 }
      doc.text(parte.val, cx, y)
      cx += w
    } else if(parte.tipo === 'emoji'){
      const b64 = _twemojiCache[emojiToCodepoint(parte.val)]
      if(b64){
        if(cx + emojiSizeMM > x + maxW){ cx = x; y += fontSize * 0.352778 * 1.4 }
        try {
          doc.addImage(b64, 'PNG', cx, y - emojiSizeMM * 0.8, emojiSizeMM, emojiSizeMM)
        } catch(e){}
        cx += emojiSizeMM + 0.5
      }
    } else if(parte.tipo === 'texto' && parte.val === ' '){
      cx += doc.getTextWidth(' ')
    }
  }
  return y + fontSize * 0.352778 * 1.4
}


function renderizarPreview(markdown, titulo){
  const el  = document.getElementById('pdfgenPreview')
  const hoy = new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric' })

  // Convertir markdown simple a HTML
  let html = markdown
    .replace(/^### (.+)$/gm,       '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,        '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,         '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,         '<em>$1</em>')
    .replace(/^- (.+)$/gm,         '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm,   '<li>$2</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/^---$/gm,            '<hr>')
    .replace(/\n\n/g,              '</p><p>')
    .replace(/\n/g,                '<br>')

  html = `<p>${html}</p>`
    .replace(/<p><h/g, '<h').replace(/<\/h(\d)><\/p>/g, '</h$1>')
    .replace(/<p><ul>/g, '<ul>').replace(/<\/ul><\/p>/g, '</ul>')
    .replace(/<p><hr><\/p>/g, '<hr>')
    .replace(/<p><\/p>/g, '')

  el.innerHTML = `
    <div class="membrete">
      <strong>YCA Cerámica</strong> — ycaceramica.com.ar<br>
      📷 @ycaceramica  |  🎵 @yca.ceramica  |  ${hoy}
      ${titulo ? `<br><strong>📄 ${titulo}</strong>` : ''}
    </div>
    ${html}
  `

  el.style.display = 'flex'
  el.style.flexDirection = 'column'
  document.getElementById('btnDescargaPDF').style.display = 'flex'
}

// ─────────────────────────────────────────────
// GENERAR PDF
// ─────────────────────────────────────────────

async function descargarPDFGen(){
  if(!contenidoFormateado) return

  const btn = document.getElementById('btnDescargaPDF')
  btn.disabled = true
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...'

  try {
    // Pre-cargar todos los emojis del documento
    await precargarEmojis(contenidoFormateado.markdown + ' ' + (contenidoFormateado.titulo || ''))

    const { jsPDF }  = window.jspdf
    const doc        = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
    const W = 210, m = 18
    const MARRON=[139,111,86], NEGRO=[40,35,30], BLANCO=[255,255,255], GRIS=[245,240,235]

    // Encabezado membrete
    doc.setFillColor(...MARRON)
    doc.rect(0, 0, W, 38, 'F')

    try {
      const logo = await cargarLogoBase64Gen()
      if(logo) doc.addImage(logo, 'PNG', m, 7, 22, 22)
    } catch(e){}

    doc.setTextColor(...BLANCO)
    doc.setFontSize(20); doc.setFont('helvetica','bold')
    doc.text('YCA Ceramica', m + 26, 17)
    doc.setFontSize(9); doc.setFont('helvetica','normal')
    doc.text('ycaceramica.com.ar  |  @ycaceramica  |  @yca.ceramica', m + 26, 24)

    const hoy = new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'long', year:'numeric' })
    doc.setFontSize(8)
    doc.text(hoy, W - m, 31, { align:'right' })
    const tipoLabel = { general:'Documento', presupuesto:'Presupuesto', certificado:'Certificado', ficha:'Ficha Tecnica', receta:'Receta / Formula' }
    doc.text(tipoLabel[contenidoFormateado.tipo] || 'Documento', m + 26, 31)

    let y = 46

    // Título
    if(contenidoFormateado.titulo){
      doc.setTextColor(...MARRON)
      doc.setFontSize(16); doc.setFont('helvetica','bold')
      y = await renderLineaConEmojis(doc, normalizarUnicode(contenidoFormateado.titulo), m, y, 16, W - m*2)
      y += 2
      doc.setDrawColor(...MARRON); doc.setLineWidth(0.5)
      doc.line(m, y, W - m, y)
      y += 8
    }

    // Contenido
    const lineas = contenidoFormateado.markdown.split('\n')

    for(const linea of lineas){
      if(y > 272){ doc.addPage(); y = 20 }

      if(linea.startsWith('## ')){
        y += 4
        doc.setTextColor(...MARRON); doc.setFontSize(13); doc.setFont('helvetica','bold')
        const txt = normalizarUnicode(linea.replace(/^## /, '').replace(/\*\*/g,''))
        y = await renderLineaConEmojis(doc, txt, m, y, 13, W - m*2)
        doc.setDrawColor(200,185,170); doc.setLineWidth(0.3)
        doc.line(m, y, W - m, y)
        y += 5

      } else if(linea.startsWith('### ')){
        y += 3
        doc.setTextColor(...NEGRO); doc.setFontSize(11); doc.setFont('helvetica','bold')
        const txt = normalizarUnicode(linea.replace(/^### /, '').replace(/\*\*/g,''))
        y = await renderLineaConEmojis(doc, txt, m, y, 11, W - m*2)
        y += 2

      } else if(linea.startsWith('# ')){
        y += 4
        doc.setTextColor(...MARRON); doc.setFontSize(16); doc.setFont('helvetica','bold')
        const txt = normalizarUnicode(linea.replace(/^# /, '').replace(/\*\*/g,''))
        y = await renderLineaConEmojis(doc, txt, m, y, 16, W - m*2)
        y += 2

      } else if(linea.startsWith('- ') || linea.match(/^\d+\. /)){
        doc.setTextColor(...NEGRO); doc.setFontSize(10); doc.setFont('helvetica','normal')
        const txt = '• ' + normalizarUnicode(linea.replace(/^- /, '').replace(/^\d+\. /, '').replace(/\*\*(.+?)\*\*/g,'$1'))
        y = await renderLineaConEmojis(doc, txt, m + 4, y, 10, W - m*2 - 4)

      } else if(linea.startsWith('---')){
        doc.setDrawColor(200,185,170); doc.setLineWidth(0.3)
        doc.line(m, y, W - m, y)
        y += 6

      } else if(linea.trim() === ''){
        y += 3

      } else {
        doc.setTextColor(...NEGRO); doc.setFontSize(10); doc.setFont('helvetica','normal')
        const txt = normalizarUnicode(linea.replace(/\*\*(.+?)\*\*/g,'$1').replace(/\*(.+?)\*/g,'$1'))
        y = await renderLineaConEmojis(doc, txt, m, y, 10, W - m*2)
      }
    }

    // Pie
    const totalPages = doc.getNumberOfPages()
    for(let i = 1; i <= totalPages; i++){
      doc.setPage(i)
      doc.setFillColor(...GRIS); doc.rect(0, 287, W, 10, 'F')
      doc.setTextColor(160,150,140); doc.setFontSize(7); doc.setFont('helvetica','normal')
      doc.text('ycaceramica.com.ar  |  YCA Ceramica 2026', W/2, 293, { align:'center' })
      doc.text(`${i} / ${totalPages}`, W - m, 293, { align:'right' })
    }

    const nombreArchivo = (contenidoFormateado.titulo || 'YCA_Documento').replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'')
    doc.save(`YCA_${nombreArchivo}.pdf`)

  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> Descargar PDF'
  }
}

function cargarLogoBase64Gen(){
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width; canvas.height = img.height
      canvas.getContext('2d').drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(null)
    img.src = '../imagenes/logo.png'
  })
}

// ─────────────────────────────────────────────
// SUPERADMIN — TOGGLE MANTENIMIENTO
// ─────────────────────────────────────────────

async function toggleMantenimiento(valor){
  try {
    const sesion = getSesion()
    const res = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({
        action: 'toggleMantenimiento',
        valor:  valor,
        token:  sesion.token
      })
    })
    const data = await res.json()
    if(data.ok){
      toast(valor ? '🔒 Modo mantenimiento activado' : '✅ Sitio visible para todos', 'ok')
      // Recargar estado con delay para que Sheets actualice
      setTimeout(() => cargarEstadoMantenimiento(), 2000)
    } else {
      toast('❌ Error: ' + (data.error || 'No autorizado'), 'err')
      // Revertir el toggle visualmente
      document.getElementById('switchMantenimiento').checked = !valor
    }
  } catch(e){
    toast('❌ Error de conexión', 'err')
    document.getElementById('switchMantenimiento').checked = !valor
  }
}

// ─────────────────────────────────────────────
// BLOC DE NOTAS
// ─────────────────────────────────────────────

let notasDebounce = null
let notasCargadas = false

async function cargarNotas() {
  if (notasCargadas) return
  const sesion = getSesion()
  try {
    const res  = await fetch(`${API}?action=getNotas&token=${encodeURIComponent(sesion.token)}`)
    const data = await res.json()
    if (!data.ok) { toast('❌ Error al cargar notas', 'err'); return }

    const notas = data.notas || {}

    // Notas libres
    document.getElementById('notasTexto').value = notas.texto || ''

    // Pendientes
    pendientesData = notas.pendientes || []
    renderPendientes()

    notasCargadas = true

    // Auto-save al escribir
    document.getElementById('notasTexto').addEventListener('input', () => {
      clearTimeout(notasDebounce)
      setGuardadoMsg('Guardando...')
      notasDebounce = setTimeout(guardarNotasTexto, 1200)
    })
  } catch(e) {
    toast('❌ Error de conexión', 'err')
  }
}

function setNotasTab(tab) {
  document.querySelectorAll('.notas-tab').forEach(b => b.classList.remove('activo'))
  document.getElementById('ntab-' + tab).classList.add('activo')
  document.getElementById('notas-panel-libres').style.display     = tab === 'libres'     ? 'flex' : 'none'
  document.getElementById('notas-panel-pendientes').style.display = tab === 'pendientes' ? 'flex' : 'none'
}

function setGuardadoMsg(msg) {
  const el = document.getElementById('notasGuardadoMsg')
  if (el) el.textContent = msg
}

async function guardarNotasTexto() {
  const sesion = getSesion()
  const texto  = document.getElementById('notasTexto').value
  try {
    const res  = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'guardarNotas', token: sesion.token, tipo: 'texto', valor: texto })
    })
    const data = await res.json()
    setGuardadoMsg(data.ok ? 'Guardado ✓' : '❌ Error al guardar')
    if (data.ok) setTimeout(() => setGuardadoMsg(''), 2500)
  } catch(e) {
    setGuardadoMsg('❌ Error de conexión')
  }
}

// ── Pendientes ──

let pendientesData = []

function renderPendientes() {
  const lista = document.getElementById('pendientesLista')
  if (!lista) return
  lista.innerHTML = ''
  pendientesData.forEach((item, i) => {
    const li = document.createElement('li')
    li.className = 'pendiente-item' + (item.hecho ? ' hecho' : '')
    li.innerHTML = `
      <input type="checkbox" class="pendiente-check" ${item.hecho ? 'checked' : ''}
        onchange="togglePendiente(${i})">
      <span class="pendiente-texto">${item.texto}</span>
      <button class="pendiente-borrar" onclick="borrarPendiente(${i})" title="Eliminar">
        <i class="fa-solid fa-xmark"></i>
      </button>`
    lista.appendChild(li)
  })
}

function agregarPendiente() {
  const input = document.getElementById('pendienteInput')
  const texto = input.value.trim()
  if (!texto) return
  pendientesData.push({ texto, hecho: false })
  input.value = ''
  renderPendientes()
  guardarPendientes()
}

function togglePendiente(i) {
  pendientesData[i].hecho = !pendientesData[i].hecho
  renderPendientes()
  guardarPendientes()
}

function borrarPendiente(i) {
  pendientesData.splice(i, 1)
  renderPendientes()
  guardarPendientes()
}

async function guardarPendientes() {
  const sesion = getSesion()
  try {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'guardarNotas', token: sesion.token, tipo: 'pendientes', valor: pendientesData })
    })
  } catch(e) { /* silencioso */ }
}
