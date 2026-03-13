// ─────────────────────────────────────────────
// MODO OSCURO
// ─────────────────────────────────────────────

function actualizarIcono(){
  const btn = document.getElementById("toggleDark")
  if(btn) btn.innerText = document.body.classList.contains("dark") ? "☀️" : "🌙"
}

function aplicarModoOscuro(){
  if(localStorage.getItem("dark") === "true") document.body.classList.add("dark")
  actualizarIcono()
}

aplicarModoOscuro()

const toggleDark = document.getElementById("toggleDark")
if(toggleDark){
  toggleDark.addEventListener("click", () => {
    document.body.classList.toggle("dark")
    localStorage.setItem("dark", document.body.classList.contains("dark"))
    actualizarIcono()
  })
}

// ─────────────────────────────────────────────
// MENU HAMBURGUESA
// ─────────────────────────────────────────────

const hamburguesa = document.getElementById("hamburguesa")
const nav = document.getElementById("nav")

if(hamburguesa){
  hamburguesa.addEventListener("click", () => nav.classList.toggle("active"))
}

document.querySelectorAll(".nav a").forEach(link => {
  link.addEventListener("click", () => nav.classList.remove("active"))
})

window.addEventListener("scroll", () => {
  if(nav) nav.classList.remove("active")
})

// ─────────────────────────────────────────────
// ESTADO
// ─────────────────────────────────────────────

let tipoActual = "oxido"
let historial  = JSON.parse(localStorage.getItem("engobes_historial") || "[]")

const REFS = {
  oxido: {
    sinFeldespato: { Tinkar: 85, Flux: 10, Colorante: 5,  Feldespato: 20 },
    conFeldespato: { Tinkar: 60, Flux: 10, Colorante: 5,  Feldespato: 20 }
  },
  pigmento: {
    sinFeldespato: { Tinkar: 75, Flux: 10, Colorante: 15, Feldespato: 20 },
    conFeldespato: { Tinkar: 60, Flux: 10, Colorante: 10, Feldespato: 20 }
  }
}

// ─────────────────────────────────────────────
// TIPO
// ─────────────────────────────────────────────

function setTipo(tipo){
  tipoActual = tipo
  document.getElementById("btnOxido").classList.toggle("activo", tipo === "oxido")
  document.getElementById("btnPigmento").classList.toggle("activo", tipo === "pigmento")

  document.getElementById("nombreColorante").innerHTML = tipo === "oxido" ? "🔴 Óxido" : "🎨 Pigmento"

  const conFeldes = document.getElementById("checkFeldespato").checked
  const refKey    = conFeldes ? "conFeldespato" : "sinFeldespato"
  const refs      = REFS[tipo][refKey]

  document.getElementById("refColorante").innerText = `Ref: ${refs.Colorante}%`
  document.getElementById("refTinkar").innerText     = `Ref: ${refs.Tinkar}%`

  aplicarRefs(refs, conFeldes)
  calcular()
}

// ─────────────────────────────────────────────
// TOGGLE FELDESPATO
// ─────────────────────────────────────────────

function toggleFeldespato(){
  const checked = document.getElementById("checkFeldespato").checked
  document.getElementById("controlFeldespato").classList.toggle("oculto", !checked)

  const refKey = checked ? "conFeldespato" : "sinFeldespato"
  const refs   = REFS[tipoActual][refKey]

  document.getElementById("refTinkar").innerText    = `Ref: ${refs.Tinkar}%`
  document.getElementById("refColorante").innerText = `Ref: ${refs.Colorante}%`

  aplicarRefs(refs, checked)
  calcular()
}

// ─────────────────────────────────────────────
// TOGGLE COLORANTE
// ─────────────────────────────────────────────

function toggleColorante(){
  const checked = document.getElementById("checkColorante").checked
  document.getElementById("controlColorante").classList.toggle("oculto", !checked)

  if(!checked){
    setValor("Colorante", 0)
  } else {
    const conFeldes = document.getElementById("checkFeldespato").checked
    const refKey    = conFeldes ? "conFeldespato" : "sinFeldespato"
    setValor("Colorante", REFS[tipoActual][refKey].Colorante)
  }
  calcular()
}

// ─────────────────────────────────────────────
// APLICAR REFS
// ─────────────────────────────────────────────

function aplicarRefs(refs, conFeldespato){
  setValor("Tinkar", refs.Tinkar)
  setValor("Flux",   refs.Flux)
  if(document.getElementById("checkColorante").checked) setValor("Colorante",  refs.Colorante)
  if(conFeldespato) setValor("Feldespato", refs.Feldespato)
}

function setValor(nombre, valor){
  const slider = document.getElementById("slider" + nombre)
  const input  = document.getElementById("input"  + nombre)
  if(slider) slider.value = valor
  if(input)  input.value  = valor
}

// ─────────────────────────────────────────────
// SINCRONIZAR
// ─────────────────────────────────────────────

function sincronizarInput(nombre){
  const s = document.getElementById("slider" + nombre)
  const i = document.getElementById("input"  + nombre)
  if(s && i) i.value = s.value
}

function sincronizarSlider(nombre){
  const s = document.getElementById("slider" + nombre)
  const i = document.getElementById("input"  + nombre)
  if(s && i) s.value = i.value
}

// ─────────────────────────────────────────────
// CALCULAR
// ─────────────────────────────────────────────

function obtenerComponentes(){
  const total     = parseFloat(document.getElementById("totalGramos").value) || 0
  const conFeldes = document.getElementById("checkFeldespato").checked
  const conColor  = document.getElementById("checkColorante").checked

  const pctTinkar     = parseFloat(document.getElementById("inputTinkar").value)     || 0
  const pctFlux       = parseFloat(document.getElementById("inputFlux").value)       || 0
  const pctColorante  = conColor  ? (parseFloat(document.getElementById("inputColorante").value)  || 0) : 0
  const pctFeldespato = conFeldes ? (parseFloat(document.getElementById("inputFeldespato").value) || 0) : 0

  const componentes = [{ nombre: "Tinkar", emoji: "🟤", pct: pctTinkar }]
  componentes.push({ nombre: "Flux", emoji: "⚪", pct: pctFlux })

  if(conColor){
    componentes.push({
      nombre: tipoActual === "oxido" ? "Óxido"    : "Pigmento",
      emoji:  tipoActual === "oxido" ? "🔴"        : "🎨",
      pct: pctColorante
    })
  }

  if(conFeldes) componentes.push({ nombre: "Feldespato", emoji: "🪨", pct: pctFeldespato })

  return { total, componentes, suma: pctTinkar + pctFlux + pctColorante + pctFeldespato }
}

function calcular(){
  const { total, componentes, suma } = obtenerComponentes()

  const barra = document.getElementById("totalBarra")
  barra.style.width = Math.min(suma, 100) + "%"
  barra.classList.toggle("excede", suma > 100)

  document.getElementById("totalPct").innerText = suma + "%"

  const aviso = document.getElementById("totalAviso")
  if(suma === 100){
    aviso.innerText = "✓ Perfecto"
    aviso.className = "total-aviso ok"
  } else if(suma < 100){
    aviso.innerText = `Falta ${100 - suma}% — completá con Tinkar`
    aviso.className = "total-aviso"
  } else {
    aviso.innerText = `Excede en ${suma - 100}%`
    aviso.className = "total-aviso"
  }

  const grid = document.getElementById("resultadoGrid")
  grid.innerHTML = ""

  componentes.forEach(c => {
    const gramos = ((c.pct / 100) * total).toFixed(1)
    const item   = document.createElement("div")
    item.className = "resultado-item"
    item.innerHTML = `
      <div class="resultado-nombre">${c.emoji} ${c.nombre}</div>
      <div class="resultado-gramos">${gramos}g</div>
      <div class="resultado-pct">${c.pct}%</div>
    `
    grid.appendChild(item)
  })
}

// ─────────────────────────────────────────────
// GUARDAR EN HISTORIAL
// ─────────────────────────────────────────────

function guardarFormula(){
  const nombre = document.getElementById("nombreFormula").value.trim()
  if(!nombre){
    alert("Poné un nombre a la fórmula antes de guardar.")
    document.getElementById("nombreFormula").focus()
    return
  }

  const { total, componentes, suma } = obtenerComponentes()

  const formula = {
    id:          Date.now(),
    nombre,
    tipo:        tipoActual,
    total,
    suma,
    componentes: componentes.map(c => ({
      nombre: c.nombre,
      emoji:  c.emoji,
      pct:    c.pct,
      gramos: ((c.pct / 100) * total).toFixed(1)
    })),
    fecha: new Date().toLocaleDateString("es-AR")
  }

  historial.unshift(formula)
  localStorage.setItem("engobes_historial", JSON.stringify(historial))
  renderizarHistorial()

  const btn = document.querySelector(".btn-guardar")
  btn.innerHTML = "✓ Guardado"
  setTimeout(() => {
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar en historial'
  }, 2000)
}

// ─────────────────────────────────────────────
// RENDERIZAR HISTORIAL
// ─────────────────────────────────────────────

function renderizarHistorial(){
  const lista  = document.getElementById("historialLista")
  const btnPDF = document.getElementById("btnPDF")
  const btnLim = document.getElementById("btnLimpiar")

  lista.innerHTML = ""

  if(historial.length === 0){
    lista.innerHTML = '<p class="historial-vacio">Guardá una fórmula para verla aquí.</p>'
    btnPDF.disabled = true
    btnLim.style.display = "none"
    return
  }

  btnPDF.disabled = false
  btnLim.style.display = "inline-flex"

  historial.forEach(f => {
    const item = document.createElement("div")
    item.className = "historial-item"
    item.innerHTML = `
      <button class="historial-item-borrar" onclick="borrarFormula(${f.id})">✕</button>
      <div class="historial-item-nombre">${f.nombre}</div>
      <div class="historial-item-meta">${f.tipo === "oxido" ? "Óxidos" : "Pigmentos"} · ${f.total}g · ${f.fecha}</div>
      <div class="historial-item-componentes">
        ${f.componentes.map(c => `<span class="historial-chip">${c.emoji} ${c.nombre}: ${c.gramos}g</span>`).join("")}
      </div>
    `
    lista.appendChild(item)
  })
}

function borrarFormula(id){
  historial = historial.filter(f => f.id !== id)
  localStorage.setItem("engobes_historial", JSON.stringify(historial))
  renderizarHistorial()
}

function limpiarHistorial(){
  if(confirm("¿Borrar todo el historial?")) {
    historial = []
    localStorage.setItem("engobes_historial", JSON.stringify(historial))
    renderizarHistorial()
  }
}

// ─────────────────────────────────────────────
// COPIAR
// ─────────────────────────────────────────────

function copiarResultado(){
  const { total, componentes } = obtenerComponentes()
  const nombre = document.getElementById("nombreFormula").value.trim() || "Sin nombre"
  const tipo   = tipoActual === "oxido" ? "Óxidos" : "Pigmentos"

  let texto = `YCA Cerámica — Laboratorio de Engobes\n`
  texto += `Fórmula: ${nombre}\nTipo: ${tipo} | Total: ${total}g\n`
  texto += `─────────────────────\n`
  componentes.forEach(c => {
    texto += `${c.nombre}: ${((c.pct/100)*total).toFixed(1)}g (${c.pct}%)\n`
  })

  navigator.clipboard.writeText(texto).then(() => {
    const btn = document.querySelector(".btn-copiar")
    btn.innerText = "✓ Copiado"
    setTimeout(() => {
      btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar'
    }, 2000)
  })
}

// ─────────────────────────────────────────────
// CARGAR LOGO COMO BASE64
// ─────────────────────────────────────────────

function cargarLogoBase64(){
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width  = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL("image/png"))
    }
    img.onerror = () => resolve(null)
    img.src = "../imagenes/logo.png"
  })
}

// ─────────────────────────────────────────────
// DESCARGAR PDF
// ─────────────────────────────────────────────

async function descargarPDF(){
  if(historial.length === 0) return

  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  const W      = 210
  const margen = 18
  let y        = 0

  const MARRON     = [139, 111, 86]
  const MARRON_OSC = [101, 78,  58]
  const GRIS_CLARO = [245, 240, 235]
  const BLANCO     = [255, 255, 255]
  const NEGRO      = [40,  35,  30]

  // ── ENCABEZADO ──
  doc.setFillColor(...MARRON)
  doc.rect(0, 0, W, 40, "F")

  // Logo real
  const logoBase64 = await cargarLogoBase64()
  if(logoBase64){
    // Círculo de fondo
    doc.setFillColor(...MARRON_OSC)
    doc.circle(margen + 10, 20, 11, "F")
    // Logo PNG recortado dentro del círculo
    doc.addImage(logoBase64, "PNG", margen + 1, 10, 18, 18)
  } else {
    // Fallback texto
    doc.setFillColor(...MARRON_OSC)
    doc.circle(margen + 10, 20, 11, "F")
    doc.setTextColor(...BLANCO)
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text("YCA", margen + 6, 21)
  }

  // Título
  doc.setTextColor(...BLANCO)
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("YCA Cerámica", margen + 26, 17)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Laboratorio de Engobes", margen + 26, 24)

  doc.setFontSize(8)
  doc.text("instagram: @ycaceramica   |   tiktok: @yca.ceramica   |   youtube: @YCACeramica", margen + 26, 31)

  const fecha = new Date().toLocaleDateString("es-AR", { day:"2-digit", month:"long", year:"numeric" })
  doc.text(`Generado: ${fecha}`, W - margen, 36, { align: "right" })

  y = 50

  // ── FÓRMULAS ──
  historial.forEach((f, idx) => {

    const altoEstimado = 16 + 24 + 12
    if(y + altoEstimado > 272){
      doc.addPage()
      y = 20
    }

    // Tarjeta fondo
    doc.setFillColor(...GRIS_CLARO)
    doc.roundedRect(margen, y, W - margen * 2, altoEstimado, 4, 4, "F")

    // Número — círculo bien centrado
    const numX = margen + 7
    const numY = y + 9
    doc.setFillColor(...MARRON)
    doc.circle(numX, numY, 5.5, "F")
    doc.setTextColor(...BLANCO)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    // Centrado exacto: text con align center sobre el círculo
    doc.text(String(idx + 1), numX, numY + 3, { align: "center" })

    // Nombre
    doc.setTextColor(...NEGRO)
    doc.setFontSize(13)
    doc.setFont("helvetica", "bold")
    doc.text(f.nombre, margen + 16, y + 9)

    // Meta
    const tipo = f.tipo === "oxido" ? "Oxidos" : "Pigmentos"
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(120, 110, 100)
    doc.text(`${tipo}  |  ${f.total}g totales  |  ${f.fecha}`, margen + 16, y + 15)

    y += 20

    // Componentes
    const n    = f.componentes.length
    const colW = (W - margen * 2 - (n - 1) * 3) / n

    f.componentes.forEach((c, ci) => {
      const x = margen + ci * (colW + 3)

      doc.setFillColor(...BLANCO)
      doc.roundedRect(x, y, colW, 14, 2, 2, "F")

      const cx = x + colW / 2

      doc.setTextColor(120, 110, 100)
      doc.setFontSize(6.5)
      doc.setFont("helvetica", "bold")
      doc.text(c.nombre.toUpperCase(), cx, y + 4.5, { align: "center" })

      doc.setTextColor(...MARRON)
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text(`${c.gramos}g`, cx, y + 10, { align: "center" })

      doc.setTextColor(160, 150, 140)
      doc.setFontSize(6.5)
      doc.setFont("helvetica", "normal")
      doc.text(`${c.pct}%`, cx, y + 13.5, { align: "center" })
    })

    y += 18
  })

  // ── PIE ──
  doc.setFillColor(...GRIS_CLARO)
  doc.rect(0, 287, W, 10, "F")
  doc.setTextColor(160, 150, 140)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text("ycaceramica.github.io  |  YCA Cerámica © 2026", W / 2, 293, { align: "center" })

  doc.save("YCA_Ceramica_Engobes.pdf")
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

calcular()
renderizarHistorial()
