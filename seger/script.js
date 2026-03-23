// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

const API = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'

// ─────────────────────────────────────────────
// BASE DE DATOS DE MATERIAS PRIMAS
// Composición química en % de óxidos por material
// Peso molecular incluido para conversión a moles
// ─────────────────────────────────────────────

const MATERIALES_DB = {
  // ── FELDESPATOS ──
  'Feldespato potásico':   { K2O:16.9, Al2O3:18.3, SiO2:64.8 },
  'Feldespato sódico':     { Na2O:11.8, Al2O3:19.5, SiO2:68.7 },
  'Feldespato de litio':   { Li2O:4.9,  Al2O3:23.4, SiO2:64.8 },
  'Cornish Stone':         { K2O:4.5, Na2O:3.6, CaO:1.8, Al2O3:16.2, SiO2:72.5 },
  'Custer Feldspar':       { K2O:9.5, Na2O:3.0, Al2O3:17.1, SiO2:68.5 },
  'G-200 Feldspar':        { K2O:11.3, Na2O:3.5, Al2O3:18.0, SiO2:66.2 },

  // ── ARCILLAS ──
  'Caolín (EPK)':          { Al2O3:37.3, SiO2:45.7, TiO2:0.3 },
  'Caolín calcined':       { Al2O3:38.5, SiO2:45.5 },
  'Ball clay':             { Al2O3:30.5, SiO2:52.8, TiO2:1.5 },
  'Bentonita':             { MgO:3.2, Na2O:2.5, Al2O3:21.0, SiO2:61.4 },
  'Arcilla roja':          { Fe2O3:6.5, Al2O3:18.5, SiO2:65.0, TiO2:1.0 },

  // ── SILICE ──
  'Sílice (cuarzo)':       { SiO2:100.0 },
  'Pedernal (flint)':      { SiO2:98.0 },
  'Nefelina sienita':      { K2O:4.7, Na2O:9.8, Al2O3:23.3, SiO2:60.4 },

  // ── CALCIO ──
  'Whiting (CaCO3)':       { CaO:56.1 },
  'Wollastonita':          { CaO:48.3, SiO2:51.7 },
  'Dolomita':              { CaO:30.4, MgO:21.9 },
  'Talco':                 { MgO:31.7, SiO2:63.5 },
  'Calcita':               { CaO:56.0 },

  // ── ZINC / BARIO ──
  'Óxido de zinc (ZnO)':   { ZnO:100.0 },
  'Carbonato de bario':    { BaO:77.7 },

  // ── BORO ──
  'Frita boro (Ferro 3134)':{ CaO:20.0, B2O3:23.0, Na2O:10.0, SiO2:47.0 },
  'Frita boro (Ferro 3195)':{ CaO:14.7, B2O3:23.8, Na2O:5.0, ZnO:2.3, SiO2:52.9 },
  'Frita boro (Ferro 3110)':{ Na2O:10.5, B2O3:2.0, SiO2:74.0, CaO:0.3, Al2O3:2.4 },
  'Colemanita':            { CaO:27.3, B2O3:50.9 },
  'Ulexita':               { CaO:13.7, Na2O:6.4, B2O3:43.0 },

  // ── COLORANTES ──
  'Óxido de cobalto (CoO)':{ CoO:100.0 },
  'Óxido de cobre (CuO)':  { CuO:100.0 },
  'Óxido de hierro (Fe2O3)':{ Fe2O3:100.0 },
  'Óxido de manganeso':    { MnO2:100.0 },
  'Óxido de cromo':        { Cr2O3:100.0 },
  'Óxido de titanio':      { TiO2:100.0 },
  'Óxido de estaño':       { SnO2:100.0 },
  'Rutilo':                { TiO2:94.0, Fe2O3:4.0 },
  'Óxido de circonio':     { ZrO2:100.0 },
}

// Pesos moleculares de los óxidos
const PM = {
  Li2O:29.88, Na2O:61.98, K2O:94.20, MgO:40.30, CaO:56.08,
  ZnO:81.38,  BaO:153.33, SrO:103.62,
  Al2O3:101.96, B2O3:69.62, Fe2O3:159.69, Cr2O3:152.00,
  TiO2:79.90,  SiO2:60.09,  ZrO2:123.22,  SnO2:150.71,
  CoO:74.93,   CuO:79.55,   MnO2:86.94,
}

// Clasificación de óxidos en grupos Seger
const GRUPO_RO   = ['Li2O','Na2O','K2O','MgO','CaO','ZnO','BaO','SrO','CoO','CuO','MnO2']
const GRUPO_R2O3 = ['Al2O3','B2O3','Fe2O3','Cr2O3']
const GRUPO_RO2  = ['SiO2','TiO2','ZrO2','SnO2']

// ─────────────────────────────────────────────
// MODAL GENÉRICO
// ─────────────────────────────────────────────

let modalCallback = null

function mostrarModal({ titulo, texto, confirmar, accion, cancelar = true }){
  document.getElementById('contModalTitulo').innerText = titulo
  document.getElementById('contModalTexto').innerText  = texto
  const btnC = document.getElementById('contModalConfirmar')
  const btnX = document.getElementById('contModalCancelar')
  btnC.innerText    = confirmar
  btnX.style.display = cancelar ? 'inline-flex' : 'none'
  modalCallback = accion || null
  btnC.onclick = () => { const cb = modalCallback; cerrarModal(); if(cb) cb() }
  document.getElementById('contModal').style.display = 'flex'
}

function cerrarModal(){
  document.getElementById('contModal').style.display = 'none'
  modalCallback = null
}

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
// ESTADO
// ─────────────────────────────────────────────

let coneActual  = 'cone06'
let contadorMat = 0
let historial   = JSON.parse(localStorage.getItem('seger_historial') || '[]')
let resultadoActual = null

// ─────────────────────────────────────────────
// TEMPERATURA / CONE
// ─────────────────────────────────────────────

function setCone(cone){
  coneActual = cone
  document.getElementById('btnCone06').classList.toggle('activo', cone === 'cone06')
  document.getElementById('btnCone6').classList.toggle('activo',  cone === 'cone6')
  document.getElementById('btnCone10').classList.toggle('activo', cone === 'cone10')
  calcularSeger()
}

// ─────────────────────────────────────────────
// MATERIALES DINÁMICOS
// ─────────────────────────────────────────────

function agregarMaterial(nombre = '', pct = ''){
  const id   = ++contadorMat
  const cont = document.getElementById('segerMateriales')
  const div  = document.createElement('div')
  div.className = 'seger-material'
  div.id = 'mat-' + id

  // Opciones del select
  const opciones = Object.keys(MATERIALES_DB).map(m =>
    `<option value="${m}" ${m === nombre ? 'selected' : ''}>${m}</option>`
  ).join('')

  div.innerHTML = `
    <select class="seger-material-select" onchange="calcularSeger()">
      <option value="">— Seleccionar material —</option>
      ${opciones}
    </select>
    <div class="seger-material-pct">
      <input type="number" min="0" max="100" step="0.1" placeholder="0"
             value="${pct}" oninput="calcularSeger()">
      <span>%</span>
    </div>
    <button class="seger-material-borrar" onclick="borrarMaterial(${id})" title="Eliminar">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `
  cont.appendChild(div)
  calcularSeger()
}

function borrarMaterial(id){
  const el = document.getElementById('mat-' + id)
  if(el) el.remove()
  calcularSeger()
}

function obtenerMateriales(){
  const items = []
  document.querySelectorAll('.seger-material').forEach(div => {
    const nombre = div.querySelector('select').value
    const pct    = parseFloat(div.querySelector('input').value) || 0
    if(nombre && pct > 0) items.push({ nombre, pct })
  })
  return items
}

// ─────────────────────────────────────────────
// CALCULAR FÓRMULA SEGER
// ─────────────────────────────────────────────

function calcularSeger(){
  const materiales = obtenerMateriales()
  const total      = materiales.reduce((s, m) => s + m.pct, 0)

  // Actualizar barra de total
  const barra = document.getElementById('segerBarra')
  barra.style.width = Math.min(total, 100) + '%'
  barra.classList.toggle('excede', total > 100)

  document.getElementById('segerTotal').innerText = total.toFixed(1) + '%'
  const aviso = document.getElementById('segerAviso')
  if(Math.abs(total - 100) < 0.1){
    aviso.innerText = '✓ Perfecto'
    aviso.className = 'total-aviso ok'
  } else if(total < 100){
    aviso.innerText = `Falta ${(100 - total).toFixed(1)}%`
    aviso.className = 'total-aviso'
  } else {
    aviso.innerText = `Excede en ${(total - 100).toFixed(1)}%`
    aviso.className = 'total-aviso'
  }

  if(materiales.length === 0 || total <= 0){
    document.getElementById('segerResultado').style.display = 'none'
    resultadoActual = null
    return
  }

  // ── Calcular composición total de óxidos ──
  const oxidosPct = {}
  materiales.forEach(m => {
    const db = MATERIALES_DB[m.nombre]
    if(!db) return
    Object.entries(db).forEach(([oxido, pctEnMat]) => {
      oxidosPct[oxido] = (oxidosPct[oxido] || 0) + (pctEnMat * m.pct / 100)
    })
  })

  // ── Convertir a moles (pct / PM) ──
  const moles = {}
  Object.entries(oxidosPct).forEach(([oxido, pct]) => {
    if(PM[oxido]) moles[oxido] = pct / PM[oxido]
  })

  // ── Normalizar: la suma de RO + R2O3 = 1 (norma Seger) ──
  const sumaRO   = GRUPO_RO.reduce((s, o)   => s + (moles[o] || 0), 0)
  const sumaR2O3 = GRUPO_R2O3.reduce((s, o) => s + (moles[o] || 0), 0)
  const base     = sumaRO + sumaR2O3
  if(base <= 0){
    document.getElementById('segerResultado').style.display = 'none'
    resultadoActual = null
    return
  }

  const seger = {}
  Object.entries(moles).forEach(([oxido, mol]) => {
    seger[oxido] = mol / base
  })

  // ── Ratios ──
  const si  = seger['SiO2']  || 0
  const al  = seger['Al2O3'] || 0
  const siAl = al > 0 ? si / al : 0

  // ── Renderizar tabla ──
  renderizarGrupo('segerRO',   GRUPO_RO,   seger)
  renderizarGrupo('segerR2O3', GRUPO_R2O3, seger)
  renderizarGrupo('segerRO2',  GRUPO_RO2,  seger)

  document.getElementById('ratioSiAl').innerText = siAl.toFixed(2)
  document.getElementById('ratioSi').innerText   = si.toFixed(3)
  document.getElementById('ratioAl').innerText   = al.toFixed(3)

  // ── Diagnóstico ──
  renderizarDiagnostico(seger, si, al, siAl)

  // ── Guardar resultado ──
  resultadoActual = { seger, si, al, siAl, oxidosPct, materiales }
  document.getElementById('segerResultado').style.display = 'flex'
  verificarSesionTaller()
}

function renderizarGrupo(elId, grupo, seger){
  const el = document.getElementById(elId)
  el.innerHTML = ''
  let hayAlgo = false
  grupo.forEach(oxido => {
    const val = seger[oxido]
    if(!val || val < 0.001) return
    hayAlgo = true
    const fila = document.createElement('div')
    fila.className = 'seger-oxido-fila'
    fila.innerHTML = `
      <span class="seger-oxido-nombre">${formatearOxido(oxido)}</span>
      <span class="seger-oxido-valor">${val.toFixed(3)}</span>
    `
    el.appendChild(fila)
  })
  if(!hayAlgo){
    el.innerHTML = '<div style="font-size:12px;opacity:0.4;padding:4px 0">Ninguno</div>'
  }
}

function formatearOxido(oxido){
  // Convertir números a subíndices para mejor legibilidad
  return oxido.replace(/(\d+)/g, '<sub>$1</sub>')
}

// ─────────────────────────────────────────────
// DIAGNÓSTICO AUTOMÁTICO
// ─────────────────────────────────────────────

function renderizarDiagnostico(seger, si, al, siAl){
  const cont = document.getElementById('segerDiagnostico')
  cont.innerHTML = ''

  const diags = diagnosticar(seger, si, al, siAl)
  diags.forEach(d => {
    const div = document.createElement('div')
    div.className = 'seger-diag-item ' + d.tipo
    const icono = d.tipo === 'ok' ? 'fa-circle-check' : d.tipo === 'aviso' ? 'fa-triangle-exclamation' : 'fa-circle-xmark'
    div.innerHTML = `<i class="fa-solid ${icono}"></i> <span>${d.texto}</span>`
    cont.appendChild(div)
  })
}

function diagnosticar(seger, si, al, siAl){
  const diags = []
  const cone  = coneActual

  // Rangos de referencia por temperatura
  const rangos = {
    cone06: { siMin:1.5, siMax:2.5, alMin:0.2, alMax:0.4, siAlMin:5,  siAlMax:8  },
    cone6:  { siMin:2.5, siMax:4.0, alMin:0.3, alMax:0.5, siAlMin:6,  siAlMax:10 },
    cone10: { siMin:3.0, siMax:5.5, alMin:0.4, alMax:0.6, siAlMin:7,  siAlMax:12 },
  }
  const r = rangos[cone]

  // ── Sílice ──
  if(si < r.siMin){
    diags.push({ tipo:'error', texto:`SiO₂ muy bajo (${si.toFixed(2)}) — el esmalte puede ser demasiado fluido o sin brillo para ${cone.replace('cone','Cone ')}.` })
  } else if(si > r.siMax){
    diags.push({ tipo:'aviso', texto:`SiO₂ alto (${si.toFixed(2)}) — posible subcocción o esmalte mate. Rango ideal: ${r.siMin}–${r.siMax}.` })
  } else {
    diags.push({ tipo:'ok', texto:`SiO₂ en rango ideal (${si.toFixed(2)}) para ${cone.replace('cone','Cone ')}.` })
  }

  // ── Alúmina ──
  if(al < r.alMin){
    diags.push({ tipo:'aviso', texto:`Al₂O₃ bajo (${al.toFixed(3)}) — el esmalte puede ser inestable o muy fluido.` })
  } else if(al > r.alMax){
    diags.push({ tipo:'aviso', texto:`Al₂O₃ alto (${al.toFixed(3)}) — tendencia a esmalte mate o con cáscara de naranja.` })
  } else {
    diags.push({ tipo:'ok', texto:`Al₂O₃ en rango adecuado (${al.toFixed(3)}).` })
  }

  // ── Ratio Si:Al ──
  if(siAl < r.siAlMin){
    diags.push({ tipo:'aviso', texto:`Ratio Si:Al bajo (${siAl.toFixed(1)}) — posible esmalte mate o sin brillo.` })
  } else if(siAl > r.siAlMax){
    diags.push({ tipo:'aviso', texto:`Ratio Si:Al alto (${siAl.toFixed(1)}) — puede craquelar o tener tensión en la superficie.` })
  } else {
    diags.push({ tipo:'ok', texto:`Ratio Si:Al adecuado (${siAl.toFixed(1)}).` })
  }

  // ── Boro ──
  const b2o3 = seger['B2O3'] || 0
  if(b2o3 > 0){
    if(b2o3 > 0.6){
      diags.push({ tipo:'aviso', texto:`B₂O₃ elevado (${b2o3.toFixed(3)}) — puede ablandar mucho el esmalte y aumentar expansión.` })
    } else {
      diags.push({ tipo:'ok', texto:`B₂O₃ presente (${b2o3.toFixed(3)}) — mejora la fluidez y reduce temperatura de fusión.` })
    }
  }

  // ── Calcio ──
  const cao = seger['CaO'] || 0
  if(cao > 0.8){
    diags.push({ tipo:'aviso', texto:`CaO alto (${cao.toFixed(3)}) — posible cristalización o efecto mate en bajas temperaturas.` })
  }

  // ── Potasio/Sodio (craqueladuras) ──
  const k2o  = seger['K2O']  || 0
  const na2o = seger['Na2O'] || 0
  const alkTotal = k2o + na2o
  if(alkTotal > 0.4){
    diags.push({ tipo:'aviso', texto:`Álcalis altos (K₂O+Na₂O: ${alkTotal.toFixed(3)}) — mayor coeficiente de expansión, riesgo de craquelado.` })
  }

  // ── Zinc ──
  const zno = seger['ZnO'] || 0
  if(zno > 0.3){
    diags.push({ tipo:'aviso', texto:`ZnO elevado (${zno.toFixed(3)}) — puede producir efectos cristalinos o aumento de viscosidad.` })
  }

  return diags
}

// ─────────────────────────────────────────────
// GUARDAR EN HISTORIAL
// ─────────────────────────────────────────────

function guardarSeger(){
  const nombre = document.getElementById('segerNombre').value.trim()
  if(!nombre){
    mostrarModal({ titulo:'Sin nombre', texto:'Poné un nombre a la receta antes de guardar.', confirmar:'Entendido', cancelar:false })
    return
  }
  if(!resultadoActual){
    mostrarModal({ titulo:'Sin resultado', texto:'Completá la receta para calcular primero.', confirmar:'Entendido', cancelar:false })
    return
  }

  const { seger, si, al, siAl, materiales } = resultadoActual
  const entrada = {
    id:        Date.now(),
    nombre,
    cone:      coneActual,
    materiales,
    si:        si.toFixed(3),
    al:        al.toFixed(3),
    siAl:      siAl.toFixed(2),
    seger:     Object.fromEntries(
      Object.entries(seger).filter(([,v]) => v >= 0.001).map(([k,v]) => [k, parseFloat(v.toFixed(3))])
    ),
    fecha: new Date().toLocaleDateString('es-AR')
  }

  historial.unshift(entrada)
  localStorage.setItem('seger_historial', JSON.stringify(historial))
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
  const lista  = document.getElementById('segerHistorialLista')
  const btnPDF = document.getElementById('btnPDF')
  const btnLim = document.getElementById('btnLimpiar')

  lista.innerHTML = ''

  if(historial.length === 0){
    lista.innerHTML = '<p class="historial-vacio">Guardá una receta para verla aquí.</p>'
    btnPDF.disabled      = true
    btnLim.style.display = 'none'
    return
  }

  btnPDF.disabled      = false
  btnLim.style.display = 'inline-flex'

  historial.forEach(f => {
    const item = document.createElement('div')
    item.className = 'historial-item'
    const coneLabel = f.cone === 'cone06' ? 'Cone 06' : f.cone === 'cone6' ? 'Cone 6' : 'Cone 10'
    item.innerHTML = `
      <button class="historial-item-borrar" onclick="borrarEntrada(${f.id})">✕</button>
      <div class="historial-item-nombre">${f.nombre}</div>
      <div class="historial-item-meta">${coneLabel} · ${f.fecha}</div>
      <div class="historial-item-componentes">
        <span class="historial-chip">Si: ${f.si}</span>
        <span class="historial-chip">Al: ${f.al}</span>
        <span class="historial-chip">Si:Al ${f.siAl}</span>
      </div>
    `
    lista.appendChild(item)
  })
}

function borrarEntrada(id){
  historial = historial.filter(f => f.id !== id)
  localStorage.setItem('seger_historial', JSON.stringify(historial))
  renderizarHistorial()
}

function limpiarHistorial(){
  mostrarModal({
    titulo:'Limpiar historial',
    texto:'Borrar todo el historial? No se puede deshacer.',
    confirmar:'Borrar todo',
    accion:() => {
      historial = []
      localStorage.setItem('seger_historial', JSON.stringify(historial))
      renderizarHistorial()
    }
  })
}

// ─────────────────────────────────────────────
// COPIAR
// ─────────────────────────────────────────────

function copiarSeger(){
  if(!resultadoActual) return
  const nombre = document.getElementById('segerNombre').value.trim() || 'Sin nombre'
  const { seger, si, al, siAl, materiales } = resultadoActual
  const coneLabel = coneActual === 'cone06' ? 'Cone 06' : coneActual === 'cone6' ? 'Cone 6' : 'Cone 10'

  let texto = `YCA Ceramica - Formula Seger\n`
  texto += `Receta: ${nombre} (${coneLabel})\n`
  texto += `─────────────────────\n`
  texto += `MATERIALES:\n`
  materiales.forEach(m => { texto += `  ${m.nombre}: ${m.pct}%\n` })
  texto += `─────────────────────\n`
  texto += `FORMULA SEGER:\n`
  Object.entries(seger).filter(([,v]) => v >= 0.001).forEach(([k,v]) => {
    texto += `  ${k}: ${v.toFixed(3)}\n`
  })
  texto += `─────────────────────\n`
  texto += `Si: ${si.toFixed(3)}  Al: ${al.toFixed(3)}  Si:Al: ${siAl.toFixed(2)}\n`

  navigator.clipboard.writeText(texto).then(() => {
    const btn = document.querySelector('.btn-copiar')
    if(btn){
      btn.innerText = 'Copiado'
      setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar' }, 2000)
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
      canvas.width = img.width; canvas.height = img.height
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
  const doc        = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
  const W = 210, m = 18
  const MARRON=[139,111,86], NEGRO=[40,35,30], BLANCO=[255,255,255], GRIS=[245,240,235]

  doc.setFillColor(...MARRON); doc.rect(0,0,W,40,'F')
  const logo = await cargarLogoBase64()
  if(logo) doc.addImage(logo,'PNG',m,8,22,22)
  doc.setTextColor(...BLANCO); doc.setFontSize(20); doc.setFont('helvetica','bold')
  doc.text('YCA Ceramica', m+26, 17)
  doc.setFontSize(10); doc.setFont('helvetica','normal')
  doc.text('Formula Seger', m+26, 24)
  doc.setFontSize(8)
  doc.text('instagram: @ycaceramica   |   tiktok: @yca.ceramica', m+26, 31)
  const fecha = new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'})
  doc.text(`Generado: ${fecha}`, W-m, 36, {align:'right'})

  let y = 50

  historial.forEach((f, idx) => {
    const coneLabel = f.cone === 'cone06' ? 'Cone 06' : f.cone === 'cone6' ? 'Cone 6' : 'Cone 10'
    const oxidos    = Object.entries(f.seger || {}).filter(([,v]) => v >= 0.001)
    const h         = 30 + oxidos.length * 7

    if(y + h > 272){ doc.addPage(); y = 20 }

    doc.setFillColor(...GRIS); doc.roundedRect(m, y, W-m*2, h, 4, 4, 'F')

    // Encabezado
    doc.setTextColor(...MARRON); doc.setFontSize(12); doc.setFont('helvetica','bold')
    doc.text(`#${idx+1} ${f.nombre}`, m+5, y+9)
    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(120,110,100)
    doc.text(`${coneLabel}  |  ${f.fecha}`, m+5, y+16)

    // Ratios
    doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(...MARRON)
    doc.text(`Si:${f.si}  Al:${f.al}  Si/Al:${f.siAl}`, W-m-5, y+9, {align:'right'})

    // Tabla óxidos
    let oy = y + 22
    const colW = (W-m*2-10)/2

    oxidos.forEach(([ oxido, val ], ci) => {
      const col = ci % 2
      const row = Math.floor(ci / 2)
      const ox  = m + 5 + col*(colW+5)
      const oy2 = oy + row*7

      doc.setTextColor(...NEGRO); doc.setFontSize(8); doc.setFont('helvetica','normal')
      doc.text(oxido, ox, oy2)
      doc.setTextColor(...MARRON); doc.setFont('helvetica','bold')
      doc.text(String(val), ox + colW - 5, oy2, {align:'right'})
    })

    y += h + 6
  })

  // Pie
  doc.setFillColor(...GRIS); doc.rect(0,287,W,10,'F')
  doc.setTextColor(160,150,140); doc.setFontSize(7); doc.setFont('helvetica','normal')
  doc.text('ycaceramica.github.io  |  YCA Ceramica 2026', W/2, 293, {align:'center'})

  doc.save('YCA_Ceramica_Seger.pdf')
}

// ─────────────────────────────────────────────
// GUARDAR EN MI TALLER / MI CUENTA
// ─────────────────────────────────────────────

function getSesion(){
  try { return JSON.parse(sessionStorage.getItem('yca_sesion')) } catch(e){ return null }
}

function verificarSesionTaller(){
  const sesion = getSesion()
  const btn    = document.getElementById('btnTallerSeger')
  if(btn) btn.style.display = sesion && sesion.token ? 'flex' : 'none'
}

async function guardarEnTallerSeger(){
  const sesion = getSesion()
  if(!sesion || !sesion.token){
    mostrarModal({ titulo:'Iniciá sesion', texto:'Iniciá sesion para guardar tus calculos en tu cuenta.', confirmar:'Entendido', cancelar:false })
    return
  }
  if(historial.length === 0){
    mostrarModal({ titulo:'Sin datos', texto:'Guarda una receta en el historial primero.', confirmar:'Entendido', cancelar:false })
    return
  }

  const item        = historial[0]
  const esCeramista = sesion.rol === 'ceramista'
  const action      = esCeramista ? 'guardarHistorialTaller' : 'guardarHistorialAlumno'
  const idKey       = esCeramista ? 'ceramistaId' : 'alumnoId'
  const destino     = esCeramista ? 'mi taller' : 'mi cuenta'

  try {
    const res  = await fetch(API, {
      method:'POST',
      body: JSON.stringify({ action, [idKey]: sesion.id, item:{ calculadora:'seger', nombre:item.nombre, datos:item } })
    })
    const data = await res.json()
    if(data.ok){
      mostrarModal({ titulo:'Guardado en ' + destino, texto:'La receta fue sincronizada con tu cuenta.', confirmar:'Genial', cancelar:false })
    } else {
      mostrarModal({ titulo:'Error', texto:'No se pudo guardar. Intenta de nuevo.', confirmar:'Entendido', cancelar:false })
    }
  } catch(e){
    mostrarModal({ titulo:'Sin conexion', texto:'Revisa tu conexion e intenta de nuevo.', confirmar:'Entendido', cancelar:false })
  }
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

// Iniciar con 3 materiales de ejemplo
agregarMaterial('Feldespato potásico', 40)
agregarMaterial('Whiting (CaCO3)', 20)
agregarMaterial('Caolín (EPK)', 20)
agregarMaterial('Sílice (cuarzo)', 20)

renderizarHistorial()
verificarSesionTaller()
