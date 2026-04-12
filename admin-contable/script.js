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
var todosGastos     = []

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

function post (action, params) {
  var body = Object.assign({}, params, { action: action, token: sesionContable.token })
  return fetch(API, { method: 'POST', body: JSON.stringify(body) }).then(function (r) { return r.json() })
}

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

function abrirDesgloseDash (tipo) {
  var d = window._dashData
  if (!d) return

  var titulo, items
  if (tipo === 'pagos') {
    titulo = 'Total ingresado — Detalle de pagos'
    var pagos = d.pagos || []
    if (!pagos.length) { toast('Sin pagos este mes', 'err'); return }
    items = pagos.map(function(p) {
      return '<div class="ddash-item">' +
        '<div class="ddash-info"><strong>' + (p.NOMBRE_ALUMNO||'—') + '</strong><span>' + (p.CURSO||'') + ' · ' + (p.FECHA_PAGO||'') + ' · ' + (p.METODO||'') + '</span></div>' +
        '<span class="ddash-monto">+ ' + pesos(p.MONTO) + '</span>' +
      '</div>'
    }).join('')
  } else if (tipo === 'profesoras') {
    titulo = 'A profesoras — Gastos'
    var profs = (d.gastosDetalle || []).filter(function(g){ return (g.TIPO+'').toLowerCase() === 'profesora' })
    if (!profs.length) { toast('Sin gastos a profesoras este mes', 'err'); return }
    items = profs.map(function(g) {
      return '<div class="ddash-item">' +
        '<div class="ddash-info"><strong>' + (g.DESCRIPCION||'—') + '</strong><span>' + _fechaDisplay(g.FECHA) + ' · ' + (g.METODO||'') + '</span></div>' +
        '<span class="ddash-monto ddash-monto--neg">— ' + pesos(g.MONTO) + '</span>' +
      '</div>'
    }).join('')
  } else if (tipo === 'gastos') {
    titulo = 'Gastos directos — Detalle'
    var gastosAll = d.gastosDetalle || []
    if (!gastosAll.length) { toast('Sin gastos este mes', 'err'); return }
    items = gastosAll.map(function(g) {
      return '<div class="ddash-item">' +
        '<div class="ddash-info"><strong>' + (g.DESCRIPCION||'—') + '</strong><span>' + _fechaDisplay(g.FECHA) + ' · ' + (g.TIPO||'') + ' · ' + (g.METODO||'') + '</span></div>' +
        '<span class="ddash-monto ddash-monto--neg">— ' + pesos(g.MONTO) + '</span>' +
      '</div>'
    }).join('')
  } else {
    titulo = 'Saldo YCA — Todos los movimientos'
    var todos = []
    ;(d.pagos || []).forEach(function(p) {
      todos.push({ tipo: 'ingreso', desc: (p.NOMBRE_ALUMNO||'—') + ' — ' + (p.CURSO||''), fecha: p.FECHA_PAGO||'', metodo: p.METODO||'', monto: parseFloat(p.MONTO)||0 })
    })
    ;(d.gastosDetalle || []).forEach(function(g) {
      todos.push({ tipo: 'gasto', desc: g.DESCRIPCION||'—', fecha: _fechaDisplay(g.FECHA), metodo: (g.TIPO||'') + ' · ' + (g.METODO||''), monto: parseFloat(g.MONTO)||0 })
    })
    todos.sort(function(a,b){ return a.fecha > b.fecha ? 1 : -1 })
    if (!todos.length) { toast('Sin movimientos este mes', 'err'); return }
    items = todos.map(function(m) {
      var esIngreso = m.tipo === 'ingreso'
      return '<div class="ddash-item">' +
        '<div class="ddash-info">' +
          '<strong>' + m.desc + '</strong>' +
          '<span>' + m.fecha + ' · ' + m.metodo + '</span>' +
        '</div>' +
        '<span class="ddash-monto ' + (esIngreso ? '' : 'ddash-monto--neg') + '">' +
          (esIngreso ? '+ ' : '— ') + pesos(m.monto) +
        '</span>' +
      '</div>'
    }).join('')
  }

  var existente = document.getElementById('_modalDashOverlay')
  if (existente) existente.remove()
  var overlay = document.createElement('div')
  overlay.id        = '_modalDashOverlay'
  overlay.className = 'cont-modal-overlay'
  overlay.innerHTML =
    '<div class="cont-modal cont-modal--dash" style="max-width:500px;width:95%">' +
      '<div class="cont-modal-header">' +
        '<h3>' + titulo + '</h3>' +
        '<button id="_dashModalClose"><i class="fa-solid fa-xmark"></i></button>' +
      '</div>' +
      '<div class="cont-modal-body ddash-lista">' + items + '</div>' +
    '</div>'
  document.body.appendChild(overlay)
  overlay.style.display = 'flex'
  document.getElementById('_dashModalClose').onclick = function () { overlay.remove() }
}

function confirmarCerrarMes () {
  var mes = document.getElementById('mesDashboard').value
  if (!mes) { toast('Seleccioná un mes primero', 'err'); return }
  var partes = mes.split('-')
  var label  = partes[1] + '/' + partes[0]

  var overlay = document.createElement('div')
  overlay.id        = '_modalCerrarMesOverlay'
  overlay.className = 'cont-modal-overlay'
  overlay.innerHTML =
    '<div class="cont-modal" style="max-width:440px">' +
      '<div class="cont-modal-header"><h3>Cerrar mes ' + label + '</h3></div>' +
      '<div class="cont-modal-body">' +
        '<p style="font-size:14px;line-height:1.7;">Esto va a:</p>' +
        '<ul style="font-size:13px;line-height:2;padding-left:18px;">' +
          '<li>Generar un PDF resumen del mes</li>' +
          '<li>Guardarlo en Drive bajo <strong>Resumen/' + label + '</strong></li>' +
          '<li>Eliminar los pagos y gastos del mes del Sheets</li>' +
        '</ul>' +
        '<p style="font-size:13px;color:var(--color-rojo,#c0392b);margin-top:8px;font-weight:600;">Esta acción no se puede deshacer.</p>' +
      '</div>' +
      '<div class="cont-modal-footer">' +
        '<button class="cont-btn-sec" id="_cerrarMesCancelar">Cancelar</button>' +
        '<button class="cont-btn-pri" id="_cerrarMesOk" style="background:var(--color-primario)">' +
          '<i class="fa-solid fa-box-archive"></i> Confirmar y cerrar mes' +
        '</button>' +
      '</div>' +
    '</div>'
  document.body.appendChild(overlay)
  overlay.style.display = 'flex'
  document.getElementById('_cerrarMesCancelar').onclick = function () { overlay.remove() }
  document.getElementById('_cerrarMesOk').onclick = async function () {
    overlay.remove()
    await cerrarMes(mes)
  }
}

async function cerrarMes (mes) {
  showLoading('Generando resumen y cerrando mes...')
  try {
    var data = await get('cerrarMes', { mes: mes, token: sesionContable.token })
    if (!data.ok) { toast('Error: ' + (data.error || ''), 'err'); return }
    toast('Mes cerrado. PDF guardado en Drive.', 'ok')
    if (data.pdf_url) {
      setTimeout(function () { window.open(data.pdf_url, '_blank') }, 800)
    }
    await actualizarDatos()
  } catch (e) {
    toast('Error de conexión', 'err')
  } finally {
    hideLoading()
  }
}

async function actualizarDatos () {
  var btn = document.getElementById('btnActualizar')
  if (btn) { btn.style.opacity = '0.4'; btn.style.pointerEvents = 'none' }
  try {
    await Promise.all([
      cargarDashboard(),
      cargarAlumnos(),
      cargarCursos(),
      cargarProfesoras()
    ])
    toast('Datos actualizados', 'ok')
  } catch(e) {
    toast('Error al actualizar', 'err')
  } finally {
    if (btn) { btn.style.opacity = ''; btn.style.pointerEvents = '' }
  }
}

async function cargarDashboard () {
  var mes = document.getElementById('mesDashboard').value || ''

  try {
    var data = await get('getDashboard', { mes: mes })
    if (!data.ok) { toast('Error al cargar dashboard', 'err'); return }

    var d = data.data
    document.getElementById('dashIngresado').textContent = pesos(d.totalIngresado)
    document.getElementById('dashEgresos').textContent   = pesos(d.totalEgresos)
    var _dg = document.getElementById('dashGastos'); if (_dg) _dg.textContent = pesos(d.totalGastos || 0)
    document.getElementById('dashSaldo').textContent     = pesos(d.saldoYCA)
    document.getElementById('dashVencidos').textContent  = d.vencidos || '0'

    // Guardar datos para desglose clicable
    window._dashData = d

    // Hacer tarjetas clicables
    var _dc = document.getElementById('dashIngresado')
    if (_dc && _dc.closest) {
      var cardIng  = _dc.closest('.dash-card')
      var cardProf = document.getElementById('dashEgresos')  && document.getElementById('dashEgresos').closest('.dash-card')
      var cardGast = document.getElementById('dashGastos')   && document.getElementById('dashGastos').closest('.dash-card')
      var cardSaldo = document.getElementById('dashSaldo') && document.getElementById('dashSaldo').closest('.dash-card')
      if (cardIng)   { cardIng.style.cursor   = 'pointer'; cardIng.onclick   = function(){ abrirDesgloseDash('pagos') } }
      if (cardProf)  { cardProf.style.cursor  = 'pointer'; cardProf.onclick  = function(){ abrirDesgloseDash('profesoras') } }
      if (cardGast)  { cardGast.style.cursor  = 'pointer'; cardGast.onclick  = function(){ abrirDesgloseDash('gastos') } }
      if (cardSaldo) { cardSaldo.style.cursor = 'pointer'; cardSaldo.onclick = function(){ abrirDesgloseDash('saldo') } }
    }

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
    var data = await get('getAlumnos')
    if (!data.ok) { toast('Error al cargar alumnos', 'err'); return }
    todosAlumnos = data.data || []
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
    var aEncoded = encodeURIComponent(JSON.stringify(a))
    card.innerHTML =
      '<div class="cont-card-icon"><i class="fa-solid fa-user"></i></div>' +
      '<div class="cont-card-info">' +
        '<div class="cont-card-titulo">' + (a.NOMBRE || '—') + '</div>' +
        '<div class="cont-card-sub">' +
          (a.CURSO || 'Sin curso asignado') +
        '</div>' +
      '</div>' +
      '<div class="cont-card-acc">' +
        '<span class="cont-codigo-badge">' + (a.CODIGO || '') + '</span>' +
        '<button class="cont-btn-ico" onclick="abrirFichaAlumno(decodeURIComponent(\'' + aEncoded + '\'))" title="Ver ficha">' +
          '<i class="fa-solid fa-folder-open"></i>' +
        '</button>' +

        '<button class="cont-btn-ico danger" onclick="confirmarEliminarAlumno(\'' + (a.CODIGO || '') + '\')" title="Eliminar">' +
          '<i class="fa-solid fa-trash"></i>' +
        '</button>' +
      '</div>'
    cont.appendChild(card)
  })
}

var _filtroCursoAlumno = ''

function filtrarAlumnos (q) {
  q = (q || '').toLowerCase().trim()
  var filtrados = todosAlumnos.filter(function (a) {
    var matchQ = !q || (
      (a.NOMBRE + '').toLowerCase().indexOf(q) > -1 ||
      (a.CODIGO + '').toLowerCase().indexOf(q) > -1 ||
      (a.EMAIL  + '').toLowerCase().indexOf(q) > -1
    )
    var matchCurso = !_filtroCursoAlumno || (a.CURSO || '') === _filtroCursoAlumno
    return matchQ && matchCurso
  })
  renderAlumnos(filtrados)
}

function filtrarAlumnosPorCurso (curso) {
  _filtroCursoAlumno = curso || ''
  var buscador = document.getElementById('buscAlumnos')
  filtrarAlumnos(buscador ? buscador.value : '')

  // Actualizar chips activos
  document.querySelectorAll('.cont-filtro-curso').forEach(function (b) {
    b.classList.toggle('activo', b.dataset.curso === _filtroCursoAlumno)
  })
}

function renderFiltrosCursoAlumnos () {
  var cont = document.getElementById('filtrosCursoAlumnos')
  if (!cont) return
  cont.innerHTML = ''

  var todos = document.createElement('button')
  todos.className = 'cont-filtro cont-filtro-curso' + (!_filtroCursoAlumno ? ' activo' : '')
  todos.dataset.curso = ''
  todos.textContent = 'Todos'
  todos.onclick = function () { filtrarAlumnosPorCurso('') }
  cont.appendChild(todos)

  todosCursos.filter(function (c) {
    return c.ACTIVO === true || c.ACTIVO === 'TRUE' || c.ACTIVO === 'true'
  }).forEach(function (c) {
    var btn = document.createElement('button')
    btn.className = 'cont-filtro cont-filtro-curso' + (_filtroCursoAlumno === c.NOMBRE ? ' activo' : '')
    btn.dataset.curso = c.NOMBRE
    btn.textContent   = c.NOMBRE
    btn.onclick = function () { filtrarAlumnosPorCurso(c.NOMBRE) }
    cont.appendChild(btn)
  })
}

function abrirModalAlumno () {
  var inp = document.getElementById('mAluNombre')
  inp.value = ''
  delete inp.dataset.codigo
  document.getElementById('mAluTel').value   = ''
  document.getElementById('mAluEmail').value = ''
  document.getElementById('mAluIg').value    = ''
  document.getElementById('modalAlumnoTitulo').textContent = 'Nuevo alumno'
  _poblarSelectCursoAlumno('mAluCurso')
  abrirModal('modalAlumno')
  setTimeout(function () { inp.focus() }, 100)
}

function _poblarSelectCursoAlumno (idSelect) {
  var sel = document.getElementById(idSelect)
  if (!sel) return
  var val = sel.value
  sel.innerHTML = '<option value="">Sin curso asignado</option>'
  todosCursos.filter(function (c) {
    return c.ACTIVO === true || c.ACTIVO === 'TRUE' || c.ACTIVO === 'true'
  }).forEach(function (c) {
    var opt = document.createElement('option')
    opt.value       = c.NOMBRE
    opt.textContent = c.NOMBRE + (c.DIAS ? ' (' + c.DIAS + ')' : '')
    sel.appendChild(opt)
  })
  if (val) sel.value = val
}

async function guardarAlumno () {
  var nombre = document.getElementById('mAluNombre').value.trim()
  if (!nombre) { toast('El nombre es obligatorio', 'err'); return }

  // Si hay código guardado en el dataset, es una edición
  var codigo = document.getElementById('mAluNombre').dataset.codigo || ''
  if (codigo) {
    await guardarAlumnoEdit(codigo)
    delete document.getElementById('mAluNombre').dataset.codigo
    return
  }

  showLoading('Guardando alumno...')
  try {
    var data = await get('addAlumno', {
      nombre:    nombre,
      telefono:  document.getElementById('mAluTel').value.trim(),
      email:     document.getElementById('mAluEmail').value.trim(),
      instagram: document.getElementById('mAluIg').value.trim(),
      curso:     document.getElementById('mAluCurso') ? document.getElementById('mAluCurso').value : '',
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

function editarAlumno (aJson) {
  var a = typeof aJson === 'string' ? JSON.parse(aJson) : aJson
  document.getElementById('mAluNombre').value   = a.NOMBRE    || ''
  document.getElementById('mAluTel').value      = a.TELEFONO  || ''
  document.getElementById('mAluEmail').value    = a.EMAIL     || ''
  document.getElementById('mAluIg').value       = a.INSTAGRAM || ''
  document.getElementById('modalAlumnoTitulo').textContent = 'Editar alumno'
  // Guardar código en campo oculto — reutilizamos el mismo modal
  document.getElementById('mAluNombre').dataset.codigo = a.CODIGO || ''
  abrirModal('modalAlumno')
}

async function guardarAlumnoEdit (codigo) {
  var nombre = document.getElementById('mAluNombre').value.trim()
  if (!nombre) { toast('El nombre es obligatorio', 'err'); return }

  showLoading('Guardando cambios...')
  try {
    var data = await get('editAlumno', {
      codigo:    codigo,
      nombre:    nombre,
      telefono:  document.getElementById('mAluTel').value.trim(),
      email:     document.getElementById('mAluEmail').value.trim(),
      instagram: document.getElementById('mAluIg').value.trim()
    })
    if (!data.ok) { toast('Error: ' + (data.error || ''), 'err'); return }
    toast('Alumno actualizado', 'ok')
    cerrarModal('modalAlumno')
    await cargarAlumnos()
  } catch (e) {
    toast('Error de conexión', 'err')
  } finally {
    hideLoading()
  }
}

function confirmarEliminarAlumno (codigo) {
  // Reutilizamos el modal de confirmación inline
  var nombre = (todosAlumnos.find(function(a){ return a.CODIGO === codigo }) || {}).NOMBRE || codigo
  _modalConfirm(
    '¿Eliminar alumno?',
    'Vas a eliminar a <strong>' + nombre + '</strong> (' + codigo + '). Esta acción no se puede deshacer.',
    async function () {
      showLoading('Eliminando...')
      try {
        var data = await get('deleteAlumno', { codigo: codigo })
        if (!data.ok) { toast('Error: ' + (data.error || ''), 'err'); return }
        toast('Alumno eliminado', 'ok')
        await cargarAlumnos()
      } catch (e) {
        toast('Error de conexión', 'err')
      } finally {
        hideLoading()
      }
    }
  )
}

function confirmarEliminarCurso (btn) {
  var id     = btn.getAttribute('data-id')
  var nombre = btn.getAttribute('data-nombre')
  _modalConfirm(
    '¿Eliminar curso?',
    'Vas a eliminar el curso <strong>' + nombre + '</strong>. Esta acción no se puede deshacer.',
    async function () {
      showLoading('Eliminando...')
      try {
        var data = await get('deleteCurso', { id: id })
        if (!data.ok) { toast('Error: ' + (data.error || ''), 'err'); return }
        toast('Curso eliminado', 'ok')
        await cargarCursos()
      } catch (e) {
        toast('Error de conexión', 'err')
      } finally {
        hideLoading()
      }
    }
  )
}

// Modal de confirmación genérico (inline, sin HTML extra)
function _modalConfirm (titulo, mensaje, onConfirm) {
  var existente = document.getElementById('_modalConfirmOverlay')
  if (existente) existente.remove()

  var overlay = document.createElement('div')
  overlay.id  = '_modalConfirmOverlay'
  overlay.className = 'cont-modal-overlay'
  overlay.innerHTML =
    '<div class="cont-modal" style="max-width:400px">' +
      '<div class="cont-modal-header">' +
        '<h3>' + titulo + '</h3>' +
      '</div>' +
      '<div class="cont-modal-body">' +
        '<p style="font-size:14px;line-height:1.6;">' + mensaje + '</p>' +
      '</div>' +
      '<div class="cont-modal-footer">' +
        '<button class="cont-btn-sec" id="_confirmCancelar">Cancelar</button>' +
        '<button class="cont-btn-pri" id="_confirmOk" style="background:var(--color-rojo)">Eliminar</button>' +
      '</div>' +
    '</div>'

  document.body.appendChild(overlay)
  overlay.style.display = 'flex'

  document.getElementById('_confirmCancelar').onclick = function () { overlay.remove() }
  document.getElementById('_confirmOk').onclick = function () {
    overlay.remove()
    onConfirm()
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
    renderFiltrosCursoAlumnos()
  } catch (e) {}
}

// ── Materiales dinámicos ──────────────────────

var _materialesCurso = []

function renderMateriales () {
  var cont = document.getElementById('mCurMaterialesEditor')
  if (!cont) return
  cont.innerHTML = ''

  if (_materialesCurso.length === 0) {
    cont.innerHTML = '<p style="font-size:12px;color:var(--color-texto-sub);padding:4px 0;">Sin materiales cargados. Usá los accesos rápidos o "+ Otro".</p>'
    return
  }

  _materialesCurso.forEach(function (m, idx) {
    var fila = document.createElement('div')
    fila.className = 'cont-material-fila'
    fila.innerHTML =
      '<input type="text" value="' + (m.nombre || '') + '" placeholder="Material" ' +
        'oninput="_materialesCurso[' + idx + '].nombre=this.value">' +
      '<input type="number" value="' + (m.cantidad || '') + '" placeholder="Cant." min="0" step="0.1" ' +
        'oninput="_materialesCurso[' + idx + '].cantidad=this.value">' +
      '<select onchange="_materialesCurso[' + idx + '].unidad=this.value">' +
        '<option value="kg"'    + (m.unidad==='kg'     ? ' selected' : '') + '>kg</option>' +
        '<option value="gr"'    + (m.unidad==='gr'     ? ' selected' : '') + '>gr</option>' +
        '<option value="ml"'    + (m.unidad==='ml'     ? ' selected' : '') + '>ml</option>' +
        '<option value="l"'     + (m.unidad==='l'      ? ' selected' : '') + '>l</option>' +
        '<option value="unidad"'+ (m.unidad==='unidad' ? ' selected' : '') + '>unid.</option>' +
        '<option value="libre"' + (m.unidad==='libre'  ? ' selected' : '') + '>libre</option>' +
      '</select>' +
      '<button class="cont-material-del" onclick="eliminarMaterial(' + idx + ')">' +
        '<i class="fa-solid fa-xmark"></i>' +
      '</button>'
    cont.appendChild(fila)
  })
}

function agregarMaterial (nombre, cantidad, unidad) {
  _materialesCurso.push({ nombre: nombre || '', cantidad: cantidad || '', unidad: unidad || 'kg' })
  renderMateriales()
}

function eliminarMaterial (idx) {
  _materialesCurso.splice(idx, 1)
  renderMateriales()
}

function getMaterialesJSON () {
  // Sincronizar valores actuales del DOM antes de serializar
  var filas = document.querySelectorAll('.cont-material-fila')
  filas.forEach(function (fila, idx) {
    if (!_materialesCurso[idx]) return
    var inputs  = fila.querySelectorAll('input')
    var selects = fila.querySelectorAll('select')
    if (inputs[0])  _materialesCurso[idx].nombre   = inputs[0].value.trim()
    if (inputs[1])  _materialesCurso[idx].cantidad  = inputs[1].value
    if (selects[0]) _materialesCurso[idx].unidad    = selects[0].value
  })
  // Filtrar vacíos
  var validos = _materialesCurso.filter(function (m) { return m.nombre.trim() })
  return JSON.stringify(validos)
}

// ── Cursos ────────────────────────────────────

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

    // Parsear materiales
    var mats = []
    try { mats = JSON.parse(c.MATERIALES || '[]') } catch(e) {}

    var matsHtml = mats.length > 0
      ? '<div class="cont-curso-materiales">' +
          mats.map(function(m) {
            return '<span class="cont-curso-mat-tag">' + m.nombre +
              (m.cantidad ? ' ' + m.cantidad + m.unidad : '') + '</span>'
          }).join('') +
        '</div>'
      : ''

    var card = document.createElement('div')
    card.className = 'cont-card'
    card.innerHTML =
      '<div class="cont-card-icon"><i class="fa-solid fa-chalkboard-teacher"></i></div>' +
      '<div class="cont-card-info">' +
        '<div class="cont-card-titulo">' + (c.NOMBRE || '—') + '</div>' +
        '<div class="cont-card-sub">' +
          (c.PROFESORA || '') +
          (c.DIAS    ? ' · ' + c.DIAS    : '') +
          (c.HORARIO ? ' · ' + c.HORARIO : '') +
          ' · ' + (c.MODALIDAD || '') +
          ' · ' + pesos(c.VALOR) +
          (c.MIN_ALUMNOS ? ' · Mín: ' + c.MIN_ALUMNOS : '') +
          (c.MAX_ALUMNOS ? ' · Máx: ' + c.MAX_ALUMNOS + ' alumnos' : '') +
        '</div>' +
        matsHtml +
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
        '<button class="cont-btn-ico cont-btn-ico--danger" onclick="confirmarEliminarCurso(this)"' +
        ' data-id="' + (c.ID||'') + '" data-nombre="' + (c.NOMBRE||'') + '" title="Eliminar">' +
          '<i class="fa-solid fa-trash"></i>' +
        '</button>' +
      '</div>'
    cont.appendChild(card)
  })
}

function poblarSelectCursos () {
  var selects = ['mPagoCurso', 'mConCurso', 'fichaEditCursoSel']
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
  document.getElementById('mCurNombre').value       = ''
  document.getElementById('mCurModalidad').value    = 'MENSUAL'
  document.getElementById('mCurValor').value        = ''
  document.getElementById('mCurMinAlumnos').value   = ''
  document.getElementById('mCurMaxAlumnos').value   = ''
  document.getElementById('mCurDias').value         = ''
  document.getElementById('mCurHorario').value      = ''
  document.getElementById('mCurFechaInicio').value  = ''
  document.getElementById('mCurFechaFin').value     = ''
  document.getElementById('mCurDescripcion').value  = ''
  document.getElementById('mCurId').value           = ''
  document.getElementById('modalCursoTitulo').textContent = 'Nuevo curso'
  _materialesCurso = []
  renderMateriales()
  poblarSelectProfesoras()
  abrirModal('modalCurso')
}

function editarCurso (c) {
  document.getElementById('mCurNombre').value       = c.NOMBRE       || ''
  document.getElementById('mCurModalidad').value    = c.MODALIDAD     || 'MENSUAL'
  document.getElementById('mCurValor').value        = c.VALOR         || ''
  document.getElementById('mCurMinAlumnos').value   = c.MIN_ALUMNOS   || ''
  document.getElementById('mCurMaxAlumnos').value   = c.MAX_ALUMNOS   || ''
  document.getElementById('mCurDias').value         = c.DIAS          || ''
  document.getElementById('mCurHorario').value      = c.HORARIO       || ''
  document.getElementById('mCurFechaInicio').value  = _fechaParaInput(c.FECHA_INICIO)
  document.getElementById('mCurFechaFin').value     = _fechaParaInput(c.FECHA_FIN)
  document.getElementById('mCurDescripcion').value  = c.DESCRIPCION   || ''
  document.getElementById('mCurId').value           = c.ID            || ''
  document.getElementById('modalCursoTitulo').textContent = 'Editar curso'

  // Materiales
  try { _materialesCurso = JSON.parse(c.MATERIALES || '[]') } catch(e) { _materialesCurso = [] }
  renderMateriales()

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

  var id     = document.getElementById('mCurId').value.trim()
  var action = id ? 'editCurso' : 'addCurso'

  showLoading('Guardando curso...')
  try {
    var data = await get(action, {
      id:           id,
      nombre:       nombre,
      profesora:    prof,
      modalidad:    document.getElementById('mCurModalidad').value,
      valor:        document.getElementById('mCurValor').value,
      min_alumnos:  document.getElementById('mCurMinAlumnos').value,
      max_alumnos:  document.getElementById('mCurMaxAlumnos').value,
      dias:         document.getElementById('mCurDias').value.trim(),
      horario:      document.getElementById('mCurHorario').value.trim(),
      fecha_inicio: document.getElementById('mCurFechaInicio').value,
      fecha_fin:    document.getElementById('mCurFechaFin').value,
      descripcion:  document.getElementById('mCurDescripcion').value.trim(),
      materiales:   getMaterialesJSON()
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

// ── Importar descripción de la web ────────────

var _cursosWebCache = []

async function abrirImportarDescripcion () {
  abrirModal('modalImportarDesc')
  var cont = document.getElementById('listaCursosWeb')
  cont.innerHTML = '<div class="cont-vacio"><div class="cont-spinner" style="margin:0 auto"></div></div>'

  try {
    var data = await get('importarDescripcionCursos')
    if (!data.ok || !data.data) {
      cont.innerHTML = '<div class="cont-vacio"><p>No se pudieron cargar los cursos de la web.</p></div>'
      return
    }

    _cursosWebCache = data.data
    cont.innerHTML = ''

    if (_cursosWebCache.length === 0) {
      cont.innerHTML = '<div class="cont-vacio"><p>No hay cursos publicados en la web.</p></div>'
      return
    }

    _cursosWebCache.forEach(function (c) {
      var card = document.createElement('div')
      card.className = 'cont-card'
      card.style.cursor = 'pointer'
      card.innerHTML =
        '<div class="cont-card-icon"><i class="fa-solid fa-globe"></i></div>' +
        '<div class="cont-card-info">' +
          '<div class="cont-card-titulo">' + (c.nombre || c.NOMBRE || '—') + '</div>' +
          '<div class="cont-card-sub" style="max-height:36px;overflow:hidden;">' +
            (c.descripcion || c.DESCRIPCION || 'Sin descripción') +
          '</div>' +
        '</div>' +
        '<div class="cont-card-acc">' +
          '<button class="cont-btn-pri cont-btn-sm" onclick="importarDescripcion(' + JSON.stringify(c).replace(/"/g, '&quot;') + ')">' +
            'Usar' +
          '</button>' +
        '</div>'
      cont.appendChild(card)
    })

  } catch (e) {
    cont.innerHTML = '<div class="cont-vacio"><p>Error de conexión.</p></div>'
  }
}

function importarDescripcion (c) {
  var desc = c.descripcion || c.DESCRIPCION || ''
  var nombre = c.nombre || c.NOMBRE || ''

  if (desc) document.getElementById('mCurDescripcion').value = desc
  if (nombre && !document.getElementById('mCurNombre').value) {
    document.getElementById('mCurNombre').value = nombre
  }

  cerrarModal('modalImportarDesc')
  toast('Descripción importada', 'ok')
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
        '<div class="cont-card-sub">' + (p.DNI ? 'DNI: ' + p.DNI + ' · ' : '') + 'Porcentaje por alumno: <strong>' + (p.PORCENTAJE || 0) + '%</strong></div>' +
      '</div>' +
      '<div class="cont-card-acc">' +
        '<span class="cont-badge ' + (activo ? 'cont-badge-verde' : 'cont-badge-gris') + '">' +
          (activo ? 'Activa' : 'Inactiva') +
        '</span>' +
        '<button class="cont-btn-ico" onclick="editarProfesora(' + JSON.stringify(p).replace(/"/g, '&quot;') + ')" title="Editar">' +
          '<i class="fa-solid fa-pen"></i>' +
        '</button>' +
        '<button class="cont-btn-ico cont-btn-ico--danger" onclick="confirmarEliminarProfesora(this)" ' +
          'data-id="' + (p.ID || '') + '" data-nombre="' + (p.NOMBRE || '').replace(/"/g, '&quot;') + '" title="Eliminar">' +
          '<i class="fa-solid fa-trash"></i>' +
        '</button>' +
      '</div>'
    cont.appendChild(card)
  })
}

function confirmarEliminarProfesora (btn) {
  var id     = btn.getAttribute('data-id')
  var nombre = btn.getAttribute('data-nombre')
  _modalConfirm(
    '¿Eliminar profesora?',
    'Vas a eliminar a <strong>' + nombre + '</strong>. Esta acción no se puede deshacer.',
    async function () {
      showLoading('Eliminando...')
      try {
        var data = await get('deleteProfesora', { id: id })
        if (!data.ok) { toast('Error: ' + (data.error || ''), 'err'); return }
        toast('Profesora eliminada', 'ok')
        await cargarProfesoras()
      } catch (e) {
        toast('Error de conexión', 'err')
      } finally {
        hideLoading()
      }
    }
  )
}

function abrirModalProfesora () {
  document.getElementById('mProNombre').value      = ''
  document.getElementById('mProDni').value         = ''
  document.getElementById('mProPorcentaje').value  = ''
  document.getElementById('mProId').value          = ''
  document.getElementById('modalProfesoraTitulo').textContent = 'Nueva profesora'
  abrirModal('modalProfesora')
}

function editarProfesora (p) {
  document.getElementById('mProNombre').value      = p.NOMBRE      || ''
  document.getElementById('mProDni').value         = p.DNI         || ''
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
      dni:         document.getElementById('mProDni').value.trim(),
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
    var pEncoded = encodeURIComponent(JSON.stringify(p))

    var card = document.createElement('div')
    card.className = 'cont-card cont-card--pago'
    card.innerHTML =
      '<div class="cont-card-icon"><i class="fa-solid fa-money-bill-wave"></i></div>' +
      '<div class="cont-card-info">' +
        '<div class="cont-card-titulo">' + (p.NOMBRE_ALUMNO || '—') + ' — ' + (p.CURSO || '') + '</div>' +
        '<div class="cont-card-sub">' +
          '<span class="cont-codigo-badge cont-codigo-badge--inline">' + (p.CODIGO_ALUMNO || '') + '</span>' +
          ' · ' + _fechaDisplay(p.FECHA_PAGO) +
          (p.VENCIMIENTO && p.VENCIMIENTO !== '-' ? ' · vence ' + _fechaDisplay(p.VENCIMIENTO) : '') +
        '</div>' +
      '</div>' +
      '<div class="cont-pago-acc">' +
        '<div class="cont-pago-fila1">' +
          '<strong class="cont-pago-monto">' + pesos(p.MONTO) + '</strong>' +
          '<span class="cont-badge ' + estadoClass + '">' + (p.ESTADO || '') + '</span>' +
        '</div>' +
        '<button class="cont-btn-detalle" onclick="verDetallePago(this)" data-pago="' + pEncoded + '">' +
          '<i class="fa-solid fa-eye"></i> Ver detalle' +
        '</button>' +
      '</div>'
    cont.appendChild(card)
  })
}

function verDetallePago (btn) {
  var p
  try { p = JSON.parse(decodeURIComponent(btn.getAttribute('data-pago') || '{}')) } catch(e) { return }

  var existente = document.getElementById('_modalPagoDetOverlay')
  if (existente) existente.remove()

  var metodoIcon = p.METODO === 'EFECTIVO' ? 'fa-money-bill' : 'fa-building-columns'
  var estadoClass = p.ESTADO === 'AL DIA' ? 'cont-badge-verde' : p.ESTADO === 'VENCIDO' ? 'cont-badge-rojo' : 'cont-badge-gris'

  var overlay = document.createElement('div')
  overlay.id        = '_modalPagoDetOverlay'
  overlay.className = 'cont-modal-overlay'
  overlay.innerHTML =
    '<div class="cont-modal cont-modal--detalle" style="max-width:440px;width:95%">' +
      '<div class="cont-modal-header">' +
        '<h3>Detalle del pago</h3>' +
        '<button id="_pagoDetClose"><i class="fa-solid fa-xmark"></i></button>' +
      '</div>' +
      '<div class="cont-modal-body">' +
        '<div class="dg-grid">' +
          '<div class="dg-item"><span class="dg-label">Alumno</span><span class="dg-valor">' + (p.NOMBRE_ALUMNO||'—') + '</span></div>' +
          '<div class="dg-item"><span class="dg-label">Código</span><span class="dg-valor">' + (p.CODIGO_ALUMNO||'—') + '</span></div>' +
          '<div class="dg-item dg-item--full"><span class="dg-label">Curso</span><span class="dg-valor">' + (p.CURSO||'—') + '</span></div>' +
          '<div class="dg-item"><span class="dg-label">Fecha de pago</span><span class="dg-valor">' + _fechaDisplay(p.FECHA_PAGO) + '</span></div>' +
          '<div class="dg-item"><span class="dg-label">Vencimiento</span><span class="dg-valor">' + (p.VENCIMIENTO && p.VENCIMIENTO !== '-' ? _fechaDisplay(p.VENCIMIENTO) : '—') + '</span></div>' +
          '<div class="dg-item"><span class="dg-label">Método</span><span class="dg-valor"><i class="fa-solid ' + metodoIcon + '"></i> ' + (p.METODO||'—') + '</span></div>' +
          '<div class="dg-item"><span class="dg-label">Estado</span><span class="dg-valor"><span class="cont-badge ' + estadoClass + '">' + (p.ESTADO||'—') + '</span></span></div>' +
          (p.NOTAS ? '<div class="dg-item dg-item--full"><span class="dg-label">Notas</span><span class="dg-valor">' + p.NOTAS + '</span></div>' : '') +
          '<div class="dg-item dg-item--monto"><span class="dg-label">Monto</span><span class="dg-valor dg-monto" style="color:var(--color-primario)">' + pesos(p.MONTO) + '</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="cont-modal-footer" style="flex-wrap:wrap;gap:8px;">' +
        (p.COMPROBANTE_URL ? '<a href="' + p.COMPROBANTE_URL + '" target="_blank" class="cont-btn-comprobante"><i class="fa-solid fa-file-image"></i> Ver comprobante</a>' : '') +
        '<button class="cont-btn-ico" id="_pagoDetEditar" title="Editar"><i class="fa-solid fa-pen"></i></button>' +
        '<button class="cont-btn-ico cont-btn-ico--danger" id="_pagoDetEliminar" title="Eliminar"><i class="fa-solid fa-trash"></i></button>' +
        '<button class="cont-btn-sec" id="_pagoDetCerrar">Cerrar</button>' +
      '</div>' +
    '</div>'

  document.body.appendChild(overlay)
  overlay.style.display = 'flex'
  document.getElementById('_pagoDetClose').onclick   = function () { overlay.remove() }
  document.getElementById('_pagoDetCerrar').onclick  = function () { overlay.remove() }
  document.getElementById('_pagoDetEditar').onclick  = function () { overlay.remove(); abrirEditarPago(p) }
  document.getElementById('_pagoDetEliminar').onclick = function () { overlay.remove(); confirmarEliminarPago(p) }
}

async function abrirEditarPago (p) {
  var existente = document.getElementById('_modalEditPagoOverlay')
  if (existente) existente.remove()

  var overlay = document.createElement('div')
  overlay.id        = '_modalEditPagoOverlay'
  overlay.className = 'cont-modal-overlay'
  overlay.innerHTML =
    '<div class="cont-modal" style="max-width:420px;width:95%">' +
      '<div class="cont-modal-header"><h3>Editar pago</h3><button id="_editPagoClose"><i class="fa-solid fa-xmark"></i></button></div>' +
      '<div class="cont-modal-body">' +
        '<div class="cont-edit-pago-alumno">' +
          '<i class="fa-solid fa-user"></i>' +
          '<div><strong>' + (p.NOMBRE_ALUMNO||'—') + '</strong><span>' + (p.CURSO||'') + '</span></div>' +
        '</div>' +
        '<div class="cont-campo-fila">' +
          '<div class="cont-campo"><label>Fecha de pago</label><input type="date" id="_editPagoFecha" value="' + _fechaParaInput(p.FECHA_PAGO) + '"></div>' +
          '<div class="cont-campo"><label>Vencimiento</label><input type="date" id="_editPagoVenc" value="' + (p.VENCIMIENTO && p.VENCIMIENTO!=='-' ? _fechaParaInput(p.VENCIMIENTO) : '') + '"></div>' +
        '</div>' +
        '<div class="cont-campo-fila">' +
          '<div class="cont-campo"><label>Descuento puntual</label>' +
            '<div class="cont-input-suffix"><input type="number" id="_editPagoDescPct" placeholder="0" min="0" max="100" value="' + (_extraerDescPct(p.NOTAS)) + '"><span>%</span></div>' +
          '</div>' +
          '<div class="cont-campo"><label>Motivo descuento</label><input type="text" id="_editPagoDescMotivo" placeholder="Mes inaugural, Beca..." value="' + (_extraerDescMotivo(p.NOTAS)) + '"></div>' +
        '</div>' +
        '<div class="cont-campo-fila">' +
          '<div class="cont-campo"><label>Monto *</label><input type="number" id="_editPagoMonto" value="' + (p.MONTO||'') + '"></div>' +
          '<div class="cont-campo"><label>Método</label>' +
            '<select id="_editPagoMetodo">' +
              '<option value="EFECTIVO"' + (p.METODO==='EFECTIVO'?' selected':'') + '>Efectivo</option>' +
              '<option value="TRANSFERENCIA"' + (p.METODO==='TRANSFERENCIA'?' selected':'') + '>Transferencia</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        '<div class="cont-campo"><label>Estado</label>' +
          '<select id="_editPagoEstado">' +
            '<option value="AL DIA"' + (p.ESTADO==='AL DIA'?' selected':'') + '>Al día</option>' +
            '<option value="VENCIDO"' + (p.ESTADO==='VENCIDO'?' selected':'') + '>Vencido</option>' +
          '</select>' +
        '</div>' +
        '<div class="cont-campo"><label>Notas</label><textarea id="_editPagoNotas" rows="2">' + (_notasSinDescuento(p.NOTAS)) + '</textarea></div>' +
      '</div>' +
      '<div class="cont-modal-footer">' +
        '<button class="cont-btn-sec" id="_editPagoCancelar">Cancelar</button>' +
        '<button class="cont-btn-pri" id="_editPagoGuardar"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>' +
      '</div>' +
    '</div>'

  document.body.appendChild(overlay)
  overlay.style.display = 'flex'
  document.getElementById('_editPagoClose').onclick    = function () { overlay.remove() }
  document.getElementById('_editPagoCancelar').onclick = function () { overlay.remove() }
  document.getElementById('_editPagoGuardar').onclick  = async function () {
    var monto = document.getElementById('_editPagoMonto').value.trim()
    if (!monto) { toast('Ingresá el monto', 'err'); return }
    showLoading('Guardando...')
    try {
      var _efp = (document.getElementById('_editPagoFecha').value||'').split('-')
      var _efv = (document.getElementById('_editPagoVenc').value||'').split('-')
      var efFecha = _efp.length===3 ? (_efp[2]+'-'+_efp[1]+'-'+_efp[0]) : ''
      var efVenc  = _efv.length===3 ? (_efv[2]+'-'+_efv[1]+'-'+_efv[0]) : ''
      var edDescPct    = parseFloat(document.getElementById('_editPagoDescPct').value) || 0
      var edDescMotivo = document.getElementById('_editPagoDescMotivo').value.trim()
      var edNotasBase  = document.getElementById('_editPagoNotas').value.trim()
      var edNotasFinal = (edDescPct > 0 && edDescMotivo ? 'Descuento: ' + edDescMotivo + ' (' + edDescPct + '%) · ' : '') + edNotasBase

      var data = await get('editPago', {
        id:          p.ID,
        monto:       monto,
        metodo:      document.getElementById('_editPagoMetodo').value,
        estado:      document.getElementById('_editPagoEstado').value,
        fecha_pago:  efFecha,
        vencimiento: efVenc,
        notas:       edNotasFinal.trim()
      })
      if (!data.ok) { toast('Error: ' + (data.error||''), 'err'); return }
      toast('Pago actualizado', 'ok')
      overlay.remove()
      await cargarPagos(codigoAlumnoFiltro)
      cargarDashboard()
    } catch(e) { toast('Error de conexión', 'err') }
    finally { hideLoading() }
  }
}

function confirmarEliminarPago (p) {
  var existente = document.getElementById('_modalDelPagoOverlay')
  if (existente) existente.remove()

  var overlay = document.createElement('div')
  overlay.id        = '_modalDelPagoOverlay'
  overlay.className = 'cont-modal-overlay'
  overlay.innerHTML =
    '<div class="cont-modal" style="max-width:400px;width:95%">' +
      '<div class="cont-modal-header"><h3>¿Eliminar pago?</h3></div>' +
      '<div class="cont-modal-body">' +
        '<p style="font-size:14px;line-height:1.6;">Vas a eliminar el pago de <strong>' + (p.NOMBRE_ALUMNO||'') + '</strong> por <strong>' + pesos(p.MONTO) + '</strong> del ' + _fechaDisplay(p.FECHA_PAGO) + '.</p>' +
        '<p style="font-size:13px;color:var(--color-rojo,#c0392b);margin-top:8px;font-weight:600;">Esta acción no se puede deshacer.</p>' +
      '</div>' +
      '<div class="cont-modal-footer">' +
        '<button class="cont-btn-sec" id="_delPagoCancelar">Cancelar</button>' +
        '<button class="cont-btn-pri" id="_delPagoOk" style="background:var(--color-rojo,#c0392b)">Eliminar</button>' +
      '</div>' +
    '</div>'

  document.body.appendChild(overlay)
  overlay.style.display = 'flex'
  document.getElementById('_delPagoCancelar').onclick = function () { overlay.remove() }
  document.getElementById('_delPagoOk').onclick = async function () {
    overlay.remove()
    showLoading('Eliminando...')
    try {
      var data = await get('deletePago', { id: p.ID })
      if (!data.ok) { toast('Error: ' + (data.error||''), 'err'); return }
      toast('Pago eliminado', 'ok')
      await cargarPagos(codigoAlumnoFiltro)
      cargarDashboard()
    } catch(e) { toast('Error de conexión', 'err') }
    finally { hideLoading() }
  }
}

function filtrarPagos (estado, btn) {
  filtroPagoActual = estado
  document.querySelectorAll('#filtrosPagos .cont-filtro').forEach(function (b) {
    b.classList.remove('activo')
  })
  if (btn) btn.classList.add('activo')
  renderPagos(todosPagos, estado)
}


function _extraerDescPct (notas) {
  if (!notas) return ''
  var m = (notas + '').match(/\((\d+)%\)/)
  return m ? m[1] : ''
}
function _extraerDescMotivo (notas) {
  if (!notas) return ''
  var m = (notas + '').match(/Descuento:\s*([^(]+)\s*\(/)
  return m ? m[1].trim() : ''
}
function _notasSinDescuento (notas) {
  if (!notas) return ''
  return (notas + '').replace(/Descuento:[^·]+·\s*/, '').trim()
}

function recalcularMontoPago () {
  var cursoNombre = (document.getElementById('mPagoCurso') || {}).value || ''
  var cursoObj    = todosCursos.find(function(c) { return c.NOMBRE === cursoNombre })
  var valorBase   = cursoObj ? (parseFloat(cursoObj.VALOR) || 0) : 0
  var pct         = parseFloat(document.getElementById('mPagoDescPct').value) || 0
  var preview     = document.getElementById('mPagoDescPreview')
  var texto       = document.getElementById('mPagoDescTexto')

  if (valorBase > 0 && pct > 0) {
    var descuento = Math.round(valorBase * pct / 100)
    var final_    = valorBase - descuento
    document.getElementById('mPagoMonto').value = final_
    if (texto)   texto.textContent = 'Base: ' + pesos(valorBase) + ' — Descuento ' + pct + '%: −' + pesos(descuento) + ' → Total: ' + pesos(final_)
    if (preview) preview.style.display = 'flex'
  } else if (valorBase > 0 && pct === 0) {
    document.getElementById('mPagoMonto').value = valorBase
    if (preview) preview.style.display = 'none'
  } else {
    if (preview) preview.style.display = 'none'
  }
}

function abrirModalPago () {
  var hoy = new Date()
  var mm  = String(hoy.getMonth()+1).padStart(2,'0')
  var dd  = String(hoy.getDate()).padStart(2,'0')
  var hoyStr = hoy.getFullYear() + '-' + mm + '-' + dd
  document.getElementById('mPagoFecha').value      = hoyStr
  document.getElementById('mPagoVencimiento').value = ''
  document.getElementById('mPagoDescPct').value    = ''
  document.getElementById('mPagoDescMotivo').value = ''
  if (document.getElementById('mPagoDescPreview')) document.getElementById('mPagoDescPreview').style.display = 'none'
  document.getElementById('mPagoBuscador').value    = ''
  document.getElementById('mPagoCodigo').value      = ''
  document.getElementById('mPagoMonto').value       = ''
  document.getElementById('mPagoNotas').value       = ''
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
    var _fp = (document.getElementById('mPagoFecha').value || '').split('-')
    var _fv = (document.getElementById('mPagoVencimiento').value || '').split('-')
    var fechaPagoStr = _fp.length===3 ? (_fp[2]+'-'+_fp[1]+'-'+_fp[0]) : ''
    var vencStr      = _fv.length===3 ? (_fv[2]+'-'+_fv[1]+'-'+_fv[0]) : ''
    var descPct   = parseFloat(document.getElementById('mPagoDescPct').value) || 0
    var descMotivo = document.getElementById('mPagoDescMotivo').value.trim()
    var notasBase  = document.getElementById('mPagoNotas').value.trim()
    var notasFinal = (descPct > 0 && descMotivo ? 'Descuento: ' + descMotivo + ' (' + descPct + '%) · ' : '') + notasBase

    var data = await get('addPago', {
      codigo_alumno:   codigo,
      curso:           curso,
      monto:           monto,
      metodo:          document.getElementById('mPagoMetodo').value,
      fecha_pago:      fechaPagoStr,
      vencimiento:     vencStr,
      comprobante_url: '',
      notas:           notasFinal.trim()
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
// GASTOS
// ─────────────────────────────────────────────

var filtroGastoActual = 'todos'

async function cargarGastos () {
  try {
    var data = await get('getGastos')
    if (!data.ok) { toast('Error al cargar gastos', 'err'); return }
    todosGastos = data.data || []
    renderGastos(todosGastos, filtroGastoActual)
  } catch (e) {
    toast('Error de conexión', 'err')
  }
}

function renderGastos (lista, filtro) {
  var cont = document.getElementById('listaGastos')
  if (!cont) return

  var filtrados = filtro === 'todos' ? lista : lista.filter(function (g) {
    return g.TIPO === filtro
  })

  if (filtrados.length === 0) {
    cont.innerHTML = '<div class="cont-vacio"><i class="fa-solid fa-receipt"></i><p>No hay gastos registrados.</p></div>'
    return
  }

  var iconos = { Profesora: 'fa-person-chalkboard', Insumo: 'fa-boxes-stacked', Otro: 'fa-receipt' }

  cont.innerHTML = ''
  filtrados.forEach(function (g) {
    var card = document.createElement('div')
    card.className = 'cont-card cont-card--gasto'
    var icono = iconos[g.TIPO] || 'fa-receipt'
    card.innerHTML =
      '<div class="cont-card-icon"><i class="fa-solid ' + icono + '"></i></div>' +
      '<div class="cont-card-info">' +
        '<div class="cont-card-titulo">' + (g.DESCRIPCION || '—') + '</div>' +
        '<div class="cont-card-sub">' +
          _fechaDisplay(g.FECHA) +
          ' · ' + (g.TIPO || '') +
          ' · ' + (g.METODO || '') +
          (g.NOTAS ? ' · ' + g.NOTAS : '') +
        '</div>' +
      '</div>' +
      '<div class="cont-gasto-acc">' +
        '<div class="cont-gasto-fila1">' +
          '<strong class="cont-gasto-monto">— ' + pesos(g.MONTO) + '</strong>' +
          '<span class="cont-codigo-badge">' + (g.ID || '') + '</span>' +
          '<button class="cont-btn-ico" onclick="editarGasto(this)" ' +
            'data-gasto="' + encodeURIComponent(JSON.stringify(g)) + '" title="Editar">' +
            '<i class="fa-solid fa-pen"></i>' +
          '</button>' +
          '<button class="cont-btn-ico cont-btn-ico--danger" onclick="confirmarEliminarGasto(this)" ' +
            'data-id="' + (g.ID || '') + '" data-desc="' + (g.DESCRIPCION || '').replace(/"/g,'&quot;') + '" title="Eliminar">' +
            '<i class="fa-solid fa-trash"></i>' +
          '</button>' +
        '</div>' +
        '<button class="cont-btn-detalle" onclick="verDetalleGasto(this)" ' +
          'data-gasto="' + encodeURIComponent(JSON.stringify(g)) + '">' +
          '<i class="fa-solid fa-eye"></i> Ver detalle' +
        '</button>' +
      '</div>'
    cont.appendChild(card)
  })
}

function verDetalleGasto (btn) {
  var g
  try { g = JSON.parse(decodeURIComponent(btn.getAttribute('data-gasto') || '{}')) } catch(e) { return }

  var overlay = document.getElementById('modalDetalleGasto')
  document.getElementById('dgTitulo').textContent   = g.DESCRIPCION || '—'
  document.getElementById('dgFecha').textContent    = _fechaDisplay(g.FECHA)
  document.getElementById('dgTipo').textContent     = g.TIPO    || '—'
  document.getElementById('dgMetodo').textContent   = g.METODO  || '—'
  document.getElementById('dgMonto').textContent    = pesos(g.MONTO)
  document.getElementById('dgCodigo').textContent   = g.ID      || '—'
  document.getElementById('dgNotas').textContent    = g.NOTAS   || '—'

  var btnComprob = document.getElementById('dgBtnComprobante')
  if (g.COMPROBANTE_URL) {
    btnComprob.href = g.COMPROBANTE_URL
    btnComprob.style.display = 'inline-flex'
  } else {
    btnComprob.style.display = 'none'
  }
  abrirModal('modalDetalleGasto')
}

function filtrarGastos (tipo, btn) {
  filtroGastoActual = tipo
  document.querySelectorAll('#filtrosGastos .cont-filtro').forEach(function (b) {
    b.classList.remove('activo')
  })
  if (btn) btn.classList.add('activo')
  renderGastos(todosGastos, tipo)
}

var _archivoGasto = null

function abrirModalGasto () {
  document.getElementById('modalGastoTitulo').textContent = 'Registrar gasto'
  document.getElementById('mGastoId').value          = ''
  document.getElementById('mGastoTipo').value        = 'Profesora'
  document.getElementById('mGastoDescripcion').value = ''
  document.getElementById('mGastoMonto').value       = ''
  document.getElementById('mGastoMetodo').value      = 'EFECTIVO'
  document.getElementById('mGastoNotas').value       = ''
  document.getElementById('mGastoArchivoNombre').textContent = 'Sin archivo'
  document.getElementById('mGastoArchivoInput').value = ''
  document.getElementById('mGastoPreview').style.display = 'none'
  document.getElementById('mGastoComprobanteActual').style.display = 'none'
  document.getElementById('btnGuardarGasto').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Registrar'
  _archivoGasto = null
  abrirModal('modalGasto')
}

function editarGasto (btn) {
  var g
  if (btn && btn.getAttribute) {
    try { g = JSON.parse(decodeURIComponent(btn.getAttribute('data-gasto') || '{}')) } catch(e) { return }
  } else {
    g = btn
    if (typeof g === 'string') { try { g = JSON.parse(g) } catch(e) { return } }
  }
  document.getElementById('modalGastoTitulo').textContent = 'Editar gasto'
  document.getElementById('mGastoId').value          = g.ID          || ''
  document.getElementById('mGastoTipo').value        = g.TIPO        || 'Otro'
  document.getElementById('mGastoDescripcion').value = g.DESCRIPCION || ''
  document.getElementById('mGastoMonto').value       = g.MONTO       || ''
  document.getElementById('mGastoMetodo').value      = g.METODO      || 'EFECTIVO'
  document.getElementById('mGastoNotas').value       = g.NOTAS       || ''
  // Fecha: convertir dd/mm/yyyy → yyyy-mm-dd para el input
  var _gf = (g.FECHA || '').split('/')
  document.getElementById('mGastoFecha').value = _gf.length === 3 ? (_gf[2] + '-' + _gf[1].padStart(2,'0') + '-' + _gf[0].padStart(2,'0')) : ''
  document.getElementById('mGastoArchivoNombre').textContent = 'Sin archivo'
  document.getElementById('mGastoArchivoInput').value = ''
  document.getElementById('mGastoPreview').style.display = 'none'
  document.getElementById('btnGuardarGasto').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios'
  _archivoGasto = null
  // Mostrar link al comprobante actual si existe
  var linkEl = document.getElementById('mGastoComprobanteActual')
  if (g.COMPROBANTE_URL) {
    document.getElementById('mGastoComprobanteLink').href = g.COMPROBANTE_URL
    linkEl.style.display = 'block'
  } else {
    linkEl.style.display = 'none'
  }
  abrirModal('modalGasto')
}

function previsualizarComprobanteGasto (input) {
  var archivo  = input.files[0]
  var nombreEl = document.getElementById('mGastoArchivoNombre')
  var preview  = document.getElementById('mGastoPreview')
  if (!archivo) { nombreEl.textContent = 'Sin archivo'; preview.style.display = 'none'; _archivoGasto = null; return }
  _archivoGasto = archivo
  nombreEl.textContent = archivo.name
  if (archivo.type.startsWith('image/')) {
    var reader = new FileReader()
    reader.onload = function (e) { preview.innerHTML = '<img src="' + e.target.result + '" alt="Preview">'; preview.style.display = 'flex' }
    reader.readAsDataURL(archivo)
  } else {
    preview.innerHTML = '<div class="cont-file-preview-pdf"><i class="fa-solid fa-file-pdf"></i><span>' + archivo.name + '</span></div>'
    preview.style.display = 'flex'
  }
}

// ─────────────────────────────────────────────
// COMPRESIÓN DE IMÁGENES (max 1200px, JPG 0.72)
// ─────────────────────────────────────────────
function comprimirImagen (archivo, maxPx, calidad) {
  maxPx   = maxPx   || 1200
  calidad = calidad || 0.72
  return new Promise(function (resolve) {
    if (!archivo.type.startsWith('image/')) {
      var r = new FileReader(); r.onload = function(e){ resolve(e.target.result) }; r.readAsDataURL(archivo); return
    }
    var r = new FileReader()
    r.onload = function (e) {
      var img = new Image()
      img.onload = function () {
        var w = img.width, h = img.height
        if (w > maxPx || h > maxPx) {
          if (w > h) { h = Math.round(h * maxPx / w); w = maxPx }
          else       { w = Math.round(w * maxPx / h); h = maxPx }
        }
        var canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', calidad))
      }
      img.src = e.target.result
    }
    r.readAsDataURL(archivo)
  })
}

async function _subirArchivoGasto () {
  if (!_archivoGasto) return null
  try {
    var b64  = await comprimirImagen(_archivoGasto)
    var data = await post('subirComprobante', { archivo: b64, nombre: _archivoGasto.name.replace(/.[^.]+$/, '.jpg'), codigo: 'GASTO', alumno: 'Gastos' })
    return data.ok ? data.url : null
  } catch (err) { return null }
}

async function guardarGasto () {
  var id    = document.getElementById('mGastoId').value.trim()
  var tipo  = document.getElementById('mGastoTipo').value
  var desc  = document.getElementById('mGastoDescripcion').value.trim()
  var monto = document.getElementById('mGastoMonto').value.trim()

  if (!desc)  { toast('Ingresá una descripción', 'err'); return }
  if (!monto) { toast('Ingresá el monto', 'err'); return }

  showLoading(id ? 'Guardando cambios...' : 'Registrando gasto...')

  // Subir comprobante si hay archivo nuevo
  var urlComprobante = null
  if (_archivoGasto) {
    urlComprobante = await _subirArchivoGasto()
  }

  try {
    var _fv = (document.getElementById('mGastoFecha').value || '').split('-')
    var fechaGasto = _fv.length === 3 ? (_fv[2] + '-' + _fv[1] + '-' + _fv[0]) : ''
    var params = {
      tipo:        tipo,
      descripcion: desc,
      monto:       monto,
      fecha:       fechaGasto,
      metodo:      document.getElementById('mGastoMetodo').value,
      notas:       document.getElementById('mGastoNotas').value.trim()
    }
    if (urlComprobante) params.comprobante_url = urlComprobante

    var action = id ? 'editGasto' : 'addGasto'
    if (id) params.id = id

    var data = await get(action, params)
    if (!data.ok) { toast('Error: ' + (data.error || ''), 'err'); return }

    toast(id ? 'Gasto actualizado' : 'Gasto registrado', 'ok')
    cerrarModal('modalGasto')
    _archivoGasto = null
    await cargarGastos()
    cargarDashboard()

  } catch (e) {
    toast('Error de conexión', 'err')
  } finally {
    hideLoading()
  }
}

function confirmarEliminarGasto (btn) {
  var id   = btn.getAttribute('data-id')
  var desc = btn.getAttribute('data-desc')
  _modalConfirm(
    '¿Eliminar gasto?',
    'Vas a eliminar el gasto <strong>' + desc + '</strong>. Esta acción no se puede deshacer.',
    async function () {
      showLoading('Eliminando...')
      try {
        var data = await get('deleteGasto', { id: id })
        if (!data.ok) { toast('Error: ' + (data.error || ''), 'err'); return }
        toast('Gasto eliminado', 'ok')
        await cargarGastos()
        cargarDashboard()
      } catch (e) {
        toast('Error de conexión', 'err')
      } finally {
        hideLoading()
      }
    }
  )
}

// ─────────────────────────────────────────────
// CONTRATOS
// ─────────────────────────────────────────────

function confirmarEliminarContrato (btn) {
  var id       = btn.getAttribute('data-id')
  var nombre   = btn.getAttribute('data-nombre')
  var tienePDF = btn.getAttribute('data-tiene-pdfs') === 'true'

  // Crear overlay con checkbox de Drive
  var existente = document.getElementById('_modalConfirmOverlay')
  if (existente) existente.remove()

  var overlay = document.createElement('div')
  overlay.id        = '_modalConfirmOverlay'
  overlay.className = 'cont-modal-overlay'
  overlay.innerHTML =
    '<div class="cont-modal" style="max-width:420px">' +
      '<div class="cont-modal-header"><h3>¿Eliminar contrato?</h3></div>' +
      '<div class="cont-modal-body">' +
        '<p style="font-size:14px;line-height:1.6;">Vas a eliminar el contrato de <strong>' + nombre + '</strong> (' + id + ').</p>' +
        (tienePDF
          ? '<label style="display:flex;align-items:center;gap:10px;margin-top:12px;font-size:13px;cursor:pointer;">' +
              '<input type="checkbox" id="_checkBorrarDrive" style="width:16px;height:16px;cursor:pointer;accent-color:var(--color-rojo,#c0392b)"> ' +
              'También eliminar PDFs de Drive' +
            '</label>'
          : '') +
      '</div>' +
      '<div class="cont-modal-footer">' +
        '<button class="cont-btn-sec" id="_confirmCancelar">Cancelar</button>' +
        '<button class="cont-btn-pri" id="_confirmOk" style="background:var(--color-rojo,#c0392b)">Eliminar</button>' +
      '</div>' +
    '</div>'

  document.body.appendChild(overlay)
  overlay.style.display = 'flex'

  document.getElementById('_confirmCancelar').onclick = function () { overlay.remove() }
  document.getElementById('_confirmOk').onclick = async function () {
    var conDrive = tienePDF && document.getElementById('_checkBorrarDrive') && document.getElementById('_checkBorrarDrive').checked
    overlay.remove()
    showLoading('Eliminando contrato...')
    try {
      var data = await get('deleteContrato', { id: id, con_drive: conDrive ? 'true' : 'false' })
      if (!data.ok) { toast('Error: ' + (data.error || ''), 'err'); return }
      toast('Contrato eliminado' + (conDrive ? ' y PDFs borrados de Drive' : ''), 'ok')
      await cargarContratos()
    } catch (e) {
      toast('Error de conexión', 'err')
    } finally {
      hideLoading()
    }
  }
}

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
    var esProf = (c.ID || '').startsWith('CONP-')
    var card = document.createElement('div')
    card.className = 'cont-card'
    card.innerHTML =
      '<div class="cont-card-icon">' +
        '<i class="fa-solid ' + (esProf ? 'fa-person-chalkboard' : 'fa-user-graduate') + '"></i>' +
      '</div>' +
      '<div class="cont-card-info">' +
        '<div class="cont-card-titulo">' + (c.NOMBRE_ALUMNO || '—') + ' — ' + (c.CURSO || '') + '</div>' +
        '<div class="cont-card-sub">' +
          '<span class="cont-badge ' + (esProf ? 'cont-badge-gris' : 'cont-badge-verde') + '" style="font-size:10px;padding:2px 7px;">' +
            (esProf ? 'Profesora' : 'Alumno') +
          '</span>' +
          ' · Inicio: ' + _fechaDisplay(c.FECHA_INICIO) +
        '</div>' +
      '</div>' +
      '<div class="cont-card-acc">' +
        '<span class="cont-codigo-badge">' + (c.ID || '') + '</span>' +
        (c.PDF_CLIENTE_URL ? '<a href="' + c.PDF_CLIENTE_URL + '" target="_blank" class="cont-btn-ico" title="' + (esProf ? 'PDF Profesora' : 'PDF Cliente') + '"><i class="fa-solid ' + (esProf ? 'fa-person-chalkboard' : 'fa-user') + '"></i></a>' : '') +
        (c.PDF_YCA_URL     ? '<a href="' + c.PDF_YCA_URL     + '" target="_blank" class="cont-btn-ico" title="PDF YCA"><i class="fa-solid fa-building"></i></a>' : '') +
        '<button class="cont-btn-ico cont-btn-ico--danger" onclick="confirmarEliminarContrato(this)" ' +
          'data-id="' + (c.ID || '') + '" ' +
          'data-nombre="' + (c.NOMBRE_ALUMNO || '').replace(/"/g, '&quot;') + '" ' +
          'data-tiene-pdfs="' + ((c.PDF_CLIENTE_URL || c.PDF_YCA_URL) ? 'true' : 'false') + '" ' +
          'title="Eliminar">' +
          '<i class="fa-solid fa-trash"></i>' +
        '</button>' +
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

    if (_contratoFichaCallback && alumnoFichaActual) {
      _contratoFichaCallback = false
      cargarContratosFicha(alumnoFichaActual.CODIGO)
    } else {
      await cargarContratos()
    }

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
  if (nombre === 'gastos') { cargarGastos() }
  if (nombre === 'contratos' && !_contratosCache) {
    _contratosCache = true
    cargarContratos()
  }
  if (nombre === 'pagos' && !codigoAlumnoFiltro) {
    cargarPagos()
  }
}

// ─────────────────────────────────────────────
// FICHA DE ALUMNO
// ─────────────────────────────────────────────

var alumnoFichaActual = null

function abrirFichaAlumno (a) {
  if (typeof a === 'string') { try { a = JSON.parse(a) } catch(e) { return } }
  alumnoFichaActual = a

  // Header
  document.getElementById('fichaNombre').textContent  = a.NOMBRE  || '—'
  document.getElementById('fichaCodigo').textContent  = a.CODIGO  || ''

  // Tab datos
  document.getElementById('fichaEditNombre').value    = a.NOMBRE    || ''
  document.getElementById('fichaEditTel').value       = a.TELEFONO  || ''
  document.getElementById('fichaEditEmail').value     = a.EMAIL     || ''
  document.getElementById('fichaEditIg').value        = a.INSTAGRAM || ''
  document.getElementById('fichaEditFechaInicio').value = _fechaParaInput(a.FECHA_INICIO || '')
  document.getElementById('fichaEditCurso').value     = a.CURSO     || ''
  document.getElementById('fichaEditCodigo').value    = a.CODIGO    || ''
  document.getElementById('fichaEditDescuento').value = a.DESCUENTO || 0

  // Mostrar/ocultar botón importar
  var btnImportar = document.getElementById('btnImportarWeb')
  // Solo mostrar si es alumno WEB que todavía no está en el contable (código empieza con WEB-)
  if (btnImportar) btnImportar.style.display = (a.CODIGO || '').startsWith('WEB-') ? 'inline-flex' : 'none'

  // Poblar select de cursos en ficha
  _poblarSelectCursoAlumno('fichaEditCursoSel')
  setTimeout(function () {
    var sel = document.getElementById('fichaEditCursoSel')
    if (sel) { sel.value = a.CURSO || ''; calcularDescuento() }
  }, 80)

  // Calcular descuento inicial
  calcularDescuento()

  // Resetear tabs
  setFichaTab('datos', document.querySelector('.cont-ficha-tab'))

  abrirModal('modalFichaAlumno')
}

function setFichaTab (tab, btn) {
  // Ocultar todos los panels
  document.querySelectorAll('.cont-ficha-tab-panel').forEach(function (p) {
    p.style.display = 'none'
  })
  // Desactivar todos los tabs
  document.querySelectorAll('.cont-ficha-tab').forEach(function (b) {
    b.classList.remove('activo')
  })

  // Mostrar el panel pedido
  var panel = document.getElementById('fichaTab' + tab.charAt(0).toUpperCase() + tab.slice(1))
  if (panel) panel.style.display = 'block'
  if (btn)   btn.classList.add('activo')

  // Cargar datos del tab
  if (tab === 'pagos'     && alumnoFichaActual) cargarPagosFicha(alumnoFichaActual.CODIGO)
  if (tab === 'contratos' && alumnoFichaActual) cargarContratosFicha(alumnoFichaActual.CODIGO)
}

// ── Descuento ─────────────────────────────

function calcularDescuento () {
  var descPct  = parseFloat(document.getElementById('fichaEditDescuento').value) || 0
  var preview  = document.getElementById('descuentoPreview')
  var sel = document.getElementById('fichaEditCursoSel')
  var curso = sel ? sel.value : (document.getElementById('fichaEditCurso') ? document.getElementById('fichaEditCurso').value : '')

  if (!preview) return

  if (descPct <= 0 || !curso) {
    preview.style.display = 'none'
    return
  }

  // Buscar valor del curso
  var cursoObj = todosCursos.find(function (c) { return c.NOMBRE === curso })
  if (!cursoObj || !cursoObj.VALOR) { preview.style.display = 'none'; return }

  var valorOriginal = parseFloat(cursoObj.VALOR) || 0
  var valorFinal    = valorOriginal * (1 - descPct / 100)

  document.getElementById('descValorOriginal').textContent = pesos(valorOriginal)
  document.getElementById('descValorFinal').textContent    = pesos(Math.round(valorFinal))
  preview.style.display = 'flex'
}

// ── Guardar edición ────────────────────────

async function guardarEdicionAlumno () {
  var codigo = document.getElementById('fichaEditCodigo').value.trim()
  if (!codigo || codigo.startsWith('WEB-')) {
    toast('Importá el alumno primero para poder editarlo', 'err')
    return
  }

  showLoading('Guardando...')
  try {
    var cursoSel = document.getElementById('fichaEditCursoSel')
    var data = await get('editAlumno', {
      codigo:       codigo,
      nombre:       document.getElementById('fichaEditNombre').value.trim(),
      telefono:     document.getElementById('fichaEditTel').value.trim(),
      email:        document.getElementById('fichaEditEmail').value.trim(),
      instagram:    document.getElementById('fichaEditIg').value.trim(),
      curso:        cursoSel ? cursoSel.value : '',
      descuento:    document.getElementById('fichaEditDescuento').value || 0,
      fecha_inicio: document.getElementById('fichaEditFechaInicio').value || ''
    })

    if (!data.ok) { toast('Error: ' + (data.error || ''), 'err'); return }

    // Actualizar en memoria
    var idx = todosAlumnos.findIndex(function (a) { return a.CODIGO === codigo })
    if (idx > -1) {
      todosAlumnos[idx].NOMBRE     = document.getElementById('fichaEditNombre').value.trim()
      todosAlumnos[idx].TELEFONO   = document.getElementById('fichaEditTel').value.trim()
      todosAlumnos[idx].EMAIL      = document.getElementById('fichaEditEmail').value.trim()
      todosAlumnos[idx].INSTAGRAM  = document.getElementById('fichaEditIg').value.trim()
      todosAlumnos[idx].DESCUENTO  = parseFloat(document.getElementById('fichaEditDescuento').value) || 0
      if (cursoSel) todosAlumnos[idx].CURSO = cursoSel.value
      alumnoFichaActual = todosAlumnos[idx]
    }

    toast('Cambios guardados', 'ok')
    renderAlumnos(todosAlumnos)

  } catch (e) {
    toast('Error de conexión', 'err')
  } finally {
    hideLoading()
  }
}

// ── Importar alumno web ────────────────────

async function importarAlumnoWeb () {
  if (!alumnoFichaActual) return

  showLoading('Importando alumno...')
  try {
    var data = await get('importarAlumnoWeb', {
      nombre:    alumnoFichaActual.NOMBRE    || '',
      email:     alumnoFichaActual.EMAIL     || '',
      telefono:  alumnoFichaActual.TELEFONO  || '',
      instagram: alumnoFichaActual.INSTAGRAM || '',
      curso:     alumnoFichaActual.CURSO     || ''
    })

    if (!data.ok) { toast('Error: ' + (data.error || ''), 'err'); return }

    toast('Alumno importado — ' + data.codigo, 'ok')
    cerrarModal('modalFichaAlumno')
    await cargarAlumnos()

  } catch (e) {
    toast('Error de conexión', 'err')
  } finally {
    hideLoading()
  }
}

// ── Pagos en ficha ────────────────────────

async function cargarPagosFicha (codigo) {
  var cont = document.getElementById('fichaPagosList')
  if (!cont) return
  cont.innerHTML = '<div class="cont-vacio"><div class="cont-spinner" style="margin:0 auto"></div></div>'

  try {
    var data = await get('getPagos', { codigo: codigo })
    if (!data.ok) { cont.innerHTML = '<div class="cont-vacio"><p>Error al cargar pagos</p></div>'; return }

    var lista = data.data || []
    if (lista.length === 0) {
      cont.innerHTML = '<div class="cont-vacio"><i class="fa-solid fa-money-bill-wave"></i><p>Sin pagos registrados.</p></div>'
      return
    }

    cont.innerHTML = ''
    lista.forEach(function (p) {
      var estadoClass = p.ESTADO === 'AL DIA' ? 'cont-badge-verde' :
                        p.ESTADO === 'VENCIDO' ? 'cont-badge-rojo' : 'cont-badge-gris'
      var card = document.createElement('div')
      card.className = 'cont-card'
      card.innerHTML =
        '<div class="cont-card-icon"><i class="fa-solid fa-money-bill-wave"></i></div>' +
        '<div class="cont-card-info">' +
          '<div class="cont-card-titulo">' + (p.CURSO || '—') + ' — ' + pesos(p.MONTO) + '</div>' +
          '<div class="cont-card-sub">' +
            (p.FECHA_PAGO || '') +
            (p.VENCIMIENTO && p.VENCIMIENTO !== '-' ? ' · Vence: ' + p.VENCIMIENTO : '') +
            ' · ' + (p.METODO || '') +
          '</div>' +
        '</div>' +
        '<div class="cont-card-acc">' +
          '<span class="cont-badge ' + estadoClass + '">' + (p.ESTADO || '') + '</span>' +
          (p.COMPROBANTE_URL
            ? '<button class="cont-btn-ico" onclick="abrirVisorComprobante(\'' + p.COMPROBANTE_URL + '\')" title="Ver comprobante">' +
              '<i class="fa-solid fa-file"></i></button>'
            : '') +
        '</div>'
      cont.appendChild(card)
    })
  } catch (e) {
    cont.innerHTML = '<div class="cont-vacio"><p>Error de conexión</p></div>'
  }
}

function abrirPagoDesdeAlu () {
  cerrarModal('modalFichaAlumno')
  abrirModalPago()
  // Pre-seleccionar el alumno
  if (alumnoFichaActual) {
    setTimeout(function () {
      seleccionarAlumnoPago(alumnoFichaActual)
    }, 100)
  }
}

// ── Contratos en ficha ────────────────────

async function cargarContratosFicha (codigo) {
  var cont = document.getElementById('fichaContratosList')
  if (!cont) return
  cont.innerHTML = '<div class="cont-vacio"><div class="cont-spinner" style="margin:0 auto"></div></div>'

  try {
    var data = await get('getContratos', { codigo: codigo })
    if (!data.ok) { cont.innerHTML = '<div class="cont-vacio"><p>Error al cargar contratos</p></div>'; return }

    var lista = data.data || []
    if (lista.length === 0) {
      cont.innerHTML = '<div class="cont-vacio"><i class="fa-solid fa-file-signature"></i><p>Sin contratos generados.</p></div>'
      return
    }

    cont.innerHTML = ''
    lista.forEach(function (c) {
      var card = document.createElement('div')
      card.className = 'cont-card'
      card.innerHTML =
        '<div class="cont-card-icon"><i class="fa-solid fa-file-signature"></i></div>' +
        '<div class="cont-card-info">' +
          '<div class="cont-card-titulo">' + (c.CURSO || '—') + '</div>' +
          '<div class="cont-card-sub">' +
            'Inicio: ' + _fechaDisplay(c.FECHA_INICIO) +
            ' · Arcilla: ' + (c.ARCILLA_KG || 0) + 'kg' +
            ' · Barbotina: ' + (c.BARBOTINA_ML || 0) + 'ml' +
          '</div>' +
        '</div>' +
        '<div class="cont-card-acc">' +
          (c.PDF_CLIENTE_URL ? '<a href="' + c.PDF_CLIENTE_URL + '" target="_blank" class="cont-btn-ico" title="PDF Cliente"><i class="fa-solid fa-user"></i></a>' : '') +
          (c.PDF_YCA_URL     ? '<a href="' + c.PDF_YCA_URL     + '" target="_blank" class="cont-btn-ico" title="PDF YCA"><i class="fa-solid fa-building"></i></a>'   : '') +
        '</div>'
      cont.appendChild(card)
    })
  } catch (e) {
    cont.innerHTML = '<div class="cont-vacio"><p>Error de conexión</p></div>'
  }
}

var _contratoFichaCallback = false

function generarContratoDesdeCard (a) {
  if (typeof a === 'string') { try { a = JSON.parse(a) } catch(e) { return } }
  // Guardar alumno como actual y abrir modal con datos prellenados
  alumnoFichaActual = a
  _contratoFichaCallback = false
  abrirModalContrato()
  setTimeout(function () {
    seleccionarAlumnoContrato(a)
  }, 100)
}

function abrirContratoDesdeAlu () {
  _contratoFichaCallback = true
  abrirModalContrato()
  if (alumnoFichaActual) {
    setTimeout(function () {
      seleccionarAlumnoContrato(alumnoFichaActual)
    }, 100)
  }
}

// ─────────────────────────────────────────────
// VISOR DE COMPROBANTE
// ─────────────────────────────────────────────

function abrirVisorComprobante (url) {
  var body = document.getElementById('visorBody')
  var link = document.getElementById('visorLink')
  if (!body || !url) return

  link.href = url

  // Detectar si es imagen o PDF por la URL
  var esImagen = /\.(jpg|jpeg|png|gif|webp)/i.test(url) ||
                 url.indexOf('image') > -1

  if (esImagen) {
    body.innerHTML = '<img src="' + url + '" alt="Comprobante">'
  } else {
    // Para Drive: convertir URL de visualización a embed
    var embedUrl = url
    if (url.indexOf('drive.google.com/file') > -1) {
      var idMatch = url.match(/\/d\/([^/]+)/)
      if (idMatch) embedUrl = 'https://drive.google.com/file/d/' + idMatch[1] + '/preview'
    }
    body.innerHTML = '<iframe src="' + embedUrl + '" allowfullscreen></iframe>'
  }

  abrirModal('modalVisorComprobante')
}

// ─────────────────────────────────────────────
// SUBIDA DE COMPROBANTE (en modal pago)
// ─────────────────────────────────────────────

var _archivoComprobante = null

function previsualizarComprobante (input) {
  var archivo  = input.files[0]
  var nombreEl = document.getElementById('mPagoArchivoNombre')
  var preview  = document.getElementById('mPagoPreview')

  if (!archivo) {
    nombreEl.textContent  = 'Sin archivo'
    preview.style.display = 'none'
    _archivoComprobante   = null
    return
  }

  _archivoComprobante   = archivo
  nombreEl.textContent  = archivo.name

  // Preview
  if (archivo.type.startsWith('image/')) {
    var reader = new FileReader()
    reader.onload = function (e) {
      preview.innerHTML     = '<img src="' + e.target.result + '" alt="Preview">'
      preview.style.display = 'flex'
    }
    reader.readAsDataURL(archivo)
  } else if (archivo.type === 'application/pdf') {
    preview.innerHTML     = '<div class="cont-file-preview-pdf"><i class="fa-solid fa-file-pdf"></i><span>' + archivo.name + '</span></div>'
    preview.style.display = 'flex'
  }
}

async function _subirArchivoSiHay (codigoAlu, nombreAlu) {
  if (!_archivoComprobante) return null
  try {
    var b64  = await comprimirImagen(_archivoComprobante)
    var data = await post('subirComprobante', {
      archivo: b64,
      nombre:  _archivoComprobante.name.replace(/.[^.]+$/, '.jpg'),
      codigo:  codigoAlu,
      alumno:  nombreAlu
    })
    return data.ok ? data.url : null
  } catch (err) { return null }
}

// ─────────────────────────────────────────────
// SOBREESCRIBIR guardarPago PARA SUBIR ARCHIVO
// ─────────────────────────────────────────────

// Guardamos la función original y la reemplazamos
var _guardarPagoOriginal = guardarPago

guardarPago = async function () {
  var codigo = document.getElementById('mPagoCodigo').value.trim()
  var curso  = document.getElementById('mPagoCurso').value.trim()
  var monto  = document.getElementById('mPagoMonto').value.trim()

  if (!codigo) { toast('Seleccioná un alumno', 'err'); return }
  if (!curso)  { toast('Seleccioná un curso', 'err'); return }
  if (!monto)  { toast('Ingresá el monto', 'err'); return }

  // Buscar nombre del alumno para la carpeta
  var alumno     = todosAlumnos.find(function (a) { return a.CODIGO === codigo })
  var nombreAlu  = alumno ? alumno.NOMBRE : 'Alumno'

  showLoading('Subiendo comprobante...')
  var urlComprobante = await _subirArchivoSiHay(codigo, nombreAlu)

  showLoading('Registrando pago...')
  try {
    var data = await get('addPago', {
      codigo_alumno:   codigo,
      curso:           curso,
      monto:           monto,
      metodo:          document.getElementById('mPagoMetodo').value,
      comprobante_url: urlComprobante || '',
      notas:           document.getElementById('mPagoNotas').value.trim()
    })

    if (!data.ok) { toast('Error: ' + (data.error || ''), 'err'); return }

    // Limpiar archivo
    _archivoComprobante = null
    document.getElementById('mPagoArchivoInput').value  = ''
    document.getElementById('mPagoArchivoNombre').textContent = 'Sin archivo'
    document.getElementById('mPagoPreview').style.display = 'none'

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
// DESCUENTO AL ABRIR MODAL DE PAGO
// Sugiere el monto con descuento si el alumno tiene uno asignado
// ─────────────────────────────────────────────

// Sobrescribir seleccionarAlumnoPago para aplicar descuento
var _seleccionarAlumnoPagoOriginal = seleccionarAlumnoPago

seleccionarAlumnoPago = function (a) {
  _seleccionarAlumnoPagoOriginal(a)
  // Si el alumno tiene descuento y hay un curso seleccionado, aplicarlo
  _aplicarDescuentoEnPago(a)
}

document.addEventListener('change', function (e) {
  if (e.target.id === 'mPagoCurso') {
    var codigo = document.getElementById('mPagoCodigo').value
    var alumno = todosAlumnos.find(function (a) { return a.CODIGO === codigo })
    if (alumno) _aplicarDescuentoEnPago(alumno)
  }
})

function _aplicarDescuentoEnPago (alumno) {
  var descPct  = parseFloat(alumno.DESCUENTO) || 0
  if (descPct <= 0) return

  var cursoNombre = document.getElementById('mPagoCurso').value
  var cursoObj    = todosCursos.find(function (c) { return c.NOMBRE === cursoNombre })
  if (!cursoObj || !cursoObj.VALOR) return

  var valorFinal = Math.round(parseFloat(cursoObj.VALOR) * (1 - descPct / 100))
  document.getElementById('mPagoMonto').value = valorFinal
  toast('Descuento del ' + descPct + '% aplicado → ' + pesos(valorFinal), 'ok')
}

// ─────────────────────────────────────────────
// CONTRATO DE PROFESORA
// ─────────────────────────────────────────────

function abrirModalContratoProfesora () {
  // Poblar select profesoras
  var selProf = document.getElementById('mConProf')
  if (selProf) {
    selProf.innerHTML = '<option value="">Seleccioná una profesora...</option>'
    todasProfesoras.filter(function (p) {
      return p.ACTIVO === true || p.ACTIVO === 'TRUE' || p.ACTIVO === 'true'
    }).forEach(function (p) {
      var opt = document.createElement('option')
      opt.value       = p.ID
      opt.textContent = p.NOMBRE + (p.DNI ? ' — DNI ' + p.DNI : '')
      opt.dataset.porcentaje = p.PORCENTAJE || 0
      selProf.appendChild(opt)
    })
  }

  // Poblar select cursos
  var selCurso = document.getElementById('mConProfCurso')
  if (selCurso) {
    selCurso.innerHTML = '<option value="">Seleccioná un curso...</option>'
    todosCursos.filter(function (c) {
      return c.ACTIVO === true || c.ACTIVO === 'TRUE' || c.ACTIVO === 'true'
    }).forEach(function (c) {
      var opt = document.createElement('option')
      opt.value            = c.ID
      opt.textContent      = c.NOMBRE
      opt.dataset.dias     = c.DIAS        || ''
      opt.dataset.horario  = c.HORARIO     || ''
      opt.dataset.min      = c.MIN_ALUMNOS || ''
      opt.dataset.max      = c.MAX_ALUMNOS || ''
      selCurso.appendChild(opt)
    })
  }

  document.getElementById('mConProfPreview').style.display = 'none'
  abrirModal('modalContratoProfesora')
}

function autocompletarContratoProfesora () {
  var selCurso = document.getElementById('mConProfCurso')
  var selProf  = document.getElementById('mConProf')
  var preview  = document.getElementById('mConProfPreview')
  if (!selCurso || !preview) return

  var opt      = selCurso.options[selCurso.selectedIndex]
  var dias     = opt ? opt.dataset.dias    : ''
  var horario  = opt ? opt.dataset.horario : ''

  var optProf  = selProf ? selProf.options[selProf.selectedIndex] : null
  var porc     = optProf ? optProf.dataset.porcentaje : ''

  if (!selCurso.value) { preview.style.display = 'none'; return }

  document.getElementById('prevDias').textContent      = dias    || '—'
  document.getElementById('prevHorario').textContent   = horario || '—'
  document.getElementById('prevPorcentaje').textContent = porc ? porc + '%' : '—'

  // Cupo
  var optCurso  = selCurso ? selCurso.options[selCurso.selectedIndex] : null
  var minAlu    = optCurso ? optCurso.dataset.min : ''
  var maxAlu    = optCurso ? optCurso.dataset.max : ''
  var prevCupo  = document.getElementById('prevCupo')
  if (prevCupo) prevCupo.textContent = (minAlu ? 'Mín: ' + minAlu : '') + (minAlu && maxAlu ? ' · ' : '') + (maxAlu ? 'Máx: ' + maxAlu : '') || '—'

  preview.style.display = 'flex'
}

async function generarContratoProfesora () {
  var idProf  = document.getElementById('mConProf').value
  var idCurso = document.getElementById('mConProfCurso').value

  if (!idProf)  { toast('Seleccioná una profesora', 'err'); return }
  if (!idCurso) { toast('Seleccioná un curso', 'err'); return }

  var btn = document.getElementById('btnGenerarContratoProf')
  btn.disabled  = true
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando PDFs...'
  showLoading('Generando contrato... esto puede tardar unos segundos.')

  try {
    var data = await get('generarContratoProfesora', {
      id_profesora:     idProf,
      id_curso:         idCurso,
      modalidad_cobro:  document.getElementById('mConProfModalidadCobro').value
    })

    if (!data.ok) { toast('Error: ' + (data.error || ''), 'err'); return }

    toast('Contrato generado', 'ok')
    cerrarModal('modalContratoProfesora')

    if (data.pdfProfesora) window.open(data.pdfProfesora, '_blank')
    if (data.pdfYCA)       window.open(data.pdfYCA,       '_blank')

  } catch (e) {
    toast('Error de conexión', 'err')
  } finally {
    hideLoading()
    btn.disabled  = false
    btn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> Generar PDFs'
  }
}

// ─────────────────────────────────────────────
// HELPER: normalizar fecha para input[type=date]
// Sheets puede devolver dd/mm/yyyy o yyyy-mm-dd o Date object string
// ─────────────────────────────────────────────
function _fechaDisplay (val) {
  if (!val) return '—'
  if (val instanceof Date) {
    return val.toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' })
  }
  var str = String(val).trim()
  // Already dd/mm/yyyy
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) return str
  // ISO format: 2026-10-04T03:00:00.000Z
  if (str.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(str)) {
    try {
      var d = new Date(str)
      if (!isNaN(d.getTime())) {
        return String(d.getUTCDate()).padStart(2,'0') + '/' +
               String(d.getUTCMonth()+1).padStart(2,'0') + '/' +
               d.getUTCFullYear()
      }
    } catch(e) {}
  }
  return str
}

function _fechaParaInput (val) {
  if (!val) return ''
  // Si es objeto Date
  if (val instanceof Date) {
    var y = val.getFullYear()
    var m = String(val.getMonth()+1).padStart(2,'0')
    var d = String(val.getDate()).padStart(2,'0')
    return y + '-' + m + '-' + d
  }
  var s = String(val).trim()
  if (!s || s === 'Invalid Date') return ''
  // Ya está en formato yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // Formato dd/mm/yyyy
  var m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m1) return m1[3] + '-' + m1[2].padStart(2,'0') + '-' + m1[1].padStart(2,'0')
  // Formato dd/mm/yy
  var m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/)
  if (m2) return '20' + m2[3] + '-' + m2[2].padStart(2,'0') + '-' + m2[1].padStart(2,'0')
  // Intentar parsear como Date string genérico (ej: "Fri Mar 28 2026...")
  try {
    var d2 = new Date(s)
    if (!isNaN(d2.getTime())) {
      return d2.getFullYear() + '-' +
        String(d2.getMonth()+1).padStart(2,'0') + '-' +
        String(d2.getDate()).padStart(2,'0')
    }
  } catch(e) {}
  return ''
}
