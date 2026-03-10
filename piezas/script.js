// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQqxDRZu5xfbHPqS9EvIdrzbaI0coHRptdAlLUjLehd8x2w7F4ovzatejhYAE4qRc8YR93dVfA18kDv/pub?gid=1299029260&single=true&output=csv"

const WHATSAPP = "5491160387535"



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



// ─────────────────────────────────────────────
// PARSEAR CSV
// ─────────────────────────────────────────────

function parsearCSV(texto){
  const lineas = texto.trim().split("\n")
  const encabezados = lineas[0].split(",").map(h => h.trim().replace(/"/g, ""))
  const datos = []

  for(let i = 1; i < lineas.length; i++){
    const valores = lineas[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []
    const fila = {}
    encabezados.forEach((enc, j) => {
      fila[enc] = (valores[j] || "").replace(/"/g, "").trim()
    })
    if(fila.foto && fila.nombre) datos.push(fila)
  }

  return datos
}



// ─────────────────────────────────────────────
// CREAR TARJETA
// ─────────────────────────────────────────────

function crearTarjeta(pieza){
  const mensaje = encodeURIComponent(`Hola! Estoy interesado en la pieza: ${pieza.nombre}`)
  const linkWA = `https://wa.me/${WHATSAPP}?text=${mensaje}`

  const card = document.createElement("div")
  card.className = "pieza-card"
  card.dataset.categoria = pieza.categoria || "Sin categoría"

  const fotoHTML = pieza.foto
    ? `<img class="pieza-foto" src="${pieza.foto}" alt="${pieza.nombre}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
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

  document.querySelector(".filtro[data-categoria='todas']").addEventListener("click", () => filtrar("todas"))
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
    msg.innerHTML = `<p>No hay piezas en esta categoría todavía.</p>`
    document.getElementById("piezasGrid").appendChild(msg)
  }
}



// ─────────────────────────────────────────────
// CARGAR PIEZAS
// ─────────────────────────────────────────────

async function cargarPiezas(){
  const estado = document.getElementById("estado")
  const grid = document.getElementById("piezasGrid")

  try {
    const res = await fetch(SHEET_URL)
    const texto = await res.text()
    const piezas = parsearCSV(texto)

    estado.classList.add("oculto")

    if(piezas.length === 0){
      estado.classList.remove("oculto")
      estado.innerHTML = "<p>No hay piezas publicadas todavía. ¡Volvé pronto!</p>"
      return
    }

    armarFiltros(piezas)

    piezas.forEach(pieza => {
      const card = crearTarjeta(pieza)
      grid.appendChild(card)
    })

  } catch(err) {
    estado.classList.remove("oculto")
    estado.innerHTML = "<p>No se pudieron cargar las piezas. Intentá de nuevo más tarde.</p>"
    console.error(err)
  }
}

cargarPiezas()
