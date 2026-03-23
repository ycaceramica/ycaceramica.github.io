// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

const API = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'

// Dark mode y nav manejados por nav-ceramista.js

// ─────────────────────────────────────────────
// INFO TOGGLE
// ─────────────────────────────────────────────

function toggleInfo(){
  const c = document.getElementById('infoContent')
  const v = c.style.display !== 'none'
  c.style.display = v ? 'none' : 'block'
  document.getElementById('infoChevron').style.transform = v ? 'rotate(0deg)' : 'rotate(180deg)'
}

// ─────────────────────────────────────────────
// MODAL GENÉRICO
// ─────────────────────────────────────────────

let modalCallback = null

function mostrarModal({ titulo, texto, confirmar, accion, cancelar = true }){
  document.getElementById('contModalTitulo').innerText = titulo
  document.getElementById('contModalTexto').innerText  = texto
  const btnConfirmar = document.getElementById('contModalConfirmar')
  const btnCancelar  = document.getElementById('contModalCancelar')
  btnConfirmar.innerText    = confirmar
  btnCancelar.style.display = cancelar ? 'inline-flex' : 'none'
  modalCallback = accion || null
  btnConfirmar.onclick = () => { const cb = modalCallback; cerrarModal(); if(cb) cb() }
  document.getElementById('contModal').style.display = 'flex'
}

function cerrarModal(){
  document.getElementById('contModal').style.display = 'none'
  modalCallback = null
}

// ─────────────────────────────────────────────
// ESTADO
// ─────────────────────────────────────────────

let historial       = JSON.parse(localStorage.getItem('breakeven_historial') || '[]')
let contadorFijo    = 0
let puntoActual     = null

// ─────────────────────────────────────────────
// INTEGRACIÓN CON CALCULADORA DE COSTOS
// ─────────────────────────────────────────────

function cargarDesdeCostos(){
  const datos = localStorage.getItem('costos_para_breakeven')
  if(!datos){
    mostrarModal({
      titulo:    'Sin datos de costos',
      texto:     'Primero calculá el costo de una pieza en la Calculadora de Costos y usá el botón "Usar para análisis de negocio".',
      confirmar: 'Ir a Costos',
      accion:    () => { window.location.href = '../costos/index.html' },
      cancelar:  true
    })
    return
  }

  try {
    const parsed = JSON.parse(datos)
    if(parsed.costoVariable !== undefined){
      document.getElementById('beCostoVariable').value = parsed.costoVariable
    }
    if(parsed.precio !== undefined){
      document.getElementById('bePrecio').value = parsed.precio
    }
    document.getElementById('beBannerCostos').style.display = 'flex'
    calcularBreakeven()
  } catch(e){
    mostrarModal({
      titulo:    'Error al cargar',
      texto:     'No se pudieron leer los datos de costos. Intentá de nuevo desde la Calculadora de Costos.',
      confirmar: 'Entendido',
      cancelar:  false
    })
  }
}

function limpiarDesdeCostos(){
  localStorage.removeItem('costos_para_breakeven')
  document.getElementById('beCostoVariable').value = ''
  document.getElementById('bePrecio').value        = ''
  document.getElementById('beBannerCostos').style.display = 'none'
  calcularBreakeven()
}

// ─────────────────────────────────────────────
// COSTOS FIJOS DINÁMICOS
// ─────────────────────────────────────────────

const COSTOS_FIJOS_DEFAULT = [
  { nombre: 'Alquiler', valor: 0 },
  { nombre: 'Horno (amortización)', valor: 0 },
  { nombre: 'Herramientas', valor: 0 }
]

function inicializarCostosFijos(){
  COSTOS_FIJOS_DEFAULT.forEach(c => agregarCostoFijo(c.nombre, c.valor))
}

function agregarCostoFijo(nombre = '', valor = ''){
  const id   = ++contadorFijo
  const cont = document.getElementById('beCostosFijos')
  const div  = document.createElement('div')
  div.className = 'be-item'
  div.id        = 'fijo-' + id
  div.innerHTML = `
    <input type="text"   class="be-item-nombre" placeholder="Descripción"
           value="${nombre}" oninput="calcularBreakeven()">
    <span class="be-item-signo">$</span>
    <input type="number" class="be-item-valor"  placeholder="0" min="0" step="0.01"
           value="${valor || ''}" oninput="calcularBreakeven()">
    <button class="be-item-borrar" onclick="borrarCostoFijo(${id})" title="Eliminar">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `
  cont.appendChild(div)
  calcularBreakeven()
}

function borrarCostoFijo(id){
  const el = document.getElementById('fijo-' + id)
  if(el) el.remove()
  calcularBreakeven()
}

function obtenerTotalFijos(){
  let total = 0
  document.querySelectorAll('#beCostosFijos .be-item-valor').forEach(input => {
    total += parseFloat(input.value) || 0
  })
  return total
}

// ─────────────────────────────────────────────
// FORMATO DE MONEDA
// ─────────────────────────────────────────────

function fmt(n){
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─────────────────────────────────────────────
// CALCULAR BREAK-EVEN
// ─────────────────────────────────────────────

function calcularBreakeven(){
  const costosFijos    = obtenerTotalFijos()
  const costoVariable  = parseFloat(document.getElementById('beCostoVariable').value) || 0
  const precio         = parseFloat(document.getElementById('bePrecio').value)        || 0

  document.getElementById('totalFijos').innerText = fmt(costosFijos)

  // Necesitamos al menos precio y costo variable
  if(precio <= 0 || costoVariable <= 0){
    document.getElementById('beResultado').style.display = 'none'
    puntoActual = null
    return
  }

  const margen = precio - costoVariable

  // Validación: sin margen
  if(margen <= 0){
    document.getElementById('beResultado').style.display = 'none'
    puntoActual = null
    mostrarModal({
      titulo:    'Sin margen de ganancia',
      texto:     'El precio de venta debe ser mayor al costo variable por pieza para que haya margen.',
      confirmar: 'Entendido',
      cancelar:  false
    })
    return
  }

  const puntoEquilibrio = costosFijos > 0 ? Math.ceil(costosFijos / margen) : 0
  const ingresos        = puntoEquilibrio * precio
  puntoActual           = { costosFijos, costoVariable, precio, margen, puntoEquilibrio, ingresos }

  // Renderizar métricas
  document.getElementById('beMargen').innerText   = fmt(margen)
  document.getElementById('bePunto').innerText    = puntoEquilibrio + ' piezas'
  document.getElementById('beIngresos').innerText = fmt(ingresos)

  // Mensaje
  const msg  = document.getElementById('beMensaje')
  if(costosFijos === 0){
    msg.innerText   = 'Sin costos fijos, cada pieza vendida es ganancia directa.'
    msg.className   = 'be-mensaje ganando'
  } else {
    msg.innerText   = `Vendiendo ${puntoEquilibrio} piezas cubrís todos tus costos. A partir de la pieza ${puntoEquilibrio + 1} empezás a ganar.`
    msg.className   = 'be-mensaje neutro'
  }

  // Ajustar slider — max = 2x el punto de equilibrio o 200, lo que sea mayor
  const sliderMax = Math.max(puntoEquilibrio * 2, 200)
  const slider    = document.getElementById('beSlider')
  slider.max      = sliderMax
  document.getElementById('beSliderMax').innerText = sliderMax

  document.getElementById('beResultado').style.display = 'flex'
  simular()
  verificarSesionTaller()
}

// ─────────────────────────────────────────────
// SIMULADOR
// ─────────────────────────────────────────────

function simular(){
  if(!puntoActual) return

  const { costosFijos, costoVariable, precio, puntoEquilibrio } = puntoActual
  const piezas   = parseInt(document.getElementById('beSlider').value) || 0
  const ingresos = piezas * precio
  const costos   = costosFijos + piezas * costoVariable
  const ganancia = ingresos - costos

  document.getElementById('simPiezas').innerText   = piezas
  document.getElementById('simIngresos').innerText = fmt(ingresos)
  document.getElementById('simCostos').innerText   = fmt(costos)

  const el     = document.getElementById('simGanancia')
  const etiq   = document.getElementById('simEtiqueta')

  if(ganancia > 0){
    el.innerText  = fmt(ganancia)
    el.className  = 'sim-ganando'
    etiq.innerText = 'Ganancia'
  } else if(ganancia < 0){
    el.innerText  = '-' + fmt(Math.abs(ganancia))
    el.className  = 'sim-perdiendo'
    etiq.innerText = 'Perdida'
  } else {
    el.innerText  = fmt(0)
    el.className  = 'sim-neutro'
    etiq.innerText = 'Equilibrio exacto'
  }
}

// ─────────────────────────────────────────────
// GUARDAR EN HISTORIAL
// ─────────────────────────────────────────────

function guardarBreakeven(){
  const nombre = document.getElementById('beNombre').value.trim()
  if(!nombre){
    mostrarModal({ titulo: 'Sin nombre', texto: 'Poné un nombre al análisis antes de guardar.', confirmar: 'Entendido', cancelar: false })
    return
  }
  if(!puntoActual){
    mostrarModal({ titulo: 'Sin resultado', texto: 'Completá los datos para calcular primero.', confirmar: 'Entendido', cancelar: false })
    return
  }

  // Guardar costos fijos con detalle
  const fijoDetalle = []
  document.querySelectorAll('#beCostosFijos .be-item').forEach(item => {
    const n = item.querySelector('.be-item-nombre').value.trim()
    const v = parseFloat(item.querySelector('.be-item-valor').value) || 0
    if(n || v) fijoDetalle.push({ nombre: n || 'Costo', valor: v })
  })

  const entrada = {
    id:               Date.now(),
    nombre,
    costosFijos:      puntoActual.costosFijos,
    fijoDetalle,
    costoVariable:    puntoActual.costoVariable,
    precio:           puntoActual.precio,
    margen:           puntoActual.margen,
    puntoEquilibrio:  puntoActual.puntoEquilibrio,
    ingresos:         puntoActual.ingresos,
    fecha:            new Date().toLocaleDateString('es-AR')
  }

  historial.unshift(entrada)
  localStorage.setItem('breakeven_historial', JSON.stringify(historial))
  renderizarHistorial()

  const btn = document.querySelector('.btn-guardar')
  if(btn){
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Guardado'
    setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar en historial' }, 2000)
  }
}

// ─────────────────────────────────────────────
// RENDERIZAR HISTORIAL
// ─────────────────────────────────────────────

function renderizarHistorial(){
  const lista  = document.getElementById('beHistorialLista')
  const btnPDF = document.getElementById('btnPDF')
  const btnLim = document.getElementById('btnLimpiar')

  lista.innerHTML = ''

  if(historial.length === 0){
    lista.innerHTML = '<p class="historial-vacio">Guardá un análisis para verlo aquí.</p>'
    btnPDF.disabled      = true
    btnLim.style.display = 'none'
    return
  }

  btnPDF.disabled      = false
  btnLim.style.display = 'inline-flex'

  historial.forEach(f => {
    const item = document.createElement('div')
    item.className = 'historial-item'
    item.innerHTML = `
      <button class="historial-item-borrar" onclick="borrarEntrada(${f.id})">✕</button>
      <div class="historial-item-nombre">${f.nombre}</div>
      <div class="historial-item-meta">${f.fecha}</div>
      <div class="historial-item-componentes">
        <span class="historial-chip">Equilibrio: ${f.puntoEquilibrio} piezas</span>
        <span class="historial-chip">Margen: ${fmt(f.margen)}</span>
        <span class="historial-chip">Fijos: ${fmt(f.costosFijos)}</span>
      </div>
    `
    lista.appendChild(item)
  })
}

function borrarEntrada(id){
  historial = historial.filter(f => f.id !== id)
  localStorage.setItem('breakeven_historial', JSON.stringify(historial))
  renderizarHistorial()
}

function limpiarHistorial(){
  mostrarModal({
    titulo:    'Limpiar historial',
    texto:     'Borrar todo el historial? No se puede deshacer.',
    confirmar: 'Borrar todo',
    accion: () => {
      historial = []
      localStorage.setItem('breakeven_historial', JSON.stringify(historial))
      renderizarHistorial()
    }
  })
}

// ─────────────────────────────────────────────
// COPIAR
// ─────────────────────────────────────────────

function copiarBreakeven(){
  if(!puntoActual) return

  const nombre = document.getElementById('beNombre').value.trim() || 'Sin nombre'
  const { costosFijos, costoVariable, precio, margen, puntoEquilibrio, ingresos } = puntoActual

  let texto = `YCA Ceramica - Punto de Equilibrio\n`
  texto += `Analisis: ${nombre}\n`
  texto += `─────────────────────\n`
  texto += `Costos fijos:       ${fmt(costosFijos)}\n`
  texto += `Costo variable:     ${fmt(costoVariable)}\n`
  texto += `Precio de venta:    ${fmt(precio)}\n`
  texto += `Margen por pieza:   ${fmt(margen)}\n`
  texto += `─────────────────────\n`
  texto += `Punto de equilibrio: ${puntoEquilibrio} piezas\n`
  texto += `Ingresos necesarios: ${fmt(ingresos)}\n`

  navigator.clipboard.writeText(texto).then(() => {
    const btn = document.querySelector('.btn-copiar')
    if(btn){
      btn.innerText = 'Copiado'
      setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar' }, 2000)
    }
  })
}

// ─────────────────────────────────────────────
// LOGO BASE64
// ─────────────────────────────────────────────

function cargarLogoBase64(){
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = img.width
      canvas.height = img.height
      canvas.getContext('2d').drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(null)
    img.src = '../imagenes/logo.png'
  })
}

// ─────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────

async function descargarPDF(){
  if(historial.length === 0) return

  const { jsPDF }  = window.jspdf
  const doc        = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, m = 18
  const MARRON     = [139, 111, 86]
  const NEGRO      = [40,  35,  30]
  const BLANCO     = [255, 255, 255]
  const GRIS_CLARO = [245, 240, 235]

  // Encabezado
  doc.setFillColor(...MARRON)
  doc.rect(0, 0, W, 40, 'F')

  const logo = await cargarLogoBase64()
  if(logo) doc.addImage(logo, 'PNG', m, 8, 22, 22)

  doc.setTextColor(...BLANCO)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('YCA Ceramica', m + 26, 17)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Punto de Equilibrio', m + 26, 24)

  doc.setFontSize(8)
  doc.text('instagram: @ycaceramica   |   tiktok: @yca.ceramica   |   youtube: @YCACeramica', m + 26, 31)

  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.text(`Generado: ${fecha}`, W - m, 36, { align: 'right' })

  let y = 50

  historial.forEach((f, idx) => {
    const alto = 52
    if(y + alto > 272){ doc.addPage(); y = 20 }

    doc.setFillColor(...GRIS_CLARO)
    doc.roundedRect(m, y, W - m * 2, alto, 4, 4, 'F')

    // Número y nombre
    doc.setTextColor(...MARRON)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`#${idx + 1}`, m + 5, y + 9)

    doc.setTextColor(...NEGRO)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text(f.nombre, m + 18, y + 9)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 110, 100)
    doc.text(f.fecha, m + 18, y + 15)

    y += 18

    // Chips de métricas
    const chips = [
      { label: 'COSTOS FIJOS',   valor: fmt(f.costosFijos) },
      { label: 'COSTO VARIABLE', valor: fmt(f.costoVariable) },
      { label: 'PRECIO',         valor: fmt(f.precio) },
      { label: 'MARGEN',         valor: fmt(f.margen) }
    ]

    const chipW = (W - m * 2 - 9) / 4

    chips.forEach((chip, ci) => {
      const x  = m + ci * (chipW + 3)
      const cx = x + chipW / 2

      doc.setFillColor(...BLANCO)
      doc.roundedRect(x, y, chipW, 14, 2, 2, 'F')

      doc.setTextColor(120, 110, 100)
      doc.setFontSize(5.5)
      doc.setFont('helvetica', 'bold')
      doc.text(chip.label, cx, y + 4.5, { align: 'center' })

      doc.setTextColor(...MARRON)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(chip.valor, cx, y + 10.5, { align: 'center' })
    })

    y += 18

    // Punto de equilibrio destacado
    doc.setFillColor(...MARRON)
    doc.roundedRect(m, y, W - m * 2, 12, 3, 3, 'F')
    doc.setTextColor(...BLANCO)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Punto de equilibrio: ${f.puntoEquilibrio} piezas   |   Ingresos necesarios: ${fmt(f.ingresos)}`, W / 2, y + 7.5, { align: 'center' })

    y += 16
  })

  // Pie
  doc.setFillColor(...GRIS_CLARO)
  doc.rect(0, 287, W, 10, 'F')
  doc.setTextColor(160, 150, 140)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('ycaceramica.github.io  |  YCA Ceramica 2026', W / 2, 293, { align: 'center' })

  doc.save('YCA_Ceramica_BreakEven.pdf')
}

// ─────────────────────────────────────────────
// GUARDAR EN MI TALLER / MI CUENTA
// ─────────────────────────────────────────────

function getSesion(){
  try { return JSON.parse(sessionStorage.getItem('yca_sesion')) }
  catch(e) { return null }
}

function verificarSesionTaller(){
  const sesion = getSesion()
  const btn    = document.getElementById('btnTallerBE')
  if(btn) btn.style.display = sesion && sesion.token ? 'flex' : 'none'
}

async function guardarEnTallerBE(){
  const sesion = getSesion()
  if(!sesion || !sesion.token){
    mostrarModal({ titulo: 'Iniciá sesion', texto: 'Iniciá sesion para guardar tus calculos en tu cuenta.', confirmar: 'Entendido', cancelar: false })
    return
  }
  if(historial.length === 0){
    mostrarModal({ titulo: 'Sin datos', texto: 'Guarda un analisis en el historial primero.', confirmar: 'Entendido', cancelar: false })
    return
  }

  const item        = historial[0]
  const esCeramista = sesion.rol === 'ceramista'
  const action      = esCeramista ? 'guardarHistorialTaller' : 'guardarHistorialAlumno'
  const idKey       = esCeramista ? 'ceramistaId' : 'alumnoId'
  const destino     = esCeramista ? 'mi taller' : 'mi cuenta'

  try {
    const res  = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({
        action,
        [idKey]: sesion.id,
        item: { calculadora: 'breakeven', nombre: item.nombre, datos: item }
      })
    })
    const data = await res.json()
    if(data.ok){
      mostrarModal({ titulo: 'Guardado en ' + destino, texto: 'El analisis fue sincronizado con tu cuenta.', confirmar: 'Genial', cancelar: false })
    } else {
      mostrarModal({ titulo: 'Error', texto: 'No se pudo guardar. Intenta de nuevo.', confirmar: 'Entendido', cancelar: false })
    }
  } catch(e){
    mostrarModal({ titulo: 'Sin conexion', texto: 'Revisa tu conexion e intenta de nuevo.', confirmar: 'Entendido', cancelar: false })
  }
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  inicializarCostosFijos()
  renderizarHistorial()
  verificarSesionTaller()

  // Verificar si hay datos desde costos al cargar
  if(localStorage.getItem('costos_para_breakeven')){
    cargarDesdeCostos()
  }
})
