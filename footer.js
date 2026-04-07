// ─────────────────────────────────────────────
// FOOTER — Pie de página global
// Se inyecta en <div id="footer-placeholder"></div>
// Incluir: <script src="/footer.js"></script>
//          (ajustar ruta relativa según profundidad)
// ─────────────────────────────────────────────

(function () {

  var css = `
    #yca-footer {
      background: var(--color-superficie, #ffffff);
      border-top: 1px solid rgba(139, 111, 86, 0.15);
      padding: 28px 24px;
      text-align: center;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    #yca-footer .footer-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      max-width: 900px;
      margin: 0 auto;
    }

    #yca-footer .footer-copy {
      font-size: 13px;
      color: var(--color-texto, #333);
      opacity: 0.6;
      margin: 0;
    }

    #yca-footer .footer-legal {
      font-size: 12px;
    }

    #yca-footer .footer-legal a {
      color: var(--color-primario, #8b6f56);
      text-decoration: none;
      font-weight: 600;
      transition: opacity 0.2s;
    }

    #yca-footer .footer-legal a:hover {
      opacity: 0.75;
    }

    body.dark #yca-footer {
      border-top-color: rgba(177, 138, 109, 0.2);
    }
  `;

  // Inyectar estilos
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // Construir HTML del footer
  var html = `
    <footer id="yca-footer">
      <div class="footer-inner">
        <p class="footer-copy">© 2026 YCA Cerámica — Yo Creo Arte</p>
        <p class="footer-legal">
          <a href="/legal/">Aviso legal y privacidad</a>
        </p>
      </div>
    </footer>
  `;

  // Insertar en el placeholder
  function insertarFooter() {
    var placeholder = document.getElementById('footer-placeholder');
    if (placeholder) {
      placeholder.outerHTML = html;
      return;
    }
    // Fallback: reemplazar <footer> existente si no hay placeholder
    var footerExistente = document.querySelector('footer');
    if (footerExistente) {
      footerExistente.outerHTML = html;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertarFooter);
  } else {
    insertarFooter();
  }

})();
