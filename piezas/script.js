function mostrarSkeleton(gridId, cantidad, claseGrid) {
  const grid = document.getElementById(gridId)
  if(!grid) return
  grid.innerHTML = Array(cantidad).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-foto"></div>
      <div class="skeleton-body">
        <div class="skeleton-line titulo"></div>
        <div class="skeleton-line subtitulo"></div>
        <div class="skeleton-line precio"></div>
      </div>
    </div>`).join('')
}
// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────

const API      = "https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec"
const WHATSAPP = "5491160387535"

// Config pública — cargada al inicio
let configPublica = {}

// ─────────────────────────────────────────────
// CREAR TARJETA — solo foto + nombre + "Ver más"
// ─────────────────────────────────────────────

function crearTarjeta(pieza){
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
      <button class="pieza-btn-ver" onclick="abrirModalPieza(event)">
        Ver más
      </button>
    </div>
  `

  // Guardar datos en el card para el modal
  card._piezaData = pieza
  return card
}

// ─────────────────────────────────────────────
// MODAL DETALLE
// ─────────────────────────────────────────────

let modalPiezaActual = null

function abrirModalPieza(e){
  const card  = e.target.closest('.pieza-card')
  const pieza = card._piezaData
  if(!pieza) return
  modalPiezaActual = pieza
  fotoActualIdx    = 0

  const fotos           = [pieza.foto, pieza.foto2, pieza.foto3, pieza.foto4].filter(Boolean)
  const mostrarPrecio   = configPublica.piezas_mostrar_precio   === 'true'
  const mostrarStock    = configPublica.piezas_mostrar_stock     === 'true'
  const permitirCantidad= configPublica.piezas_permitir_cantidad === 'true'

  // Carrusel
  let carruselHTML = ''
  if(fotos.length > 1){
    const dots = fotos.map((_,i) => `<span class="pm-dot ${i===0?'activo':''}" onclick="irFoto(${i})"></span>`).join('')
    const imgs = fotos.map((f,i) => `<img class="pm-foto" src="${f}" alt="${pieza.nombre}" style="${i>0?'display:none':''}" loading="lazy">`).join('')
    carruselHTML = `
      <div class="pm-carrusel">
        ${imgs}
        <button class="pm-nav pm-prev" onclick="navFoto(-1)">&#8249;</button>
        <button class="pm-nav pm-next" onclick="navFoto(1)">&#8250;</button>
        <div class="pm-dots">${dots}</div>
      </div>`
  } else if(fotos.length === 1){
    carruselHTML = `<div class="pm-carrusel"><img class="pm-foto" src="${fotos[0]}" alt="${pieza.nombre}" loading="lazy"></div>`
  } else {
    carruselHTML = `<div class="pm-carrusel"><div class="pm-sin-foto">🏺</div></div>`
  }

  // Chips de detalles
  const chips = [
    pieza.tecnica  ? `<div class="pm-detalle-chip"><span>Técnica:</span> ${pieza.tecnica}</div>`  : '',
    pieza.esmalte  ? `<div class="pm-detalle-chip"><span>Esmalte:</span> ${pieza.esmalte}</div>`  : '',
    pieza.medidas  ? `<div class="pm-detalle-chip"><span>Medidas:</span> ${pieza.medidas}</div>`  : '',
  ].filter(Boolean).join('')

  const datosHTML = `
    <div class="pm-datos">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        ${pieza.categoria ? `<div class="pm-categoria">${pieza.categoria}</div>` : '<div></div>'}
        ${pieza.codigo    ? `<div class="pm-codigo">${pieza.codigo}</div>`       : ''}
      </div>
      <h2 class="pm-nombre">${pieza.nombre}</h2>
      ${pieza.descripcion ? `<p class="pm-descripcion">${pieza.descripcion}</p>` : ''}
      ${chips ? `<div class="pm-detalles">${chips}</div>` : ''}
      ${mostrarPrecio && pieza.precio ? `<div class="pm-precio">$${Number(pieza.precio).toLocaleString('es-AR')}</div>` : ''}
      ${mostrarStock && pieza.cantidad !== undefined && pieza.cantidad !== ''
        ? `<div class="pm-stock">${Number(pieza.cantidad) > 0 ? Number(pieza.cantidad)+' disponibles' : 'Sin stock'}</div>`
        : ''}
      ${permitirCantidad ? `
        <div class="pm-cantidad-wrap">
          <label>Cantidad:</label>
          <div class="pm-cantidad-ctrl">
            <button onclick="cambiarCantidad(-1)" type="button">−</button>
            <span id="pmCantidad">1</span>
            <button onclick="cambiarCantidad(1)" type="button">+</button>
          </div>
        </div>` : ''}
      <button class="pm-btn-wa" onclick="consultarWA()">
        <i class="fa-brands fa-whatsapp"></i> Consultar por WhatsApp
      </button>
      <button class="pm-btn-cerrar-bottom" onclick="cerrarModalPiezaBtn()">Cerrar</button>
    </div>
  `

  document.getElementById('pmContenido').innerHTML = carruselHTML + datosHTML
  const hTit = document.getElementById('pmHeaderTitulo')
  if(hTit) hTit.innerText = pieza.nombre
  document.getElementById('modalPieza').style.display = 'flex'
  document.body.style.overflow = 'hidden'
}

function cerrarModalPieza(e){
  if(e && e.target !== document.getElementById('modalPieza')) return
  document.getElementById('modalPieza').style.display = 'none'
  document.body.style.overflow = ''
  modalPiezaActual = null
  fotoActualIdx = 0
}

function cerrarModalPiezaBtn(){
  document.getElementById('modalPieza').style.display = 'none'
  document.body.style.overflow = ''
  modalPiezaActual = null
  fotoActualIdx = 0
}

// ── Carrusel ──
let fotoActualIdx = 0

function irFoto(n){
  const fotos = document.querySelectorAll('#pmContenido .pm-foto')
  const dots  = document.querySelectorAll('#pmContenido .pm-dot')
  if(!fotos.length) return
  fotos[fotoActualIdx].style.display = 'none'
  dots[fotoActualIdx]?.classList.remove('activo')
  fotoActualIdx = (n + fotos.length) % fotos.length
  fotos[fotoActualIdx].style.display = 'block'
  dots[fotoActualIdx]?.classList.add('activo')
}

function navFoto(dir){ irFoto(fotoActualIdx + dir) }

// ── Cantidad ──
function cambiarCantidad(d){
  const el  = document.getElementById('pmCantidad')
  if(!el) return
  const val = Math.max(1, (parseInt(el.innerText)||1) + d)
  el.innerText = val
}

// ── Consultar WA ──
function consultarWA(){
  if(!modalPiezaActual) return
  const pieza    = modalPiezaActual
  const cantEl   = document.getElementById('pmCantidad')
  const cantidad = cantEl ? parseInt(cantEl.innerText)||1 : 1
  const permitir = configPublica.piezas_permitir_cantidad === 'true'
  let texto = `Hola! Me interesa la pieza: ${pieza.nombre}`
  if(permitir && cantidad > 1) texto += ` (cantidad: ${cantidad})`
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, '_blank')
}

// ── Teclado ──
document.addEventListener('keydown', e => {
  const modal = document.getElementById('modalPieza')
  if(!modal || modal.style.display === 'none') return
  if(e.key === 'Escape')      cerrarModalPiezaBtn()
  if(e.key === 'ArrowRight')  navFoto(1)
  if(e.key === 'ArrowLeft')   navFoto(-1)
})

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

document.addEventListener("DOMContentLoaded", () => {
  const buscador = document.getElementById("buscadorPiezas")
  if(buscador) buscador.addEventListener("input", filtrarPiezas)
})

// ─────────────────────────────────────────────
// CARGAR PIEZAS + CONFIG
// ─────────────────────────────────────────────

async function cargarPiezas(){
  const estado = document.getElementById("estado")
  const grid   = document.getElementById("piezasGrid")
  estado.classList.add("oculto")
  mostrarSkeleton('piezasGrid', 8)

  try {
    // Cargar config y piezas en paralelo
    const [resConf, resPiezas] = await Promise.all([
      fetch(`${API}?action=getConfigIndex`),
      fetch(`${API}?action=getPiezas`)
    ])
    const dataConf  = await resConf.json()
    const dataPiezas= await resPiezas.json()

    configPublica = dataConf.data || {}
    const piezas  = (dataPiezas.data || []).filter(p => p.nombre)

    estado.classList.add("oculto")

    if(piezas.length === 0){
      estado.classList.remove("oculto")
      estado.querySelector("p").innerText = "No hay piezas publicadas todavía. ¡Volvé pronto!"
      estado.querySelector(".spinner").style.display = "none"
      return
    }

    // Inyectar modal en el DOM si no existe
    if(!document.getElementById('modalPieza')){
      const m = document.createElement('div')
      m.id        = 'modalPieza'
      m.className = 'pm-overlay'
      m.onclick   = cerrarModalPieza
      m.innerHTML = `
        <div class="pm-box">
          <div class="pm-header">
            <span class="pm-header-titulo" id="pmHeaderTitulo"></span>
            <button class="pm-cerrar" onclick="cerrarModalPiezaBtn()">&times;</button>
          </div>
          <div id="pmContenido"></div>
        </div>`
      document.body.appendChild(m)
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
