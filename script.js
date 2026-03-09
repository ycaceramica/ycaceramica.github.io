// BOTON MODO OSCURO

const toggleDark = document.getElementById("toggleDark")

if(toggleDark){

  toggleDark.addEventListener("click",()=>{

    document.body.classList.toggle("dark")

  })

}



// MENU HAMBURGUESA

const hamburguesa = document.getElementById("hamburguesa")
const nav = document.getElementById("nav")

if(hamburguesa){

  hamburguesa.addEventListener("click",()=>{

    nav.classList.toggle("active")

  })

}

// Cerrar el menú al tocar un link (útil en móvil)
const linksNav = document.querySelectorAll(".nav a")

linksNav.forEach(link => {

  link.addEventListener("click", () => {

    nav.classList.remove("active")

  })

})



// ANIMACION SCROLL

function reveal(){

  const reveals = document.querySelectorAll(".reveal")

  for(let i = 0; i < reveals.length; i++){

    const windowHeight = window.innerHeight

    const elementTop = reveals[i].getBoundingClientRect().top

    const elementVisible = 80

    if(elementTop < windowHeight - elementVisible){

      reveals[i].classList.add("visible")

    }

  }

}



window.addEventListener("scroll", reveal)
window.addEventListener("load", reveal)

reveal()
