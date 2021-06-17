from cryptowallet import app

@app.route("/")
def hola():
    return "Flask está funcionando"
