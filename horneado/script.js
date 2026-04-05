// ─────────────────────────────────────────────
// Dark mode y nav manejados por nav-ceramista.js
// ─────────────────────────────────────────────

const API = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'

// ─────────────────────────────────────────────
// TOGGLE BLOQUE ESMALTES
// ─────────────────────────────────────────────

function toggleEsmaltes(mostrar) {
  const bloque = document.getElementById('bloque-esmaltes')
  if (!bloque) return
  bloque.style.display = mostrar ? 'flex' : 'none'
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function getRadio(name) {
  const sel = document.querySelector(`input[name="${name}"]:checked`)
  return sel ? sel.value : ''
}

function mostrarError(msg) {
  const el = document.getElementById('formError')
  if (el) { el.innerText = msg; el.style.display = 'block' }
}

function ocultarError() {
  const el = document.getElementById('formError')
  if (el) el.style.display = 'none'
}

function mostrarModalExito(codigo, tieneEmail) {
  const modal = document.getElementById('modalExito')
  const texto = document.getElementById('modalExitoTexto')
  const cod   = document.getElementById('modalCodigo')
  if (texto) texto.innerText = tieneEmail
    ? 'Tu pedido fue registrado. Te enviamos la confirmación por email y te escribimos a la brevedad para coordinar la horneada. 🙌'
    : 'Tu pedido fue registrado. Te escribimos a la brevedad para coordinar la horneada. 🙌'
  if (cod) cod.innerText = 'Número de pedido: ' + codigo
  if (modal) modal.style.display = 'flex'
}

function mostrarModalError(msg) {
  const modal = document.getElementById('modalError')
  const texto = document.getElementById('modalErrorTexto')
  if (texto) texto.innerText = msg || 'Hubo un error al enviar tu solicitud. Por favor intentá de nuevo o escribinos por WhatsApp.'
  if (modal) modal.style.display = 'flex'
}

// ─────────────────────────────────────────────
// ENVIAR FORMULARIO
// ─────────────────────────────────────────────

async function enviarFormulario() {
  ocultarError()

  // Campos obligatorios
  const nombre   = document.getElementById('nombre').value.trim()
  const telefono = document.getElementById('telefono').value.trim()
  const email    = document.getElementById('email').value.trim()
  const cantidad = document.getElementById('cantidad').value.trim()
  const uso      = getRadio('uso')
  const etapa    = getRadio('etapa')
  const secas    = getRadio('secas')
  const tieneEsmalte = getRadio('tieneEsmalte')
  const acepta   = document.getElementById('aceptaCondiciones').checked

  if (!nombre)         return mostrarError('Ingresá tu nombre y apellido.')
  if (!telefono)       return mostrarError('Ingresá tu teléfono / WhatsApp.')
  if (!cantidad)       return mostrarError('Indicá la cantidad de piezas.')
  if (!uso)            return mostrarError('Indicá si las piezas son de uso personal o taller.')
  if (!etapa)          return mostrarError('Indicá en qué etapa están las piezas.')
  if (!secas)          return mostrarError('Indicá si las piezas están completamente secas.')
  if (!tieneEsmalte)   return mostrarError('Indicá si las piezas tienen esmalte.')
  if (!acepta)         return mostrarError('Tenés que aceptar las condiciones para continuar.')

  // Campos opcionales
  const zona             = document.getElementById('zona').value.trim()
  const tamano           = document.getElementById('tamano').value.trim()
  const pasta            = document.getElementById('pasta').value.trim()
  const tempPasta        = document.getElementById('tempPasta').value.trim()
  const tipoEsmalte      = tieneEsmalte === 'Sí' ? document.getElementById('tipoEsmalte').value.trim()  : ''
  const tempEsmalte      = tieneEsmalte === 'Sí' ? document.getElementById('tempEsmalte').value.trim()  : ''
  const esmalteBase      = tieneEsmalte === 'Sí' ? getRadio('esmalteBase') : ''
  const gruesosCerrados  = getRadio('gruesosCerrados')
  const fechaNecesidad   = document.getElementById('fechaNecesidad').value
  const comentarios      = document.getElementById('comentarios').value.trim()

  const payload = {
    action: 'recibirPedidoHorneado',
    nombre,
    email,
    telefono,
    zona,
    uso,
    etapa,
    cantidad,
    tamano,
    pasta,
    tempPasta,
    secas,
    tieneEsmalte,
    tipoEsmalte,
    tempEsmalte,
    esmalteBase,
    gruesosCerrados,
    fechaNecesidad: fechaNecesidad
      ? new Date(fechaNecesidad + 'T00:00:00').toLocaleDateString('es-AR')
      : '',
    comentarios
  }

  // UI: deshabilitar botón
  const btn = document.getElementById('btnEnviar')
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...' }

  try {
    const res  = await fetch(API, {
      method: 'POST',
      body:   JSON.stringify(payload)
    })
    const data = await res.json()

    if (data.ok) {
      mostrarModalExito(data.codigo || 'HOR-???', !!email)
      // Limpiar form
      document.querySelectorAll('#consultar input, #consultar select, #consultar textarea').forEach(el => {
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = false
        else el.value = ''
      })
      toggleEsmaltes(false)
    } else {
      mostrarModalError(data.error || null)
    }
  } catch (e) {
    mostrarModalError('No se pudo conectar con el servidor. Verificá tu conexión e intentá de nuevo.')
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-fire"></i> Enviar solicitud' }
  }
}
