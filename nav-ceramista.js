// ─────────────────────────────────────────────
// NAV — Header unificado + Avatar de sesión
// Un solo archivo controla la barra de todas las páginas
// ─────────────────────────────────────────────

(function(){

  function init(){

    // ── 1. Detectar sesión ──────────────────
    var sesion = null
    var rol    = null

    try {
      sesion = JSON.parse(localStorage.getItem('ceramista_sesion') || 'null')
      if(sesion && sesion.token){ rol = 'ceramista' }
    } catch(e){}

    if(!rol){
      try {
        var ss = JSON.parse(sessionStorage.getItem('yca_sesion') || 'null')
        if(ss && ss.token){
          if(ss.rol === 'ceramista'){
            sesion = { token: ss.token, nombre: ss.nombre, id: ss.id, plan: ss.plan }
            localStorage.setItem('ceramista_sesion', JSON.stringify(sesion))
            rol = 'ceramista'
          } else if(ss.rol === 'alumno'){
            sesion = ss
            rol = 'alumno'
          }
        }
      } catch(e){}
    }

    // ── 2. Detectar profundidad de ruta ─────
    var path  = window.location.pathname
    var segs  = path.split('/').filter(Boolean)
    // GitHub Pages: /ycaceramica.github.io/ cuenta como raíz
    var depth = segs.length > 0 ? segs.length - 1 : 0
    if(path.endsWith('/') || path.endsWith('.html')){
      depth = segs.length - (path.endsWith('.html') ? 1 : 0)
    }
    var prefix = depth === 0 ? '' : depth === 1 ? '../' : '../../'

    // ── 3. Inyectar header si hay placeholder ──
    var placeholder = document.getElementById('nav-placeholder')
    if(placeholder){
      // Detectar la página actual para marcar el link activo
      var pagina = segs[segs.length - (path.endsWith('.html') ? 2 : 1)] || 'home'

      // Links del nav — cada uno lleva su href completo según profundidad
      var links = [
        { label: 'Inicio',           href: prefix + 'index.html',                  key: 'home' },
        { label: 'Productos',        href: prefix + 'index.html#productos',         key: 'productos' },
        { label: 'Herramientas',     href: prefix + 'herramientas/index.html',      key: 'herramientas' },
        { label: 'Cursos y Talleres',href: prefix + 'cursos/index.html',            key: 'cursos' },
        { label: 'Galería',          href: prefix + 'index.html#galeria',           key: 'galeria' },
        { label: 'Contacto',         href: prefix + 'index.html#contacto',          key: 'contacto' }
      ]

      var navLinks = links.map(function(l){
        return '<a href="' + l.href + '">' + l.label + '</a>'
      }).join('\n        ')

      placeholder.outerHTML = [
        '<header class="header">',
        '  <div class="header-container">',
        '    <div class="logo">',
        '      <a href="' + prefix + 'index.html">',
        '        <img src="' + prefix + 'imagenes/logo.png" alt="YCA Cerámica" style="height:38px;width:38px;border-radius:50%;vertical-align:middle;margin-right:8px;">YCA Cerámica',
        '      </a>',
        '    </div>',
        '    <nav class="nav" id="nav">',
        '      ' + navLinks,
        '      <button id="toggleDark">🌙</button>',
        '    </nav>',
        '    <span class="hamburguesa" id="hamburguesa">☰</span>',
        '  </div>',
        '</header>'
      ].join('\n')
    }

    // ── 4. Inyectar estilos del avatar ──────
    if(!document.getElementById('nav-sesion-styles')){
      var style = document.createElement('style')
      style.id  = 'nav-sesion-styles'
      style.textContent = [
        '.nav-sesion-registro{display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;border:1.5px solid var(--color-primario);background:transparent;color:var(--color-primario);font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;white-space:nowrap;transition:0.2s;}',
        '.nav-sesion-registro:hover{background:var(--color-primario);color:white;}',
        '@media(max-width:768px){.nav-sesion-registro span{display:none;}}',
        '.nav-sesion-btn{position:relative;display:flex;align-items:center;gap:8px;background:none;border:none;cursor:pointer;padding:0;font-family:inherit;}',
        '.nav-sesion-avatar-wrapper{position:relative;flex-shrink:0;}',
        '.nav-sesion-avatar{width:32px;height:32px;min-width:32px;min-height:32px;border-radius:50%;background:var(--color-primario);color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;border:2px solid white;box-sizing:border-box;flex-shrink:0;}',
        '.nav-pro-badge{position:absolute;bottom:-4px;right:-6px;font-size:13px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4));}',
        '.nav-sesion-nombre{font-size:14px;font-weight:700;color:var(--color-texto);max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
        '.nav-sesion-menu{position:absolute;top:calc(100% + 10px);right:0;background:var(--color-superficie);border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.15);padding:8px;min-width:180px;z-index:1000;display:none;flex-direction:column;gap:4px;overflow:hidden;}',
        '.nav-sesion-btn.abierto .nav-sesion-menu{display:flex;}',
        '.nav-sesion-menu a,.nav-sesion-menu button{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;font-family:inherit;font-size:14px;font-weight:600;color:var(--color-texto);text-decoration:none;background:none;border:none;cursor:pointer;width:100%;text-align:left;transition:background 0.15s;}',
        '.nav-sesion-menu a:hover,.nav-sesion-menu button:hover{background:rgba(139,111,86,0.1);color:var(--color-primario);}',
        '.nav-sesion-sep{height:1px;background:rgba(139,111,86,0.15);margin:4px 0;}',
        '.nav-sesion-salir{color:#c85028 !important;}',
        '.nav-sesion-salir:hover{background:rgba(200,80,40,0.08) !important;color:#c85028 !important;}',
        '@media(max-width:768px){.nav-sesion-nombre{display:none;}.nav-sesion-menu{right:0;left:auto;}.nav-sesion-btn{margin-right:4px;}.nav-sesion-registro{margin-right:4px;padding:6px 10px;}}'
      ].join('\n')
      document.head.appendChild(style)
    }

    // ── 5. Modo oscuro ──────────────────────
    var toggleDark = document.getElementById('toggleDark')
    if(toggleDark){
      if(localStorage.getItem('dark') === 'true'){
        document.body.classList.add('dark')
      }
      toggleDark.innerText = document.body.classList.contains('dark') ? '☀️' : '🌙'
      toggleDark.addEventListener('click', function(){
        document.body.classList.toggle('dark')
        localStorage.setItem('dark', document.body.classList.contains('dark'))
        toggleDark.innerText = document.body.classList.contains('dark') ? '☀️' : '🌙'
      })
    }

    // ── 6. Hamburguesa ──────────────────────
    var hamburguesa = document.getElementById('hamburguesa')
    var nav         = document.getElementById('nav')
    if(hamburguesa && nav){
      hamburguesa.addEventListener('click', function(){ nav.classList.toggle('active') })
      document.querySelectorAll('.nav a').forEach(function(l){
        l.addEventListener('click', function(){ nav.classList.remove('active') })
      })
      window.addEventListener('scroll', function(){ nav.classList.remove('active') })
    }

    // ── 7. Avatar de sesión ─────────────────
    var insertPoint = hamburguesa || toggleDark
    if(!insertPoint || !insertPoint.parentNode) return

    // Páginas sin avatar (nav-ceramista.js no inserta el botón de sesión)
    var sinAvatar = ['login', 'mi-cuenta', 'mi-taller']
    var paginaActual = window.location.pathname.split('/').filter(Boolean)
    var carpeta = paginaActual[paginaActual.length - (window.location.pathname.endsWith('.html') ? 2 : 1)] || ''
    var mostrarAvatar = sinAvatar.indexOf(carpeta) === -1

    if(!mostrarAvatar) return

    if(!rol){
      // Sin sesión → botón Soy ceramista
      var btnReg = document.createElement('a')
      btnReg.className = 'nav-sesion-registro'
      btnReg.href      = prefix + 'login/index.html'
      btnReg.innerHTML = '🏺 <span>Soy ceramista</span>'
      insertPoint.parentNode.insertBefore(btnReg, insertPoint)
      return
    }

    // Con sesión → avatar
    var nombreCompleto = sesion.nombre || (rol === 'ceramista' ? 'Mi taller' : 'Mi cuenta')
    var nombre  = nombreCompleto.split(' ')[0]
    var inicial = nombre[0].toUpperCase()
    var destUrl = prefix + (rol === 'ceramista' ? 'mi-taller/index.html' : 'mi-cuenta/index.html')
    var labelDestino = rol === 'ceramista' ? 'Mi taller' : 'Mi cuenta'
    var iconoDestino = rol === 'ceramista' ? 'fa-store' : 'fa-user'
    var esPro   = sesion.plan === 'pro'

    var avatarHtml = '<div class="nav-sesion-avatar-wrapper">' +
      '<div class="nav-sesion-avatar">' + inicial + '</div>' +
      (esPro ? '<div class="nav-pro-badge">⭐</div>' : '') +
      '</div>'

    var btn = document.createElement('button')
    btn.className = 'nav-sesion-btn'
    btn.setAttribute('aria-label', labelDestino)
    btn.innerHTML = [
      avatarHtml,
      '<span class="nav-sesion-nombre">' + nombre + '</span>',
      '<div class="nav-sesion-menu">',
        '<a href="' + destUrl + '"><i class="fa-solid ' + iconoDestino + '"></i> ' + labelDestino + '</a>',
        '<div class="nav-sesion-sep"></div>',
        '<button class="nav-sesion-salir" id="nav-btn-salir"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</button>',
      '</div>'
    ].join('')

    btn.addEventListener('click', function(e){
      e.stopPropagation()
      btn.classList.toggle('abierto')
    })
    document.addEventListener('click', function(){ btn.classList.remove('abierto') })

    insertPoint.parentNode.insertBefore(btn, insertPoint)

    var btnSalir = btn.querySelector('#nav-btn-salir')
    if(btnSalir){
      btnSalir.addEventListener('click', function(e){
        e.stopPropagation()
        localStorage.removeItem('ceramista_sesion')
        sessionStorage.removeItem('yca_sesion')
        window.location.href = prefix + 'login/index.html'
      })
    }

  } // fin init()

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }

})()
