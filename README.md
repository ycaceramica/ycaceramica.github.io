# YCA Cerámica 🏺

Sitio web completo para **YCA Cerámica — Yo Creo Arte**, un taller de cerámica artesanal en Buenos Aires. Incluye catálogo público, sistema de cursos, área de alumnos y panel de administración completo.

🌐 **[ycaceramica.github.io](https://ycaceramica.github.io)**

---

## ¿Qué ofrece este sitio?

- **Catálogo** — Piezas e insumos cerámicos con filtros por categoría
- **Cursos y talleres** — Taller de Cerámica Inicial y Arcilla y Luna, con página de detalle, formulario de inscripción y gestión de estado
- **Calculadoras** — Yeso, engobes y cocción con historial y exportación a PDF
- **Elaboración** — Proceso artesanal paso a paso con fotos del taller
- **Galería** — Fotos gestionadas desde el panel admin
- **Novedades** — Formulario de suscripción con envío de emails masivos
- **Área de alumnos** — Apuntes, multimedia y cambio de contraseña
- **Panel admin** — Gestión completa del sitio sin tocar código

---

## Panel de administración

Accesible en `/admin/` con usuario y contraseña. Incluye:

- **Catálogo público** — Piezas, insumos, galería del index, elaboración
- **Inventarios privados** — Moldes y cualquier inventario personalizado
- **Alumnos** — Cursos, usuarios, apuntes, multimedia
- **Comunicación** — Lista de suscriptores y envío de emails masivos con imagen y PDF

---

## Área de alumnos

Accesible en `/login/` con email y contraseña. Permite:

- Ver apuntes y materiales del curso
- Ver galería multimedia (fotos y videos)
- Cambiar contraseña
- Recuperar contraseña por email

---

## Stack técnico

- **Frontend** — HTML5, CSS3, JavaScript vanilla
- **Backend** — Google Apps Script (API REST)
- **Base de datos** — Google Sheets
- **Archivos** — Google Drive
- **Hosting** — GitHub Pages
- **Tipografía** — Plus Jakarta Sans
- **Íconos** — Font Awesome 6

---

## Estructura del proyecto

```
ycaceramica.github.io/
├── index.html / style.css / script.js
├── admin/               # Panel de administración
├── login/               # Login y registro de alumnos
├── mi-cuenta/           # Área de alumnos
├── cursos/              # Listado y detalle de cursos
│   ├── taller-inicial/
│   ├── arcilla-y-luna/
│   └── detalle.html     # Página genérica para cursos nuevos
├── calculadora/         # Calculadora de yeso
├── engobes/             # Calculadora de engobes
├── coccion/             # Calculadora de cocción
├── elaboracion/         # Proceso artesanal
├── herramientas/        # Herramientas para ceramistas
├── cumpleanos/          # Cumpleaños en el taller
└── imagenes/            # Recursos visuales
```

---

*Made with 🤍 in Buenos Aires*

> **English summary:** YCA Cerámica is a handmade ceramics studio in Buenos Aires, Argentina. This site includes a public catalog, course system, student area, and a full admin panel — all powered by Google Apps Script and Sheets, hosted on GitHub Pages.
