// ─────────────────────────────────────────────
// NAV CERAMISTA
// Detecta sesión activa y agrega avatar en el nav
// Se incluye en todas las páginas públicas
// No hace nada si no hay sesión
// ─────────────────────────────────────────────

(function(){
  // Leer sesión del localStorage
  var sesion = null
  try {
    sesion = JSON.parse(localStorage.getItem('ceramista_sesion') || 'null')
  } catch(e) {}

  if(!sesion || !sesion.token) return  // Sin sesión → no hacer nada

  // Detectar profundidad de carpeta para armar los paths correctos
  var path     = window.location.pathname
  var segments = path.split('/').filter(Boolean)
  // En GitHub Pages: /calculadora/index.html → 1 nivel
  // /cursos/arcilla-y-luna/index.html → 2 niveles
  // /index.html → raíz (0 niveles)
  var depth = segments.length > 0 ? segments.length - 1 : 0
  // Si termina en .html, el depth es la cantidad de carpetas
  if(path.endsWith('/') || path.endsWith('.html')){
    depth = segments.length - (path.endsWith('.html') ? 1 : 0)
  }
  var prefix = depth === 0 ? '' : depth === 1 ? '../' : '../../'

  var tallerUrl = prefix + 'mi-taller/index.html'
  var loginUrl  = prefix + 'login/index.html'
  var nombre    = sesion.nombre || 'Mi taller'
  var inicial   = nombre[0].toUpperCase()

  // Insertar estilos si no están ya
  if(!document.getElementById('ceramista-nav-styles')){
    var style = document.createElement('style')
    style.id  = 'ceramista-nav-styles'
    style.textContent = [
      '.ceramista-nav-btn{position:relative;display:flex;align-items:center;gap:8px;background:none;border:none;cursor:pointer;padding:0;font-family:inherit;}',
      '.ceramista-nav-avatar{width:32px;height:32px;min-width:32px;min-height:32px;border-radius:50%;background:var(--color-primario);color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;border:2px solid white;box-sizing:border-box;}',
      '.ceramista-nav-nombre{font-size:14px;font-weight:700;color:var(--color-texto);max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.ceramista-nav-menu{position:absolute;top:calc(100% + 10px);right:0;background:var(--color-superficie);border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.15);padding:8px;min-width:180px;z-index:1000;display:none;flex-direction:column;gap:4px;}',
      '.ceramista-nav-btn.abierto .ceramista-nav-menu{display:flex;}',
      '.ceramista-nav-menu a,.ceramista-nav-menu button{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;font-family:inherit;font-size:14px;font-weight:600;color:var(--color-texto);text-decoration:none;background:none;border:none;cursor:pointer;width:100%;text-align:left;transition:background 0.15s;}',
      '.ceramista-nav-menu a:hover,.ceramista-nav-menu button:hover{background:rgba(139,111,86,0.1);color:var(--color-primario);}',
      '.ceramista-nav-menu-sep{height:1px;background:rgba(139,111,86,0.15);margin:4px 0;}',
      '.ceramista-nav-menu .salir{color:#c85028;}',
      '.ceramista-nav-menu .salir:hover{background:rgba(200,80,40,0.08);color:#c85028;}',
      '@media(max-width:768px){.ceramista-nav-nombre{display:none;}.ceramista-nav-menu{right:auto;left:0;}}'
    ].join('\n')
    document.head.appendChild(style)
  }

  // Crear el botón con avatar y menú desplegable
  var btn = document.createElement('button')
  btn.className = 'ceramista-nav-btn'
  btn.setAttribute('aria-label', 'Mi taller')
  btn.innerHTML = [
    '<div class="ceramista-nav-avatar">' + inicial + '</div>',
    '<span class="ceramista-nav-nombre">' + nombre + '</span>',
    '<div class="ceramista-nav-menu">',
      '<a href="' + tallerUrl + '">',
        '<i class="fa-solid fa-store"></i> Mi taller',
      '</a>',
      '<div class="ceramista-nav-menu-sep"></div>',
      '<button class="salir" onclick="cerrarSesionCeramista()">',
        '<i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión',
      '</button>',
    '</div>'
  ].join('')

  // Toggle del menú al hacer clic
  btn.addEventListener('click', function(e){
    e.stopPropagation()
    btn.classList.toggle('abierto')
  })

  // Cerrar menú al hacer clic fuera
  document.addEventListener('click', function(){
    btn.classList.remove('abierto')
  })

  // Insertar antes del toggleDark
  var toggleDark = document.getElementById('toggleDark')
  if(toggleDark && toggleDark.parentNode){
    toggleDark.parentNode.insertBefore(btn, toggleDark)
  }

  // Función global para cerrar sesión
  window.cerrarSesionCeramista = function(){
    localStorage.removeItem('ceramista_sesion')
    sessionStorage.removeItem('yca_sesion')
    window.location.href = loginUrl
  }
})()
