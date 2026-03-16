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
    if(sesion.rol === 'admin') window.location.href = '../admin/index.html'
    else                       window.location.href = '../mi-cuenta/index.html'
  }
  cargarCursosRegistro()
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
  const esIngresar = tab === 'ingresar'
  document.getElementById('tabIngresar').classList.toggle('activo',    esIngresar)
  document.getElementById('tabRegistrarse').classList.toggle('activo', !esIngresar)
  document.getElementById('formIngresar').style.display    = esIngresar ? 'flex' : 'none'
  document.getElementById('formRegistrarse').style.display = esIngresar ? 'none' : 'flex'
  ocultarErrores()
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
      if(data.rol === 'admin') window.location.href = '../admin/index.html'
      else                     window.location.href = '../mi-cuenta/index.html'
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
// SESIÓN
// ─────────────────────────────────────────────

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
  document.getElementById('loginError').style.display  = 'none'
  document.getElementById('regError').style.display    = 'none'
  document.getElementById('regSuccess').style.display  = 'none'
}

function setBtnCargando(id, cargando){
  const btn = document.getElementById(id)
  btn.classList.toggle('cargando', cargando)
  btn.querySelector('span').innerText = cargando ? 'Cargando...' : (id === 'btnIngresar' ? 'Ingresar' : 'Solicitar acceso')
}

// Enter para enviar
document.addEventListener('keydown', e => {
  if(e.key !== 'Enter') return
  const formIngresarVisible = document.getElementById('formIngresar').style.display !== 'none'
  if(formIngresarVisible) ingresar()
  else registrarse()
})
