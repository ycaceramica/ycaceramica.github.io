const API = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'

function formatearFecha(str) {
  if (!str) return ''
  const partes = String(str).split('/')
  if (partes.length === 3) {
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
    const mes = meses[parseInt(partes[1]) - 1] || partes[1]
    return `${parseInt(partes[0])} de ${mes} de ${partes[2]}`
  }
  return str
}

function youtubeEmbedUrl(url) {
  if (!url) return null
  // youtu.be/ID
  let m = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  // youtube.com/watch?v=ID
  m = url.match(/[?&]v=([a-zA-Z0-9_-]+)/)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  // youtube.com/embed/ID (ya es embed)
  m = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  return null
}

async function cargarEntrada() {
  const params = new URLSearchParams(window.location.search)
  const id     = params.get('id')

  const wrapper = document.getElementById('entradaWrapper')
  const estado  = document.getElementById('entradaEstado')
  const msg     = document.getElementById('entradaEstadoMsg')

  if (!id) {
    msg.innerText = 'Entrada no encontrada.'
    estado.querySelector('.spinner').style.display = 'none'
    return
  }

  try {
    const res  = await fetch(`${API}?action=getEntrada&id=${encodeURIComponent(id)}`)
    const data = await res.json()

    if (!data.ok || !data.data) {
      msg.innerText = data.error || 'Entrada no encontrada.'
      estado.querySelector('.spinner').style.display = 'none'
      return
    }

    const e = data.data

    // Meta
    document.title = `${e.titulo} — YCA Cerámica`
    document.getElementById('pageTitle').innerText = `${e.titulo} — YCA Cerámica`

    // Cabecera
    document.getElementById('entradaFecha').innerText  = formatearFecha(e.creadoEn)
    document.getElementById('entradaCodigo').innerText = e.codigo || ''
    document.getElementById('entradaTitulo').innerText = e.titulo || ''

    // Foto principal
    const fotoEl  = document.getElementById('entradaFotoPrincipal')
    const fotoImg = document.getElementById('entradaFotoImg')
    const fotoPrincipal = e.foto || e.miniatura || ''
    if (fotoPrincipal) {
      fotoImg.src = fotoPrincipal
      fotoImg.alt = e.titulo
      fotoEl.style.display = 'block'
    }

    // Texto — preservar saltos de línea
    const textoEl = document.getElementById('entradaTexto')
    if (e.texto) {
      textoEl.innerHTML = e.texto
        .split('\n')
        .map(p => p.trim() ? `<p>${p}</p>` : '<br>')
        .join('')
    }

    // Galería fotos extra
    const fotos = [e.foto2, e.foto3, e.foto4].filter(Boolean)
    const galeriaEl = document.getElementById('entradaGaleria')
    if (fotos.length > 0) {
      galeriaEl.style.display = 'grid'
      galeriaEl.innerHTML = fotos.map(f =>
        `<div class="galeria-item"><img src="${f}" alt="${e.titulo}" loading="lazy"></div>`
      ).join('')
    }

    // Video YouTube
    const embedUrl = youtubeEmbedUrl(e.video)
    if (embedUrl) {
      document.getElementById('entradaVideoFrame').src = embedUrl
      document.getElementById('entradaVideo').style.display = 'block'
    }

    // Mostrar
    estado.style.display  = 'none'
    wrapper.style.display = 'block'

  } catch (err) {
    msg.innerText = 'No se pudo cargar la entrada. Intentá de nuevo más tarde.'
    estado.querySelector('.spinner').style.display = 'none'
  }
}

// ─────────────────────────────────────────────
// LIGHTBOX — fotos en tamaño real con marca de agua
// ─────────────────────────────────────────────
// La foto original en Drive no se modifica: la marca se dibuja
// en una copia, así lo que el usuario guarda desde el visor sale con logo.

const LOGO_MARCA   = '../../imagenes/logo.png'
const MARCA_ANCHO  = 0.15   // ancho del logo = 15% del ancho de la foto
const MARCA_ALPHA  = 0.55   // transparencia del logo (0 a 1)
const MARCA_MARGEN = 0.03   // margen al borde = 3% del ancho de la foto
const MAX_LADO     = 2000   // la copia con marca no pasa de 2000px de lado

let _lightboxToken = 0
let _lightboxBlobUrl = null

// Envuelve la imagen del visor para poder superponer la marca de respaldo
;(function prepararVisor(){
  const img = document.getElementById('lightbox-img')
  if (!img || img.parentElement.classList.contains('lightbox-wrap')) return
  const wrap = document.createElement('div')
  wrap.className = 'lightbox-wrap'
  img.parentNode.insertBefore(wrap, img)
  wrap.appendChild(img)
  const marca = document.createElement('div')
  marca.className = 'lightbox-marca'
  marca.id = 'lightbox-marca'
  wrap.appendChild(marca)
})()

function cargarImagen(src, cors){
  return new Promise((resolve, reject) => {
    const im = new Image()
    if (cors) im.crossOrigin = 'anonymous'
    im.onload  = () => resolve(im)
    im.onerror = () => reject(new Error('No se pudo cargar ' + src))
    im.src = src
  })
}

async function crearImagenConMarca(src){
  const [foto, logo] = await Promise.all([cargarImagen(src, true), cargarImagen(LOGO_MARCA, false)])
  let w = foto.naturalWidth, h = foto.naturalHeight
  const escala = Math.min(1, MAX_LADO / Math.max(w, h))
  w = Math.round(w * escala); h = Math.round(h * escala)

  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(foto, 0, 0, w, h)

  const lw = Math.max(48, Math.round(w * MARCA_ANCHO))
  const lh = Math.round(lw * logo.naturalHeight / logo.naturalWidth)
  const mg = Math.round(w * MARCA_MARGEN)
  ctx.globalAlpha = MARCA_ALPHA
  ctx.drawImage(logo, w - lw - mg, h - lh - mg, lw, lh)
  ctx.globalAlpha = 1

  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob falló')), 'image/jpeg', 0.9)
  })
}

async function abrirLightbox(src){
  const token = ++_lightboxToken
  const box   = document.getElementById('lightbox')
  const img   = document.getElementById('lightbox-img')
  const marca = document.getElementById('lightbox-marca')

  img.src = ''
  if (marca) marca.style.display = 'none'
  box.style.display = 'flex'
  document.body.style.overflow = 'hidden'

  try {
    // Camino principal: copia con la marca grabada en la imagen
    const blob = await crearImagenConMarca(src)
    if (token !== _lightboxToken) return          // se cerró o se abrió otra mientras cargaba
    if (_lightboxBlobUrl) URL.revokeObjectURL(_lightboxBlobUrl)
    _lightboxBlobUrl = URL.createObjectURL(blob)
    img.src = _lightboxBlobUrl
  } catch (err) {
    // Respaldo: se muestra la original con el logo superpuesto (solo visual)
    if (token !== _lightboxToken) return
    img.src = src
    if (marca) marca.style.display = 'block'
  }
}

function cerrarLightbox(){
  _lightboxToken++
  document.getElementById('lightbox').style.display = 'none'
  document.getElementById('lightbox-img').src = ''
  const marca = document.getElementById('lightbox-marca')
  if (marca) marca.style.display = 'none'
  if (_lightboxBlobUrl) { URL.revokeObjectURL(_lightboxBlobUrl); _lightboxBlobUrl = null }
  document.body.style.overflow = ''
}

// Clic en la foto principal o en cualquier foto de la galería
document.addEventListener('click', (e) => {
  const img = e.target.closest('.entrada-foto-principal img, .galeria-item img')
  if (img && img.src) abrirLightbox(img.src)
})

// Clic en el fondo oscuro cierra
document.getElementById('lightbox')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('lightbox')) cerrarLightbox()
})

// Tecla Escape cierra
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cerrarLightbox()
})

cargarEntrada()
