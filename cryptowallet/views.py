import sqlite3
from flask.json import jsonify
from cryptowallet.access_database import DBmanager
from cryptowallet import app
from flask import render_template, request, url_for

dbManager = DBmanager(app.config.get("DATABASE"))

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
@app.route('/api/v1/movimiento/<int:id>', methods=['GET'])
@app.route('/api/v1/movimiento', methods=['POST'])
def detalleMovimiento(id=None):
    try:
        if request.method == 'POST':
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
    except sqlite3.Error as e:
        print ("Error en SQL INSERT", e)
        return jsonify({"status": "fail", "mensaje": "error en base de datos. Tipo {}".format(e)})

#Estado de la inversion
@app.route('/api/v1/status')
def status():
    pass