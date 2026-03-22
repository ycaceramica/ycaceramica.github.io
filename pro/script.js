// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

const API = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'
const WA  = 'https://wa.me/5491160387535'

// ─────────────────────────────────────────────
// CONTENIDO POR CALCULADORA
// ─────────────────────────────────────────────

const CALCS_PRO = {
  seger: {
    icono:    '🔬',
    titulo:   'Fórmula Seger',
    subtitulo:'Analizá la composición química de tus esmaltes y optimizá cada receta con criterio técnico real.',
    url:      '../seger/index.html',
    para: [
      'Ceramistas que formulan sus propios esmaltes',
      'Quienes quieren entender por qué un esmalte craquela, es muy mate o no funde bien',
      'Técnicos y estudiantes avanzados de cerámica'
    ],
    que: [
      { icono: '⚗️', texto: 'Convertí una receta de materias primas a su composición en óxidos' },
      { icono: '📊', texto: 'Calculá la fórmula Seger normalizada (fundentes, alúmina, sílice)' },
      { icono: '🔍', texto: 'Detectá problemas automáticamente: craquelado, esmalte muy fluido, mate excesivo' },
      { icono: '💡', texto: 'Recibí sugerencias de corrección concretas (qué agregar o reducir)' },
      { icono: '📁', texto: 'Guardá tus recetas en el historial y descargalas en PDF' }
    ]
  },
  pruebas: {
    icono:    '🧪',
    titulo:   'Generador de pruebas de esmalte',
    subtitulo:'Organizá tus series de testeo de colorantes de forma sistemática, sin hacer cálculos a mano.',
    url:      '../pruebas/index.html',
    para: [
      'Ceramistas que experimentan con colorantes y óxidos',
      'Quienes hacen series de pruebas en el taller',
      'Cualquier persona que quiera sistematizar su proceso de investigación'
    ],
    que: [
      { icono: '🎨', texto: 'Ingresá hasta 3 colorantes con sus rangos y pasos' },
      { icono: '🔢', texto: 'El sistema genera todas las combinaciones posibles (hasta 40)' },
      { icono: '📋', texto: 'Visualizá la tabla o la matriz de pruebas lista para llevar al taller' },
      { icono: '🏷️', texto: 'Numeración automática para marcar tus piezas de testeo' },
      { icono: '📄', texto: 'Exportá la grilla en PDF para tener en el taller' }
    ]
  },
  arcillas: {
    icono:    '🧱',
    titulo:   'Mezcla de arcillas',
    subtitulo:'Formulá tus propias pastas mezclando materiales y obtené estimaciones de plasticidad, contracción y temperatura.',
    url:      '../arcillas/index.html',
    para: [
      'Ceramistas que quieren crear sus propias pastas',
      'Quienes trabajan con varios tipos de arcilla y necesitan controlar proporciones',
      'Estudiantes que quieren entender cómo se formula una pasta'
    ],
    que: [
      { icono: '⚖️', texto: 'Ingresá materiales por porcentaje o por gramos — el sistema convierte' },
      { icono: '🔄', texto: 'Normalizá la mezcla automáticamente si los porcentajes no suman 100' },
      { icono: '📈', texto: 'Estimá plasticidad, contracción y temperatura de cocción de la pasta resultante' },
      { icono: '📝', texto: 'Guardá tus fórmulas en el historial con nombre propio' },
      { icono: '📄', texto: 'Descargá cada fórmula en PDF' }
    ]
  }
}

// ─────────────────────────────────────────────
// SESIÓN
// ─────────────────────────────────────────────

function getSesion(){
  try { return JSON.parse(sessionStorage.getItem('yca_sesion')) }
  catch(e) { return null }
}

// ─────────────────────────────────────────────
// MODO OSCURO
// ─────────────────────────────────────────────

function aplicarModoOscuro(){
  if(localStorage.getItem('dark') === 'true') document.body.classList.add('dark')
  const btn = document.getElementById('toggleDark')
  if(btn) btn.innerText = document.body.classList.contains('dark') ? '☀️' : '🌙'
}

aplicarModoOscuro()

const toggleDark = document.getElementById('toggleDark')
if(toggleDark){
  toggleDark.addEventListener('click', () => {
    document.body.classList.toggle('dark')
    localStorage.setItem('dark', document.body.classList.contains('dark'))
    toggleDark.innerText = document.body.classList.contains('dark') ? '☀️' : '🌙'
  })
}

const hamburguesa = document.getElementById('hamburguesa')
const nav = document.getElementById('nav')
if(hamburguesa){
  hamburguesa.addEventListener('click', () => nav.classList.toggle('active'))
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search)
  const calcId = params.get('calc')
  const calc   = CALCS_PRO[calcId]

  if(!calc){
    window.location.href = '../herramientas/index.html'
    return
  }

  const sesion = getSesion()
  const esPro  = sesion && sesion.plan === 'pro'

  // Llenar hero
  document.getElementById('proIcono').innerText   = calc.icono
  document.getElementById('proTitulo').innerText  = calc.titulo
  document.getElementById('proSubtitulo').innerText = calc.subtitulo
  document.title = calc.titulo + ' — YCA Cerámica'

  // Llenar contenido
  const contenido = document.getElementById('proContenido')
  contenido.innerHTML = `
    <div class="pro-bloque">
      <h2>¿Qué hace esta calculadora?</h2>
      <ul class="pro-lista">
        ${calc.que.map(q => `
          <li>
            <span class="pro-lista-icono">${q.icono}</span>
            <span>${q.texto}</span>
          </li>
        `).join('')}
      </ul>
    </div>

    <div class="pro-bloque">
      <h2>¿Para quién es?</h2>
      <ul class="pro-lista-simple">
        ${calc.para.map(p => `<li><i class="fa-solid fa-check"></i> ${p}</li>`).join('')}
      </ul>
    </div>
  `

  // Llenar acciones según plan
  const acciones = document.getElementById('proAcciones')

  if(esPro){
    // Usuario Pro — acceso directo
    acciones.innerHTML = `
      <div class="pro-acceso-card">
        <div class="pro-acceso-badge">⭐ Tenés acceso Pro</div>
        <p>Ya podés usar esta calculadora. Tus cálculos se guardan en tu historial.</p>
        <a class="pro-btn-principal" href="${calc.url}">
          <i class="fa-solid fa-arrow-right"></i> Ir a la calculadora
        </a>
      </div>
    `
  } else {
    // Usuario sin Pro — formulario de solicitud
    const nombre = sesion ? sesion.nombre : ''
    const email  = sesion ? sesion.id     : ''

    acciones.innerHTML = `
      <div class="pro-acceso-card bloqueada">
        <div class="pro-acceso-badge bloqueada-badge">🔒 Acceso Pro requerido</div>
        <p>Esta calculadora es parte del plan Pro. Contactanos para obtener acceso.</p>

        <div class="pro-form">
          <div class="pro-form-grupo">
            <label>Tu nombre</label>
            <input type="text" id="proNombre" placeholder="Tu nombre completo" value="${nombre}">
          </div>
          <div class="pro-form-grupo">
            <label>Tu email</label>
            <input type="email" id="proEmail" placeholder="tu@email.com" value="${email}">
          </div>
          <div class="pro-form-grupo">
            <label>Mensaje <small>(opcional)</small></label>
            <textarea id="proMensaje" placeholder="Contanos algo sobre tu trabajo o taller..." rows="3"></textarea>
          </div>

          <div class="pro-error" id="proError" style="display:none">
            <i class="fa-solid fa-circle-exclamation"></i>
            <span id="proErrorMsg"></span>
          </div>

          <button class="pro-btn-principal" id="btnSolicitar" onclick="solicitarAcceso('${calcId}')">
            <i class="fa-solid fa-paper-plane"></i> Quiero acceso Pro
          </button>
        </div>

        <div class="pro-separador">o contactanos directamente</div>

        <div class="pro-contacto-directo">
          <a class="pro-btn-wa" href="${WA}?text=${encodeURIComponent('Hola! Me interesa el acceso Pro a la calculadora ' + calc.titulo + ' de YCA Cerámica.')}" target="_blank">
            <i class="fa-brands fa-whatsapp"></i> WhatsApp
          </a>
          <a class="pro-btn-email" href="mailto:ycaceramica@gmail.com?subject=${encodeURIComponent('Solicitud acceso Pro — ' + calc.titulo)}&body=${encodeURIComponent('Hola! Me interesa el acceso Pro a la calculadora ' + calc.titulo + '.\n\nMi nombre: \nMi email: ')}">
            <i class="fa-solid fa-envelope"></i> Email directo
          </a>
        </div>

      </div>
    `
  }
})

// ─────────────────────────────────────────────
// SOLICITAR ACCESO
// ─────────────────────────────────────────────

async function solicitarAcceso(calcId){
  const nombre   = document.getElementById('proNombre').value.trim()
  const email    = document.getElementById('proEmail').value.trim()
  const mensaje  = document.getElementById('proMensaje').value.trim()
  const errorDiv = document.getElementById('proError')
  const errorMsg = document.getElementById('proErrorMsg')

  errorDiv.style.display = 'none'

  if(!nombre || !email){
    errorMsg.innerText = 'Completá tu nombre y email para enviar la solicitud.'
    errorDiv.style.display = 'flex'
    return
  }

  const calc = CALCS_PRO[calcId]
  const btn  = document.getElementById('btnSolicitar')
  btn.disabled    = true
  btn.innerHTML   = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...'

  try {
    const res  = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({
        action:  'notificarPro',
        nombre,
        email,
        mensaje: `Calculadora solicitada: ${calc ? calc.titulo : calcId}\n${mensaje}`
      })
    })
    const data = await res.json()

    if(data.ok){
      document.getElementById('modalExito').style.display = 'flex'
    } else {
      document.getElementById('modalErrorMsg').innerText = data.error || 'No se pudo enviar la solicitud.'
      document.getElementById('modalError').style.display = 'flex'
    }
  } catch(e){
    document.getElementById('modalErrorMsg').innerText = 'Error de conexión. Usá WhatsApp o email directo.'
    document.getElementById('modalError').style.display = 'flex'
  }

  btn.disabled  = false
  btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Quiero acceso Pro'
}

// ─────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────

function cerrarModal(){
  document.getElementById('modalExito').style.display = 'none'
  document.getElementById('modalError').style.display = 'none'
}

document.querySelectorAll('.pro-modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if(e.target === overlay) cerrarModal()
  })
})
