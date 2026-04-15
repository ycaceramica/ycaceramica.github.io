const API = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'

function formatearFecha(str) {
  if (!str) return ''
  // Soporta DD/MM/AAAA
  const partes = String(str).split('/')
  if (partes.length === 3) {
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
    const mes = meses[parseInt(partes[1]) - 1] || partes[1]
    return `${parseInt(partes[0])} de ${mes} de ${partes[2]}`
  }
  return str
}

function extracto(texto, max = 120) {
  if (!texto) return ''
  const limpio = texto.replace(/\n/g, ' ').trim()
  return limpio.length > max ? limpio.slice(0, max) + '…' : limpio
}

function crearCard(entrada) {
  const card = document.createElement('a')
  card.className = 'diario-card'
  card.href = `entrada/?id=${entrada.id}`

  const miniatura = entrada.miniatura || entrada.foto || ''
  card.innerHTML = `
    <div class="diario-card-img" style="${miniatura ? `background-image:url('${miniatura}')` : ''}">
      ${!miniatura ? '<div class="diario-card-emoji">✍️</div>' : ''}
    </div>
    <div class="diario-card-info">
      <div class="diario-card-fecha">${formatearFecha(entrada.creadoEn)}</div>
      <h2 class="diario-card-titulo">${entrada.titulo}</h2>
      <p class="diario-card-extracto">${extracto(entrada.texto)}</p>
      <span class="diario-card-leer">Leer entrada <i class="fa-solid fa-arrow-right"></i></span>
    </div>
  `
  return card
}

async function cargarDiario() {
  const estado = document.getElementById('estadoDiario')
  const grid   = document.getElementById('diarioGrid')

  try {
    const res  = await fetch(`${API}?action=getEntradas`)
    const data = await res.json()
    const entradas = data.data || []

    estado.style.display = 'none'

    if (entradas.length === 0) {
      estado.style.display = 'block'
      estado.querySelector('p').innerText = 'Todavía no hay entradas publicadas. ¡Volvé pronto!'
      estado.querySelector('.spinner').style.display = 'none'
      return
    }

    entradas.forEach(e => grid.appendChild(crearCard(e)))

  } catch (err) {
    estado.style.display = 'block'
    estado.querySelector('p').innerText = 'No se pudo cargar el diario. Intentá de nuevo más tarde.'
    estado.querySelector('.spinner').style.display = 'none'
  }
}

cargarDiario()
