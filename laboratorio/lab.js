// ============================================================
//  YCA Cerámica — Laboratorio de Materiales (público)
//  /laboratorio/?m=<slug>  → ficha del material
//  /laboratorio/           → listado de materiales
//  (la URL permanente /laboratorio/<slug>/ llega acá desde 404.html)
//  También expone window.LabPublico.renderListado() para reutilizar
//  el listado dentro de la página de Insumos.
// ============================================================
(function () {
  'use strict'

  var API       = 'https://script.google.com/macros/s/AKfycbzdwN7aMQVLT5qxzOPw78Cnyanu4BBkkiCXESmQN2Sx5SklNB-kQq-Xt2SGb0-Dgfv1/exec'
  var WHATSAPP  = '5491160387535'
  var SITE      = 'https://ycaceramica.com.ar'
  var LAB_URL   = SITE + '/laboratorio/'

  // ── Utilidades ─────────────────────────────────────────────

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  // Las fotos viven en Drive (lh3.googleusercontent.com/d/ID). Con el sufijo =wNNN
  // Google entrega la imagen al ancho pedido: una sola foto guardada, versión
  // liviana para el celular y grande para la pantalla.
  function esDrive(u) { return /^https:\/\/lh3\.googleusercontent\.com\/d\//.test(String(u || '')) }
  function imgUrl(u, w) { return esDrive(u) ? String(u).replace(/=w\d+(-[A-Za-z0-9-]+)?$/, '') + '=w' + w : String(u || '') }
  function srcset(u, ws) { return esDrive(u) ? ws.map(function (w) { return imgUrl(u, w) + ' ' + w + 'w' }).join(', ') : '' }

  function imgHTML(u, alt, sizes, ws, extra) {
    if (!u) return ''
    var ss = srcset(u, ws)
    return '<img src="' + esc(imgUrl(u, ws[1] || ws[0])) + '"' + (ss ? ' srcset="' + esc(ss) + '" sizes="' + esc(sizes) + '"' : '') +
      ' alt="' + esc(alt) + '" loading="lazy" decoding="async" data-orig="' + esc(u) + '" data-full="' + esc(imgUrl(u, 1600)) + '"' + (extra || '') + '>'
  }

  // Si el servidor de imágenes no entiende el tamaño pedido, vuelve a la URL original.
  document.addEventListener('error', function (e) {
    var t = e.target
    if (t && t.tagName === 'IMG' && t.dataset && t.dataset.orig && !t.dataset.fallback) {
      t.dataset.fallback = '1'
      t.removeAttribute('srcset')
      t.src = t.dataset.orig
      if (t.dataset.full) t.dataset.full = t.dataset.orig
    }
  }, true)

  function cacheGet(k) { try { var r = JSON.parse(localStorage.getItem('yca_lab_' + k)); return r && r.d ? r.d : null } catch (e) { return null } }
  function cacheSet(k, d) { try { localStorage.setItem('yca_lab_' + k, JSON.stringify({ t: Date.now(), d: d })) } catch (e) {} }
  function cacheDel(k) { try { localStorage.removeItem('yca_lab_' + k) } catch (e) {} }

  function pedir(params) {
    var ctrl = window.AbortController ? new AbortController() : null
    var timer = ctrl ? setTimeout(function () { ctrl.abort() }, 30000) : null
    return fetch(API + '?' + params, ctrl ? { signal: ctrl.signal } : undefined)
      .then(function (r) { return r.json() })
      .then(function (j) { if (timer) clearTimeout(timer); return j },
            function (e) { if (timer) clearTimeout(timer); throw e })
  }

  function setMeta(sel, attr, val) { var el = document.querySelector(sel); if (el) el.setAttribute(attr, val) }

  // ── Visor de fotos ─────────────────────────────────────────

  var grupos = {}
  var lb = { el: null, g: null, i: 0, previo: null, x0: null }

  function lbCrear() {
    if (lb.el) return
    var el = document.createElement('div')
    el.className = 'lab-lb'
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Visor de fotos')
    el.innerHTML = '<button type="button" class="lab-lb-x" aria-label="Cerrar">✕</button>' +
      '<button type="button" class="lab-lb-prev" aria-label="Anterior">‹</button>' +
      '<img class="lab-lb-img" alt="">' +
      '<div class="lab-lb-cap"></div><div class="lab-lb-cont"></div>' +
      '<button type="button" class="lab-lb-next" aria-label="Siguiente">›</button>'
    document.body.appendChild(el)
    lb.el = el
    el.addEventListener('click', function (e) { if (e.target === el) lbCerrar() })
    el.querySelector('.lab-lb-x').addEventListener('click', lbCerrar)
    el.querySelector('.lab-lb-prev').addEventListener('click', function () { lbIr(-1) })
    el.querySelector('.lab-lb-next').addEventListener('click', function () { lbIr(1) })
    el.addEventListener('touchstart', function (e) { lb.x0 = e.touches[0].clientX }, { passive: true })
    el.addEventListener('touchend', function (e) {
      if (lb.x0 == null) return
      var dx = e.changedTouches[0].clientX - lb.x0; lb.x0 = null
      if (Math.abs(dx) > 50) lbIr(dx < 0 ? 1 : -1)
    })
    document.addEventListener('keydown', function (e) {
      if (!lb.el.classList.contains('abierto')) return
      if (e.key === 'Escape') lbCerrar()
      else if (e.key === 'ArrowRight') lbIr(1)
      else if (e.key === 'ArrowLeft') lbIr(-1)
    })
  }

  function lbMostrar() {
    var lista = grupos[lb.g] || []
    var f = lista[lb.i]
    if (!f) return
    lb.el.querySelector('.lab-lb-img').src = f.src
    lb.el.querySelector('.lab-lb-img').alt = f.alt || ''
    lb.el.querySelector('.lab-lb-cap').textContent = f.alt || ''
    lb.el.querySelector('.lab-lb-cont').textContent = lista.length > 1 ? (lb.i + 1) + ' / ' + lista.length : ''
    var multi = lista.length > 1
    lb.el.querySelector('.lab-lb-prev').style.display = multi ? '' : 'none'
    lb.el.querySelector('.lab-lb-next').style.display = multi ? '' : 'none'
    // precarga la siguiente
    if (multi) { var n = lista[(lb.i + 1) % lista.length]; if (n) { var im = new Image(); im.src = n.src } }
  }

  function lbAbrir(g, i) {
    lbCrear()
    lb.g = g; lb.i = i; lb.previo = document.activeElement
    lbMostrar()
    lb.el.classList.add('abierto')
    document.body.style.overflow = 'hidden'
    lb.el.querySelector('.lab-lb-x').focus()
  }

  function lbIr(d) {
    var n = (grupos[lb.g] || []).length
    if (!n) return
    lb.i = (lb.i + d + n) % n
    lbMostrar()
  }

  function lbCerrar() {
    if (!lb.el) return
    lb.el.classList.remove('abierto')
    lb.el.querySelector('.lab-lb-img').removeAttribute('src')
    document.body.style.overflow = ''
    if (lb.previo && lb.previo.focus) lb.previo.focus()
  }

  // ── Estados ────────────────────────────────────────────────

  function estadoHTML(ico, titulo, texto, accion) {
    return '<div class="lab-estado"><div class="lab-estado-ico">' + ico + '</div><h1>' + esc(titulo) + '</h1><p>' + esc(texto) + '</p>' + (accion || '') + '</div>'
  }

  function renderNoDisponible(app) {
    document.title = 'Material no disponible — YCA Cerámica'
    var r = document.querySelector('meta[name="robots"]')
    if (!r) { r = document.createElement('meta'); r.name = 'robots'; document.head.appendChild(r) }
    r.content = 'noindex'
    app.innerHTML = estadoHTML('🧪', 'Este material no está disponible',
      'La ficha que buscás no existe o todavía no fue publicada.',
      '<a class="lab-btn solido" href="/laboratorio/">Ver todos los materiales</a>')
  }

  function renderError(app, reintentar) {
    app.innerHTML = estadoHTML('📡', 'No pudimos cargar la ficha',
      'Revisá tu conexión e intentá de nuevo.', '<button type="button" class="lab-btn solido" id="labReintentar">Reintentar</button>')
    var b = document.getElementById('labReintentar')
    if (b) b.addEventListener('click', function () { app.innerHTML = '<div class="lab-skeleton"><div class="lab-sk lab-sk-t"></div><div class="lab-sk lab-sk-p"></div><div class="lab-sk lab-sk-b"></div></div>'; reintentar() })
  }

  // ── Ficha ──────────────────────────────────────────────────

  function bloquePares(pares) {
    return '<dl class="lab-specs">' + pares.map(function (p) {
      return '<div class="lab-spec"><dt>' + esc(p.etiqueta || '—') + '</dt><dd>' + esc(p.valor) + '</dd></div>'
    }).join('') + '</dl>'
  }

  function seccion(id, n, titulo, cuerpo) {
    return '<section class="lab-seccion" id="' + id + '"><div class="lab-seccion-head"><span class="lab-seccion-n">' + n +
      '</span><h2>' + esc(titulo) + '</h2></div>' + cuerpo + '</section>'
  }

  function muestraHTML(m, idx) {
    var fotos = (m.fotos || []).slice(0, 4)
    var g = 'm' + idx
    grupos[g] = fotos.map(function (u, i) { return { src: imgUrl(u, 1600), alt: m.titulo + (fotos.length > 1 ? ' — foto ' + (i + 1) : '') } })
    var fotosHTML = fotos.length
      ? '<div class="lab-fotos n' + fotos.length + '">' + fotos.map(function (u, i) {
          var grande = fotos.length === 1 || (fotos.length === 3 && i === 0)
          return '<button type="button" class="lab-foto" data-g="' + g + '" data-i="' + i + '" aria-label="Ampliar foto ' + (i + 1) + ' de ' + esc(m.titulo) + '">' +
            imgHTML(u, m.titulo, grande ? '(min-width:860px) 520px, 94vw' : '(min-width:860px) 260px, 47vw', [400, 800, 1200]) + '</button>'
        }).join('') + '</div>'
      : '<div class="lab-sinfotos">📷</div>'

    function dato(titulo, txt, cls) {
      return txt ? '<div class="lab-dato' + (cls ? ' ' + cls : '') + '"><dt>' + titulo + '</dt><dd>' + esc(txt) + '</dd></div>' : ''
    }
    var datos = dato('Descripción', m.descripcion) + dato('Condiciones de la prueba', m.condiciones) +
      dato('Forma de uso / aplicación', m.aplicacion) + dato('Resultado', m.observaciones, 'resultado')

    return '<article class="lab-muestra" id="muestra-' + (idx + 1) + '">' +
      '<div class="lab-muestra-head"><span class="lab-muestra-num">MUESTRA ' + String(idx + 1).padStart(2, '0') + '</span><h3>' + esc(m.titulo) + '</h3></div>' +
      '<div class="lab-muestra-cuerpo">' + fotosHTML + (datos ? '<dl class="lab-datos">' + datos + '</dl>' : '') + '</div></article>'
  }

  function renderFicha(app, pack) {
    var d = pack.data, muestras = pack.muestras || []
    grupos = {}
    var car = d.caracteristicas || [], tec = d.tecnicas || []
    var tieneUso = String(d.formas_uso || '').trim() !== ''
    var tieneTec = tec.length || String(d.precauciones || '').trim()

    // Metadatos de la pestaña
    document.title = d.nombre + ' — Laboratorio de Materiales — YCA Cerámica'
    var resumen = String(d.descripcion || '').replace(/\s+/g, ' ').trim().substring(0, 160) || 'Ficha técnica y pruebas de ' + d.nombre + ' — YCA Cerámica.'
    setMeta('meta[name="description"]', 'content', resumen)
    setMeta('meta[property="og:title"]', 'content', d.nombre + ' — Laboratorio de Materiales — YCA Cerámica')
    setMeta('meta[property="og:description"]', 'content', resumen)
    setMeta('meta[property="og:url"]', 'content', LAB_URL + d.slug + '/')
    setMeta('link[rel="canonical"]', 'href', LAB_URL + d.slug + '/')
    if (d.foto) setMeta('meta[property="og:image"]', 'content', imgUrl(d.foto, 1200))

    // Hero
    grupos.hero = d.foto ? [{ src: imgUrl(d.foto, 1600), alt: d.nombre }] : []
    var hero =
      '<a class="lab-volver" href="/laboratorio/"><i class="fa-solid fa-arrow-left"></i> Laboratorio de Materiales</a>' +
      '<div class="lab-hero">' +
        (d.foto
          ? '<button type="button" class="lab-hero-foto" data-g="hero" data-i="0" aria-label="Ampliar foto de ' + esc(d.nombre) + '">' + imgHTML(d.foto, d.nombre, '(min-width:760px) 420px, 94vw', [500, 900, 1400]).replace('loading="lazy"', 'loading="eager" fetchpriority="high"') + '</button>'
          : '<div class="lab-hero-foto lab-hero-sinfoto">🧪</div>') +
        '<div class="lab-hero-txt">' +
          '<div class="lab-meta">' + (d.codigo ? '<span class="cod">' + esc(d.codigo) + '</span>' : '') + (d.categoria ? '<span>' + esc(d.categoria) + '</span>' : '') + '</div>' +
          '<h1 class="lab-titulo">' + esc(d.nombre) + '</h1>' +
          (d.descripcion ? '<p class="lab-desc">' + esc(d.descripcion) + '</p>' : '') +
          (d.observaciones ? '<div class="lab-aviso"><i class="fa-solid fa-circle-info"></i><div><b>Importante</b>' + esc(d.observaciones) + '</div></div>' : '') +
        '</div>' +
      '</div>'

    // Índice y secciones, numeradas según las que existan
    var secs = [], nav = [], n = 0
    function nueva(id, nombreNav, titulo, cuerpo) {
      n++; nav.push({ id: id, t: nombreNav })
      secs.push(seccion(id, String(n).padStart(2, '0'), titulo, cuerpo))
    }
    if (car.length) nueva('lab-caracteristicas', 'Características', 'Características generales', bloquePares(car))
    if (tieneTec) {
      nueva('lab-tecnica', 'Técnica', 'Características técnicas',
        (tec.length ? bloquePares(tec) : '') +
        (String(d.precauciones || '').trim() ? '<div class="lab-precaucion" style="margin-top:14px"><i class="fa-solid fa-triangle-exclamation"></i><div><b>Precauciones de manipulación</b>' + esc(d.precauciones) + '</div></div>' : ''))
    }
    if (muestras.length) nueva('lab-muestras', 'Pruebas (' + muestras.length + ')', 'Galería de pruebas y muestras',
      '<div class="lab-muestras">' + muestras.map(muestraHTML).join('') + '</div>')
    if (tieneUso) nueva('lab-uso', 'Formas de uso', 'Formas de uso',
      '<div class="lab-md" id="labUsoMd">' + (window.LabMarkdown ? LabMarkdown.render(d.formas_uso) : '<p>' + esc(d.formas_uso) + '</p>') + '</div>')

    var subnav = nav.length > 1
      ? '<nav class="lab-subnav" aria-label="Secciones de la ficha">' + nav.map(function (s) { return '<button type="button" data-ir="' + s.id + '">' + esc(s.t) + '</button>' }).join('') + '</nav>'
      : ''

    var msg = 'Hola! Tengo una consulta sobre ' + d.nombre + (d.codigo ? ' (' + d.codigo + ')' : '') + ' — Laboratorio de Materiales.'
    var cierre =
      '<div class="lab-cierre"><p>¿Querés consultar disponibilidad o resolver una duda sobre este material?</p>' +
      '<div class="lab-cierre-acc">' +
        '<a class="lab-btn solido" href="https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> Consultar por WhatsApp</a>' +
        '<button type="button" class="lab-btn" id="labCopiar"><i class="fa-solid fa-link"></i> Copiar enlace</button>' +
        '<a class="lab-btn" href="/laboratorio/">Ver todos los materiales</a>' +
      '</div></div>'

    app.innerHTML = hero + subnav + secs.join('') + cierre

    // Fotos dentro del texto de «Formas de uso»: también se amplían
    var mdImgs = app.querySelectorAll('#labUsoMd img')
    if (mdImgs.length) {
      grupos.uso = []
      mdImgs.forEach(function (im, i) {
        im.dataset.g = 'uso'; im.dataset.i = i
        grupos.uso.push({ src: imgUrl(im.getAttribute('src'), 1600), alt: im.getAttribute('alt') || '' })
      })
    }
  }

  function bindFicha(app, slug) {
    app.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-g]') : null
      if (t) { lbAbrir(t.dataset.g, parseInt(t.dataset.i, 10) || 0); return }
      var ir = e.target.closest ? e.target.closest('[data-ir]') : null
      if (ir) { var s = document.getElementById(ir.dataset.ir); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' }); return }
      var c = e.target.closest ? e.target.closest('#labCopiar') : null
      if (c) {
        var url = LAB_URL + slug + '/'
        var ok = function () { c.innerHTML = '<i class="fa-solid fa-check"></i> Enlace copiado'; setTimeout(function () { c.innerHTML = '<i class="fa-solid fa-link"></i> Copiar enlace' }, 2200) }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, function () { window.prompt('Copiá el enlace:', url) })
        else window.prompt('Copiá el enlace:', url)
      }
    })
  }

  function cargarFicha(app, slug) {
    var key = 'm_' + slug
    var cache = cacheGet(key)
    var mostrado = null
    if (cache) { renderFicha(app, cache); mostrado = JSON.stringify(cache) }

    pedir('action=getLaboratorioMaterial&slug=' + encodeURIComponent(slug)).then(function (res) {
      if (!res || !res.ok) { cacheDel(key); renderNoDisponible(app); return }
      var pack = { data: res.data, muestras: res.muestras || [] }
      cacheSet(key, pack)
      if (JSON.stringify(pack) !== mostrado) renderFicha(app, pack)
    }).catch(function () {
      if (!cache) renderError(app, function () { cargarFicha(app, slug) })
    })
  }

  // ── Listado ────────────────────────────────────────────────

  function renderListado(cont, opts) {
    opts = opts || {}
    var hrefBase = opts.hrefBase || '/laboratorio/'
    var estado = { q: '', cat: 'todas', items: [] }

    function tarjeta(m) {
      var foto = m.foto ? imgHTML(m.foto, m.nombre, '(min-width:700px) 250px, 46vw', [300, 500, 800]) : '🧪'
      return '<a class="lab-tarjeta" href="' + esc(hrefBase) + '?m=' + encodeURIComponent(m.slug) + '">' +
        '<div class="lab-tarjeta-foto">' + foto + '</div>' +
        '<div class="lab-tarjeta-info">' + (m.categoria ? '<div class="lab-tarjeta-cat">' + esc(m.categoria) + '</div>' : '') +
        '<h3>' + esc(m.nombre) + '</h3>' +
        '<div class="lab-tarjeta-meta"><span>' + esc(m.codigo || '') + '</span>' + (m.muestras ? '<span>· ' + m.muestras + (m.muestras === 1 ? ' prueba' : ' pruebas') + '</span>' : '') + '</div>' +
        '</div></a>'
    }

    function pintarGrid() {
      var q = estado.q.toLowerCase()
      var lista = estado.items.filter(function (m) {
        return (estado.cat === 'todas' || m.categoria === estado.cat) &&
          (!q || (m.nombre + ' ' + (m.categoria || '') + ' ' + (m.codigo || '')).toLowerCase().indexOf(q) >= 0)
      })
      var g = cont.querySelector('.lab-grid')
      g.innerHTML = lista.length ? lista.map(tarjeta).join('') : '<p class="lab-estado-txt" style="grid-column:1/-1;text-align:center">No hay materiales que coincidan.</p>'
    }

    function armar(items) {
      estado.items = items
      if (!items.length) {
        cont.innerHTML = '<div class="lab-estado"><div class="lab-estado-ico">🧪</div><p>Todavía no hay fichas publicadas. Volvé pronto.</p></div>'
        return
      }
      var cats = []
      items.forEach(function (m) { if (m.categoria && cats.indexOf(m.categoria) < 0) cats.push(m.categoria) })
      cont.innerHTML =
        '<div class="lab-buscador"><i class="fa-solid fa-magnifying-glass"></i><input type="search" id="labQ" placeholder="Buscar material..." aria-label="Buscar material"></div>' +
        (cats.length > 1 ? '<div class="lab-filtros"><button type="button" class="lab-filtro activo" data-cat="todas">Todos</button>' +
          cats.map(function (c) { return '<button type="button" class="lab-filtro" data-cat="' + esc(c) + '">' + esc(c) + '</button>' }).join('') + '</div>' : '') +
        '<div class="lab-grid"></div>'
      pintarGrid()
      cont.querySelector('#labQ').addEventListener('input', function (e) { estado.q = e.target.value.trim(); pintarGrid() })
      cont.querySelectorAll('.lab-filtro').forEach(function (b) {
        b.addEventListener('click', function () {
          cont.querySelectorAll('.lab-filtro').forEach(function (x) { x.classList.remove('activo') })
          b.classList.add('activo'); estado.cat = b.dataset.cat; pintarGrid()
        })
      })
    }

    var cache = cacheGet('lista')
    var mostrado = null
    if (cache) { armar(cache); mostrado = JSON.stringify(cache) }
    else cont.innerHTML = '<div class="lab-skeleton"><div class="lab-sk lab-sk-b"></div></div>'

    pedir('action=getLaboratorio').then(function (res) {
      if (!res || !res.ok) throw new Error('x')
      cacheSet('lista', res.data)
      if (JSON.stringify(res.data) !== mostrado) armar(res.data)
    }).catch(function () {
      if (!cache) cont.innerHTML = estadoHTML('📡', 'No pudimos cargar los materiales', 'Revisá tu conexión e intentá de nuevo.', '')
    })
  }

  function cargarListado(app) {
    app.innerHTML = '<div class="lab-listado-head"><h1>Laboratorio de Materiales 🧪</h1>' +
      '<p>Fichas técnicas y pruebas de los materiales que ofrece YCA Cerámica. Si escaneaste el QR de un envase, tu material está en esta lista.</p></div><div id="labListado"></div>'
    renderListado(document.getElementById('labListado'), { hrefBase: '/laboratorio/' })
  }

  // ── Arranque ───────────────────────────────────────────────

  function init() {
    var app = document.getElementById('labApp')
    if (!app) return
    var slug = (new URLSearchParams(location.search).get('m') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 60)
    if (slug) { bindFicha(app, slug); cargarFicha(app, slug) }
    else cargarListado(app)
  }

  window.LabPublico = { renderListado: renderListado, version: 1 }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
