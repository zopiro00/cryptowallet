import sqlite3
from flask.json import jsonify
from cryptowallet.access_database import DBmanager
from cryptowallet import app
from flask import render_template, request, url_for

dbManager = DBmanager(app.config.get("DATABASE"))

@app.route("/")
def render():
   return render_template ("crypto.html")

@app.route("/api/v1/movimientos")
def movimientos():
    query = "SELECT * FROM mis_movimientos;"

    try:
        lista = dbManager.consultaMuchasSQL(query)
        return jsonify({"status": "success", "movimientos": lista})
    except sqlite3.Error as e:
        return jsonify({"status": "fail", "mensaje": str(e)})

