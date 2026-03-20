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
  if(tab === 'historial' && !historialCargado) cargarHistorial()
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

// ─────────────────────────────────────────────
// HISTORIAL DE CALCULADORAS (alumno)
// ─────────────────────────────────────────────

let historialData   = []
let historialCargado = false
let filtroActual    = 'todos'

const CALC_LABELS = {
  yeso:        { emoji:'🧱', nombre:'Yeso',        pdfNombre:'Yeso' },
  engobes:     { emoji:'🎨', nombre:'Engobes',     pdfNombre:'Engobes' },
  coccion:     { emoji:'🌡️', nombre:'Cocción',     pdfNombre:'Coccion' },
  contraccion: { emoji:'📐', nombre:'Contracción', pdfNombre:'Contraccion' },
  costos:      { emoji:'💰', nombre:'Costos',      pdfNombre:'Costos' },
  pastas:      { emoji:'🫙', nombre:'Pastas',      pdfNombre:'Pastas' }
}

function formatFecha(fecha){
  if(!fecha) return ''
  try {
    if(String(fecha).includes('T')){ return new Date(fecha).toLocaleDateString('es-AR') }
  } catch(e){}
  return String(fecha)
}

async function cargarHistorial(){
  const grid   = document.getElementById('historialGrid')
  const btnPDF = document.getElementById('btnHistorialPDF')
  const btnLim = document.getElementById('btnLimpiarTodo')
  const sesion = getSesion()
  if(!sesion || !sesion.id) return
  historialCargado = true
  try {
    const res  = await fetch(`${API}?action=getHistorialAlumno&id=${encodeURIComponent(sesion.id)}`)
    const data = await res.json()
    historialData = data.data || []
    if(historialData.length === 0){
      grid.innerHTML = `
        <div class="taller-vacio">
          <i class="fa-solid fa-clock-rotate-left"></i>
          <p>Tu historial está vacío.</p>
          <p class="taller-vacio-sub">Usá las calculadoras y apretá <strong>"Guardar en mi cuenta"</strong> para que aparezcan acá.</p>
          <a class="btn-ir-herramientas" href="../herramientas/index.html">Ir a las herramientas →</a>
        </div>`
      btnPDF.disabled = true
      if(btnLim) btnLim.style.display = 'none'
      return
    }
    btnPDF.disabled = false
    if(btnLim) btnLim.style.display = 'flex'
    document.getElementById('historialFiltros').style.display = 'flex'
    renderHistorial()
  } catch(e){
    grid.innerHTML = '<p style="opacity:0.5;text-align:center;padding:20px">Error al cargar. Revisá tu conexión.</p>'
  }
}

function filtrarHistorial(calc, btn){
  filtroActual = calc
  document.querySelectorAll('.hfiltro').forEach(b => b.classList.remove('activo'))
  if(btn) btn.classList.add('activo')
  renderHistorial()
}

function renderHistorial(){
  const grid  = document.getElementById('historialGrid')
  const items = filtroActual === 'todos'
    ? historialData
    : historialData.filter(i => i.calculadora === filtroActual)

  if(items.length === 0){
    grid.innerHTML = '<p class="taller-sin-items">No hay cálculos de esta calculadora.</p>'
    return
  }

  grid.innerHTML = ''
  items.forEach(item => {
    const label = CALC_LABELS[item.calculadora] || { emoji:'📋', nombre: item.calculadora || 'Cálculo' }
    let datos = {}
    try { datos = JSON.parse(item.datos || '{}') } catch(e){}

    const card = document.createElement('div')
    card.className = 'historial-taller-card'
    card.innerHTML = `
      <div class="htcard-header">
        <span class="htcard-calc">${label.emoji} ${label.nombre}</span>
        <span class="htcard-fecha">${formatFecha(item.fecha)}</span>
        <button class="htcard-borrar" onclick="borrarItem('${item.id}')" title="Eliminar">✕</button>
      </div>
      <div class="htcard-nombre">${item.nombre || 'Sin nombre'}</div>
      <div class="htcard-datos">${renderDatosCard(item.calculadora, datos)}</div>`
    grid.appendChild(card)
  })
}

function renderDatosCard(calc, datos){
  if(!datos || Object.keys(datos).length === 0) return ''
  if(calc === 'yeso'){
    const tipo = datos.tipo ? datos.tipo[0].toUpperCase() + datos.tipo.slice(1) : ''
    return `<div class="htcard-chip">Agua: ${datos.agua || '—'}</div>
            <div class="htcard-chip">Yeso: ${datos.yeso || '—'}</div>
            ${tipo ? `<div class="htcard-chip">${tipo}</div>` : ''}`
  }
  if(calc === 'engobes')     return `<div class="htcard-chip">Total: ${datos.total || '—'}g</div>${datos.tipo ? `<div class="htcard-chip">${datos.tipo}</div>` : ''}`
  if(calc === 'contraccion') return `<div class="htcard-chip">Modo: ${datos.modo || '—'}</div>${datos.contraccion ? `<div class="htcard-chip">Contracción: ${datos.contraccion}%</div>` : ''}`
  if(calc === 'costos')      return `<div class="htcard-chip">Costo: $${datos.costoTotal || '—'}</div><div class="htcard-chip">Venta: $${datos.precioVenta || '—'}</div>`
  if(calc === 'pastas'){
    const comps = datos.componentes || []
    return comps.slice(0,3).map(c => `<div class="htcard-chip">${c.nombre}: ${c.porcentaje}%</div>`).join('') +
      (comps.length > 3 ? `<div class="htcard-chip">+${comps.length-3} más</div>` : '')
  }
  return ''
}

function borrarItem(id){
  abrirModalAlumno('¿Eliminar este cálculo?', 'Esta acción no se puede deshacer.', async () => {
    const sesion = getSesion()
    try {
      const res  = await fetch(API, { method:'POST', body: JSON.stringify({ action:'eliminarHistorialAlumno', id, alumnoId: sesion.id }) })
      const data = await res.json()
      if(data.ok){
        historialData = historialData.filter(i => i.id !== id)
        renderHistorial()
        if(!historialData.length){
          document.getElementById('btnHistorialPDF').disabled = true
          document.getElementById('btnLimpiarTodo').style.display = 'none'
          document.getElementById('historialFiltros').style.display = 'none'
        }
      }
    } catch(e){}
  })
}

function pedirLimpiarTodo(){
  abrirModalAlumno('🗑 ¿Eliminar todo el historial?', 'Se van a borrar todos los cálculos. Esta acción no se puede deshacer.', async () => {
    const sesion = getSesion()
    const ids = [...historialData.map(i => i.id)]
    for(const id of ids){
      try { await fetch(API, { method:'POST', body: JSON.stringify({ action:'eliminarHistorialAlumno', id, alumnoId: sesion.id }) }) } catch(e){}
    }
    historialData = []
    renderHistorial()
    document.getElementById('btnHistorialPDF').disabled = true
    document.getElementById('btnLimpiarTodo').style.display = 'none'
    document.getElementById('historialFiltros').style.display = 'none'
  })
}

// Modal de confirmación
function abrirModalAlumno(titulo, texto, accion){
  const overlay = document.getElementById('alumnoModalOverlay')
  document.getElementById('alumnoModalTitulo').innerText = titulo
  document.getElementById('alumnoModalTexto').innerText  = texto
  document.getElementById('alumnoModalConfirmar').onclick = () => { cerrarModalAlumno(); accion() }
  overlay.style.display = 'flex'
}
function cerrarModalAlumno(){
  document.getElementById('alumnoModalOverlay').style.display = 'none'
}

// PDF del historial
function cargarLogoBase64(){
  return new Promise(resolve => {
    const img = new Image(); img.crossOrigin = 'anonymous'
    img.onload = () => { const c = document.createElement('canvas'); c.width=img.width; c.height=img.height; c.getContext('2d').drawImage(img,0,0); resolve(c.toDataURL('image/png')) }
    img.onerror = () => resolve(null); img.src = '../imagenes/logo.png'
  })
}

async function descargarHistorialPDF(){
  const items = filtroActual === 'todos' ? historialData : historialData.filter(i => i.calculadora === filtroActual)
  if(!items.length) return
  const sesion = getSesion()
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
  const W=210, m=18
  const MARRON=[139,111,86], GRIS=[245,240,235], BLANCO=[255,255,255], NEGRO=[40,35,30]
  let y=0

  doc.setFillColor(...MARRON); doc.rect(0,0,W,40,'F')
  const logo = await cargarLogoBase64()
  if(logo) doc.addImage(logo,'PNG',m,8,22,22)
  doc.setTextColor(...BLANCO); doc.setFontSize(20); doc.setFont('helvetica','bold'); doc.text('YCA Ceramica',m+28,17)
  doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.text('Mi Cuenta — Historial de calculos',m+28,24)
  doc.setFontSize(8); doc.text(`Alumno: ${sesion.nombre || ''}`,m+28,31)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'})}`,W-m,36,{align:'right'})
  y=50

  items.forEach(item => {
    const label = CALC_LABELS[item.calculadora] || { pdfNombre: item.calculadora || 'Calculo' }
    let datos = {}
    try { datos = JSON.parse(item.datos || '{}') } catch(e){}
    const h = 28
    if(y+h > 272){ doc.addPage(); y=20 }
    doc.setFillColor(...GRIS); doc.roundedRect(m,y,W-m*2,h,4,4,'F')
    doc.setTextColor(...NEGRO); doc.setFontSize(11); doc.setFont('helvetica','bold')
    doc.text(`${label.pdfNombre} — ${item.nombre || 'Sin nombre'}`,m+5,y+9)
    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(120,110,100)
    doc.text(formatFecha(item.fecha)||'',W-m-5,y+9,{align:'right'})
    const resumen = generarResumenPDF(item.calculadora, datos)
    doc.setTextColor(...NEGRO); doc.setFontSize(9); doc.setFont('helvetica','normal')
    doc.text(resumen,m+5,y+18)
    y+=h+6
  })

  doc.setFillColor(...GRIS); doc.rect(0,287,W,10,'F')
  doc.setTextColor(160,150,140); doc.setFontSize(7); doc.setFont('helvetica','normal')
  doc.text('ycaceramica.github.io  |  YCA Ceramica © 2026',W/2,293,{align:'center'})
  doc.save('YCA_MiCuenta_Historial.pdf')
}

function generarResumenPDF(calc, datos){
  if(!datos) return ''
  if(calc === 'yeso'){        const tipo = datos.tipo ? datos.tipo[0].toUpperCase()+datos.tipo.slice(1) : ''; return `Agua: ${datos.agua||'—'}  |  Yeso: ${datos.yeso||'—'}  |  ${tipo}` }
  if(calc === 'engobes')     return `Total: ${datos.total||'—'}g  |  ${datos.tipo||''}`
  if(calc === 'contraccion') return `Modo: ${datos.modo||'—'}  |  Contraccion: ${datos.contraccion||'—'}%`
  if(calc === 'costos')      return `Costo total: $${datos.costoTotal||'—'}  |  Precio sugerido: $${datos.precioVenta||'—'}`
  if(calc === 'pastas'){     const comps = datos.componentes || []; return comps.slice(0,4).map(c=>`${c.nombre}: ${c.porcentaje}%`).join('  |  ') }
  return ''
}
