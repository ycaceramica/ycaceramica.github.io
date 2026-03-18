// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────
const API = "https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec"

// ─────────────────────────────────────────────
// MODO OSCURO Y HAMBURGUESA
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
document.getElementById("toggleDark")?.addEventListener("click", () => {
  document.body.classList.toggle("dark")
  localStorage.setItem("dark", document.body.classList.contains("dark"))
  actualizarIcono()
})
document.getElementById("hamburguesa")?.addEventListener("click", () => document.getElementById("nav").classList.toggle("active"))
document.querySelectorAll(".nav a").forEach(l => l.addEventListener("click", () => document.getElementById("nav").classList.remove("active")))
window.addEventListener("scroll", () => document.getElementById("nav")?.classList.remove("active"))

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
// ESTADO
// ─────────────────────────────────────────────
let pastasData    = []
let pastaActiva   = null
let historial     = JSON.parse(localStorage.getItem("pastas_historial") || "[]")
let tabActual     = "catalogo"
let accesoLibre   = true
let modalCallback = null

// ─────────────────────────────────────────────
// MODAL GENÉRICO
// ─────────────────────────────────────────────
function mostrarModal({ titulo, texto, confirmar, accion, cancelar = true }){
  document.getElementById("contModalTitulo").innerText = titulo
  document.getElementById("contModalTexto").innerText  = texto
  const btnC = document.getElementById("contModalConfirmar")
  const btnX = document.getElementById("contModalCancelar")
  btnC.innerText = confirmar
  btnX.style.display = cancelar ? "inline-flex" : "none"
  modalCallback = accion || null
  btnC.onclick = () => { const cb = modalCallback; cerrarModal(); if(cb) cb() }
  document.getElementById("contModal").style.display = "flex"
}
function cerrarModal(){
  document.getElementById("contModal").style.display = "none"
  modalCallback = null
}

// ─────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────
function setTab(tab){
  tabActual = tab
  document.getElementById("seccionCatalogo").style.display = tab === "catalogo" ? "block" : "none"
  document.getElementById("seccionLibre").style.display    = tab === "libre"    ? "block" : "none"
  document.getElementById("tabCatalogo").classList.toggle("activo", tab === "catalogo")
  document.getElementById("tabLibre").classList.toggle("activo",    tab === "libre")

  if(tab === "libre") verificarAccesoLibre()
}

// ─────────────────────────────────────────────
// ACCESO CALCULADORA LIBRE
// ─────────────────────────────────────────────
function verificarAccesoLibre(){
  const aviso = document.getElementById("avisoAcceso")
  const calc  = document.getElementById("calculadoraLibre")
  if(accesoLibre){
    aviso.style.display = "none"
    calc.style.display  = "block"
  } else {
    // Solo mostrar calculadora si hay sesión ceramista (Fase 3)
    try {
      const s = JSON.parse(localStorage.getItem("ceramista_sesion") || "null")
      if(s && s.token){
        aviso.style.display = "none"
        calc.style.display  = "block"
      } else {
        aviso.style.display = "flex"
        calc.style.display  = "none"
      }
    } catch(e){
      aviso.style.display = "flex"
      calc.style.display  = "none"
    }
  }
}

// ─────────────────────────────────────────────
// CARGAR CATÁLOGO
// ─────────────────────────────────────────────
async function cargarPastas(){
  const estado = document.getElementById("estadoCatalogo")
  const grid   = document.getElementById("pastasGrid")
  try {
    const [resPastas, resConfig] = await Promise.all([
      fetch(`${API}?action=getPastas`),
      fetch(`${API}?action=getConfigIndex`)
    ])
    const dataPastas  = await resPastas.json()
    const dataConfig  = await resConfig.json()
    pastasData  = dataPastas.data || []
    accesoLibre = String(dataConfig.data?.pastas_acceso_libre ?? 'true') !== 'false'

    estado.style.display = "none"
    if(pastasData.length === 0){
      grid.innerHTML = '<p class="pastas-vacio">Próximamente — estamos preparando las fórmulas 🫙</p>'
      return
    }
    renderPastas(pastasData)
  } catch(e){
    estado.innerHTML = '<p style="opacity:0.5">Error al cargar. Revisá tu conexión.</p>'
  }
}

function renderPastas(pastas){
  const grid = document.getElementById("pastasGrid")
  grid.innerHTML = ""
  pastas.forEach(pasta => {
    let comps = []
    try { comps = JSON.parse(pasta.componentes || "[]") } catch(e){}
    const card = document.createElement("div")
    card.className = "pasta-card"
    card.onclick = () => abrirPastaModal(pasta)
    card.innerHTML = `
      <div class="pasta-card-foto">
        ${pasta.foto
          ? `<img src="${pasta.foto}" alt="${pasta.nombre}" loading="lazy">`
          : `<div class="pasta-card-foto-placeholder"><i class="fa-solid fa-mortar-pestle"></i></div>`}
      </div>
      <div class="pasta-card-body">
        <h3 class="pasta-card-nombre">${pasta.nombre}</h3>
        ${pasta.descripcion ? `<p class="pasta-card-desc">${pasta.descripcion}</p>` : ""}
        <div class="pasta-card-chips">
          ${comps.slice(0,3).map(c => `<span class="pasta-chip">${c.nombre} ${c.porcentaje}%</span>`).join("")}
          ${comps.length > 3 ? `<span class="pasta-chip pasta-chip-mas">+${comps.length - 3} más</span>` : ""}
        </div>
        <div class="pasta-card-cta">Ver fórmula y calcular →</div>
      </div>
    `
    grid.appendChild(card)
  })
}

// ─────────────────────────────────────────────
// MODAL PASTA CATÁLOGO
// ─────────────────────────────────────────────
function abrirPastaModal(pasta){
  pastaActiva = pasta
  let comps = []
  try { comps = JSON.parse(pasta.componentes || "[]") } catch(e){}

  // Foto
  const fotoEl = document.getElementById("pastaModalFoto")
  fotoEl.style.display = pasta.foto ? "block" : "none"
  if(pasta.foto) fotoEl.innerHTML = `<img src="${pasta.foto}" alt="${pasta.nombre}">`

  document.getElementById("pastaModalNombre").innerText = pasta.nombre
  const descEl = document.getElementById("pastaModalDesc")
  descEl.innerText     = pasta.descripcion || ""
  descEl.style.display = pasta.descripcion ? "block" : "none"

  // Tabla de componentes
  const tabla = document.getElementById("pastaModalTabla")
  tabla.innerHTML = `
    <div class="cont-tabla">
      <div class="cont-tabla-header" style="grid-template-columns:1fr 80px"><span>Ingrediente</span><span>%</span></div>
      ${comps.map(c => `
        <div class="cont-tabla-fila" style="grid-template-columns:1fr 80px">
          <span>${c.nombre}</span>
          <span style="font-weight:700;color:var(--color-primario)">${c.porcentaje}%</span>
        </div>`).join("")}
    </div>`

  // Reset calculadora
  document.getElementById("modalGramos").value = ""
  document.getElementById("modalResultadoTabla").style.display = "none"

  // Botón taller
  verificarSesionTaller()

  document.getElementById("pastaModal").style.display = "flex"
  document.body.style.overflow = "hidden"
}

function cerrarPastaModal(){
  document.getElementById("pastaModal").style.display = "none"
  document.body.style.overflow = ""
  pastaActiva = null
}

function modalCalcular(){
  if(!pastaActiva) return
  const gramos = parseFloat(document.getElementById("modalGramos").value) || 0
  const resDiv = document.getElementById("modalResultadoTabla")
  if(!gramos){ resDiv.style.display = "none"; return }

  let comps = []
  try { comps = JSON.parse(pastaActiva.componentes || "[]") } catch(e){}

  const grid = document.getElementById("modalResultadoGrid")
  grid.innerHTML = `
    <div class="cont-tabla-header" style="grid-template-columns:1fr 80px 80px"><span>Ingrediente</span><span>%</span><span>Gramos</span></div>
    ${comps.map(c => {
      const g = Math.round(gramos * c.porcentaje / 100)
      return `<div class="cont-tabla-fila" style="grid-template-columns:1fr 80px 80px">
        <span>${c.nombre}</span>
        <span>${c.porcentaje}%</span>
        <span style="font-weight:700;color:var(--color-primario)">${g} g</span>
      </div>`
    }).join("")}
    <div class="cont-tabla-fila contraccion-total" style="grid-template-columns:1fr 80px">
      <span>Total</span><span>${gramos} g</span>
    </div>`

  resDiv.style.display = "block"
}

function modalGuardar(){
  if(!pastaActiva) return
  const gramos = parseFloat(document.getElementById("modalGramos").value) || 0
  if(!gramos){ mostrarModal({ titulo:"⚠️ Sin datos", texto:"Ingresá los gramos antes de guardar.", confirmar:"Entendido", cancelar:false }); return }
  let comps = []
  try { comps = JSON.parse(pastaActiva.componentes || "[]") } catch(e){}
  historial.unshift({
    id: Date.now(),
    nombre: pastaActiva.nombre,
    tipo: "catalogo",
    gramos,
    componentes: comps.map(c => ({ nombre: c.nombre, porcentaje: c.porcentaje, gramos: Math.round(gramos * c.porcentaje / 100) })),
    fecha: new Date().toLocaleDateString("es-AR")
  })
  guardarHistorial()
  mostrarModal({ titulo:"✅ Guardado", texto:`La pasta "${pastaActiva.nombre}" fue guardada en el historial.`, confirmar:"¡Genial!", cancelar:false })
}

function modalCopiar(){
  if(!pastaActiva) return
  const gramos = parseFloat(document.getElementById("modalGramos").value) || 0
  let comps = []
  try { comps = JSON.parse(pastaActiva.componentes || "[]") } catch(e){}
  let txt = `${pastaActiva.nombre} — ${gramos}g\n`
  comps.forEach(c => { txt += `${c.nombre}: ${Math.round(gramos * c.porcentaje / 100)}g (${c.porcentaje}%)\n` })
  navigator.clipboard.writeText(txt)
}

async function modalDescargarPDF(){
  if(!pastaActiva) return
  const gramos = parseFloat(document.getElementById("modalGramos").value) || 0
  if(!gramos){ mostrarModal({ titulo:"⚠️ Sin datos", texto:"Ingresá los gramos antes de descargar.", confirmar:"Entendido", cancelar:false }); return }
  let comps = []
  try { comps = JSON.parse(pastaActiva.componentes || "[]") } catch(e){}
  const item = {
    nombre: pastaActiva.nombre, tipo: "catalogo", gramos,
    componentes: comps.map(c => ({ nombre: c.nombre, porcentaje: c.porcentaje, gramos: Math.round(gramos * c.porcentaje / 100) })),
    fecha: new Date().toLocaleDateString("es-AR")
  }
  await generarPDFItems([item], `YCA_Ceramica_Pasta_${pastaActiva.nombre.replace(/ /g,"_")}.pdf`)
}

// ─────────────────────────────────────────────
// CALCULADORA LIBRE
// ─────────────────────────────────────────────
function libreAgregarComponente(){
  const cont = document.getElementById("libreComponentes")
  const idx  = cont.children.length
  const div  = document.createElement("div")
  div.className = "pasta-comp-fila"
  div.innerHTML = `
    <input class="pasta-comp-nombre" type="text" placeholder="Ingrediente" oninput="libreRecalcular()">
    <input class="pasta-comp-pct" type="number" min="0" max="100" step="1" placeholder="%" value="0" oninput="libreRecalcular()">
    <span class="pasta-comp-pct-label">%</span>
    <button class="pasta-btn-quitar" onclick="libreQuitarComponente(this)" type="button"><i class="fa-solid fa-xmark"></i></button>
  `
  cont.appendChild(div)
  div.querySelector(".pasta-comp-nombre").focus()
  libreRecalcular()
}

function libreQuitarComponente(btn){
  btn.closest(".pasta-comp-fila").remove()
  libreRecalcular()
  libreCalcular()
}

function libreRecalcular(){
  const comps = libreObtenerComponentes()
  const total = comps.reduce((s, c) => s + c.porcentaje, 0)
  const label = document.getElementById("libreTotalLabel")
  if(!label) return
  if(total === 100){ label.style.color = "#2d7a2d"; label.innerText = "✅ 100%" }
  else             { label.style.color = "#c85028"; label.innerText = `⚠️ ${total}% (falta ${100 - total}%)` }
  libreCalcular()
}

function libreObtenerComponentes(){
  const filas = document.querySelectorAll("#libreComponentes .pasta-comp-fila")
  const comp  = []
  filas.forEach(f => {
    const nombre = f.querySelector(".pasta-comp-nombre")?.value.trim()
    const pct    = parseFloat(f.querySelector(".pasta-comp-pct")?.value) || 0
    if(nombre) comp.push({ nombre, porcentaje: pct })
  })
  return comp
}

function libreCalcular(){
  const gramos = parseFloat(document.getElementById("libreGramos").value) || 0
  const comps  = libreObtenerComponentes()
  const total  = comps.reduce((s, c) => s + c.porcentaje, 0)
  const res    = document.getElementById("libreResultado")
  if(!gramos || total !== 100 || comps.length === 0){ res.style.display = "none"; return }

  const tabla = document.getElementById("libreResultadoTabla")
  tabla.innerHTML = `
    <div class="cont-tabla">
      <div class="cont-tabla-header" style="grid-template-columns:1fr 80px 80px"><span>Ingrediente</span><span>%</span><span>Gramos</span></div>
      ${comps.map(c => {
        const g = Math.round(gramos * c.porcentaje / 100)
        return `<div class="cont-tabla-fila" style="grid-template-columns:1fr 80px 80px">
          <span>${c.nombre}</span>
          <span>${c.porcentaje}%</span>
          <span style="font-weight:700;color:var(--color-primario)">${g} g</span>
        </div>`
      }).join("")}
      <div class="cont-tabla-fila contraccion-total" style="grid-template-columns:1fr 80px">
        <span>Total</span><span>${gramos} g</span>
      </div>
    </div>`
  res.style.display = "block"
}

function libreGuardar(){
  const nombre = document.getElementById("libreNombre").value.trim() || "Pasta personalizada"
  const gramos = parseFloat(document.getElementById("libreGramos").value) || 0
  const comps  = libreObtenerComponentes()
  const total  = comps.reduce((s, c) => s + c.porcentaje, 0)
  if(!gramos){ mostrarModal({ titulo:"⚠️ Sin datos", texto:"Ingresá los gramos antes de guardar.", confirmar:"Entendido", cancelar:false }); return }
  if(total !== 100){ mostrarModal({ titulo:"⚠️ Porcentajes incorrectos", texto:`Los porcentajes suman ${total}%. Deben sumar exactamente 100%.`, confirmar:"Entendido", cancelar:false }); return }
  historial.unshift({
    id: Date.now(), nombre, tipo: "libre", gramos,
    componentes: comps.map(c => ({ nombre: c.nombre, porcentaje: c.porcentaje, gramos: Math.round(gramos * c.porcentaje / 100) })),
    fecha: new Date().toLocaleDateString("es-AR")
  })
  guardarHistorial()
  flashBtn(".btn-guardar", "✓ Guardado", '<i class="fa-solid fa-floppy-disk"></i> Guardar en historial')
}

function libreCopiar(){
  const nombre = document.getElementById("libreNombre").value.trim() || "Mi pasta"
  const gramos = parseFloat(document.getElementById("libreGramos").value) || 0
  const comps  = libreObtenerComponentes()
  let txt = `${nombre} — ${gramos}g\n`
  comps.forEach(c => { txt += `${c.nombre}: ${Math.round(gramos * c.porcentaje / 100)}g (${c.porcentaje}%)\n` })
  navigator.clipboard.writeText(txt)
}

function flashBtn(sel, on, off){
  const b = document.querySelector(sel)
  if(!b) return
  b.innerHTML = on
  setTimeout(() => b.innerHTML = off, 2000)
}

// ─────────────────────────────────────────────
// HISTORIAL
// ─────────────────────────────────────────────
function guardarHistorial(){
  localStorage.setItem("pastas_historial", JSON.stringify(historial))
  renderizarHistorial()
}

function renderizarHistorial(){
  const lista  = document.getElementById("historialLista")
  const btnPDF = document.getElementById("btnPDF")
  const btnLim = document.getElementById("btnLimpiar")
  lista.innerHTML = ""
  if(historial.length === 0){
    lista.innerHTML = '<p class="historial-vacio">Guardá un cálculo para verlo aquí.</p>'
    btnPDF.disabled = true; btnLim.style.display = "none"; return
  }
  btnPDF.disabled = false; btnLim.style.display = "inline-flex"
  historial.forEach(item => {
    const div = document.createElement("div")
    div.className = "historial-item"
    div.innerHTML = `
      <button class="historial-item-borrar" onclick="borrarItem(${item.id})">✕</button>
      <div class="historial-item-tipo">${item.tipo === "catalogo" ? "🫙" : "🧪"} ${item.nombre}</div>
      <div class="historial-item-valores">
        <span class="historial-chip">${item.gramos}g totales</span>
        <span class="historial-chip">${item.componentes.length} ingredientes</span>
      </div>
      <div class="historial-item-meta">${item.fecha}</div>`
    lista.appendChild(div)
  })
}

function borrarItem(id){
  historial = historial.filter(i => i.id !== id)
  guardarHistorial()
}

function limpiarHistorialConfirmado(){
  historial = []
  localStorage.setItem("pastas_historial", JSON.stringify(historial))
  renderizarHistorial()
}

function pedirLimpiarHistorial(){
  mostrarModal({ titulo:"🗑 Limpiar historial", texto:"¿Borrar todo el historial? Esta acción no se puede deshacer.", confirmar:"Borrar todo", accion: limpiarHistorialConfirmado })
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

async function generarPDFItems(items, filename){
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" })
  const W=210, m=18
  const MARRON=[139,111,86], GRIS=[245,240,235], BLANCO=[255,255,255], NEGRO=[40,35,30]
  let y=0

  doc.setFillColor(...MARRON); doc.rect(0,0,W,40,"F")
  const logo = await cargarLogoBase64()
  if(logo) doc.addImage(logo,"PNG",m,8,22,22)
  doc.setTextColor(...BLANCO); doc.setFontSize(20); doc.setFont("helvetica","bold"); doc.text("YCA Ceramica",m+28,17)
  doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.text("Pastas Cerámicas",m+28,24)
  doc.setFontSize(8); doc.text("instagram: @ycaceramica   |   tiktok: @yca.ceramica   |   youtube: @YCACeramica",m+28,31)
  doc.text(`Generado: ${new Date().toLocaleDateString("es-AR",{day:"2-digit",month:"long",year:"numeric"})}`,W-m,36,{align:"right"})
  y=50

  items.forEach((item, idx) => {
    const h = 24 + item.componentes.length * 9 + 12
    if(y+h > 272){ doc.addPage(); y=20 }
    doc.setFillColor(...GRIS); doc.roundedRect(m,y,W-m*2,h,4,4,"F")
    doc.setTextColor(...NEGRO); doc.setFontSize(12); doc.setFont("helvetica","bold")
    doc.text(`${item.tipo === "catalogo" ? "🫙" : "🧪"} ${item.nombre}`,m+5,y+9)
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(120,110,100)
    doc.text(`${item.gramos}g totales · ${item.fecha}`,W-m-5,y+9,{align:"right"})

    const cw = (W-m*2-10)/3
    doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(120,110,100)
    doc.text("INGREDIENTE",m+4,y+16); doc.text("%",m+4+cw,y+16); doc.text("GRAMOS",m+4+cw*2,y+16)

    item.componentes.forEach((c,ci) => {
      const fy = y+22+ci*9
      doc.setTextColor(...NEGRO); doc.setFontSize(9); doc.setFont("helvetica","normal")
      doc.text(c.nombre,m+4,fy)
      doc.setTextColor(...MARRON); doc.setFont("helvetica","bold")
      doc.text(`${c.porcentaje}%`,m+4+cw,fy)
      doc.text(`${c.gramos}g`,m+4+cw*2,fy)
    })

    y+=h+6
  })

  doc.setFillColor(...GRIS); doc.rect(0,287,W,10,"F")
  doc.setTextColor(160,150,140); doc.setFontSize(7); doc.setFont("helvetica","normal")
  doc.text("ycaceramica.github.io  |  YCA Ceramica © 2026",W/2,293,{align:"center"})
  doc.save(filename || "YCA_Ceramica_Pastas.pdf")
}

async function descargarPDF(){
  if(!historial.length) return
  await generarPDFItems(historial, "YCA_Ceramica_Pastas.pdf")
}

// ─────────────────────────────────────────────
// MI TALLER (Fase 3)
// ─────────────────────────────────────────────
function verificarSesionTaller(){
  try {
    const s = JSON.parse(localStorage.getItem("ceramista_sesion") || "null")
    const activo = s && s.token
    ;["btnTallerModal","btnTallerLibre"].forEach(id => {
      const btn = document.getElementById(id)
      if(btn) btn.style.display = activo ? "flex" : "none"
    })
  } catch(e){}
}
function guardarEnTaller(){
  mostrarModal({ titulo:"🏺 Mi taller", texto:"Próximamente podrás sincronizar tu historial con tu cuenta de ceramista.", confirmar:"Entendido", cancelar:false })
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
cargarPastas()
renderizarHistorial()
verificarSesionTaller()
