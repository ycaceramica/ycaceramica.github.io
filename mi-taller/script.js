// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────
const API = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'

// ─────────────────────────────────────────────
// MODO OSCURO Y HAMBURGUESA
// ─────────────────────────────────────────────
// Dark mode y nav manejados por nav-ceramista.js

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
let seleccionados  = new Set()

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
window.addEventListener('click', e => {
  const dd = document.getElementById('hfiltroDropdown')
  if(dd && !dd.contains(e.target)){
    const menu = document.getElementById('hfiltroMenu')
    const trig = document.getElementById('hfiltroTrigger')
    if(menu) menu.style.display = 'none'
    if(trig) trig.classList.remove('abierto')
  }
})

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

  // Badge Pro
  const esPro = sesion.plan === 'pro'
  const badge = document.getElementById('planBadge')
  if(badge) badge.style.display = esPro ? 'inline-block' : 'none'

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
    document.getElementById('btnLimpiarTodo').style.display = 'flex'
    renderHistorial()

  } catch(e){
    grid.innerHTML = '<p style="opacity:0.5;text-align:center;padding:20px">Error al cargar. Revisá tu conexión.</p>'
  }
}

const CALC_LABELS = {
  yeso:        { emoji:'🧱', nombre:'Yeso',                pdfNombre:'Yeso' },
  engobes:     { emoji:'🎨', nombre:'Engobes',             pdfNombre:'Engobes' },
  coccion:     { emoji:'🌡️', nombre:'Coccion',             pdfNombre:'Coccion' },
  contraccion: { emoji:'📐', nombre:'Contraccion',         pdfNombre:'Contraccion' },
  costos:      { emoji:'💰', nombre:'Costos',              pdfNombre:'Costos' },
  pastas:      { emoji:'🫙', nombre:'Pastas',              pdfNombre:'Pastas' },
  esmaltes:    { emoji:'⚗️', nombre:'Esmaltes',            pdfNombre:'Esmaltes' },
  densidad:    { emoji:'⚗️', nombre:'Densidad de esmalte', pdfNombre:'Densidad' },
  absorcion:   { emoji:'💧', nombre:'Absorcion de agua',   pdfNombre:'Absorcion' },
  breakeven:   { emoji:'📊', nombre:'Punto de equilibrio', pdfNombre:'BreakEven' }
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
  const sel = document.getElementById('hfiltroSelect')
  if(sel && sel.value !== calc) sel.value = calc
  renderHistorial()
}

function renderHistorial(){
  const grid = document.getElementById('historialTallerGrid')
  const items = filtroActual === 'todos' ? historialData : historialData.filter(i => i.calculadora === filtroActual)

  if(items.length === 0){
    grid.innerHTML = '<p class="taller-sin-items">No hay cálculos guardados de esta calculadora.</p>'
    return
  }

  grid.innerHTML = ''
  items.forEach(item => {
    const label = CALC_LABELS[item.calculadora] || { emoji:'📋', nombre: item.calculadora || 'Cálculo' }
    let datos = {}
    try { datos = JSON.parse(item.datos || '{}') } catch(e){}

    const esSel = seleccionados.has(item.id)
    const card = document.createElement('div')
    card.className = 'historial-taller-card' + (esSel ? ' seleccionada' : '')
    card.onclick = (e) => toggleSeleccion(item.id, e)
    card.innerHTML = `
      <div class="htcard-header">
        <span class="htcard-calc">${label.emoji} ${label.nombre}</span>
        <span class="htcard-fecha">${formatFecha(item.fecha)}</span>
        <div class="htcard-check">${esSel ? '<i class="fa-solid fa-check"></i>' : ''}</div>
        <button class="htcard-borrar" onclick="event.stopPropagation();borrarItemTaller('${item.id}')" title="Eliminar">✕</button>
      </div>
      <div class="htcard-nombre">${item.nombre || 'Sin nombre'}</div>
      <div class="htcard-datos">${renderDatosCard(item.calculadora, datos)}</div>
    `
    grid.appendChild(card)
  })
}


// ─────────────────────────────────────────────
// FILTRO DROPDOWN + SELECCIÓN
// ─────────────────────────────────────────────

function toggleFiltroMenu(){
  const menu    = document.getElementById('hfiltroMenu')
  const trigger = document.getElementById('hfiltroTrigger')
  if(!menu) return
  const abierto = menu.style.display !== 'none'
  menu.style.display = abierto ? 'none' : 'block'
  if(trigger) trigger.classList.toggle('abierto', !abierto)
}

function elegirFiltro(calc, label, btn){
  filtroActual = calc
  const lbl = document.getElementById('hfiltroLabel')
  if(lbl) lbl.innerText = label
  document.querySelectorAll('.hfiltro-opcion').forEach(b => b.classList.remove('activo'))
  if(btn) btn.classList.add('activo')
  const menu    = document.getElementById('hfiltroMenu')
  const trigger = document.getElementById('hfiltroTrigger')
  if(menu)    menu.style.display = 'none'
  if(trigger) trigger.classList.remove('abierto')
  renderHistorial()
}

function toggleSeleccion(id, event){
  if(event) event.stopPropagation()
  if(seleccionados.has(id)) seleccionados.delete(id)
  else seleccionados.add(id)
  actualizarUISeleccion()
  renderHistorial()
}

function deseleccionarTodo(){
  seleccionados.clear()
  actualizarUISeleccion()
  renderHistorial()
}

function actualizarUISeleccion(){
  const n    = seleccionados.size
  const info = document.getElementById('seleccionInfo')
  const hint = document.getElementById('seleccionHint')
  const lbl  = document.getElementById('btnPDFLabel')
  const cont = document.getElementById('seleccionConteo')
  if(cont) cont.innerText = n + (n === 1 ? ' seleccionado' : ' seleccionados')
  if(info) info.style.display = n > 0 ? 'flex' : 'none'
  if(hint && historialData.length > 0) hint.style.display = 'flex'
  if(lbl)  lbl.innerText = n > 0 ? 'PDF (' + n + ')' : 'PDF'
}

function borrarItemTaller(id){
  abrirModalConfirm(
    '¿Eliminar este cálculo?',
    'Esta acción no se puede deshacer.',
    async () => {
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
  )
}

function pedirLimpiarTodo(){
  abrirModalConfirm(
    '🗑 ¿Eliminar todo el historial?',
    'Se van a borrar todos los cálculos guardados. Esta acción no se puede deshacer.',
    async () => {
      const ids = [...historialData.map(i => i.id)]
      for(const id of ids){
        try {
          await fetch(API, {
            method: 'POST',
            body: JSON.stringify({ action: 'eliminarHistorialTaller', id, ceramistaId: sesion.id })
          })
        } catch(e){}
      }
      historialData = []
      renderHistorial()
      document.getElementById('btnHistorialPDF').disabled = true
      document.getElementById('historialFiltros').style.display = 'none'
    }
  )
}

// ── MODAL DE CONFIRMACIÓN PROPIO ──
function abrirModalConfirm(titulo, texto, accion){
  // Crear modal si no existe
  let overlay = document.getElementById('tallerModalOverlay')
  if(!overlay){
    overlay = document.createElement('div')
    overlay.id = 'tallerModalOverlay'
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999;padding:20px'
    overlay.innerHTML = `
      <div style="background:var(--color-superficie);border-radius:16px;padding:0;max-width:380px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow:hidden">
        <div style="padding:20px 20px 0">
          <h3 id="tallerModalTitulo" style="font-size:16px;margin:0 0 10px"></h3>
          <p id="tallerModalTexto" style="font-size:14px;margin:0;opacity:0.75;line-height:1.5"></p>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;padding:20px">
          <button onclick="cerrarModalConfirm()" style="padding:9px 18px;border-radius:20px;border:1.5px solid #d8cfc4;background:transparent;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;color:var(--color-texto)">Cancelar</button>
          <button id="tallerModalConfirmar" style="padding:9px 18px;border-radius:20px;border:none;background:#c85028;color:white;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer">Eliminar</button>
        </div>
      </div>`
    document.body.appendChild(overlay)
    overlay.addEventListener('click', e => { if(e.target === overlay) cerrarModalConfirm() })
  }
  document.getElementById('tallerModalTitulo').innerText = titulo
  document.getElementById('tallerModalTexto').innerText  = texto
  document.getElementById('tallerModalConfirmar').onclick = () => { cerrarModalConfirm(); accion() }
  overlay.style.display = 'flex'
}

function cerrarModalConfirm(){
  const overlay = document.getElementById('tallerModalOverlay')
  if(overlay) overlay.style.display = 'none'
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
  if(calc === 'esmaltes'){
    const comps = datos.componentes || []
    return `<div class="htcard-chip">Total: ${datos.total || '—'}g</div>` +
      comps.slice(0,3).map(c => `<div class="htcard-chip">${c.nombre}: ${c.gramos}g</div>`).join('') +
      (comps.length > 3 ? `<div class="htcard-chip">+${comps.length-3} mas</div>` : '')
  }
  if(calc === 'densidad'){
    return `<div class="htcard-chip">${datos.densidad || '—'} g/ml</div>` +
           `<div class="htcard-chip">${datos.estado ? datos.estado.split(' ')[0] : '—'}</div>`
  }
  if(calc === 'absorcion'){
    return `<div class="htcard-chip">${datos.absorcion || '—'}%</div>` +
           `<div class="htcard-chip">${datos.estado ? datos.estado.split(' ')[0] : '—'}</div>` +
           `<div class="htcard-chip">${datos.metodo || '—'}</div>`
  }
  if(calc === 'breakeven'){
    return `<div class="htcard-chip">Equilibrio: ${datos.puntoEquilibrio || '—'} piezas</div>` +
           `<div class="htcard-chip">Margen: $${datos.margen || '—'}</div>`
  }
  if(calc === 'pastas'){
    const comps = datos.componentes || []
    return comps.slice(0, 3).map(c =>
      `<div class="htcard-chip">${c.nombre}: ${c.porcentaje}%</div>`
    ).join('') + (comps.length > 3 ? `<div class="htcard-chip">+${comps.length - 3} más</div>` : '')
  }
  if(calc === 'seger'){
    const mats = datos.materiales || []
    const cone = datos.cone === 'cone06' ? 'Cone 06' : datos.cone === 'cone6' ? 'Cone 6' : 'Cone 10'
    return `<div class="htcard-chip">${cone}</div>`
      + `<div class="htcard-chip">Si: ${datos.si || '—'}</div>`
      + `<div class="htcard-chip">Al: ${datos.al || '—'}</div>`
      + `<div class="htcard-chip">Si:Al ${datos.siAl || '—'}</div>`
      + mats.slice(0,2).map(m => `<div class="htcard-chip">${m.nombre.split('(')[0].trim()}: ${m.pct}%</div>`).join('')
      + (mats.length > 2 ? `<div class="htcard-chip">+${mats.length-2} mas</div>` : '')
  }
  if(calc === 'arcillas'){
    const mats = datos.materiales || []
    return `<div class="htcard-chip">Plasticidad: ${datos.plasticidad || '—'}/10</div>`
      + `<div class="htcard-chip">Contraccion: ${datos.contraccion || '—'}%</div>`
      + `<div class="htcard-chip">${datos.tempMin || '—'}–${datos.tempMax || '—'}°C</div>`
      + mats.slice(0,2).map(m => `<div class="htcard-chip">${m.nombre.split('(')[0].trim()}: ${m.pct}%</div>`).join('')
  }
  if(calc === 'pruebas'){
    const pruebas = datos.pruebas || []
    const cant = Array.isArray(pruebas) ? pruebas.length : pruebas
    return `<div class="htcard-chip">${cant} pruebas</div>`
      + `<div class="htcard-chip">${datos.gramos || '—'}g c/u</div>`
      + (datos.base || []).slice(0,2).map(m => `<div class="htcard-chip">${m.nombre}: ${m.pct}%</div>`).join('')
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

      let previewHTML = ''
      if(item.miniatura){
        previewHTML = `<div class="apunte-preview"><img src="${item.miniatura}" alt="${item.titulo || ''}"></div>`
      } else if(item.archivoUrl){
        previewHTML = `
          <div class="apunte-preview apunte-preview-pdf">
            <iframe src="${item.archivoUrl}" scrolling="no" frameborder="0" loading="lazy"></iframe>
            <div class="apunte-preview-overlay"><i class="fa-solid fa-file-pdf"></i></div>
          </div>`
      } else {
        previewHTML = `<div class="apunte-preview apunte-preview-icon"><i class="fa-solid fa-file-pdf"></i></div>`
      }

      div.innerHTML = `
        ${previewHTML}
        <div class="apunte-card-body">
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
    const esPublicado = m => m.publicado === true || m.publicado === 'true' || m.publicado === 'TRUE' || m.publicado === 1
    const visibles = items.filter(esPublicado)
    if(visibles.length === 0){
      lista.innerHTML = '<div class="cuenta-vacio"><i class="fa-solid fa-photo-film"></i><p>No hay multimedia disponible todavía.</p></div>'
      return
    }
    visibles.forEach(item => {
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
  const baseItems = filtroActual === 'todos'
    ? historialData
    : historialData.filter(i => i.calculadora === filtroActual)
  const items = seleccionados.size > 0
    ? baseItems.filter(i => seleccionados.has(i.id))
    : baseItems
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

  for(const item of items){
    let datos = {}
    try { datos = JSON.parse(item.datos || '{}') } catch(e){}
    y = await renderItemPDF(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO)
  }

  // Footer
  doc.setFillColor(...GRIS); doc.rect(0,287,W,10,'F')
  doc.setTextColor(160,150,140); doc.setFontSize(7); doc.setFont('helvetica','normal')
  doc.text('ycaceramica.com.ar  |  YCA Ceramica © 2026',W/2,293,{align:'center'})
  doc.save('YCA_MiTaller_Historial.pdf')
}



// ─────────────────────────────────────────────
// RENDER PDF POR CALCULADORA
// ─────────────────────────────────────────────

async function renderItemPDF(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO){
  if(item.calculadora === 'yeso')        return renderPDF_Yeso(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO)
  if(item.calculadora === 'contraccion') return renderPDF_Contraccion(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO)
  if(item.calculadora === 'costos')      return renderPDF_Costos(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO)
  if(item.calculadora === 'engobes')     return renderPDF_Engobes(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO)
  if(item.calculadora === 'pastas')      return renderPDF_Pastas(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO)
  if(item.calculadora === 'esmaltes')    return renderPDF_Esmaltes(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO)
  if(item.calculadora === 'densidad')    return renderPDF_Densidad(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO)
  if(item.calculadora === 'absorcion')   return renderPDF_Absorcion(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO)
  if(item.calculadora === 'breakeven')   return renderPDF_Breakeven(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO)
  if(item.calculadora === 'seger')        return renderPDF_Seger(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO)
  if(item.calculadora === 'arcillas')     return renderPDF_Arcillas(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO)
  if(item.calculadora === 'pruebas')      return renderPDF_Pruebas(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO)
  // Fallback
  const h = 20
  if(y+h > 272){ doc.addPage(); y=20 }
  doc.setFillColor(...GRIS); doc.roundedRect(m,y,W-m*2,h,4,4,'F')
  doc.setTextColor(...NEGRO); doc.setFontSize(11); doc.setFont('helvetica','bold')
  doc.text(item.nombre || 'Sin nombre', m+5, y+9)
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(120,110,100)
  doc.text(formatFecha(item.fecha)||'', W-m-5, y+9, {align:'right'})
  return y + h + 6
}

// ── 1. YESO ───────────────────────────────────
function renderPDF_Seger(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO){
  const mats = datos.materiales || []
  const cone = datos.cone === 'cone06' ? 'Cone 06' : datos.cone === 'cone6' ? 'Cone 6' : 'Cone 10'
  const h    = 28 + Math.ceil(mats.length / 2) * 6
  if(y+h > 272){ doc.addPage(); y=20 }
  doc.setFillColor(...GRIS); doc.roundedRect(m,y,W-m*2,h,4,4,'F')
  doc.setTextColor(...NEGRO); doc.setFontSize(12); doc.setFont('helvetica','bold')
  doc.text(item.nombre || 'Sin nombre', m+5, y+9)
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(120,110,100)
  doc.text(formatFecha(item.fecha)||'', W-m-5, y+9, {align:'right'})
  // Chips de ratios
  const chips = [
    {l:'CONO',   v: cone},
    {l:'Si',     v: String(datos.si||'—')},
    {l:'Al',     v: String(datos.al||'—')},
    {l:'Si:Al',  v: String(datos.siAl||'—')}
  ]
  const cw = (W-m*2-9)/4
  chips.forEach((c,ci) => {
    const x = m+ci*(cw+3), cx = x+cw/2
    doc.setFillColor(...BLANCO); doc.roundedRect(x,y+13,cw,11,2,2,'F')
    doc.setTextColor(120,110,100); doc.setFontSize(5.5); doc.setFont('helvetica','bold')
    doc.text(c.l, cx, y+17, {align:'center'})
    doc.setTextColor(...MARRON); doc.setFontSize(7.5); doc.setFont('helvetica','bold')
    doc.text(c.v, cx, y+21.5, {align:'center'})
  })
  // Materiales
  let my = y+27
  mats.forEach((mat, mi) => {
    const col = mi%2, row = Math.floor(mi/2)
    const mx  = m + col*((W-m*2)/2+3)
    doc.setTextColor(...NEGRO); doc.setFontSize(7); doc.setFont('helvetica','normal')
    const nombre = (mat.nombre||'').split('(')[0].trim()
    doc.text(nombre, mx+2, my+row*6, {maxWidth:(W-m*2)/2-15})
    doc.setFont('helvetica','bold'); doc.setTextColor(...MARRON)
    doc.text(mat.pct+'%', mx+(W-m*2)/2-5, my+row*6, {align:'right'})
  })
  return y+h+6
}

function renderPDF_Arcillas(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO){
  const mats = datos.materiales || []
  const h    = 28 + Math.ceil(mats.length / 2) * 6
  if(y+h > 272){ doc.addPage(); y=20 }
  doc.setFillColor(...GRIS); doc.roundedRect(m,y,W-m*2,h,4,4,'F')
  doc.setTextColor(...NEGRO); doc.setFontSize(12); doc.setFont('helvetica','bold')
  doc.text(item.nombre || 'Sin nombre', m+5, y+9)
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(120,110,100)
  doc.text(formatFecha(item.fecha)||'', W-m-5, y+9, {align:'right'})
  const chips = [
    {l:'PLASTICIDAD', v:(datos.plasticidad||'—')+'/10'},
    {l:'CONTRACCION', v:(datos.contraccion||'—')+'%'},
    {l:'TEMPERATURA', v:(datos.tempMin||'—')+'-'+(datos.tempMax||'—')+'C'},
    {l:'POROSIDAD',   v:(datos.porosidad||'—')+'%'}
  ]
  const cw = (W-m*2-9)/4
  chips.forEach((c,ci) => {
    const x = m+ci*(cw+3), cx = x+cw/2
    doc.setFillColor(...BLANCO); doc.roundedRect(x,y+13,cw,11,2,2,'F')
    doc.setTextColor(120,110,100); doc.setFontSize(5.5); doc.setFont('helvetica','bold')
    doc.text(c.l, cx, y+17, {align:'center'})
    doc.setTextColor(...MARRON); doc.setFontSize(7.5); doc.setFont('helvetica','bold')
    doc.text(c.v, cx, y+21.5, {align:'center'})
  })
  let my = y+27
  mats.forEach((mat, mi) => {
    const col = mi%2, row = Math.floor(mi/2)
    const mx  = m + col*((W-m*2)/2+3)
    doc.setTextColor(...NEGRO); doc.setFontSize(7); doc.setFont('helvetica','normal')
    const nombre = (mat.nombre||'').split('(')[0].trim()
    doc.text(nombre, mx+2, my+row*6, {maxWidth:(W-m*2)/2-15})
    doc.setFont('helvetica','bold'); doc.setTextColor(...MARRON)
    doc.text(mat.pct+'%', mx+(W-m*2)/2-5, my+row*6, {align:'right'})
  })
  return y+h+6
}

function renderPDF_Pruebas(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO){
  const pruebas = Array.isArray(datos.pruebas) ? datos.pruebas : []
  const cols = 3
  const cardW = (W-m*2-(cols-1)*3)/cols
  const cardH = 38
  // Encabezado de la serie
  if(y+20 > 272){ doc.addPage(); y=20 }
  doc.setFillColor(...GRIS); doc.roundedRect(m,y,W-m*2,18,4,4,'F')
  doc.setTextColor(...NEGRO); doc.setFontSize(12); doc.setFont('helvetica','bold')
  doc.text(item.nombre||'Sin nombre', m+5, y+8)
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(120,110,100)
  doc.text(pruebas.length+' pruebas  |  '+(datos.gramos||'?')+'g c/u', m+5, y+14)
  doc.text(formatFecha(item.fecha)||'', W-m-5, y+8, {align:'right'})
  y += 22
  // Grid de pruebas
  pruebas.forEach((p, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)
    if(col === 0 && row > 0) y += cardH+3
    if(col === 0 && y+cardH > 272){ doc.addPage(); y=20 }
    const x = m + col*(cardW+3)
    doc.setFillColor(...GRIS); doc.roundedRect(x,y,cardW,cardH,3,3,'F')
    doc.setFillColor(...MARRON); doc.roundedRect(x,y,cardW,7,3,3,'F')
    doc.rect(x,y+4,cardW,3,'F')
    doc.setTextColor(255,255,255); doc.setFontSize(6.5); doc.setFont('helvetica','bold')
    doc.text(p.codigo||('P-'+String(idx+1).padStart(3,'0')), x+cardW/2, y+5.5, {align:'center'})
    const c1text = (p.c1?.nombre||'')+(p.c1?.pct ? ' '+p.c1.pct+'%' : '')
    const c2text = p.c2 ? (p.c2.nombre||'')+(p.c2.pct ? ' '+p.c2.pct+'%' : '') : ''
    doc.setTextColor(...MARRON); doc.setFontSize(5.5); doc.setFont('helvetica','bold')
    doc.text(c1text+(c2text ? ' + '+c2text : ''), x+2, y+12, {maxWidth:cardW-4})
    let my = y+17
    ;(p.mats||[]).forEach(mat => {
      if(my > y+cardH-4) return
      doc.setTextColor(...NEGRO); doc.setFontSize(5); doc.setFont('helvetica','normal')
      doc.text(mat.nombre||'', x+2, my, {maxWidth:cardW-14})
      doc.setFont('helvetica','bold'); doc.setTextColor(...MARRON)
      doc.text(mat.gramos+'g', x+cardW-2, my, {align:'right'})
      my += 4.5
    })
  })
  if(pruebas.length > 0) y += cardH+6
  return y
}

function renderPDF_Yeso(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO){
  const h = 32
  if(y+h > 272){ doc.addPage(); y=20 }
  doc.setFillColor(...GRIS); doc.roundedRect(m,y,W-m*2,h,4,4,'F')

  const tipoNombre = datos.tipo === 'rectangular' ? 'Rectangular' : datos.tipo === 'circular' ? 'Circular' : (datos.tipo||'')
  const cantStr    = datos.cantidad ? `${datos.cantidad} molde${datos.cantidad>1?'s':''}` : ''
  const propStr    = datos.proporcion ? `Proporcion ${datos.proporcion}%` : ''
  const tituloStr  = [tipoNombre, cantStr, propStr].filter(Boolean).join(' · ')

  doc.setTextColor(...NEGRO); doc.setFontSize(12); doc.setFont('helvetica','bold')
  doc.text(tituloStr || item.nombre || 'Yeso', m+5, y+9)
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(120,110,100)
  if(datos.detalle) doc.text(datos.detalle, m+5, y+15)
  doc.text(formatFecha(item.fecha)||'', W-m-5, y+9, {align:'right'})

  const colW = (W-m*2-6)/2
  doc.setFillColor(...BLANCO); doc.roundedRect(m,y+18,colW,11,2,2,'F')
  doc.setTextColor(120,110,100); doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.text('AGUA',m+8,y+23)
  doc.setTextColor(...MARRON); doc.setFontSize(11); doc.text(`${datos.agua||'—'} ml`,m+24,y+23)

  doc.setFillColor(...BLANCO); doc.roundedRect(m+colW+6,y+18,colW,11,2,2,'F')
  doc.setTextColor(120,110,100); doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.text('YESO',m+colW+14,y+23)
  doc.setTextColor(...MARRON); doc.setFontSize(11); doc.text(`${datos.yeso||'—'} g`,m+colW+30,y+23)

  return y+h+6
}

// ── 2. CONTRACCION ────────────────────────────
function renderPDF_Contraccion(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO){
  const h = datos.modo === 'personalizado' ? 52 : 38
  if(y+h > 272){ doc.addPage(); y=20 }
  doc.setFillColor(...GRIS); doc.roundedRect(m,y,W-m*2,h,4,4,'F')

  const titulo = datos.modo==='estandar' ? 'Estandar 10%'
    : datos.modo==='personalizado' ? `Medicion · ${datos.arcilla||''}`
    : `Perfil · ${datos.arcilla||''}`

  doc.setTextColor(...NEGRO); doc.setFontSize(12); doc.setFont('helvetica','bold')
  doc.text(titulo, m+5, y+9)
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(120,110,100)
  doc.text(formatFecha(item.fecha)||'', W-m-5, y+9, {align:'right'})

  const cw = (W-m*2-40)/3
  const filas = datos.modo==='estandar'
    ? [{l:'CRUDO',v:[datos.alto,datos.ancho,datos.prof]},{l:'BIZCOCHO',v:[datos.bizcAlto,datos.bizcAncho,datos.bizcProf]}]
    : datos.modo==='personalizado'
    ? [{l:'CUERO',v:[datos.cueroAlto,datos.cueroAncho,datos.cueroProf]},{l:'BIZCOCHO',v:[datos.bizcAlto,datos.bizcAncho,datos.bizcProf]},{l:'CONTRACCION',v:[(datos.contAlto||'')+'%',(datos.contAncho||'')+'%',(datos.contProf||'')+'%']}]
    : [{l:'CRUDO',v:[datos.crudoAlto,datos.crudoAncho,datos.crudoProf]},{l:'BIZCOCHO',v:[datos.bizcAlto,datos.bizcAncho,datos.bizcProf]}]

  filas.forEach((f,fi) => {
    const fy = y+14+fi*12
    if(fy+10 > y+h) return
    doc.setTextColor(120,110,100); doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.text(f.l,m+4,fy+6)
    f.v.forEach((v,vi) => {
      const x = m+38+vi*(cw+4)
      doc.setFillColor(...BLANCO); doc.roundedRect(x,fy,cw,9,2,2,'F')
      doc.setTextColor(...MARRON); doc.setFontSize(9); doc.setFont('helvetica','normal')
      const vStr = String(v||'—')
      doc.text(vStr+(vStr.includes('%')?'':vStr!=='—'?' cm':''), x+4, fy+6)
    })
  })
  return y+h+6
}

// ── 3. COSTOS ─────────────────────────────────
function renderPDF_Costos(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO){
  const fmt = v => v !== undefined && v !== null ? `$${Number(v).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2})}` : '$—'
  const lineasMat = datos.materiales?.length || 0
  const h = 44 + lineasMat*8 + 14
  if(y+h > 272){ doc.addPage(); y=20 }
  doc.setFillColor(...GRIS); doc.roundedRect(m,y,W-m*2,h,4,4,'F')

  doc.setTextColor(...NEGRO); doc.setFontSize(12); doc.setFont('helvetica','bold')
  doc.text(datos.nombre || item.nombre || 'Sin nombre', m+5, y+9)
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(120,110,100)
  doc.text(formatFecha(item.fecha)||'', W-m-5, y+9, {align:'right'})

  let fy = y+16
  if(datos.materiales?.length){
    datos.materiales.forEach(mat => {
      doc.setTextColor(...NEGRO); doc.setFontSize(8); doc.setFont('helvetica','normal')
      doc.text(`· ${mat.nombre||'Material'} (${mat.cantidad} × $${mat.precio})`, m+6, fy+5)
      doc.text(fmt(mat.subtotal), W-m-5, fy+5, {align:'right'})
      fy+=8
    })
  }
  doc.setDrawColor(...MARRON); doc.setLineWidth(0.2); doc.line(m+4,fy,W-m-4,fy); fy+=6

  const filas = [
    ['Materiales', fmt(datos.materiales?.reduce((s,mt)=>s+(mt.subtotal||0),0)||0)],
    ['Horas de trabajo', fmt(datos.totalHoras||0)],
    ['Costos fijos', fmt(datos.fijos||0)],
    ['Costo total', fmt(datos.costoTotal)]
  ]
  filas.forEach(([label,val]) => {
    doc.setTextColor(...NEGRO); doc.setFontSize(8); doc.setFont('helvetica','normal')
    doc.text(label, m+6, fy+4)
    if(label==='Costo total') doc.setFont('helvetica','bold')
    doc.text(val, W-m-5, fy+4, {align:'right'})
    fy+=7
  })
  doc.setFillColor(...MARRON); doc.roundedRect(m+4,fy,W-m*2-8,12,3,3,'F')
  doc.setTextColor(...BLANCO); doc.setFontSize(9); doc.setFont('helvetica','bold')
  doc.text(`Precio sugerido (${datos.ganancia||0}% ganancia)`, m+8, fy+8)
  doc.text(fmt(datos.precioVenta), W-m-8, fy+8, {align:'right'})
  return y+h+6
}

// ── 4. ENGOBES ────────────────────────────────
function renderPDF_Engobes(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO){
  const comps = datos.componentes || []
  const h     = 16 + 24 + 12
  if(y+h > 272){ doc.addPage(); y=20 }
  doc.setFillColor(...GRIS); doc.roundedRect(m,y,W-m*2,h,4,4,'F')

  doc.setTextColor(...NEGRO); doc.setFontSize(13); doc.setFont('helvetica','bold')
  doc.text(datos.nombre || item.nombre || 'Sin nombre', m+5, y+9)
  const tipo = datos.tipo==='oxido' ? 'Oxidos' : 'Pigmentos'
  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(120,110,100)
  doc.text(`${tipo}  |  ${datos.total||0}g totales`, m+5, y+15)
  doc.text(formatFecha(item.fecha)||'', W-m-5, y+9, {align:'right'})

  if(comps.length){
    const n   = Math.min(comps.length, 6)
    const colW = (W-m*2-(n-1)*3)/n
    comps.slice(0,n).forEach((c,ci) => {
      const x  = m+ci*(colW+3)
      const cy = y+20
      doc.setFillColor(...BLANCO); doc.roundedRect(x,cy,colW,14,2,2,'F')
      const cx = x+colW/2
      doc.setTextColor(120,110,100); doc.setFontSize(6.5); doc.setFont('helvetica','bold')
      doc.text((c.nombre||'').toUpperCase(), cx, cy+4.5, {align:'center'})
      doc.setTextColor(...MARRON); doc.setFontSize(11); doc.setFont('helvetica','bold')
      doc.text(`${c.gramos||0}g`, cx, cy+10, {align:'center'})
      doc.setTextColor(160,150,140); doc.setFontSize(6.5); doc.setFont('helvetica','normal')
      doc.text(`${c.pct||0}%`, cx, cy+13.5, {align:'center'})
    })
  }
  return y+h+6
}

// ── 5. PASTAS ─────────────────────────────────
function renderPDF_Pastas(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO){
  const comps = datos.componentes || []
  const h     = 24 + comps.length*9 + 12
  if(y+h > 272){ doc.addPage(); y=20 }
  doc.setFillColor(...GRIS); doc.roundedRect(m,y,W-m*2,h,4,4,'F')

  doc.setTextColor(...NEGRO); doc.setFontSize(12); doc.setFont('helvetica','bold')
  doc.text(datos.nombre || item.nombre || 'Sin nombre', m+5, y+9)
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(120,110,100)
  doc.text(`${datos.gramos||0}g totales · ${formatFecha(item.fecha)||''}`, W-m-5, y+9, {align:'right'})

  const cw = (W-m*2-10)/3
  doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(120,110,100)
  doc.text('INGREDIENTE',m+4,y+16); doc.text('%',m+4+cw,y+16); doc.text('GRAMOS',m+4+cw*2,y+16)

  comps.forEach((c,ci) => {
    const fy = y+22+ci*9
    doc.setTextColor(...NEGRO); doc.setFontSize(9); doc.setFont('helvetica','normal')
    doc.text(c.nombre||'', m+4, fy)
    doc.setTextColor(...MARRON); doc.setFont('helvetica','bold')
    doc.text(`${c.porcentaje||0}%`, m+4+cw, fy)
    doc.text(`${c.gramos||0}g`, m+4+cw*2, fy)
  })
  return y+h+6
}

// ── ESMALTES ─────────────────────────────────
function renderPDF_Esmaltes(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO){
  const comps = datos.componentes || []
  const h = 20 + Math.max(comps.length, 1) * 9
  if(y+h > 272){ doc.addPage(); y=20 }
  doc.setFillColor(...GRIS); doc.roundedRect(m,y,W-m*2,h,4,4,'F')
  doc.setTextColor(...NEGRO); doc.setFontSize(12); doc.setFont('helvetica','bold')
  doc.text(item.nombre || 'Sin nombre', m+5, y+9)
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(120,110,100)
  doc.text(`${datos.total||0}g totales · ${formatFecha(item.fecha)||''}`, W-m-5, y+9, {align:'right'})
  const cw = (W-m*2-10)/3
  doc.setFontSize(7); doc.setFont('helvetica','bold')
  doc.text('MATERIAL',m+4,y+16); doc.text('%',m+4+cw,y+16); doc.text('GRAMOS',m+4+cw*2,y+16)
  comps.forEach((c,ci) => {
    const fy = y+22+ci*9
    doc.setTextColor(...NEGRO); doc.setFontSize(9); doc.setFont('helvetica','normal')
    doc.text(c.nombre||'', m+4, fy)
    doc.setTextColor(...MARRON); doc.setFont('helvetica','bold')
    doc.text(`${c.pct||0}%`, m+4+cw, fy)
    doc.text(`${c.gramos||0}g`, m+4+cw*2, fy)
  })
  return y+h+6
}

// ── DENSIDAD ─────────────────────────────────
function renderPDF_Densidad(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO){
  const h = 36
  if(y+h > 272){ doc.addPage(); y=20 }
  doc.setFillColor(...GRIS); doc.roundedRect(m,y,W-m*2,h,4,4,'F')
  doc.setTextColor(...NEGRO); doc.setFontSize(12); doc.setFont('helvetica','bold')
  doc.text(item.nombre || 'Sin nombre', m+5, y+9)
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(120,110,100)
  doc.text(formatFecha(item.fecha)||'', W-m-5, y+9, {align:'right'})
  const chips = [
    {l:'DENSIDAD', v:`${datos.densidad||'—'} g/ml`},
    {l:'PESO',     v:`${datos.peso||'—'}g`},
    {l:'VOLUMEN',  v:`${datos.volumen||'—'}ml`},
    {l:'ESTADO',   v:datos.estado ? datos.estado.split(' ')[0] : '—'}
  ]
  const cw = (W-m*2-9)/4
  chips.forEach((c,ci) => {
    const x = m+ci*(cw+3), cx = x+cw/2
    doc.setFillColor(...BLANCO); doc.roundedRect(x,y+16,cw,14,2,2,'F')
    doc.setTextColor(120,110,100); doc.setFontSize(6); doc.setFont('helvetica','bold')
    doc.text(c.l, cx, y+21, {align:'center'})
    doc.setTextColor(...MARRON); doc.setFontSize(9); doc.setFont('helvetica','bold')
    doc.text(c.v, cx, y+27, {align:'center'})
  })
  return y+h+6
}

// ── ABSORCION ────────────────────────────────
function renderPDF_Absorcion(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO){
  const h = 36
  if(y+h > 272){ doc.addPage(); y=20 }
  doc.setFillColor(...GRIS); doc.roundedRect(m,y,W-m*2,h,4,4,'F')
  doc.setTextColor(...NEGRO); doc.setFontSize(12); doc.setFont('helvetica','bold')
  doc.text(item.nombre || 'Sin nombre', m+5, y+9)
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(120,110,100)
  doc.text(`${datos.metodo||'—'} · ${formatFecha(item.fecha)||''}`, W-m-5, y+9, {align:'right'})
  const chips = [
    {l:'PESO SECO',   v:`${datos.pesoSeco||'—'}g`},
    {l:'PESO HUMEDO', v:`${datos.pesoHumedo||'—'}g`},
    {l:'ABSORCION',   v:`${datos.absorcion||'—'}%`},
    {l:'ESTADO',      v:datos.estado ? datos.estado.split(' ')[0] : '—'}
  ]
  const cw = (W-m*2-9)/4
  chips.forEach((c,ci) => {
    const x = m+ci*(cw+3), cx = x+cw/2
    doc.setFillColor(...BLANCO); doc.roundedRect(x,y+16,cw,14,2,2,'F')
    doc.setTextColor(120,110,100); doc.setFontSize(6); doc.setFont('helvetica','bold')
    doc.text(c.l, cx, y+21, {align:'center'})
    doc.setTextColor(...MARRON); doc.setFontSize(9); doc.setFont('helvetica','bold')
    doc.text(c.v, cx, y+27, {align:'center'})
  })
  return y+h+6
}

// ── BREAKEVEN ────────────────────────────────
function renderPDF_Breakeven(doc, item, datos, y, W, m, MARRON, GRIS, BLANCO, NEGRO){
  const h = 40
  if(y+h > 272){ doc.addPage(); y=20 }
  doc.setFillColor(...GRIS); doc.roundedRect(m,y,W-m*2,h,4,4,'F')
  doc.setTextColor(...NEGRO); doc.setFontSize(12); doc.setFont('helvetica','bold')
  doc.text(item.nombre || 'Sin nombre', m+5, y+9)
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(120,110,100)
  doc.text(formatFecha(item.fecha)||'', W-m-5, y+9, {align:'right'})
  const chips = [
    {l:'COSTOS FIJOS',   v:`$${datos.costosFijos||0}`},
    {l:'COSTO VARIABLE', v:`$${datos.costoVariable||0}`},
    {l:'PRECIO',         v:`$${datos.precio||0}`},
    {l:'MARGEN',         v:`$${datos.margen||0}`}
  ]
  const cw = (W-m*2-9)/4
  chips.forEach((c,ci) => {
    const x = m+ci*(cw+3), cx = x+cw/2
    doc.setFillColor(...BLANCO); doc.roundedRect(x,y+14,cw,12,2,2,'F')
    doc.setTextColor(120,110,100); doc.setFontSize(5.5); doc.setFont('helvetica','bold')
    doc.text(c.l, cx, y+18.5, {align:'center'})
    doc.setTextColor(...MARRON); doc.setFontSize(8); doc.setFont('helvetica','bold')
    doc.text(c.v, cx, y+23.5, {align:'center'})
  })
  doc.setFillColor(...MARRON); doc.roundedRect(m,y+29,W-m*2,8,2,2,'F')
  doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold')
  doc.text(`Punto de equilibrio: ${datos.puntoEquilibrio||0} piezas`, W/2, y+34.5, {align:'center'})
  return y+h+6
}
