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
const toggleDark = document.getElementById("toggleDark")
if(toggleDark) toggleDark.addEventListener("click", () => {
  document.body.classList.toggle("dark")
  localStorage.setItem("dark", document.body.classList.contains("dark"))
  actualizarIcono()
})
const hamburguesa = document.getElementById("hamburguesa")
const nav = document.getElementById("nav")
if(hamburguesa) hamburguesa.addEventListener("click", () => nav.classList.toggle("active"))
document.querySelectorAll(".nav a").forEach(l => l.addEventListener("click", () => nav.classList.remove("active")))
window.addEventListener("scroll", () => { if(nav) nav.classList.remove("active") })

// ─────────────────────────────────────────────
// ESTADO
// ─────────────────────────────────────────────

let modoActual = "estandar"
let historial  = JSON.parse(localStorage.getItem("contraccion_historial") || "[]")
let perfiles   = JSON.parse(localStorage.getItem("contraccion_perfiles")  || "[]")
let perfilActivo = null

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
// MODO
// ─────────────────────────────────────────────

function setModo(modo){
  modoActual = modo
  ;["estandar","personalizado","usarPerfil"].forEach(m => {
    document.getElementById("btn" + m.charAt(0).toUpperCase() + m.slice(1)).classList.toggle("activo", m === modo)
    document.getElementById("seccion" + m.charAt(0).toUpperCase() + m.slice(1)).style.display = m === modo ? "block" : "none"
  })
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function contraer(valor, pct){ return (valor * (1 - pct / 100)).toFixed(2) }
function pctContraccion(desde, hasta){ return (((desde - hasta) / desde) * 100).toFixed(2) }
function val(id){ return parseFloat(document.getElementById(id).value) || 0 }
function set(id, v){ document.getElementById(id).innerText = v }

function flashBtn(selector, on, off){
  const btn = document.querySelector(selector)
  if(!btn) return
  btn.innerHTML = on
  setTimeout(() => btn.innerHTML = off, 2000)
}

// ─────────────────────────────────────────────
// MODO ESTÁNDAR
// ─────────────────────────────────────────────

function calcularEstandar(){
  const alto = val("eAlto"), ancho = val("eAncho"), prof = val("eProf")
  if(!alto && !ancho && !prof){ document.getElementById("resultadoEstandar").style.display = "none"; return }

  set("eResAlto",  alto  ? alto  + " cm" : "—")
  set("eResAncho", ancho ? ancho + " cm" : "—")
  set("eResProf",  prof  ? prof  + " cm" : "—")
  set("eResBizcAlto",  alto  ? contraer(alto,  10) + " cm" : "—")
  set("eResBizcAncho", ancho ? contraer(ancho, 10) + " cm" : "—")
  set("eResBizcProf",  prof  ? contraer(prof,  10) + " cm" : "—")

  document.getElementById("resultadoEstandar").style.display = "block"
}

function guardarEstandar(){
  const alto = val("eAlto"), ancho = val("eAncho"), prof = val("eProf")
  if(!alto && !ancho && !prof){ alert("Ingresá al menos una medida"); return }

  historial.unshift({
    id: Date.now(), modo: "estandar",
    alto, ancho, prof,
    bizcAlto:  parseFloat(contraer(alto,  10)),
    bizcAncho: parseFloat(contraer(ancho, 10)),
    bizcProf:  parseFloat(contraer(prof,  10)),
    fecha: new Date().toLocaleDateString("es-AR")
  })
  guardarHistorial()
  flashBtn("#seccionEstandar .btn-guardar", "✓ Guardado", '<i class="fa-solid fa-floppy-disk"></i> Guardar en historial')
}

function copiarResultado(modo){
  let texto = ""
  if(modo === "estandar"){
    texto = `Crudo: Alto ${val("eAlto")} | Ancho ${val("eAncho")} | Prof ${val("eProf")} cm\n` +
            `Bizcocho: Alto ${contraer(val("eAlto"),10)} | Ancho ${contraer(val("eAncho"),10)} | Prof ${contraer(val("eProf"),10)} cm\nContracción: 10%`
  } else if(modo === "personalizado"){
    texto = `Cuero: Alto ${val("pCueroAlto")} | Ancho ${val("pCueroAncho")} | Prof ${val("pCueroProf")} cm\n` +
            `Hueso: Alto ${val("pHuesoAlto")} | Ancho ${val("pHuesoAncho")} | Prof ${val("pHuesoProf")} cm\n` +
            `Bizcocho: Alto ${val("pBizcAlto")} | Ancho ${val("pBizcAncho")} | Prof ${val("pBizcProf")} cm`
  } else if(modo === "perfil" && perfilActivo){
    texto = `Arcilla: ${perfilActivo.nombre}\n` +
            `Crudo: Alto ${val("uAlto")} | Ancho ${val("uAncho")} | Prof ${val("uProf")} cm\n` +
            `Bizcocho: Alto ${contraer(val("uAlto"), perfilActivo.contAlto)} | Ancho ${contraer(val("uAncho"), perfilActivo.contAncho)} | Prof ${contraer(val("uProf"), perfilActivo.contProf)} cm`
  }
  if(!texto) return
  navigator.clipboard.writeText(texto).then(() =>
    flashBtn(`#seccion${modoActual.charAt(0).toUpperCase()+modoActual.slice(1)} .btn-copiar`, "✓ Copiado", '<i class="fa-regular fa-copy"></i> Copiar')
  )
}

// ─────────────────────────────────────────────
// MODO PERSONALIZADO
// ─────────────────────────────────────────────

function calcularPersonalizado(){
  const cueroAlto = val("pCueroAlto"), cueroAncho = val("pCueroAncho"), cueroProf = val("pCueroProf")
  const huesoAlto = val("pHuesoAlto"), huesoAncho = val("pHuesoAncho"), huesoProf = val("pHuesoProf")
  const bizcAlto  = val("pBizcAlto"),  bizcAncho  = val("pBizcAncho"),  bizcProf  = val("pBizcProf")

  if(!cueroAlto || !huesoAlto || !bizcAlto){
    document.getElementById("resultadoPersonalizado").style.display = "none"; return
  }

  set("pResCueroAlto",  cueroAlto  + " cm")
  set("pResCueroAncho", cueroAncho + " cm")
  set("pResCueroProf",  cueroProf  + " cm")
  set("pResHuesoAlto",  huesoAlto  + " cm")
  set("pResHuesoAncho", huesoAncho + " cm")
  set("pResHuesoProf",  huesoProf  + " cm")
  set("pResBizcAlto",   bizcAlto   + " cm")
  set("pResBizcAncho",  bizcAncho  + " cm")
  set("pResBizcProf",   bizcProf   + " cm")
  set("pResContAlto",   pctContraccion(cueroAlto,  bizcAlto)  + "%")
  set("pResContAncho",  pctContraccion(cueroAncho, bizcAncho) + "%")
  set("pResContProf",   pctContraccion(cueroProf,  bizcProf)  + "%")

  document.getElementById("resultadoPersonalizado").style.display = "block"
}

function guardarPerfil(){
  const nombre    = document.getElementById("nombreArcilla").value.trim()
  const cueroAlto = val("pCueroAlto"), cueroAncho = val("pCueroAncho"), cueroProf = val("pCueroProf")
  const huesoAlto = val("pHuesoAlto"), huesoAncho = val("pHuesoAncho"), huesoProf = val("pHuesoProf")
  const bizcAlto  = val("pBizcAlto"),  bizcAncho  = val("pBizcAncho"),  bizcProf  = val("pBizcProf")

  if(!nombre){ alert("Poné un nombre a tu arcilla"); return }
  if(!cueroAlto || !huesoAlto || !bizcAlto){ alert("Completá las 3 medidas del Alto al menos"); return }

  const perfil = {
    id: Date.now(), nombre,
    cueroAlto, cueroAncho, cueroProf,
    huesoAlto, huesoAncho, huesoProf,
    bizcAlto,  bizcAncho,  bizcProf,
    contAlto:  parseFloat(pctContraccion(cueroAlto,  bizcAlto)),
    contAncho: parseFloat(pctContraccion(cueroAncho, bizcAncho)),
    contProf:  parseFloat(pctContraccion(cueroProf,  bizcProf)),
    fecha: new Date().toLocaleDateString("es-AR")
  }

  perfiles.push(perfil)
  localStorage.setItem("contraccion_perfiles", JSON.stringify(perfiles))
  renderizarPerfiles()
  alert(`Perfil "${nombre}" guardado ✓\nAhora podés usarlo en "Usar perfil guardado".`)
}

function guardarPersonalizado(){
  const cueroAlto = val("pCueroAlto"), cueroAncho = val("pCueroAncho"), cueroProf = val("pCueroProf")
  const huesoAlto = val("pHuesoAlto"), huesoAncho = val("pHuesoAncho"), huesoProf = val("pHuesoProf")
  const bizcAlto  = val("pBizcAlto"),  bizcAncho  = val("pBizcAncho"),  bizcProf  = val("pBizcProf")
  if(!cueroAlto || !huesoAlto || !bizcAlto){ alert("Completá las medidas"); return }

  historial.unshift({
    id: Date.now(), modo: "personalizado",
    arcilla: document.getElementById("nombreArcilla").value.trim() || "Sin nombre",
    cueroAlto, cueroAncho, cueroProf,
    huesoAlto, huesoAncho, huesoProf,
    bizcAlto,  bizcAncho,  bizcProf,
    contAlto:  pctContraccion(cueroAlto,  bizcAlto),
    contAncho: pctContraccion(cueroAncho, bizcAncho),
    contProf:  pctContraccion(cueroProf,  bizcProf),
    fecha: new Date().toLocaleDateString("es-AR")
  })
  guardarHistorial()
  flashBtn("#resultadoPersonalizado .btn-guardar", "✓ Guardado", '<i class="fa-solid fa-clock-rotate-left"></i> Guardar en historial')
}

// ─────────────────────────────────────────────
// USAR PERFIL
// ─────────────────────────────────────────────

function renderizarPerfiles(){
  const sel = document.getElementById("selectPerfil")
  if(!sel) return
  sel.innerHTML = '<option value="">— Seleccioná un perfil —</option>'
  perfiles.forEach(p => {
    const opt = document.createElement("option")
    opt.value = p.id
    opt.textContent = `${p.nombre} (${p.contAlto}% Alto)`
    sel.appendChild(opt)
  })
}

function cargarPerfil(){
  const id = parseInt(document.getElementById("selectPerfil").value)
  const btnBorrar = document.getElementById("btnBorrarPerfil")
  const info      = document.getElementById("perfilInfo")
  const medidas   = document.getElementById("seccionMedidasPerfil")

  if(!id){
    perfilActivo = null
    btnBorrar.style.display = "none"
    info.style.display      = "none"
    medidas.style.display   = "none"
    document.getElementById("resultadoUsarPerfil").style.display = "none"
    return
  }

  perfilActivo = perfiles.find(p => p.id === id)
  if(!perfilActivo) return

  btnBorrar.style.display = "inline-flex"
  info.style.display      = "block"
  info.innerHTML = `
    <div class="perfil-detalle">
      <strong>${perfilActivo.nombre}</strong> · Guardado: ${perfilActivo.fecha}
      <div class="perfil-detalle-grid">
        <span>📉 Alto: ${perfilActivo.contAlto}%</span>
        <span>📉 Ancho: ${perfilActivo.contAncho}%</span>
        <span>📉 Prof: ${perfilActivo.contProf}%</span>
      </div>
    </div>`
  medidas.style.display = "block"
  document.getElementById("uAlto").value  = ""
  document.getElementById("uAncho").value = ""
  document.getElementById("uProf").value  = ""
  document.getElementById("resultadoUsarPerfil").style.display = "none"
}

function calcularConPerfil(){
  if(!perfilActivo) return
  const alto  = val("uAlto"),  ancho = val("uAncho"),  prof = val("uProf")
  if(!alto && !ancho && !prof){ document.getElementById("resultadoUsarPerfil").style.display = "none"; return }

  const cueroAlto  = alto  ? contraer(alto,  perfilActivo.contAlto  * (perfilActivo.cueroAlto  - perfilActivo.huesoAlto)  / (perfilActivo.cueroAlto  - perfilActivo.bizcAlto  || 1)) : "—"
  const cueroAncho = ancho ? contraer(ancho, perfilActivo.contAncho * (perfilActivo.cueroAncho - perfilActivo.huesoAncho) / (perfilActivo.cueroAncho - perfilActivo.bizcAncho || 1)) : "—"
  const cueroProf  = prof  ? contraer(prof,  perfilActivo.contProf  * (perfilActivo.cueroProf  - perfilActivo.huesoProf)  / (perfilActivo.cueroProf  - perfilActivo.bizcProf  || 1)) : "—"

  set("uResCrudoAlto",  alto  ? alto  + " cm" : "—")
  set("uResCrudoAncho", ancho ? ancho + " cm" : "—")
  set("uResCrudoProf",  prof  ? prof  + " cm" : "—")
  set("uResCueroAlto",  typeof cueroAlto  === "string" ? cueroAlto  : cueroAlto  + " cm")
  set("uResCueroAncho", typeof cueroAncho === "string" ? cueroAncho : cueroAncho + " cm")
  set("uResCueroProf",  typeof cueroProf  === "string" ? cueroProf  : cueroProf  + " cm")
  set("uResHuesoAlto",  alto  ? contraer(alto,  perfilActivo.contAlto  * perfilActivo.huesoAlto  / (perfilActivo.cueroAlto  || 1)) + " cm" : "—")
  set("uResHuesoAncho", ancho ? contraer(ancho, perfilActivo.contAncho * perfilActivo.huesoAncho / (perfilActivo.cueroAncho || 1)) + " cm" : "—")
  set("uResHuesoProf",  prof  ? contraer(prof,  perfilActivo.contProf  * perfilActivo.huesoProf  / (perfilActivo.cueroProf  || 1)) + " cm" : "—")
  set("uResBizcAlto",   alto  ? contraer(alto,  perfilActivo.contAlto)  + " cm" : "—")
  set("uResBizcAncho",  ancho ? contraer(ancho, perfilActivo.contAncho) + " cm" : "—")
  set("uResBizcProf",   prof  ? contraer(prof,  perfilActivo.contProf)  + " cm" : "—")

  document.getElementById("resultadoUsarPerfil").style.display = "block"
}

function guardarConPerfil(){
  if(!perfilActivo) return
  const alto = val("uAlto"), ancho = val("uAncho"), prof = val("uProf")
  if(!alto && !ancho && !prof){ alert("Ingresá las medidas en crudo"); return }

  historial.unshift({
    id: Date.now(), modo: "perfil",
    arcilla:   perfilActivo.nombre,
    crudoAlto: alto, crudoAncho: ancho, crudoProf: prof,
    bizcAlto:  parseFloat(contraer(alto,  perfilActivo.contAlto)),
    bizcAncho: parseFloat(contraer(ancho, perfilActivo.contAncho)),
    bizcProf:  parseFloat(contraer(prof,  perfilActivo.contProf)),
    contAlto:  perfilActivo.contAlto,
    contAncho: perfilActivo.contAncho,
    contProf:  perfilActivo.contProf,
    fecha: new Date().toLocaleDateString("es-AR")
  })
  guardarHistorial()
  flashBtn("#resultadoUsarPerfil .btn-guardar", "✓ Guardado", '<i class="fa-solid fa-floppy-disk"></i> Guardar en historial')
}

function borrarPerfilSeleccionado(){
  if(!perfilActivo) return
  if(!confirm(`¿Borrar el perfil "${perfilActivo.nombre}"?`)) return
  perfiles = perfiles.filter(p => p.id !== perfilActivo.id)
  localStorage.setItem("contraccion_perfiles", JSON.stringify(perfiles))
  perfilActivo = null
  renderizarPerfiles()
  document.getElementById("selectPerfil").value = ""
  cargarPerfil()
}

// ─────────────────────────────────────────────
// HISTORIAL
// ─────────────────────────────────────────────

function guardarHistorial(){
  localStorage.setItem("contraccion_historial", JSON.stringify(historial))
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

    if(item.modo === "estandar"){
      div.innerHTML = `
        <button class="historial-item-borrar" onclick="borrarItem(${item.id})">✕</button>
        <div class="historial-item-tipo">📏 Estándar · 10%</div>
        <div class="historial-item-valores">
          <span class="historial-chip">Crudo: ${item.alto}×${item.ancho}×${item.prof} cm</span>
          <span class="historial-chip">🔥 Bizcocho: ${item.bizcAlto}×${item.bizcAncho}×${item.bizcProf} cm</span>
        </div>
        <div class="historial-item-meta">${item.fecha}</div>`
    } else if(item.modo === "personalizado"){
      div.innerHTML = `
        <button class="historial-item-borrar" onclick="borrarItem(${item.id})">✕</button>
        <div class="historial-item-tipo">🎯 ${item.arcilla}</div>
        <div class="historial-item-valores">
          <span class="historial-chip">🌿 ${item.cueroAlto}×${item.cueroAncho}×${item.cueroProf} cm</span>
          <span class="historial-chip">🔥 ${item.bizcAlto}×${item.bizcAncho}×${item.bizcProf} cm</span>
          <span class="historial-chip">📉 ${item.contAlto}%</span>
        </div>
        <div class="historial-item-meta">${item.fecha}</div>`
    } else {
      div.innerHTML = `
        <button class="historial-item-borrar" onclick="borrarItem(${item.id})">✕</button>
        <div class="historial-item-tipo">📂 ${item.arcilla}</div>
        <div class="historial-item-valores">
          <span class="historial-chip">Crudo: ${item.crudoAlto}×${item.crudoAncho}×${item.crudoProf} cm</span>
          <span class="historial-chip">🔥 Bizcocho: ${item.bizcAlto}×${item.bizcAncho}×${item.bizcProf} cm</span>
        </div>
        <div class="historial-item-meta">${item.fecha}</div>`
    }
    lista.appendChild(div)
  })
}

function borrarItem(id){
  historial = historial.filter(i => i.id !== id)
  guardarHistorial()
}

function limpiarHistorial(){
  if(confirm("¿Borrar todo el historial?")){
    historial = []
    guardarHistorial()
  }
}

// ─────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────

function cargarLogoBase64(){
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const c = document.createElement("canvas")
      c.width = img.width; c.height = img.height
      c.getContext("2d").drawImage(img, 0, 0)
      resolve(c.toDataURL("image/png"))
    }
    img.onerror = () => resolve(null)
    img.src = "../imagenes/logo.png"
  })
}

async function descargarPDF(){
  if(historial.length === 0) return
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const W = 210, margen = 18
  let y = 0
  const MARRON = [139,111,86], GRIS = [245,240,235], BLANCO = [255,255,255], NEGRO = [40,35,30]

  doc.setFillColor(...MARRON); doc.rect(0,0,W,40,"F")
  const logo = await cargarLogoBase64()
  if(logo) doc.addImage(logo,"PNG",margen,8,22,22)
  doc.setTextColor(...BLANCO); doc.setFontSize(20); doc.setFont("helvetica","bold")
  doc.text("YCA Ceramica", margen+28, 17)
  doc.setFontSize(10); doc.setFont("helvetica","normal")
  doc.text("Calculadora de Contraccion", margen+28, 24)
  doc.setFontSize(8)
  doc.text("instagram: @ycaceramica   |   tiktok: @yca.ceramica   |   youtube: @YCACeramica", margen+28, 31)
  const fecha = new Date().toLocaleDateString("es-AR",{day:"2-digit",month:"long",year:"numeric"})
  doc.text(`Generado: ${fecha}`, W-margen, 36, {align:"right"})
  y = 50

  historial.forEach((item, idx) => {
    const alto = item.modo === "estandar" ? 38 : 48
    if(y + alto > 272){ doc.addPage(); y = 20 }
    doc.setFillColor(...GRIS); doc.roundedRect(margen,y,W-margen*2,alto,4,4,"F")
    doc.setTextColor(...MARRON); doc.setFontSize(11); doc.setFont("helvetica","bold")
    doc.text(`#${idx+1}`, margen+5, y+9)
    const titulo = item.modo === "estandar" ? "Estandar · 10%" : item.modo === "personalizado" ? `Medicion · ${item.arcilla}` : `Perfil · ${item.arcilla}`
    doc.setTextColor(...NEGRO); doc.setFontSize(12); doc.setFont("helvetica","bold")
    doc.text(titulo, margen+18, y+9)
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(120,110,100)
    doc.text(item.fecha, W-margen-5, y+9, {align:"right"})

    const colW = (W-margen*2-12)/3
    const filas = item.modo === "estandar"
      ? [{ label:"CRUDO", vals:[item.alto,item.ancho,item.prof], unit:"cm" }, { label:"BIZCOCHO", vals:[item.bizcAlto,item.bizcAncho,item.bizcProf], unit:"cm" }]
      : item.modo === "personalizado"
      ? [{ label:"CUERO", vals:[item.cueroAlto,item.cueroAncho,item.cueroProf], unit:"cm" }, { label:"BIZCOCHO", vals:[item.bizcAlto,item.bizcAncho,item.bizcProf], unit:"cm" }, { label:"CONTRACCION", vals:[item.contAlto+"%",item.contAncho+"%",item.contProf+"%"], unit:"" }]
      : [{ label:"CRUDO", vals:[item.crudoAlto,item.crudoAncho,item.crudoProf], unit:"cm" }, { label:"BIZCOCHO", vals:[item.bizcAlto,item.bizcAncho,item.bizcProf], unit:"cm" }]

    filas.forEach((fila, fi) => {
      const fy = y + 14 + fi * 12
      if(fy + 10 > y + alto) return
      doc.setTextColor(120,110,100); doc.setFontSize(7); doc.setFont("helvetica","bold")
      doc.text(fila.label, margen+4, fy+5)
      fila.vals.forEach((v, vi) => {
        const x = margen + 35 + vi * (colW + 4)
        doc.setFillColor(...BLANCO); doc.roundedRect(x,fy,colW,9,2,2,"F")
        doc.setTextColor(...MARRON); doc.setFontSize(9); doc.setFont("helvetica","normal")
        doc.text(String(v) + (fila.unit && !String(v).includes("%") ? " "+fila.unit : ""), x+4, fy+6)
      })
    })
    y += alto + 6
  })

  doc.setFillColor(...GRIS); doc.rect(0,287,W,10,"F")
  doc.setTextColor(160,150,140); doc.setFontSize(7); doc.setFont("helvetica","normal")
  doc.text("ycaceramica.github.io  |  YCA Ceramica © 2026", W/2, 293, {align:"center"})
  doc.save("YCA_Ceramica_Contraccion.pdf")
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

renderizarHistorial()
renderizarPerfiles()
