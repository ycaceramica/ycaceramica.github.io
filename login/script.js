// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────

const API = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec';

// ─────────────────────────────────────────────
// MODO OSCURO
// ─────────────────────────────────────────────

function aplicarModoOscuro(){
  if(localStorage.getItem("dark") === "true") document.body.classList.add("dark")
}
aplicarModoOscuro()

// ─────────────────────────────────────────────
// REDIRIGIR SI YA ESTÁ LOGUEADO
// ─────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  const sesion = getSesion()
  if(sesion){
    if(sesion.rol === 'admin')      window.location.href = '../admin/index.html'
    else if(sesion.rol === 'ceramista') window.location.href = '../mi-taller/index.html'
    else                            window.location.href = '../mi-cuenta/index.html'
  }
  cargarCursosRegistro()

  // Si viene con #ceramista en la URL, abrir el tab ceramista directo
  if(window.location.hash === '#ceramista'){
    setTab('ceramista')
  }
})

// ─────────────────────────────────────────────
// CURSOS DINÁMICOS EN EL REGISTRO
// ─────────────────────────────────────────────

async function cargarCursosRegistro(){
  const select = document.getElementById('regCurso')
  try {
    const res  = await fetch(`${API}?action=getCursos`)
    const data = await res.json()
    const cursos = (data.data || []).filter(c =>
      c.estado !== 'finalizado' && c.visible !== 'false' && c.visible !== false
    )

    select.innerHTML = '<option value="">Seleccioná un curso</option>'

    if(cursos.length === 0){
      select.innerHTML = '<option value="">No hay cursos disponibles</option>'
      return
    }

    cursos.forEach(c => {
      const opt   = document.createElement('option')
      opt.value   = c.hojaId || c.id
      opt.textContent = c.nombre + (c.estado === 'proximamente' ? ' — Próximamente' : '')
      select.appendChild(opt)
    })
  } catch(e) {
    select.innerHTML = '<option value="">Seleccioná un curso</option>'
  }
}

// ─────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────

function setTab(tab){
  const esIngresar    = tab === 'ingresar'
  const esRegistrarse = tab === 'registrarse'
  const esCeramista   = tab === 'ceramista'
  const esOlvide      = tab === 'olvide'

  document.getElementById('tabIngresar').classList.toggle('activo',    esIngresar)
  document.getElementById('tabRegistrarse').classList.toggle('activo', esRegistrarse)
  document.getElementById('tabCeramista').classList.toggle('activo',   esCeramista)
  document.getElementById('loginTabs').style.display = esOlvide ? 'none' : 'flex'

  document.getElementById('formIngresar').style.display    = esIngresar    ? 'flex' : 'none'
  document.getElementById('formRegistrarse').style.display = esRegistrarse ? 'flex' : 'none'
  document.getElementById('formCeramista').style.display   = esCeramista   ? 'flex' : 'none'
  document.getElementById('formOlvide').style.display      = esOlvide      ? 'flex' : 'none'
  ocultarErrores()
}

// ─────────────────────────────────────────────
// OLVIDÉ MI CONTRASEÑA
// ─────────────────────────────────────────────

async function recuperarContrasena(){
  const email    = document.getElementById('olvideEmail').value.trim()
  const errorDiv = document.getElementById('olvideError')
  const errorMsg = document.getElementById('olvideErrorMsg')
  const succDiv  = document.getElementById('olvideSuccess')

  errorDiv.style.display = 'none'
  succDiv.style.display  = 'none'

  if(!email){
    errorMsg.innerText = 'Ingresá tu email'
    errorDiv.style.display = 'flex'
    return
  }

  setBtnCargando('btnOlvide', true)

  try {
    const res  = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'recuperarContrasena', email })
    })
    const data = await res.json()

    if(data.ok){
      succDiv.style.display = 'flex'
      document.getElementById('olvideEmail').value = ''
      document.getElementById('btnOlvide').style.display = 'none'
    } else {
      errorMsg.innerText = data.error || 'No encontramos ese email'
      errorDiv.style.display = 'flex'
    }
  } catch(e) {
    errorMsg.innerText = 'Error de conexión. Intentá de nuevo.'
    errorDiv.style.display = 'flex'
  }

  setBtnCargando('btnOlvide', false)
}

// ─────────────────────────────────────────────
// MOSTRAR/OCULTAR CONTRASEÑA
// ─────────────────────────────────────────────

function togglePass(inputId, btn){
  const input = document.getElementById(inputId)
  const icono = btn.querySelector('i')
  if(input.type === 'password'){
    input.type = 'text'
    icono.className = 'fa-regular fa-eye-slash'
  } else {
    input.type = 'password'
    icono.className = 'fa-regular fa-eye'
  }
}

// ─────────────────────────────────────────────
// INGRESAR
// ─────────────────────────────────────────────

async function ingresar(){
  const user = document.getElementById('loginUser').value.trim()
  const pass = document.getElementById('loginPass').value.trim()

  if(!user || !pass){
    mostrarError('loginError', 'loginErrorMsg', 'Completá usuario y contraseña')
    return
  }

  setBtnCargando('btnIngresar', true)
  ocultarErrores()

  try {
    const res  = await fetch(`${API}?action=login&u=${encodeURIComponent(user)}&p=${encodeURIComponent(pass)}`)
    const data = await res.json()

    if(data.ok){
      guardarSesion(data)
      if(data.rol === 'admin')          window.location.href = '../admin/index.html'
      else if(data.rol === 'ceramista') window.location.href = '../mi-taller/index.html'
      else                              window.location.href = '../mi-cuenta/index.html'
    } else {
      mostrarError('loginError', 'loginErrorMsg', data.error || 'Error al ingresar')
    }
  } catch(e) {
    mostrarError('loginError', 'loginErrorMsg', 'Error de conexión. Intentá de nuevo.')
  }

  setBtnCargando('btnIngresar', false)
}

// ─────────────────────────────────────────────
// REGISTRARSE
// ─────────────────────────────────────────────

async function registrarse(){
  const nombre = document.getElementById('regNombre').value.trim()
  const email  = document.getElementById('regEmail').value.trim()
  const pass   = document.getElementById('regPass').value.trim()
  const curso  = document.getElementById('regCurso').value

  if(!nombre || !email || !pass){
    mostrarError('regError', 'regErrorMsg', 'Completá todos los campos obligatorios')
    return
  }

  if(pass.length < 6){
    mostrarError('regError', 'regErrorMsg', 'La contraseña debe tener al menos 6 caracteres')
    return
  }

  setBtnCargando('btnRegistrarse', true)
  ocultarErrores()

  try {
    const res  = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'registro', nombre, email, pass, curso })
    })
    const data = await res.json()

    if(data.ok){
      document.getElementById('regSuccess').style.display = 'flex'
      document.getElementById('btnRegistrarse').style.display = 'none'
      document.getElementById('regNombre').value = ''
      document.getElementById('regEmail').value  = ''
      document.getElementById('regPass').value   = ''
    } else {
      mostrarError('regError', 'regErrorMsg', data.error || 'Error al registrarse')
    }
  } catch(e) {
    mostrarError('regError', 'regErrorMsg', 'Error de conexión. Intentá de nuevo.')
  }

  setBtnCargando('btnRegistrarse', false)
}

// ─────────────────────────────────────────────
// REGISTRARSE COMO CERAMISTA
// ─────────────────────────────────────────────

async function registrarseCeramista(){
  const nombre = document.getElementById('cerNombre').value.trim()
  const email  = document.getElementById('cerEmail').value.trim()
  const pass   = document.getElementById('cerPass').value.trim()

  if(!nombre || !email || !pass){
    mostrarError('cerError', 'cerErrorMsg', 'Completá nombre, email y contraseña')
    return
  }
  if(pass.length < 6){
    mostrarError('cerError', 'cerErrorMsg', 'La contraseña debe tener al menos 6 caracteres')
    return
  }

  // Recolectar intereses
  const checks = document.querySelectorAll('.interes-check input:checked')
  const intereses = checks.length > 0
    ? Array.from(checks).map(c => c.value).join(',')
    : 'todo'

  setBtnCargando('btnRegistrarseCeramista', true)
  ocultarErrores()

  try {
    const res  = await fetch(API, {
      method: 'POST',
      body: JSON.stringify({ action: 'registroCeramista', nombre, email, pass, intereses })
    })
    const data = await res.json()

    if(data.ok){
      document.getElementById('cerSuccess').style.display = 'flex'
      document.getElementById('btnRegistrarseCeramista').style.display = 'none'
      document.getElementById('cerNombre').value = ''
      document.getElementById('cerEmail').value  = ''
      document.getElementById('cerPass').value   = ''
    } else {
      mostrarError('cerError', 'cerErrorMsg', data.error || 'Error al registrarse')
    }
  } catch(e) {
    mostrarError('cerError', 'cerErrorMsg', 'Error de conexión. Intentá de nuevo.')
  }

  setBtnCargando('btnRegistrarseCeramista', false)
}

function guardarSesion(data){
  sessionStorage.setItem('yca_sesion', JSON.stringify({
    rol:         data.rol,
    token:       data.token,
    nombre:      data.nombre,
    id:          data.id || null,
    curso:       data.curso || '',
    cursoNombre: data.cursoNombre || data.curso || ''
  }))
}

function getSesion(){
  try {
    return JSON.parse(sessionStorage.getItem('yca_sesion'))
  } catch(e) {
    return null
  }
}

// ─────────────────────────────────────────────
// HELPERS UI
// ─────────────────────────────────────────────

function mostrarError(divId, spanId, msg){
  document.getElementById(spanId).innerText = msg
  document.getElementById(divId).style.display = 'flex'
}

function ocultarErrores(){
  document.getElementById('loginError').style.display    = 'none'
  document.getElementById('regError').style.display      = 'none'
  document.getElementById('regSuccess').style.display    = 'none'
  document.getElementById('olvideError').style.display   = 'none'
  document.getElementById('olvideSuccess').style.display = 'none'
  document.getElementById('cerError').style.display      = 'none'
  document.getElementById('cerSuccess').style.display    = 'none'
}

function setBtnCargando(id, cargando){
  const btn = document.getElementById(id)
  if(!btn) return
  btn.classList.toggle('cargando', cargando)
  const textos = {
    btnIngresar:              { on: 'Cargando...',  off: 'Ingresar' },
    btnRegistrarse:           { on: 'Cargando...',  off: 'Solicitar acceso' },
    btnOlvide:                { on: 'Enviando...',  off: 'Enviar contraseña temporal' },
    btnRegistrarseCeramista:  { on: 'Cargando...',  off: 'Crear cuenta gratis' }
  }
  const t = textos[id]
  if(t) btn.querySelector('span').innerText = cargando ? t.on : t.off
}

// Enter para enviar
document.addEventListener('keydown', e => {
  if(e.key !== 'Enter') return
  const formIngresarVisible = document.getElementById('formIngresar').style.display !== 'none'
  if(formIngresarVisible) ingresar()
  else registrarse()
})
