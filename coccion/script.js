// ─────────────────────────────────────────────
// MODO OSCURO
// ─────────────────────────────────────────────

function actualizarIcono(){
  const btn = document.getElementById("toggleDark")
  if(btn) btn.innerText = document.body.classList.contains("dark") ? "☀️" : "🌙"
}

function aplicarModoOscuro(){
  if(localStorage.getItem("dark") === "true") document.body.classList.add("dark")
  actualizarIcono()
}

aplicarModoOscuro()

const toggleDark = document.getElementById("toggleDark")
if(toggleDark){
  toggleDark.addEventListener("click", () => {
    document.body.classList.toggle("dark")
    localStorage.setItem("dark", document.body.classList.contains("dark"))
    actualizarIcono()
  })
}

// ─────────────────────────────────────────────
// MENU HAMBURGUESA
// ─────────────────────────────────────────────

const hamburguesa = document.getElementById("hamburguesa")
const nav         = document.getElementById("nav")

if(hamburguesa){
  hamburguesa.addEventListener("click", () => nav.classList.toggle("active"))
}

document.querySelectorAll(".nav a").forEach(link => {
  link.addEventListener("click", () => nav.classList.remove("active"))
})

window.addEventListener("scroll", () => {
  if(nav) nav.classList.remove("active")
})

// ─────────────────────────────────────────────
// INFO
// ─────────────────────────────────────────────
function toggleInfo(){
  const c = document.getElementById("infoContent")
  const v = c.style.display !== "none"
  c.style.display = v ? "none" : "block"
  document.getElementById("infoChevron").style.transform = v ? "rotate(0deg)" : "rotate(180deg)"
}

// ─────────────────────────────────────────────
// DATOS DE COCCIÓN
// ─────────────────────────────────────────────

const DATOS = {
  baja: {
    nombre: "Arcilla de baja temperatura",
    emoji: "🟡",
    biscocho: {
      tempMax:  900,
      tiempo:   "6-7 hs",
      subida:   "80-100°C/h",
      meseta:   "15-20 min",
      curva: [
        { t: 0,   temp: 20  },
        { t: 1,   temp: 100 },
        { t: 1.5, temp: 100 },
        { t: 2.5, temp: 300 },
        { t: 4,   temp: 600 },
        { t: 5.5, temp: 900 },
        { t: 6,   temp: 900 },
        { t: 7,   temp: 20  }
      ],
      notas: [
        "Subida lenta hasta 120°C para eliminar humedad residual",
        "Entre 200-400°C evitar subidas bruscas (riesgo de rotura)",
        "Temperatura máxima: 900°C — no superar para biscocción",
        "Bajar el horno lentamente, no abrir hasta los 200°C"
      ]
    },
    esmalte: {
      tempMax:  1000,
      tiempo:   "7-8 hs",
      subida:   "100-120°C/h",
      meseta:   "20-30 min",
      curva: [
        { t: 0,   temp: 20   },
        { t: 1.5, temp: 200  },
        { t: 3,   temp: 500  },
        { t: 5,   temp: 800  },
        { t: 6.5, temp: 1000 },
        { t: 7,   temp: 1000 },
        { t: 8,   temp: 20   }
      ],
      notas: [
        "Las piezas deben estar completamente biscocidas y frías",
        "El esmalte se activa entre 800°C y 1000°C",
        "Meseta de 20-30 min para asegurar fusión pareja del esmalte",
        "No abrir el horno hasta los 150°C para evitar craqueo del esmalte"
      ]
    }
  },
  media: {
    nombre: "Arcilla de media temperatura",
    emoji: "🟠",
    biscocho: {
      tempMax:  1000,
      tiempo:   "7-8 hs",
      subida:   "80-100°C/h",
      meseta:   "20 min",
      curva: [
        { t: 0,   temp: 20   },
        { t: 1,   temp: 100  },
        { t: 1.5, temp: 100  },
        { t: 3,   temp: 400  },
        { t: 5,   temp: 700  },
        { t: 6.5, temp: 1000 },
        { t: 7,   temp: 1000 },
        { t: 8,   temp: 20   }
      ],
      notas: [
        "Subida muy lenta hasta 120°C para eliminar toda la humedad",
        "Crítico entre 573°C: inversión del cuarzo — bajar velocidad",
        "Temperatura de biscocción: 950-1000°C",
        "Enfriar lentamente, nunca abrir antes de los 200°C"
      ]
    },
    esmalte: {
      tempMax:  1180,
      tiempo:   "9-10 hs",
      subida:   "100°C/h",
      meseta:   "20-30 min",
      curva: [
        { t: 0,   temp: 20   },
        { t: 2,   temp: 300  },
        { t: 4,   temp: 600  },
        { t: 5.5, temp: 900  },
        { t: 7.5, temp: 1180 },
        { t: 8,   temp: 1180 },
        { t: 10,  temp: 20   }
      ],
      notas: [
        "Cuidado con la inversión del cuarzo a 573°C (subida y bajada)",
        "Entre 1000-1180°C reducir velocidad de subida a 80°C/h",
        "Meseta fundamental para homogeneizar la temperatura en el horno",
        "Bajada: libre hasta 600°C, luego lenta hasta 400°C"
      ]
    }
  },
  alta: {
    nombre: "Arcilla de alta temperatura",
    emoji: "🔴",
    biscocho: {
      tempMax:  1000,
      tiempo:   "8-9 hs",
      subida:   "60-80°C/h",
      meseta:   "20-30 min",
      curva: [
        { t: 0,   temp: 20   },
        { t: 1.5, temp: 100  },
        { t: 2,   temp: 100  },
        { t: 3.5, temp: 350  },
        { t: 5.5, temp: 700  },
        { t: 7.5, temp: 1000 },
        { t: 8,   temp: 1000 },
        { t: 9,   temp: 20   }
      ],
      notas: [
        "Subida muy lenta inicial — arcillas de alta temperatura son densas",
        "Prestar atención a la zona de quema del carbono (400-600°C)",
        "Biscocción a 1000°C — suficiente para consolidar sin vitrificar",
        "Enfriamiento lento obligatorio — no forzar"
      ]
    },
    esmalte: {
      tempMax:  1280,
      tiempo:   "11-12 hs",
      subida:   "80-100°C/h",
      meseta:   "30 min",
      curva: [
        { t: 0,   temp: 20   },
        { t: 2,   temp: 200  },
        { t: 4,   temp: 573  },
        { t: 4.5, temp: 573  },
        { t: 6,   temp: 900  },
        { t: 8.5, temp: 1200 },
        { t: 9.5, temp: 1280 },
        { t: 10,  temp: 1280 },
        { t: 12,  temp: 20   }
      ],
      notas: [
        "Meseta obligatoria a 573°C por la inversión del cuarzo",
        "Subida muy lenta entre 1100°C y 1280°C (máx 50°C/h)",
        "Meseta de 30 min a temperatura máxima para vitrificación pareja",
        "Bajada libre hasta 600°C, muy lenta entre 600°C y 400°C",
        "No abrir el horno antes de los 150°C"
      ]
    }
  },
  porcelana: {
    nombre: "Porcelana",
    emoji: "⚪",
    biscocho: {
      tempMax:  1000,
      tiempo:   "8-9 hs",
      subida:   "50-70°C/h",
      meseta:   "20-30 min",
      curva: [
        { t: 0,   temp: 20   },
        { t: 2,   temp: 100  },
        { t: 2.5, temp: 100  },
        { t: 4,   temp: 350  },
        { t: 6,   temp: 700  },
        { t: 8,   temp: 1000 },
        { t: 8.5, temp: 1000 },
        { t: 9,   temp: 20   }
      ],
      notas: [
        "La porcelana es muy sensible — subida extremadamente lenta inicial",
        "Secado previo fundamental: piezas deben estar completamente secas",
        "Entre 200-400°C riesgo alto de rotura si la subida es brusca",
        "Biscocción a 1000°C — no superar para mantener porosidad",
        "Enfriamiento muy lento — la porcelana es frágil a cambios térmicos"
      ]
    },
    esmalte: {
      tempMax:  1260,
      tiempo:   "10-11 hs",
      subida:   "60-80°C/h",
      meseta:   "20-30 min",
      curva: [
        { t: 0,   temp: 20   },
        { t: 2,   temp: 200  },
        { t: 3.5, temp: 573  },
        { t: 4,   temp: 573  },
        { t: 6,   temp: 900  },
        { t: 8.5, temp: 1200 },
        { t: 9.5, temp: 1260 },
        { t: 10,  temp: 1260 },
        { t: 11,  temp: 20   }
      ],
      notas: [
        "Meseta a 573°C obligatoria por inversión del cuarzo",
        "Subida muy lenta entre 1100°C y 1260°C (máx 40°C/h)",
        "La traslucidez de la porcelana se logra entre 1240°C y 1280°C",
        "Bajada controlada hasta 600°C — riesgo de craqueo en enfriamiento brusco",
        "No abrir el horno antes de los 100°C"
      ]
    }
  }
}

// ─────────────────────────────────────────────
// ESTADO
// ─────────────────────────────────────────────

let arcillaActual = "baja"
let quemaActual   = "biscocho"
let grafico       = null

// ─────────────────────────────────────────────
// SETTERS
// ─────────────────────────────────────────────

function setArcilla(tipo){
  arcillaActual = tipo
  document.querySelectorAll(".arcilla-btn").forEach(b => b.classList.remove("activo"))
  event.currentTarget.classList.add("activo")
  actualizar()
}

function setQuema(tipo){
  quemaActual = tipo
  document.getElementById("btnBiscocho").classList.toggle("activo", tipo === "biscocho")
  document.getElementById("btnEsmalte").classList.toggle("activo",  tipo === "esmalte")
  actualizar()
}

// ─────────────────────────────────────────────
// ACTUALIZAR
// ─────────────────────────────────────────────

function actualizar(){
  const datos = DATOS[arcillaActual][quemaActual]
  const info  = DATOS[arcillaActual]

  // Info cards
  document.getElementById("infoTemp").innerText   = datos.tempMax + "°C"
  document.getElementById("infoTiempo").innerText = datos.tiempo
  document.getElementById("infoSubida").innerText = datos.subida
  document.getElementById("infoMeseta").innerText = datos.meseta

  // Notas
  const lista = document.getElementById("notasList")
  lista.innerHTML = datos.notas.map(n => `<li>${n}</li>`).join("")

  // Subtítulo gráfico
  const quemaNombre = quemaActual === "biscocho" ? "Biscocción" : "Quema de esmalte"
  document.getElementById("graficoSubtitulo").innerText =
    `${info.nombre} — ${quemaNombre}`

  // Gráfico
  dibujarGrafico(datos.curva, datos.tempMax)
}

// ─────────────────────────────────────────────
// GRÁFICO
// ─────────────────────────────────────────────

function dibujarGrafico(curva, tempMax){
  const canvas = document.getElementById("graficoCurva")
  const isDark = document.body.classList.contains("dark")

  const colorTexto  = isDark ? "rgba(255,255,255,0.6)" : "rgba(50,40,30,0.6)"
  const colorGrid   = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"

  // Construir segmentos de color
  const tiempos = curva.map(p => p.t)
  const temps   = curva.map(p => p.temp)
  const maxT    = Math.max(...tiempos)

  // Encontrar índice de la meseta (temp máxima)
  const iMeseta1 = temps.indexOf(tempMax)
  const iMeseta2 = temps.lastIndexOf(tempMax)

  // Colores por segmento
  const segmentColors = temps.map((_, i) => {
    if(i < iMeseta1)  return "#e07b4a"   // subida
    if(i <= iMeseta2) return "#8b6f56"   // meseta
    return "#6b9fd4"                      // bajada
  })

  const labels = tiempos.map(t => t + "h")

  if(grafico) grafico.destroy()

  grafico = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: temps,
        borderColor: "#8b6f56",
        borderWidth: 3,
        pointBackgroundColor: segmentColors,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        backgroundColor: "rgba(139,111,86,0.08)",
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.y}°C`
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Tiempo (horas)",
            color: colorTexto,
            font: { size: 11, weight: "600" }
          },
          ticks: { color: colorTexto },
          grid:  { color: colorGrid }
        },
        y: {
          title: {
            display: true,
            text: "Temperatura (°C)",
            color: colorTexto,
            font: { size: 11, weight: "600" }
          },
          ticks: {
            color: colorTexto,
            callback: v => v + "°C"
          },
          grid: { color: colorGrid },
          min: 0
        }
      }
    }
  })
}

// ─────────────────────────────────────────────
// CARGAR LOGO
// ─────────────────────────────────────────────

function cargarLogoBase64(){
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width  = img.width
      canvas.height = img.height
      canvas.getContext("2d").drawImage(img, 0, 0)
      resolve(canvas.toDataURL("image/png"))
    }
    img.onerror = () => resolve(null)
    img.src = "../imagenes/logo.png"
  })
}

// ─────────────────────────────────────────────
// DESCARGAR PDF
// ─────────────────────────────────────────────

async function descargarPDF(){
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  const W      = 210
  const margen = 18
  let y        = 0

  const MARRON     = [139, 111, 86]
  const MARRON_OSC = [101, 78,  58]
  const GRIS_CLARO = [245, 240, 235]
  const BLANCO     = [255, 255, 255]
  const NEGRO      = [40,  35,  30]
  const NARANJA    = [224, 123, 74]
  const AZUL       = [107, 159, 212]

  const datos    = DATOS[arcillaActual][quemaActual]
  const info     = DATOS[arcillaActual]
  const quemaNom = quemaActual === "biscocho" ? "Biscoccion" : "Quema de esmalte"

  // ── ENCABEZADO ──
  doc.setFillColor(...MARRON)
  doc.rect(0, 0, W, 40, "F")

  const logoBase64 = await cargarLogoBase64()
  if(logoBase64){
    doc.addImage(logoBase64, "PNG", margen, 8, 22, 22)
  }

  doc.setTextColor(...BLANCO)
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("YCA Ceramica", margen + 28, 17)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Calculadora de Coccion", margen + 28, 24)

  doc.setFontSize(8)
  doc.text("instagram: @ycaceramica   |   tiktok: @yca.ceramica   |   youtube: @YCACeramica", margen + 28, 31)

  const fecha = new Date().toLocaleDateString("es-AR", { day:"2-digit", month:"long", year:"numeric" })
  doc.text(`Generado: ${fecha}`, W - margen, 36, { align: "right" })

  y = 50

  // ── TÍTULO FICHA ──
  doc.setFillColor(...GRIS_CLARO)
  doc.roundedRect(margen, y, W - margen * 2, 22, 4, 4, "F")

  doc.setTextColor(...NEGRO)
  doc.setFontSize(15)
  doc.setFont("helvetica", "bold")
  doc.text(info.nombre, margen + 10, y + 9)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 110, 100)
  doc.text(quemaNom, margen + 10, y + 17)

  y += 30

  // ── INFO GRID ──
  const items = [
    { label: "Temperatura maxima", valor: datos.tempMax + "°C" },
    { label: "Tiempo estimado",    valor: datos.tiempo },
    { label: "Subida recomendada", valor: datos.subida },
    { label: "Meseta",             valor: datos.meseta }
  ]

  const colW = (W - margen * 2 - 6) / 2

  items.forEach((item, i) => {
    const x = margen + (i % 2) * (colW + 6)
    if(i % 2 === 0 && i > 0) y += 22

    doc.setFillColor(...BLANCO)
    doc.roundedRect(x, y, colW, 18, 3, 3, "F")
    doc.setDrawColor(...GRIS_CLARO)

    doc.setTextColor(150, 140, 130)
    doc.setFontSize(7)
    doc.setFont("helvetica", "bold")
    doc.text(item.label.toUpperCase(), x + 8, y + 6)

    doc.setTextColor(...MARRON)
    doc.setFontSize(13)
    doc.setFont("helvetica", "bold")
    doc.text(item.valor, x + 8, y + 14)
  })

  y += 28

  // ── GRÁFICO ──
  doc.setFillColor(...GRIS_CLARO)
  doc.roundedRect(margen, y, W - margen * 2, 85, 4, 4, "F")

  doc.setTextColor(...NEGRO)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Curva de coccion", margen + 8, y + 10)

  // Forzar colores claros para captura del gráfico
  const isDarkActual = document.body.classList.contains("dark")
  if(isDarkActual) document.body.classList.remove("dark")
  dibujarGrafico(datos.curva, datos.tempMax)
  await new Promise(r => setTimeout(r, 300))

  // Convertir canvas a imagen
  const canvas    = document.getElementById("graficoCurva")
  const imgData   = canvas.toDataURL("image/png")
  const imgW      = W - margen * 2 - 16
  const imgH      = 65
  doc.addImage(imgData, "PNG", margen + 8, y + 14, imgW, imgH)

  // Leyenda
  const leyY = y + 82
  doc.setFillColor(...NARANJA)
  doc.circle(margen + 12, leyY, 2, "F")
  doc.setTextColor(120, 110, 100)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text("Subida", margen + 16, leyY + 1)

  doc.setFillColor(...MARRON)
  doc.circle(margen + 35, leyY, 2, "F")
  doc.text("Meseta", margen + 39, leyY + 1)

  doc.setFillColor(...AZUL)
  doc.circle(margen + 58, leyY, 2, "F")
  doc.text("Bajada", margen + 62, leyY + 1)

  y += 92

  // ── NOTAS ──
  doc.setFillColor(...GRIS_CLARO)
  const altoNotas = 14 + datos.notas.length * 9
  doc.roundedRect(margen, y, W - margen * 2, altoNotas, 4, 4, "F")

  doc.setFillColor(...MARRON)
  doc.rect(margen, y, 3, altoNotas, "F")

  doc.setTextColor(...NEGRO)
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Notas importantes", margen + 8, y + 8)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(70, 60, 50)

  datos.notas.forEach((nota, i) => {
    doc.text(`• ${nota}`, margen + 8, y + 16 + i * 9)
  })

  // ── PIE ──
  doc.setFillColor(...GRIS_CLARO)
  doc.rect(0, 287, W, 10, "F")
  doc.setTextColor(160, 150, 140)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text("ycaceramica.github.io  |  YCA Ceramica © 2026", W / 2, 293, { align: "center" })

  doc.save(`YCA_Coccion_${info.nombre.replace(/ /g,"_")}.pdf`)

  // Restaurar modo oscuro si corresponde
  if(isDarkActual){
    document.body.classList.add("dark")
    dibujarGrafico(datos.curva, datos.tempMax)
  }
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

actualizar()
