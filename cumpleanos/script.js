// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────

const WHATSAPP = "5491160387535"
const EMAIL = "ycaceramica@gmail.com"



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
const nav = document.getElementById("nav")

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
// VALIDAR FORMULARIO
// ─────────────────────────────────────────────

function obtenerDatos(){
  const nombre   = document.getElementById("nombre").value.trim()
  const telefono = document.getElementById("telefono").value.trim()
  const email    = document.getElementById("email").value.trim()
  const cantidad = document.getElementById("cantidad").value
  const combo    = document.getElementById("combo").value
  const fecha    = document.getElementById("fecha").value
  const mensaje  = document.getElementById("mensaje").value.trim()

  if(!nombre || !telefono || !email || !cantidad || !combo){
    alert("Por favor completá todos los campos obligatorios (*)")
    return null
  }

  return { nombre, telefono, email, cantidad, combo, fecha, mensaje }
}

function armarTexto(datos){
  return `Hola! Me interesa el servicio de Cumpleaños Cerámico 🎨

👤 Nombre: ${datos.nombre}
📱 Teléfono: ${datos.telefono}
📧 Email: ${datos.email}
👧 Cantidad de niños y niñas: ${datos.cantidad}
🎁 Combo de interés: ${datos.combo}
📅 Fecha estimada: ${datos.fecha || "A confirmar"}
💬 Mensaje: ${datos.mensaje || "Sin mensaje adicional"}`
}



// ─────────────────────────────────────────────
// ENVIAR POR WHATSAPP
// ─────────────────────────────────────────────

function enviarWhatsApp(){
  const datos = obtenerDatos()
  if(!datos) return

  const texto = armarTexto(datos)
  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`
  window.open(url, "_blank")
}



// ─────────────────────────────────────────────
// ENVIAR POR EMAIL
// ─────────────────────────────────────────────

function enviarEmail(){
  const datos = obtenerDatos()
  if(!datos) return

  const asunto = encodeURIComponent("Consulta Cumpleaños Cerámico — YCA Cerámica")
  const cuerpo = encodeURIComponent(armarTexto(datos))
  const url = `mailto:${EMAIL}?subject=${asunto}&body=${cuerpo}`
  window.location.href = url
}
