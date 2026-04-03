// ─────────────────────────────────────────────
// PROTECCIÓN — solo plan Pro
// ─────────────────────────────────────────────
;(function protegerPro(){
  try {
    var sesion = JSON.parse(sessionStorage.getItem('yca_sesion'))
    if(!sesion || sesion.plan !== 'pro'){
      window.location.href = '../pro/index.html?calc=seger'
    }
  } catch(e) {
    window.location.href = '../pro/index.html?calc=seger'
  }
})()

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

const API = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'

// ─────────────────────────────────────────────
// BASE DE DATOS DE MATERIAS PRIMAS
// Composición química en % de óxidos por material
// Peso molecular incluido para conversión a moles
// ─────────────────────────────────────────────

const MATERIALES_DESC = {
  'Feldespato potásico (K2O·Al2O3·6SiO2)':    'Fundente principal en alta temperatura. Aporta K₂O, sílice y alúmina. Base de la mayoría de esmaltes.',
  'Feldespato sódico (Na2O·Al2O3·6SiO2)':     'Similar al potásico pero con Na₂O. Mayor expansión térmica, más riesgo de craquelado.',
  'Feldespato de litio (Li2O·Al2O3·4SiO2)':   'Fundente poderoso de baja temperatura. El Li₂O es el fundente alcalino más activo.',
  'Cornish Stone (K2O, Al2O3, SiO2)':          'Feldespato inglés impuro. Combina fundentes y silicatos. Clásico en esmaltes de alta temperatura.',
  'Custer Feldspar (feldespato potásico)':      'Feldespato potásico americano. Buena fuente de K₂O con moderada alúmina.',
  'G-200 Feldspar (feldespato potásico)':       'Feldespato potásico de alta pureza. Estándar en formulación de esmaltes.',
  'Caolín (Al2O3·2SiO2·2H2O)':                'Arcilla de alta pureza. Aporta alúmina y sílice. Espesa el esmalte crudo y evita el asentamiento.',
  'Caolín calcinado (Al2O3·2SiO2)':            'Caolín calcinado sin agua. Menos contracción, mismo aporte de Al₂O₃ y SiO₂.',
  'Arcilla plástica (SiO2, Al2O3)':            'Arcilla plástica (ball clay). Más impura que el caolín, aporta TiO₂ que puede dar tonos crema.',
  'Bentonita (arcilla muy plástica)':           'Arcilla coloidal. Se usa en pequeñas cantidades (1-2%) para suspender el esmalte.',
  'Arcilla roja (Fe2O3, SiO2, Al2O3)':         'Arcilla con óxido de hierro. Colorante y fundente secundario. Da tonos marrones y ámbar.',
  'Sílice / cuarzo (SiO2)':                    'Formador de vidrio puro. Aumenta dureza, punto de fusión y resistencia al craquelado.',
  'Pedernal / flint (SiO2)':                   'Sílice de origen orgánico. Más reactivo que el cuarzo, usado en esmaltes de baja temperatura.',
  'Nefelina sienita (Na2O·K2O·Al2O3·SiO2)':   'Feldespato sin cuarzo libre. Fundente a temperaturas medias, aporta Na₂O y K₂O.',
  'Carbonato de calcio / Whiting (CaCO3)':     'Fundente secundario esencial. Mejora dureza y resistencia química del esmalte.',
  'Wollastonita (CaSiO3)':                     'Silicato de calcio. Aporta CaO y SiO₂ simultáneamente. Reduce contracción del esmalte crudo.',
  'Dolomita (CaCO3·MgCO3)':                    'Carbonato doble de calcio y magnesio. Fundente suave, da superficies satinadas y sedosas.',
  'Talco (Mg3Si4O10(OH)2)':                    'Silicato de magnesio. Fundente en baja temperatura, da esmaltes suaves y mates.',
  'Calcita (CaCO3)':                           'Carbonato de calcio puro. Similar al Whiting. Fundente clásico de alta temperatura.',
  'Óxido de zinc (ZnO)':                       'Fundente activo que puede producir efectos cristalinos. Blanquea y opacifica en ciertas proporciones.',
  'Carbonato de bario (BaCO3)':                'Fundente pesado. Da superficies muy satinadas. Tóxico — manipular con precaución.',
  'Frita 3134 (B2O3, CaO, Na2O)':              'Frita con boro y calcio. Fundente de baja temperatura. Base de muchos esmaltes Cone 06.',
  'Frita 3195 (B2O3, SiO2, CaO)':              'Frita borocalcica. Muy usada en Cone 6. Aporta boro sin los riesgos del material crudo.',
  'Frita 3110 (Na2O, SiO2)':                   'Frita sódica con boro. Baja temperatura, colores brillantes con colorantes.',
  'Colemanita (Ca2B6O11)':                     'Borosilicato natural. Aporta B₂O₃ y CaO. Activo como fundente desde Cone 06.',
  'Ulexita (NaCaB5O9)':                        'Borosilicato con sodio. Similar a colemanita pero más soluble. Usar en fritas preferentemente.',
  'Óxido de cobalto (CoO)':                    'Colorante azul muy potente. 0.5-1% da azul intenso. Puede dar violeta con ciertos fundentes.',
  'Óxido de cobre (CuO)':                      'Colorante verde en oxidación, rojo en reducción. 1-3% según intensidad deseada.',
  'Óxido de hierro (Fe2O3)':                   'Colorante más versátil. Ocre/marrón en oxidación, celadón/tenmoku en reducción.',
  'Óxido de manganeso (MnO2)':                 'Colorante marrón-violeta. Con cobalto para negros o solo para marrones cálidos.',
  'Óxido de cromo (Cr2O3)':                    'Colorante verde opaco. Con zinc da marrón, con estaño da rosado.',
  'Óxido de titanio (TiO2)':                   'Opacificante suave. Da efectos moteados o superficies satinadas.',
  'Óxido de estaño (SnO2)':                    'Opacificante clásico. 8-10% da blanco opaco brillante. Muy estable.',
  'Rutilo (TiO2 + Fe2O3)':                     'TiO₂ impuro con hierro. Da texturas, veteados y efectos de cristalización.',
  'Óxido de circonio / zirconio (ZrO2)':       'Opacificante moderno. Más económico que el estaño, da blancos muy limpios.',
}

const MATERIALES_DB = {
  'Feldespato potásico (K2O·Al2O3·6SiO2)':    { K2O:16.9, Al2O3:18.3, SiO2:64.8 },
  'Feldespato sódico (Na2O·Al2O3·6SiO2)':     { Na2O:11.8, Al2O3:19.5, SiO2:68.7 },
  'Feldespato de litio (Li2O·Al2O3·4SiO2)':   { Li2O:4.9, Al2O3:23.4, SiO2:64.8 },
  'Cornish Stone (K2O, Al2O3, SiO2)':          { K2O:4.5, Na2O:3.6, CaO:1.8, Al2O3:16.2, SiO2:72.5 },
  'Custer Feldspar (feldespato potásico)':      { K2O:9.5, Na2O:3.0, Al2O3:17.1, SiO2:68.5 },
  'G-200 Feldspar (feldespato potásico)':       { K2O:11.3, Na2O:3.5, Al2O3:18.0, SiO2:66.2 },
  'Caolín (Al2O3·2SiO2·2H2O)':                { Al2O3:37.3, SiO2:45.7, TiO2:0.3 },
  'Caolín calcinado (Al2O3·2SiO2)':            { Al2O3:38.5, SiO2:45.5 },
  'Arcilla plástica (SiO2, Al2O3)':            { Al2O3:30.5, SiO2:52.8, TiO2:1.5 },
  'Bentonita (arcilla muy plástica)':           { MgO:3.2, Na2O:2.5, Al2O3:21.0, SiO2:61.4 },
  'Arcilla roja (Fe2O3, SiO2, Al2O3)':         { Fe2O3:6.5, Al2O3:18.5, SiO2:65.0, TiO2:1.0 },
  'Sílice / cuarzo (SiO2)':                    { SiO2:100.0 },
  'Pedernal / flint (SiO2)':                   { SiO2:98.0 },
  'Nefelina sienita (Na2O·K2O·Al2O3·SiO2)':   { K2O:4.7, Na2O:9.8, Al2O3:23.3, SiO2:60.4 },
  'Carbonato de calcio / Whiting (CaCO3)':     { CaO:56.1 },
  'Wollastonita (CaSiO3)':                     { CaO:48.3, SiO2:51.7 },
  'Dolomita (CaCO3·MgCO3)':                    { CaO:30.4, MgO:21.9 },
  'Talco (Mg3Si4O10(OH)2)':                    { MgO:31.7, SiO2:63.5 },
  'Calcita (CaCO3)':                           { CaO:56.0 },
  'Óxido de zinc (ZnO)':                       { ZnO:100.0 },
  'Carbonato de bario (BaCO3)':                { BaO:77.7 },
  'Frita 3134 (B2O3, CaO, Na2O)':              { CaO:20.0, B2O3:23.0, Na2O:10.0, SiO2:47.0 },
  'Frita 3195 (B2O3, SiO2, CaO)':              { CaO:14.7, B2O3:23.8, Na2O:5.0, ZnO:2.3, SiO2:52.9 },
  'Frita 3110 (Na2O, SiO2)':                   { Na2O:10.5, B2O3:2.0, SiO2:74.0, CaO:0.3, Al2O3:2.4 },
  'Colemanita (Ca2B6O11)':                     { CaO:27.3, B2O3:50.9 },
  'Ulexita (NaCaB5O9)':                        { CaO:13.7, Na2O:6.4, B2O3:43.0 },
  'Óxido de cobalto (CoO)':                    { CoO:100.0 },
  'Óxido de cobre (CuO)':                      { CuO:100.0 },
  'Óxido de hierro (Fe2O3)':                   { Fe2O3:100.0 },
  'Óxido de manganeso (MnO2)':                 { MnO2:100.0 },
  'Óxido de cromo (Cr2O3)':                    { Cr2O3:100.0 },
  'Óxido de titanio (TiO2)':                   { TiO2:100.0 },
  'Óxido de estaño (SnO2)':                    { SnO2:100.0 },
  'Rutilo (TiO2 + Fe2O3)':                     { TiO2:94.0, Fe2O3:4.0 },
  'Óxido de circonio / zirconio (ZrO2)':       { ZrO2:100.0 },
}
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

  const descId = 'mat-desc-' + id
  div.innerHTML = `
    <select class="seger-material-select" onchange="mostrarDescMaterial(this, '${descId}'); calcularSeger()">
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
  // Agregar descripción debajo
  const desc = document.createElement('div')
  desc.className = 'seger-mat-desc'
  desc.id = descId
  desc.style.display = nombre ? 'block' : 'none'
  desc.innerText = nombre ? (MATERIALES_DESC[nombre] || '') : ''
  div.appendChild(desc)
  cont.appendChild(div)
  calcularSeger()
}

function mostrarDescMaterial(select, descId){
  const desc = document.getElementById(descId)
  if(!desc) return
  const texto = MATERIALES_DESC[select.value] || ''
  desc.innerText      = texto
  desc.style.display  = texto ? 'block' : 'none'
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

  // ── Gráfico de balance ──
  renderizarBalance(seger)

  // ── Guardar resultado ──
  resultadoActual = { seger, si, al, siAl, oxidosPct, materiales }
  document.getElementById('segerResultado').style.display = 'flex'
  verificarSesionTaller()
}

// ─────────────────────────────────────────────
// GRÁFICO DE BALANCE
// ─────────────────────────────────────────────

function renderizarBalance(seger){
  const sumaRO   = GRUPO_RO.reduce((s, o)   => s + (seger[o] || 0), 0)
  const sumaR2O3 = GRUPO_R2O3.reduce((s, o) => s + (seger[o] || 0), 0)
  const sumaRO2  = GRUPO_RO2.reduce((s, o)  => s + (seger[o] || 0), 0)
  const total    = sumaRO + sumaR2O3 + sumaRO2 || 1

  const barras = [
    { label:'Fundentes',      val:sumaRO,   clase:'ro',   pct:(sumaRO/total*100)   },
    { label:'Estabilizantes', val:sumaR2O3, clase:'r2o3', pct:(sumaR2O3/total*100) },
    { label:'Formadores',     val:sumaRO2,  clase:'ro2',  pct:(sumaRO2/total*100)  },
  ]

  const cont = document.getElementById('segerBarras')
  cont.innerHTML = ''
  barras.forEach(b => {
    const fila = document.createElement('div')
    fila.className = 'seger-barra-fila'
    fila.innerHTML = `
      <span class="seger-barra-label">${b.label}</span>
      <div class="seger-barra-track">
        <div class="seger-barra-fill ${b.clase}" style="width:${b.pct.toFixed(1)}%"></div>
      </div>
      <span class="seger-barra-valor">${b.val.toFixed(2)}</span>
    `
    cont.appendChild(fila)
  })
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
    const div   = document.createElement('div')
    div.className = 'seger-diag-item ' + d.tipo
    const icono = d.tipo === 'ok' ? 'fa-circle-check' : d.tipo === 'aviso' ? 'fa-triangle-exclamation' : 'fa-circle-xmark'
    div.innerHTML = `
      <div class="seger-diag-header"><i class="fa-solid ${icono}"></i> ${d.titulo}</div>
      <div class="seger-diag-detalle">${d.detalle}</div>
    `
    cont.appendChild(div)
  })
}

function diagnosticar(seger, si, al, siAl){
  const diags = []
  const cone  = coneActual
  const coneLabel = cone === 'cone06' ? 'Cone 06' : cone === 'cone6' ? 'Cone 6' : 'Cone 10'

  const rangos = {
    cone06: { siMin:1.5, siMax:2.5, alMin:0.2, alMax:0.4, siAlMin:5,  siAlMax:8  },
    cone6:  { siMin:2.5, siMax:4.0, alMin:0.3, alMax:0.5, siAlMin:6,  siAlMax:10 },
    cone10: { siMin:3.0, siMax:5.5, alMin:0.4, alMax:0.6, siAlMin:7,  siAlMax:12 },
  }
  const r = rangos[cone]

  // ── Sílice ──
  if(si < r.siMin){
    diags.push({ tipo:'error',
      titulo: 'Sílice muy bajo — esmalte inestable',
      detalle: `Con SiO₂ = ${si.toFixed(2)} el esmalte puede fluir demasiado, perderse del borde o quedar sin brillo. Para ${coneLabel} lo ideal es entre ${r.siMin} y ${r.siMax}. Agregá más cuarzo, sílice o feldespato.`
    })
  } else if(si > r.siMax){
    diags.push({ tipo:'aviso',
      titulo: 'Sílice alto — posible subcocción',
      detalle: `SiO₂ = ${si.toFixed(2)} es alto para ${coneLabel}. El esmalte puede no fundir completamente o quedar mate y áspero. Considerá reducir cuarzo o aumentar fundentes.`
    })
  } else {
    diags.push({ tipo:'ok',
      titulo: 'Sílice en rango ideal',
      detalle: `SiO₂ = ${si.toFixed(2)}. El esmalte debería tener buena resistencia y durabilidad para ${coneLabel}.`
    })
  }

  // ── Alúmina ──
  if(al < r.alMin){
    diags.push({ tipo:'aviso',
      titulo: 'Alúmina baja — esmalte puede ser fluido',
      detalle: `Al₂O₃ = ${al.toFixed(3)} es bajo. La alúmina da cuerpo y estabilidad al esmalte fundido. Agregá caolín o feldespato.`
    })
  } else if(al > r.alMax){
    diags.push({ tipo:'aviso',
      titulo: 'Alúmina alta — tendencia a mate',
      detalle: `Al₂O₃ = ${al.toFixed(3)} es alto. El esmalte puede quedar mate, rugoso o con textura de cáscara de naranja. Reducí caolín o arcilla.`
    })
  } else {
    diags.push({ tipo:'ok',
      titulo: 'Alúmina en rango adecuado',
      detalle: `Al₂O₃ = ${al.toFixed(3)}. Buena estabilidad y viscosidad del esmalte fundido.`
    })
  }

  // ── Ratio Si:Al ──
  if(siAl < r.siAlMin){
    diags.push({ tipo:'aviso',
      titulo: 'Ratio Si:Al bajo — posible esmalte mate',
      detalle: `Si:Al = ${siAl.toFixed(1)}. Un ratio bajo puede dar superficies sin brillo o con aspecto yesoso. El ideal para ${coneLabel} es entre ${r.siAlMin} y ${r.siAlMax}.`
    })
  } else if(siAl > r.siAlMax){
    diags.push({ tipo:'aviso',
      titulo: 'Ratio Si:Al alto — riesgo de craquelado',
      detalle: `Si:Al = ${siAl.toFixed(1)}. Demasiada sílice respecto a la alúmina puede causar tensiones en la superficie y craqueladuras al enfriar.`
    })
  } else {
    diags.push({ tipo:'ok',
      titulo: 'Ratio Si:Al equilibrado',
      detalle: `Si:Al = ${siAl.toFixed(1)}. El esmalte debería tener buena superficie y adherencia a la pieza.`
    })
  }

  // ── Boro ──
  const b2o3 = seger['B2O3'] || 0
  if(b2o3 > 0.6){
    diags.push({ tipo:'aviso',
      titulo: 'Boro elevado — esmalte muy activo',
      detalle: `B₂O₃ = ${b2o3.toFixed(3)}. Mucho boro puede hacer que el esmalte fluya demasiado y aumente el coeficiente de expansión. Considerá usar menos frita borocalcica.`
    })
  } else if(b2o3 > 0.05){
    diags.push({ tipo:'ok',
      titulo: 'Boro presente — mejor fusión',
      detalle: `B₂O₃ = ${b2o3.toFixed(3)}. El boro mejora la fluidez, el brillo y reduce la temperatura de fusión. Muy útil en esmaltes de temperatura media.`
    })
  }

  // ── Álcalis ──
  const k2o  = seger['K2O']  || 0
  const na2o = seger['Na2O'] || 0
  const alkTotal = k2o + na2o
  if(alkTotal > 0.4){
    diags.push({ tipo:'aviso',
      titulo: 'Álcalis altos — mayor riesgo de craquelado',
      detalle: `K₂O + Na₂O = ${alkTotal.toFixed(3)}. Los álcalis aumentan el coeficiente de expansión térmica del esmalte. Si hay craquelado, reducí feldespato alcalino y reemplazá por whiting o dolomita.`
    })
  }

  // ── Calcio ──
  const cao = seger['CaO'] || 0
  if(cao > 0.8){
    diags.push({ tipo:'aviso',
      titulo: 'Calcio alto — posible efecto mate',
      detalle: `CaO = ${cao.toFixed(3)}. Mucho calcio puede generar superficies satinadas o cristalizaciones no deseadas, especialmente en bajas temperaturas.`
    })
  }

  // ── Zinc ──
  const zno = seger['ZnO'] || 0
  if(zno > 0.3){
    diags.push({ tipo:'aviso',
      titulo: 'Zinc elevado — posibles efectos visuales',
      detalle: `ZnO = ${zno.toFixed(3)}. El zinc en cantidades altas puede producir cristalizaciones, opacidad o aumentar la viscosidad del esmalte fundido.`
    })
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

  const { seger, si, al, siAl, oxidosPct, materiales } = resultadoActual
  const diagnosticos = diagnosticar(seger, si, al, siAl).map(d => ({ tipo: d.tipo, titulo: d.titulo, detalle: d.detalle }))
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
    oxidosPct: Object.fromEntries(
      Object.entries(oxidosPct).filter(([,v]) => v >= 0.01).map(([k,v]) => [k, parseFloat(v.toFixed(2))])
    ),
    diagnosticos,
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
      ${f.diagnosticos && f.diagnosticos.length ? `
      <div class="historial-item-diags">
        ${f.diagnosticos.map(d => `
          <div class="historial-diag historial-diag-${d.tipo}">
            <span class="historial-diag-titulo">${d.titulo}</span>
            <span class="historial-diag-detalle">${d.detalle}</span>
          </div>`).join('')}
      </div>` : ''}
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

  const VERDE    = [60, 140, 90]
  const AMARILLO = [180, 130, 20]
  const ROJO     = [190, 60, 30]

  // jsPDF no renderiza bien subíndices Unicode — reemplazar por texto plano
  const pdfTxt = s => (s || '')
    .replace(/SiO₂/g, 'SiO2')
    .replace(/Al₂O₃/g, 'Al2O3')
    .replace(/Fe₂O₃/g, 'Fe2O3')
    .replace(/TiO₂/g, 'TiO2')
    .replace(/MnO₂/g, 'MnO2')
    .replace(/B₂O₃/g, 'B2O3')
    .replace(/K₂O/g, 'K2O')
    .replace(/Na₂O/g, 'Na2O')
    .replace(/[₀-₉]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x2080 + 48))
    .replace(/[²³¹]/g, n => ({'\u00b2':'2','\u00b3':'3','\u00b9':'1'}[n]||n))

  historial.forEach((f, idx) => {
    const coneLabel = f.cone === 'cone06' ? 'Cone 06' : f.cone === 'cone6' ? 'Cone 6' : 'Cone 10'
    const oxidos    = Object.entries(f.seger || {}).filter(([,v]) => v >= 0.001)
    const diags     = f.diagnosticos || []

    // Calcular altura total del bloque
    const oxRows  = Math.ceil(oxidos.length / 2)
    const diagH   = diags.reduce((acc, d) => {
      const lines = doc.splitTextToSize(d.detalle || '', W - m*2 - 20)
      return acc + 6 + lines.length * 4.5
    }, diags.length > 0 ? 8 : 0)
    const h = 24 + oxRows * 7 + diagH + (diags.length > 0 ? 4 : 0)

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

    // Diagnósticos
    if(diags.length > 0){
      let dy = oy + oxRows * 7 + 6

      // Línea separadora
      doc.setDrawColor(210, 200, 190)
      doc.setLineWidth(0.3)
      doc.line(m+5, dy - 2, W-m-5, dy - 2)

      diags.forEach(d => {
        const color = d.tipo === 'ok' ? VERDE : d.tipo === 'error' ? ROJO : AMARILLO
        const icono = d.tipo === 'ok' ? '✓' : d.tipo === 'error' ? '✕' : '!'

        // Ícono
        doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(...color)
        doc.text(icono, m+5, dy + 4)

        // Título
        doc.setFontSize(8.5); doc.setFont('helvetica','bold'); doc.setTextColor(...NEGRO)
        doc.text(pdfTxt(d.titulo), m+11, dy + 4)

        // Detalle — multilínea
        const lines = doc.splitTextToSize(pdfTxt(d.detalle), W - m*2 - 20)
        doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(100, 90, 80)
        doc.text(lines, m+11, dy + 9)

        dy += 6 + lines.length * 4.5
      })
    }

    y += h + 8
  })

  // Pie
  doc.setFillColor(...GRIS); doc.rect(0,287,W,10,'F')
  doc.setTextColor(160,150,140); doc.setFontSize(7); doc.setFont('helvetica','normal')
  doc.text('ycaceramica.com.ar  |  YCA Ceramica 2026', W/2, 293, {align:'center'})

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
      method:'POST',
      body: JSON.stringify({ action, [idKey]: sesion.id, item:{
        calculadora: 'seger',
        nombre:      item.nombre,
        datos: {
          cone:        item.cone,
          materiales:  item.materiales,
          si:          item.si,
          al:          item.al,
          siAl:        item.siAl,
          seger:       item.seger,
          oxidosPct:   item.oxidosPct   || {},
          diagnosticos: item.diagnosticos || [],
          fecha:       item.fecha
        }
      } })
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
agregarMaterial('Feldespato potásico (K2O·Al2O3·6SiO2)', 40)
agregarMaterial('Carbonato de calcio / Whiting (CaCO3)', 20)
agregarMaterial('Caolín (Al2O3·2SiO2·2H2O)', 20)
agregarMaterial('Sílice / cuarzo (SiO2)', 20)

renderizarHistorial()
verificarSesionTaller()
