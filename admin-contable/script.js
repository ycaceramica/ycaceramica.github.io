// ─────────────────────────────────────────────
// YCA CERÁMICA — ADMIN CONTABLE
// script.js
// ─────────────────────────────────────────────

var API = 'https://script.google.com/macros/s/AKfycbyaUdv0fMc9vDbZ_J94xLQeClB0xVd3KzXapx6B0-5aDYdyHKJBpydL59RaPbaESNtXfQ/exec'
var API_PRINCIPAL = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'

// ─────────────────────────────────────────────
// ESTADO GLOBAL
// ─────────────────────────────────────────────

var sesionContable  = null
var todosAlumnos    = []
var todosCursos     = []
var todasProfesoras = []
var todosPagos      = []

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
  // Dark mode
  if (localStorage.getItem('yca_dark') === 'true') {
    document.body.classList.add('dark')
    var btn = document.getElementById('btnDark')
    if (btn) btn.textContent = '☀️'
  }

  // Verificar sesión — viene del login principal con rol 'contable'
  try {
    var s = JSON.parse(sessionStorage.getItem('yca_sesion') || 'null')
    if (s && s.token && s.rol === 'contable') {
      sesionContable = s
      mostrarApp()
      return
    }
  } catch (e) {}

  // Sin sesión → redirigir al login
  window.location.href = '../login/index.html'
})

function mostrarApp () {
  document.getElementById('pantallaLogin').style.display = 'none'
  document.getElementById('appContable').style.display  = 'block'

  // Setear mes actual en el dashboard
  var hoy = new Date()
  var mes = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0')
  document.getElementById('mesDashboard').value = mes

  // Cargar datos iniciales
  cargarDashboard()
  cargarAlumnos()
  cargarCursos()
  cargarProfesoras()
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

// El login lo maneja login/script.js — acá solo cerramos sesión
function cerrarSesion () {
  sessionStorage.removeItem('yca_sesion')
  window.location.href = '../login/index.html'
}

// Pantalla de login propia (fallback si entran directo a la URL)
function toggleLoginPass () {
  var inp  = document.getElementById('loginPass')
  var icon = document.getElementById('loginOjoIcon')
  if (!inp) return
  if (inp.type === 'password') {
    inp.type  = 'text'
    icon.className = 'fa-solid fa-eye-slash'
  } else {
    inp.type  = 'password'
    icon.className = 'fa-solid fa-eye'
  }
}

async function doLogin () {
  var user = (document.getElementById('loginUser').value || '').trim()
  var pass = (document.getElementById('loginPass').value || '').trim()
  var err  = document.getElementById('loginError')
  var btn  = document.getElementById('loginBtn')

  if (!user || !pass) {
    err.textContent = 'Completá usuario y contraseña.'
    err.style.display = 'block'
    return
  }

  btn.disabled    = true
  btn.textContent = 'Ingresando...'
  err.style.display = 'none'

  try {
    var url  = API_PRINCIPAL + '?action=login&user=' + encodeURIComponent(user) + '&pass=' + encodeURIComponent(pass)
    var res  = await fetch(url)
    var data = await res.json()

    if (!data.ok || data.rol !== 'contable') {
      err.textContent   = 'Credenciales incorrectas o sin acceso al módulo contable.'
      err.style.display = 'block'
      return
    }

    sesionContable = data
    sessionStorage.setItem('yca_sesion', JSON.stringify(data))
    mostrarApp()

  } catch (e) {
    err.textContent   = 'Error de conexión. Intentá de nuevo.'
    err.style.display = 'block'
  } finally {
    btn.disabled    = false
    btn.innerHTML   = '<i class="fa-solid fa-right-to-bracket"></i> Ingresar'
  }
}

// Enter en login
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && document.getElementById('pantallaLogin').style.display !== 'none') {
    doLogin()
  }
})

// ─────────────────────────────────────────────
// NAVEGACIÓN
// ─────────────────────────────────────────────

var seccionActual = 'dashboard'

function setSeccion (nombre) {
  // Ocultar todas
  document.querySelectorAll('.cont-seccion').forEach(function (s) {
    s.style.display = 'none'
  })

  // Mostrar la pedida
  var sec = document.getElementById('seccion-' + nombre)
  if (sec) sec.style.display = 'block'

  // Nav activo
  document.querySelectorAll('.cont-nav-item').forEach(function (b) {
    b.classList.remove('activo')
  })
  var navBtn = document.getElementById('nav-' + nombre)
  if (navBtn) navBtn.classList.add('activo')

  seccionActual = nombre

  // Cerrar sidebar en móvil
  if (window.innerWidth < 768) {
    document.getElementById('contSidebar').classList.remove('abierto')
  }
}

function toggleSidebar () {
  var sb = document.getElementById('contSidebar')
  if (window.innerWidth < 768) {
    sb.classList.toggle('abierto')
  } else {
    sb.classList.toggle('cerrado')
    var main = document.querySelector('.cont-main')
    if (main) main.classList.toggle('sin-sidebar')
  }
}

function toggleDark () {
  document.body.classList.toggle('dark')
  var isDark = document.body.classList.contains('dark')
  localStorage.setItem('yca_dark', isDark)
  var btn = document.getElementById('btnDark')
  if (btn) btn.textContent = isDark ? '☀️' : '🌙'
}

// ─────────────────────────────────────────────
// TOAST / LOADING
// ─────────────────────────────────────────────

var _toastTimer = null

function toast (msg, tipo) {
  var el = document.getElementById('contToast')
  if (!el) return
  el.textContent = msg
  el.className   = 'cont-toast visible' + (tipo === 'err' ? ' err' : tipo === 'ok' ? ' ok' : '')
  clearTimeout(_toastTimer)
  _toastTimer = setTimeout(function () {
    el.className = 'cont-toast'
  }, 3000)
}

function showLoading (msg) {
  var el = document.getElementById('contLoading')
  var pm = document.getElementById('contLoadingMsg')
  if (el) el.style.display = 'flex'
  if (pm) pm.textContent   = msg || 'Cargando...'
}

function hideLoading () {
  var el = document.getElementById('contLoading')
  if (el) el.style.display = 'none'
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function get (action, params) {
  var url = API + '?action=' + action + '&token=' + encodeURIComponent(sesionContable.token)
  if (params) {
    Object.keys(params).forEach(function (k) {
      url += '&' + k + '=' + encodeURIComponent(params[k] || '')
    })
  }
  return fetch(url).then(function (r) { return r.json() })
}

function pesos (n) {
  return '$' + Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })
}

function cerrarModal (id) {
  var el = document.getElementById(id)
  if (el) el.style.display = 'none'
}

function abrirModal (id) {
  var el = document.getElementById(id)
  if (el) el.style.display = 'flex'
}

// Cerrar modales al click fuera
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('cont-modal-overlay')) {
    e.target.style.display = 'none'
  }
})

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

async function cargarDashboard () {
  var mes = document.getElementById('mesDashboard').value || ''

  try {
    var data = await get('getDashboard', { mes: mes })
    if (!data.ok) { toast('Error al cargar dashboard', 'err'); return }

    var d = data.data
    document.getElementById('dashIngresado').textContent = pesos(d.totalIngresado)
    document.getElementById('dashEgresos').textContent   = pesos(d.totalEgresos)
    document.getElementById('dashSaldo').textContent     = pesos(d.saldoYCA)
    document.getElementById('dashVencidos').textContent  = d.vencidos || '0'

    // Detalle por profesora
    var cont = document.getElementById('dashDetalleProfesoras')
    var egresos = d.egresos || {}
    var profs   = Object.keys(egresos)

    if (profs.length === 0) {
      cont.innerHTML = '<p style="color:var(--color-texto-sub);font-size:13px;padding:16px;">Sin movimientos este mes.</p>'
      return
    }

    cont.innerHTML = '<p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:var(--color-texto-sub);margin-bottom:12px;">Desglose por profesora</p>'
    profs.forEach(function (nombre) {
      var fila = document.createElement('div')
      fila.className = 'dash-prof-fila'
      fila.innerHTML = '<span class="dash-prof-nombre">' + nombre + '</span>' +
                       '<span class="dash-prof-monto">' + pesos(egresos[nombre]) + '</span>'
      cont.appendChild(fila)
    })

  } catch (e) {
    toast('Error de conexión', 'err')
  }
}

// ─────────────────────────────────────────────
// ALUMNOS
// ─────────────────────────────────────────────

async function cargarAlumnos () {
  try {
    // 1. Traer alumnos del sistema contable
    var dataContable = await get('getAlumnos')
    var alumnosContable = dataContable.ok ? (dataContable.data || []) : []

    // 2. Traer alumnos del GAS principal (los que ya están registrados en la web)
    var dataPrincipal = await fetch(API_PRINCIPAL + '?action=getUsuarios').then(function (r) { return r.json() }).catch(function () { return { ok: false } })
    var alumnosWeb = []
    if (dataPrincipal.ok && dataPrincipal.data) {
      // Solo los aprobados
      alumnosWeb = dataPrincipal.data.filter(function (u) {
        return u.estado === 'aprobado' || u.estado === 'activo'
      }).map(function (u) {
        return {
          CODIGO:    'WEB-' + (u.id || u.email),
          NOMBRE:    u.nombre || u.email,
          EMAIL:     u.email  || '',
          TELEFONO:  u.telefono || '',
          INSTAGRAM: u.instagram || '',
          ORIGEN:    'WEB'
        }
      })
    }

    // 3. Unir — los del contable primero, luego los de la web que no estén ya
    var codigosContable = alumnosContable.map(function (a) { return a.CODIGO })
    var emailsContable  = alumnosContable.map(function (a) { return (a.EMAIL + '').toLowerCase() })

    var webNuevos = alumnosWeb.filter(function (u) {
      return emailsContable.indexOf((u.EMAIL + '').toLowerCase()) === -1
    })

    todosAlumnos = alumnosContable.concat(webNuevos)
    renderAlumnos(todosAlumnos)

  } catch (e) {
    toast('Error al cargar alumnos', 'err')
  }
}

function renderAlumnos (lista) {
  var cont = document.getElementById('listaAlumnos')
  if (!cont) return

  if (lista.length === 0) {
    cont.innerHTML = '<div class="cont-vacio"><i class="fa-solid fa-user-graduate"></i><p>No hay alumnos todavía.</p></div>'
    return
  }

  cont.innerHTML = ''
  lista.forEach(function (a) {
    var card = document.createElement('div')
    card.className = 'cont-card'
    card.innerHTML =
      '<div class="cont-card-icon"><i class="fa-solid fa-user"></i></div>' +
      '<div class="cont-card-info">' +
        '<div class="cont-card-titulo">' + (a.NOMBRE || '—') + '</div>' +
        '<div class="cont-card-sub">' +
          (a.EMAIL || '') +
          (a.INSTAGRAM ? ' · ' + a.INSTAGRAM : '') +
        '</div>' +
      '</div>' +
      '<div class="cont-card-acc">' +
        '<span class="cont-codigo-badge">' + (a.CODIGO || '') + '</span>' +
        '<span class="cont-badge ' + (a.ORIGEN === 'WEB' ? 'cont-badge-verde' : 'cont-badge-gris') + '">' +
          (a.ORIGEN === 'WEB' ? 'Web' : 'Manual') +
        '</span>' +
        '<button class="cont-btn-ico" onclick="verPagosAlumno(\'' + (a.CODIGO || '') + '\',\'' + (a.NOMBRE || '') + '\')" title="Ver pagos">' +
          '<i class="fa-solid fa-money-bill-wave"></i>' +
        '</button>' +
      '</div>'
    cont.appendChild(card)
  })
}

function filtrarAlumnos (q) {
  q = (q || '').toLowerCase().trim()
  if (!q) { renderAlumnos(todosAlumnos); return }
  var filtrados = todosAlumnos.filter(function (a) {
    return (a.NOMBRE + '').toLowerCase().indexOf(q) > -1 ||
           (a.CODIGO + '').toLowerCase().indexOf(q) > -1 ||
           (a.EMAIL  + '').toLowerCase().indexOf(q) > -1
  })
  renderAlumnos(filtrados)
}

function abrirModalAlumno () {
  document.getElementById('mAluNombre').value   = ''
  document.getElementById('mAluTel').value      = ''
  document.getElementById('mAluEmail').value    = ''
  document.getElementById('mAluIg').value       = ''
  document.getElementById('modalAlumnoTitulo').textContent = 'Nuevo alumno'
  abrirModal('modalAlumno')
  setTimeout(function () { document.getElementById('mAluNombre').focus() }, 100)
}

async function guardarAlumno () {
  var nombre = document.getElementById('mAluNombre').value.trim()
  if (!nombre) { toast('El nombre es obligatorio', 'err'); return }

  showLoading('Guardando alumno...')
  try {
    var data = await get('addAlumno', {
      nombre:    nombre,
      telefono:  document.getElementById('mAluTel').value.trim(),
      email:     document.getElementById('mAluEmail').value.trim(),
      instagram: document.getElementById('mAluIg').value.trim(),
      origen:    'MANUAL'
    })

    if (!data.ok) { toast('Error: ' + (data.error || ''), 'err'); return }

    toast('Alumno guardado — ' + data.codigo, 'ok')
    cerrarModal('modalAlumno')
    await cargarAlumnos()

  } catch (e) {
    toast('Error de conexión', 'err')
  } finally {
    hideLoading()
  }
}

function verPagosAlumno (codigo, nombre) {
  setSeccion('pagos')
  // Pre-filtrar pagos por este alumno
  setTimeout(function () {
    cargarPagos(codigo)
  }, 100)
}

// ─────────────────────────────────────────────
// CURSOS
// ─────────────────────────────────────────────

async function cargarCursos () {
  try {
    var data = await get('getCursos')
    if (!data.ok) return
    todosCursos = data.data || []
    renderCursos(todosCursos)
    poblarSelectCursos()
  } catch (e) {}
}

function renderCursos (lista) {
  var cont = document.getElementById('listaCursos')
  if (!cont) return

  if (lista.length === 0) {
    cont.innerHTML = '<div class="cont-vacio"><i class="fa-solid fa-chalkboard-teacher"></i><p>No hay cursos cargados.</p></div>'
    return
  }

  cont.innerHTML = ''
  lista.forEach(function (c) {
    var activo = c.ACTIVO === true || c.ACTIVO === 'TRUE' || c.ACTIVO === 'true'
    var card   = document.createElement('div')
    card.className = 'cont-card'
    card.innerHTML =
      '<div class="cont-card-icon"><i class="fa-solid fa-chalkboard-teacher"></i></div>' +
      '<div class="cont-card-info">' +
        '<div class="cont-card-titulo">' + (c.NOMBRE || '—') + '</div>' +
        '<div class="cont-card-sub">' +
          (c.PROFESORA || '') + ' · ' + (c.MODALIDAD || '') +
          ' · ' + pesos(c.VALOR) +
          ' · Arcilla: ' + (c.ARCILLA_KG || 0) + 'kg · Barbotina: ' + (c.BARBOTINA_ML || 0) + 'ml' +
        '</div>' +
      '</div>' +
      '<div class="cont-card-acc">' +
        '<span class="cont-badge ' + (activo ? 'cont-badge-verde' : 'cont-badge-gris') + '">' +
          (activo ? 'Activo' : 'Inactivo') +
        '</span>' +
        '<button class="cont-btn-ico" onclick="editarCurso(' + JSON.stringify(c).replace(/"/g, '&quot;') + ')" title="Editar">' +
          '<i class="fa-solid fa-pen"></i>' +
        '</button>' +
        '<button class="cont-btn-ico" onclick="toggleCurso(\'' + c.ID + '\')" title="Activar/Desactivar">' +
          '<i class="fa-solid fa-power-off"></i>' +
        '</button>' +
      '</div>'
    cont.appendChild(card)
  })
}

function poblarSelectCursos () {
  var selects = ['mPagoCurso', 'mConCurso']
  selects.forEach(function (id) {
    var sel = document.getElementById(id)
    if (!sel) return
    var val = sel.value
    sel.innerHTML = '<option value="">Seleccioná un curso...</option>'
    todosCursos.filter(function (c) {
      return c.ACTIVO === true || c.ACTIVO === 'TRUE' || c.ACTIVO === 'true'
    }).forEach(function (c) {
      var opt = document.createElement('option')
      opt.value       = c.NOMBRE
      opt.textContent = c.NOMBRE + ' — ' + pesos(c.VALOR)
      sel.appendChild(opt)
    })
    if (val) sel.value = val
  })
}

function poblarSelectProfesoras () {
  var sel = document.getElementById('mCurProfesora')
  if (!sel) return
  var val = sel.value
  sel.innerHTML = '<option value="">Seleccioná una profesora...</option>'
  todasProfesoras.filter(function (p) {
    return p.ACTIVO === true || p.ACTIVO === 'TRUE' || p.ACTIVO === 'true'
  }).forEach(function (p) {
    var opt = document.createElement('option')
    opt.value       = p.NOMBRE
    opt.textContent = p.NOMBRE + ' (' + p.PORCENTAJE + '%)'
    sel.appendChild(opt)
  })
  if (val) sel.value = val
}

function abrirModalCurso () {
  document.getElementById('mCurNombre').value     = ''
  document.getElementById('mCurProfesora').value  = ''
  document.getElementById('mCurModalidad').value  = 'MENSUAL'
  document.getElementById('mCurValor').value      = ''
  document.getElementById('mCurArcilla').value    = ''
  document.getElementById('mCurBarbotina').value  = ''
  document.getElementById('mCurId').value         = ''
  document.getElementById('modalCursoTitulo').textContent = 'Nuevo curso'
  poblarSelectProfesoras()
  abrirModal('modalCurso')
}

function editarCurso (c) {
  document.getElementById('mCurNombre').value     = c.NOMBRE     || ''
  document.getElementById('mCurModalidad').value  = c.MODALIDAD  || 'MENSUAL'
  document.getElementById('mCurValor').value      = c.VALOR      || ''
  document.getElementById('mCurArcilla').value    = c.ARCILLA_KG || ''
  document.getElementById('mCurBarbotina').value  = c.BARBOTINA_ML || ''
  document.getElementById('mCurId').value         = c.ID         || ''
  document.getElementById('modalCursoTitulo').textContent = 'Editar curso'
  poblarSelectProfesoras()
  setTimeout(function () {
    document.getElementById('mCurProfesora').value = c.PROFESORA || ''
  }, 50)
  abrirModal('modalCurso')
}

async function guardarCurso () {
  var nombre = document.getElementById('mCurNombre').value.trim()
  var prof   = document.getElementById('mCurProfesora').value.trim()
  if (!nombre || !prof) { toast('Nombre y profesora son obligatorios', 'err'); return }

  var id = document.getElementById('mCurId').value.trim()
  var action = id ? 'editCurso' : 'addCurso'

  showLoading('Guardando curso...')
  try {
    var data = await get(action, {
      id:           id,
      nombre:       nombre,
      profesora:    prof,
      modalidad:    document.getElementById('mCurModalidad').value,
      valor:        document.getElementById('mCurValor').value,
      arcilla_kg:   document.getElementById('mCurArcilla').value,
      barbotina_ml: document.getElementById('mCurBarbotina').value
    })

    if (!data.ok) { toast('Error: ' + (data.error || ''), 'err'); return }

    toast('Curso guardado', 'ok')
    cerrarModal('modalCurso')
    await cargarCursos()

  } catch (e) {
    toast('Error de conexión', 'err')
  } finally {
    hideLoading()
  }
}

async function toggleCurso (id) {
  try {
    await get('toggleCurso', { id: id })
    await cargarCursos()
  } catch (e) {
    toast('Error', 'err')
  }
}

// ─────────────────────────────────────────────
// PROFESORAS
// ─────────────────────────────────────────────

async function cargarProfesoras () {
  try {
    var data = await get('getProfesoras')
    if (!data.ok) return
    todasProfesoras = data.data || []
    renderProfesoras(todasProfesoras)
  } catch (e) {}
}

function renderProfesoras (lista) {
  var cont = document.getElementById('listaProfesoras')
  if (!cont) return

  if (lista.length === 0) {
    cont.innerHTML = '<div class="cont-vacio"><i class="fa-solid fa-person-chalkboard"></i><p>No hay profesoras cargadas.</p></div>'
    return
  }

  cont.innerHTML = ''
  lista.forEach(function (p) {
    var activo = p.ACTIVO === true || p.ACTIVO === 'TRUE' || p.ACTIVO === 'true'
    var card   = document.createElement('div')
    card.className = 'cont-card'
    card.innerHTML =
      '<div class="cont-card-icon"><i class="fa-solid fa-person-chalkboard"></i></div>' +
      '<div class="cont-card-info">' +
        '<div class="cont-card-titulo">' + (p.NOMBRE || '—') + '</div>' +
        '<div class="cont-card-sub">Porcentaje por alumno: <strong>' + (p.PORCENTAJE || 0) + '%</strong></div>' +
      '</div>' +
      '<div class="cont-card-acc">' +
        '<span class="cont-badge ' + (activo ? 'cont-badge-verde' : 'cont-badge-gris') + '">' +
          (activo ? 'Activa' : 'Inactiva') +
        '</span>' +
        '<button class="cont-btn-ico" onclick="editarProfesora(' + JSON.stringify(p).replace(/"/g, '&quot;') + ')" title="Editar">' +
          '<i class="fa-solid fa-pen"></i>' +
        '</button>' +
      '</div>'
    cont.appendChild(card)
  })
}

function abrirModalProfesora () {
  document.getElementById('mProNombre').value      = ''
  document.getElementById('mProPorcentaje').value  = ''
  document.getElementById('mProId').value          = ''
  document.getElementById('modalProfesoraTitulo').textContent = 'Nueva profesora'
  abrirModal('modalProfesora')
}

function editarProfesora (p) {
  document.getElementById('mProNombre').value      = p.NOMBRE      || ''
  document.getElementById('mProPorcentaje').value  = p.PORCENTAJE  || ''
  document.getElementById('mProId').value          = p.ID          || ''
  document.getElementById('modalProfesoraTitulo').textContent = 'Editar profesora'
  abrirModal('modalProfesora')
}

async function guardarProfesora () {
  var nombre = document.getElementById('mProNombre').value.trim()
  if (!nombre) { toast('El nombre es obligatorio', 'err'); return }

  var id     = document.getElementById('mProId').value.trim()
  var action = id ? 'editProfesora' : 'addProfesora'

  showLoading('Guardando...')
  try {
    var data = await get(action, {
      id:          id,
      nombre:      nombre,
      porcentaje:  document.getElementById('mProPorcentaje').value
    })

    if (!data.ok) { toast('Error: ' + (data.error || ''), 'err'); return }

    toast('Profesora guardada', 'ok')
    cerrarModal('modalProfesora')
    await cargarProfesoras()

  } catch (e) {
    toast('Error de conexión', 'err')
  } finally {
    hideLoading()
  }
}

// ─────────────────────────────────────────────
// PAGOS
// ─────────────────────────────────────────────

var filtroPagoActual = 'todos'
var codigoAlumnoFiltro = null

async function cargarPagos (codigoFiltro) {
  codigoAlumnoFiltro = codigoFiltro || null
  try {
    var params = {}
    if (codigoAlumnoFiltro) params.codigo = codigoAlumnoFiltro
    var data = await get('getPagos', params)
    if (!data.ok) { toast('Error al cargar pagos', 'err'); return }
    todosPagos = data.data || []
    renderPagos(todosPagos, filtroPagoActual)
  } catch (e) {
    toast('Error de conexión', 'err')
  }
}

function renderPagos (lista, filtro) {
  var cont = document.getElementById('listaPagos')
  if (!cont) return

  var filtrados = filtro === 'todos' ? lista : lista.filter(function (p) {
    return p.ESTADO === filtro
  })

  if (filtrados.length === 0) {
    cont.innerHTML = '<div class="cont-vacio"><i class="fa-solid fa-money-bill-wave"></i><p>No hay pagos en esta categoría.</p></div>'
    return
  }

  cont.innerHTML = ''
  filtrados.forEach(function (p) {
    var estadoClass = p.ESTADO === 'AL DIA' ? 'cont-badge-verde' :
                      p.ESTADO === 'VENCIDO' ? 'cont-badge-rojo' : 'cont-badge-gris'

    var card = document.createElement('div')
    card.className = 'cont-card'
    card.innerHTML =
      '<div class="cont-card-icon"><i class="fa-solid fa-money-bill-wave"></i></div>' +
      '<div class="cont-card-info">' +
        '<div class="cont-card-titulo">' + (p.NOMBRE_ALUMNO || '—') + ' — ' + (p.CURSO || '') + '</div>' +
        '<div class="cont-card-sub">' +
          (p.FECHA_PAGO || '') +
          (p.VENCIMIENTO && p.VENCIMIENTO !== '-' ? ' · Vence: ' + p.VENCIMIENTO : '') +
          ' · ' + (p.METODO || '') +
          (p.NOTAS ? ' · ' + p.NOTAS : '') +
        '</div>' +
      '</div>' +
      '<div class="cont-card-acc">' +
        '<strong style="color:var(--color-primario);font-size:15px;">' + pesos(p.MONTO) + '</strong>' +
        '<span class="cont-badge ' + estadoClass + '">' + (p.ESTADO || '') + '</span>' +
        (p.COMPROBANTE_URL ? '<a href="' + p.COMPROBANTE_URL + '" target="_blank" class="cont-btn-ico" title="Ver comprobante"><i class="fa-solid fa-file"></i></a>' : '') +
        '<span class="cont-codigo-badge">' + (p.CODIGO_ALUMNO || '') + '</span>' +
      '</div>'
    cont.appendChild(card)
  })
}

function filtrarPagos (estado, btn) {
  filtroPagoActual = estado
  document.querySelectorAll('#filtrosPagos .cont-filtro').forEach(function (b) {
    b.classList.remove('activo')
  })
  if (btn) btn.classList.add('activo')
  renderPagos(todosPagos, estado)
}

function abrirModalPago () {
  document.getElementById('mPagoBuscador').value    = ''
  document.getElementById('mPagoCodigo').value      = ''
  document.getElementById('mPagoMonto').value       = ''
  document.getElementById('mPagoNotas').value       = ''
  document.getElementById('mPagoComprobante').value = ''
  document.getElementById('mPagoAlumnoSel').style.display = 'none'
  document.getElementById('mPagoResultados').classList.remove('visible')
  poblarSelectCursos()
  abrirModal('modalPago')
}

// Autocomplete de alumnos en modal pago
function buscarAlumnoModal (q) {
  var cont = document.getElementById('mPagoResultados')
  q = (q || '').toLowerCase().trim()

  if (!q) { cont.classList.remove('visible'); return }

  var filtrados = todosAlumnos.filter(function (a) {
    return (a.NOMBRE + '').toLowerCase().indexOf(q) > -1 ||
           (a.CODIGO + '').toLowerCase().indexOf(q) > -1
  }).slice(0, 6)

  if (filtrados.length === 0) { cont.classList.remove('visible'); return }

  cont.innerHTML = ''
  filtrados.forEach(function (a) {
    var item = document.createElement('div')
    item.className = 'cont-autocomplete-item'
    item.innerHTML = '<span>' + a.NOMBRE + '</span><span class="cont-codigo-badge">' + a.CODIGO + '</span>'
    item.onclick   = function () { seleccionarAlumnoPago(a) }
    cont.appendChild(item)
  })
  cont.classList.add('visible')
}

function seleccionarAlumnoPago (a) {
  document.getElementById('mPagoCodigo').value          = a.CODIGO
  document.getElementById('mPagoBuscador').value        = a.NOMBRE
  document.getElementById('mPagoAlumnoNombre').textContent = a.NOMBRE
  document.getElementById('mPagoAlumnoCod').textContent    = a.CODIGO
  document.getElementById('mPagoAlumnoSel').style.display  = 'block'
  document.getElementById('mPagoResultados').classList.remove('visible')
}

async function guardarPago () {
  var codigo = document.getElementById('mPagoCodigo').value.trim()
  var curso  = document.getElementById('mPagoCurso').value.trim()
  var monto  = document.getElementById('mPagoMonto').value.trim()

  if (!codigo) { toast('Seleccioná un alumno', 'err'); return }
  if (!curso)  { toast('Seleccioná un curso', 'err'); return }
  if (!monto)  { toast('Ingresá el monto', 'err'); return }

  showLoading('Registrando pago...')
  try {
    var data = await get('addPago', {
      codigo_alumno:   codigo,
      curso:           curso,
      monto:           monto,
      metodo:          document.getElementById('mPagoMetodo').value,
      comprobante_url: document.getElementById('mPagoComprobante').value.trim(),
      notas:           document.getElementById('mPagoNotas').value.trim()
    })

    if (!data.ok) { toast('Error: ' + (data.error || ''), 'err'); return }

    toast('Pago registrado' + (data.vencimiento && data.vencimiento !== '-' ? ' · Vence: ' + data.vencimiento : ''), 'ok')
    cerrarModal('modalPago')
    await cargarPagos(codigoAlumnoFiltro)
    cargarDashboard()

  } catch (e) {
    toast('Error de conexión', 'err')
  } finally {
    hideLoading()
  }
}

// ─────────────────────────────────────────────
// CONTRATOS
// ─────────────────────────────────────────────

async function cargarContratos () {
  try {
    var data = await get('getContratos')
    if (!data.ok) { toast('Error al cargar contratos', 'err'); return }
    renderContratos(data.data || [])
  } catch (e) {
    toast('Error de conexión', 'err')
  }
}

function renderContratos (lista) {
  var cont = document.getElementById('listaContratos')
  if (!cont) return

  if (lista.length === 0) {
    cont.innerHTML = '<div class="cont-vacio"><i class="fa-solid fa-file-signature"></i><p>No hay contratos generados todavía.</p></div>'
    return
  }

  cont.innerHTML = ''
  lista.forEach(function (c) {
    var card = document.createElement('div')
    card.className = 'cont-card'
    card.innerHTML =
      '<div class="cont-card-icon"><i class="fa-solid fa-file-signature"></i></div>' +
      '<div class="cont-card-info">' +
        '<div class="cont-card-titulo">' + (c.NOMBRE_ALUMNO || '—') + ' — ' + (c.CURSO || '') + '</div>' +
        '<div class="cont-card-sub">' +
          'Inicio: ' + (c.FECHA_INICIO || '') +
          ' · Arcilla: ' + (c.ARCILLA_KG || 0) + 'kg' +
          ' · Barbotina: ' + (c.BARBOTINA_ML || 0) + 'ml' +
        '</div>' +
      '</div>' +
      '<div class="cont-card-acc">' +
        '<span class="cont-codigo-badge">' + (c.CODIGO_ALUMNO || '') + '</span>' +
        (c.PDF_CLIENTE_URL ? '<a href="' + c.PDF_CLIENTE_URL + '" target="_blank" class="cont-btn-ico" title="PDF Cliente"><i class="fa-solid fa-user"></i></a>' : '') +
        (c.PDF_YCA_URL     ? '<a href="' + c.PDF_YCA_URL     + '" target="_blank" class="cont-btn-ico" title="PDF YCA"><i class="fa-solid fa-building"></i></a>' : '') +
      '</div>'
    cont.appendChild(card)
  })
}

function abrirModalContrato () {
  document.getElementById('mConBuscador').value   = ''
  document.getElementById('mConCodigo').value     = ''
  document.getElementById('mConArcilla').value    = ''
  document.getElementById('mConBarbotina').value  = ''
  document.getElementById('mConAlumnoSel').style.display = 'none'
  document.getElementById('mConResultados').classList.remove('visible')
  poblarSelectCursos()
  abrirModal('modalContrato')
}

// Autocomplete de alumnos en modal contrato
function buscarAlumnoModal2 (q) {
  var cont = document.getElementById('mConResultados')
  q = (q || '').toLowerCase().trim()

  if (!q) { cont.classList.remove('visible'); return }

  var filtrados = todosAlumnos.filter(function (a) {
    return (a.NOMBRE + '').toLowerCase().indexOf(q) > -1 ||
           (a.CODIGO + '').toLowerCase().indexOf(q) > -1
  }).slice(0, 6)

  if (filtrados.length === 0) { cont.classList.remove('visible'); return }

  cont.innerHTML = ''
  filtrados.forEach(function (a) {
    var item = document.createElement('div')
    item.className = 'cont-autocomplete-item'
    item.innerHTML = '<span>' + a.NOMBRE + '</span><span class="cont-codigo-badge">' + a.CODIGO + '</span>'
    item.onclick   = function () { seleccionarAlumnoContrato(a) }
    cont.appendChild(item)
  })
  cont.classList.add('visible')
}

function seleccionarAlumnoContrato (a) {
  document.getElementById('mConCodigo').value           = a.CODIGO
  document.getElementById('mConBuscador').value         = a.NOMBRE
  document.getElementById('mConAlumnoNombre').textContent  = a.NOMBRE
  document.getElementById('mConAlumnoCod').textContent     = a.CODIGO
  document.getElementById('mConAlumnoSel').style.display   = 'block'
  document.getElementById('mConResultados').classList.remove('visible')
}

function autocompletarContrato () {
  var nombreCurso = document.getElementById('mConCurso').value
  var curso = todosCursos.find(function (c) { return c.NOMBRE === nombreCurso })
  if (!curso) return
  if (curso.ARCILLA_KG)   document.getElementById('mConArcilla').value   = curso.ARCILLA_KG
  if (curso.BARBOTINA_ML) document.getElementById('mConBarbotina').value = curso.BARBOTINA_ML
}

async function generarContrato () {
  var codigo = document.getElementById('mConCodigo').value.trim()
  var curso  = document.getElementById('mConCurso').value.trim()

  if (!codigo) { toast('Seleccioná un alumno', 'err'); return }
  if (!curso)  { toast('Seleccioná un curso', 'err'); return }

  var btn = document.getElementById('btnGenerarContrato')
  btn.disabled    = true
  btn.innerHTML   = '<i class="fa-solid fa-spinner fa-spin"></i> Generando PDFs...'
  showLoading('Generando contrato y PDFs... esto puede tardar unos segundos.')

  try {
    var data = await get('generarContrato', {
      codigo_alumno: codigo,
      curso:         curso,
      arcilla_kg:    document.getElementById('mConArcilla').value,
      barbotina_ml:  document.getElementById('mConBarbotina').value
    })

    if (!data.ok) { toast('Error: ' + (data.error || ''), 'err'); return }

    toast('Contrato generado', 'ok')
    cerrarModal('modalContrato')

    // Abrir los PDFs automáticamente
    if (data.pdfCliente) window.open(data.pdfCliente, '_blank')
    if (data.pdfYCA)     window.open(data.pdfYCA,     '_blank')

    await cargarContratos()

  } catch (e) {
    toast('Error de conexión', 'err')
  } finally {
    hideLoading()
    btn.disabled  = false
    btn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> Generar PDFs'
  }
}

// ─────────────────────────────────────────────
// BUSCADOR GLOBAL (topbar)
// ─────────────────────────────────────────────

var _busqTimer = null

function buscarGlobal (q) {
  clearTimeout(_busqTimer)
  q = (q || '').trim()

  if (!q) { cerrarBusqueda(); return }

  _busqTimer = setTimeout(function () {
    var filtrados = todosAlumnos.filter(function (a) {
      return (a.NOMBRE + '').toLowerCase().indexOf(q.toLowerCase()) > -1 ||
             (a.CODIGO + '').toLowerCase().indexOf(q.toLowerCase()) > -1
    })

    // Mostrar sección busqueda
    document.querySelectorAll('.cont-seccion').forEach(function (s) { s.style.display = 'none' })
    var sec = document.getElementById('seccion-busqueda')
    if (sec) sec.style.display = 'block'

    var cont = document.getElementById('resultadosBusqueda')
    if (!cont) return

    if (filtrados.length === 0) {
      cont.innerHTML = '<div class="cont-vacio"><i class="fa-solid fa-magnifying-glass"></i><p>No se encontraron resultados para "' + q + '"</p></div>'
      return
    }

    cont.innerHTML = ''
    filtrados.forEach(function (a) {
      var card = document.createElement('div')
      card.className = 'cont-card'
      card.style.cursor = 'pointer'
      card.innerHTML =
        '<div class="cont-card-icon"><i class="fa-solid fa-user"></i></div>' +
        '<div class="cont-card-info">' +
          '<div class="cont-card-titulo">' + (a.NOMBRE || '—') + '</div>' +
          '<div class="cont-card-sub">' + (a.EMAIL || '') + (a.INSTAGRAM ? ' · ' + a.INSTAGRAM : '') + '</div>' +
        '</div>' +
        '<div class="cont-card-acc">' +
          '<span class="cont-codigo-badge">' + (a.CODIGO || '') + '</span>' +
          '<button class="cont-btn-ico" onclick="verPagosAlumno(\'' + a.CODIGO + '\',\'' + a.NOMBRE + '\')" title="Ver pagos">' +
            '<i class="fa-solid fa-money-bill-wave"></i>' +
          '</button>' +
        '</div>'
      cont.appendChild(card)
    })
  }, 300)
}

function cerrarBusqueda () {
  document.getElementById('buscadorGlobal').value = ''
  document.getElementById('seccion-busqueda').style.display = 'none'
  setSeccion(seccionActual)
}

// ─────────────────────────────────────────────
// CARGAR CONTRATOS AL ENTRAR A LA SECCIÓN
// ─────────────────────────────────────────────

var _contratosCache = false

var _setSeccionOriginal = setSeccion
setSeccion = function (nombre) {
  _setSeccionOriginal(nombre)
  if (nombre === 'contratos' && !_contratosCache) {
    _contratosCache = true
    cargarContratos()
  }
  if (nombre === 'pagos' && !codigoAlumnoFiltro) {
    cargarPagos()
  }
}
