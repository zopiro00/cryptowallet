const divisas = {
    EUR: "Euro(EUR)",
    BTC: "Bitcoin(BTC)",
    ETH: "Ethereum(ETH)",
    DOGE: "Dodgecoin(DOGE)",
    BNB: "Binance(BNB)",
    ADA: "Cardano(ADA",
    USDT: "Tether(USDT)"
}

let losMovimientos



// Pide al servidor que muestre los movimientos en Pantalla.
function muestraMovimientos() {
    if (this.readyState === 4 && this.status === 200) {
        const respuesta = JSON.parse(this.responseText)
        
        if (respuesta.status !== "success") {
            alert ("Error en la consulta de movimientos")
            return
        }

        losMovimientos = respuesta.movimientos

        const tbody= document.querySelector("#movimientos tbody")

        for (let i=0; i < respuesta.movimientos.length; i++) {
            const movimiento = respuesta.movimientos[i]
            const fila = document.createElement("tr")
            
            const dentro = `
                <td>${movimiento.fecha}</td>
                <td>${movimiento.hora}</td>
                <td>${movimiento.from ? divisas[movimiento.from] : "" }</td>
                <td>${movimiento.cantidad_from}</td>
                <td>${movimiento.to ? divisas[movimiento.to] : "" }</td>
                <td>${movimiento.cantidad_to}</td>`
            fila.innerHTML = dentro
            tbody.appendChild(fila)
        }
    }
}

// Obtiene los movimientos a partir del servidor (el nuestro)
xhr = new XMLHttpRequest()

function access_database() {
    xhr.open("GET", `http://localhost:5000/api/v1/movimientos`, true)
    xhr.onload = muestraMovimientos
    xhr.send()
}

function respuestaApi() {
    if (this.readyState === 4 && this.status === 200) {
        console.log(this.responseText)
        const respuesta = JSON.parse(this.responseText)

        if(respuesta.Response === 'False') {
            alert("Error al consultar el valor actual. Vuelva a intentarlo.")
            return
        }
        // incluir el valor de la moneda en el form
        moneda = document.querySelector("#moneda_to").value
        cantidad_to = document.querySelector("#cantidad_to")
        quote =  respuesta.data.quote[moneda].price
        cantidad_to.setAttribute("placeholder",quote)

        // Cambio los botones inferiores.
        botonera = document.querySelector("#botonera")
        botonera.innerHTML = ""
        boton_aceptar = document.createElement("button")
        boton_aceptar.setAttribute("id", "aceptar")
        boton_aceptar.innerHTML = "Aceptar"
        boton_cancelar = document.createElement("button")
        boton_cancelar.setAttribute("id", "cancelar")
        boton_cancelar.setAttribute("class", "inverse")
        boton_cancelar.innerHTML ="Cancelar"
        botonera.appendChild(boton_aceptar)
        botonera.appendChild(boton_cancelar)

    }
}

// Lo que ocurre cuando el movimiento se ha subido
function nuevo_movimiento() {
    if (this.readyState === 4 && this.status === 200) {
        const respuesta = JSON.parse(this.responseText)
        
        if (respuesta.status !== "success") {
            alert ("La compra no ha podido realizarse.")
            return
        }
    }
}

xhr_calc = new XMLHttpRequest()
xhr_aceptar = new XMLHttpRequest

window.onload = function() {
    access_database()

    //funcion asincrona, lo que va a pasar cuando la api externa responda
    xhr_calc.onload = respuestaApi
    //Lo que ocurre al apretar el botón calcular.
    document.querySelector("#calcular")
    .addEventListener("click", (evento) => {
        evento.preventDefault()
        const consulta = {}
        consulta.moneda_from = document.querySelector("#moneda_from").value
        consulta.cantidad_from = document.querySelector("#cantidad_from").value
        consulta.moneda_to = document.querySelector("#moneda_to").value

        xhr_calc.open("GET", `https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount=${consulta.cantidad_from}&symbol=${consulta.moneda_from}&convert=${consulta.moneda_to}&CMC_PRO_API_KEY=8b1effc1-2b33-494f-9985-03360eb3e35c`)
        xhr_calc.send()
        console.log("peticion enviada.")
    })
    document.querySelector("#cancelar")
    .addEventListener("click", () => {
        // Restablecer formulario

        botonera = document.querySelector("#botonera")
        botonera.innerHTML = ""
        boton_cancular = document.createElement("button")
        boton_calcular.setAttribute("id", "calcular")
        boton_calcular.innerHTML = "Calcular"
        boton_calcular.setAttribute("class", "inverse")
        botonera.appendChild(boton_calcular)

        cantidad_to = document.querySelector("#cantidad_to")
        cantidad_to.setAttribute("placeholder", "pulse calcular para mostrar")


    })
    xhr_aceptar.onload = nuevo_movimiento

    document.querySelector("#aceptar")
    .addEventListener("click", () => {
        xhr_aceptar.open("POST", "api/v1/movimiento")

        xhr_aceptar.send()

    })
}