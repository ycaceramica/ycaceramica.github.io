// Dark mode y nav manejados por nav-ceramista.js

// ─────────────────────────────────────────────
// ESTADO
// ─────────────────────────────────────────────
let historial    = JSON.parse(localStorage.getItem("costos_historial") || "[]")
let materiales   = []         // [{ nombre, cantidad, precio }]
let modalCallback = null
let contadorMat  = 0

// ─────────────────────────────────────────────
// MODAL GENÉRICO
// ─────────────────────────────────────────────
function mostrarModal({ titulo, texto, confirmar, accion, cancelar = true }){
  document.getElementById("contModalTitulo").innerText = titulo
  document.getElementById("contModalTexto").innerText  = texto
  const btnConfirmar = document.getElementById("contModalConfirmar")
  const btnCancelar  = document.getElementById("contModalCancelar")
  btnConfirmar.innerText = confirmar
  btnCancelar.style.display = cancelar ? "inline-flex" : "none"
  modalCallback = accion || null
  btnConfirmar.onclick = () => { const cb = modalCallback; cerrarModal(); if(cb) cb() }
  document.getElementById("contModal").style.display = "flex"
}
function cerrarModal(){
  document.getElementById("contModal").style.display = "none"
  modalCallback = null
}

// ─────────────────────────────────────────────
// INFO
// ─────────────────────────────────────────────
function toggleInfo(){
  const c = document.getElementById("infoContent")
  const v = c.style.display !== "none"
  c.style.display = v ? "none" : "block"
  document.getElementById("infoChevron").style.transform = v ? "rotate(0deg)" : "rotate(180deg)"
}

// ─────────────────────────────────────────────
// MATERIALES
// ─────────────────────────────────────────────
function agregarMaterial(){
  contadorMat++
  const id = contadorMat
  materiales.push({ id, nombre:"", cantidad:0, precio:0 })

  const lista = document.getElementById("materialesLista")

  // Headers solo la primera vez
  if(materiales.length === 1){
    const headers = document.createElement("div")
    headers.className = "material-fila-headers"
    headers.id = "matHeaders"
    headers.innerHTML = `<span>Material</span><span>Cantidad</span><span>Precio unit.</span><span></span>`
    lista.appendChild(headers)
  }

  const fila = document.createElement("div")
  fila.className = "material-fila"
  fila.id = `mat-${id}`
  fila.innerHTML = `
    <input type="text" placeholder="Ej: Arcilla roja" oninput="setMatNombre(${id}, this.value)">
    <input type="number" placeholder="0" min="0" step="0.1" oninput="setMatCantidad(${id}, this.value)" style="text-align:center">
    <input type="number" placeholder="$0" min="0" oninput="setMatPrecio(${id}, this.value)">
    <button class="btn-eliminar-material" onclick="eliminarMaterial(${id})"><i class="fa-solid fa-xmark"></i></button>
  `
  lista.appendChild(fila)
  calcular()
}

function setMatNombre(id, v){
  const m = materiales.find(m => m.id === id)
  if(m) m.nombre = v
  calcular()
}

function setMatCantidad(id, v){
  const m = materiales.find(m => m.id === id)
  if(m) m.cantidad = parseFloat(v) || 0
  calcular()
}

function setMatPrecio(id, v){
  const m = materiales.find(m => m.id === id)
  if(m) m.precio = parseFloat(v) || 0
  calcular()
}

function eliminarMaterial(id){
  materiales = materiales.filter(m => m.id !== id)
  const fila = document.getElementById(`mat-${id}`)
  if(fila) fila.remove()
  if(materiales.length === 0){
    const headers = document.getElementById("matHeaders")
    if(headers) headers.remove()
  }
  calcular()
}

// ─────────────────────────────────────────────
// GANANCIA PRESETS
// ─────────────────────────────────────────────
function setGanancia(pct){
  document.getElementById("ganancia").value = pct
  actualizarPresets()
  calcular()
}

function actualizarPresets(){
  const val = parseFloat(document.getElementById("ganancia").value) || 0
  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.classList.toggle("activo", parseInt(btn.textContent) === val)
  })
  calcular()
}

// ─────────────────────────────────────────────
// CALCULAR
// ─────────────────────────────────────────────
function calcular(){
  const totalMat  = materiales.reduce((s, m) => s + (m.cantidad * m.precio), 0)
  const horas     = parseFloat(document.getElementById("horasCantidad").value) || 0
  const valorHora = parseFloat(document.getElementById("horasValor").value) || 0
  const totalHoras = horas * valorHora
  const fijos     = parseFloat(document.getElementById("costosFijos").value) || 0
  const ganancia  = parseFloat(document.getElementById("ganancia").value) || 0

  const costoTotal   = totalMat + totalHoras + fijos
  const precioVenta  = costoTotal * (1 + ganancia / 100)
  const gananciaMonto = precioVenta - costoTotal

  // Subtotales
  const subMat = document.getElementById("subtotalMateriales")
  const subHor = document.getElementById("subtotalHoras")
  subMat.style.display = materiales.length > 0 ? "flex" : "none"
  subHor.style.display = (horas > 0 && valorHora > 0) ? "flex" : "none"
  document.getElementById("subtotalMatValor").innerText  = fmt(totalMat)
  document.getElementById("subtotalHorasValor").innerText = fmt(totalHoras)

  // Resultado
  const res = document.getElementById("resultadoCostos")
  if(costoTotal <= 0){ res.style.display = "none"; return }
  res.style.display = "block"

  document.getElementById("resMateriales").innerText  = fmt(totalMat)
  document.getElementById("resHoras").innerText       = fmt(totalHoras)
  document.getElementById("resFijos").innerText       = fmt(fijos)
  document.getElementById("resCostoTotal").innerText  = fmt(costoTotal)
  document.getElementById("resPrecioVenta").innerText = fmt(precioVenta)
  document.getElementById("resGananciaValor").innerText = `Ganancia: ${fmt(gananciaMonto)} (${ganancia}%)`

  // Mostrar botón de análisis de negocio
  const btnBE = document.getElementById("btnBreakeven")
  if(btnBE) btnBE.style.display = "flex"
}

function fmt(n){ return "$" + (Math.round(n * 100) / 100).toLocaleString("es-AR", { minimumFractionDigits:2, maximumFractionDigits:2 }) }

// ─────────────────────────────────────────────
// TÉCNICAS
// ─────────────────────────────────────────────
function getTecnicas(){
  return Array.from(document.querySelectorAll(".tecnica-check input:checked")).map(c => c.value)
}

// ─────────────────────────────────────────────
// GUARDAR
// ─────────────────────────────────────────────
function guardarCosto(){
  const totalMat   = materiales.reduce((s, m) => s + (m.cantidad * m.precio), 0)
  const horas      = parseFloat(document.getElementById("horasCantidad").value) || 0
  const valorHora  = parseFloat(document.getElementById("horasValor").value) || 0
  const totalHoras = horas * valorHora
  const fijos      = parseFloat(document.getElementById("costosFijos").value) || 0
  const ganancia   = parseFloat(document.getElementById("ganancia").value) || 0
  const costoTotal = totalMat + totalHoras + fijos

  if(costoTotal <= 0){
    mostrarModal({ titulo:"⚠️ Sin datos", texto:"Ingresá al menos un material o costo antes de guardar.", confirmar:"Entendido", cancelar:false })
    return
  }

  historial.unshift({
    id: Date.now(),
    nombre: document.getElementById("nombrePieza").value.trim() || "Sin nombre",
    materiales: materiales.map(m => ({ nombre:m.nombre||"Material", cantidad:m.cantidad, precio:m.precio, subtotal:m.cantidad*m.precio })),
    horas, valorHora, totalHoras,
    fijos, ganancia, costoTotal,
    precioVenta: costoTotal * (1 + ganancia / 100),
    tecnicas: getTecnicas(),
    fecha: new Date().toLocaleDateString("es-AR")
  })

  guardarHistorial()
  flashBtn(".btn-guardar", "✓ Guardado", '<i class="fa-solid fa-floppy-disk"></i> Guardar en historial')
}

function guardarHistorial(){
  localStorage.setItem("costos_historial", JSON.stringify(historial))
  renderizarHistorial()
}

function flashBtn(sel, on, off){
  const b = document.querySelector(sel)
  if(!b) return
  b.innerHTML = on
  setTimeout(() => b.innerHTML = off, 2000)
}

// ─────────────────────────────────────────────
// COPIAR
// ─────────────────────────────────────────────
function copiarResultado(){
  const totalMat   = materiales.reduce((s, m) => s + (m.cantidad * m.precio), 0)
  const horas      = parseFloat(document.getElementById("horasCantidad").value) || 0
  const valorHora  = parseFloat(document.getElementById("horasValor").value) || 0
  const fijos      = parseFloat(document.getElementById("costosFijos").value) || 0
  const ganancia   = parseFloat(document.getElementById("ganancia").value) || 0
  const costoTotal = totalMat + (horas * valorHora) + fijos
  const precio     = costoTotal * (1 + ganancia / 100)
  const nombre     = document.getElementById("nombrePieza").value.trim() || "Pieza"

  const texto = `${nombre}\nMateriales: ${fmt(totalMat)}\nHoras: ${fmt(horas * valorHora)}\nCostos fijos: ${fmt(fijos)}\nCosto total: ${fmt(costoTotal)}\nGanancia (${ganancia}%): ${fmt(precio - costoTotal)}\nPrecio sugerido: ${fmt(precio)}`
  navigator.clipboard.writeText(texto)
}

// ─────────────────────────────────────────────
// HISTORIAL
// ─────────────────────────────────────────────
function renderizarHistorial(){
  const lista  = document.getElementById("historialLista")
  const btnPDF = document.getElementById("btnPDF")
  const btnLim = document.getElementById("btnLimpiar")
  lista.innerHTML = ""

  if(historial.length === 0){
    lista.innerHTML = '<p class="historial-vacio">Guardá un cálculo para verlo aquí.</p>'
    btnPDF.disabled = true
    btnLim.style.display = "none"
    return
  }

  btnPDF.disabled = false
  btnLim.style.display = "inline-flex"

  historial.forEach(item => {
    const div = document.createElement("div")
    div.className = "historial-item"
    const tecnicas = item.tecnicas?.length ? item.tecnicas.join(", ") : ""
    div.innerHTML = `
      <button class="historial-item-borrar" onclick="borrarItem(${item.id})">✕</button>
      <div class="historial-item-tipo">💰 ${item.nombre}</div>
      <div class="historial-item-valores">
        <span class="historial-chip">Costo: ${fmt(item.costoTotal)}</span>
        <span class="historial-chip-precio">Venta: ${fmt(item.precioVenta)}</span>
      </div>
      ${tecnicas ? `<div class="historial-item-meta">🏷 ${tecnicas}</div>` : ""}
      <div class="historial-item-meta">${item.fecha}</div>
    `
    lista.appendChild(div)
  })
}

function borrarItem(id){
  historial = historial.filter(i => i.id !== id)
  guardarHistorial()
}

function limpiarHistorialConfirmado(){
  historial = []
  localStorage.setItem("costos_historial", JSON.stringify(historial))
  renderizarHistorial()
}

function pedirLimpiarHistorial(){
  mostrarModal({
    titulo:"🗑 Limpiar historial",
    texto:"¿Borrar todo el historial? Esta acción no se puede deshacer.",
    confirmar:"Borrar todo",
    accion: limpiarHistorialConfirmado
  })
}

// ─────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────
function cargarLogoBase64(){
  return new Promise(resolve => {
    const img = new Image(); img.crossOrigin = "anonymous"
    img.onload = () => { const c = document.createElement("canvas"); c.width=img.width; c.height=img.height; c.getContext("2d").drawImage(img,0,0); resolve(c.toDataURL("image/png")) }
    img.onerror = () => resolve(null); img.src = "../imagenes/logo.png"
  })
}

async function descargarPDF(){
  if(!historial.length) return
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" })
  const W=210, m=18
  const MARRON=[139,111,86], GRIS=[245,240,235], BLANCO=[255,255,255], NEGRO=[40,35,30]
  let y=0

  // Header
  doc.setFillColor(...MARRON); doc.rect(0,0,W,40,"F")
  const logo = await cargarLogoBase64()
  if(logo) doc.addImage(logo,"PNG",m,8,22,22)
  doc.setTextColor(...BLANCO); doc.setFontSize(20); doc.setFont("helvetica","bold"); doc.text("YCA Ceramica",m+28,17)
  doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.text("Calculadora de Costos",m+28,24)
  doc.setFontSize(8); doc.text("instagram: @ycaceramica   |   tiktok: @yca.ceramica   |   youtube: @YCACeramica",m+28,31)
  doc.text(`Generado: ${new Date().toLocaleDateString("es-AR",{day:"2-digit",month:"long",year:"numeric"})}`,W-m,36,{align:"right"})
  y=50

  historial.forEach((item, idx) => {
    const lineasMat = item.materiales?.length || 0
    const h = 44 + lineasMat * 8 + (item.tecnicas?.length ? 8 : 0)
    if(y + h > 272){ doc.addPage(); y=20 }

    doc.setFillColor(...GRIS); doc.roundedRect(m, y, W-m*2, h, 4, 4, "F")

    // Título item
    doc.setTextColor(...MARRON); doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.text(`#${idx+1}`, m+5, y+9)
    doc.setTextColor(...NEGRO); doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.text(item.nombre, m+18, y+9)
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(120,110,100); doc.text(item.fecha, W-m-5, y+9, {align:"right"})

    let fy = y + 16

    // Materiales
    if(item.materiales?.length){
      item.materiales.forEach(mat => {
        doc.setTextColor(...NEGRO); doc.setFontSize(8); doc.setFont("helvetica","normal")
        doc.text(`· ${mat.nombre||"Material"} (${mat.cantidad} × $${mat.precio})`, m+6, fy+5)
        doc.text(fmt(mat.subtotal), W-m-5, fy+5, {align:"right"})
        fy += 8
      })
    }

    // Línea separadora
    doc.setDrawColor(...MARRON); doc.setLineWidth(0.2)
    doc.line(m+4, fy, W-m-4, fy)
    fy += 6

    // Desglose
    const filas = [
      ["Materiales", fmt(item.materiales?.reduce((s,m)=>s+m.subtotal,0)||0)],
      ["Horas de trabajo", fmt(item.totalHoras||0)],
      ["Costos fijos", fmt(item.fijos||0)],
      ["Costo total", fmt(item.costoTotal)]
    ]
    filas.forEach(([label, val]) => {
      doc.setTextColor(...NEGRO); doc.setFontSize(8); doc.setFont("helvetica","normal")
      doc.text(label, m+6, fy+4)
      const esCostoTotal = label === "Costo total"
      if(esCostoTotal) doc.setFont("helvetica","bold")
      doc.text(val, W-m-5, fy+4, {align:"right"})
      fy += 7
    })

    // Precio de venta (destacado)
    doc.setFillColor(...MARRON); doc.roundedRect(m+4, fy, W-m*2-8, 12, 3, 3, "F")
    doc.setTextColor(...BLANCO); doc.setFontSize(9); doc.setFont("helvetica","bold")
    doc.text(`Precio sugerido (${item.ganancia}% ganancia)`, m+8, fy+8)
    doc.text(fmt(item.precioVenta), W-m-8, fy+8, {align:"right"})
    fy += 14

    // Técnicas
    if(item.tecnicas?.length){
      doc.setTextColor(120,110,100); doc.setFontSize(7); doc.setFont("helvetica","normal")
      doc.text(`Técnicas: ${item.tecnicas.join(", ")}`, m+6, fy+4)
    }

    y += h + 6
  })

  // Footer
  doc.setFillColor(...GRIS); doc.rect(0,287,W,10,"F")
  doc.setTextColor(160,150,140); doc.setFontSize(7); doc.setFont("helvetica","normal")
  doc.text("ycaceramica.github.io  |  YCA Ceramica © 2026", W/2, 293, {align:"center"})

  doc.save("YCA_Ceramica_Costos.pdf")
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
renderizarHistorial()

// ─────────────────────────────────────────────
// MI TALLER (Fase 3)
// ─────────────────────────────────────────────
function verificarSesionTaller(){
  try {
    const ceramista = JSON.parse(localStorage.getItem("ceramista_sesion") || "null")
    const alumno    = JSON.parse(sessionStorage.getItem("yca_sesion") || "null")
    const activo    = (ceramista && ceramista.token) || (alumno && alumno.rol === 'alumno' && alumno.token)
    const btn = document.getElementById("btnTaller")
    if(btn) btn.style.display = activo ? "flex" : "none"
  } catch(e){}
}
function guardarEnTaller(){
  try {
    const ceramista = JSON.parse(localStorage.getItem("ceramista_sesion") || "null")
    const alumno    = JSON.parse(sessionStorage.getItem("yca_sesion") || "null")
    const esCeramista = ceramista && ceramista.token
    const esAlumno    = !esCeramista && alumno && alumno.rol === 'alumno' && alumno.token
    if(!esCeramista && !esAlumno){
      mostrarModal({ titulo:"👤 Iniciá sesión", texto:"Iniciá sesión para guardar tus cálculos en tu cuenta.", confirmar:"Entendido", cancelar:false })
      return
    }
    const hist = JSON.parse(localStorage.getItem("costos_historial") || "[]")
    if(!hist.length){
      mostrarModal({ titulo:"⚠️ Sin datos", texto:"Guardá un cálculo en el historial primero.", confirmar:"Entendido", cancelar:false })
      return
    }
    const item    = hist[0]
    const action  = esCeramista ? "guardarHistorialTaller" : "guardarHistorialAlumno"
    const idKey   = esCeramista ? "ceramistaId" : "alumnoId"
    const userId  = esCeramista ? ceramista.id : alumno.id
    const destino = esCeramista ? "mi taller" : "mi cuenta"
    fetch("https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec", {
      method: "POST",
      body: JSON.stringify({
        action,
        [idKey]: userId,
        item: {
          calculadora: "costos",
          nombre:      item.nombre || item.arcilla || item.tipo || "Cálculo",
          datos:       item
        }
      })
    }).then(r => r.json()).then(data => {
      if(data.ok){
        mostrarModal({ titulo:"✅ Guardado en " + destino, texto:"El cálculo fue sincronizado con tu cuenta.", confirmar:"¡Genial!", cancelar:false })
      } else {
        mostrarModal({ titulo:"❌ Error", texto:"No se pudo guardar. Intentá de nuevo.", confirmar:"Entendido", cancelar:false })
      }
    }).catch(() => {
      mostrarModal({ titulo:"❌ Sin conexión", texto:"No se pudo guardar. Revisá tu conexión.", confirmar:"Entendido", cancelar:false })
    })
  } catch(e){
    mostrarModal({ titulo:"❌ Error", texto:"No se pudo guardar.", confirmar:"Entendido", cancelar:false })
  }
}

verificarSesionTaller()

// ─────────────────────────────────────────────
// INTEGRACIÓN CON BREAK-EVEN
// ─────────────────────────────────────────────

function usarParaBreakeven(){
  const gananciaVal = parseFloat(document.getElementById("ganancia").value)      || 0
  const horas       = parseFloat(document.getElementById("horasCantidad").value) || 0
  const valorHora   = parseFloat(document.getElementById("horasValor").value)    || 0
  const fijos       = parseFloat(document.getElementById("costosFijos").value)   || 0
  const totalMat    = materiales.reduce((s, m) => s + (m.cantidad * m.precio), 0)
  const costoTotal  = totalMat + horas * valorHora + fijos
  const precioVenta = costoTotal * (1 + gananciaVal / 100)

  if(costoTotal <= 0){
    mostrarModal({ titulo: 'Sin datos', texto: 'Calculá el costo de una pieza antes de usar esta función.', confirmar: 'Entendido', cancelar: false })
    return
  }

  localStorage.setItem('costos_para_breakeven', JSON.stringify({
    costoVariable: parseFloat(costoTotal.toFixed(2)),
    precio:        parseFloat(precioVenta.toFixed(2))
  }))

  window.location.href = '../breakeven/index.html'
}
