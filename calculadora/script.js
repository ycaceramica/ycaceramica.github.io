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

let tipoActual       = "rectangular"
let proporcionActual = 75
let historial        = JSON.parse(localStorage.getItem("yeso_historial") || "[]")

// ─────────────────────────────────────────────
// TIPO DE MOLDE
// ─────────────────────────────────────────────

function setTipo(tipo){
  tipoActual = tipo
  document.getElementById("btnRectangular").classList.toggle("activo", tipo === "rectangular")
  document.getElementById("btnCircular").classList.toggle("activo",    tipo === "circular")
  document.getElementById("camposRectangular").style.display = tipo === "rectangular" ? "block" : "none"
  document.getElementById("camposCircular").style.display    = tipo === "circular"    ? "block" : "none"
  calcular()
}

// ─────────────────────────────────────────────
// PROPORCIÓN
// ─────────────────────────────────────────────

function setProporcion(valor){
  proporcionActual = valor
  document.querySelectorAll(".prop-btn").forEach(b => b.classList.remove("activo"))
  document.getElementById("prop" + valor).classList.add("activo")
  calcular()
}

// ─────────────────────────────────────────────
// CALCULAR
// ─────────────────────────────────────────────

function calcular(){
  const cantidad = parseFloat(document.getElementById("cantidad").value) || 1
  let volumen    = 0

  if(tipoActual === "rectangular"){
    const largo       = parseFloat(document.getElementById("largo").value)       || 0
    const ancho       = parseFloat(document.getElementById("ancho").value)       || 0
    const profundidad = parseFloat(document.getElementById("profundidad").value) || 0
    volumen = (largo * ancho * profundidad) / 1.3
  } else {
    const rp = parseFloat(document.getElementById("radioPieza").value)  || 0
    const rm = parseFloat(document.getElementById("radioMolde").value)  || 0
    const ap = parseFloat(document.getElementById("alturaPieza").value) || 0
    const am = parseFloat(document.getElementById("alturaMolde").value) || 0
    volumen = (Math.PI * rm * rm * am - Math.PI * rp * rp * ap) / 1.3
  }

  const agua = volumen * cantidad
  const yeso = (agua * 100) / proporcionActual

  document.getElementById("agua").innerText = agua.toFixed(2)
  document.getElementById("yeso").innerText = yeso.toFixed(2)
}

// ─────────────────────────────────────────────
// GUARDAR EN HISTORIAL
// ─────────────────────────────────────────────

function guardar(){
  const agua = document.getElementById("agua").innerText
  const yeso = document.getElementById("yeso").innerText

  if(parseFloat(agua) === 0 && parseFloat(yeso) === 0){
    mostrarModal({ titulo:"⚠️ Sin datos", texto:"Completá las dimensiones antes de guardar.", confirmar:"Entendido", cancelar:false })
    return
  }

  const cantidad = document.getElementById("cantidad").value || 1

  let detalle = ""
  if(tipoActual === "rectangular"){
    const l = document.getElementById("largo").value       || 0
    const a = document.getElementById("ancho").value       || 0
    const p = document.getElementById("profundidad").value || 0
    detalle = `${l}×${a}×${p} cm`
  } else {
    const rp = document.getElementById("radioPieza").value  || 0
    const rm = document.getElementById("radioMolde").value  || 0
    const ap = document.getElementById("alturaPieza").value || 0
    const am = document.getElementById("alturaMolde").value || 0
    detalle = `R.pieza ${rp}cm · R.molde ${rm}cm · Alt.pieza ${ap}cm · Alt.molde ${am}cm`
  }

  const item = {
    id:          Date.now(),
    tipo:        tipoActual,
    proporcion:  proporcionActual,
    cantidad:    cantidad,
    detalle:     detalle,
    agua:        agua,
    yeso:        yeso,
    fecha:       new Date().toLocaleDateString("es-AR")
  }

  historial.unshift(item)
  localStorage.setItem("yeso_historial", JSON.stringify(historial))
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
    lista.innerHTML = '<p class="historial-vacio">Guardá un cálculo para verlo aquí.</p>'
    btnPDF.disabled      = true
    btnLim.style.display = "none"
    return
  }

  btnPDF.disabled      = false
  btnLim.style.display = "inline-flex"

  historial.forEach(item => {
    const tipoNombre = item.tipo === "rectangular" ? "Rectangular" : "Circular"
    const div = document.createElement("div")
    div.className = "historial-item"
    div.innerHTML = `
      <button class="historial-item-borrar" onclick="borrarItem(${item.id})">✕</button>
      <div class="historial-item-tipo">${tipoNombre} · ${item.cantidad} molde${item.cantidad > 1 ? "s" : ""} · ${item.proporcion}%</div>
      <div class="historial-item-valores">
        <span class="historial-chip">💧 ${item.agua} ml</span>
        <span class="historial-chip">🧱 ${item.yeso} g</span>
      </div>
      <div class="historial-item-meta">${item.detalle} · ${item.fecha}</div>
    `
    lista.appendChild(div)
  })
}

function borrarItem(id){
  historial = historial.filter(i => i.id !== id)
  localStorage.setItem("yeso_historial", JSON.stringify(historial))
  renderizarHistorial()
}

function limpiarHistorial(){
  mostrarModal({
    titulo:"🗑 Limpiar historial",
    texto:"¿Borrar todo el historial? Esta acción no se puede deshacer.",
    confirmar:"Borrar todo",
    accion: () => {
      historial = []
      localStorage.setItem("yeso_historial", JSON.stringify(historial))
      renderizarHistorial()
    }
  })
}

// ─────────────────────────────────────────────
// COPIAR
// ─────────────────────────────────────────────

function copiar(){
  const agua = document.getElementById("agua").innerText
  const yeso = document.getElementById("yeso").innerText
  navigator.clipboard.writeText(`Agua: ${agua} ml | Yeso: ${yeso} g`).then(() => {
    const btn = document.querySelector(".btn-copiar")
    btn.innerText = "✓ Copiado"
    setTimeout(() => {
      btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar'
    }, 2000)
  })
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

  // ── ENCABEZADO ──
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
  doc.text("Calculadora de Yeso", margen + 28, 24)

  doc.setFontSize(8)
  doc.text("instagram: @ycaceramica   |   tiktok: @yca.ceramica   |   youtube: @YCACeramica", margen + 28, 31)

  const fecha = new Date().toLocaleDateString("es-AR", { day:"2-digit", month:"long", year:"numeric" })
  doc.text(`Generado: ${fecha}`, W - margen, 36, { align: "right" })

  y = 50

  // ── CÁLCULOS ──
  historial.forEach((item, idx) => {

    const altoEstimado = 32
    if(y + altoEstimado > 272){ doc.addPage(); y = 20 }

    doc.setFillColor(...GRIS_CLARO)
    doc.roundedRect(margen, y, W - margen * 2, altoEstimado, 4, 4, "F")

    // Número
    doc.setTextColor(...MARRON)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(`#${idx + 1}`, margen + 5, y + 9)

    // Tipo y detalle
    const tipoNombre = item.tipo === "rectangular" ? "Rectangular" : "Circular"
    doc.setTextColor(...NEGRO)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(`${tipoNombre} · ${item.cantidad} molde${item.cantidad > 1 ? "s" : ""} · Proporcion ${item.proporcion}%`, margen + 18, y + 9)

    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(120, 110, 100)
    doc.text(item.detalle, margen + 18, y + 15)
    doc.text(item.fecha, W - margen - 5, y + 9, { align: "right" })

    // Resultados
    const colW = (W - margen * 2 - 6) / 2

    // Agua
    doc.setFillColor(...BLANCO)
    doc.roundedRect(margen, y + 18, colW, 11, 2, 2, "F")
    doc.setTextColor(120, 110, 100)
    doc.setFontSize(7)
    doc.setFont("helvetica", "bold")
    doc.text("AGUA", margen + 8, y + 23)
    doc.setTextColor(...MARRON)
    doc.setFontSize(11)
    doc.text(`${item.agua} ml`, margen + 24, y + 23)

    // Yeso
    doc.setFillColor(...BLANCO)
    doc.roundedRect(margen + colW + 6, y + 18, colW, 11, 2, 2, "F")
    doc.setTextColor(120, 110, 100)
    doc.setFontSize(7)
    doc.setFont("helvetica", "bold")
    doc.text("YESO", margen + colW + 14, y + 23)
    doc.setTextColor(...MARRON)
    doc.setFontSize(11)
    doc.text(`${item.yeso} g`, margen + colW + 30, y + 23)

    y += altoEstimado + 6
  })

  // ── PIE ──
  doc.setFillColor(...GRIS_CLARO)
  doc.rect(0, 287, W, 10, "F")
  doc.setTextColor(160, 150, 140)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text("ycaceramica.github.io  |  YCA Ceramica © 2026", W / 2, 293, { align: "center" })

  doc.save("YCA_Ceramica_Yeso.pdf")
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

calcular()
renderizarHistorial()

// ─────────────────────────────────────────────
// MI TALLER (Fase 3 — por ahora muestra el botón solo si hay sesión)
// ─────────────────────────────────────────────
function verificarSesionTaller(){
  try {
    const ceramista = JSON.parse(localStorage.getItem("ceramista_sesion") || "null")
    const alumno    = JSON.parse(sessionStorage.getItem("yca_sesion") || "null")
    const activo    = (ceramista && ceramista.token) || (alumno && alumno.rol === 'alumno' && alumno.token)
    const btn = document.getElementById("btnTaller")
    if(btn) btn.style.display = activo ? "flex" : "none"
  } catch(e){}
} catch(e){}
}
function guardarEnTaller(){
  try {
    // Detectar sesión — ceramista o alumno
    const ceramista = JSON.parse(localStorage.getItem("ceramista_sesion") || "null")
    const alumno    = JSON.parse(sessionStorage.getItem("yca_sesion") || "null")
    const esCeramista = ceramista && ceramista.token
    const esAlumno    = !esCeramista && alumno && alumno.rol === 'alumno' && alumno.token

    if(!esCeramista && !esAlumno){
      mostrarModal({ titulo:"👤 Iniciá sesión", texto:"Iniciá sesión para guardar tus cálculos en tu cuenta.", confirmar:"Entendido", cancelar:false })
      return
    }
    const hist = JSON.parse(localStorage.getItem("yeso_historial") || "[]")
    if(!hist.length){
      mostrarModal({ titulo:"⚠️ Sin datos", texto:"Guardá un cálculo en el historial primero.", confirmar:"Entendido", cancelar:false })
      return
    }
    const item      = hist[0]
    const action    = esCeramista ? "guardarHistorialTaller" : "guardarHistorialAlumno"
    const idKey     = esCeramista ? "ceramistaId" : "alumnoId"
    const userId    = esCeramista ? ceramista.id : alumno.id
    const destino   = esCeramista ? "mi taller" : "mi cuenta"
    fetch("https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec", {
      method: "POST",
      body: JSON.stringify({
        action,
        [idKey]: userId,
        item: {
          calculadora: "yeso",
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
    const hist = JSON.parse(localStorage.getItem("yeso_historial") || "[]")
    if(!hist.length){
      mostrarModal({ titulo:"⚠️ Sin datos", texto:"Guardá un cálculo en el historial primero.", confirmar:"Entendido", cancelar:false })
      return
    }
    const item = hist[0]
    fetch("https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec", {
      method: "POST",
      body: JSON.stringify({
        action:       "guardarHistorialTaller",
        ceramistaId:  s.id,
        item: {
          calculadora: "yeso",
          nombre:      item.nombre || item.arcilla || item.tipo || "Cálculo",
          datos:       item
        }
      })
    }).then(r => r.json()).then(data => {
      if(data.ok){
        mostrarModal({ titulo:"✅ Guardado en tu taller", texto:"El cálculo fue sincronizado con tu cuenta ceramista.", confirmar:"¡Genial!", cancelar:false })
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
