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

let metodoActual = 'hervido'
let historial    = JSON.parse(localStorage.getItem('absorcion_historial') || '[]')
let resultadoActual = null

// ─────────────────────────────────────────────
// MÉTODO
// ─────────────────────────────────────────────

function setMetodo(metodo){
  metodoActual = metodo
  document.getElementById('btnMetodoHervido').classList.toggle('activo', metodo === 'hervido')
  document.getElementById('btnMetodoRemojo').classList.toggle('activo',  metodo === 'remojo')

  const nota = document.getElementById('metodoNota')
  if(metodo === 'hervido'){
    nota.innerText = 'Recomendado: el hervido satura mejor la pieza y da resultados más precisos.'
  } else {
    nota.innerText = 'Alternativa más simple. Puede subestimar la absorción hasta un 2% respecto al hervido.'
  }

  // Actualizar aviso en resultado si ya hay un cálculo
  if(resultadoActual !== null){
    const aviso = document.getElementById('absAvisoMetodo')
    aviso.style.display = metodo === 'remojo' ? 'flex' : 'none'
  }
}

// ─────────────────────────────────────────────
// CALCULAR
// ─────────────────────────────────────────────

function calcularAbsorcion(){
  const seco   = parseFloat(document.getElementById('absPesoSeco').value)
  const humedo = parseFloat(document.getElementById('absPesoHumedo').value)

  if(!seco || !humedo || seco <= 0 || humedo <= 0){
    document.getElementById('absResultado').style.display = 'none'
    resultadoActual = null
    return
  }

  if(humedo < seco){
    document.getElementById('absResultado').style.display = 'none'
    resultadoActual = null
    return
  }

  const absorcion = ((humedo - seco) / seco) * 100
  resultadoActual = absorcion

  document.getElementById('absValor').innerText = absorcion.toFixed(2)
  document.getElementById('absResultado').style.display = 'flex'

  // Determinar estado
  let estado, clase, barraColor
  if(absorcion <= 1){
    estado      = 'Alta vitrificacion — excelente para cualquier uso'
    clase       = 'vitrificada'
    barraColor  = '#52a852'
  } else if(absorcion <= 3){
    estado      = 'Muy buena — apta para ceramica utilitaria'
    clase       = 'buena'
    barraColor  = '#7ab87a'
  } else if(absorcion <= 6){
    estado      = 'Absorcion media — revisar temperatura de coccion'
    clase       = 'media'
    barraColor  = '#c9a227'
  } else {
    estado      = 'Absorcion alta — riesgo en piezas utilitarias'
    clase       = 'alta'
    barraColor  = '#a85252'
  }

  const badge = document.getElementById('absEstado')
  badge.innerText   = estado
  badge.className   = 'abs-estado ' + clase

  // Barra: 0% = 0, 6%+ = 100% visual
  const pctBarra = Math.min((absorcion / 6) * 100, 100)
  const barra    = document.getElementById('absBarra')
  barra.style.width      = pctBarra + '%'
  barra.style.background = barraColor

  // Aviso de método
  document.getElementById('absAvisoMetodo').style.display = metodoActual === 'remojo' ? 'flex' : 'none'

  verificarSesionTaller()
}

// ─────────────────────────────────────────────
// GUARDAR EN HISTORIAL
// ─────────────────────────────────────────────

function guardarAbsorcion(){
  const nombre = document.getElementById('absNombre').value.trim()
  if(!nombre){
    mostrarModal({ titulo: 'Sin nombre', texto: 'Poné un nombre a la pieza antes de guardar.', confirmar: 'Entendido', cancelar: false })
    return
  }
  if(resultadoActual === null){
    mostrarModal({ titulo: 'Sin resultado', texto: 'Ingresa los pesos para calcular primero.', confirmar: 'Entendido', cancelar: false })
    return
  }

  const seco   = parseFloat(document.getElementById('absPesoSeco').value)
  const humedo = parseFloat(document.getElementById('absPesoHumedo').value)
  const badge  = document.getElementById('absEstado')

  const entrada = {
    id:         Date.now(),
    nombre,
    metodo:     metodoActual,
    pesoSeco:   seco.toFixed(1),
    pesoHumedo: humedo.toFixed(1),
    absorcion:  resultadoActual.toFixed(2),
    estado:     badge.innerText,
    fecha:      new Date().toLocaleDateString('es-AR')
  }

  historial.unshift(entrada)
  localStorage.setItem('absorcion_historial', JSON.stringify(historial))
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
  const lista  = document.getElementById('absHistorialLista')
  const btnPDF = document.getElementById('btnPDF')
  const btnLim = document.getElementById('btnLimpiar')

  lista.innerHTML = ''

  if(historial.length === 0){
    lista.innerHTML = '<p class="historial-vacio">Guardá una medición para verla aquí.</p>'
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
      <div class="historial-item-meta">${f.metodo === 'hervido' ? 'Hervido' : 'Remojo'} · ${f.fecha}</div>
      <div class="historial-item-componentes">
        <span class="historial-chip">Seco: ${f.pesoSeco}g</span>
        <span class="historial-chip">Humedo: ${f.pesoHumedo}g</span>
        <span class="historial-chip">${f.absorcion}%</span>
      </div>
    `
    lista.appendChild(item)
  })
}

function borrarEntrada(id){
  historial = historial.filter(f => f.id !== id)
  localStorage.setItem('absorcion_historial', JSON.stringify(historial))
  renderizarHistorial()
}

function limpiarHistorial(){
  mostrarModal({
    titulo: 'Limpiar historial',
    texto:  'Borrar todo el historial? No se puede deshacer.',
    confirmar: 'Borrar todo',
    accion: () => {
      historial = []
      localStorage.setItem('absorcion_historial', JSON.stringify(historial))
      renderizarHistorial()
    }
  })
}

// ─────────────────────────────────────────────
// COPIAR
// ─────────────────────────────────────────────

function copiarAbsorcion(){
  if(resultadoActual === null) return

  const nombre = document.getElementById('absNombre').value.trim() || 'Sin nombre'
  const seco   = document.getElementById('absPesoSeco').value
  const humedo = document.getElementById('absPesoHumedo').value
  const badge  = document.getElementById('absEstado')

  let texto = `YCA Ceramica - Absorcion de Agua\n`
  texto += `Pieza: ${nombre}\n`
  texto += `Metodo: ${metodoActual === 'hervido' ? 'Hervido' : 'Remojo 24hs'}\n`
  texto += `─────────────────────\n`
  texto += `Peso seco:   ${seco}g\n`
  texto += `Peso humedo: ${humedo}g\n`
  texto += `Absorcion:   ${resultadoActual.toFixed(2)}%\n`
  texto += `Estado: ${badge.innerText}\n`

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
  doc.text('Absorcion de Agua', m + 26, 24)

  doc.setFontSize(8)
  doc.text('instagram: @ycaceramica   |   tiktok: @yca.ceramica   |   youtube: @YCACeramica', m + 26, 31)

  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.text(`Generado: ${fecha}`, W - m, 36, { align: 'right' })

  let y = 50

  historial.forEach((f, idx) => {
    const alto = 40
    if(y + alto > 272){ doc.addPage(); y = 20 }

    doc.setFillColor(...GRIS_CLARO)
    doc.roundedRect(m, y, W - m * 2, alto, 4, 4, 'F')

    // Número
    doc.setTextColor(...MARRON)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`#${idx + 1}`, m + 5, y + 9)

    // Nombre
    doc.setTextColor(...NEGRO)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text(f.nombre, m + 18, y + 9)

    // Meta
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 110, 100)
    const metodoLabel = f.metodo === 'hervido' ? 'Hervido' : 'Remojo 24hs'
    doc.text(`${metodoLabel}  |  ${f.fecha}`, m + 18, y + 15)

    y += 20

    // Chips de datos
    const chips = [
      { label: 'PESO SECO',   valor: `${f.pesoSeco}g` },
      { label: 'PESO HUMEDO', valor: `${f.pesoHumedo}g` },
      { label: 'ABSORCION',   valor: `${f.absorcion}%` },
      { label: 'ESTADO',      valor: f.estado.split(' ')[0] }
    ]

    const chipW = (W - m * 2 - 9) / 4

    chips.forEach((chip, ci) => {
      const x  = m + ci * (chipW + 3)
      const cx = x + chipW / 2

      doc.setFillColor(...BLANCO)
      doc.roundedRect(x, y, chipW, 14, 2, 2, 'F')

      doc.setTextColor(120, 110, 100)
      doc.setFontSize(6)
      doc.setFont('helvetica', 'bold')
      doc.text(chip.label, cx, y + 4.5, { align: 'center' })

      doc.setTextColor(...MARRON)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(chip.valor, cx, y + 10.5, { align: 'center' })
    })

    y += 18
  })

  // Pie
  doc.setFillColor(...GRIS_CLARO)
  doc.rect(0, 287, W, 10, 'F')
  doc.setTextColor(160, 150, 140)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('ycaceramica.com.ar  |  YCA Ceramica 2026', W / 2, 293, { align: 'center' })

  doc.save('YCA_Ceramica_Absorcion.pdf')
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
  const activo = sesion && sesion.token
  const btn    = document.getElementById('btnTallerAbs')
  if(btn) btn.style.display = activo ? 'flex' : 'none'
}

async function guardarEnTallerAbs(){
  const sesion = getSesion()
  if(!sesion || !sesion.token){
    mostrarModal({ titulo: 'Iniciá sesion', texto: 'Iniciá sesion para guardar tus calculos en tu cuenta.', confirmar: 'Entendido', cancelar: false })
    return
  }

  if(historial.length === 0){
    mostrarModal({ titulo: 'Sin datos', texto: 'Guarda una medicion en el historial primero.', confirmar: 'Entendido', cancelar: false })
    return
  }

  const item        = historial[0]
  const esCeramista = sesion.rol === 'ceramista'
  const action      = esCeramista ? 'guardarHistorialTaller' : 'guardarHistorialAlumno'
  const idKey       = esCeramista ? 'ceramistaId' : 'alumnoId'
  const destino     = esCeramista ? 'mi taller' : 'mi cuenta'
  // Chequear límite de historial
  const esPro   = sesion.plan === 'pro'
  const limite  = esPro ? 30 : 10
  try {
    const resH  = await fetch(`${API}?action=${esCeramista ? 'getHistorialTaller' : 'getHistorialAlumno'}&id=${encodeURIComponent(sesion.id)}`)
    const dataH = await resH.json()
    const totalGuardados = (dataH.data || []).length
    if(totalGuardados >= limite){
      const msg = esPro
        ? `Llegaste al límite de ${limite} resultados guardados.`
        : `Llegaste al límite de ${limite} resultados (plan gratuito). Eliminá alguno o pasá al plan Pro para guardar hasta 30.`
      mostrarModal({ titulo: 'Límite alcanzado', texto: msg, confirmar: 'Entendido', cancelar: false })
      return
    }
  } catch(e){ /* si falla el chequeo, permitir guardar igual */ }

  try {
    const res  = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({
        action,
        [idKey]: sesion.id,
        item: { calculadora: 'absorcion', nombre: item.nombre, datos: item }
      })
    })
    const data = await res.json()
    if(data.ok){
      mostrarModal({ titulo: 'Guardado en ' + destino, texto: 'La medicion fue sincronizada con tu cuenta.', confirmar: 'Genial', cancelar: false })
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

renderizarHistorial()
verificarSesionTaller()
