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
const nav         = document.getElementById("nav")

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

let modoActual = "estandar"
let historial  = JSON.parse(localStorage.getItem("contraccion_historial") || "[]")
let perfiles   = JSON.parse(localStorage.getItem("contraccion_perfiles")  || "[]")

// ─────────────────────────────────────────────
// INFO COLAPSABLE
// ─────────────────────────────────────────────

function toggleInfo(){
  const content  = document.getElementById("infoContent")
  const chevron  = document.getElementById("infoChevron")
  const visible  = content.style.display !== "none"
  content.style.display = visible ? "none" : "block"
  chevron.style.transform = visible ? "rotate(0deg)" : "rotate(180deg)"
}

// ─────────────────────────────────────────────
// MODO
// ─────────────────────────────────────────────

function setModo(modo){
  modoActual = modo
  document.getElementById("btnEstandar").classList.toggle("activo",     modo === "estandar")
  document.getElementById("btnPersonalizado").classList.toggle("activo", modo === "personalizado")
  document.getElementById("seccionEstandar").style.display      = modo === "estandar"     ? "block" : "none"
  document.getElementById("seccionPersonalizado").style.display = modo === "personalizado" ? "block" : "none"
}

// ─────────────────────────────────────────────
// MODO ESTÁNDAR
// ─────────────────────────────────────────────

function calcularEstandar(){
  const crudo = parseFloat(document.getElementById("medidaCrudo").value)
  if(!crudo || crudo <= 0){
    document.getElementById("resultadoEstandar").style.display = "none"
    return
  }

  const contraccion = 10
  const bizcocho    = crudo * (1 - contraccion / 100)

  document.getElementById("resCrudo").innerText      = crudo.toFixed(2)
  document.getElementById("resBizcocho").innerText   = bizcocho.toFixed(2)
  document.getElementById("resContraccion").innerText = contraccion

  document.getElementById("resultadoEstandar").style.display = "block"
}

function guardarEstandar(){
  const crudo = parseFloat(document.getElementById("medidaCrudo").value)
  if(!crudo || crudo <= 0){ alert("Ingresá una medida válida"); return }

  const bizcocho = crudo * 0.9

  const item = {
    id:         Date.now(),
    modo:       "estandar",
    crudo:      crudo.toFixed(2),
    bizcocho:   bizcocho.toFixed(2),
    contraccion: 10,
    fecha:      new Date().toLocaleDateString("es-AR")
  }

  historial.unshift(item)
  localStorage.setItem("contraccion_historial", JSON.stringify(historial))
  renderizarHistorial()
  flashBtn(".btn-guardar", "✓ Guardado", '<i class="fa-solid fa-floppy-disk"></i> Guardar en historial')
}

function copiarEstandar(){
  const crudo    = document.getElementById("resCrudo").innerText
  const bizcocho = document.getElementById("resBizcocho").innerText
  navigator.clipboard.writeText(`Crudo: ${crudo} cm → Bizcocho: ${bizcocho} cm (contracción 10%)`)
    .then(() => flashBtn(".btn-copiar", "✓ Copiado", '<i class="fa-regular fa-copy"></i> Copiar'))
}

// ─────────────────────────────────────────────
// MODO PERSONALIZADO
// ─────────────────────────────────────────────

function calcularPersonalizado(){
  const cuero    = parseFloat(document.getElementById("medidaCuero").value)
  const hueso    = parseFloat(document.getElementById("medidaHueso").value)
  const bizcocho = parseFloat(document.getElementById("medidaBizcochoP").value)

  if(!cuero || !hueso || !bizcocho || cuero <= 0){
    document.getElementById("resultadoPersonalizado").style.display = "none"
    return
  }

  const contTotal = ((cuero - bizcocho) / cuero * 100)
  const contCuero = ((cuero - hueso)    / cuero * 100)
  const contHueso = ((hueso - bizcocho) / hueso * 100)

  document.getElementById("pCuero").innerText    = cuero.toFixed(2)
  document.getElementById("pHueso").innerText    = hueso.toFixed(2)
  document.getElementById("pBizcocho").innerText = bizcocho.toFixed(2)
  document.getElementById("pContTotal").innerText = contTotal.toFixed(2)
  document.getElementById("pContCuero").innerText = contCuero.toFixed(2)
  document.getElementById("pContHueso").innerText = contHueso.toFixed(2)

  document.getElementById("resultadoPersonalizado").style.display = "block"
}

function guardarPersonalizado(){
  const cuero    = parseFloat(document.getElementById("medidaCuero").value)
  const hueso    = parseFloat(document.getElementById("medidaHueso").value)
  const bizcocho = parseFloat(document.getElementById("medidaBizcochoP").value)

  if(!cuero || !hueso || !bizcocho){ alert("Completá las 3 medidas"); return }

  const contTotal = ((cuero - bizcocho) / cuero * 100).toFixed(2)
  const perfilSel = document.getElementById("selectPerfil")
  const perfilNombre = perfilSel.value
    ? perfiles.find(p => p.id === parseInt(perfilSel.value))?.nombre || ""
    : ""

  const item = {
    id:          Date.now(),
    modo:        "personalizado",
    perfil:      perfilNombre,
    cuero:       cuero.toFixed(2),
    hueso:       hueso.toFixed(2),
    bizcocho:    bizcocho.toFixed(2),
    contraccion: contTotal,
    fecha:       new Date().toLocaleDateString("es-AR")
  }

  historial.unshift(item)
  localStorage.setItem("contraccion_historial", JSON.stringify(historial))
  renderizarHistorial()
  flashBtn("#resultadoPersonalizado .btn-guardar", "✓ Guardado", '<i class="fa-solid fa-floppy-disk"></i> Guardar en historial')
}

function copiarPersonalizado(){
  const cuero    = document.getElementById("pCuero").innerText
  const hueso    = document.getElementById("pHueso").innerText
  const bizcocho = document.getElementById("pBizcocho").innerText
  const cont     = document.getElementById("pContTotal").innerText
  navigator.clipboard.writeText(`Cuero: ${cuero} cm | Hueso: ${hueso} cm | Bizcocho: ${bizcocho} cm | Contracción total: ${cont}%`)
    .then(() => flashBtn("#resultadoPersonalizado .btn-copiar", "✓ Copiado", '<i class="fa-regular fa-copy"></i> Copiar'))
}

// ─────────────────────────────────────────────
// PERFILES DE ARCILLA
// ─────────────────────────────────────────────

function renderizarPerfiles(){
  const sel = document.getElementById("selectPerfil")
  const valorActual = sel.value
  sel.innerHTML = '<option value="">— Nuevo perfil —</option>'
  perfiles.forEach(p => {
    const opt = document.createElement("option")
    opt.value = p.id
    opt.textContent = `${p.nombre} (${p.contraccion}%)`
    sel.appendChild(opt)
  })
  if(valorActual) sel.value = valorActual
  document.getElementById("btnBorrarPerfil").style.display = sel.value ? "inline-flex" : "none"
}

function cargarPerfil(){
  const sel = document.getElementById("selectPerfil")
  const id  = parseInt(sel.value)
  document.getElementById("btnBorrarPerfil").style.display = sel.value ? "inline-flex" : "none"
  if(!id) return
  const perfil = perfiles.find(p => p.id === id)
  if(!perfil) return
  document.getElementById("medidaCuero").value     = perfil.cuero
  document.getElementById("medidaHueso").value     = perfil.hueso
  document.getElementById("medidaBizcochoP").value = perfil.bizcocho
  calcularPersonalizado()
}

function guardarPerfil(){
  const cuero    = parseFloat(document.getElementById("medidaCuero").value)
  const hueso    = parseFloat(document.getElementById("medidaHueso").value)
  const bizcocho = parseFloat(document.getElementById("medidaBizcochoP").value)
  const nombre   = document.getElementById("nombrePerfil").value.trim()

  if(!cuero || !hueso || !bizcocho){ alert("Completá las 3 medidas"); return }
  if(!nombre){ alert("Poné un nombre al perfil"); return }

  const contraccion = ((cuero - bizcocho) / cuero * 100).toFixed(2)

  const perfil = { id: Date.now(), nombre, cuero, hueso, bizcocho, contraccion }
  perfiles.push(perfil)
  localStorage.setItem("contraccion_perfiles", JSON.stringify(perfiles))
  renderizarPerfiles()
  document.getElementById("selectPerfil").value = perfil.id
  document.getElementById("nombrePerfil").value = ""
  document.getElementById("btnBorrarPerfil").style.display = "inline-flex"
  alert(`Perfil "${nombre}" guardado ✓`)
}

function borrarPerfilSeleccionado(){
  const id = parseInt(document.getElementById("selectPerfil").value)
  if(!id) return
  const perfil = perfiles.find(p => p.id === id)
  if(!confirm(`¿Borrar el perfil "${perfil?.nombre}"?`)) return
  perfiles = perfiles.filter(p => p.id !== id)
  localStorage.setItem("contraccion_perfiles", JSON.stringify(perfiles))
  renderizarPerfiles()
  document.getElementById("medidaCuero").value     = ""
  document.getElementById("medidaHueso").value     = ""
  document.getElementById("medidaBizcochoP").value = ""
  document.getElementById("resultadoPersonalizado").style.display = "none"
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
    btnPDF.disabled      = true
    btnLim.style.display = "none"
    return
  }

  btnPDF.disabled      = false
  btnLim.style.display = "inline-flex"

  historial.forEach(item => {
    const div = document.createElement("div")
    div.className = "historial-item"

    if(item.modo === "estandar"){
      div.innerHTML = `
        <button class="historial-item-borrar" onclick="borrarItem(${item.id})">✕</button>
        <div class="historial-item-tipo">📏 Estándar · 10% contracción</div>
        <div class="historial-item-valores">
          <span class="historial-chip">Crudo: ${item.crudo} cm</span>
          <span class="historial-chip">🔥 Bizcocho: ${item.bizcocho} cm</span>
        </div>
        <div class="historial-item-meta">${item.fecha}</div>
      `
    } else {
      div.innerHTML = `
        <button class="historial-item-borrar" onclick="borrarItem(${item.id})">✕</button>
        <div class="historial-item-tipo">🎯 Personalizado${item.perfil ? ` · ${item.perfil}` : ""}</div>
        <div class="historial-item-valores">
          <span class="historial-chip">🌿 ${item.cuero} cm</span>
          <span class="historial-chip">🦴 ${item.hueso} cm</span>
          <span class="historial-chip">🔥 ${item.bizcocho} cm</span>
          <span class="historial-chip">📉 ${item.contraccion}%</span>
        </div>
        <div class="historial-item-meta">${item.fecha}</div>
      `
    }
    lista.appendChild(div)
  })
}

function borrarItem(id){
  historial = historial.filter(i => i.id !== id)
  localStorage.setItem("contraccion_historial", JSON.stringify(historial))
  renderizarHistorial()
}

function limpiarHistorial(){
  if(confirm("¿Borrar todo el historial?")){ 
    historial = []
    localStorage.setItem("contraccion_historial", JSON.stringify(historial))
    renderizarHistorial()
  }
}

// ─────────────────────────────────────────────
// HELPER FLASH BOTÓN
// ─────────────────────────────────────────────

function flashBtn(selector, textoOn, textoOff){
  const btn = document.querySelector(selector)
  if(!btn) return
  btn.innerHTML = textoOn
  setTimeout(() => { btn.innerHTML = textoOff }, 2000)
}

// ─────────────────────────────────────────────
// CARGAR LOGO
// ─────────────────────────────────────────────

function cargarLogoBase64(){
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width  = img.width
      canvas.height = img.height
      canvas.getContext("2d").drawImage(img, 0, 0)
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
  const GRIS_CLARO = [245, 240, 235]
  const BLANCO     = [255, 255, 255]
  const NEGRO      = [40,  35,  30]

  // ENCABEZADO
  doc.setFillColor(...MARRON)
  doc.rect(0, 0, W, 40, "F")

  const logoBase64 = await cargarLogoBase64()
  if(logoBase64) doc.addImage(logoBase64, "PNG", margen, 8, 22, 22)

  doc.setTextColor(...BLANCO)
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("YCA Ceramica", margen + 28, 17)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Calculadora de Contraccion", margen + 28, 24)

  doc.setFontSize(8)
  doc.text("instagram: @ycaceramica   |   tiktok: @yca.ceramica   |   youtube: @YCACeramica", margen + 28, 31)

  const fecha = new Date().toLocaleDateString("es-AR", { day:"2-digit", month:"long", year:"numeric" })
  doc.text(`Generado: ${fecha}`, W - margen, 36, { align: "right" })

  y = 50

  historial.forEach((item, idx) => {
    const esPersonalizado = item.modo === "personalizado"
    const altoEstimado    = esPersonalizado ? 42 : 32

    if(y + altoEstimado > 272){ doc.addPage(); y = 20 }

    doc.setFillColor(...GRIS_CLARO)
    doc.roundedRect(margen, y, W - margen * 2, altoEstimado, 4, 4, "F")

    doc.setTextColor(...MARRON)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(`#${idx + 1}`, margen + 5, y + 9)

    const titulo = esPersonalizado
      ? `Personalizado${item.perfil ? " · " + item.perfil : ""}`
      : "Estandar · 10% contraccion"

    doc.setTextColor(...NEGRO)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(titulo, margen + 18, y + 9)

    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(120, 110, 100)
    doc.text(item.fecha, W - margen - 5, y + 9, { align: "right" })

    if(esPersonalizado){
      const colW = (W - margen * 2 - 12) / 3

      const campos = [
        { label: "CUERO",    valor: item.cuero    + " cm" },
        { label: "HUESO",    valor: item.hueso    + " cm" },
        { label: "BIZCOCHO", valor: item.bizcocho + " cm" }
      ]
      campos.forEach((c, i) => {
        const x = margen + i * (colW + 6)
        doc.setFillColor(...BLANCO)
        doc.roundedRect(x, y + 14, colW, 11, 2, 2, "F")
        doc.setTextColor(120, 110, 100)
        doc.setFontSize(7)
        doc.setFont("helvetica", "bold")
        doc.text(c.label, x + 4, y + 19)
        doc.setTextColor(...MARRON)
        doc.setFontSize(10)
        doc.text(c.valor, x + 4, y + 24)
      })

      doc.setFillColor(...BLANCO)
      doc.roundedRect(margen, y + 28, W - margen * 2, 11, 2, 2, "F")
      doc.setTextColor(120, 110, 100)
      doc.setFontSize(7)
      doc.setFont("helvetica", "bold")
      doc.text("CONTRACCION TOTAL", margen + 8, y + 33)
      doc.setTextColor(...MARRON)
      doc.setFontSize(11)
      doc.text(`${item.contraccion}%`, margen + 55, y + 33)

    } else {
      const colW = (W - margen * 2 - 6) / 2

      doc.setFillColor(...BLANCO)
      doc.roundedRect(margen, y + 14, colW, 11, 2, 2, "F")
      doc.setTextColor(120, 110, 100)
      doc.setFontSize(7)
      doc.setFont("helvetica", "bold")
      doc.text("CRUDO", margen + 8, y + 19)
      doc.setTextColor(...MARRON)
      doc.setFontSize(11)
      doc.text(`${item.crudo} cm`, margen + 25, y + 19)

      doc.setFillColor(...BLANCO)
      doc.roundedRect(margen + colW + 6, y + 14, colW, 11, 2, 2, "F")
      doc.setTextColor(120, 110, 100)
      doc.setFontSize(7)
      doc.setFont("helvetica", "bold")
      doc.text("BIZCOCHO", margen + colW + 14, y + 19)
      doc.setTextColor(...MARRON)
      doc.setFontSize(11)
      doc.text(`${item.bizcocho} cm`, margen + colW + 35, y + 19)
    }

    y += altoEstimado + 6
  })

  // PIE
  doc.setFillColor(...GRIS_CLARO)
  doc.rect(0, 287, W, 10, "F")
  doc.setTextColor(160, 150, 140)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text("ycaceramica.github.io  |  YCA Ceramica © 2026", W / 2, 293, { align: "center" })

  doc.save("YCA_Ceramica_Contraccion.pdf")
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

renderizarHistorial()
renderizarPerfiles()
