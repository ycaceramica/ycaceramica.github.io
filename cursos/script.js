// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────

const API = "https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec"

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
  document.querySelectorAll(".filtro-btn").forEach(b => b.classList.remove("activo"))
  document.getElementById(`f-${estado}`).classList.add("activo")

  const tarjetas = document.querySelectorAll(".curso-tarjeta")
  let visibles   = 0

  tarjetas.forEach(t => {
    const mostrar = estado === "todos" || t.dataset.estado === estado
    t.style.display = mostrar ? "flex" : "none"
    if(mostrar) visibles++
  })

  document.getElementById("sinResultados").style.display = visibles === 0 ? "flex" : "none"
  document.getElementById("cursosGrid").style.display    = visibles === 0 ? "none" : "grid"
}

// ─────────────────────────────────────────────
// CURSOS CON PÁGINA PROPIA
// Al agregar un curso con página dedicada, añadí su hojaId acá
// ─────────────────────────────────────────────

const CURSOS_CON_PAGINA_PROPIA = ['taller-inicial', 'arcilla-y-luna']

// ─────────────────────────────────────────────
// CARGAR CURSOS DINÁMICAMENTE
// ─────────────────────────────────────────────

async function cargarCursos(){
  const grid = document.getElementById("cursosGrid")

  try {
    const res    = await fetch(`${API}?action=getCursos`)
    const data   = await res.json()
    const cursos = (data.data || []).filter(c =>
      c.visible !== 'false' && c.visible !== false
    )

    if(cursos.length === 0) return

    grid.innerHTML = ''

    cursos.forEach(c => {
      const estado  = c.estado || 'proximamente'
      const labels  = { activo:'Activo', proximamente:'Próximamente', finalizado:'Finalizado' }
      const href    = CURSOS_CON_PAGINA_PROPIA.includes(c.hojaId)
        ? `${c.hojaId}/index.html`
        : `detalle.html?curso=${c.hojaId}`

      const imgHTML = c.foto
        ? `<img src="${c.foto}" alt="${c.nombre}">`
        : `<div class="curso-tarjeta-placeholder"><i class="fa-solid fa-graduation-cap"></i></div>`

      const div = document.createElement('div')
      div.className      = 'curso-tarjeta'
      div.dataset.estado = estado
      div.dataset.hoja   = c.hojaId
      div.innerHTML = `
        <div class="curso-tarjeta-img">
          ${imgHTML}
          <span class="curso-estado-badge ${estado}">${labels[estado] || estado}</span>
        </div>
        <div class="curso-tarjeta-body">
          <h3>${c.nombre || ''}</h3>
          <div class="curso-tarjeta-meta">
            ${c.dia     ? `<span><i class="fa-regular fa-calendar"></i> ${c.dia}${c.horario ? ' ' + c.horario : ''}</span>` : ''}
            ${c.duracion ? `<span><i class="fa-regular fa-clock"></i> ${c.duracion}</span>` : ''}
          </div>
          <p>${c.descripcion || c.subtitulo || ''}</p>
          <a class="curso-tarjeta-btn" href="${href}">Ver más →</a>
        </div>
      `
      grid.appendChild(div)
    })

  } catch(e) {
    // Silencioso — si falla, el grid queda vacío
    console.error('Error al cargar cursos:', e)
  }
}

cargarCursos()
