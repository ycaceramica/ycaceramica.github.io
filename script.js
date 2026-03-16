// MODO OSCURO — recuerda la preferencia y cambia ícono

function actualizarIcono(){
  const btn = document.getElementById("toggleDark")
  if(btn){
    btn.innerText = document.body.classList.contains("dark") ? "☀️" : "🌙"
  }
}

function aplicarModoOscuro(){
  if(localStorage.getItem("dark") === "true"){
    document.body.classList.add("dark")
  }
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



// MENU HAMBURGUESA

const hamburguesa = document.getElementById("hamburguesa")
const nav = document.getElementById("nav")

if(hamburguesa){
  hamburguesa.addEventListener("click", () => {
    nav.classList.toggle("active")
  })
}

window.addEventListener("scroll", () => {
  if(nav) nav.classList.remove("active")
})

const linksNav = document.querySelectorAll(".nav a")

linksNav.forEach(link => {
  link.addEventListener("click", () => {
    nav.classList.remove("active")
  })
})



// ANIMACION SCROLL

function reveal(){

  const reveals = document.querySelectorAll(".reveal")

  for(let i = 0; i < reveals.length; i++){

    const windowHeight = window.innerHeight
    const elementTop = reveals[i].getBoundingClientRect().top
    const elementVisible = 80

    if(elementTop < windowHeight - elementVisible){
      reveals[i].classList.add("visible")
    }

  }

}

window.addEventListener("scroll", reveal)
window.addEventListener("load", reveal)

reveal()

// OCULTAR FLECHA AL SCROLLEAR
const scrollIndicator = document.getElementById("scrollIndicator")

window.addEventListener("scroll", () => {
  if(window.scrollY > 50){
    scrollIndicator.classList.add("oculto")
  } else {
    scrollIndicator.classList.remove("oculto")
  }
})

// ─────────────────────────────────────────────
// GALERÍA DINÁMICA
// ─────────────────────────────────────────────

const API = "https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec"

async function cargarGaleria(){
  const grid = document.getElementById("galeriaGrid")
  if(!grid) return

  try {
    const res   = await fetch(`${API}?action=getGaleria`)
    const data  = await res.json()
    const slots = (data.data || []).filter(s => s.foto)

    if(slots.length === 0) return // mantener placeholders si no hay fotos

    grid.innerHTML = ''
    const ordenados = [1,2,3,4].map(n =>
      slots.find(s => String(s.slot) === String(n) || s.id === 'GAL-' + n)
    ).filter(Boolean)

    ordenados.forEach(slot => {
      const img = document.createElement('img')
      img.src     = slot.foto
      img.alt     = slot.alt || 'Foto de galería YCA Cerámica'
      img.loading = 'lazy'
      img.onerror = () => img.style.display = 'none'
      grid.appendChild(img)
    })

  } catch(e) {
    // Si falla silenciosamente — los placeholders se quedan
  }
}

cargarGaleria()

// ─────────────────────────────────────────────
// VISIBILIDAD SECCIÓN ELABORACIÓN
// ─────────────────────────────────────────────

async function verificarVisibilidadElaboracion(){
  try {
    const res    = await fetch(`${API}?action=getConfigIndex`)
    const data   = await res.json()
    const config = data.data || {}

    if(config.elaboracion_visible === 'false'){
      const banner = document.getElementById('banner-elaboracion')
      if(banner) banner.style.display = 'none'
    }
  } catch(e) {
    // Silencioso — si falla queda visible por defecto
  }
}

verificarVisibilidadElaboracion()
