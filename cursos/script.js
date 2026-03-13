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
// FILTROS
// ─────────────────────────────────────────────

function filtrar(estado){
  // Actualizar botones
  document.querySelectorAll(".filtro-btn").forEach(b => b.classList.remove("activo"))
  document.getElementById(`f-${estado}`).classList.add("activo")

  // Filtrar tarjetas
  const tarjetas = document.querySelectorAll(".curso-tarjeta")
  let visibles = 0

  tarjetas.forEach(t => {
    const mostrar = estado === "todos" || t.dataset.estado === estado
    t.style.display = mostrar ? "flex" : "none"
    if(mostrar) visibles++
  })

  // Mensaje sin resultados
  document.getElementById("sinResultados").style.display = visibles === 0 ? "flex" : "none"
  document.getElementById("cursosGrid").style.display    = visibles === 0 ? "none" : "grid"
}
