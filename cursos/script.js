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

// ─────────────────────────────────────────────
// SINCRONIZAR ESTADO DESDE APPS SCRIPT
// Actualiza el data-estado de cada tarjeta
// según lo que está guardado en Sheets
// ─────────────────────────────────────────────

const API_CURSOS = "https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec"

async function sincronizarEstadoCursos(){
  try {
    const res  = await fetch(`${API_CURSOS}?action=getCursos`)
    const data = await res.json()
    const cursos = data.data || []

    cursos.forEach(curso => {
      // Buscar tarjeta por hojaId
      const tarjeta = document.querySelector(`.curso-tarjeta[data-hoja="${curso.hojaId}"]`)
      if(!tarjeta) return

      const estadoAnterior = tarjeta.dataset.estado
      const estadoNuevo    = curso.estado || 'proximamente'

      if(estadoAnterior === estadoNuevo) return

      // Actualizar data-estado
      tarjeta.dataset.estado = estadoNuevo

      // Actualizar badge
      const badge = tarjeta.querySelector('.curso-estado-badge')
      if(badge){
        badge.className = `curso-estado-badge ${estadoNuevo}`
        const labels = { activo: 'Activo', proximamente: 'Próximamente', finalizado: 'Finalizado' }
        badge.innerText = labels[estadoNuevo] || estadoNuevo
      }
    })
  } catch(e) {
    // Silencioso — si falla, los estados hardcodeados siguen funcionando
  }
}

sincronizarEstadoCursos()
