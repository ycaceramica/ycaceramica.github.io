// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────

const API = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'

// ─────────────────────────────────────────────
// MODO OSCURO
// ─────────────────────────────────────────────

function actualizarIcono(){
  const btn = document.getElementById('toggleDark')
  if(btn) btn.innerText = document.body.classList.contains('dark') ? '☀️' : '🌙'
}

function aplicarModoOscuro(){
  if(localStorage.getItem('dark') === 'true') document.body.classList.add('dark')
  actualizarIcono()
}

aplicarModoOscuro()

const toggleDark = document.getElementById('toggleDark')
if(toggleDark){
  toggleDark.addEventListener('click', () => {
    document.body.classList.toggle('dark')
    localStorage.setItem('dark', document.body.classList.contains('dark'))
    actualizarIcono()
  })
}

// ─────────────────────────────────────────────
// MENU HAMBURGUESA
// ─────────────────────────────────────────────

const hamburguesa = document.getElementById('hamburguesa')
const nav         = document.getElementById('nav')

if(hamburguesa){
  hamburguesa.addEventListener('click', () => nav.classList.toggle('active'))
}

document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', () => nav.classList.remove('active'))
})

window.addEventListener('scroll', () => {
  if(nav) nav.classList.remove('active')
})

// ─────────────────────────────────────────────
// SESIÓN
// ─────────────────────────────────────────────

function getSesion(){
  try { return JSON.parse(sessionStorage.getItem('yca_sesion')) }
  catch(e) { return null }
}

function cerrarSesion(){
  sessionStorage.removeItem('yca_sesion')
  window.location.href = '../login/index.html'
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  const sesion = getSesion()

  // Si no está logueado → login
  if(!sesion){
    window.location.href = '../login/index.html'
    return
  }

  // Si es admin → panel admin
  if(sesion.rol === 'admin'){
    window.location.href = '../admin/index.html'
    return
  }

  // Es alumno — mostrar datos
  const nombre = sesion.nombre || 'Alumno'
  document.getElementById('cuentaNombre').innerText  = `Hola, ${nombre} 👋`
  document.getElementById('cuentaAvatar').innerText  = nombre[0].toUpperCase()

  cargarApuntes(sesion)
})

// ─────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────

function setTab(tab){
  document.querySelectorAll('.ctab').forEach(b => b.classList.remove('activo'))
  document.getElementById('ctab-' + tab).classList.add('activo')
  document.querySelectorAll('.cuenta-seccion').forEach(s => s.style.display = 'none')
  document.getElementById('sec-' + tab).style.display = 'block'
}

// ─────────────────────────────────────────────
// CARGAR APUNTES
// ─────────────────────────────────────────────

async function cargarApuntes(sesion){
  const grid = document.getElementById('apuntesGrid')

  try {
    const res  = await fetch(`${API}?action=getAll&hoja=apuntes&token=${encodeURIComponent(sesion.token)}`)
    const data = await res.json()
    const todos = data.data || []

    // Filtrar por curso del alumno
    const curso    = sesion.curso || ''
    const apuntes  = todos.filter(a =>
      !curso || a.curso === curso || a.curso === 'General' || a.curso === ''
    )

    // Actualizar subtítulo con el curso
    if(curso){
      document.getElementById('cuentaCurso').innerText = `📚 ${curso}`
    }

    grid.innerHTML = ''

    if(apuntes.length === 0){
      grid.innerHTML = `
        <div class="cuenta-vacio">
          <i class="fa-solid fa-book-open"></i>
          <p>Todavía no hay apuntes disponibles para tu curso.</p>
        </div>`
      return
    }

    // Separar apuntes con archivo (materiales) y sin archivo (apuntes de texto)
    const conArchivo = apuntes.filter(a => a.archivoUrl)
    renderApuntes(apuntes)
    renderMateriales(conArchivo)

  } catch(e) {
    grid.innerHTML = `
      <div class="cuenta-vacio">
        <i class="fa-solid fa-circle-exclamation"></i>
        <p>Error al cargar. Intentá de nuevo más tarde.</p>
      </div>`
  }
}

function renderApuntes(apuntes){
  const grid = document.getElementById('apuntesGrid')
  grid.innerHTML = ''

  if(apuntes.length === 0){
    grid.innerHTML = `
      <div class="cuenta-vacio">
        <i class="fa-solid fa-book-open"></i>
        <p>Todavía no hay apuntes disponibles.</p>
      </div>`
    return
  }

  apuntes.forEach(a => {
    const card = document.createElement('div')
    card.className = 'apunte-card'
    card.innerHTML = `
      <div class="apunte-icono"><i class="fa-solid fa-book-open"></i></div>
      <div class="apunte-curso">${a.curso || 'General'}</div>
      <h3 class="apunte-titulo">${a.titulo || ''}</h3>
      ${a.contenido ? `<p class="apunte-contenido">${a.contenido}</p>` : ''}
      ${a.archivoUrl ? `
        <a class="apunte-btn" href="${a.archivoUrl}" target="_blank">
          <i class="fa-solid fa-file-pdf"></i> Ver archivo
        </a>` : ''}
      <span class="apunte-fecha">${a.creadoEn || ''}</span>
    `
    grid.appendChild(card)
  })
}

function renderMateriales(materiales){
  const lista = document.getElementById('materialesLista')
  lista.innerHTML = ''

  if(materiales.length === 0){
    lista.innerHTML = `
      <div class="cuenta-vacio">
        <i class="fa-solid fa-file-pdf"></i>
        <p>No hay materiales disponibles todavía.</p>
      </div>`
    return
  }

  materiales.forEach(m => {
    const item = document.createElement('a')
    item.className = 'material-item'
    item.href      = m.archivoUrl
    item.target    = '_blank'
    item.innerHTML = `
      <div class="material-icono"><i class="fa-solid fa-file-pdf"></i></div>
      <div class="material-info">
        <div class="material-nombre">${m.titulo || ''}</div>
        <div class="material-curso">${m.curso || 'General'}</div>
      </div>
      <i class="fa-solid fa-arrow-up-right-from-square material-arrow"></i>
    `
    lista.appendChild(item)
  })
}
