const API      = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'
const WHATSAPP = '5491160387535'

let _obraActual   = null
let _fotoObraIdx  = 0

// ── Cargar perfil ──
async function cargarPerfil() {
  const params = new URLSearchParams(window.location.search)
  const id     = params.get('id')
  const estado = document.getElementById('ceramistaEstado')
  const msg    = document.getElementById('ceramistaEstadoMsg')

  if (!id) { msg.innerText = 'Perfil no encontrado.'; estado.querySelector('.spinner').style.display = 'none'; return }

  try {
    const res  = await fetch(`${API}?action=getVitrinaCeramista&id=${encodeURIComponent(id)}`)
    const data = await res.json()

    if (!data.ok || !data.data) {
      msg.innerText = data.error || 'Perfil no encontrado.'
      estado.querySelector('.spinner').style.display = 'none'
      return
    }

    const artista = data.data
    const obras   = data.obras || []

    // Meta
    document.title = `${artista.nombre} — YCA Cerámica`
    document.getElementById('pageTitle').innerText = document.title

    // Foto
    if (artista.foto) {
      const img = document.getElementById('ceramistaFoto')
      img.src = artista.foto
      img.alt = artista.nombre
      img.style.display = 'block'
      document.getElementById('ceramistaFotoPlaceholder').style.display = 'none'
    }

    // Info
    document.getElementById('ceramistaNombre').innerText = artista.nombre
    const bioEl = document.getElementById('ceramistaBio')
    if (artista.bio) {
      bioEl.innerHTML = artista.bio.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')
    }

    // Redes
    const redesEl = document.getElementById('ceramistaRedes')
    let redesHtml = ''
    if (artista.instagram) {
      redesHtml += `<a class="ceramista-red" href="https://instagram.com/${artista.instagram}" target="_blank">
        <i class="fa-brands fa-instagram"></i> @${artista.instagram}
      </a>`
    }
    if (artista.web) {
      redesHtml += `<a class="ceramista-red" href="${artista.web}" target="_blank">
        <i class="fa-solid fa-globe"></i> Web
      </a>`
    }
    redesEl.innerHTML = redesHtml

    // Obras
    renderObras(obras)

    estado.style.display = 'none'
    document.getElementById('perfilWrapper').style.display = 'block'

  } catch (err) {
    msg.innerText = 'No se pudo cargar el perfil. Intentá de nuevo más tarde.'
    estado.querySelector('.spinner').style.display = 'none'
  }
}

function renderObras(obras) {
  const grid = document.getElementById('obrasGrid')
  if (obras.length === 0) {
    grid.innerHTML = '<p class="obras-vacias">Este artista todavía no tiene obras publicadas.</p>'
    return
  }
  grid.innerHTML = obras.map(o => {
    const foto = o.foto || ''
    const mostrarPrecio = (o.mostrarPrecio === 'true' || o.mostrarPrecio === true) && o.precio
    return `<div class="obra-card" onclick="abrirObraModal(${JSON.stringify(o).replace(/"/g,'&quot;')})">
      <div class="obra-card-foto" style="${foto ? `background-image:url('${foto}')` : ''}">
        ${!foto ? '<div class="obra-card-emoji">🏺</div>' : ''}
      </div>
      <div class="obra-card-info">
        <h3 class="obra-card-titulo">${o.titulo}</h3>
        ${mostrarPrecio ? `<div class="obra-card-precio">$${Number(o.precio).toLocaleString('es-AR')}</div>` : ''}
        ${o.enVenta === 'true' ? `<span class="obra-card-venta">En venta</span>` : ''}
      </div>
    </div>`
  }).join('')
}

// ── Modal obra ──
function abrirObraModal(obra) {
  _obraActual  = obra
  _fotoObraIdx = 0
  const fotos = [obra.foto, obra.foto2, obra.foto3].filter(Boolean)
  const mostrarPrecio = (obra.mostrarPrecio === 'true' || obra.mostrarPrecio === true) && obra.precio
  const enVenta = obra.enVenta === 'true' || obra.enVenta === true

  let galeriaHtml = ''
  if (fotos.length > 1) {
    const imgs = fotos.map((f, i) =>
      `<img class="om-foto" src="${f}" alt="${obra.titulo}" style="${i > 0 ? 'display:none' : ''}" loading="lazy">`
    ).join('')
    const dots = fotos.map((_, i) =>
      `<span class="om-dot ${i === 0 ? 'activo' : ''}" onclick="irFotoObra(${i})"></span>`
    ).join('')
    galeriaHtml = `<div class="om-galeria">
      ${imgs}
      <button class="om-nav om-prev" onclick="navFotoObra(-1)">&#8249;</button>
      <button class="om-nav om-next" onclick="navFotoObra(1)">&#8250;</button>
      <div class="om-dots">${dots}</div>
    </div>`
  } else if (fotos.length === 1) {
    galeriaHtml = `<div class="om-galeria"><img class="om-foto" src="${fotos[0]}" alt="${obra.titulo}" loading="lazy"></div>`
  } else {
    galeriaHtml = `<div class="om-galeria om-sin-foto">🏺</div>`
  }

  document.getElementById('obraModalContenido').innerHTML = `
    ${galeriaHtml}
    <div class="om-datos">
      <h2 class="om-titulo">${obra.titulo}</h2>
      ${obra.descripcion ? `<p class="om-descripcion">${obra.descripcion}</p>` : ''}
      ${mostrarPrecio ? `<div class="om-precio">$${Number(obra.precio).toLocaleString('es-AR')}</div>` : ''}
      ${enVenta ? `<button class="om-btn-wa" onclick="consultarObraWA()">
        <i class="fa-brands fa-whatsapp"></i> Consultar por esta obra
      </button>` : ''}
      <button class="om-btn-cerrar" onclick="cerrarObraModalBtn()">Cerrar</button>
    </div>
  `
  document.getElementById('obraOverlay').style.display = 'flex'
  document.body.style.overflow = 'hidden'
}

function cerrarObraModal(e) {
  if (e && e.target !== document.getElementById('obraOverlay')) return
  cerrarObraModalBtn()
}
function cerrarObraModalBtn() {
  document.getElementById('obraOverlay').style.display = 'none'
  document.body.style.overflow = ''
  _obraActual = null
  _fotoObraIdx = 0
}

function irFotoObra(n) {
  const fotos = document.querySelectorAll('.om-foto')
  const dots  = document.querySelectorAll('.om-dot')
  if (!fotos.length) return
  fotos[_fotoObraIdx].style.display = 'none'
  dots[_fotoObraIdx]?.classList.remove('activo')
  _fotoObraIdx = (n + fotos.length) % fotos.length
  fotos[_fotoObraIdx].style.display = 'block'
  dots[_fotoObraIdx]?.classList.add('activo')
}
function navFotoObra(dir) { irFotoObra(_fotoObraIdx + dir) }

function consultarObraWA() {
  if (!_obraActual) return
  const nombre = document.getElementById('ceramistaNombre')?.innerText || ''
  const texto  = `Hola! Me interesa la obra "${_obraActual.titulo}" de ${nombre} que vi en la vitrina de YCA Cerámica.`
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, '_blank')
}

document.addEventListener('keydown', e => {
  if (document.getElementById('obraOverlay')?.style.display === 'none') return
  if (e.key === 'Escape')     cerrarObraModalBtn()
  if (e.key === 'ArrowRight') navFotoObra(1)
  if (e.key === 'ArrowLeft')  navFotoObra(-1)
})

cargarPerfil()
