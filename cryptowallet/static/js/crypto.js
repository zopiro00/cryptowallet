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
            // Esta línea es para que añada los datos a la parte de modificar cuando se le indique.
            fila.addEventListener("click", () => detallaMovimiento(movimiento.id))
            
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

xhr = new XMLHttpRequest()

function access_database() {
    xhr.open("GET", `http://localhost:5000/api/v1/movimientos`, true)
    xhr.onload = muestraMovimientos
    xhr.send()
}

window.onload = function() {
    access_database()

    document.querySelector("#calcular")
    .addEventListener("click", (evento) => {
        evento.preventDefault()
        const consulta = {}
        consulta.moneda_from = document.querySelector("#moneda_from").value
        consulta.cantidad_from = document.querySelector("#cantidad_from").value
        consulta.moneda_to = document.querySelector(".moneda_to").value
        consulta.cantidad_to = document.querySelector("#cantidad_to").value

        xhr.open("GET", `https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount=${consulta.cantidad_from}&symbol=${consulta.moneda_from}&convert=${consulta.moneda_to}&CMC_PRO_API_KEY=${KEY}`)
    })
}