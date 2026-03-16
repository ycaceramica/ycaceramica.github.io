// ─────────────────────────────────────────────
// MODO OSCURO
// ─────────────────────────────────────────────

function actualizarIcono(){
  const btn = document.getElementById("toggleDark")
  if(btn) btn.innerText = document.body.classList.contains("dark") ? "☀️" : "🌙"
}

function aplicarModoOscuro(){
  if(localStorage.getItem("dark") === "true") document.body.classList.add("dark")
  actualizarIcono()
}

aplicarModoOscuro()

const toggleDark = document.getElementById("toggleDark")
if(toggleDark){
  toggleDark.addEventListener("click", () => {
    document.body.classList.toggle("dark")
    localStorage.setItem("dark", document.body.classList.contains("dark"))
    actualizarIcono()
  })
}

// ─────────────────────────────────────────────
// MENU HAMBURGUESA
// ─────────────────────────────────────────────

const hamburguesa = document.getElementById("hamburguesa")
const nav         = document.getElementById("nav")

if(hamburguesa){
  hamburguesa.addEventListener("click", () => nav.classList.toggle("active"))
}

document.querySelectorAll(".nav a").forEach(link => {
  link.addEventListener("click", () => nav.classList.remove("active"))
})

window.addEventListener("scroll", () => {
  if(nav) nav.classList.remove("active")
})

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

      if(slot.seccion === 'etapa'){
        const contenedor = document.getElementById('foto-etapa-' + slot.slot)
        if(contenedor){
          const img = document.createElement('img')
          img.src     = slot.foto
          img.alt     = 'Etapa ' + slot.slot
          img.loading = 'lazy'
          contenedor.replaceWith(img)
        }
      }

      if(slot.seccion === 'taller'){
        const contenedor = document.getElementById('foto-taller-' + slot.slot)
        if(contenedor){
          const img = document.createElement('img')
          img.src     = slot.foto
          img.alt     = 'Taller ' + slot.slot
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
