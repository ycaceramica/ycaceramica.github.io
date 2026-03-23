// Dark mode y nav manejados por nav-ceramista.js

// ─────────────────────────────────────────────
// ESTADO
// ─────────────────────────────────────────────
let modoActual   = "estandar"
let historial    = JSON.parse(localStorage.getItem("contraccion_historial") || "[]")
let perfiles     = JSON.parse(localStorage.getItem("contraccion_perfiles")  || "[]")
let perfilActivo = null
let modalCallback = null

// ─────────────────────────────────────────────
// MODAL GENÉRICO (reemplaza alert/confirm)
// ─────────────────────────────────────────────
function mostrarModal({ titulo, texto, confirmar, accion, cancelar = true }){
  document.getElementById("contModalTitulo").innerText  = titulo
  document.getElementById("contModalTexto").innerText   = texto
  const btnConfirmar = document.getElementById("contModalConfirmar")
  const btnCancelar  = document.getElementById("contModalCancelar")
  btnConfirmar.innerText   = confirmar
  btnCancelar.style.display = cancelar ? "inline-flex" : "none"
  modalCallback = accion || null
  btnConfirmar.onclick = () => { const cb = modalCallback; cerrarModal(); if(cb) cb() }
  document.getElementById("contModal").style.display = "flex"
}
function cerrarModal(){ document.getElementById("contModal").style.display = "none"; modalCallback = null }

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
    const key = m.charAt(0).toUpperCase() + m.slice(1)
    document.getElementById("btn" + key).classList.toggle("activo", m === modo)
    document.getElementById("seccion" + key).style.display = m === modo ? "block" : "none"
  })
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function contraer(v, pct){ return v ? (v * (1 - pct / 100)).toFixed(2) : "—" }
function pct(desde, hasta){ return desde ? (((desde - hasta) / desde) * 100).toFixed(2) : "—" }
function val(id){ return parseFloat(document.getElementById(id)?.value) || 0 }
function set(id, v){ const el = document.getElementById(id); if(el) el.innerText = v }
function flashBtn(sel, on, off){ const b = document.querySelector(sel); if(!b) return; b.innerHTML = on; setTimeout(() => b.innerHTML = off, 2000) }

// ─────────────────────────────────────────────
// MODO ESTÁNDAR
// ─────────────────────────────────────────────
function calcularEstandar(){
  const a = val("eAlto"), an = val("eAncho"), p = val("eProf")
  if(!a && !an && !p){ document.getElementById("resultadoEstandar").style.display = "none"; return }
  set("eResAlto",  a  ? a  + " cm" : "—"); set("eResAncho", an ? an + " cm" : "—"); set("eResProf", p ? p + " cm" : "—")
  set("eResBizcAlto", a  ? contraer(a,  10) + " cm" : "—")
  set("eResBizcAncho",an ? contraer(an, 10) + " cm" : "—")
  set("eResBizcProf", p  ? contraer(p,  10) + " cm" : "—")
  document.getElementById("resultadoEstandar").style.display = "block"
}

function guardarEstandar(){
  const a = val("eAlto"), an = val("eAncho"), p = val("eProf")
  if(!a && !an && !p){ mostrarModal({ titulo:"⚠️ Sin datos", texto:"Ingresá al menos una medida antes de guardar.", confirmar:"Entendido", cancelar:false }); return }
  historial.unshift({ id:Date.now(), modo:"estandar", alto:a, ancho:an, prof:p, bizcAlto:parseFloat(contraer(a,10)), bizcAncho:parseFloat(contraer(an,10)), bizcProf:parseFloat(contraer(p,10)), fecha:new Date().toLocaleDateString("es-AR") })
  guardarHistorial()
  flashBtn("#seccionEstandar .btn-guardar", "✓ Guardado", '<i class="fa-solid fa-floppy-disk"></i> Guardar en historial')
}

// ─────────────────────────────────────────────
// MODO PERSONALIZADO
// ─────────────────────────────────────────────
function calcularPersonalizado(){
  const cA = val("pCueroAlto"), cAn = val("pCueroAncho"), cP = val("pCueroProf")
  const hA = val("pHuesoAlto"), hAn = val("pHuesoAncho"), hP = val("pHuesoProf")
  const bA = val("pBizcAlto"),  bAn = val("pBizcAncho"),  bP = val("pBizcProf")
  if(!cA || !hA || !bA){ document.getElementById("resultadoPersonalizado").style.display = "none"; return }

  set("pResCueroAlto",  cA  + " cm"); set("pResCueroAncho", cAn + " cm"); set("pResCueroProf", cP + " cm")
  set("pResHuesoAlto",  hA  + " cm"); set("pResHuesoAncho", hAn + " cm"); set("pResHuesoProf", hP + " cm")
  set("pResBizcAlto",   bA  + " cm"); set("pResBizcAncho",  bAn + " cm"); set("pResBizcProf",  bP + " cm")

  const contA = pct(cA, bA), contAn = pct(cAn, bAn), contP = pct(cP, bP)
  set("pResContAlto",  contA  + "%")
  set("pResContAncho", contAn + "%")
  set("pResContProf",  contP  + "%")

  // Contracción total = promedio de los 3 ejes
  const ejes = [parseFloat(contA), parseFloat(contAn), parseFloat(contP)].filter(n => !isNaN(n) && n > 0)
  const total = ejes.length ? (ejes.reduce((a,b) => a+b, 0) / ejes.length).toFixed(2) : "—"
  set("pResContTotal", total !== "—" ? `${total}% promedio (referencia principal: Alto ${contA}%)` : "—")

  document.getElementById("resultadoPersonalizado").style.display = "block"
}

function guardarPerfil(){
  const nombre = document.getElementById("nombreArcilla").value.trim()
  const cA = val("pCueroAlto"), hA = val("pHuesoAlto"), bA = val("pBizcAlto")
  if(!nombre){ mostrarModal({ titulo:"⚠️ Sin nombre", texto:"Poné un nombre a tu arcilla antes de guardar el perfil.", confirmar:"Entendido", cancelar:false }); return }
  if(!cA || !hA || !bA){ mostrarModal({ titulo:"⚠️ Sin datos", texto:"Completá al menos las medidas de Alto en los 3 estados.", confirmar:"Entendido", cancelar:false }); return }

  const cAn = val("pCueroAncho"), cP = val("pCueroProf")
  const hAn = val("pHuesoAncho"), hP = val("pHuesoProf")
  const bAn = val("pBizcAncho"),  bP = val("pBizcProf")

  const perfil = {
    id: Date.now(), nombre,
    cueroAlto:cA, cueroAncho:cAn, cueroProf:cP,
    huesoAlto:hA, huesoAncho:hAn, huesoProf:hP,
    bizcAlto:bA,  bizcAncho:bAn,  bizcProf:bP,
    contAlto:  parseFloat(pct(cA,  bA)),
    contAncho: parseFloat(pct(cAn, bAn)),
    contProf:  parseFloat(pct(cP,  bP)),
    fecha: new Date().toLocaleDateString("es-AR")
  }
  perfiles.push(perfil)
  localStorage.setItem("contraccion_perfiles", JSON.stringify(perfiles))
  renderizarPerfiles()
  mostrarModal({ titulo:"✅ Perfil guardado", texto:`El perfil "${nombre}" fue guardado. Podés usarlo en "Usar perfil guardado".`, confirmar:"¡Genial!", cancelar:false })
}

function guardarPersonalizado(){
  const cA = val("pCueroAlto"), hA = val("pHuesoAlto"), bA = val("pBizcAlto")
  if(!cA || !hA || !bA){ mostrarModal({ titulo:"⚠️ Sin datos", texto:"Completá las medidas antes de guardar.", confirmar:"Entendido", cancelar:false }); return }
  const cAn = val("pCueroAncho"), cP = val("pCueroProf")
  const hAn = val("pHuesoAncho"), hP = val("pHuesoProf")
  const bAn = val("pBizcAncho"),  bP = val("pBizcProf")
  historial.unshift({
    id:Date.now(), modo:"personalizado",
    arcilla: document.getElementById("nombreArcilla").value.trim() || "Sin nombre",
    cueroAlto:cA, cueroAncho:cAn, cueroProf:cP,
    huesoAlto:hA, huesoAncho:hAn, huesoProf:hP,
    bizcAlto:bA,  bizcAncho:bAn,  bizcProf:bP,
    contAlto: pct(cA,cAn?cAn:1), contAncho: pct(cAn,bAn), contProf: pct(cP,bP),
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
    const o = document.createElement("option")
    o.value = p.id
    o.textContent = `${p.nombre} (Alto ${p.contAlto}%)`
    sel.appendChild(o)
  })
}

function cargarPerfil(){
  const id = parseInt(document.getElementById("selectPerfil").value)
  const btnBorrar = document.getElementById("btnBorrarPerfil")
  const info      = document.getElementById("perfilInfo")
  const medidas   = document.getElementById("seccionMedidasPerfil")
  if(!id){ perfilActivo = null; btnBorrar.style.display="none"; info.style.display="none"; medidas.style.display="none"; document.getElementById("resultadoUsarPerfil").style.display="none"; return }
  perfilActivo = perfiles.find(p => p.id === id)
  if(!perfilActivo) return
  btnBorrar.style.display = "inline-flex"
  info.style.display = "block"
  info.innerHTML = `<div class="perfil-detalle"><strong>${perfilActivo.nombre}</strong> · Guardado: ${perfilActivo.fecha}<div class="perfil-detalle-grid"><span>📉 Alto: ${perfilActivo.contAlto}%</span><span>📉 Ancho: ${perfilActivo.contAncho}%</span><span>📉 Prof: ${perfilActivo.contProf}%</span></div></div>`
  medidas.style.display = "block"
  ;["uAlto","uAncho","uProf"].forEach(id => document.getElementById(id).value = "")
  document.getElementById("resultadoUsarPerfil").style.display = "none"
}

function calcularConPerfil(){
  if(!perfilActivo) return
  const a = val("uAlto"), an = val("uAncho"), p = val("uProf")
  if(!a && !an && !p){ document.getElementById("resultadoUsarPerfil").style.display = "none"; return }
  set("uResCrudoAlto",  a  ? a  + " cm" : "—"); set("uResCrudoAncho", an ? an + " cm" : "—"); set("uResCrudoProf", p ? p + " cm" : "—")
  // Cuero: contracción parcial (cuero/bizcocho del perfil)
  const pCueroA  = perfilActivo.cueroAlto  && perfilActivo.bizcAlto  ? pct(perfilActivo.cueroAlto,  perfilActivo.huesoAlto)  : 0
  const pCueroAn = perfilActivo.cueroAncho && perfilActivo.bizcAncho ? pct(perfilActivo.cueroAncho, perfilActivo.huesoAncho) : 0
  const pCueroP  = perfilActivo.cueroProf  && perfilActivo.bizcProf  ? pct(perfilActivo.cueroProf,  perfilActivo.huesoProf)  : 0
  const pHuesoA  = perfilActivo.huesoAlto  && perfilActivo.bizcAlto  ? pct(perfilActivo.huesoAlto,  perfilActivo.bizcAlto)   : 0
  const pHuesoAn = perfilActivo.huesoAncho && perfilActivo.bizcAncho ? pct(perfilActivo.huesoAncho, perfilActivo.bizcAncho)  : 0
  const pHuesoP  = perfilActivo.huesoProf  && perfilActivo.bizcProf  ? pct(perfilActivo.huesoProf,  perfilActivo.bizcProf)   : 0
  set("uResCueroAlto",  a  ? contraer(a,  pCueroA)  + " cm" : "—")
  set("uResCueroAncho", an ? contraer(an, pCueroAn) + " cm" : "—")
  set("uResCueroProf",  p  ? contraer(p,  pCueroP)  + " cm" : "—")
  set("uResHuesoAlto",  a  ? contraer(a,  parseFloat(pCueroA)  + parseFloat(pHuesoA))  + " cm" : "—")
  set("uResHuesoAncho", an ? contraer(an, parseFloat(pCueroAn) + parseFloat(pHuesoAn)) + " cm" : "—")
  set("uResHuesoProf",  p  ? contraer(p,  parseFloat(pCueroP)  + parseFloat(pHuesoP))  + " cm" : "—")
  set("uResBizcAlto",   a  ? contraer(a,  perfilActivo.contAlto)  + " cm" : "—")
  set("uResBizcAncho",  an ? contraer(an, perfilActivo.contAncho) + " cm" : "—")
  set("uResBizcProf",   p  ? contraer(p,  perfilActivo.contProf)  + " cm" : "—")
  document.getElementById("resultadoUsarPerfil").style.display = "block"
}

function guardarConPerfil(){
  if(!perfilActivo) return
  const a = val("uAlto"), an = val("uAncho"), p = val("uProf")
  if(!a && !an && !p){ mostrarModal({ titulo:"⚠️ Sin datos", texto:"Ingresá las medidas en crudo antes de guardar.", confirmar:"Entendido", cancelar:false }); return }
  historial.unshift({
    id:Date.now(), modo:"perfil", arcilla:perfilActivo.nombre,
    crudoAlto:a, crudoAncho:an, crudoProf:p,
    bizcAlto:parseFloat(contraer(a,perfilActivo.contAlto)), bizcAncho:parseFloat(contraer(an,perfilActivo.contAncho)), bizcProf:parseFloat(contraer(p,perfilActivo.contProf)),
    contAlto:perfilActivo.contAlto, contAncho:perfilActivo.contAncho, contProf:perfilActivo.contProf,
    fecha:new Date().toLocaleDateString("es-AR")
  })
  guardarHistorial()
  flashBtn("#resultadoUsarPerfil .btn-guardar", "✓ Guardado", '<i class="fa-solid fa-floppy-disk"></i> Guardar en historial')
}

function pedirBorrarPerfil(){
  if(!perfilActivo) return
  mostrarModal({ titulo:"🗑 Borrar perfil", texto:`¿Borrar el perfil "${perfilActivo.nombre}"? Esta acción no se puede deshacer.`, confirmar:"Borrar", accion: borrarPerfil })
}

function borrarPerfil(){
  if(!perfilActivo) return
  perfiles = perfiles.filter(p => p.id !== perfilActivo.id)
  localStorage.setItem("contraccion_perfiles", JSON.stringify(perfiles))
  perfilActivo = null
  renderizarPerfiles()
  const sel = document.getElementById("selectPerfil")
  if(sel) sel.value = ""
  cargarPerfil()
}

// ─────────────────────────────────────────────
// COPIAR
// ─────────────────────────────────────────────
function copiarResultado(modo){
  let texto = ""
  if(modo === "estandar"){
    texto = `Crudo: Alto ${val("eAlto")} | Ancho ${val("eAncho")} | Prof ${val("eProf")} cm\nBizcocho: Alto ${contraer(val("eAlto"),10)} | Ancho ${contraer(val("eAncho"),10)} | Prof ${contraer(val("eProf"),10)} cm\nContracción: 10%`
  } else if(modo === "personalizado"){
    texto = `Arcilla: ${document.getElementById("nombreArcilla").value||"Sin nombre"}\nCuero: ${val("pCueroAlto")}×${val("pCueroAncho")}×${val("pCueroProf")} cm\nHueso: ${val("pHuesoAlto")}×${val("pHuesoAncho")}×${val("pHuesoProf")} cm\nBizcocho: ${val("pBizcAlto")}×${val("pBizcAncho")}×${val("pBizcProf")} cm\nContracción: Alto ${pct(val("pCueroAlto"),val("pBizcAlto"))}% | Ancho ${pct(val("pCueroAncho"),val("pBizcAncho"))}% | Prof ${pct(val("pCueroProf"),val("pBizcProf"))}%`
  } else if(modo === "perfil" && perfilActivo){
    texto = `Arcilla: ${perfilActivo.nombre}\nCrudo: ${val("uAlto")}×${val("uAncho")}×${val("uProf")} cm\nBizcocho: ${contraer(val("uAlto"),perfilActivo.contAlto)}×${contraer(val("uAncho"),perfilActivo.contAncho)}×${contraer(val("uProf"),perfilActivo.contProf)} cm`
  }
  if(texto) navigator.clipboard.writeText(texto)
}

// ─────────────────────────────────────────────
// HISTORIAL
// ─────────────────────────────────────────────
function guardarHistorial(){
  localStorage.setItem("contraccion_historial", JSON.stringify(historial))
  renderizarHistorial()
}

function renderizarHistorial(){
  const lista = document.getElementById("historialLista")
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
      div.innerHTML = `<button class="historial-item-borrar" onclick="borrarItem(${item.id})">✕</button><div class="historial-item-tipo">📏 Estándar · 10%</div><div class="historial-item-valores"><span class="historial-chip">Crudo: ${item.alto}×${item.ancho}×${item.prof} cm</span><span class="historial-chip">🔥 ${item.bizcAlto}×${item.bizcAncho}×${item.bizcProf} cm</span></div><div class="historial-item-meta">${item.fecha}</div>`
    } else if(item.modo === "personalizado"){
      div.innerHTML = `<button class="historial-item-borrar" onclick="borrarItem(${item.id})">✕</button><div class="historial-item-tipo">🎯 ${item.arcilla}</div><div class="historial-item-valores"><span class="historial-chip">🌿 ${item.cueroAlto}×${item.cueroAncho}×${item.cueroProf}</span><span class="historial-chip">🔥 ${item.bizcAlto}×${item.bizcAncho}×${item.bizcProf}</span></div><div class="historial-item-meta">${item.fecha}</div>`
    } else {
      div.innerHTML = `<button class="historial-item-borrar" onclick="borrarItem(${item.id})">✕</button><div class="historial-item-tipo">📂 ${item.arcilla}</div><div class="historial-item-valores"><span class="historial-chip">Crudo: ${item.crudoAlto}×${item.crudoAncho}×${item.crudoProf}</span><span class="historial-chip">🔥 ${item.bizcAlto}×${item.bizcAncho}×${item.bizcProf}</span></div><div class="historial-item-meta">${item.fecha}</div>`
    }
    lista.appendChild(div)
  })
}

function borrarItem(id){
  historial = historial.filter(i => i.id !== id)
  guardarHistorial()
}

function limpiarHistorialConfirmado(){
  historial = []
  localStorage.setItem("contraccion_historial", JSON.stringify(historial))
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

async function descargarPDF(){
  if(!historial.length) return
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" })
  const W=210, m=18; let y=0
  const MARRON=[139,111,86], GRIS=[245,240,235], BLANCO=[255,255,255], NEGRO=[40,35,30]

  doc.setFillColor(...MARRON); doc.rect(0,0,W,40,"F")
  const logo = await cargarLogoBase64()
  if(logo) doc.addImage(logo,"PNG",m,8,22,22)
  doc.setTextColor(...BLANCO); doc.setFontSize(20); doc.setFont("helvetica","bold"); doc.text("YCA Ceramica",m+28,17)
  doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.text("Calculadora de Contraccion",m+28,24)
  doc.setFontSize(8); doc.text("instagram: @ycaceramica   |   tiktok: @yca.ceramica   |   youtube: @YCACeramica",m+28,31)
  doc.text(`Generado: ${new Date().toLocaleDateString("es-AR",{day:"2-digit",month:"long",year:"numeric"})}`,W-m,36,{align:"right"})
  y=50

  historial.forEach((item, idx) => {
    const h = item.modo==="personalizado" ? 52 : 38
    if(y+h>272){ doc.addPage(); y=20 }
    doc.setFillColor(...GRIS); doc.roundedRect(m,y,W-m*2,h,4,4,"F")
    doc.setTextColor(...MARRON); doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.text(`#${idx+1}`,m+5,y+9)
    const titulo = item.modo==="estandar"?"Estandar 10%":item.modo==="personalizado"?`Medicion · ${item.arcilla}`:`Perfil · ${item.arcilla}`
    doc.setTextColor(...NEGRO); doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.text(titulo,m+18,y+9)
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(120,110,100); doc.text(item.fecha,W-m-5,y+9,{align:"right"})

    const cw = (W-m*2-40)/3
    const filas = item.modo==="estandar"
      ? [{l:"CRUDO",v:[item.alto,item.ancho,item.prof]},{l:"BIZCOCHO",v:[item.bizcAlto,item.bizcAncho,item.bizcProf]}]
      : item.modo==="personalizado"
      ? [{l:"CUERO",v:[item.cueroAlto,item.cueroAncho,item.cueroProf]},{l:"BIZCOCHO",v:[item.bizcAlto,item.bizcAncho,item.bizcProf]},{l:"CONTRACCION",v:[item.contAlto+"%",item.contAncho+"%",item.contProf+"%"]}]
      : [{l:"CRUDO",v:[item.crudoAlto,item.crudoAncho,item.crudoProf]},{l:"BIZCOCHO",v:[item.bizcAlto,item.bizcAncho,item.bizcProf]}]

    filas.forEach((f,fi) => {
      const fy=y+14+fi*12
      if(fy+10>y+h) return
      doc.setTextColor(120,110,100); doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.text(f.l,m+4,fy+6)
      f.v.forEach((v,vi) => {
        const x=m+38+vi*(cw+4)
        doc.setFillColor(...BLANCO); doc.roundedRect(x,fy,cw,9,2,2,"F")
        doc.setTextColor(...MARRON); doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.text(String(v)+(String(v).includes("%")?"":String(v)!=="—"?" cm":""),x+4,fy+6)
      })
    })
    y+=h+6
  })

  doc.setFillColor(...GRIS); doc.rect(0,287,W,10,"F")
  doc.setTextColor(160,150,140); doc.setFontSize(7); doc.setFont("helvetica","normal")
  doc.text("ycaceramica.github.io  |  YCA Ceramica © 2026",W/2,293,{align:"center"})
  doc.save("YCA_Ceramica_Contraccion.pdf")
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
renderizarHistorial()
renderizarPerfiles()

// ─────────────────────────────────────────────
// MI TALLER (Fase 3)
// ─────────────────────────────────────────────
function verificarSesionTaller(){
  try {
    const ceramista = JSON.parse(localStorage.getItem("ceramista_sesion") || "null")
    const alumno    = JSON.parse(sessionStorage.getItem("yca_sesion") || "null")
    const activo    = (ceramista && ceramista.token) || (alumno && alumno.rol === 'alumno' && alumno.token)
    const b0 = document.getElementById("btnTallerEstandar"); if(b0) { if(activo) { b0.style.removeProperty("display"); b0.style.display = "flex" } else { b0.style.display = "none" } }
    const b1 = document.getElementById("btnTallerPersonalizado"); if(b1) { if(activo) { b1.style.removeProperty("display"); b1.style.display = "flex" } else { b1.style.display = "none" } }
    const b2 = document.getElementById("btnTallerPerfil"); if(b2) { if(activo) { b2.style.removeProperty("display"); b2.style.display = "flex" } else { b2.style.display = "none" } }
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
    const hist = JSON.parse(localStorage.getItem("contraccion_historial") || "[]")
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
          calculadora: "contraccion",
          nombre:      item.modo === "estandar"
            ? `Estándar ${item.alto}×${item.ancho}×${item.prof} cm`
            : item.modo === "personalizado"
              ? `${item.arcilla || "Personalizado"} ${item.cueroAlto}×${item.cueroAncho}×${item.cueroProf}`
              : `Perfil ${item.arcilla || ""} ${item.crudoAlto}×${item.crudoAncho}×${item.crudoProf}`,
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
