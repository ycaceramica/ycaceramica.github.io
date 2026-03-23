// Dark mode y nav manejados por nav-ceramista.js

// ─────────────────────────────────────────────
// FORMULARIO → WHATSAPP
// ─────────────────────────────────────────────

function enviarConsulta(){
  const nombre    = document.getElementById("fNombre").value.trim()
  const email     = document.getElementById("fEmail").value.trim()
  const telefono  = document.getElementById("fTelefono").value.trim()
  const conociste = document.getElementById("fConociste").value
  const mensaje   = document.getElementById("fMensaje").value.trim()

  if(!nombre || !email){
    const err = document.getElementById("formError")
    if(err){ err.innerText = "Por favor completá al menos tu nombre y email."; err.style.display = "block" }
    return
  }
  const err = document.getElementById("formError")
  if(err) err.style.display = "none"

  let texto = `¡Hola! Me interesa el Taller de Cerámica Inicial 🏺\n\n`
  texto += `*Nombre:* ${nombre}\n`
  texto += `*Email:* ${email}\n`
  if(telefono)  texto += `*Teléfono:* ${telefono}\n`
  if(conociste) texto += `*¿Cómo nos conoció?:* ${conociste}\n`
  if(mensaje)   texto += `*Mensaje:* ${mensaje}\n`

  window.open(`https://wa.me/5491160387535?text=${encodeURIComponent(texto)}`, "_blank")
}
