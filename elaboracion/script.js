// Dark mode y nav manejados por nav-ceramista.js

// ─────────────────────────────────────────────
// FOTOS DINÁMICAS DESDE APPS SCRIPT
// ─────────────────────────────────────────────

const API_ELAB = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'

async function cargarFotosElaboracion(){
  try {
    const res  = await fetch(`${API_ELAB}?action=getElaboracion`)
    const data = await res.json()
    const slots = data.data || []

    slots.forEach(slot => {
      if(!slot.foto) return
      const slotNum = Math.round(parseFloat(slot.slot))

      if(slot.seccion === 'etapa'){
        const contenedor = document.getElementById('foto-etapa-' + slotNum)
        if(contenedor){
          const img = document.createElement('img')
          img.src     = slot.foto
          img.alt     = 'Etapa ' + slotNum
          img.loading = 'lazy'
          contenedor.replaceWith(img)
        }
      }

      if(slot.seccion === 'taller'){
        const contenedor = document.getElementById('foto-taller-' + slotNum)
        if(contenedor){
          const img = document.createElement('img')
          img.src     = slot.foto
          img.alt     = 'Taller ' + slotNum
          img.loading = 'lazy'
          img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:12px;'
          contenedor.replaceWith(img)
        }
      }
    })
  } catch(e) {
    // Silencioso — si falla quedan los placeholders
  }
}

cargarFotosElaboracion()
