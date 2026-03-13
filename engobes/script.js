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

  document.getElementById("nombreColorante").innerHTML = tipo === "oxido"
    ? "🔴 Óxido"
    : "🎨 Pigmento"

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

  const componentes = [
    { nombre: "Tinkar",    emoji: "🟤", pct: pctTinkar }
  ]
  componentes.push({ nombre: "Flux", emoji: "⚪", pct: pctFlux })

  if(conColor){
    const n = tipoActual === "oxido" ? "Óxido" : "Pigmento"
    const e = tipoActual === "oxido" ? "🔴"    : "🎨"
    componentes.push({ nombre: n, emoji: e, pct: pctColorante })
  }

  if(conFeldes){
    componentes.push({ nombre: "Feldespato", emoji: "🪨", pct: pctFeldespato })
  }

  return { total, componentes, suma: pctTinkar + pctFlux + pctColorante + pctFeldespato }
}

function calcular(){
  const { total, componentes, suma } = obtenerComponentes()

  // Barra
  const barra = document.getElementById("totalBarra")
  barra.style.width = Math.min(suma, 100) + "%"
  barra.classList.toggle("excede", suma > 100)

  document.getElementById("totalPct").innerText = suma + "%"

  const aviso = document.getElementById("totalAviso")
  if(suma === 100){
    aviso.innerText   = "✓ Perfecto"
    aviso.className   = "total-aviso ok"
  } else if(suma < 100){
    aviso.innerText   = `Falta ${100 - suma}% — completá con Tinkar`
    aviso.className   = "total-aviso"
  } else {
    aviso.innerText   = `Excede en ${suma - 100}%`
    aviso.className   = "total-aviso"
  }

  // Resultado
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
    nombre:      nombre,
    tipo:        tipoActual,
    total:       total,
    suma:        suma,
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
  btn.innerText = "✓ Guardado"
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
  texto += `Fórmula: ${nombre}\n`
  texto += `Tipo: ${tipo} | Total: ${total}g\n`
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
// DESCARGAR PDF
// ─────────────────────────────────────────────

async function descargarPDF(){
  if(historial.length === 0) return

  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  const W = 210
  const margen = 18
  let y = 0

  // Colores
  const MARRON     = [139, 111, 86]
  const MARRON_OSC = [101, 78, 58]
  const GRIS_CLARO = [245, 240, 235]
  const GRIS_MED   = [200, 190, 178]
  const BLANCO     = [255, 255, 255]
  const NEGRO      = [40, 35, 30]

  // ── ENCABEZADO ──
  doc.setFillColor(...MARRON)
  doc.rect(0, 0, W, 38, "F")

  // Logo círculo
  doc.setFillColor(...MARRON_OSC)
  doc.circle(margen + 10, 19, 10, "F")
  doc.setTextColor(...BLANCO)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("YCA", margen + 6.5, 20)

  // Título
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("YCA Cerámica", margen + 26, 16)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Laboratorio de Engobes", margen + 26, 23)

  // Redes
  doc.setFontSize(8)
  doc.text("instagram: @ycaceramica   |   tiktok: @yca.ceramica   |   youtube: @YCACeramica", margen + 26, 30)

  // Fecha
  const fecha = new Date().toLocaleDateString("es-AR", { day:"2-digit", month:"long", year:"numeric" })
  doc.setFontSize(8)
  doc.text(`Generado: ${fecha}`, W - margen, 34, { align: "right" })

  y = 48

  // ── FÓRMULAS ──
  historial.forEach((f, idx) => {

    // Verificar salto de página
    const altoEstimado = 14 + f.componentes.length * 8 + 10
    if(y + altoEstimado > 270){
      doc.addPage()
      y = 20
    }

    // Fondo de tarjeta
    doc.setFillColor(...GRIS_CLARO)
    doc.roundedRect(margen, y, W - margen * 2, altoEstimado, 4, 4, "F")

    // Número
    doc.setFillColor(...MARRON)
    doc.circle(margen + 6, y + 6, 5, "F")
    doc.setTextColor(...BLANCO)
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text(String(idx + 1), margen + 4.5, y + 8)

    // Nombre fórmula
    doc.setTextColor(...NEGRO)
    doc.setFontSize(13)
    doc.setFont("helvetica", "bold")
    doc.text(f.nombre, margen + 14, y + 8)

    // Meta
    const tipo = f.tipo === "oxido" ? "Oxidos" : "Pigmentos"
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(120, 110, 100)
    doc.text(`${tipo}  |  ${f.total}g totales  |  ${f.fecha}`, margen + 14, y + 14)

    y += 20

    // Componentes
    const colW = (W - margen * 2 - 10) / f.componentes.length

    f.componentes.forEach((c, ci) => {
      const x = margen + 5 + ci * (colW + 2)

      // Caja componente
      doc.setFillColor(...BLANCO)
      doc.roundedRect(x, y, colW, 20, 3, 3, "F")

      // Nombre
      doc.setTextColor(120, 110, 100)
      doc.setFontSize(7)
      doc.setFont("helvetica", "bold")
      doc.text(c.nombre.toUpperCase(), x + colW / 2, y + 6, { align: "center" })

      // Gramos
      doc.setTextColor(...MARRON)
      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.text(`${c.gramos}g`, x + colW / 2, y + 13, { align: "center" })

      // Porcentaje
      doc.setTextColor(160, 150, 140)
      doc.setFontSize(7)
      doc.setFont("helvetica", "normal")
      doc.text(`${c.pct}%`, x + colW / 2, y + 18, { align: "center" })
    })

    y += 26
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
