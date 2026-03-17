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

window.addEventListener('DOMContentLoaded', async () => {
  const sesion = getSesion()

  if(!sesion){
    window.location.href = '../login/index.html'
    return
  }

  if(sesion.rol === 'admin'){
    window.location.href = '../admin/index.html'
    return
  }

  // Mostrar nombre y avatar
  const nombre = sesion.nombre || 'Alumno'
  const avatar = document.getElementById('cuentaAvatar')
  avatar.innerText = nombre[0].toUpperCase()

  // Forzar círculo — sobreescribe cualquier CSS heredado
  avatar.style.cssText = `
    width: 56px !important;
    height: 56px !important;
    min-width: 56px !important;
    min-height: 56px !important;
    max-width: 56px !important;
    max-height: 56px !important;
    border-radius: 50% !important;
    flex-shrink: 0 !important;
    flex-grow: 0 !important;
    flex-basis: 56px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    overflow: hidden !important;
    line-height: 1 !important;
    padding: 0 !important;
  `

  document.getElementById('cuentaNombre').innerText = `Hola, ${nombre} 👋`

  // Mostrar nombre real del curso — soporta múltiples
  const cursoId     = sesion.curso || ''
  const cursoNombre = sesion.cursoNombre || cursoId

  if(cursoNombre){
    document.getElementById('cuentaCurso').innerText = `🎓 ${cursoNombre}`
  } else {
    document.getElementById('cuentaCurso').innerText = 'Sin curso asignado'
  }

  cargarApuntes(sesion)
  cargarMultimediaCuenta(sesion)
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
// Usa acción pública getApuntesAlumno — no requiere token admin
// ─────────────────────────────────────────────

async function cargarApuntes(sesion){
  const grid = document.getElementById('apuntesGrid')

  try {
    const cursoId = sesion.curso || ''

    // Usar acción pública para alumnos
    const res  = await fetch(`${API}?action=getApuntesAlumno&curso=${encodeURIComponent(cursoId)}`)
    const data = await res.json()

    if(!data.ok && data.error){
      throw new Error(data.error)
    }

    const apuntes = data.data || []

    grid.innerHTML = ''

    if(apuntes.length === 0){
      grid.innerHTML = `
        <div class="cuenta-vacio">
          <i class="fa-solid fa-book-open"></i>
          <p>Todavía no hay apuntes disponibles para tu curso.</p>
        </div>`
      // También limpiar multimedia
      document.getElementById('multimediaLista').innerHTML = `
        <div class="cuenta-vacio">
          <i class="fa-solid fa-images"></i>
          <p>No hay contenido multimedia todavía.</p>
        </div>`
      return
    }

    renderApuntes(apuntes)

  } catch(e) {
    grid.innerHTML = `
      <div class="cuenta-vacio">
        <i class="fa-solid fa-circle-exclamation"></i>
        <p>Error al cargar. Intentá recargar la página.</p>
      </div>`
  }
}

// ─────────────────────────────────────────────
// RENDER APUNTES
// ─────────────────────────────────────────────

function renderApuntes(apuntes){
  const grid = document.getElementById('apuntesGrid')
  grid.innerHTML = ''

  // Solo apuntes publicados
  const visibles = apuntes.filter(a =>
    a.publicado === 'true' || a.publicado === true || a.publicado === 'TRUE'
  )

  if(visibles.length === 0){
    grid.innerHTML = `
      <div class="cuenta-vacio">
        <i class="fa-solid fa-book-open"></i>
        <p>Todavía no hay apuntes disponibles.</p>
      </div>`
    return
  }

  visibles.forEach(a => {
    const card = document.createElement('div')
    card.className = 'apunte-card'

    // Preview: miniatura subida, o primera página del PDF como iframe, o ícono
    let previewHTML = ''
    if(a.miniatura){
      previewHTML = `<div class="apunte-preview"><img src="${a.miniatura}" alt="${a.titulo || ''}"></div>`
    } else if(a.archivoUrl){
      previewHTML = `
        <div class="apunte-preview apunte-preview-pdf">
          <iframe src="${a.archivoUrl}" scrolling="no" frameborder="0"></iframe>
          <div class="apunte-preview-overlay">
            <i class="fa-solid fa-file-pdf"></i>
          </div>
        </div>`
    } else {
      previewHTML = `<div class="apunte-preview apunte-preview-icon"><i class="fa-solid fa-book-open"></i></div>`
    }

    card.innerHTML = `
      ${previewHTML}
      <div class="apunte-card-body">
        <div class="apunte-curso">${a.curso || 'General'}</div>
        <h3 class="apunte-titulo">${a.titulo || ''}</h3>
        ${a.contenido ? `<p class="apunte-contenido">${a.contenido}</p>` : ''}
        <div class="apunte-footer">
          <span class="apunte-fecha">${a.creadoEn || ''}</span>
          ${a.archivoUrl ? `
            <a class="apunte-btn" href="${a.archivoUrl}" target="_blank">
              <i class="fa-solid fa-file-pdf"></i> Ver PDF
            </a>` : ''}
        </div>
      </div>
    `
    grid.appendChild(card)
  })
}

// ─────────────────────────────────────────────
// MULTIMEDIA
// ─────────────────────────────────────────────

async function cargarMultimediaCuenta(sesion){
  const lista = document.getElementById('multimediaLista')

  try {
    const cursoId = sesion.curso || ''
    const res     = await fetch(`${API}?action=getMultimediaAlumno&curso=${encodeURIComponent(cursoId)}`)
    const data    = await res.json()
    const items   = data.data || []

    lista.innerHTML = ''

    if(items.length === 0){
      lista.innerHTML = `
        <div class="cuenta-vacio">
          <i class="fa-solid fa-photo-film"></i>
          <p>No hay contenido multimedia todavía.</p>
        </div>`
      return
    }

    const fotos  = items.filter(m => m.tipo === 'foto'  && m.foto)
    const videos = items.filter(m => m.tipo === 'video' && m.url)

    // Fotos
    if(fotos.length > 0){
      const secFotos = document.createElement('div')
      secFotos.innerHTML = '<h3 class="multimedia-subtitulo"><i class="fa-solid fa-images"></i> Fotos</h3>'
      const grid = document.createElement('div')
      grid.className = 'multimedia-fotos-grid'
      fotos.forEach(f => {
        const img     = document.createElement('img')
        img.src       = f.foto
        img.alt       = f.titulo || 'Foto del curso'
        img.loading   = 'lazy'
        img.className = 'multimedia-foto-item'
        img.onclick   = () => abrirFotoFullscreen(f.foto)
        grid.appendChild(img)
      })
      secFotos.appendChild(grid)
      lista.appendChild(secFotos)
    }

    // Videos
    if(videos.length > 0){
      const secVideos = document.createElement('div')
      secVideos.innerHTML = '<h3 class="multimedia-subtitulo"><i class="fa-solid fa-play"></i> Videos</h3>'
      videos.forEach(v => {
        const embedUrl = getEmbedUrlCuenta(v.url)
        const div      = document.createElement('div')
        div.className  = 'multimedia-video-item'
        if(v.titulo){
          const titulo       = document.createElement('p')
          titulo.className   = 'multimedia-video-titulo'
          titulo.textContent = v.titulo
          div.appendChild(titulo)
        }
        if(embedUrl){
          div.innerHTML += `<div class="multimedia-video-wrapper"><iframe src="${embedUrl}" allowfullscreen loading="lazy"></iframe></div>`
        } else {
          div.innerHTML += `<a class="multimedia-video-link" href="${v.url}" target="_blank"><i class="fa-solid fa-external-link"></i> Ver video</a>`
        }
        secVideos.appendChild(div)
      })
      lista.appendChild(secVideos)
    }

  } catch(e) {
    lista.innerHTML = `
      <div class="cuenta-vacio">
        <i class="fa-solid fa-circle-exclamation"></i>
        <p>Error al cargar. Intentá recargar la página.</p>
      </div>`
  }
}

function getEmbedUrlCuenta(url){
  if(!url) return null
  const yt  = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if(yt)  return `https://www.youtube.com/embed/${yt[1]}`
  const yts = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/)
  if(yts) return `https://www.youtube.com/embed/${yts[1]}`
  return null
}

function abrirFotoFullscreen(src){
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.92);
    z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:20px;
  `
  overlay.innerHTML = `<img src="${src}" style="max-width:95vw;max-height:95vh;border-radius:8px;object-fit:contain;">`
  overlay.onclick   = () => overlay.remove()
  document.body.appendChild(overlay)
}

// ─────────────────────────────────────────────
// CAMBIAR CONTRASEÑA
// ─────────────────────────────────────────────

function togglePassCuenta(inputId, btn){
  const input = document.getElementById(inputId)
  const icono = btn.querySelector('i')
  if(input.type === 'password'){
    input.type = 'text'
    icono.className = 'fa-regular fa-eye-slash'
  } else {
    input.type = 'password'
    icono.className = 'fa-regular fa-eye'
  }
}

async function cambiarContrasena(){
  const actual   = document.getElementById('passActual').value.trim()
  const nueva    = document.getElementById('passNueva').value.trim()
  const repetir  = document.getElementById('passRepetir').value.trim()
  const errorDiv = document.getElementById('passError')
  const errorMsg = document.getElementById('passErrorMsg')
  const succDiv  = document.getElementById('passSuccess')

  errorDiv.style.display = 'none'
  succDiv.style.display  = 'none'

  if(!actual || !nueva || !repetir){
    errorMsg.innerText = 'Completá todos los campos'
    errorDiv.style.display = 'flex'
    return
  }

  if(nueva.length < 6){
    errorMsg.innerText = 'La nueva contraseña debe tener al menos 6 caracteres'
    errorDiv.style.display = 'flex'
    return
  }

  if(nueva !== repetir){
    errorMsg.innerText = 'Las contraseñas nuevas no coinciden'
    errorDiv.style.display = 'flex'
    return
  }

  const btn = document.getElementById('btnCambiarPass')
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...'
  btn.disabled  = true

  try {
    const sesion = getSesion()
    const res    = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({
        action:   'cambiarContrasena',
        id:       sesion.id,
        actual,
        nueva,
        token:    sesion.token
      })
    })
    const data = await res.json()

    if(data.ok){
      succDiv.style.display = 'flex'
      document.getElementById('passActual').value  = ''
      document.getElementById('passNueva').value   = ''
      document.getElementById('passRepetir').value = ''
    } else {
      errorMsg.innerText = data.error || 'Error al cambiar la contraseña'
      errorDiv.style.display = 'flex'
    }
  } catch(e) {
    errorMsg.innerText = 'Error de conexión. Intentá de nuevo.'
    errorDiv.style.display = 'flex'
  }

  btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar nueva contraseña'
  btn.disabled  = false
}
