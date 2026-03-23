// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

const API = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'

// ─────────────────────────────────────────────
// BASE DE DATOS DE MATERIALES
// Propiedades: plasticidad(0-10), contraccion(%), tempMin(°C), tempMax(°C),
// porosidad(%), color, descripcion, caracteristicas[]
// ─────────────────────────────────────────────

const MATERIALES_DB = {
  // ── ARCILLAS PLÁSTICAS ──
  'Arcilla de bola / Ball clay':     { plasticidad:9, contraccion:12, tempMin:1100, tempMax:1300, porosidad:5,  color:'crema',   desc:'Arcilla muy plástica. Excelente para torno. Alta contracción — usar con moderación (15-25%).',        caract:['Muy plástica','Alta contracción','Apta torno','Color crema'] },
  'Arcilla roja (terracota)':        { plasticidad:7, contraccion:10, tempMin:900,  tempMax:1100, porosidad:12, color:'rojo',    desc:'Arcilla con hierro. Baja temperatura de cocción. Da color rojo ladrillo. Ideal para terracota y raku.', caract:['Baja temperatura','Color rojizo','Raku','Modelado'] },
  'Arcilla negra (negro fuego)':     { plasticidad:7, contraccion:11, tempMin:900,  tempMax:1150, porosidad:8,  color:'gris',    desc:'Arcilla con hierro y manganeso. Color oscuro tras la cocción. Buena plasticidad.',                       caract:['Color oscuro','Baja-media temp.','Modelado'] },
  'Arcilla de loza':                 { plasticidad:6, contraccion:9,  tempMin:1000, tempMax:1200, porosidad:10, color:'blanco',  desc:'Arcilla blanca de temperatura media. Base de mayólica y cerámica de loza. Buena plasticidad.',           caract:['Color blanco','Media temperatura','Mayólica'] },
  'Arcilla para gres':               { plasticidad:5, contraccion:10, tempMin:1200, tempMax:1300, porosidad:3,  color:'gris',    desc:'Arcilla refractaria de alta temperatura. Pasta resistente y densa. Base de la mayoría de los gres.',     caract:['Alta temperatura','Muy resistente','Baja porosidad','Torno'] },
  'Arcilla de porcelana':            { plasticidad:4, contraccion:13, tempMin:1220, tempMax:1400, porosidad:1,  color:'blanco',  desc:'Arcilla blanca muy pura. Alta temperatura. Traslúcida cuando es fina. Difícil de trabajar.',             caract:['Blanca pura','Traslúcida','Alta temp.','Difícil'] },
  'Arcilla para Raku':               { plasticidad:6, contraccion:8,  tempMin:900,  tempMax:1000, porosidad:15, color:'crema',   desc:'Pasta especial para raku. Resistente al choque térmico. Alta porosidad deliberada.',                     caract:['Raku','Choque térmico','Baja temp.','Alta porosidad'] },
  'Arcilla de chamote fino':         { plasticidad:4, contraccion:7,  tempMin:1000, tempMax:1250, porosidad:8,  color:'crema',   desc:'Arcilla con chamote molido fino. Reduce contracción y mejora resistencia al choque térmico.',             caract:['Con chamote','Menos contracción','Esculturas'] },
  // ── ADITIVOS Y MODIFICADORES ──
  'Chamote fino (molido <0.5mm)':    { plasticidad:-2, contraccion:-3, tempMin:0, tempMax:0, porosidad:5,  color:'neutro', desc:'Desgrasante. Reduce plasticidad y contracción. Mejora resistencia al choque térmico. 10-30%.',           caract:['Desgrasante','Reduce contracción','Choque térmico'] },
  'Chamote grueso (molido 1-3mm)':   { plasticidad:-3, contraccion:-4, tempMin:0, tempMax:0, porosidad:8,  color:'neutro', desc:'Desgrasante grueso. Textura visible. Ideal para esculturas y piezas grandes. 10-25%.',                   caract:['Textura visible','Esculturas','Desgrasante'] },
  'Arena de sílice':                 { plasticidad:-3, contraccion:-3, tempMin:0, tempMax:0, porosidad:6,  color:'neutro', desc:'Desgrasante no plástico. Reduce contracción. Puede bajar resistencia en exceso. Máx 15%.',               caract:['Desgrasante','Reduce contracción'] },
  'Feldespato potásico':             { plasticidad:-1, contraccion:-1, tempMin:0, tempMax:0, porosidad:-3, color:'neutro', desc:'Fundente. Reduce porosidad y baja temperatura de sinterización. 5-15%.',                                 caract:['Fundente','Reduce porosidad','Sinterización'] },
  'Caolín (EPK)':                    { plasticidad:2,  contraccion:3,  tempMin:0, tempMax:0, porosidad:2,  color:'blanco', desc:'Arcilla blanca no plástica. Aclara el color y mejora trabajabilidad. 10-30%.',                          caract:['Aclara color','Blancura','Semi-plástico'] },
  'Bentonita':                       { plasticidad:8,  contraccion:8,  tempMin:0, tempMax:0, porosidad:0,  color:'neutro', desc:'Plastificante muy potente. Usar en pequeñas cantidades (1-3%). Aumenta mucho la contracción.',           caract:['Plastificante','Usar <3%','Alta contracción'] },
  'Talco':                           { plasticidad:-1, contraccion:-2, tempMin:0, tempMax:0, porosidad:-2, color:'blanco', desc:'Fundente de baja temperatura. Reduce porosidad. Blanquea la pasta. 5-15%.',                             caract:['Fundente','Baja temp.','Blanquea'] },
  'Wollastonita':                    { plasticidad:-1, contraccion:-2, tempMin:0, tempMax:0, porosidad:-2, color:'blanco', desc:'Reduce contracción y mejora resistencia. Blanquea la pasta. 5-20%.',                                   caract:['Reduce contracción','Blanquea','Resistencia'] },
  'Dolomita':                        { plasticidad:-1, contraccion:-1, tempMin:0, tempMax:0, porosidad:-1, color:'blanco', desc:'Fundente secundario. Aporta MgO y CaO. Suaviza la pasta. 5-10%.',                                     caract:['Fundente','Suaviza','MgO+CaO'] },
  'Óxido de hierro (colorante)':     { plasticidad:0,  contraccion:0,  tempMin:0, tempMax:0, porosidad:0,  color:'rojo',   desc:'Colorante rojizo/marrón. Da color a la pasta. 1-8% según intensidad deseada.',                         caract:['Colorante','Rojo/marrón','1-8%'] },
  'Carbonato de bario':              { plasticidad:0,  contraccion:0,  tempMin:0, tempMax:0, porosidad:-3, color:'neutro', desc:'Fundente que reduce eflorescencias. Tóxico — manipular con guantes. Máx 2%.',                          caract:['Fundente','Anti-eflorescencia','Tóxico <2%'] },
}

// ─────────────────────────────────────────────
// MODAL GENÉRICO
// ─────────────────────────────────────────────

let modalCallback = null

function mostrarModal({ titulo, texto, confirmar, accion, cancelar = true }){
  document.getElementById('contModalTitulo').innerText = titulo
  document.getElementById('contModalTexto').innerText  = texto
  const btnC = document.getElementById('contModalConfirmar')
  const btnX = document.getElementById('contModalCancelar')
  btnC.innerText     = confirmar
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

let contadorMat     = 0
let historial       = JSON.parse(localStorage.getItem('arcillas_historial') || '[]')
let resultadoActual = null

// ─────────────────────────────────────────────
// MATERIALES DINÁMICOS
// ─────────────────────────────────────────────

function agregarMaterial(nombre = '', pct = ''){
  const id   = ++contadorMat
  const cont = document.getElementById('arcillaMateriales')
  const div  = document.createElement('div')
  div.className = 'arc-material'
  div.id = 'arcmat-' + id

  const opciones = Object.keys(MATERIALES_DB).map(m =>
    `<option value="${m}" ${m === nombre ? 'selected' : ''}>${m}</option>`
  ).join('')

  const descId = 'arc-desc-' + id
  div.innerHTML = `
    <select class="arc-material-select" onchange="mostrarDescMaterial(this, '${descId}'); calcularArcilla()">
      <option value="">— Seleccionar material —</option>
      ${opciones}
    </select>
    <div class="arc-material-pct">
      <input type="number" min="0" max="100" step="0.5" placeholder="0"
             value="${pct}" oninput="calcularArcilla()">
      <span>%</span>
    </div>
    <button class="arc-material-borrar" onclick="borrarMaterial(${id})">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `

  // Descripción debajo
  const desc = document.createElement('div')
  desc.className = 'arc-mat-desc'
  desc.id = descId
  desc.style.display = nombre ? 'block' : 'none'
  desc.innerText = nombre ? (MATERIALES_DB[nombre]?.desc || '') : ''
  div.appendChild(desc)

  cont.appendChild(div)
  calcularArcilla()
}

function mostrarDescMaterial(select, descId){
  const el  = document.getElementById(descId)
  if(!el) return
  const mat = MATERIALES_DB[select.value]
  el.innerText     = mat ? mat.desc : ''
  el.style.display = mat ? 'block' : 'none'
}

function borrarMaterial(id){
  const el = document.getElementById('arcmat-' + id)
  if(el) el.remove()
  calcularArcilla()
}

function obtenerMateriales(){
  const items = []
  document.querySelectorAll('.arc-material').forEach(div => {
    const nombre = div.querySelector('select').value
    const pct    = parseFloat(div.querySelector('input[type="number"]').value) || 0
    if(nombre && pct > 0) items.push({ nombre, pct })
  })
  return items
}

// ─────────────────────────────────────────────
// CALCULAR PROPIEDADES
// ─────────────────────────────────────────────

function calcularArcilla(){
  const materiales = obtenerMateriales()
  const total      = materiales.reduce((s, m) => s + m.pct, 0)

  // Barra de total
  const barra = document.getElementById('arcillaBarra')
  barra.style.width = Math.min(total, 100) + '%'
  barra.classList.toggle('excede', total > 100)
  document.getElementById('arcillaTotal').innerText = total.toFixed(1) + '%'
  const aviso = document.getElementById('arcillaAviso')
  if(Math.abs(total - 100) < 0.1){
    aviso.innerText = '✓ Perfecto'; aviso.className = 'total-aviso ok'
  } else if(total < 100){
    aviso.innerText = `Falta ${(100-total).toFixed(1)}%`; aviso.className = 'total-aviso'
  } else {
    aviso.innerText = `Excede ${(total-100).toFixed(1)}%`; aviso.className = 'total-aviso'
  }

  if(materiales.length === 0 || total <= 0){
    document.getElementById('arcillaResultado').style.display = 'none'
    resultadoActual = null
    return
  }

  // ── Calcular propiedades ponderadas ──
  let plasticidad  = 0
  let contraccion  = 0
  let tempMin      = 0
  let tempMax      = 0
  let porosidad    = 0
  let tempCount    = 0
  const colores    = {}
  const caract     = new Set()

  materiales.forEach(m => {
    const db  = MATERIALES_DB[m.nombre]
    if(!db) return
    const w   = m.pct / 100

    plasticidad += db.plasticidad  * w
    contraccion += db.contraccion  * w
    porosidad   += db.porosidad    * w

    // Temperatura: solo arcillas base (tempMin > 0)
    if(db.tempMin > 0){
      tempMin  += db.tempMin * (m.pct / total * 100) / 100
      tempMax  += db.tempMax * (m.pct / total * 100) / 100
      tempCount++
    }

    // Color dominante
    if(db.color && db.color !== 'neutro'){
      colores[db.color] = (colores[db.color] || 0) + m.pct
    }

    // Características
    db.caract.forEach(c => caract.add(c))
  })

  // Normalizar temperatura
  if(tempMin === 0) tempMin = 1000
  if(tempMax === 0) tempMax = 1200
  tempMin = Math.round(tempMin)
  tempMax = Math.round(tempMax)

  // Clamp valores
  plasticidad = Math.max(0, Math.min(10, plasticidad))
  contraccion = Math.max(0, Math.min(20, contraccion))
  porosidad   = Math.max(0, Math.min(25, porosidad))

  // Color dominante
  const colorDom = Object.entries(colores).sort((a,b) => b[1]-a[1])[0]?.[0] || 'crema'

  resultadoActual = { plasticidad, contraccion, tempMin, tempMax, porosidad, colorDom, caract:[...caract], materiales }

  // ── Renderizar ──
  renderizarMedidor('arcPlasticidad',  'barraPlasticidad',  'descPlasticidad',
    `${plasticidad.toFixed(1)} / 10`,
    (plasticidad / 10) * 100,
    plasticidad < 3 ? 'Poca plasticidad — difícil de trabajar en torno.' :
    plasticidad > 7 ? 'Alta plasticidad — excelente para torno, alta contracción.' :
                      'Plasticidad media — trabajable en torno y modelado.'
  )

  renderizarMedidor('arcContraccion',  'barraContraccion',  'descContraccion',
    `${contraccion.toFixed(1)}%`,
    (contraccion / 20) * 100,
    contraccion < 5  ? 'Contracción baja — ideal para piezas grandes.' :
    contraccion > 12 ? 'Contracción alta — tener en cuenta al diseñar el tamaño.' :
                       'Contracción normal. Medí siempre con probetas propias.'
  )

  renderizarMedidor('arcTemperatura',  'barraTemperatura',  'descTemperatura',
    `${tempMin}–${tempMax}°C`,
    ((tempMin - 800) / 700) * 100,
    tempMax < 1100 ? 'Temperatura baja — ideal para terracota, raku y loza.' :
    tempMin > 1200 ? 'Alta temperatura — gres y porcelana. Requiere horno de alta.' :
                     'Temperatura media — versátil, apto para la mayoría de hornos.'
  )

  renderizarMedidor('arcPorosidad',    'barraPorosidad',    'descPorosidad',
    `${porosidad.toFixed(1)}%`,
    (porosidad / 25) * 100,
    porosidad < 3  ? 'Muy baja porosidad — pasta vitrificada, apta para vajilla sin esmaltar.' :
    porosidad > 12 ? 'Alta porosidad — necesita esmalte para ser impermeable.' :
                     'Porosidad media — con esmalte adecuado es apta para uso utilitario.'
  )

  // Características
  renderizarCaracteristicas([...caract], colorDom)

  // Diagnóstico
  renderizarDiagnostico(plasticidad, contraccion, tempMin, tempMax, porosidad, materiales)

  document.getElementById('arcillaResultado').style.display = 'flex'
  verificarSesionTaller()
}

function renderizarMedidor(idValor, idBarra, idDesc, valor, pct, desc){
  document.getElementById(idValor).innerText = valor
  document.getElementById(idBarra).style.width = Math.min(Math.max(pct, 2), 100) + '%'
  document.getElementById(idDesc).innerText  = desc
}

function renderizarCaracteristicas(caract, color){
  const cont = document.getElementById('arcCaracteristicas')
  cont.innerHTML = ''

  const colorLabel = { rojo:'Pasta rojiza', blanco:'Pasta clara', crema:'Pasta crema', gris:'Pasta gris' }
  if(colorLabel[color]){
    const chip = document.createElement('span')
    chip.className = 'arc-caract-chip'
    chip.innerHTML = `<i class="fa-solid fa-palette"></i> ${colorLabel[color]}`
    cont.appendChild(chip)
  }

  const iconos = {
    'Apta torno':'fa-rotate', 'Muy plástica':'fa-droplet', 'Alta contracción':'fa-compress',
    'Alta temperatura':'fa-fire', 'Baja temperatura':'fa-temperature-low', 'Raku':'fa-fire-flame-curved',
    'Blanca pura':'fa-star', 'Traslúcida':'fa-eye', 'Muy resistente':'fa-shield',
    'Baja porosidad':'fa-lock', 'Choque térmico':'fa-bolt', 'Desgrasante':'fa-filter',
    'Tóxico <2%':'fa-skull-crossbones', 'Usar <3%':'fa-exclamation-triangle'
  }

  // Mostrar hasta 6 chips más relevantes
  caract.slice(0, 6).forEach(c => {
    const chip = document.createElement('span')
    chip.className = 'arc-caract-chip'
    const icono = iconos[c] || 'fa-circle-dot'
    chip.innerHTML = `<i class="fa-solid ${icono}"></i> ${c}`
    cont.appendChild(chip)
  })
}

// ─────────────────────────────────────────────
// DIAGNÓSTICO AMIGABLE
// ─────────────────────────────────────────────

function renderizarDiagnostico(plasticidad, contraccion, tempMin, tempMax, porosidad, materiales){
  const cont = document.getElementById('arcDiagnostico')
  cont.innerHTML = ''

  const diags = []

  // Plasticidad
  if(plasticidad < 3){
    diags.push({ tipo:'aviso', titulo:'Poca plasticidad — difícil de tornear',
      detalle:'La mezcla tiene poca plasticidad. Agregá arcilla de bola o bentonita (1-2%) para mejorar la trabajabilidad en torno.' })
  } else if(plasticidad >= 7){
    diags.push({ tipo:'ok', titulo:'Muy buena plasticidad para torno',
      detalle:`Plasticidad ${plasticidad.toFixed(1)}/10. La pasta debería trabajar bien en torno. Controlá la contracción.` })
  } else {
    diags.push({ tipo:'ok', titulo:'Plasticidad adecuada',
      detalle:`Plasticidad ${plasticidad.toFixed(1)}/10. Apta para torno y modelado a mano.` })
  }

  // Contracción
  if(contraccion > 13){
    diags.push({ tipo:'error', titulo:'Contracción muy alta — riesgo de fisuras',
      detalle:`Contracción estimada ${contraccion.toFixed(1)}%. Una contracción tan alta puede causar fisuras y deformaciones. Agregá chamote fino o arena de sílice (10-20%) para reducirla.` })
  } else if(contraccion > 10){
    diags.push({ tipo:'aviso', titulo:'Contracción alta — diseñá las piezas más grandes',
      detalle:`Contracción estimada ${contraccion.toFixed(1)}%. Diseñá tus piezas un 10-12% más grandes que el tamaño final deseado. Hacé siempre tus propias probetas.` })
  } else {
    diags.push({ tipo:'ok', titulo:'Contracción manejable',
      detalle:`Contracción estimada ${contraccion.toFixed(1)}%. Dentro de rangos normales. Recordá medir con probetas propias ya que los valores reales pueden variar.` })
  }

  // Temperatura
  if(tempMax - tempMin > 200){
    diags.push({ tipo:'aviso', titulo:'Rango de temperatura amplio',
      detalle:`La mezcla de arcillas tiene un rango amplio (${tempMin}–${tempMax}°C). Hacé pruebas a distintas temperaturas para encontrar el punto óptimo.` })
  } else {
    diags.push({ tipo:'ok', titulo:`Temperatura de cocción: ${tempMin}–${tempMax}°C`,
      detalle: tempMax < 1100 ? 'Pasta de baja temperatura. Ideal para horno eléctrico doméstico.' :
               tempMin > 1200 ? 'Pasta de alta temperatura. Requiere horno de gres.' :
               'Temperatura media. Compatible con la mayoría de hornos cerámicos.' })
  }

  // Porosidad
  if(porosidad > 15){
    diags.push({ tipo:'aviso', titulo:'Alta porosidad — necesita esmalte impermeable',
      detalle:`Porosidad estimada ${porosidad.toFixed(1)}%. Para vajilla utilitaria es indispensable un esmalte bien fundido que selle la superficie. No apta sin esmaltar para líquidos.` })
  } else if(porosidad < 3){
    diags.push({ tipo:'ok', titulo:'Pasta muy densa y vitrificada',
      detalle:`Porosidad ${porosidad.toFixed(1)}%. La pasta queda muy cerrada. Ideal para vajilla. Verificá que el esmalte tenga coeficiente de expansión compatible.` })
  } else {
    diags.push({ tipo:'ok', titulo:'Porosidad normal',
      detalle:`Porosidad estimada ${porosidad.toFixed(1)}%. Con esmalte adecuado es apta para uso utilitario.` })
  }

  // Materiales tóxicos
  const toxicos = materiales.filter(m => m.nombre.includes('bario') || m.nombre.includes('Bario'))
  if(toxicos.length > 0){
    diags.push({ tipo:'aviso', titulo:'Contiene materiales tóxicos',
      detalle:'La mezcla contiene carbonato de bario. Trabajá con guantes y mascarilla. No usar en proporciones mayores al 2%.' })
  }

  // Bentonita en exceso
  const bent = materiales.find(m => m.nombre.includes('Bentonita'))
  if(bent && bent.pct > 3){
    diags.push({ tipo:'aviso', titulo:'Bentonita en exceso',
      detalle:`Usás ${bent.pct}% de bentonita. Se recomienda no superar el 3% — más puede causar contracción excesiva y fisuras durante el secado.` })
  }

  diags.forEach(d => {
    const div   = document.createElement('div')
    div.className = 'arc-diag-item ' + d.tipo
    const icono = d.tipo === 'ok' ? 'fa-circle-check' : d.tipo === 'aviso' ? 'fa-triangle-exclamation' : 'fa-circle-xmark'
    div.innerHTML = `
      <div class="arc-diag-header"><i class="fa-solid ${icono}"></i> ${d.titulo}</div>
      <div class="arc-diag-detalle">${d.detalle}</div>
    `
    cont.appendChild(div)
  })
}

// ─────────────────────────────────────────────
// GUARDAR EN HISTORIAL
// ─────────────────────────────────────────────

function guardarArcilla(){
  const nombre = document.getElementById('arcillaNombre').value.trim()
  if(!nombre){
    mostrarModal({ titulo:'Sin nombre', texto:'Poné un nombre a la pasta antes de guardar.', confirmar:'Entendido', cancelar:false })
    return
  }
  if(!resultadoActual){
    mostrarModal({ titulo:'Sin resultado', texto:'Completá la mezcla para calcular primero.', confirmar:'Entendido', cancelar:false })
    return
  }

  const { plasticidad, contraccion, tempMin, tempMax, porosidad, materiales } = resultadoActual
  const entrada = {
    id:          Date.now(),
    nombre,
    materiales,
    plasticidad: plasticidad.toFixed(1),
    contraccion: contraccion.toFixed(1),
    tempMin,
    tempMax,
    porosidad:   porosidad.toFixed(1),
    fecha:       new Date().toLocaleDateString('es-AR')
  }

  historial.unshift(entrada)
  localStorage.setItem('arcillas_historial', JSON.stringify(historial))
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
  const lista  = document.getElementById('arcillaHistorialLista')
  const btnPDF = document.getElementById('btnPDF')
  const btnLim = document.getElementById('btnLimpiar')

  lista.innerHTML = ''

  if(historial.length === 0){
    lista.innerHTML = '<p class="historial-vacio">Guardá una fórmula para verla aquí.</p>'
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
        <span class="historial-chip">Plasticidad: ${f.plasticidad}</span>
        <span class="historial-chip">Contracción: ${f.contraccion}%</span>
        <span class="historial-chip">${f.tempMin}–${f.tempMax}°C</span>
      </div>
    `
    lista.appendChild(item)
  })
}

function borrarEntrada(id){
  historial = historial.filter(f => f.id !== id)
  localStorage.setItem('arcillas_historial', JSON.stringify(historial))
  renderizarHistorial()
}

function limpiarHistorial(){
  mostrarModal({
    titulo:'Limpiar historial',
    texto:'Borrar todo el historial? No se puede deshacer.',
    confirmar:'Borrar todo',
    accion:() => {
      historial = []
      localStorage.setItem('arcillas_historial', JSON.stringify(historial))
      renderizarHistorial()
    }
  })
}

// ─────────────────────────────────────────────
// COPIAR
// ─────────────────────────────────────────────

function copiarArcilla(){
  if(!resultadoActual) return
  const nombre = document.getElementById('arcillaNombre').value.trim() || 'Sin nombre'
  const { plasticidad, contraccion, tempMin, tempMax, porosidad, materiales } = resultadoActual

  let texto = `YCA Ceramica - Mezcla de Arcillas\n`
  texto += `Pasta: ${nombre}\n`
  texto += `─────────────────────\n`
  texto += `COMPOSICION:\n`
  materiales.forEach(m => { texto += `  ${m.nombre}: ${m.pct}%\n` })
  texto += `─────────────────────\n`
  texto += `Plasticidad:  ${plasticidad.toFixed(1)}/10\n`
  texto += `Contraccion:  ${contraccion.toFixed(1)}%\n`
  texto += `Temperatura:  ${tempMin}–${tempMax}°C\n`
  texto += `Porosidad:    ${porosidad.toFixed(1)}%\n`

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
  doc.text('Mezcla de Arcillas', m+26, 24)
  doc.setFontSize(8)
  doc.text('instagram: @ycaceramica   |   tiktok: @yca.ceramica', m+26, 31)
  const fecha = new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'})
  doc.text(`Generado: ${fecha}`, W-m, 36, {align:'right'})

  let y = 50

  historial.forEach((f, idx) => {
    const h = 44 + Math.ceil(f.materiales.length / 2) * 7
    if(y + h > 272){ doc.addPage(); y = 20 }

    doc.setFillColor(...GRIS); doc.roundedRect(m, y, W-m*2, h, 4, 4, 'F')

    // Encabezado
    doc.setTextColor(...MARRON); doc.setFontSize(13); doc.setFont('helvetica','bold')
    doc.text(`#${idx+1} ${f.nombre}`, m+5, y+9)
    doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(120,110,100)
    doc.text(f.fecha, W-m-5, y+9, {align:'right'})

    // Propiedades
    const chips = [
      { l:'PLASTICIDAD', v:`${f.plasticidad}/10` },
      { l:'CONTRACCION', v:`${f.contraccion}%` },
      { l:'TEMPERATURA', v:`${f.tempMin}-${f.tempMax}C` },
      { l:'POROSIDAD',   v:`${f.porosidad}%` },
    ]
    const cw = (W-m*2-9)/4
    chips.forEach((c,ci) => {
      const x = m+ci*(cw+3), cx = x+cw/2
      doc.setFillColor(...BLANCO); doc.roundedRect(x, y+13, cw, 13, 2, 2, 'F')
      doc.setTextColor(120,110,100); doc.setFontSize(6); doc.setFont('helvetica','bold')
      doc.text(c.l, cx, y+17.5, {align:'center'})
      doc.setTextColor(...MARRON); doc.setFontSize(9); doc.setFont('helvetica','bold')
      doc.text(c.v, cx, y+23, {align:'center'})
    })

    // Materiales
    let my = y + 30
    const colW = (W-m*2-6)/2
    f.materiales.forEach((mat, mi) => {
      const col = mi % 2
      const row = Math.floor(mi / 2)
      const mx  = m + col*(colW+6)
      const mmy = my + row*7

      doc.setTextColor(...NEGRO); doc.setFontSize(7.5); doc.setFont('helvetica','normal')
      doc.text(mat.nombre, mx+2, mmy, {maxWidth: colW-18})
      doc.setFont('helvetica','bold'); doc.setTextColor(...MARRON)
      doc.text(`${mat.pct}%`, mx+colW-2, mmy, {align:'right'})
    })

    y += h + 6
  })

  doc.setFillColor(...GRIS); doc.rect(0,287,W,10,'F')
  doc.setTextColor(160,150,140); doc.setFontSize(7); doc.setFont('helvetica','normal')
  doc.text('ycaceramica.github.io  |  YCA Ceramica 2026', W/2, 293, {align:'center'})

  doc.save('YCA_Ceramica_MezclaArcillas.pdf')
}

// ─────────────────────────────────────────────
// GUARDAR EN MI TALLER / MI CUENTA
// ─────────────────────────────────────────────

function getSesion(){
  try { return JSON.parse(sessionStorage.getItem('yca_sesion')) } catch(e){ return null }
}

function verificarSesionTaller(){
  const sesion = getSesion()
  const btn    = document.getElementById('btnTallerArc')
  if(btn) btn.style.display = sesion && sesion.token ? 'flex' : 'none'
}

async function guardarEnTallerArc(){
  const sesion = getSesion()
  if(!sesion || !sesion.token){
    mostrarModal({ titulo:'Iniciá sesion', texto:'Iniciá sesion para guardar tus formulas en tu cuenta.', confirmar:'Entendido', cancelar:false })
    return
  }
  if(historial.length === 0){
    mostrarModal({ titulo:'Sin datos', texto:'Guarda una formula en el historial primero.', confirmar:'Entendido', cancelar:false })
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
      body: JSON.stringify({ action, [idKey]: sesion.id, item:{
        calculadora: 'arcillas',
        nombre:      item.nombre,
        datos: {
          materiales:  item.materiales,
          plasticidad: item.plasticidad,
          contraccion: item.contraccion,
          tempMin:     item.tempMin,
          tempMax:     item.tempMax,
          porosidad:   item.porosidad,
          fecha:       item.fecha
        }
      } })
    })
    const data = await res.json()
    if(data.ok){
      mostrarModal({ titulo:'Guardado en ' + destino, texto:'La formula fue sincronizada con tu cuenta.', confirmar:'Genial', cancelar:false })
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

window.addEventListener('DOMContentLoaded', () => {
  agregarMaterial('Arcilla para gres', 50)
  agregarMaterial('Arcilla de bola / Ball clay', 25)
  agregarMaterial('Caolín (EPK)', 15)
  agregarMaterial('Chamote fino (molido <0.5mm)', 10)

  renderizarHistorial()
  verificarSesionTaller()
})
