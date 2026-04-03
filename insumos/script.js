// ── PAGINADO ──
let _insumosTodos = []
let _insumosPagina = 0

function mostrarMasInsumos(){
  const grid = document.getElementById('insumosGrid')
  const desde = _insumosPagina * 8
  const hasta = desde + 8
  const batch = _insumosTodos.slice(desde, hasta)
  batch.forEach(item => grid.appendChild(crearTarjeta(item)))
  _insumosPagina++
  const btnMas = document.getElementById('btnMasInsumos')
  if(btnMas) btnMas.style.display = hasta >= _insumosTodos.length ? 'none' : 'block'
}

// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────

const API      = "https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec"
const WHATSAPP = "5491160387535"

let configPublica = {}

// ─────────────────────────────────────────────
// CREAR TARJETA
// ─────────────────────────────────────────────

function crearTarjeta(insumo){
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
      <button class="pieza-btn-ver" onclick="abrirModalInsumo(event)">Ver más</button>
    </div>
  `

  card._insumoData = insumo
  return card
}

// ─────────────────────────────────────────────
// MODAL DETALLE
// ─────────────────────────────────────────────

let modalInsumoActual = null
let fotoActualIdx     = 0

function abrirModalInsumo(e){
  const card   = e.target.closest('.pieza-card')
  const insumo = card._insumoData
  if(!insumo) return
  modalInsumoActual = insumo
  fotoActualIdx     = 0

  const fotos            = [insumo.foto, insumo.foto2, insumo.foto3, insumo.foto4].filter(Boolean)
  const mostrarPrecio    = configPublica.insumos_mostrar_precio    === 'true'
  const mostrarStock     = configPublica.insumos_mostrar_stock     === 'true'
  const permitirCantidad = configPublica.insumos_permitir_cantidad === 'true'

  // Carrusel
  let carruselHTML = ''
  if(fotos.length > 1){
    const dots = fotos.map((_,i) => `<span class="pm-dot ${i===0?'activo':''}" onclick="irFoto(${i})"></span>`).join('')
    const imgs = fotos.map((f,i) => `<img class="pm-foto" src="${f}" alt="${insumo.nombre}" style="${i>0?'display:none':''}" loading="lazy">`).join('')
    carruselHTML = `
      <div class="pm-carrusel">
        ${imgs}
        <button class="pm-nav pm-prev" onclick="navFoto(-1)">&#8249;</button>
        <button class="pm-nav pm-next" onclick="navFoto(1)">&#8250;</button>
        <div class="pm-dots">${dots}</div>
      </div>`
  } else if(fotos.length === 1){
    carruselHTML = `<div class="pm-carrusel"><img class="pm-foto" src="${fotos[0]}" alt="${insumo.nombre}" loading="lazy"></div>`
  } else {
    carruselHTML = `<div class="pm-carrusel"><div class="pm-sin-foto">🪣</div></div>`
  }

  // Chips de detalles
  const chips = [
    insumo.tipo        ? `<div class="pm-detalle-chip"><span>Tipo:</span> ${insumo.tipo}</div>`               : '',
    insumo.unidad      ? `<div class="pm-detalle-chip"><span>Unidad:</span> ${insumo.unidad}</div>`           : '',
    insumo.temperatura ? `<div class="pm-detalle-chip"><span>Temperatura:</span> ${insumo.temperatura}</div>` : '',
  ].filter(Boolean).join('')

  const datosHTML = `
    <div class="pm-datos">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        ${insumo.categoria ? `<div class="pm-categoria">${insumo.categoria}</div>` : '<div></div>'}
        ${insumo.codigo    ? `<div class="pm-codigo">${insumo.codigo}</div>`       : ''}
      </div>
      <h2 class="pm-nombre">${insumo.nombre}</h2>
      ${insumo.descripcion ? `<p class="pm-descripcion">${insumo.descripcion}</p>` : ''}
      ${chips ? `<div class="pm-detalles">${chips}</div>` : ''}
      ${mostrarPrecio && insumo.precio ? `<div class="pm-precio">$${Number(insumo.precio).toLocaleString('es-AR')}</div>` : ''}
      ${mostrarStock && insumo.cantidad !== undefined && insumo.cantidad !== ''
        ? `<div class="pm-stock">${Number(insumo.cantidad) > 0 ? Number(insumo.cantidad)+' '+( insumo.unidad || 'disponibles') : 'Sin stock'}</div>`
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
        <i class="fa-brands fa-whatsapp"></i> Consultar disponibilidad
      </button>
      <button class="pm-btn-cerrar-bottom" onclick="cerrarModalInsumoBtn()">Cerrar</button>
    </div>
  `

  const hTit = document.getElementById('pmHeaderTitulo')
  if(hTit) hTit.innerText = insumo.nombre
  document.getElementById('pmContenido').innerHTML = carruselHTML + datosHTML
  document.getElementById('modalInsumo').style.display = 'flex'
  document.body.style.overflow = 'hidden'
}

function cerrarModalInsumo(e){
  if(e && e.target !== document.getElementById('modalInsumo')) return
  document.getElementById('modalInsumo').style.display = 'none'
  document.body.style.overflow = ''
  modalInsumoActual = null
  fotoActualIdx = 0
}

function cerrarModalInsumoBtn(){
  document.getElementById('modalInsumo').style.display = 'none'
  document.body.style.overflow = ''
  modalInsumoActual = null
  fotoActualIdx = 0
}

// Carrusel
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

// Cantidad
function cambiarCantidad(d){
  const el = document.getElementById('pmCantidad')
  if(!el) return
  el.innerText = Math.max(1, (parseInt(el.innerText)||1) + d)
}

// Consultar WA
function consultarWA(){
  if(!modalInsumoActual) return
  const insumo   = modalInsumoActual
  const cantEl   = document.getElementById('pmCantidad')
  const cantidad = cantEl ? parseInt(cantEl.innerText)||1 : 1
  const permitir = configPublica.insumos_permitir_cantidad === 'true'
  let texto = `Hola! Me interesa el insumo: ${insumo.nombre}`
  if(insumo.tipo) texto += ` (${insumo.tipo})`
  if(permitir && cantidad > 1) texto += ` - cantidad: ${cantidad}`
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, '_blank')
}

// Teclado
document.addEventListener('keydown', e => {
  const modal = document.getElementById('modalInsumo')
  if(!modal || modal.style.display === 'none') return
  if(e.key === 'Escape')     cerrarModalInsumoBtn()
  if(e.key === 'ArrowRight') navFoto(1)
  if(e.key === 'ArrowLeft')  navFoto(-1)
})

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
// CARGAR INSUMOS + CONFIG
// ─────────────────────────────────────────────

async function cargarInsumos(){
  const estado = document.getElementById("estado")
  const grid   = document.getElementById("insumosGrid")

  // Usar caché si existe y es reciente (menos de 5 min)
  const cached = sessionStorage.getItem('yca_insumos')
  const ts     = sessionStorage.getItem('yca_insumos_ts')
  if(cached && ts && (Date.now() - parseInt(ts)) < 300000){
    try{
      const insumos = JSON.parse(cached)
      if(insumos && insumos.length > 0){
        estado.classList.add("oculto")
        armarFiltros(insumos)
        _insumosTodos  = insumos
        _insumosPagina = 0
        if(!document.getElementById('modalInsumo')){
          const m = document.createElement('div')
          m.id = 'modalInsumo'; m.className = 'pm-overlay'; m.onclick = cerrarModalInsumo
          m.innerHTML = '<div class="pm-box"><div class="pm-header"><span class="pm-header-titulo" id="pmHeaderTitulo"></span><button class="pm-cerrar" onclick="cerrarModalInsumoBtn()">&times;</button></div><div id="pmContenido"></div></div>'
          document.body.appendChild(m)
        }
        mostrarMasInsumos()
        // Refrescar en segundo plano
        fetch(`${API}?action=getInsumos`).then(r=>r.json()).then(d=>{
          if(d.data){ sessionStorage.setItem('yca_insumos',JSON.stringify(d.data)); sessionStorage.setItem('yca_insumos_ts',Date.now()) }
        }).catch(()=>{})
        return
      }
    } catch(e){}
  }

  try {
    const [resConf, resInsumos] = await Promise.all([
      fetch(`${API}?action=getConfigIndex`),
      fetch(`${API}?action=getInsumos`)
    ])
    const dataConf   = await resConf.json()
    const dataInsumos= await resInsumos.json()

    configPublica = dataConf.data || {}
    const insumos = (dataInsumos.data || []).filter(p => p.nombre)

    estado.classList.add("oculto")
    sessionStorage.setItem('yca_insumos', JSON.stringify(insumos))

    if(insumos.length === 0){
      estado.classList.remove("oculto")
      estado.querySelector("p").innerText = "No hay insumos publicados todavía. ¡Volvé pronto!"
      estado.querySelector(".spinner").style.display = "none"
      return
    }

    if(!document.getElementById('modalInsumo')){
      const m = document.createElement('div')
      m.id        = 'modalInsumo'
      m.className = 'pm-overlay'
      m.onclick   = cerrarModalInsumo
      m.innerHTML = `
        <div class="pm-box">
          <div class="pm-header">
            <span class="pm-header-titulo" id="pmHeaderTitulo"></span>
            <button class="pm-cerrar" onclick="cerrarModalInsumoBtn()">&times;</button>
          </div>
          <div id="pmContenido"></div>
        </div>`
      document.body.appendChild(m)
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
