// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────

const SHEET_URL = "https://sheetdb.io/api/v1/wm831yco2elqu?sheet=Publicadas"
const WHATSAPP  = "5491160387535"

// ¿Mostrar precios en la web?
// Cambiá a true cuando quieras mostrarlos
const MOSTRAR_PRECIO = false



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
// CREAR TARJETA
// ─────────────────────────────────────────────

function crearTarjeta(insumo){
  const mensaje = encodeURIComponent(`Hola! Me interesa el insumo: ${insumo.nombre}${insumo.tipo ? " - " + insumo.tipo : ""}`)
  const linkWA  = `https://wa.me/${WHATSAPP}?text=${mensaje}`

  const card = document.createElement("div")
  card.className = "pieza-card"
  card.dataset.categoria = insumo.categoria || "Sin categoría"

  const fotoHTML = insumo.foto
    ? `<img class="pieza-foto" src="${insumo.foto}" alt="${insumo.nombre}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : ""

  const tipoHTML = insumo.tipo
    ? `<p class="pieza-tipo">${insumo.tipo}</p>`
    : ""

  const unidadHTML = insumo.unidad
    ? `<p class="pieza-unidad">📦 Se vende por: ${insumo.unidad}</p>`
    : ""

  const precioHTML = MOSTRAR_PRECIO && insumo.precio
    ? `<p class="pieza-precio">$${Number(insumo.precio).toLocaleString("es-AR")}</p>`
    : ""

  card.innerHTML = `
    ${fotoHTML}
    <div class="pieza-foto-placeholder" style="${insumo.foto ? 'display:none' : ''}">🪣</div>
    <div class="pieza-info">
      ${insumo.categoria ? `<div class="pieza-categoria">${insumo.categoria}</div>` : ""}
      <h3 class="pieza-nombre">${insumo.nombre}</h3>
      ${tipoHTML}
      ${insumo.descripcion ? `<p class="pieza-descripcion">${insumo.descripcion}</p>` : ""}
      ${unidadHTML}
      ${precioHTML}
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
    .addEventListener("click", () => filtrar("todas"))
}

function filtrar(categoria){
  document.querySelectorAll(".filtro").forEach(b => b.classList.remove("activo"))
  document.querySelector(`.filtro[data-categoria="${categoria}"]`)?.classList.add("activo")

  const cards = document.querySelectorAll(".pieza-card")
  let visibles = 0

  cards.forEach(card => {
    const mostrar = categoria === "todas" || card.dataset.categoria === categoria
    card.style.display = mostrar ? "flex" : "none"
    if(mostrar) visibles++
  })

  const sinResultados = document.querySelector(".sin-resultados")
  if(sinResultados) sinResultados.remove()

  if(visibles === 0){
    const msg = document.createElement("div")
    msg.className = "sin-resultados"
    msg.innerHTML = `<p>No hay insumos en esta categoría todavía.</p>`
    document.getElementById("insumosGrid").appendChild(msg)
  }
}



// ─────────────────────────────────────────────
// CARGAR INSUMOS
// ─────────────────────────────────────────────

async function cargarInsumos(){
  const estado = document.getElementById("estado")
  const grid   = document.getElementById("insumosGrid")

  try {
    const res    = await fetch(SHEET_URL)
    const datos  = await res.json()

    const insumos = datos.map(d => ({
      foto:       d.Foto        || "",
      nombre:     d.Nombre      || "",
      categoria:  d.Categoria   || "",
      tipo:       d.Tipo        || "",
      unidad:     d.Unidad      || "",
      descripcion:d.Descripcion || "",
      cantidad:   d.Cantidad    || "",
      precio:     d.Precio      || "",
      temperatura:d.Temperatura || ""
    })).filter(p => p.nombre)

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
