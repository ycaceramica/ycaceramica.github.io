// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────

const API      = "https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec"
const WHATSAPP = "5491160387535"

// Dark mode y nav manejados por nav-ceramista.js

// ─────────────────────────────────────────────
// CREAR TARJETA
// Solo muestra: foto, nombre, categoría, tipo, descripción
// Precio, cantidad, stock solo en el admin
// ─────────────────────────────────────────────

function crearTarjeta(insumo){
  const mensaje = encodeURIComponent(`Hola! Me interesa el insumo: ${insumo.nombre}${insumo.tipo ? " - " + insumo.tipo : ""}`)
  const linkWA  = `https://wa.me/${WHATSAPP}?text=${mensaje}`

  const card = document.createElement("div")
  card.className = "pieza-card"
  card.dataset.categoria = insumo.categoria || "Sin categoría"

  const fotoHTML = insumo.foto
    ? `<img class="pieza-foto" src="${insumo.foto}" alt="${insumo.nombre}" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : ""

  card.innerHTML = `
    ${fotoHTML}
    <div class="pieza-foto-placeholder" style="${insumo.foto ? 'display:none' : ''}">🪣</div>
    <div class="pieza-info">
      ${insumo.categoria ? `<div class="pieza-categoria">${insumo.categoria}</div>` : ""}
      <h3 class="pieza-nombre">${insumo.nombre}</h3>
      ${insumo.tipo ? `<p class="pieza-tipo">${insumo.tipo}</p>` : ""}
      ${insumo.descripcion ? `<p class="pieza-descripcion">${insumo.descripcion}</p>` : ""}
      <a class="pieza-btn" href="${linkWA}" target="_blank">
        Consultar disponibilidad
      </a>
    </div>
  `

  return card
}

// ─────────────────────────────────────────────
// FILTROS
// ─────────────────────────────────────────────

function armarFiltros(insumos){
  const categorias = [...new Set(insumos.map(p => p.categoria).filter(Boolean))]
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
  filtrarInsumos()
}

function filtrarInsumos(){
  const categoriaActiva = document.querySelector(".filtro.activo")?.dataset.categoria || "todas"
  const busqueda        = (document.getElementById("buscadorInsumos")?.value || "").toLowerCase().trim()
  const cards           = document.querySelectorAll(".pieza-card")
  let visibles          = 0

  cards.forEach(card => {
    const matchCat = categoriaActiva === "todas" || card.dataset.categoria === categoriaActiva
    const nombre   = (card.querySelector(".pieza-nombre")?.innerText || "").toLowerCase()
    const matchBus = !busqueda || nombre.includes(busqueda)
    const mostrar  = matchCat && matchBus
    card.style.display = mostrar ? "flex" : "none"
    if(mostrar) visibles++
  })

  const sinResultados = document.querySelector(".sin-resultados")
  if(sinResultados) sinResultados.remove()

  if(visibles === 0){
    const msg = document.createElement("div")
    msg.className = "sin-resultados"
    msg.innerHTML = `<p>No hay insumos que coincidan con tu búsqueda.</p>`
    document.getElementById("insumosGrid").appendChild(msg)
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const buscador = document.getElementById("buscadorInsumos")
  if(buscador) buscador.addEventListener("input", filtrarInsumos)
})

// ─────────────────────────────────────────────
// CARGAR INSUMOS — desde Apps Script
// ─────────────────────────────────────────────

async function cargarInsumos(){
  const estado = document.getElementById("estado")
  const grid   = document.getElementById("insumosGrid")

  try {
    const res    = await fetch(`${API}?action=getInsumos`)
    const data   = await res.json()
    const insumos = (data.data || []).filter(p => p.nombre)

    estado.classList.add("oculto")

    if(insumos.length === 0){
      estado.classList.remove("oculto")
      estado.querySelector("p").innerText = "No hay insumos publicados todavía. ¡Volvé pronto!"
      estado.querySelector(".spinner").style.display = "none"
      return
    }

    armarFiltros(insumos)
    insumos.forEach(insumo => grid.appendChild(crearTarjeta(insumo)))

  } catch(err) {
    estado.classList.remove("oculto")
    estado.querySelector("p").innerText = "No se pudieron cargar los insumos. Intentá de nuevo más tarde."
    estado.querySelector(".spinner").style.display = "none"
    console.error(err)
  }
}

cargarInsumos()
