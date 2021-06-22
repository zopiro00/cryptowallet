#Librerías o componentes externos.
import sqlite3
from flask.json import jsonify
from flask import render_template, request, url_for
from http import HTTPStatus

#Librerías o componentes que vienen de mos propios archivos
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

###########################################################################################
""" HASTA AQUÍ LOS DOCUMENTOS O FUNCINES QUE SIRVEN DE COMODÍN"""
""" A PARTIR DE AQUÍ LAS FUNCIONES QUE ACTÚAN SEGÚN LLAMADOS DE FLASK"""
###########################################################################################

@app.route("/")
def render():
   return render_template ("crypto.html")

#Detalle de movimientos devuelve todos los movimientos de la base de datos.
@app.route("/api/v1/movimientos")
def movimientos():
    query = "SELECT * FROM mis_movimientos;"

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
    try:
        if request.method == "POST":
            dbManager.modificaTablaSQL( """
                                        INSERT INTO mis_movimientos (fecha,hora,moneda_from,cantidad_from,moneda_to,cantidad_to)
                                        VALUES (?,?,?,?,?,?)""",
                                        [request.json["fecha"],
                                        request.json["hora"],
                                        request.json["moneda_from"],
                                        request.json["cantidad_from"],
                                        request.json["moneda_to"],
                                        request.json["cantidad_to"]])
            return jsonify({"status": "success", "mensaje": "registro modificado"})
        if request.method == "GET":
            lista_uno = dbManager.consultaUnaSQL( "SELECT * FROM mis_movimientos WHERE id=?;", [id])
            return jsonify({"status":   "success", "data": lista_uno})
        else:
            return jsonify({"status": "fail", "mensaje": "movimiento no encontrado"}), HTTPStatus.NOT_FOUND
            
    except sqlite3.Error as e:
        print ("Error en SQL", e)
        return jsonify({"status": "fail", "mensaje": "error tipo {}".format(e)}), HTTPStatus.BAD_REQUEST
        

#Estado de la inversion
@app.route('/api/v1/status')
def status():
    try:
        if request.method == "GET":
            inversiones = {"cryptos": {}, "actual": 0, "resultado": 0}
            for i in CRYPTOS:
                invertido = dbManager.consultaUnaSQL( "SELECT moneda_from , sum(cantidad_from) FROM mis_movimientos WHERE moneda_from = ?", [i])
                recuperado = dbManager.consultaUnaSQL( "SELECT moneda_to, sum(cantidad_to) FROM mis_movimientos WHERE moneda_to = ?", [i])
                # Este código funciona pero es feo. Habría que hacer algo con esos if horribles.
                if invertido["moneda_from"] == None:
                    invertido["sum(cantidad_from)"] = 0
                if recuperado["moneda_to"] == None:
                    recuperado["sum(cantidad_to)"] = 0
                if i != "EUR":
                    total= recuperado["sum(cantidad_to)"]-invertido["sum(cantidad_from)"]
                # Aquí me gustaría obtener los valores unitarios de las monedas que no tengo por si quiero invertir.
                    if total != 0:
                        respuesta = llamadaApi(total, i)
                        inversiones["cryptos"][i]= {"total": total, "total_eur": respuesta["data"]["quote"]["EUR"]["price"]}
                        inversiones["actual"] += respuesta["data"]["quote"]["EUR"]["price"]
                else:
                    total= float(invertido["sum(cantidad_from)"])-float(recuperado["sum(cantidad_to)"])
                    inversiones["EUR"]={"total": total, "total_eur": total}

                inversiones["resultado"] += (inversiones["EUR"]["total_eur"] - inversiones["actual"])

            return jsonify({"status": "success", "data": inversiones})
            
    except sqlite3.Error as e:
        print ("Error en SQL", e)
        return jsonify({"status": "fail", "mensaje": "error tipo {}".format(e)}), HTTPStatus.BAD_REQUEST

