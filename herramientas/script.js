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
// NAV
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
// SESIÓN Y ESTADO PRO
// ─────────────────────────────────────────────

function getSesion(){
  try {
    return JSON.parse(sessionStorage.getItem('yca_sesion'))
  } catch(e) {
    return null
  }
}

function inicializarPro(){
  const sesion = getSesion()

  // Ocultar banner si ya hay sesión
  const banner = document.getElementById('ceramistaBanner')
  if(sesion && sesion.token && banner){
    banner.style.display = 'none'
  }

  // Actualizar flechas de cards Pro según plan
  const esPro = sesion && sesion.plan === 'pro'
  const calcsPro = ['seger', 'pruebas', 'arcillas']

  calcsPro.forEach(id => {
    const flecha = document.getElementById('flecha-' + id)
    const card   = document.querySelector(`.pro-card[data-calc="${id}"]`)
    if(!flecha || !card) return

    if(esPro){
      flecha.innerText = '→'
      flecha.style.fontSize  = '20px'
      flecha.style.color     = 'var(--color-primario)'
      card.classList.add('pro-desbloqueada')
    } else {
      flecha.innerText = '🔒'
      flecha.style.fontSize  = '20px'
    }
  })
}

// ─────────────────────────────────────────────
// NAVEGACIÓN A CALCULADORA PRO
// ─────────────────────────────────────────────

function irACalcPro(calc){
  // Siempre va a la página de presentación
  // Si es Pro, la página de presentación lo manda directo a la calculadora
  window.location.href = '../pro/index.html?calc=' + calc
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', inicializarPro)
} else {
  inicializarPro()
}
