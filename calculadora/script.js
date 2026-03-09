// MODO OSCURO — recuerda la preferencia del usuario

function aplicarModoOscuro(){
  if(localStorage.getItem("dark") === "true"){
    document.body.classList.add("dark")
  }
}

aplicarModoOscuro()

const toggleDark = document.getElementById("toggleDark")

if(toggleDark){
  toggleDark.addEventListener("click", () => {
    document.body.classList.toggle("dark")
    localStorage.setItem("dark", document.body.classList.contains("dark"))
  })
}



// MENU HAMBURGUESA

const hamburguesa = document.getElementById("hamburguesa")
const nav = document.getElementById("nav")

if(hamburguesa){
  hamburguesa.addEventListener("click", () => {
    nav.classList.toggle("active")
  })
}

const linksNav = document.querySelectorAll(".nav a")

linksNav.forEach(link => {
  link.addEventListener("click", () => {
    nav.classList.remove("active")
  })
})



// CAMBIAR TIPO DE MOLDE

function cambiarTipo(){

  var tipo = document.getElementById("tipoMolde").value

  document.getElementById("rectangular").style.display =
    tipo == "rectangular" ? "block" : "none"

  document.getElementById("circular").style.display =
    tipo == "circular" ? "block" : "none"

}



// CALCULAR (fórmulas sin modificar)

function calcular(){

  var tipo       = document.getElementById("tipoMolde").value
  var cantidad   = document.getElementById("cantidad").value || 1
  var proporcion = document.getElementById("proporcion").value

  var volumen = 0

  if(tipo == "rectangular"){

    var largo       = document.getElementById("largo").value || 0
    var ancho       = document.getElementById("ancho").value || 0
    var profundidad = document.getElementById("profundidad").value || 0

    volumen = (largo * ancho * profundidad) / 1.3

  } else {

    var rp = document.getElementById("radioPieza").value || 0
    var rm = document.getElementById("radioMolde").value || 0
    var ap = document.getElementById("alturaPieza").value || 0
    var am = document.getElementById("alturaMolde").value || 0

    var volumenMolde = Math.PI * rm * rm * am
    var volumenPieza = Math.PI * rp * rp * ap

    volumen = (volumenMolde - volumenPieza) / 1.3

  }

  var agua = volumen * cantidad
  var yeso = (agua * 100) / proporcion

  document.getElementById("agua").innerText = agua.toFixed(2)
  document.getElementById("yeso").innerText = yeso.toFixed(2)

}



// COPIAR RESULTADO

function copiar(){

  var agua  = document.getElementById("agua").innerText
  var yeso  = document.getElementById("yeso").innerText
  var texto = "Agua " + agua + " ml | Yeso " + yeso + " g"

  navigator.clipboard.writeText(texto)
  alert("Resultado copiado")

}



// GUARDAR EN HISTORIAL

function guardar(){

  var agua  = document.getElementById("agua").innerText
  var yeso  = document.getElementById("yeso").innerText

  var h     = document.getElementById("historial")
  var linea = document.createElement("div")

  linea.innerText = "Agua " + agua + " ml | Yeso " + yeso + " g"

  h.appendChild(linea)

}



// LIMPIAR CAMPOS

function limpiar(){

  document.querySelectorAll("input").forEach(i => i.value = "")

  document.getElementById("agua").innerText = 0
  document.getElementById("yeso").innerText = 0

}
