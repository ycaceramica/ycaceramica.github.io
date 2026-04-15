const API      = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'
const WHATSAPP = '5491160387535'

function crearCardArtista(artista) {
  const card = document.createElement('a')
  card.className = 'artista-card'
  card.href = `ceramista/?id=${artista.id}`

  const foto = artista.foto || ''
  card.innerHTML = `
    <div class="artista-card-foto" style="${foto ? `background-image:url('${foto}')` : ''}">
      ${!foto ? '<div class="artista-card-emoji">🎨</div>' : ''}
    </div>
    <div class="artista-card-info">
      <h2 class="artista-card-nombre">${artista.nombre}</h2>
      ${artista.bio ? `<p class="artista-card-bio">${artista.bio.length > 100 ? artista.bio.slice(0,100)+'…' : artista.bio}</p>` : ''}
      <span class="artista-card-btn">Ver perfil <i class="fa-solid fa-arrow-right"></i></span>
    </div>
  `
  return card
}

async function cargarVitrina() {
  const estado = document.getElementById('estadoVitrina')
  const grid   = document.getElementById('vitrinaGrid')

  try {
    const res  = await fetch(`${API}?action=getCeramistasVitrina`)
    const data = await res.json()
    const artistas = data.data || []

    estado.style.display = 'none'

    if (artistas.length === 0) {
      estado.style.display = 'block'
      estado.querySelector('p').innerText = 'Todavía no hay artistas en la vitrina. ¡Volvé pronto!'
      estado.querySelector('.spinner').style.display = 'none'
      return
    }

    artistas.forEach(a => grid.appendChild(crearCardArtista(a)))

  } catch (err) {
    estado.style.display = 'block'
    estado.querySelector('p').innerText = 'No se pudo cargar la vitrina. Intentá de nuevo más tarde.'
    estado.querySelector('.spinner').style.display = 'none'
  }
}

cargarVitrina()
