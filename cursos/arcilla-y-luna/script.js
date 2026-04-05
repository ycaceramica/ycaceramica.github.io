// ─────────────────────────────────────────────
// SINCRONIZAR ESTADO DESDE ADMIN
// ─────────────────────────────────────────────

const API = "https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec"

async function sincronizarEstado(hojaId){
  try {
    const res  = await fetch(`${API}?action=getCursoDetalle&hojaId=${hojaId}`)
    const data = await res.json()
    if(!data.ok || !data.data) return
    const estado = data.data.estado || 'proximamente'
    const labels = { activo:'Activo', proximamente:'Próximamente', finalizado:'Finalizado' }
    const badge  = document.querySelector('.curso-badge-estado')
    if(badge){
      badge.className  = `curso-badge-estado ${estado}`
      badge.textContent = labels[estado] || estado
    }
  } catch(e) { /* silencioso */ }
}
// Dark mode y nav manejados por nav-ceramista.js

// ─────────────────────────────────────────────
// FORMULARIO → WHATSAPP
// ─────────────────────────────────────────────

function enviarConsulta(){
  const nombre    = document.getElementById("fNombre").value.trim()
  const email     = document.getElementById("fEmail").value.trim()
  const telefono  = document.getElementById("fTelefono").value.trim()
  const conociste = document.getElementById("fConociste").value
  const mensaje   = document.getElementById("fMensaje").value.trim()

  if(!nombre || !email){
    const err = document.getElementById("formError")
    if(err){ err.innerText = "Por favor completá al menos tu nombre y email."; err.style.display = "block" }
    return
  }
  const err = document.getElementById("formError")
  if(err) err.style.display = "none"

  let texto = `¡Hola! Me interesa reservar un lugar en Arcilla y Luna 🌙\n\n`
  texto += `*Nombre:* ${nombre}\n`
  texto += `*Email:* ${email}\n`
  if(telefono)  texto += `*Teléfono:* ${telefono}\n`
  if(conociste) texto += `*¿Cómo nos conoció?:* ${conociste}\n`
  if(mensaje)   texto += `*Mensaje:* ${mensaje}\n`

  window.open(`https://wa.me/5491160387535?text=${encodeURIComponent(texto)}`, "_blank")
}

// Sincronizar estado al cargar
document.addEventListener('DOMContentLoaded', () => sincronizarEstado('arcilla-y-luna'))
