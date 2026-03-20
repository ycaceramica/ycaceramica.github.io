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
// Ocultar banner ceramista si ya hay sesión (alumno o ceramista)
function ocultarBannerSiSesion(){
  try {
    const ceramista = JSON.parse(localStorage.getItem('ceramista_sesion') || 'null')
    const alumno    = JSON.parse(sessionStorage.getItem('yca_sesion') || 'null')
    const tienesSesion = (ceramista && ceramista.token) || (alumno && alumno.token)
    if(tienesSesion){
      const banner = document.getElementById('ceramistaBanner')
      if(banner) banner.style.display = 'none'
    }
  } catch(e){}
}
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', ocultarBannerSiSesion)
} else {
  ocultarBannerSiSesion()
}
