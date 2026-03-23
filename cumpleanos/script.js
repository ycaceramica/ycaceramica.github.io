// ─────────────────────────────────────────────
// Dark mode y nav manejados por nav-ceramista.js

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
