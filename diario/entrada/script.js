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

cargarEntrada()
