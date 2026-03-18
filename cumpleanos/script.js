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

document.getElementById("toggleDark")?.addEventListener("click", () => {
  document.body.classList.toggle("dark")
  localStorage.setItem("dark", document.body.classList.contains("dark"))
  actualizarIcono()
})

// ─────────────────────────────────────────────
// HAMBURGUESA
// ─────────────────────────────────────────────

document.getElementById("hamburguesa")?.addEventListener("click", () => {
  document.getElementById("nav").classList.toggle("active")
})

document.querySelectorAll(".nav a").forEach(l => {
  l.addEventListener("click", () => document.getElementById("nav").classList.remove("active"))
})

window.addEventListener("scroll", () => {
  document.getElementById("nav")?.classList.remove("active")
})

// ─────────────────────────────────────────────
// LIGHTBOX
// ─────────────────────────────────────────────

function abrirLightbox(src){
  document.getElementById("lightbox-img").src = src
  document.getElementById("lightbox").style.display = "flex"
  document.body.style.overflow = "hidden"
}

function cerrarLightbox(){
  document.getElementById("lightbox").style.display = "none"
  document.body.style.overflow = ""
}

document.getElementById("lightbox")?.addEventListener("click", (e) => {
  if(e.target === document.getElementById("lightbox")) cerrarLightbox()
})

document.addEventListener("keydown", (e) => {
  if(e.key === "Escape") cerrarLightbox()
})

// ─────────────────────────────────────────────
// FORMULARIO — ENVIAR POR WHATSAPP
// ─────────────────────────────────────────────

function enviarWhatsApp(){
  const nombre   = document.getElementById("nombre").value.trim()
  const telefono = document.getElementById("telefono").value.trim()
  const email    = document.getElementById("email").value.trim()
  const cantidad = document.getElementById("cantidad").value
  const combo    = document.getElementById("combo").value
  const fecha    = document.getElementById("fecha").value
  const mensaje  = document.getElementById("mensaje").value.trim()

  // Validar campos obligatorios
  const err = document.getElementById("formError")
  if(!nombre || !telefono || !email || !cantidad || !combo){
    if(err){ err.innerText = "Por favor completá todos los campos obligatorios (*)"; err.style.display = "block" }
    return
  }
  if(err) err.style.display = "none"

  let texto = `¡Hola! Quiero consultar sobre un Cumpleaños Cerámico 🎨\n\n`
  texto += `*Nombre:* ${nombre}\n`
  texto += `*Teléfono:* ${telefono}\n`
  texto += `*Email:* ${email}\n`
  texto += `*Cantidad de chicos:* ${cantidad}\n`
  texto += `*Combo:* ${combo}\n`
  if(fecha) texto += `*Fecha estimada:* ${new Date(fecha + "T00:00:00").toLocaleDateString("es-AR")}\n`
  if(mensaje) texto += `*Mensaje:* ${mensaje}\n`

  const url = `https://wa.me/5491160387535?text=${encodeURIComponent(texto)}`
  window.open(url, "_blank")
}
