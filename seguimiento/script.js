const API = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'
const WA  = 'https://wa.me/5491160387535'

const ESTADOS = [
  { key: 'pendiente',  label: 'Pendiente',  icon: '⏳', desc: 'Recibimos tu solicitud. Pronto te contactamos para coordinar entrega y pago.' },
  { key: 'confirmado', label: 'Confirmado', icon: '✅', desc: 'Tu pedido está confirmado. ¡Ya coordinamos todo!' },
  { key: 'en horno',   label: 'En horno',   icon: '🔥', desc: 'Tus piezas están en el horno. ¡El proceso está en marcha!' },
  { key: 'listo',      label: 'Listo',      icon: '🎉', desc: '¡Tus piezas están listas! Coordina el retiro con nosotros.' },
  { key: 'entregado',  label: 'Entregado',  icon: '📦', desc: '¡Pedido entregado! Gracias por confiar en YCA. 💫' }
]

const COLORES = {
  pendiente:  { bg: '#fff8e1', color: '#b26a00' },
  confirmado: { bg: '#e8f5e9', color: '#2e7d32' },
  'en horno': { bg: '#fce4ec', color: '#c62828' },
  listo:      { bg: '#e3f2fd', color: '#1565c0' },
  entregado:  { bg: '#f3e5f5', color: '#6a1b9a' }
}

// ── Leer código desde URL si viene del QR ──
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search)
  const codigo = params.get('pedido')
  if (codigo) {
    document.getElementById('inputCodigo').value = codigo.toUpperCase()
    buscarPedido()
  }
})

async function buscarPedido() {
  const codigo = document.getElementById('inputCodigo').value.trim().toUpperCase()
  const errEl  = document.getElementById('segError')

  errEl.style.display = 'none'

  if (!codigo) {
    errEl.textContent = 'Ingresá tu número de pedido.'
    errEl.style.display = 'block'
    return
  }

  if (!codigo.startsWith('HOR-')) {
    errEl.textContent = 'El formato del pedido es HOR-000. Revisá el número.'
    errEl.style.display = 'block'
    return
  }

  document.getElementById('segLoading').style.display  = 'flex'
  document.getElementById('buscador').style.display    = 'none'
  document.getElementById('resultado').style.display   = 'none'

  try {
    const res  = await fetch(`${API}?action=getSeguimientoHorneado&codigo=${encodeURIComponent(codigo)}`)
    const data = await res.json()

    if (!data.ok || !data.pedido) {
      document.getElementById('buscador').style.display = 'block'
      errEl.textContent = data.error || 'No encontramos un pedido con ese número.'
      errEl.style.display = 'block'
      return
    }

    mostrarResultado(data.pedido)

  } catch(e) {
    document.getElementById('buscador').style.display = 'block'
    errEl.textContent = 'Error de conexión. Intentá de nuevo.'
    errEl.style.display = 'block'
  } finally {
    document.getElementById('segLoading').style.display = 'none'
  }
}

function mostrarResultado(p) {
  const estado       = (p.estado || 'pendiente').trim().toLowerCase()
  const estadoInfo   = ESTADOS.find(e => e.key === estado) || ESTADOS[0]
  const estadoIdx    = ESTADOS.findIndex(e => e.key === estado)
  const col          = COLORES[estado] || COLORES.pendiente
  const fechasEstados = p.fechasEstados ? JSON.parse(p.fechasEstados) : {}

  // Encabezado
  document.getElementById('resCodigo').textContent = p.codigo
  document.getElementById('resNombre').textContent = p.nombre
  document.getElementById('resFecha').textContent  = 'Ingresado el ' + formatFecha(p.fechaRegistro)

  const badge = document.getElementById('resEstadoBadge')
  badge.textContent        = estadoInfo.icon + ' ' + estadoInfo.label
  badge.style.background   = col.bg
  badge.style.color        = col.color

  // Línea de tiempo
  const timeline = document.getElementById('resTimeline')
  timeline.innerHTML = ESTADOS.map((e, i) => {
    const completado = i <= estadoIdx
    const actual     = i === estadoIdx
    const fecha      = fechasEstados[e.key] ? formatFecha(fechasEstados[e.key]) : null
    const colE       = COLORES[e.key]

    return `<div class="seg-step ${completado ? 'completado' : ''} ${actual ? 'actual' : ''}">
      <div class="seg-step-linea ${i < ESTADOS.length - 1 ? 'con-linea' : ''}">
        <div class="seg-step-circulo" style="${actual ? `background:${colE.color};border-color:${colE.color}` : completado ? `background:${colE.color};border-color:${colE.color};opacity:0.7` : ''}">
          ${completado ? `<span>${e.icon}</span>` : `<span class="seg-step-num">${i + 1}</span>`}
        </div>
        ${i < ESTADOS.length - 1 ? `<div class="seg-step-barra ${completado && i < estadoIdx ? 'llena' : ''}"></div>` : ''}
      </div>
      <div class="seg-step-info">
        <div class="seg-step-label ${actual ? 'label-actual' : ''}" style="${actual ? `color:${colE.color}` : ''}">${e.label}</div>
        ${fecha ? `<div class="seg-step-fecha">${fecha}</div>` : ''}
        ${actual ? `<div class="seg-step-desc">${estadoInfo.desc}</div>` : ''}
      </div>
    </div>`
  }).join('')

  // Mensaje según estado
  const msgEl = document.getElementById('resMensaje')
  msgEl.style.display = 'block'
  msgEl.innerHTML = `<div class="seg-mensaje-inner" style="border-left-color:${col.color}">
    <span class="seg-mensaje-icono">${estadoInfo.icon}</span>
    <span>${estadoInfo.desc}</span>
  </div>`

  // WhatsApp — solo Confirmado en adelante
  const waEl = document.getElementById('resWhatsapp')
  if (estadoIdx >= 1) {
    const msg = `Hola YCA! 👋 Tengo una consulta sobre mi pedido ${p.codigo} (${estadoInfo.label}).`
    document.getElementById('linkWhatsapp').href = `${WA}?text=${encodeURIComponent(msg)}`
    waEl.style.display = 'block'
  } else {
    waEl.style.display = 'none'
  }

  document.getElementById('resultado').style.display = 'block'
}

function resetBusqueda() {
  document.getElementById('resultado').style.display = 'none'
  document.getElementById('buscador').style.display  = 'block'
  document.getElementById('inputCodigo').value = ''
  document.getElementById('segError').style.display = 'none'
  // Limpiar URL
  window.history.replaceState({}, '', window.location.pathname)
}

function formatFecha(raw) {
  if (!raw) return ''
  // Si viene como string dd/mm/yyyy — devolverlo directo
  if (typeof raw === 'string' && raw.includes('/')) return raw
  // Si viene como ISO date de Sheets
  try {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return raw
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch(e) { return raw }
}
