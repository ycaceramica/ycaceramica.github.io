function mostrarSkeleton(gridId, cantidad, claseGrid) {
  const grid = document.getElementById(gridId)
  if(!grid) return
  grid.innerHTML = Array(cantidad).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-foto"></div>
      <div class="skeleton-body">
        <div class="skeleton-line titulo"></div>
        <div class="skeleton-line subtitulo"></div>
        <div class="skeleton-line precio"></div>
      </div>
    </div>`).join('')
}
const API = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'
let engobesData  = []
let engobeActivo = null
let accesoLibreEngobes = true

// Dark mode y nav manejados por nav-ceramista.js

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
// MODAL GENÉRICO
// ─────────────────────────────────────────────
let modalCallback = null
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
// TOGGLE CUSTOM
// ─────────────────────────────────────────────

function toggleCustom(){
  const checked = document.getElementById("checkCustom").checked
  document.getElementById("controlCustom").classList.toggle("oculto", !checked)
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

  const componentes = [{ nombre: "Arcilla Base", emoji: "🟤", pct: pctTinkar }]
  componentes.push({ nombre: "Fundente", emoji: "⚪", pct: pctFlux })

  if(conColor){
    componentes.push({
      nombre: tipoActual === "oxido" ? "Óxido"    : "Pigmento",
      emoji:  tipoActual === "oxido" ? "🔴"        : "🎨",
      pct: pctColorante
    })
  }

  if(conFeldes) componentes.push({ nombre: "Feldespato", emoji: "🪨", pct: pctFeldespato })

  const conCustom    = document.getElementById("checkCustom").checked
  const pctCustom    = conCustom ? (parseFloat(document.getElementById("inputCustom").value) || 0) : 0
  const nombreCustom = document.getElementById("nombreCustom").value.trim() || "Ingrediente"
  if(conCustom) componentes.push({ nombre: nombreCustom, emoji: "✏️", pct: pctCustom })

  return { total, componentes, suma: pctTinkar + pctFlux + pctColorante + pctFeldespato + pctCustom }
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
    aviso.innerText = `Falta ${100 - suma}% — completá con Arcilla Base`
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
    mostrarModal({ titulo:"⚠️ Sin nombre", texto:"Poné un nombre a la fórmula antes de guardar.", confirmar:"Entendido", cancelar:false })
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
  mostrarModal({
    titulo:"🗑 Limpiar historial",
    texto:"¿Borrar todo el historial? Esta acción no se puede deshacer.",
    confirmar:"Borrar todo",
    accion: () => {
      historial = []
      localStorage.setItem("engobes_historial", JSON.stringify(historial))
      renderizarHistorial()
    }
  })
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

  // Logo real (sin círculo de fondo)
  const logoBase64 = await cargarLogoBase64()
  if(logoBase64){
    doc.addImage(logoBase64, "PNG", margen, 8, 22, 22)
  } else {
    doc.setTextColor(...BLANCO)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("YCA", margen + 3, 22)
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

    // Número estilo #1
    doc.setTextColor(...MARRON)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(`#${idx + 1}`, margen + 5, y + 9)

    // Nombre
    doc.setTextColor(...NEGRO)
    doc.setFontSize(13)
    doc.setFont("helvetica", "bold")
    doc.text(f.nombre, margen + 18, y + 9)

    // Meta
    const tipo = f.tipo === "oxido" ? "Oxidos" : "Pigmentos"
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(120, 110, 100)
    doc.text(`${tipo}  |  ${f.total}g totales  |  ${f.fecha}`, margen + 18, y + 15)

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
  doc.text("ycaceramica.com.ar  |  YCA Cerámica © 2026", W / 2, 293, { align: "center" })

  doc.save("YCA_Ceramica_Engobes.pdf")
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

calcular()
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
    const hist = JSON.parse(localStorage.getItem("engobes_historial") || "[]")
    if(!hist.length){
      mostrarModal({ titulo:"⚠️ Sin datos", texto:"Guardá un cálculo en el historial primero.", confirmar:"Entendido", cancelar:false })
      return
    }
    const item    = hist[0]
    const action  = esCeramista ? "guardarHistorialTaller" : "guardarHistorialAlumno"
    const idKey   = esCeramista ? "ceramistaId" : "alumnoId"
    const userId  = esCeramista ? ceramista.id : alumno.id
    const destino = esCeramista ? "mi taller" : "mi cuenta"
    // Chequear límite de historial
    const esPro   = sesion.plan === 'pro'
    const limite  = esPro ? 30 : 10
    const histAction = esCeramista ? 'getHistorialTaller' : 'getHistorialAlumno'
    try {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', API + '?action=' + histAction + '&id=' + encodeURIComponent(sesion.id), false)
      xhr.send()
      const dataH = JSON.parse(xhr.responseText)
      const totalGuardados = (dataH.data || []).length
      if(totalGuardados >= limite){
        const msg = esPro
          ? `Llegaste al límite de ${limite} resultados guardados.`
          : `Llegaste al límite de ${limite} resultados (plan gratuito). Eliminá alguno o pasá al plan Pro para guardar hasta 30.`
        mostrarModal({ titulo: 'Límite alcanzado', texto: msg, confirmar: 'Entendido', cancelar: false })
        return
      }
    } catch(e){ /* si falla el chequeo, permitir guardar igual */ }
    fetch("https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec", {
      method: "POST",
      body: JSON.stringify({
        action,
        [idKey]: userId,
        item: {
          calculadora: "engobes",
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
// TABS ENGOBES
// ─────────────────────────────────────────────

function setTabEngobes(tab){
  const esCalc = tab === 'calculadora'
  document.getElementById('seccionCalculadora').style.display = esCalc ? '' : 'none'
  document.getElementById('seccionCatalogo').style.display    = esCalc ? 'none' : ''
  document.getElementById('tabCalculadora').classList.toggle('activo', esCalc)
  document.getElementById('tabCatalogo').classList.toggle('activo', !esCalc)
  if(!esCalc && engobesData.length === 0) cargarEngobes()
}

// Cargar catálogo al inicio (tab por defecto)
window.addEventListener('DOMContentLoaded', () => { cargarEngobes() })

// ─────────────────────────────────────────────
// CATÁLOGO DE ENGOBES DEL TALLER
// ─────────────────────────────────────────────

async function cargarEngobes(){
  const estado = document.getElementById('estadoCatalogo')
  const grid   = document.getElementById('engobesGrid')
  estado.style.display = 'none'
  mostrarSkeleton('engobesGrid', 6)
  try {
    const [resEngobes, resConfig] = await Promise.all([
      fetch(`${API}?action=getEngobes`),
      fetch(`${API}?action=getConfigIndex`)
    ])
    const dataEngobes = await resEngobes.json()
    const dataConfig  = await resConfig.json()
    engobesData = dataEngobes.data || []
    accesoLibreEngobes = String(dataConfig.data?.engobes_acceso_libre ?? 'true') !== 'false'
    sessionStorage.setItem('yca_engobes', JSON.stringify(engobesData))
    sessionStorage.setItem('yca_engobes_ts', Date.now())

    estado.style.display = 'none'
    if(engobesData.length === 0){
      grid.innerHTML = '<p class="pastas-vacio">Próximamente — estamos preparando los engobes 🎨</p>'
      return
    }
    const wrapper = document.getElementById('engobeBuscadorWrapper')
    if(wrapper) wrapper.style.display = 'flex'
    renderEngobes(engobesData)
  } catch(e){
    estado.innerHTML = '<p style="opacity:0.5">Error al cargar. Revisá tu conexión.</p>'
  }
}

function filtrarEngobes(){
  const busq = document.getElementById('engobeBuscador')?.value.trim().toLowerCase()
  if(!busq){ renderEngobes(engobesData); return }
  const filtradas = engobesData.filter(e =>
    (e.nombre||'').toLowerCase().includes(busq) ||
    (e.codigo||'').toLowerCase().includes(busq)
  )
  renderEngobes(filtradas)
}

function renderEngobes(engobes){
  const grid = document.getElementById('engobesGrid')
  grid.innerHTML = ''
  const ordenados = [...engobes].sort((a,b) => {
    const ca = a.codigo || '', cb = b.codigo || ''
    if(!ca && !cb) return 0
    if(!ca) return 1
    if(!cb) return -1
    return ca.localeCompare(cb, 'es', { numeric: true })
  })
  ordenados.forEach(engobe => {
    let comps = []
    try { comps = JSON.parse(engobe.componentes || '[]') } catch(e){}
    const card = document.createElement('div')
    card.className = 'pasta-card'
    card.onclick = () => abrirEngobeModal(engobe)
    card.innerHTML = `
      <div class="pasta-card-foto">
        ${engobe.foto
          ? `<img src="${engobe.foto}" alt="${engobe.nombre}" loading="lazy">`
          : `<div class="pasta-card-foto-placeholder"><i class="fa-solid fa-paint-brush"></i></div>`}
      </div>
      <div class="pasta-card-body">
        ${engobe.codigo ? `<div class="pasta-card-codigo">${engobe.codigo}</div>` : ''}
        <h3 class="pasta-card-nombre">${String(engobe.nombre||'')}</h3>
        <div class="pasta-card-chips">
          ${comps.slice(0,3).map(c => `<span class="pasta-chip">${c.nombre} ${c.porcentaje}%</span>`).join('')}
          ${comps.length > 3 ? `<span class="pasta-chip pasta-chip-mas">+${comps.length - 3} más</span>` : ''}
        </div>
        <div class="pasta-card-cta">Ver fórmula →</div>
      </div>
    `
    grid.appendChild(card)
  })
}

// ─────────────────────────────────────────────
// MODAL ENGOBE
// ─────────────────────────────────────────────

function abrirEngobeModal(engobe){
  engobeActivo = engobe
  let comps = []
  try { comps = JSON.parse(engobe.componentes || '[]') } catch(e){}

  const fotoEl = document.getElementById('engobeModalFoto')
  fotoEl.style.display = engobe.foto ? 'block' : 'none'
  if(engobe.foto) fotoEl.innerHTML = `<img src="${engobe.foto}" alt="${engobe.nombre}">`

  const codigoEl = document.getElementById('engobeModalCodigo')
  if(codigoEl){ codigoEl.innerText = engobe.codigo || ''; codigoEl.style.display = engobe.codigo ? 'block' : 'none' }

  const nombreStr = String(engobe.nombre || '')
  document.getElementById('engobeModalNombre').innerText = nombreStr
  document.getElementById('engobeModalHeaderNombre').innerText = nombreStr

  const descEl = document.getElementById('engobeModalDesc')
  descEl.innerText     = engobe.descripcion || ''
  descEl.style.display = engobe.descripcion ? 'block' : 'none'

  const tabla = document.getElementById('engobeModalTabla')
  tabla.innerHTML = `
    <div class="cont-tabla">
      <div class="cont-tabla-header" style="grid-template-columns:1fr 80px"><span>Ingrediente</span><span>%</span></div>
      ${comps.map(c => `
        <div class="cont-tabla-fila" style="grid-template-columns:1fr 80px">
          <span>${c.nombre}</span>
          <span style="font-weight:700;color:var(--color-primario)">${(c.valor||c.porcentaje||0)}%</span>
        </div>`).join('')}
    </div>`

  document.getElementById('engobeModalGramos').value = ''
  document.getElementById('engobeModalResultado').style.display = 'none'

  document.getElementById('engobeModal').style.display = 'flex'
  document.body.style.overflow = 'hidden'
}

function cerrarEngobeModal(){
  document.getElementById('engobeModal').style.display = 'none'
  document.body.style.overflow = ''
  engobeActivo = null
}

function engobeModalCalcular(){
  if(!engobeActivo) return
  const gramosBase = parseFloat(document.getElementById('engobeModalGramos').value) || 0
  const resDiv = document.getElementById('engobeModalResultado')
  if(!gramosBase){ resDiv.style.display = 'none'; return }

  let comps = []
  try { comps = JSON.parse(engobeActivo.componentes || '[]') } catch(e){}

  // Los componentes en g son fijos (no escalan)
  // Los componentes en % se calculan sobre gramosBase
  // El total real = gramosBase + suma de gramos fijos
  const resultados = comps.map(c => {
    const val = c.valor || c.porcentaje || 0
    if(c.unidad === 'g'){
      return { nombre: c.nombre, g: val, label: val + ' g (fijo)' }
    } else {
      // % siempre sobre 100, no sobre la suma de porcentajes
      const g = Math.round(gramosBase * val / 100)
      return { nombre: c.nombre, g, label: val + '%' }
    }
  })

  const totalFinal = resultados.reduce((s,r) => s + r.g, 0)

  const grid = document.getElementById('engobeModalResultadoGrid')
  grid.innerHTML = `
    <div class="cont-tabla-header" style="grid-template-columns:1fr 80px 80px"><span>Ingrediente</span><span>Ref.</span><span>Gramos</span></div>
    ${resultados.map(r => `
      <div class="cont-tabla-fila" style="grid-template-columns:1fr 80px 80px">
        <span>${r.nombre}</span>
        <span>${r.label}</span>
        <span style="font-weight:700;color:var(--color-primario)">${r.g} g</span>
      </div>`).join('')}
    <div class="cont-tabla-fila contraccion-total" style="grid-template-columns:1fr 80px">
      <span>Total</span><span>${totalFinal} g</span>
    </div>`

  resDiv.style.display = 'block'
}

function engobeModalGuardar(){
  if(!engobeActivo) return
  const gramosTotal = parseFloat(document.getElementById('engobeModalGramos').value) || 0
  if(!gramosTotal){ mostrarModal({ titulo:'⚠️ Sin datos', texto:'Ingresá los gramos antes de guardar.', confirmar:'Entendido', cancelar:false }); return }
  let comps = []
  try { comps = JSON.parse(engobeActivo.componentes || '[]') } catch(e){}
  const totalPct2 = comps.reduce((s,c) => s + (c.valor||c.porcentaje||0), 0) || 100
  const resultados = comps.map(c => {
    const pct = c.valor||c.porcentaje||0
    const g   = Math.round(gramosTotal * pct / totalPct2)
    return { nombre: c.nombre, porcentaje: pct, gramos: g }
  })
  const totalFinal = gramosTotal
  historial.unshift({
    id: Date.now(),
    nombre: engobeActivo.nombre,
    tipo: 'catalogo',
    gramos: totalFinal,
    componentes: resultados,
    fecha: new Date().toLocaleDateString('es-AR')
  })
  guardarHistorial()
  mostrarModal({ titulo:'✅ Guardado', texto:`El engobe "${engobeActivo.nombre}" fue guardado en el historial.`, confirmar:'¡Genial!', cancelar:false })
}

function engobeModalCopiar(){
  if(!engobeActivo) return
  const gramos = parseFloat(document.getElementById('engobeModalGramos').value) || 0
  let comps = []
  try { comps = JSON.parse(engobeActivo.componentes || '[]') } catch(e){}
  let txt = `${engobeActivo.nombre} — ${gramos}g\n`
  const totalPct = comps.reduce((s,c)=>s+c.porcentaje,0)||100
  comps.forEach(c => { txt += `${c.nombre}: ${Math.round(gramos * c.porcentaje / totalPct)}g (${c.porcentaje}%)\n` })
  navigator.clipboard.writeText(txt)
}

async function engobeModalPDF(){
  if(!engobeActivo) return
  const gramos = parseFloat(document.getElementById('engobeModalGramos').value) || 0
  if(!gramos){ mostrarModal({ titulo:'⚠️ Sin datos', texto:'Ingresá los gramos antes de descargar.', confirmar:'Entendido', cancelar:false }); return }
  let comps = []
  try { comps = JSON.parse(engobeActivo.componentes || '[]') } catch(e){}
  const item = {
    nombre: engobeActivo.nombre, tipo: 'catalogo', gramos,
    componentes: comps.map(c => ({ nombre: c.nombre, porcentaje: c.porcentaje, gramos: Math.round(gramos * c.porcentaje / (comps.reduce((s,x)=>s+x.porcentaje,0)||100)) })),
    fecha: new Date().toLocaleDateString('es-AR')
  }
  await generarPDFItems([item], `YCA_Ceramica_Engobe_${String(engobeActivo.nombre||'engobe').replace(/ /g,'_')}.pdf`)
}
