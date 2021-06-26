# CRIPTOWALLET

A simple website to track your investments in cryptocurrencies.

Designed by Hugo F. García as a final project for the **Keepcoding** bootcamp *aprende a programar desde 0*
Date 17/06/2021

## Technology
Back-end is based in **Python flask**.
Front-end is made in **Vanilla Javascript**

**CSS** is based in **mini-css** but some minor changes has been made.
Data is storage in a **SQlite Database**.

The actual value of the CryptoCoin is obtained using the [API COINMARKET](https://pro-api.coinmarketcap.com)

El logo está basado en un icono de **flaticon** que puede usarse citando a la [fuente](https://www.flaticon.com/)

## Instructions to install

1. Instalar las librerías que aparecen en requirements.
2. Cambiar el documento .envtemplate a .env y sustituir su contenido.
3. En la carpeta migrations crear una base de datos con **2** tablas. La prueba de esta aplicación se ha hecho mediante una base sqlite. 

#### TABLA 1 mis_movimientos
Guarda las transacciones realizadas por el usuario.

Los campos a incluir son los  siguientes:
- id
- fecha
- hora
- moneda_from
- cantidad_from
- moneda_to
- cantidad_to

Un ejemplo del código SQL sería el siguiente:
```
CREATE TABLE "mis_movimientos" (
	"id"	INTEGER,
	"fecha"	TEXT NOT NULL,
	"hora"	TEXT NOT NULL,
	"moneda_from"	TEXT NOT NULL,
	"cantidad_from"	NUMERIC NOT NULL,
	"moneda_to"	TEXT NOT NULL,
	"cantidad_to"	NUMERIC NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
``` 

#### TABLA 2 cryptos
Guarda el valor de las divisas cada vez que se refresca el status.
Sirve para 2 cosas: Crear un histórico sin consultar a la API y ofrecer al usuario una comparación
entre el valor actual y el último valor consultado.

Los campos a introducir serían:

- id
- divisa
- valor
- fecha
- hora

Un ejemplo del código SQL sería el siguiente:
```
CREATE TABLE "cryptos" (
	"id"	INTEGER,
	"divisa"	TEXT NOT NULL,
	"valor"	INTEGER NOT NULL,
	"fecha"	TEXT NOT NULL,
	"hora"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
```

4. Configura tu aplicación:
	1. Crea un archivo en la raiz **config.py**, puedes usar **config_template.py** como referencia.
	  Aquí tendrás que incluir tu **clave KEY** de COINMARKET y las **divisas** con las que deseas trabajar.
	2. Crea un archivo **config.py** en */cryptowallet/static/js/modules*. Puedes usar **config_template.js** como plantilla.
	  Aquí tendrás que incluir tu clave KEY (¡OJO! Desde aquí es visible  y se ha dejado solo como ejemplo por motivos académicos.)
	  y las **divisas** con las que deseas trabajar. Importante seguir el mismo esquema y usar las mismas divisas si no quieres que se
	  produzcan errores.