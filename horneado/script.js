// ─────────────────────────────────────────────
// Dark mode y nav manejados por nav-ceramista.js
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// FORMULARIO — ENVIAR POR WHATSAPP
// ─────────────────────────────────────────────

function enviarWhatsApp(){
  const nombre      = document.getElementById('nombre').value.trim()
  const telefono    = document.getElementById('telefono').value.trim()
  const tipoCoccion = document.getElementById('tipoCoccion').value
  const temperatura = document.getElementById('temperatura').value
  const cantidad    = document.getElementById('cantidad').value
  const fecha       = document.getElementById('fecha').value
  const mensaje     = document.getElementById('mensaje').value.trim()

  const err = document.getElementById('formError')

  if(!nombre || !telefono || !tipoCoccion || !temperatura || !cantidad){
    if(err){ err.innerText = 'Por favor completá todos los campos obligatorios (*)'; err.style.display = 'block' }
    return
  }
  if(err) err.style.display = 'none'

  let texto = `¡Hola! Quiero consultar sobre el servicio de horneado 🔥\n\n`
  texto += `*Nombre:* ${nombre}\n`
  texto += `*Teléfono:* ${telefono}\n`
  texto += `*Tipo de cocción:* ${tipoCoccion}\n`
  texto += `*Temperatura:* ${temperatura}\n`
  texto += `*Cantidad de piezas:* ${cantidad}\n`
  if(fecha) texto += `*Fecha estimada:* ${new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR')}\n`
  if(mensaje) texto += `*Mensaje:* ${mensaje}\n`

  const url = `https://wa.me/5491160387535?text=${encodeURIComponent(texto)}`
  window.open(url, '_blank')
}
