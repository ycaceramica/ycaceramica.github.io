// ============================================================
//  YCA Cerámica — Markdown seguro para el Laboratorio de Materiales
//  Compartido por el administrador (vista previa) y la página pública.
//  Todo el HTML del texto se escapa antes de interpretar el Markdown,
//  así que no se puede inyectar HTML ni scripts.
//
//  Soporta: ## subtítulo · ### sub-subtítulo · **negrita** · *cursiva* ·
//  `código` · listas (- / 1.) · > aviso/cita · --- separador ·
//  [enlace](https://...) · ![pie](imagen de Drive subida desde el admin)
//
//  Uso: LabMarkdown.render(texto)  →  string HTML seguro
// ============================================================
(function (root) {
  'use strict'

  var MAX = 40000
  var IMG_OK  = /^https:\/\/lh3\.googleusercontent\.com\/d\/[A-Za-z0-9_-]+(=w\d{2,4})?$/
  var LINK_OK = /^https?:\/\/[^\s]+$/i

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  // Formato en línea sobre texto YA escapado. Usa marcadores para que el
  // contenido de código, imágenes y enlaces no se vuelva a formatear.
  function inline(texto) {
    var t = esc(texto)
    var guardados = []
    function guardar(html) { guardados.push(html); return '\u0000' + (guardados.length - 1) + '\u0000' }

    t = t.replace(/`([^`]+)`/g, function (m, c) { return guardar('<code>' + c + '</code>') })

    t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (m, alt, url) {
      return IMG_OK.test(url) ? guardar('<img src="' + url + '" alt="' + alt + '" loading="lazy">') : m
    })

    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, txt, url) {
      return LINK_OK.test(url)
        ? guardar('<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + txt + '</a>')
        : m
    })

    t = t.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
    t = t.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>')

    return t.replace(/\u0000(\d+)\u0000/g, function (m, i) { return guardados[+i] })
  }

  function render(texto) {
    var src = String(texto == null ? '' : texto).replace(/\r\n?/g, '\n').substring(0, MAX)
    var lineas = src.split('\n')
    var out = []
    var para = []          // líneas del párrafo actual
    var lista = null       // { tipo: 'ul'|'ol', items: [] }
    var cita = []          // líneas de la cita actual

    function cerrarPara() {
      if (!para.length) return
      var solo = para.length === 1 ? para[0].trim() : ''
      var m = solo.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/)
      if (m && IMG_OK.test(esc(m[2]))) {
        out.push('<figure class="lab-md-fig"><img src="' + esc(m[2]) + '" alt="' + esc(m[1]) + '" loading="lazy">' +
                 (m[1].trim() ? '<figcaption>' + esc(m[1]) + '</figcaption>' : '') + '</figure>')
      } else {
        out.push('<p>' + para.map(inline).join('<br>') + '</p>')
      }
      para = []
    }
    function cerrarLista() {
      if (!lista) return
      out.push('<' + lista.tipo + '>' + lista.items.map(function (i) { return '<li>' + inline(i) + '</li>' }).join('') + '</' + lista.tipo + '>')
      lista = null
    }
    function cerrarCita() {
      if (!cita.length) return
      out.push('<blockquote>' + cita.map(inline).join('<br>') + '</blockquote>')
      cita = []
    }
    function cerrarTodo() { cerrarPara(); cerrarLista(); cerrarCita() }

    for (var i = 0; i < lineas.length; i++) {
      var l = lineas[i], m

      if (/^\s*$/.test(l)) { cerrarTodo(); continue }

      if ((m = l.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/))) {
        cerrarTodo()
        out.push(m[1].length >= 3 ? '<h4>' + inline(m[2]) + '</h4>' : '<h3>' + inline(m[2]) + '</h3>')
        continue
      }
      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l)) { cerrarTodo(); out.push('<hr>'); continue }

      if ((m = l.match(/^>\s?(.*)$/))) { cerrarPara(); cerrarLista(); cita.push(m[1]); continue }

      if ((m = l.match(/^\s*[-*+]\s+(.+)$/))) {
        cerrarPara(); cerrarCita()
        if (!lista || lista.tipo !== 'ul') { cerrarLista(); lista = { tipo: 'ul', items: [] } }
        lista.items.push(m[1]); continue
      }
      if ((m = l.match(/^\s*\d+[.)]\s+(.+)$/))) {
        cerrarPara(); cerrarCita()
        if (!lista || lista.tipo !== 'ol') { cerrarLista(); lista = { tipo: 'ol', items: [] } }
        lista.items.push(m[1]); continue
      }

      cerrarLista(); cerrarCita()
      para.push(l)
    }
    cerrarTodo()
    return out.join('\n')
  }

  var api = { render: render, esc: esc, MAX: MAX }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else root.LabMarkdown = api
})(typeof window !== 'undefined' ? window : this)
