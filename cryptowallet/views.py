#Librerías o componentes externos.
import sqlite3
from flask.json import jsonify
from flask import render_template, request, url_for
from http import HTTPStatus
from datetime import date, datetime

#Librerías o componentes que vienen de mis propios archivos
from cryptowallet.access_database import DBmanager
from cryptowallet import app
#He optado por separar la lista de cryptos que utilizo y que así sea fácil de cambiar.
#Tengo que comprobar asociar esto a el archivo JS que también tiene una lista de variables.
from config import CRYPTOS, COINMARKET_KEY

#Bibliotecas para conectar con API coinmarket.
from requests import Request, Session
from requests.exceptions import ConnectionError, Timeout, TooManyRedirects
import json

dbManager = DBmanager(app.config.get("DATABASE"))

def llamadaApi(amount,symbol,convert="EUR"):
    url = "https://pro-api.coinmarketcap.com/v1/tools/price-conversion?"
    parameters = {
    'amount': amount,
    'symbol': symbol,
    'convert': convert,
    }
    headers = {'Accepts': 'application/json', 'X-CMC_PRO_API_KEY': COINMARKET_KEY,}
    session = Session()
    session.headers.update(headers)

    try:
        response = session.get(url, params=parameters)
        data = json.loads(response.text)
        return data
    except (ConnectionError, Timeout, TooManyRedirects) as e:
        print(e)
        return {"error": "error", "e": e}

def ahora():
    ahoraFecha = date.today()
    ahoraHora = datetime.now()
    ahora = {"fecha": ahoraFecha.strftime("%Y-%m-%d"),
             "hora": ahoraHora.strftime("%H:%M:%S")
            }
    return ahora

def convierteUn(i):
    respuesta = llamadaApi(1, i)
    if respuesta["status"]["error_message"] == None:
        unaCrypto = {"valor" : respuesta["data"]["quote"]["EUR"]["price"], "error_message": respuesta["status"]["error_message"]}
        return unaCrypto
    else:
        return {"error_message": respuesta["status"]["error_message"]}

def procesaStatus():
    inversiones = {"error_message": None,"cryptos": {}, "valor_crypto": 0, "resultado": 0, "uniCrypto": {}, "oldUniCrypto": {}}
    for i in CRYPTOS:
        invertido = dbManager.consultaUnaSQL( "SELECT moneda_from , sum(cantidad_from) FROM mis_movimientos WHERE moneda_from = ?", [i])
        recuperado = dbManager.consultaUnaSQL( "SELECT moneda_to, sum(cantidad_to) FROM mis_movimientos WHERE moneda_to = ?", [i])

        oldUnaCrypto = dbManager.consultaUnaSQL( "SELECT valor FROM cryptos WHERE divisa = ? ORDER BY fecha DESC, hora DESC LIMIT 1", [i])
        inversiones["oldUniCrypto"][i] = oldUnaCrypto

        # Este código funciona pero es feo. Habría que hacer algo con esos if horribles.
        if invertido["moneda_from"] == None:
            invertido["sum(cantidad_from)"] = 0
        if recuperado["moneda_to"] == None:
            recuperado["sum(cantidad_to)"] = 0

        if i != "EUR":
            conversionUnitaria = convierteUn(i)
            if conversionUnitaria["error_message"] != None:
                return {"error_message" :conversionUnitaria["error_message"]}
            unaCrypto = conversionUnitaria["valor"]
            
            dbManager.modificaTablaSQL( """INSERT INTO cryptos (fecha,hora,divisa,valor) VALUES (?,?,?,?)""",
                                        [ahora()["fecha"], ahora()["hora"], i, unaCrypto])
            inversiones["uniCrypto"][i] = unaCrypto

            total= recuperado["sum(cantidad_to)"]-invertido["sum(cantidad_from)"]
            total_eur = total * unaCrypto
            if total != 0:
                inversiones["cryptos"][i]= {"total": total, "total_eur": total_eur}
                inversiones["valor_crypto"] += total_eur
        else:
            total= float(invertido["sum(cantidad_from)"])-float(recuperado["sum(cantidad_to)"])
            inversiones["EUR"]={"total": total, "total_eur": total, "total_f": invertido["sum(cantidad_from)"]}

        inversiones["resultado"] = inversiones["valor_crypto"] - inversiones["EUR"]["total_eur"]
        inversiones["error_message"] = None

    return inversiones

statusProcesado = procesaStatus()

def esValido(mf,cf,mt):
    esValido = True

    # El try es por si alguien enviara algo que no es número.
    try: 
        if mf == mt:
            esValido = False
        if mf != "EUR" and float(cf) > statusProcesado["cryptos"][mf]["total"]:
            esValido = False
        if 0.000000001 > float(cf):
            esValido = False
        elif float(cf) > 100000000:
            esValido = False
        return esValido
    except:
        esValido = False
        return  esValido

###########################################################################################
""" A PARTIR DE AQUÍ LAS FUNCIONES QUE ACTÚAN SEGÚN LLAMADOS DE FLASK"""
###########################################################################################

@app.route("/")
def render():
   return render_template ("crypto.html")

#Detalle de movimientos devuelve todos los movimientos de la base de datos.
@app.route("/api/v1/movimientos/<crypto>")
@app.route("/api/v1/movimientos")
def movimientos(crypto = None):
    if crypto == None:
        query = "SELECT * FROM mis_movimientos;"
    else:
        query = "SELECT * FROM mis_movimientos WHERE moneda_to = '{}' OR moneda_from = '{}'".format(crypto,crypto)
    try:
        lista = dbManager.consultaMuchasSQL(query)
        return jsonify({"status": "success", "movimientos": lista})
    except sqlite3.Error as e:
        return jsonify({"status": "fail", "mensaje": str(e)})

#Detalle de UN  movimiento. Devuelve datos de un movimiento (GET)
#Sin id graba el movimiento en la API
@app.route("/api/v1/movimiento/<int:id>", methods=["GET"])
@app.route("/api/v1/movimiento", methods=["POST"])
def detalleMovimiento(id=None):
    if request.json:
        moneda_from = request.json["moneda_from"]
        moneda_to = request.json["moneda_to"]
        cantidad_from = request.json["cantidad_from"]
        cantidad_to = request.json["cantidad_to"]
        validar = esValido(moneda_from,float(cantidad_from),moneda_to)
    else:
        return jsonify({"status": "fail", "mensaje": "No se han reciido datos que procesar"}), HTTPStatus.NOT_FOUND
    if validar:
        try:
            if request.method == "POST":
                dbManager.modificaTablaSQL( """
                                            INSERT INTO mis_movimientos (fecha,hora,moneda_from,cantidad_from,moneda_to,cantidad_to)
                                            VALUES (?,?,?,?,?,?)""",
                                            [ahora()["fecha"],
                                            ahora()["hora"],
                                            moneda_from,
                                            cantidad_from,
                                            moneda_to,
                                            cantidad_to])
                return jsonify({"status": "success", "mensaje": "registro modificado"})
            if request.method == "GET":
                lista_uno = dbManager.consultaUnaSQL( "SELECT * FROM mis_movimientos WHERE id=?;", [id])
                return jsonify({"status": "success", "data": lista_uno})
            else:
                return jsonify({"status": "fail", "mensaje": "movimiento no encontrado"}), HTTPStatus.NOT_FOUND
                
        except sqlite3.Error as e:
            print ("Error en SQL", e)
            return jsonify({"status": "fail", "mensaje": "error tipo {}".format(e)}), HTTPStatus.BAD_REQUEST
    else:
        return jsonify({"status": "fail", "mensaje": "los datos no son válidos"}), HTTPStatus.NOT_FOUND
        

#Estado de la inversion
@app.route('/api/v1/status')
def status():
    try:
        # Se procesa Status, es decir, se sacan valores unitarios,
        datos = statusProcesado
        if datos["error_message"] != None:
            respuesta = jsonify({"status": "fail", "mensaje": "error tipo {}".format(datos["error_message"])})
            return respuesta
        else:
            return jsonify({"status": "success", "data": datos})
    except sqlite3.Error as e:
        print ("Error en SQL", e)
        respuesta = jsonify({"status": "fail", "mensaje": "error tipo {}".format(e)})
        return respuesta, HTTPStatus.BAD_REQUEST

@app.route('/api/v1/convertir/<cantidad>/<_de>/<_para>', methods=["GET"])
def convertir(cantidad, _de , _para):
        try:
            conversion = llamadaApi(cantidad, _de, _para)
            if conversion["status"]["error_message"] != None:
                return jsonify({"status": "fail", "mensaje": "error al consultar la api: {}".format(conversion["error_message"])}), HTTPStatus.BAD_REQUEST
            ##Antes se enviaba la respuesta completa de la Api, aquí se ha optado por mandarla limpia. No se si es una solución más eficiente.
            return jsonify({"status": "success", "mensaje": conversion["data"]["quote"][_para]["price"]})
        except:
            print ("Error en SQL", conversion)
            return jsonify({"status": "fail", "mensaje": "Error al consultar la api"}), HTTPStatus.BAD_REQUEST
    
