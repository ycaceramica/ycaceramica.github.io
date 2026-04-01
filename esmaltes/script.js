// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

const API = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'

// Dark mode y nav manejados por nav-ceramista.js

// ─────────────────────────────────────────────
// INFO TOGGLE
// ─────────────────────────────────────────────

function toggleInfo(id, chevronId){
  const c = document.getElementById(id)
  const v = c.style.display !== 'none'
  c.style.display = v ? 'none' : 'block'
  document.getElementById(chevronId).style.transform = v ? 'rotate(0deg)' : 'rotate(180deg)'
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
  btnConfirmar.innerText = confirmar
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
// TABS PRINCIPALES
// ─────────────────────────────────────────────

let tabActual = 'esmaltes'

function setTabEsmalte(tab){
  tabActual = tab
  document.getElementById('tabEsmaltes').classList.toggle('activo', tab === 'esmaltes')
  document.getElementById('tabDensidad').classList.toggle('activo', tab === 'densidad')
  document.getElementById('secEsmaltes').style.display = tab === 'esmaltes' ? 'block' : 'none'
  document.getElementById('secDensidad').style.display = tab === 'densidad'  ? 'block' : 'none'
}

// ─────────────────────────────────────────────
// ══════════════════════════════════════════════
// PESTAÑA ESMALTES
// ══════════════════════════════════════════════
// ─────────────────────────────────────────────

let modoEsmalte       = 'pct'     // 'pct' | 'gramos'
let historialEsmaltes = JSON.parse(localStorage.getItem('esmaltes_historial') || '[]')
let contadorMaterial  = 0

// Materiales por defecto al cargar
const MATERIALES_DEFAULT = [
  { nombre: 'Feldespato potásico', valor: 40 },
  { nombre: 'Sílice',              valor: 30 },
  { nombre: 'Caolín',              valor: 20 },
  { nombre: 'Dolomita',            valor: 10 }
]

// ── MODO ──

function setModoEsmalte(modo){
  modoEsmalte = modo
  document.getElementById('btnModoPct').classList.toggle('activo',    modo === 'pct')
  document.getElementById('btnModoGramos').classList.toggle('activo', modo === 'gramos')

  // Mostrar/ocultar paso de total
  document.getElementById('pasoTotal').style.display = modo === 'pct' ? 'flex' : 'none'

  // Cambiar número de paso de materiales
  document.getElementById('numMateriales').innerText = modo === 'pct' ? '4' : '3'

  // Cambiar label de unidad en inputs
  document.querySelectorAll('.esm-material-unidad').forEach(u => {
    u.innerText = modo === 'pct' ? '%' : 'g'
  })

  // Cambiar placeholder de valores
  document.querySelectorAll('.esm-material-valor').forEach(i => {
    i.placeholder = modo === 'pct' ? '0' : '0'
  })

  // Mostrar/ocultar barra de total (solo relevante en modo %)
  document.getElementById('totalWrapper').style.display = modo === 'pct' ? 'block' : 'none'

  calcularEsmalte()
}

// ── MATERIALES ──

function inicializarMateriales(){
  const cont = document.getElementById('esmMateriales')
  cont.innerHTML = ''
  contadorMaterial = 0
  MATERIALES_DEFAULT.forEach(m => agregarMaterial(m.nombre, m.valor))
}

function agregarMaterial(nombre = '', valor = 0){
  const id   = ++contadorMaterial
  const cont = document.getElementById('esmMateriales')
  const div  = document.createElement('div')
  div.className  = 'esm-material'
  div.id         = 'material-' + id
  div.innerHTML  = `
    <input type="text"   class="esm-material-nombre" placeholder="Nombre del material"
           value="${nombre}" oninput="calcularEsmalte()">
    <input type="number" class="esm-material-valor"  placeholder="0" min="0"
           value="${valor || ''}" oninput="calcularEsmalte()">
    <span  class="esm-material-unidad">${modoEsmalte === 'pct' ? '%' : 'g'}</span>
    <button class="esm-material-borrar" onclick="borrarMaterial(${id})" title="Eliminar">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `
  cont.appendChild(div)
  calcularEsmalte()
}

function borrarMaterial(id){
  const el = document.getElementById('material-' + id)
  if(el) el.remove()
  calcularEsmalte()
}

// ── CÁLCULO ESMALTES ──

function obtenerMateriales(){
  const items = document.querySelectorAll('.esm-material')
  return Array.from(items).map(item => ({
    nombre: item.querySelector('.esm-material-nombre').value.trim() || 'Material',
    valor:  parseFloat(item.querySelector('.esm-material-valor').value) || 0
  })).filter(m => m.valor > 0)
}

function calcularEsmalte(){
  const materiales = obtenerMateriales()
  if(materiales.length === 0){
    document.getElementById('esmResultado').style.display = 'none'
    return
  }

  let resultados = []

  if(modoEsmalte === 'pct'){
    const total = parseFloat(document.getElementById('esmTotal').value) || 0
    const suma  = materiales.reduce((s, m) => s + m.valor, 0)

    // Actualizar barra
    const barra = document.getElementById('totalBarra')
    barra.style.width = Math.min(suma, 100) + '%'
    barra.classList.toggle('excede', suma > 100)
    document.getElementById('totalPct').innerText = suma.toFixed(1) + '%'

    const aviso = document.getElementById('totalAviso')
    if(Math.abs(suma - 100) < 0.01){
      aviso.innerText   = 'Perfecto'
      aviso.className   = 'total-aviso ok'
    } else if(suma < 100){
      aviso.innerText   = `Faltan ${(100 - suma).toFixed(1)}%`
      aviso.className   = 'total-aviso'
    } else {
      aviso.innerText   = `Excede en ${(suma - 100).toFixed(1)}%`
      aviso.className   = 'total-aviso'
    }

    resultados = materiales.map(m => ({
      nombre: m.nombre,
      pct:    m.valor,
      gramos: total > 0 ? ((m.valor / 100) * total).toFixed(1) : '—'
    }))

  } else {
    // Modo gramos → pct
    const totalGramos = materiales.reduce((s, m) => s + m.valor, 0)
    resultados = materiales.map(m => ({
      nombre: m.nombre,
      gramos: m.valor.toFixed(1),
      pct:    totalGramos > 0 ? ((m.valor / totalGramos) * 100).toFixed(1) : '0'
    }))
  }

  // Renderizar resultado
  const grid = document.getElementById('esmResultadoGrid')
  grid.innerHTML = ''
  resultados.forEach(r => {
    const item = document.createElement('div')
    item.className = 'resultado-item'
    item.innerHTML = `
      <div class="resultado-nombre">${r.nombre}</div>
      <div class="resultado-gramos">${r.gramos}g</div>
      <div class="resultado-pct">${r.pct}%</div>
    `
    grid.appendChild(item)
  })

  // Mostrar escalar (solo en modo %)
  document.getElementById('esmEscalar').style.display     = modoEsmalte === 'pct' ? 'block' : 'none'
  document.getElementById('esmResultado').style.display   = 'block'

  verificarSesionTaller()
}

// ── ESCALAR ──

function escalarReceta(){
  const nuevoTotal = parseFloat(document.getElementById('esmEscalarTotal').value)
  if(!nuevoTotal || nuevoTotal <= 0){
    mostrarModal({ titulo: 'Total inválido', texto: 'Ingresá un total mayor a 0 para escalar.', confirmar: 'Entendido', cancelar: false })
    return
  }

  const materiales = obtenerMateriales()
  const totalActual = parseFloat(document.getElementById('esmTotal').value) || 0
  if(totalActual <= 0) return

  const factor = nuevoTotal / totalActual
  const grid   = document.getElementById('esmEscalarGrid')
  grid.innerHTML = ''
  grid.style.display = 'grid'

  materiales.forEach(m => {
    const gramosEscalados = ((m.valor / 100) * nuevoTotal).toFixed(1)
    const item = document.createElement('div')
    item.className = 'resultado-item'
    item.innerHTML = `
      <div class="resultado-nombre">${m.nombre}</div>
      <div class="resultado-gramos">${gramosEscalados}g</div>
      <div class="resultado-pct">${m.valor}%</div>
    `
    grid.appendChild(item)
  })
}

// ── GUARDAR ESMALTE ──

function guardarEsmalte(){
  const nombre = document.getElementById('esmNombre').value.trim()
  if(!nombre){
    mostrarModal({ titulo: 'Sin nombre', texto: 'Poné un nombre a la receta antes de guardar.', confirmar: 'Entendido', cancelar: false })
    return
  }

  const materiales = obtenerMateriales()
  if(materiales.length === 0){
    mostrarModal({ titulo: 'Sin materiales', texto: 'Agregá al menos un material.', confirmar: 'Entendido', cancelar: false })
    return
  }

  const total = modoEsmalte === 'pct'
    ? (parseFloat(document.getElementById('esmTotal').value) || 0)
    : materiales.reduce((s, m) => s + m.valor, 0)

  const componentes = modoEsmalte === 'pct'
    ? materiales.map(m => ({ nombre: m.nombre, pct: m.valor, gramos: ((m.valor / 100) * total).toFixed(1) }))
    : (() => {
        const tot = materiales.reduce((s, m) => s + m.valor, 0)
        return materiales.map(m => ({ nombre: m.nombre, gramos: m.valor.toFixed(1), pct: tot > 0 ? ((m.valor / tot) * 100).toFixed(1) : '0' }))
      })()

  const entrada = {
    id:          Date.now(),
    nombre,
    modo:        modoEsmalte,
    total:       total.toFixed(1),
    componentes,
    fecha:       new Date().toLocaleDateString('es-AR')
  }

  historialEsmaltes.unshift(entrada)
  localStorage.setItem('esmaltes_historial', JSON.stringify(historialEsmaltes))
  renderizarHistorialEsmaltes()

  const btn = document.querySelector('#secEsmaltes .btn-guardar')
  if(btn){
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Guardado'
    setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar en historial' }, 2000)
  }
}

// ── RENDERIZAR HISTORIAL ESMALTES ──

function renderizarHistorialEsmaltes(){
  const lista  = document.getElementById('esmHistorialLista')
  const btnPDF = document.getElementById('btnPDFEsmaltes')
  const btnLim = document.getElementById('btnLimpiarEsmaltes')

  lista.innerHTML = ''

  if(historialEsmaltes.length === 0){
    lista.innerHTML = '<p class="historial-vacio">Guardá una receta para verla aquí.</p>'
    btnPDF.disabled      = true
    btnLim.style.display = 'none'
    return
  }

  btnPDF.disabled      = false
  btnLim.style.display = 'inline-flex'

  historialEsmaltes.forEach(f => {
    const item = document.createElement('div')
    item.className = 'historial-item'
    item.innerHTML = `
      <button class="historial-item-borrar" onclick="borrarEsmalte(${f.id})">✕</button>
      <div class="historial-item-nombre">${f.nombre}</div>
      <div class="historial-item-meta">${f.total}g · ${f.fecha}</div>
      <div class="historial-item-componentes">
        ${f.componentes.map(c => `<span class="historial-chip">${c.nombre}: ${c.gramos}g</span>`).join('')}
      </div>
    `
    lista.appendChild(item)
  })
}

function borrarEsmalte(id){
  historialEsmaltes = historialEsmaltes.filter(f => f.id !== id)
  localStorage.setItem('esmaltes_historial', JSON.stringify(historialEsmaltes))
  renderizarHistorialEsmaltes()
}

function limpiarHistorialEsmaltes(){
  mostrarModal({
    titulo: 'Limpiar historial',
    texto:  '¿Borrar todo el historial de esmaltes? No se puede deshacer.',
    confirmar: 'Borrar todo',
    accion: () => {
      historialEsmaltes = []
      localStorage.setItem('esmaltes_historial', JSON.stringify(historialEsmaltes))
      renderizarHistorialEsmaltes()
    }
  })
}

// ── COPIAR ESMALTE ──

function copiarEsmalte(){
  const nombre     = document.getElementById('esmNombre').value.trim() || 'Sin nombre'
  const materiales = obtenerMateriales()
  const total      = modoEsmalte === 'pct' ? (parseFloat(document.getElementById('esmTotal').value) || 0) : materiales.reduce((s, m) => s + m.valor, 0)

  let texto = `YCA Ceramica - Calculadora de Esmaltes\n`
  texto += `Receta: ${nombre} | Total: ${total.toFixed(1)}g\n`
  texto += `─────────────────────\n`

  if(modoEsmalte === 'pct'){
    materiales.forEach(m => {
      texto += `${m.nombre}: ${((m.valor / 100) * total).toFixed(1)}g (${m.valor}%)\n`
    })
  } else {
    const tot = materiales.reduce((s, m) => s + m.valor, 0)
    materiales.forEach(m => {
      texto += `${m.nombre}: ${m.valor.toFixed(1)}g (${tot > 0 ? ((m.valor / tot) * 100).toFixed(1) : 0}%)\n`
    })
  }

  navigator.clipboard.writeText(texto).then(() => {
    const btn = document.querySelector('#secEsmaltes .btn-copiar')
    if(btn){
      btn.innerText = 'Copiado'
      setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar' }, 2000)
    }
  })
}

// ─────────────────────────────────────────────
// ══════════════════════════════════════════════
// PESTAÑA DENSIDAD
// ══════════════════════════════════════════════
// ─────────────────────────────────────────────

let modoDensidad      = 'simple'
let historialDensidad = JSON.parse(localStorage.getItem('densidad_historial') || '[]')
let densidadActual    = null

// ── MODO DENSIDAD ──

function setModoDensidad(modo){
  modoDensidad = modo
  document.getElementById('btnModoSimple').classList.toggle('activo', modo === 'simple')
  document.getElementById('btnModoTara').classList.toggle('activo',   modo === 'tara')
  document.getElementById('pasoDensidadSimple').style.display = modo === 'simple' ? 'flex' : 'none'
  document.getElementById('pasoDensidadTara').style.display   = modo === 'tara'   ? 'flex' : 'none'
  document.getElementById('denResultado').style.display = 'none'
  densidadActual = null
}

// ── CALCULAR DENSIDAD ──

function calcularDensidad(){
  let peso    = 0
  let volumen = 0

  if(modoDensidad === 'simple'){
    peso    = parseFloat(document.getElementById('denPeso').value)    || 0
    volumen = parseFloat(document.getElementById('denVolumen').value)  || 0
  } else {
    const tara       = parseFloat(document.getElementById('denTara').value)       || 0
    const pesoTotal  = parseFloat(document.getElementById('denPesoTotal').value)  || 0
    volumen          = parseFloat(document.getElementById('denVolumenTara').value) || 0
    peso             = pesoTotal - tara

    if(tara > 0 && pesoTotal > 0 && pesoTotal <= tara){
      document.getElementById('denResultado').style.display = 'none'
      return
    }
  }

  if(peso <= 0 || volumen <= 0){
    document.getElementById('denResultado').style.display = 'none'
    return
  }

  const densidad = peso / volumen
  densidadActual = densidad

  document.getElementById('denValor').innerText = densidad.toFixed(2)
  document.getElementById('denResultado').style.display = 'block'

  // Determinar estado
  let estado, clase
  if(densidad < 1.5){
    estado = 'Fluido — bueno para inmersión'
    clase  = 'fluido'
  } else if(densidad <= 1.7){
    estado = 'Estándar — ideal para la mayoría'
    clase  = 'estandar'
  } else {
    estado = 'Espeso — apto para pincelado'
    clase  = 'espeso'
  }

  const badge = document.getElementById('denEstadoBadge')
  badge.innerText   = estado
  badge.className   = 'den-estado-badge ' + clase

  // Posicionar marcador en la barra
  // Rango visual: 1.2 (0%) a 2.0 (100%)
  const minBar = 1.2, maxBar = 2.0
  const pct    = Math.min(Math.max(((densidad - minBar) / (maxBar - minBar)) * 100, 0), 100)
  document.getElementById('denMarcador').style.left = pct + '%'

  // Limpiar ajuste anterior
  document.getElementById('denAjusteResultado').style.display = 'none'
  document.getElementById('denDeseada').value = ''

  verificarSesionTaller()
}

// ── CALCULAR AJUSTE ──

function calcularAjuste(){
  if(!densidadActual) return
  const deseada = parseFloat(document.getElementById('denDeseada').value)
  if(!deseada || deseada <= 0 || deseada >= densidadActual){
    document.getElementById('denAjusteResultado').style.display = 'none'
    return
  }

  // Estimación de agua a agregar (fórmula aproximada)
  let peso = 0
  if(modoDensidad === 'simple'){
    peso = parseFloat(document.getElementById('denPeso').value) || 0
  } else {
    const tara      = parseFloat(document.getElementById('denTara').value) || 0
    const pesoTotal = parseFloat(document.getElementById('denPesoTotal').value) || 0
    peso = pesoTotal - tara
  }

  const agua  = peso * (densidadActual / deseada - 1)
  const res   = document.getElementById('denAjusteResultado')
  res.innerText     = `Agregar aproximadamente ${agua.toFixed(0)} ml de agua para llegar a ${deseada} g/ml.`
  res.style.display = 'block'
}

// ── GUARDAR DENSIDAD ──

function guardarDensidad(){
  if(!densidadActual) return

  const nombre = document.getElementById('denNombre').value.trim()
  if(!nombre){
    mostrarModal({ titulo: 'Sin nombre', texto: 'Poné un nombre al esmalte antes de guardar.', confirmar: 'Entendido', cancelar: false })
    return
  }

  let peso = 0, volumen = 0
  if(modoDensidad === 'simple'){
    peso    = parseFloat(document.getElementById('denPeso').value) || 0
    volumen = parseFloat(document.getElementById('denVolumen').value) || 0
  } else {
    const tara      = parseFloat(document.getElementById('denTara').value) || 0
    const pesoTotal = parseFloat(document.getElementById('denPesoTotal').value) || 0
    volumen         = parseFloat(document.getElementById('denVolumenTara').value) || 0
    peso            = pesoTotal - tara
  }

  const badge   = document.getElementById('denEstadoBadge')
  const entrada = {
    id:        Date.now(),
    nombre,
    modo:      modoDensidad,
    peso:      peso.toFixed(1),
    volumen:   volumen.toFixed(1),
    densidad:  densidadActual.toFixed(2),
    estado:    badge.innerText,
    fecha:     new Date().toLocaleDateString('es-AR')
  }

  historialDensidad.unshift(entrada)
  localStorage.setItem('densidad_historial', JSON.stringify(historialDensidad))
  renderizarHistorialDensidad()

  const btn = document.querySelector('#secDensidad .btn-guardar')
  if(btn){
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Guardado'
    setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar en historial' }, 2000)
  }
}

// ── RENDERIZAR HISTORIAL DENSIDAD ──

function renderizarHistorialDensidad(){
  const lista  = document.getElementById('denHistorialLista')
  const btnPDF = document.getElementById('btnPDFDensidad')
  const btnLim = document.getElementById('btnLimpiarDensidad')

  lista.innerHTML = ''

  if(historialDensidad.length === 0){
    lista.innerHTML = '<p class="historial-vacio">Guardá una medición para verla aquí.</p>'
    btnPDF.disabled      = true
    btnLim.style.display = 'none'
    return
  }

  btnPDF.disabled      = false
  btnLim.style.display = 'inline-flex'

  historialDensidad.forEach(f => {
    const item = document.createElement('div')
    item.className = 'historial-item'
    item.innerHTML = `
      <button class="historial-item-borrar" onclick="borrarDensidad(${f.id})">✕</button>
      <div class="historial-item-nombre">${f.nombre}</div>
      <div class="historial-item-meta">${f.densidad} g/ml · ${f.fecha}</div>
      <div class="historial-item-componentes">
        <span class="historial-chip">Peso: ${f.peso}g</span>
        <span class="historial-chip">Vol: ${f.volumen}ml</span>
        <span class="historial-chip">${f.estado}</span>
      </div>
    `
    lista.appendChild(item)
  })
}

function borrarDensidad(id){
  historialDensidad = historialDensidad.filter(f => f.id !== id)
  localStorage.setItem('densidad_historial', JSON.stringify(historialDensidad))
  renderizarHistorialDensidad()
}

function limpiarHistorialDensidad(){
  mostrarModal({
    titulo: 'Limpiar historial',
    texto:  '¿Borrar todo el historial de densidad? No se puede deshacer.',
    confirmar: 'Borrar todo',
    accion: () => {
      historialDensidad = []
      localStorage.setItem('densidad_historial', JSON.stringify(historialDensidad))
      renderizarHistorialDensidad()
    }
  })
}

// ─────────────────────────────────────────────
// LOGO BASE64 PARA PDF
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
// PDF CABECERA (reutilizable)
// ─────────────────────────────────────────────

async function crearEncabezadoPDF(doc, subtitulo){
  const W = 210, m = 18
  const MARRON     = [139, 111, 86]
  const BLANCO     = [255, 255, 255]
  const GRIS_CLARO = [245, 240, 235]

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
  doc.text(subtitulo, m + 26, 24)

  doc.setFontSize(8)
  doc.text('instagram: @ycaceramica   |   tiktok: @yca.ceramica   |   youtube: @YCACeramica', m + 26, 31)

  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.text(`Generado: ${fecha}`, W - m, 36, { align: 'right' })

  return GRIS_CLARO
}

// ─────────────────────────────────────────────
// PDF ESMALTES
// ─────────────────────────────────────────────

async function descargarPDFEsmaltes(){
  if(historialEsmaltes.length === 0) return

  const { jsPDF }  = window.jspdf
  const doc        = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, m = 18
  const MARRON     = [139, 111, 86]
  const NEGRO      = [40, 35, 30]
  const BLANCO     = [255, 255, 255]

  const GRIS_CLARO = await crearEncabezadoPDF(doc, 'Calculadora de Esmaltes')
  let y = 50

  historialEsmaltes.forEach((f, idx) => {
    const alto = 18 + 18 + (f.componentes.length > 4 ? 28 : 16)
    if(y + alto > 272){ doc.addPage(); y = 20 }

    doc.setFillColor(...GRIS_CLARO)
    doc.roundedRect(m, y, W - m * 2, alto, 4, 4, 'F')

    doc.setTextColor(...MARRON)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`#${idx + 1}`, m + 5, y + 9)

    doc.setTextColor(...NEGRO)
    doc.setFontSize(13)
    doc.text(f.nombre, m + 18, y + 9)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 110, 100)
    doc.text(`${f.total}g totales  |  ${f.fecha}`, m + 18, y + 15)

    y += 20

    const n    = Math.min(f.componentes.length, 5)
    const colW = (W - m * 2 - (n - 1) * 3) / n

    f.componentes.slice(0, 5).forEach((c, ci) => {
      const x  = m + ci * (colW + 3)
      const cx = x + colW / 2

      doc.setFillColor(...BLANCO)
      doc.roundedRect(x, y, colW, 14, 2, 2, 'F')

      doc.setTextColor(120, 110, 100)
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'bold')
      const label = c.nombre.length > 14 ? c.nombre.substring(0, 12) + '...' : c.nombre
      doc.text(label.toUpperCase(), cx, y + 4.5, { align: 'center' })

      doc.setTextColor(...MARRON)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`${c.gramos}g`, cx, y + 10, { align: 'center' })

      doc.setTextColor(160, 150, 140)
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'normal')
      doc.text(`${c.pct}%`, cx, y + 13.5, { align: 'center' })
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

  doc.save('YCA_Ceramica_Esmaltes.pdf')
}

// ─────────────────────────────────────────────
// PDF DENSIDAD
// ─────────────────────────────────────────────

async function descargarPDFDensidad(){
  if(historialDensidad.length === 0) return

  const { jsPDF }  = window.jspdf
  const doc        = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, m = 18
  const MARRON     = [139, 111, 86]
  const NEGRO      = [40, 35, 30]
  const BLANCO     = [255, 255, 255]

  const GRIS_CLARO = await crearEncabezadoPDF(doc, 'Densidad de Esmaltes')
  let y = 50

  historialDensidad.forEach((f, idx) => {
    const alto = 36
    if(y + alto > 272){ doc.addPage(); y = 20 }

    doc.setFillColor(...GRIS_CLARO)
    doc.roundedRect(m, y, W - m * 2, alto, 4, 4, 'F')

    doc.setTextColor(...MARRON)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`#${idx + 1}`, m + 5, y + 9)

    doc.setTextColor(...NEGRO)
    doc.setFontSize(13)
    doc.text(f.nombre, m + 18, y + 9)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 110, 100)
    doc.text(`${f.fecha}`, m + 18, y + 15)

    // Chips de datos
    const chips = [
      { label: 'DENSIDAD', valor: `${f.densidad} g/ml` },
      { label: 'PESO',     valor: `${f.peso}g` },
      { label: 'VOLUMEN',  valor: `${f.volumen}ml` },
      { label: 'ESTADO',   valor: f.estado.split(' ')[0] }
    ]

    const chipW = (W - m * 2 - 9) / 4

    chips.forEach((chip, ci) => {
      const x  = m + ci * (chipW + 3)
      const cx = x + chipW / 2

      doc.setFillColor(...BLANCO)
      doc.roundedRect(x, y + 18, chipW, 14, 2, 2, 'F')

      doc.setTextColor(120, 110, 100)
      doc.setFontSize(6)
      doc.setFont('helvetica', 'bold')
      doc.text(chip.label, cx, y + 23, { align: 'center' })

      doc.setTextColor(...MARRON)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(chip.valor, cx, y + 29.5, { align: 'center' })
    })

    y += alto + 4
  })

  doc.setFillColor(...GRIS_CLARO)
  doc.rect(0, 287, W, 10, 'F')
  doc.setTextColor(160, 150, 140)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('ycaceramica.com.ar  |  YCA Ceramica 2026', W / 2, 293, { align: 'center' })

  doc.save('YCA_Ceramica_Densidad.pdf')
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
  document.getElementById('btnTallerEsmalte').style.display  = activo ? 'flex' : 'none'
  document.getElementById('btnTallerDensidad').style.display = activo ? 'flex' : 'none'
}

async function guardarEnTallerEsmalte(){
  const sesion = getSesion()
  if(!sesion || !sesion.token){
    mostrarModal({ titulo: 'Iniciá sesión', texto: 'Iniciá sesión para guardar tus cálculos en tu cuenta.', confirmar: 'Entendido', cancelar: false })
    return
  }

  if(historialEsmaltes.length === 0){
    mostrarModal({ titulo: 'Sin datos', texto: 'Guardá una receta en el historial primero.', confirmar: 'Entendido', cancelar: false })
    return
  }

  const item    = historialEsmaltes[0]
  const esCeramista = sesion.rol === 'ceramista'
  const action  = esCeramista ? 'guardarHistorialTaller' : 'guardarHistorialAlumno'
  const idKey   = esCeramista ? 'ceramistaId' : 'alumnoId'
  const destino = esCeramista ? 'mi taller' : 'mi cuenta'
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
        item: { calculadora: 'esmaltes', nombre: item.nombre, datos: item }
      })
    })
    const data = await res.json()
    if(data.ok){
      mostrarModal({ titulo: 'Guardado en ' + destino, texto: 'El calculo fue sincronizado con tu cuenta.', confirmar: 'Genial', cancelar: false })
    } else {
      mostrarModal({ titulo: 'Error', texto: 'No se pudo guardar. Intentá de nuevo.', confirmar: 'Entendido', cancelar: false })
    }
  } catch(e){
    mostrarModal({ titulo: 'Sin conexion', texto: 'Revisa tu conexion e intentá de nuevo.', confirmar: 'Entendido', cancelar: false })
  }
}

async function guardarEnTallerDensidad(){
  const sesion = getSesion()
  if(!sesion || !sesion.token){
    mostrarModal({ titulo: 'Iniciá sesión', texto: 'Iniciá sesión para guardar tus cálculos en tu cuenta.', confirmar: 'Entendido', cancelar: false })
    return
  }

  if(historialDensidad.length === 0){
    mostrarModal({ titulo: 'Sin datos', texto: 'Guardá una medición en el historial primero.', confirmar: 'Entendido', cancelar: false })
    return
  }

  const item    = historialDensidad[0]
  const esCeramista = sesion.rol === 'ceramista'
  const action  = esCeramista ? 'guardarHistorialTaller' : 'guardarHistorialAlumno'
  const idKey   = esCeramista ? 'ceramistaId' : 'alumnoId'
  const destino = esCeramista ? 'mi taller' : 'mi cuenta'
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
        item: { calculadora: 'densidad', nombre: item.nombre, datos: item }
      })
    })
    const data = await res.json()
    if(data.ok){
      mostrarModal({ titulo: 'Guardado en ' + destino, texto: 'La medicion fue sincronizada con tu cuenta.', confirmar: 'Genial', cancelar: false })
    } else {
      mostrarModal({ titulo: 'Error', texto: 'No se pudo guardar. Intentá de nuevo.', confirmar: 'Entendido', cancelar: false })
    }
  } catch(e){
    mostrarModal({ titulo: 'Sin conexion', texto: 'Revisa tu conexion e intentá de nuevo.', confirmar: 'Entendido', cancelar: false })
  }
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

inicializarMateriales()
renderizarHistorialEsmaltes()
renderizarHistorialDensidad()
calcularEsmalte()
verificarSesionTaller()
