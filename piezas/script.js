// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────

const API      = "https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec"
const WHATSAPP = "5491160387535"

// Dark mode y nav manejados por nav-ceramista.js

// ─────────────────────────────────────────────
// CREAR TARJETA
// Solo muestra: foto, nombre, categoría, descripción
// Precio y datos de stock solo en el admin
// ─────────────────────────────────────────────

function crearTarjeta(pieza){
  const mensaje = encodeURIComponent(`Hola! Me interesa la pieza: ${pieza.nombre}`)
  const linkWA  = `https://wa.me/${WHATSAPP}?text=${mensaje}`

  const card = document.createElement("div")
  card.className = "pieza-card"
  card.dataset.categoria = pieza.categoria || "Sin categoría"

  const fotoHTML = pieza.foto
    ? `<img class="pieza-foto" src="${pieza.foto}" alt="${pieza.nombre}" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : ""

  card.innerHTML = `
    ${fotoHTML}
    <div class="pieza-foto-placeholder" style="${pieza.foto ? 'display:none' : ''}">🏺</div>
    <div class="pieza-info">
      ${pieza.categoria ? `<div class="pieza-categoria">${pieza.categoria}</div>` : ""}
      <h3 class="pieza-nombre">${pieza.nombre}</h3>
      ${pieza.descripcion ? `<p class="pieza-descripcion">${pieza.descripcion}</p>` : ""}
      <a class="pieza-btn" href="${linkWA}" target="_blank">
        Consultar por: ${pieza.nombre}
      </a>
    </div>
  `

  return card
}

// ─────────────────────────────────────────────
// FILTROS
// ─────────────────────────────────────────────

function armarFiltros(piezas){
  const categorias = [...new Set(piezas.map(p => p.categoria).filter(Boolean))]
  const contenedor = document.getElementById("filtros")

  categorias.forEach(cat => {
    const btn = document.createElement("button")
    btn.className = "filtro"
    btn.dataset.categoria = cat
    btn.innerText = cat
    btn.addEventListener("click", () => filtrar(cat))
    contenedor.appendChild(btn)
  })

  document.querySelector(".filtro[data-categoria='todas']")
    ?.addEventListener("click", () => filtrar("todas"))
}

function filtrar(categoria){
  document.querySelectorAll(".filtro").forEach(b => b.classList.remove("activo"))
  document.querySelector(`.filtro[data-categoria="${categoria}"]`)?.classList.add("activo")
  filtrarPiezas()
}

function filtrarPiezas(){
  const categoriaActiva = document.querySelector(".filtro.activo")?.dataset.categoria || "todas"
  const busqueda        = (document.getElementById("buscadorPiezas")?.value || "").toLowerCase().trim()
  const cards           = document.querySelectorAll(".pieza-card")
  let visibles          = 0

  cards.forEach(card => {
    const matchCat  = categoriaActiva === "todas" || card.dataset.categoria === categoriaActiva
    const nombre    = (card.querySelector(".pieza-nombre")?.innerText || "").toLowerCase()
    const matchBus  = !busqueda || nombre.includes(busqueda)
    const mostrar   = matchCat && matchBus
    card.style.display = mostrar ? "flex" : "none"
    if(mostrar) visibles++
  })

  const sinResultados = document.querySelector(".sin-resultados")
  if(sinResultados) sinResultados.remove()

  if(visibles === 0){
    const msg = document.createElement("div")
    msg.className = "sin-resultados"
    msg.innerHTML = `<p>No hay piezas que coincidan con tu búsqueda.</p>`
    document.getElementById("piezasGrid").appendChild(msg)
  }
}

// Conectar buscador
document.addEventListener("DOMContentLoaded", () => {
  const buscador = document.getElementById("buscadorPiezas")
  if(buscador) buscador.addEventListener("input", filtrarPiezas)
})

// ─────────────────────────────────────────────
// CARGAR PIEZAS — desde Apps Script
// ─────────────────────────────────────────────

async function cargarPiezas(){
  const estado = document.getElementById("estado")
  const grid   = document.getElementById("piezasGrid")

  try {
    const res    = await fetch(`${API}?action=getPiezas`)
    const data   = await res.json()
    const piezas = (data.data || []).filter(p => p.nombre)

    estado.classList.add("oculto")

    if(piezas.length === 0){
      estado.classList.remove("oculto")
      estado.querySelector("p").innerText = "No hay piezas publicadas todavía. ¡Volvé pronto!"
      estado.querySelector(".spinner").style.display = "none"
      return
    }

    armarFiltros(piezas)
    piezas.forEach(pieza => grid.appendChild(crearTarjeta(pieza)))

  } catch(err) {
    estado.classList.remove("oculto")
    estado.querySelector("p").innerText = "No se pudieron cargar las piezas. Intentá de nuevo más tarde."
    estado.querySelector(".spinner").style.display = "none"
    console.error(err)
  }
}

cargarPiezas()
