

import { divisas, COINMARKET_KEY, servidor} from "./modules/config.js"

const decimales = 4

var losMovimientos
var inv
var quote

function reset(query) {
    document.querySelector(query).innerHTML = ""
    
}

function ahora() {
    var d = new Date()
    var sd = d.toISOString()
    const hoy = {}
    hoy.hora = sd.slice(11,19)
    hoy.fecha = sd.slice(0,10)

    return hoy
}
function ocultar(operador) {
    var o = document.querySelector(operador)
    o.setAttribute("class", "hidden")
}
function mostrar(operador) {
    var b = document.querySelector(operador)
    b.removeAttribute("class")
    b.setAttribute("class", "inverse")
}

function validar(consulta) {
    var validado = true
    var error
    if (Number(consulta.cantidad_from) == NaN) {
        error = document.createElement("div")
        error.setAttribute("class","card error")
        error.innerHTML = "<div class='section'><span class='closebtn'>&times;</span> Sólo de aceptan carácteres numéricos en el campo cantidad.</div>"
        document.querySelector("#errores").appendChild(error)
        var cruz = document.querySelector(".closebtn")
        cruz.addEventListener("click", ()=> {
        cruz.parentElement.parentElement.style.display='none'
        })
        validado = false 
    }
    if (consulta.moneda_from == consulta.moneda_to) {
        error = document.createElement("div")
        error.setAttribute("class","card error")
        error.innerHTML = "<div class='section'><span class='closebtn'>&times;</span> Las divisas deben ser distintas</div>"
        document.querySelector("#errores").appendChild(error)
        cruz = document.querySelector(".closebtn")
        cruz.addEventListener("click", ()=> {
        cruz.parentElement.parentElement.style.display='none'
        })
        validado = false 
    }
    if (consulta.moneda_from != "EUR") {
        if (consulta.moneda_from in inv.cryptos) {
            /*Este valor da error si no está definida la moneda por eso el if superior. */
            var saldo = inv.cryptos[consulta.moneda_from].total
            if (consulta.cantidad_from > saldo) {
                validado = false

                /*Este código tan feo y largo es el mensaje de error de que falta saldo */
                error = document.createElement("div")
                error.setAttribute("class","card error")
                error.innerHTML = "<div class='section'><span class='closebtn'>&times;</span> No tienes suficiente saldo</div>"
                document.querySelector("#errores").appendChild(error)
                cruz = document.querySelector(".closebtn")
                cruz.addEventListener("click", ()=> {
                cruz.parentElement.parentElement.style.display='none'
                })
            } 
        } else {
            validado = false

            /*Este código tan feo y largo es el mensaje de error de que falta saldo */
            error = document.createElement("div")
            error.setAttribute("class","card error")
            error.innerHTML = "<div class='section'><span class='closebtn'>&times;</span> No tienes suficiente saldo</div>"
            document.querySelector("#errores").appendChild(error)
            cruz = document.querySelector(".closebtn")
            cruz.addEventListener("click", ()=> { cruz.parentElement.parentElement.style.display='none'})
        }
    }
    
    if (consulta.cantidad_from >  1000000000 || consulta.cantidad_from < 0.00000001) { 
        error = document.createElement("div")
        error.setAttribute("class","card error")
        error.innerHTML = "<div class='section'><span class='closebtn'>&times;</span>La cantidad debe estar comprendida entre 1e+8 y 1e-8</div>"
        document.querySelector("#errores").appendChild(error)
        validado = false
    }
    return validado
}

function formatN(cadena,s = ".",f = 8,d = 4) {
    var a = cadena.toString().split(s)
    var fl = a[0].length
    a[1] ? a[1] : a[1] = "00"
    var dl = a[1].length 
    if (fl > f) {var fstr = a[0].slice(f-fl)} else {var fstr = "&nbsp;".repeat(f-fl).concat(a[0])}
    if (dl > d) {var dstr = a[1].slice(0,d-dl)} else {var dstr = a[1].concat(" ".repeat(Math.abs(d-dl)))}
    var aFormat =  fstr + "." + dstr
    return aFormat
}

function desplegable (nombre, objeto) {
    const selector = document.querySelector(nombre)
    for (const i in objeto) {
        var option = document.createElement("option")
        option.setAttribute("value", i)
        option.innerHTML = objeto[i]
        selector.appendChild(option)
    }
}
////////////////////////////////////////////////////////////////////////////////
/* Hasta Aquí las funciones comunes o utilidades para el código */
///////////////////////////////////////////////////////////////////////////////

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
        tbody.innerHTML = ""
        for (let i=0; i < respuesta.movimientos.length; i++) {
            const movimiento = respuesta.movimientos[i]
            const fila = document.createElement("tr")
            let s 
            let f
            let d
            const dentro = `
                <td class="f1">${movimiento.fecha}</td>
                <td class="f1">${movimiento.hora}</td>
                <td class="f2">${movimiento.moneda_from ? divisas[movimiento.moneda_from] : "" }</td>
                <td class="f3">${formatN(movimiento.cantidad_from)}</td>
                <td class="f2">${movimiento.moneda_to ? divisas[movimiento.moneda_to] : "" }</td>
                <td class="f3">${formatN(movimiento.cantidad_to,s = ".", f=8, d=4)}</td>`
            fila.innerHTML = dentro
            tbody.appendChild(fila)
        }
    }
}

// Consultar estatus de la inversión
function muestraStatus() {
    if (this.readyState === 4 && this.status === 400) {
        const estado = JSON.parse(this.responseText)
        
        alert (`No se ha podido consultar el estado de la inversión. Existe este problema: ${estado.mensaje}`)
        console.log("falla la funcion status")
        return
    }

    if (this.readyState === 4 && this.status === 200) {
        const estado = JSON.parse(this.responseText)
        
        if (estado.status !== "success") {
            alert (`No se ha podido consultar el estado de la inversión. Existe este problema: ${estado.mensaje}`)
            console.log("falla la funcion status")
            return
        }
        reset("#cotiza")
        reset("#uni_status tbody")

        inv = estado.data
        document.querySelector("#d_invertido").innerHTML = `${formatN(inv.EUR.total)} €`
        document.querySelector("#d_actual").innerHTML = `${formatN(inv.valor_crypto)} €`
        document.querySelector("#d_resultado").innerHTML = `${formatN(inv.resultado)} €`
        document.querySelector("#fecha").innerHTML = `<h6><strong>Fecha:</strong> ${ahora().fecha}<br><strong>Hora:</strong> ${ahora().hora}</h6>`

        
        for (const i in inv.cryptos) {
            const fila = document.createElement("tr")
            fila.innerHTML =`<td class="f1">${i}</td>
                            <td class="f2">${formatN(inv.cryptos[i].total)}</td>
                            <td class="f2">${formatN(inv.cryptos[i].total_eur)}</td>`
            const uni_status = document.querySelector("#uni_status tbody")
            uni_status.appendChild(fila)
            mostrar("#uni_status")
            document.querySelector("#uni_status").setAttribute("class","hoverable")
            fila.addEventListener("click", () => {access_database(i)})
        }
        var cotiza = inv.uniCrypto
        var cotiza_old = inv.oldUniCrypto

        for (const i in cotiza) {
            const div = document.createElement("div")
            div.setAttribute("class", "col-sm")
            const card = document.createElement("div")
            card.setAttribute("class", "card fluid")

            if (cotiza[i] > cotiza_old[i].valor) {
                var flecha = "&uarr;"
                var color = "green"
            } else if (cotiza[i] = cotiza_old[i].valor) {
                var flecha = "&harr;"
                var color = "white"
            } else {
                var flecha = "&darr;"
                var color = "red"
            }
            var porcentaje = ((cotiza[i] - cotiza_old[i].valor) / cotiza_old[i].valor *100).toFixed(1)
            if (porcentaje > 0) {
                porcentaje = `+${porcentaje}`}

            card.innerHTML = `<div class="section">
                                <h4 class="doc ${color}">${i} (${porcentaje}%)</h4>
                                <p class="doc ${color}">${flecha} ${cotiza[i].toFixed(decimales)}€ </p>
                                <h6 class="doc">${cotiza_old[i].valor.toFixed(decimales)}€</h6>
                              </div>`
            div.appendChild(card)
            document.querySelector("#cotiza").appendChild(div)
            cotiza_old[i] = cotiza[i]
        }
    }
}

// Obtiene los movimientos a partir del servidor (el nuestro)
const xhr = new XMLHttpRequest()
function access_database(crypto = undefined) {
    if (crypto == undefined) {
        xhr.open("GET", `http://${servidor}/api/v1/movimientos`, true)
    }
    else {
        xhr.open("GET", `http://${servidor}/api/v1/movimientos/${crypto}`, true)
    }
    
    
    xhr.onload = muestraMovimientos
    xhr.send()
}

//Obtiene el valor de la inversión actual consultando a la api externa.
const xhr_status = new XMLHttpRequest()
function access_status() {
    xhr_status.open("GET", `http://${servidor}/api/v1/status`, true)
    xhr_status.onload = muestraStatus
    xhr_status.send()
}

//Gestiona la respuesta de la API, incluye el valor recibido y cambia los botones permitiendo grabar el movimiento.
function respuestaApi() {
    
    if (this.readyState === 4 && this.status === 400) {
        const estado = JSON.parse(this.responseText)
        
        alert (`No se ha podido consultar el estado de la inversión. Existe este problema: ${estado.mensaje}`)
        console.log("falla la funcion status")
        return
    }

    if (this.readyState === 4 && this.status === 200) {
        console.log(this.responseText)
        const respuesta = JSON.parse(this.responseText)

        if(respuesta.Response === 'False') {
            alert("Error al consultar el valor actual. Vuelva a intentarlo.")
            return
        }
        // incluir el valor de la moneda en el form
        var moneda = document.querySelector("#moneda_to").value
        var cantidad_to = document.querySelector("#cantidad_to")
        // codigo alternativo: var quote = respuesta.mensaje.data.quote[moneda].price
        var quote =  respuesta.mensaje
        cantidad_to.setAttribute("placeholder",quote)

        // Cambio los botones inferiores.
        ocultar("#calcular")
        mostrar("#aceptar")
        mostrar("#cancelar")

    }
}

// Lo que ocurre cuando el movimiento se ha subido
function nuevo_movimiento() {
    if (this.readyState === 4 && this.status === 404) {
        const respuesta = JSON.parse(this.responseText)
        alert (`${respuesta.mensaje}`)
        console.log("los datos introducidos no son válidos")
        return
    }

    if (this.readyState === 4 && this.status === 200) {
        const respuesta = JSON.parse(this.responseText)
        
        if (respuesta.status !== "success") {
            alert ("La compra no ha podido realizarse.")
            return
        }
    }
    access_database()
    access_status()
}

const xhr_calc = new XMLHttpRequest()
const xhr_aceptar = new XMLHttpRequest

// Lo que ocurre al cargar la página.
window.onload = function() {
    access_database()
    access_status()
    desplegable("#moneda_from",divisas)
    desplegable("#moneda_to",divisas)

    //funcion asincrona, lo que va a pasar cuando la api externa responda
    xhr_calc.onload = respuestaApi

    // SI SE PULSA CALCULAR SE PREGUNTA EL VALOR DE CAMBIO A LA API COINMARKET Y SE DEVUELVE EL VALOR.
    document.querySelector("#calcular")
    .addEventListener("click", (evento) => {
        evento.preventDefault()
        //Reset
        document.querySelector("#errores").innerHTML = ""

        // Aquí se definen los campos que se quieren tratar
        const m_from = document.querySelector("#moneda_from")
        const c_from = document.querySelector("#cantidad_from")
        const m_to = document.querySelector("#moneda_to")

 

        // Preparar envío de consulta
        const consulta = {}
        consulta.moneda_from = m_from.value
        consulta.cantidad_from = c_from.value
        consulta.moneda_to = m_to.value

        //Comprueba si las divisas son iguales.
        if (validar(consulta)) {
            xhr_calc.open("GET", `/api/v1/convertir/${consulta.cantidad_from}/${consulta.moneda_from}/${consulta.moneda_to}`)
            /*
            xhr_calc.open("GET", `https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount=${consulta.cantidad_from}&symbol=&convert=`)
            xhr_calc.setRequestHeader("X-CMC_PRO_API_KEY", COINMARKET_KEY)
            xhr_calc.setRequestHeader("Access-Control-Allow-Origin", "https://coinmarketcap.com/")
            */
            xhr_calc.send()
            console.log("peticion enviada.")

            // Aquí se bloquean los cambios para evitar que se modifiquen después de la validación.
            m_from.setAttribute("disabled","")
            c_from.setAttribute("disabled","")
            m_to.setAttribute("disabled","")
        }
    })
    
    //SI SE PULSA BOTÓN CANCELAR EL FORMULARIO SE RESTABLECE Y SE ANULA LA INSCRIPCIÓN
    document.querySelector("#cancelar")
    .addEventListener("click", () => {
        evento.preventDefault()
        // Restablecer formulario            
        mostrar("#calcular")
        ocultar("#aceptar")
        ocultar("#cancelar")
        cantidad_to = document.querySelector("#cantidad_to")
        cantidad_to.setAttribute("placeholder", "pulse calcular para mostrar")
    })
    // SI SE PULSA ACEPTAR EL MOVIMIENTO DEBE ENVIARSE AL SERVIDOR PARA QUE LO PROCESE Y LO INCLUYA EN EL JQUERY.
    document.querySelector("#aceptar")
    .addEventListener("click", () => {
        var cambio = {}
        //Valores del formulario
        cambio.moneda_from = document.querySelector("#moneda_from").value
        cambio.cantidad_from = document.querySelector("#cantidad_from").value
        cambio.moneda_to = document.querySelector("#moneda_to").value
        cambio.cantidad_to = document.querySelector("#cantidad_to").getAttribute("placeholder")
        //Hora en que se realiza la transacción
        cambio.hora = ahora().hora
        cambio.fecha = ahora().fecha

        xhr_aceptar.open("POST", `http://${servidor}/api/v1/movimiento`, true)
        xhr_aceptar.onload = nuevo_movimiento

        xhr_aceptar.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
        xhr_aceptar.send(JSON.stringify(cambio))

    })

    document.querySelector("#mostrarT").
    addEventListener("click", (evento) => {
        evento.preventDefault()
        access_database()
    })
    document.querySelector("#refresh").
    addEventListener("click", (evento) => {
        evento.preventDefault()
        access_status()
    })

    return 

}

