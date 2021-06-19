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
                                            INSERT INTO movimientos fecha,hora,from,cantidad_from,to_cantidad_to
                                            VALUES ?,?,?,?,?,?""", request.json)

                return jsonify({"status": "success", "mensaje": "registro modificado"})
        else:
            return "se ha hecho un GET"
    except sqlite3.Error as e:
        print ("Error en SQL INSERT", e)
        return jsonify({"status": "fail", "mensaje": "error en base de datos. Tipo {}".format(e)})

#Estado de la inversion
@app.route('/api/v1/status')
def status():
    pass