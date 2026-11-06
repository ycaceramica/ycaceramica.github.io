// ============================================================
//  Insumos → subsección «Laboratorio de Materiales»
//  Agrega una segunda vista a la página de Insumos con el listado de
//  fichas publicadas (las crea el admin). No toca el catálogo: solo
//  muestra u oculta su contenedor (#insumosCatalogo).
//  Depende de ../laboratorio/lab.js (window.LabPublico).
// ============================================================
(function () {
  'use strict'

  var TITULO_CATALOGO = document.title
  var TITULO_LAB      = 'Laboratorio de Materiales — Insumos — YCA Cerámica'

  // Estilos propios (mismo criterio que el nav, que inyecta los suyos)
  var css = document.createElement('style')
  css.textContent =
    '.ins-tabs{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin:-14px 0 28px}' +
    '.ins-tab{padding:10px 22px;border-radius:30px;border:2px solid var(--color-primario);background:transparent;color:var(--color-primario);font-family:"Plus Jakarta Sans",sans-serif;font-size:14.5px;font-weight:700;cursor:pointer;transition:.2s}' +
    '.ins-tab:hover,.ins-tab.activo{background:var(--color-primario);color:#fff}' +
    '.ins-lab-intro{text-align:center;max-width:600px;margin:0 auto 26px;opacity:.72;line-height:1.6;font-size:15px}'
  document.head.appendChild(css)

  function init() {
    var tabs = document.getElementById('insTabs')
    var tabCat = document.getElementById('insTabCatalogo')
    var tabLab = document.getElementById('insTabLab')
    var panelCat = document.getElementById('insumosCatalogo')
    var panelLab = document.getElementById('insumosLaboratorio')
    var listado = document.getElementById('insumosLabListado')
    if (!tabs || !tabCat || !tabLab || !panelCat || !panelLab || !listado || !window.LabPublico) return

    var visible = false
    function mostrarTabs() { if (!visible) { visible = true; tabs.style.display = '' } }

    function ver(lab) {
      panelCat.style.display = lab ? 'none' : ''
      panelLab.style.display = lab ? '' : 'none'
      tabCat.classList.toggle('activo', !lab); tabCat.setAttribute('aria-selected', String(!lab))
      tabLab.classList.toggle('activo', lab);  tabLab.setAttribute('aria-selected', String(lab))
      document.title = lab ? TITULO_LAB : TITULO_CATALOGO
    }

    function irA(lab) {
      ver(lab)
      try { history.replaceState(null, '', lab ? '#laboratorio' : location.pathname + location.search) } catch (e) {}
    }

    tabCat.addEventListener('click', function () { irA(false) })
    tabLab.addEventListener('click', function () { irA(true) })
    window.addEventListener('hashchange', function () { var l = location.hash === '#laboratorio'; if (l) mostrarTabs(); ver(l) })

    // Si llegan con #laboratorio (QR, enlace compartido, botón «volver» de una ficha) se abre directo
    if (location.hash === '#laboratorio') { mostrarTabs(); ver(true) }

    // El listado se pide una vez (con caché local) y define si la pestaña se muestra:
    // con fichas publicadas aparece; si todavía no hay ninguna, la sección queda oculta.
    LabPublico.renderListado(listado, {
      hrefBase: '/laboratorio/',
      onListo: function (items) { if (items && items.length) mostrarTabs() },
      onError: mostrarTabs
    })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
