// ── PAGINADO ──
let _piezasTodos = []
let _piezasPagina = 0

function mostrarMasPiezas(){
  const grid = document.getElementById('piezasGrid')
  const desde = _piezasPagina * 8
  const hasta = desde + 8
  const batch = _piezasTodos.slice(desde, hasta)
  batch.forEach(item => grid.appendChild(crearTarjeta(item)))
  _piezasPagina++
  const btnMas = document.getElementById('btnMasPiezas')
  if(btnMas) btnMas.style.display = hasta >= _piezasTodos.length ? 'none' : 'block'
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


// ─────────────────────────────────────────────
// LÍNEAS DE PIEZAS
// ─────────────────────────────────────────────

let _todasPiezas  = []   // copia completa para restaurar filtro
let _lineaActiva  = null

function svgPincelada(color){
  return `<svg viewBox="0 0 140 48" xmlns="http://www.w3.org/2000/svg" class="linea-brush-svg">
    <!-- mancha base ancha -->
    <path d="M6,36 C18,16 36,10 62,18 C88,26 108,12 134,16" stroke="${color}" stroke-width="14" stroke-linecap="round" fill="none" opacity="0.7"/>
    <!-- trazo principal -->
    <path d="M4,34 C22,14 42,8 66,16 C90,24 110,10 136,14" stroke="${color}" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.9"/>
    <!-- trazo fino superior con desvío -->
    <path d="M10,28 C28,18 50,14 72,20 C94,26 112,16 136,18" stroke="${color}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.5"/>
    <!-- salpicaduras / flecos -->
    <path d="M18,40 C22,36 20,32 24,34" stroke="${color}" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.4"/>
    <path d="M52,38 C56,30 58,26 62,28" stroke="${color}" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.35"/>
    <path d="M90,30 C96,22 98,20 102,24" stroke="${color}" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.35"/>
    <path d="M118,22 C124,18 126,16 128,20" stroke="${color}" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.3"/>
    <!-- trazo fino suelto abajo -->
    <path d="M8,42 C30,38 55,40 80,36 C100,32 118,36 134,32" stroke="${color}" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.25"/>
  </svg>`
}

function renderLineasFrontend(lineas){
  const sec  = document.getElementById('seccionLineas')
  const grid = document.getElementById('lineasGrid')
  if(!sec || !grid) return

  const visibles = lineas.filter(l => l.visible === true || l.visible === 'true' || l.visible === 'TRUE')
  if(visibles.length === 0){ sec.style.display = 'none'; return }

  sec.style.display = 'block'
  grid.innerHTML = visibles.map(l => {
    const color   = l.color || '#8B4513'
    const precio  = (l.mostrarPrecio === 'true' || l.mostrarPrecio === true) && l.precio
    const foto    = l.foto || ''
    return `<div class="linea-card" onclick="filtrarPorLinea('${l.id}')" data-linea-id="${l.id}">
      <div class="linea-card-foto" style="${foto ? `background-image:url('${foto}')` : `background:${color}18`}">
        ${!foto ? `<div class="linea-card-emoji">🏺</div>` : ''}
        <div class="linea-card-brush">${svgPincelada(color)}</div>
      </div>
      <div class="linea-card-info">
        <div class="linea-card-nombre" style="color:${color}">${l.nombre}</div>
        ${l.descripcion ? `<div class="linea-card-desc">${l.descripcion}</div>` : ''}
        ${precio ? `<div class="linea-card-precio" style="color:${color}">Set desde $${Number(l.precio).toLocaleString('es-AR')}</div>` : ''}
      </div>
    </div>`
  }).join('')
}

function filtrarPorLinea(lineaId){
  const linea = (window._lineasData || []).find(l => l.id === lineaId)
  if(!linea) return
  _lineaActiva = linea

  // Resaltar tarjeta activa
  document.querySelectorAll('.linea-card').forEach(c => {
    c.classList.toggle('activa', c.dataset.lineaId === lineaId)
  })

  // Mostrar banner
  const banner = document.getElementById('lineaActivaBanner')
  const nombre = document.getElementById('lineaBannerNombre')
  const desc   = document.getElementById('lineaBannerDesc')
  if(banner){ banner.style.display = 'block' }
  if(nombre){ nombre.innerText = linea.nombre }
  if(desc)  { desc.innerText = linea.descripcion || '' }

  // Filtrar grid — solo piezas de esta línea
  const grid = document.getElementById('piezasGrid')
  _piezasTodos = _todasPiezas.filter(p => p.linea === lineaId)
  _piezasPagina = 0
  grid.innerHTML = ''
  document.getElementById('btnMasPiezas').style.display = 'none'

  // Resetear filtros de categoría
  document.querySelectorAll('.filtro').forEach(b => b.classList.remove('activo'))
  document.querySelector(".filtro[data-categoria='todas']")?.classList.add('activo')

  if(_piezasTodos.length === 0){
    grid.innerHTML = `<div class="sin-resultados"><p>Esta línea no tiene piezas publicadas todavía.</p></div>`
  } else {
    mostrarMasPiezas()
  }
}

function volverTodasPiezas(){
  _lineaActiva = null
  _piezasTodos = [..._todasPiezas]
  _piezasPagina = 0

  const grid = document.getElementById('piezasGrid')
  grid.innerHTML = ''
  document.getElementById('btnMasPiezas').style.display = 'none'
  document.getElementById('lineaActivaBanner').style.display = 'none'
  document.querySelectorAll('.linea-card').forEach(c => c.classList.remove('activa'))
  document.querySelectorAll('.filtro').forEach(b => b.classList.remove('activo'))
  document.querySelector(".filtro[data-categoria='todas']")?.classList.add('activo')

  mostrarMasPiezas()
}

async function cargarPiezas(){
  const estado = document.getElementById("estado")
  const grid   = document.getElementById("piezasGrid")

  // Usar caché si existe y es reciente (menos de 5 min)
  const cached = sessionStorage.getItem('yca_piezas')
  const ts     = sessionStorage.getItem('yca_piezas_ts')
  if(cached && ts && (Date.now() - parseInt(ts)) < 300000){
    try{
      const piezas = JSON.parse(cached)
      if(piezas && piezas.length > 0){
        estado.classList.add("oculto")
        armarFiltros(piezas)
        _todasPiezas  = piezas
        _piezasTodos  = piezas
        _piezasPagina = 0
        // Inyectar modal si no existe
        if(!document.getElementById('modalPieza')){
          const m = document.createElement('div')
          m.id = 'modalPieza'; m.className = 'pm-overlay'; m.onclick = cerrarModalPieza
          m.innerHTML = `<div class="pm-box"><div class="pm-header"><span class="pm-header-titulo" id="pmHeaderTitulo"></span><button class="pm-cerrar" onclick="cerrarModalPiezaBtn()">&times;</button></div><div id="pmContenido"></div></div>`
          document.body.appendChild(m)
        }
        mostrarMasPiezas()
        // Refrescar en segundo plano
        fetch(`${API}?action=getPiezas`).then(r=>r.json()).then(d=>{
          if(d.data){ sessionStorage.setItem('yca_piezas',JSON.stringify(d.data)); sessionStorage.setItem('yca_piezas_ts',Date.now()) }
        }).catch(()=>{})
        return
      }
    } catch(e){}
  }

  try {
    // Cargar config, piezas y líneas en paralelo
    const [resConf, resPiezas, resLineas] = await Promise.all([
      fetch(`${API}?action=getConfigIndex`),
      fetch(`${API}?action=getPiezas`),
      fetch(`${API}?action=getLineasPiezas`)
    ])
    const dataConf   = await resConf.json()
    const dataPiezas = await resPiezas.json()
    const dataLineas = await resLineas.json()
    window._lineasData = dataLineas.data || []

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
    _todasPiezas  = piezas
    _piezasTodos  = piezas
    _piezasPagina = 0
    renderLineasFrontend(window._lineasData || [])
    mostrarMasPiezas()

  } catch(err) {
    estado.classList.remove("oculto")
    estado.querySelector("p").innerText = "No se pudieron cargar las piezas. Intentá de nuevo más tarde."
    estado.querySelector(".spinner").style.display = "none"
    console.error(err)
  }
}

cargarPiezas()
