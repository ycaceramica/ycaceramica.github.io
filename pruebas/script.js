// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

const API = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'

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

let contadorBase  = 0
let serieActual   = null
let historial     = JSON.parse(localStorage.getItem('pruebas_historial') || '[]')

// ─────────────────────────────────────────────
// RECETA BASE — ITEMS DINÁMICOS
// ─────────────────────────────────────────────

function agregarBase(nombre = '', pct = ''){
  const id   = ++contadorBase
  const cont = document.getElementById('pruebasBase')
  const div  = document.createElement('div')
  div.className = 'pruebas-item'
  div.id        = 'base-' + id
  div.innerHTML = `
    <input type="text"   class="pruebas-item-nombre" placeholder="Material" value="${nombre}" oninput="actualizarTotalBase()">
    <div class="pruebas-item-pct">
      <input type="number" min="0" max="100" step="0.5" placeholder="0" value="${pct}" oninput="actualizarTotalBase()">
      <span>%</span>
    </div>
    <button class="pruebas-item-borrar" onclick="borrarBase(${id})">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `
  cont.appendChild(div)
  actualizarTotalBase()
}

function borrarBase(id){
  const el = document.getElementById('base-' + id)
  if(el) el.remove()
  actualizarTotalBase()
}

function obtenerBase(){
  const items = []
  document.querySelectorAll('.pruebas-item').forEach(div => {
    const nombre = div.querySelector('.pruebas-item-nombre').value.trim()
    const pct    = parseFloat(div.querySelector('input[type="number"]').value) || 0
    if(nombre && pct > 0) items.push({ nombre, pct })
  })
  return items
}

function actualizarTotalBase(){
  const base  = obtenerBase()
  const total = base.reduce((s, m) => s + m.pct, 0)
  document.getElementById('totalBase').innerText = total.toFixed(1) + '%'
  const aviso = document.getElementById('avisoBase')
  if(Math.abs(total - 100) < 0.1){
    aviso.innerText   = '✓ Perfecto'
    aviso.className   = 'total-aviso ok'
  } else if(total < 100){
    aviso.innerText   = `Falta ${(100-total).toFixed(1)}%`
    aviso.className   = 'total-aviso'
  } else {
    aviso.innerText   = `Excede ${(total-100).toFixed(1)}%`
    aviso.className   = 'total-aviso'
  }
  previsualizarSerie()
}

// ─────────────────────────────────────────────
// COLORANTE 2 TOGGLE
// ─────────────────────────────────────────────

function toggleColor2(){
  const usar   = document.getElementById('usar2do').checked
  const ctrls  = document.getElementById('color2Controles')
  ctrls.style.display = usar ? 'flex' : 'none'
  if(usar) ctrls.style.flexDirection = 'column'
}

// ─────────────────────────────────────────────
// PREVISUALIZAR SERIE
// ─────────────────────────────────────────────

function previsualizarSerie(){
  const { combinaciones, error } = calcularCombinaciones()
  const preview  = document.getElementById('pruebasPreview')
  const conteo   = document.getElementById('pruebasConteo')
  const avisoEl  = document.getElementById('pruebasAviso')
  const btnGen   = document.getElementById('btnGenerar')

  if(error){
    preview.style.display  = 'none'
    btnGen.style.display   = 'none'
    return
  }

  preview.style.display = 'flex'

  if(combinaciones > 50){
    conteo.innerText        = `${combinaciones} pruebas`
    avisoEl.innerText       = '⚠ Máximo 50 — ajustá el rango o el paso'
    btnGen.style.display    = 'none'
  } else if(combinaciones === 0){
    conteo.innerText        = 'Sin pruebas — revisá los rangos'
    avisoEl.innerText       = ''
    btnGen.style.display    = 'none'
  } else {
    conteo.innerText        = `${combinaciones} pruebas a generar`
    avisoEl.innerText       = ''
    btnGen.style.display    = 'flex'
  }
}

function calcularCombinaciones(){
  const c1desde = parseFloat(document.getElementById('color1Desde').value) || 0
  const c1hasta = parseFloat(document.getElementById('color1Hasta').value) || 0
  const c1paso  = parseFloat(document.getElementById('color1Paso').value)  || 0.5
  const usar2   = document.getElementById('usar2do').checked

  if(c1paso <= 0) return { combinaciones:0, error:true }

  const vals1 = range(c1desde, c1hasta, c1paso)
  if(vals1.length === 0) return { combinaciones:0, error:false }

  if(!usar2) return { combinaciones:vals1.length, error:false }

  const c2desde = parseFloat(document.getElementById('color2Desde').value) || 0
  const c2hasta = parseFloat(document.getElementById('color2Hasta').value) || 0
  const c2paso  = parseFloat(document.getElementById('color2Paso').value)  || 0.5
  if(c2paso <= 0) return { combinaciones:0, error:true }

  const vals2 = range(c2desde, c2hasta, c2paso)
  return { combinaciones: vals1.length * vals2.length, error:false }
}

function range(desde, hasta, paso){
  const vals = []
  let v = desde
  while(v <= hasta + 0.001){
    vals.push(parseFloat(v.toFixed(2)))
    v += paso
  }
  return vals
}

// ─────────────────────────────────────────────
// GENERAR SERIE
// ─────────────────────────────────────────────

function generarSerie(){
  const nombre  = document.getElementById('pruebasNombre').value.trim() || 'Serie sin nombre'
  const base    = obtenerBase()
  const gramos  = parseFloat(document.getElementById('pruebasGramos').value) || 100
  const usar2   = document.getElementById('usar2do').checked

  const c1nombre = document.getElementById('color1Nombre').value || 'Colorante 1'
  const c1desde  = parseFloat(document.getElementById('color1Desde').value) || 0
  const c1hasta  = parseFloat(document.getElementById('color1Hasta').value) || 0
  const c1paso   = parseFloat(document.getElementById('color1Paso').value)  || 0.5

  const vals1 = range(c1desde, c1hasta, c1paso)

  let vals2    = [null]
  let c2nombre = ''
  if(usar2){
    c2nombre = document.getElementById('color2Nombre').value || 'Colorante 2'
    const c2desde = parseFloat(document.getElementById('color2Desde').value) || 0
    const c2hasta = parseFloat(document.getElementById('color2Hasta').value) || 0
    const c2paso  = parseFloat(document.getElementById('color2Paso').value)  || 0.5
    vals2 = range(c2desde, c2hasta, c2paso)
  }

  const pruebas = []
  let idx = 1

  vals1.forEach(v1 => {
    vals2.forEach(v2 => {
      const codigo = nombre.substring(0,3).toUpperCase().replace(/\s/g,'') + '-' + String(idx).padStart(3,'0')
      idx++

      // Calcular gramos de cada componente
      // La base suma 100%, los colorantes se agregan sobre esa base
      const totalPct = 100 + v1 + (v2 || 0)
      const factor   = gramos / totalPct

      const mats = base.map(m => ({
        nombre: m.nombre,
        gramos: parseFloat((m.pct * factor).toFixed(1))
      }))

      mats.push({ nombre: c1nombre, gramos: parseFloat((v1 * factor).toFixed(1)) })
      if(v2 !== null){
        mats.push({ nombre: c2nombre, gramos: parseFloat(((v2||0) * factor).toFixed(1)) })
      }

      const totalGramos = mats.reduce((s,m) => s + m.gramos, 0)

      pruebas.push({
        codigo,
        c1: { nombre: c1nombre, pct: v1 },
        c2: v2 !== null ? { nombre: c2nombre, pct: v2 } : null,
        mats,
        totalGramos: parseFloat(totalGramos.toFixed(1))
      })
    })
  })

  serieActual = { nombre, base, gramos, pruebas, fecha: new Date().toLocaleDateString('es-AR') }
  renderizarResultado()
}

// ─────────────────────────────────────────────
// RENDERIZAR RESULTADO
// ─────────────────────────────────────────────

function renderizarResultado(){
  if(!serieActual) return

  const { nombre, pruebas } = serieActual

  document.getElementById('pruebasResultadoTitulo').innerText = `${nombre} — ${pruebas.length} pruebas`
  document.getElementById('pruebasResultado').style.display   = 'flex'

  const grid = document.getElementById('pruebasGrid')
  grid.innerHTML = ''

  pruebas.forEach(p => {
    const card = document.createElement('div')
    card.className = 'prueba-card'

    const colorantesHtml = [
      `<span class="prueba-colorante-chip">${p.c1.nombre} ${p.c1.pct}%</span>`,
      p.c2 ? `<span class="prueba-colorante-chip">${p.c2.nombre} ${p.c2.pct}%</span>` : ''
    ].join('')

    const matsHtml = p.mats.map(m => `
      <div class="prueba-mat-fila">
        <span class="prueba-mat-nombre">${m.nombre}</span>
        <span class="prueba-mat-gramos">${m.gramos}g</span>
      </div>
    `).join('')

    card.innerHTML = `
      <div class="prueba-codigo">${p.codigo}</div>
      <div class="prueba-colorantes">${colorantesHtml}</div>
      <div class="prueba-materiales">${matsHtml}</div>
      <div class="prueba-total">Total: ${p.totalGramos}g</div>
    `
    grid.appendChild(card)
  })

  verificarSesionTaller()
}

// ─────────────────────────────────────────────
// GUARDAR EN HISTORIAL
// ─────────────────────────────────────────────

function guardarSerie(){
  if(!serieActual){
    mostrarModal({ titulo:'Sin serie', texto:'Generá una serie primero.', confirmar:'Entendido', cancelar:false })
    return
  }

  const entrada = {
    id:      Date.now(),
    nombre:  serieActual.nombre,
    pruebas: serieActual.pruebas.length,
    gramos:  serieActual.gramos,
    datos:   serieActual,
    fecha:   serieActual.fecha
  }

  historial.unshift(entrada)
  localStorage.setItem('pruebas_historial', JSON.stringify(historial))
  renderizarHistorial()

  const btn = document.querySelector('.btn-guardar')
  if(btn){
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Guardado'
    setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar' }, 2000)
  }
}

// ─────────────────────────────────────────────
// RENDERIZAR HISTORIAL
// ─────────────────────────────────────────────

function renderizarHistorial(){
  const lista  = document.getElementById('pruebasHistorialLista')
  const btnLim = document.getElementById('btnLimpiar')

  lista.innerHTML = ''

  if(historial.length === 0){
    lista.innerHTML = '<p class="historial-vacio">Guardá una serie para verla aquí.</p>'
    btnLim.style.display = 'none'
    return
  }

  btnLim.style.display = 'inline-flex'

  historial.forEach(f => {
    const item = document.createElement('div')
    item.className = 'historial-item'
    item.innerHTML = `
      <button class="historial-item-borrar" onclick="event.stopPropagation();borrarEntrada(${f.id})">✕</button>
      <div class="historial-item-nombre">${f.nombre}</div>
      <div class="historial-item-meta">${f.fecha}</div>
      <div class="historial-item-componentes">
        <span class="historial-chip">${f.pruebas} pruebas</span>
        <span class="historial-chip">${f.gramos}g c/u</span>
      </div>
    `
    item.addEventListener('click', () => cargarDesdeHistorial(f))
    lista.appendChild(item)
  })
}

function cargarDesdeHistorial(f){
  serieActual = f.datos
  renderizarResultado()
}

function borrarEntrada(id){
  historial = historial.filter(f => f.id !== id)
  localStorage.setItem('pruebas_historial', JSON.stringify(historial))
  renderizarHistorial()
}

function limpiarHistorial(){
  mostrarModal({
    titulo:'Limpiar historial',
    texto:'Borrar todo el historial? No se puede deshacer.',
    confirmar:'Borrar todo',
    accion:() => {
      historial = []
      localStorage.setItem('pruebas_historial', JSON.stringify(historial))
      renderizarHistorial()
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
  if(!serieActual || !serieActual.pruebas.length) return

  const { jsPDF }  = window.jspdf
  const doc        = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' })
  const W = 210, m = 14
  const MARRON=[139,111,86], NEGRO=[40,35,30], BLANCO=[255,255,255], GRIS=[245,240,235]

  // Encabezado
  doc.setFillColor(...MARRON); doc.rect(0,0,W,38,'F')
  const logo = await cargarLogoBase64()
  if(logo) doc.addImage(logo,'PNG',m,7,20,20)
  doc.setTextColor(...BLANCO); doc.setFontSize(18); doc.setFont('helvetica','bold')
  doc.text('YCA Ceramica', m+24, 16)
  doc.setFontSize(10); doc.setFont('helvetica','normal')
  doc.text('Generador de Pruebas de Colorantes', m+24, 23)
  doc.setFontSize(8)
  doc.text(`Serie: ${serieActual.nombre}  |  ${serieActual.pruebas.length} pruebas  |  ${serieActual.gramos}g c/u`, m+24, 30)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'long',year:'numeric'})}`, W-m, 34, {align:'right'})

  let y = 46

  // Grid de pruebas — 3 columnas
  const cols   = 3
  const cardW  = (W - m*2 - (cols-1)*4) / cols
  const cardH  = 44

  serieActual.pruebas.forEach((p, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)

    if(col === 0 && row > 0){
      y += cardH + 4
    }

    if(y + cardH > 275){ doc.addPage(); y = 14 }

    const x = m + col * (cardW + 4)

    // Card
    doc.setFillColor(...GRIS); doc.roundedRect(x, y, cardW, cardH, 3, 3, 'F')

    // Código
    doc.setFillColor(...MARRON); doc.roundedRect(x, y, cardW, 8, 3, 3, 'F')
    doc.rect(x, y+4, cardW, 4, 'F')
    doc.setTextColor(...BLANCO); doc.setFontSize(8); doc.setFont('helvetica','bold')
    doc.text(p.codigo, x + cardW/2, y+5.5, {align:'center'})

    // Colorantes
    doc.setTextColor(...MARRON); doc.setFontSize(7); doc.setFont('helvetica','bold')
    const colorText = p.c1.nombre + ' ' + p.c1.pct + '%' + (p.c2 ? '  +  ' + p.c2.nombre + ' ' + p.c2.pct + '%' : '')
    doc.text(colorText, x+3, y+13, {maxWidth: cardW-6})

    // Materiales
    doc.setTextColor(...NEGRO); doc.setFont('helvetica','normal')
    let my = y + 19
    p.mats.forEach(mat => {
      if(my > y + cardH - 4) return
      doc.setFontSize(6)
      doc.text(mat.nombre, x+3, my, {maxWidth: cardW-18})
      doc.setFont('helvetica','bold'); doc.setTextColor(...MARRON)
      doc.text(mat.gramos + 'g', x+cardW-3, my, {align:'right'})
      doc.setFont('helvetica','normal'); doc.setTextColor(...NEGRO)
      my += 5.5
    })

    // Total
    doc.setFontSize(6.5); doc.setFont('helvetica','bold'); doc.setTextColor(...MARRON)
    doc.text('Total: ' + p.totalGramos + 'g', x+cardW-3, y+cardH-3, {align:'right'})
  })

  // Pie
  doc.setFillColor(...GRIS); doc.rect(0,285,W,12,'F')
  doc.setTextColor(160,150,140); doc.setFontSize(7); doc.setFont('helvetica','normal')
  doc.text('ycaceramica.github.io  |  YCA Ceramica 2026', W/2, 291, {align:'center'})

  doc.save(`YCA_Pruebas_${serieActual.nombre.replace(/\s/g,'_')}.pdf`)
}

// ─────────────────────────────────────────────
// GUARDAR EN MI TALLER / MI CUENTA
// ─────────────────────────────────────────────

function getSesion(){
  try { return JSON.parse(sessionStorage.getItem('yca_sesion')) } catch(e){ return null }
}

function verificarSesionTaller(){
  const sesion = getSesion()
  const btn    = document.getElementById('btnTallerPruebas')
  if(btn) btn.style.display = sesion && sesion.token ? 'flex' : 'none'
}

async function guardarEnTallerPruebas(){
  const sesion = getSesion()
  if(!sesion || !sesion.token){
    mostrarModal({ titulo:'Iniciá sesion', texto:'Iniciá sesion para guardar tus series en tu cuenta.', confirmar:'Entendido', cancelar:false })
    return
  }
  if(!serieActual){
    mostrarModal({ titulo:'Sin serie', texto:'Genera una serie primero.', confirmar:'Entendido', cancelar:false })
    return
  }

  const esCeramista = sesion.rol === 'ceramista'
  const action      = esCeramista ? 'guardarHistorialTaller' : 'guardarHistorialAlumno'
  const idKey       = esCeramista ? 'ceramistaId' : 'alumnoId'
  const destino     = esCeramista ? 'mi taller' : 'mi cuenta'

  try {
    const res  = await fetch(API, {
      method:'POST',
      body: JSON.stringify({
        action,
        [idKey]: sesion.id,
        item:{ calculadora:'pruebas', nombre:serieActual.nombre, datos:{ pruebas:serieActual.pruebas.length, gramos:serieActual.gramos } }
      })
    })
    const data = await res.json()
    if(data.ok){
      mostrarModal({ titulo:'Guardado en ' + destino, texto:'La serie fue sincronizada con tu cuenta.', confirmar:'Genial', cancelar:false })
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
  agregarBase('Feldespato potásico', 40)
  agregarBase('Whiting', 20)
  agregarBase('Caolín', 20)
  agregarBase('Sílice', 20)

  renderizarHistorial()
  previsualizarSerie()
  verificarSesionTaller()
})
