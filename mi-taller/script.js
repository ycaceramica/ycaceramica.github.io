// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────
const API = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'

// ─────────────────────────────────────────────
// MODO OSCURO Y HAMBURGUESA
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
document.getElementById('toggleDark')?.addEventListener('click', () => {
  document.body.classList.toggle('dark')
  localStorage.setItem('dark', document.body.classList.contains('dark'))
  actualizarIcono()
})
document.getElementById('hamburguesa')?.addEventListener('click', () => document.getElementById('nav').classList.toggle('active'))
document.querySelectorAll('.nav a').forEach(l => l.addEventListener('click', () => document.getElementById('nav').classList.remove('active')))
window.addEventListener('scroll', () => document.getElementById('nav')?.classList.remove('active'))

// ─────────────────────────────────────────────
// SESIÓN
// ─────────────────────────────────────────────
function getSesion(){
  try { return JSON.parse(sessionStorage.getItem('yca_sesion')) }
  catch(e) { return null }
}

function cerrarSesion(){
  sessionStorage.removeItem('yca_sesion')
  // Limpiar sesión del localStorage también
  localStorage.removeItem('ceramista_sesion')
  window.location.href = '../login/index.html'
}

// ─────────────────────────────────────────────
// ESTADO
// ─────────────────────────────────────────────
let sesion         = null
let historialData  = []
let filtroActual   = 'todos'

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  sesion = getSesion()

  if(!sesion){
    window.location.href = '../login/index.html'
    return
  }

  if(sesion.rol !== 'ceramista'){
    // Si es alumno o admin, redirigir
    if(sesion.rol === 'admin') window.location.href = '../admin/index.html'
    else                       window.location.href = '../mi-cuenta/index.html'
    return
  }

  // Guardar sesión en localStorage para que las calculadoras la detecten
  localStorage.setItem('ceramista_sesion', JSON.stringify({
    token:  sesion.token,
    nombre: sesion.nombre,
    id:     sesion.id
  }))

  // Mostrar nombre y avatar
  const nombre = sesion.nombre || 'Ceramista'
  document.getElementById('cuentaNombre').innerText  = nombre
  document.getElementById('cuentaAvatar').innerText  = nombre[0].toUpperCase()

  // Cargar historial por defecto
  await cargarHistorial()
})

// ─────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────
function setTab(tab){
  document.querySelectorAll('.ctab').forEach(b => b.classList.remove('activo'))
  document.getElementById('ctab-' + tab).classList.add('activo')
  document.querySelectorAll('.cuenta-seccion').forEach(s => s.style.display = 'none')
  document.getElementById('sec-' + tab).style.display = 'block'

  if(tab === 'recursos'   && !recursosLoaded)   cargarRecursos()
  if(tab === 'multimedia' && !multimediaLoaded) cargarMultimedia()
}

let recursosLoaded   = false
let multimediaLoaded = false

// ─────────────────────────────────────────────
// HISTORIAL
// ─────────────────────────────────────────────
async function cargarHistorial(){
  const grid   = document.getElementById('historialTallerGrid')
  const btnPDF = document.getElementById('btnHistorialPDF')
  try {
    const res  = await fetch(`${API}?action=getHistorialTaller&id=${encodeURIComponent(sesion.id)}`)
    const data = await res.json()
    historialData = data.data || []

    if(historialData.length === 0){
      grid.innerHTML = `
        <div class="taller-vacio">
          <i class="fa-solid fa-clock-rotate-left"></i>
          <p>Tu historial está vacío.</p>
          <p class="taller-vacio-sub">Usá las calculadoras y apretá <strong>"Guardar en mi taller"</strong> para que aparezcan acá.</p>
          <a class="btn-ir-herramientas" href="../herramientas/index.html">Ir a las herramientas →</a>
        </div>`
      btnPDF.disabled = true
      return
    }

    btnPDF.disabled = false
    document.getElementById('historialFiltros').style.display = 'flex'
    renderHistorial()

  } catch(e){
    grid.innerHTML = '<p style="opacity:0.5;text-align:center;padding:20px">Error al cargar. Revisá tu conexión.</p>'
  }
}

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
  // Si es ISO (2026-03-19T03:00:00.000Z) convertir a fecha local
  try {
    if(String(fecha).includes('T')){
      const d = new Date(fecha)
      return d.toLocaleDateString('es-AR')
    }
  } catch(e){}
  return String(fecha)
}

function filtrarHistorial(calc, btn){
  filtroActual = calc
  document.querySelectorAll('.hfiltro').forEach(b => b.classList.remove('activo'))
  btn.classList.add('activo')
  renderHistorial()
}

function renderHistorial(){
  const grid = document.getElementById('historialTallerGrid')
  const items = filtroActual === 'todos'
    ? historialData
    : historialData.filter(i => i.calculadora === filtroActual)

  if(items.length === 0){
    grid.innerHTML = '<p class="taller-sin-items">No hay cálculos guardados de esta calculadora.</p>'
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
        <button class="htcard-borrar" onclick="borrarItemTaller('${item.id}')" title="Eliminar">✕</button>
      </div>
      <div class="htcard-nombre">${item.nombre || 'Sin nombre'}</div>
      <div class="htcard-datos">${renderDatosCard(item.calculadora, datos)}</div>
    `
    grid.appendChild(card)
  })
}

async function borrarItemTaller(id){
  if(!confirm('¿Eliminar este cálculo del historial?')) return
  try {
    const res  = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'eliminarHistorialTaller', id, ceramistaId: sesion.id })
    })
    const data = await res.json()
    if(data.ok){
      historialData = historialData.filter(i => i.id !== id)
      renderHistorial()
      if(!historialData.length){
        document.getElementById('btnHistorialPDF').disabled = true
        document.getElementById('historialFiltros').style.display = 'none'
      }
    }
  } catch(e){ console.error(e) }
}

function renderDatosCard(calc, datos){
  if(!datos || Object.keys(datos).length === 0) return ''

  if(calc === 'yeso'){
    return `
      <div class="htcard-chip">Agua: ${datos.agua || '—'}</div>
      <div class="htcard-chip">Yeso: ${datos.yeso || '—'}</div>
      ${datos.tipo ? `<div class="htcard-chip">${datos.tipo[0].toUpperCase() + datos.tipo.slice(1)}</div>` : ''}`
  }
  if(calc === 'engobes'){
    return `
      <div class="htcard-chip">Total: ${datos.total || '—'}g</div>
      ${datos.tipo ? `<div class="htcard-chip">${datos.tipo}</div>` : ''}`
  }
  if(calc === 'contraccion'){
    return `
      <div class="htcard-chip">Modo: ${datos.modo || '—'}</div>
      ${datos.contraccion ? `<div class="htcard-chip">Contracción: ${datos.contraccion}%</div>` : ''}`
  }
  if(calc === 'costos'){
    return `
      <div class="htcard-chip">Costo: $${datos.costoTotal || '—'}</div>
      <div class="htcard-chip">Venta: $${datos.precioVenta || '—'}</div>`
  }
  if(calc === 'pastas'){
    const comps = datos.componentes || []
    return comps.slice(0, 3).map(c =>
      `<div class="htcard-chip">${c.nombre}: ${c.porcentaje}%</div>`
    ).join('') + (comps.length > 3 ? `<div class="htcard-chip">+${comps.length - 3} más</div>` : '')
  }
  return ''
}

// ─────────────────────────────────────────────
// RECURSOS (PDFs para ceramistas)
// ─────────────────────────────────────────────
async function cargarRecursos(){
  const grid = document.getElementById('recursosGrid')
  try {
    const res  = await fetch(`${API}?action=getApuntesCeramista&id=${encodeURIComponent(sesion.id)}`)
    const data = await res.json()
    recursosLoaded = true
    const items = data.data || []

    if(items.length === 0){
      grid.innerHTML = '<div class="cuenta-vacio"><i class="fa-solid fa-file-pdf"></i><p>No hay recursos disponibles todavía.</p></div>'
      return
    }

    grid.innerHTML = ''
    items.forEach(item => {
      const div = document.createElement('div')
      div.className = 'apunte-card'
      const miniatura = item.miniatura
        ? `<img src="${item.miniatura}" alt="${item.titulo}" class="apunte-miniatura">`
        : item.archivoUrl
          ? `<iframe src="${item.archivoUrl}" class="apunte-preview" loading="lazy"></iframe>`
          : `<div class="apunte-sin-preview"><i class="fa-solid fa-file-pdf"></i></div>`

      div.innerHTML = `
        <div class="apunte-preview-wrapper">${miniatura}</div>
        <div class="apunte-info">
          <div class="apunte-titulo">${item.titulo || 'Sin título'}</div>
          ${item.descripcion ? `<div class="apunte-desc">${item.descripcion}</div>` : ''}
          ${item.archivoUrl ? `<a class="apunte-btn" href="${item.archivoUrl}" target="_blank"><i class="fa-solid fa-download"></i> Descargar PDF</a>` : ''}
        </div>`
      grid.appendChild(div)
    })
  } catch(e){
    grid.innerHTML = '<p style="opacity:0.5;text-align:center;padding:20px">Error al cargar recursos.</p>'
  }
}

// ─────────────────────────────────────────────
// MULTIMEDIA
// ─────────────────────────────────────────────
async function cargarMultimedia(){
  const lista = document.getElementById('multimediaLista')
  try {
    const res  = await fetch(`${API}?action=getMultimediaCeramista&id=${encodeURIComponent(sesion.id)}`)
    const data = await res.json()
    multimediaLoaded = true
    const items = data.data || []

    if(items.length === 0){
      lista.innerHTML = '<div class="cuenta-vacio"><i class="fa-solid fa-photo-film"></i><p>No hay multimedia disponible todavía.</p></div>'
      return
    }

    lista.innerHTML = ''
    items.forEach(item => {
      const div = document.createElement('div')
      div.className = 'multimedia-item'
      const esVideo = item.tipo === 'video' || (item.url || '').includes('youtube') || (item.url || '').includes('vimeo')

      div.innerHTML = `
        <div class="multimedia-thumb">
          ${item.foto
            ? `<img src="${item.foto}" alt="${item.titulo}">`
            : `<div class="multimedia-thumb-placeholder"><i class="fa-solid ${esVideo ? 'fa-play-circle' : 'fa-link'}"></i></div>`
          }
          ${esVideo ? '<div class="multimedia-play"><i class="fa-solid fa-play"></i></div>' : ''}
        </div>
        <div class="multimedia-info">
          <div class="multimedia-titulo">${item.titulo || 'Sin título'}</div>
          ${item.descripcion ? `<div class="multimedia-desc">${item.descripcion}</div>` : ''}
          ${item.url ? `<a class="apunte-btn" href="${item.url}" target="_blank"><i class="fa-solid fa-external-link-alt"></i> Abrir</a>` : ''}
        </div>`
      lista.appendChild(div)
    })
  } catch(e){
    lista.innerHTML = '<p style="opacity:0.5;text-align:center;padding:20px">Error al cargar multimedia.</p>'
  }
}

// ─────────────────────────────────────────────
// CAMBIAR CONTRASEÑA
// ─────────────────────────────────────────────
function togglePassCuenta(inputId, btn){
  const input = document.getElementById(inputId)
  const icono = btn.querySelector('i')
  if(input.type === 'password'){ input.type = 'text'; icono.className = 'fa-regular fa-eye-slash' }
  else                         { input.type = 'password'; icono.className = 'fa-regular fa-eye' }
}

async function cambiarContrasena(){
  const actual   = document.getElementById('passActual').value.trim()
  const nueva    = document.getElementById('passNueva').value.trim()
  const repetir  = document.getElementById('passRepetir').value.trim()
  const errDiv   = document.getElementById('passError')
  const errMsg   = document.getElementById('passErrorMsg')
  const succDiv  = document.getElementById('passSuccess')

  errDiv.style.display  = 'none'
  succDiv.style.display = 'none'

  if(!actual || !nueva || !repetir){ errMsg.innerText = 'Completá todos los campos'; errDiv.style.display = 'flex'; return }
  if(nueva.length < 6){ errMsg.innerText = 'La nueva contraseña debe tener al menos 6 caracteres'; errDiv.style.display = 'flex'; return }
  if(nueva !== repetir){ errMsg.innerText = 'Las contraseñas no coinciden'; errDiv.style.display = 'flex'; return }

  const btn = document.getElementById('btnCambiarPass')
  btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...'

  try {
    const res  = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'cambiarContrasena', id: sesion.id, actual, nueva })
    })
    const data = await res.json()
    if(data.ok){
      succDiv.style.display = 'flex'
      document.getElementById('passActual').value  = ''
      document.getElementById('passNueva').value   = ''
      document.getElementById('passRepetir').value = ''
    } else {
      errMsg.innerText = data.error || 'Error al cambiar la contraseña'
      errDiv.style.display = 'flex'
    }
  } catch(e){
    errMsg.innerText = 'Error de conexión. Intentá de nuevo.'
    errDiv.style.display = 'flex'
  }

  btn.disabled = false
  btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar nueva contraseña'
}

// ─────────────────────────────────────────────
// PDF DEL HISTORIAL
// ─────────────────────────────────────────────
function cargarLogoBase64(){
  return new Promise(resolve => {
    const img = new Image(); img.crossOrigin = 'anonymous'
    img.onload = () => { const c = document.createElement('canvas'); c.width=img.width; c.height=img.height; c.getContext('2d').drawImage(img,0,0); resolve(c.toDataURL('image/png')) }
    img.onerror = () => resolve(null); img.src = '../imagenes/logo.png'
  })
}

async function descargarHistorialPDF(){
  const items = filtroActual === 'todos'
    ? historialData
    : historialData.filter(i => i.calculadora === filtroActual)
  if(!items.length) return

  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
  const W=210, m=18
  const MARRON=[139,111,86], GRIS=[245,240,235], BLANCO=[255,255,255], NEGRO=[40,35,30]
  let y=0

  // Header
  doc.setFillColor(...MARRON); doc.rect(0,0,W,40,'F')
  const logo = await cargarLogoBase64()
  if(logo) doc.addImage(logo,'PNG',m,8,22,22)
  doc.setTextColor(...BLANCO); doc.setFontSize(20); doc.setFont('helvetica','bold'); doc.text('YCA Ceramica',m+28,17)
  doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.text('Mi Taller — Historial de cálculos',m+28,24)
  doc.setFontSize(8); doc.text(`Ceramista: ${sesion.nombre || ''}`,m+28,31)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'})}`,W-m,36,{align:'right'})
  y=50

  items.forEach((item, idx) => {
    const label = CALC_LABELS[item.calculadora] || { emoji:'📋', nombre: item.calculadora || 'Calculo', pdfNombre: item.calculadora || 'Calculo' }
    let datos = {}
    try { datos = JSON.parse(item.datos || '{}') } catch(e){}

    const h = 28
    if(y+h > 272){ doc.addPage(); y=20 }

    doc.setFillColor(...GRIS); doc.roundedRect(m,y,W-m*2,h,4,4,'F')
    doc.setTextColor(...NEGRO); doc.setFontSize(11); doc.setFont('helvetica','bold')
    doc.text(`${label.pdfNombre} — ${item.nombre || 'Sin nombre'}`,m+5,y+9)
    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(120,110,100)
    doc.text(formatFecha(item.fecha) || '',W-m-5,y+9,{align:'right'})

    // Datos resumidos
    const resumen = generarResumenPDF(item.calculadora, datos)
    doc.setTextColor(...NEGRO); doc.setFontSize(9); doc.setFont('helvetica','normal')
    doc.text(resumen, m+5, y+18)

    y += h+6
  })

  // Footer
  doc.setFillColor(...GRIS); doc.rect(0,287,W,10,'F')
  doc.setTextColor(160,150,140); doc.setFontSize(7); doc.setFont('helvetica','normal')
  doc.text('ycaceramica.github.io  |  YCA Ceramica © 2026',W/2,293,{align:'center'})

  doc.save('YCA_MiTaller_Historial.pdf')
}

function generarResumenPDF(calc, datos){
  if(!datos) return ''
  if(calc === 'yeso'){        const tipo = datos.tipo ? datos.tipo[0].toUpperCase() + datos.tipo.slice(1) : ''; return `Agua: ${datos.agua || '—'}  |  Yeso: ${datos.yeso || '—'}  |  ${tipo}` }
  if(calc === 'engobes')     return `Total: ${datos.total || '—'}g  |  ${datos.tipo || ''}`
  if(calc === 'contraccion') return `Modo: ${datos.modo || '—'}  |  Contracción: ${datos.contraccion || '—'}%`
  if(calc === 'costos')      return `Costo total: $${datos.costoTotal || '—'}  |  Precio sugerido: $${datos.precioVenta || '—'}`
  if(calc === 'pastas'){
    const comps = datos.componentes || []
    return comps.slice(0,4).map(c => `${c.nombre}: ${c.porcentaje}%`).join('  |  ')
  }
  return ''
}
