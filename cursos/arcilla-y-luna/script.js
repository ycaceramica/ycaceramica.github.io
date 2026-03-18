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

  let texto = `¡Hola! Me interesa reservar un lugar en Arcilla y Luna 🌙\n\n`
  texto += `*Nombre:* ${nombre}\n`
  texto += `*Email:* ${email}\n`
  if(telefono)  texto += `*Teléfono:* ${telefono}\n`
  if(conociste) texto += `*¿Cómo nos conoció?:* ${conociste}\n`
  if(mensaje)   texto += `*Mensaje:* ${mensaje}\n`

  window.open(`https://wa.me/5491160387535?text=${encodeURIComponent(texto)}`, "_blank")
}
