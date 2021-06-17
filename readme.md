### CRIPTOWALLET

A simple website to track your investments in cryptocurrencies.

Designed by Hugo F. García as a final project for the Keepcoding bootcamp *aprende a programar desde 0*
Date 17/06/2021

# Technology
Back-end is based in python flask.
Front-end is made in Javascripts + HTML

# Instructions to install

1. Instalar las librerías que aparecen en requirements.
2. Cambiar el documento .envtemplate a .env y sustituir su contenido.
3. En la carpeta migrations crear una base de datos. La prueba de esta aplicación se ha hecho mediante una base sqlite. Los campos a incluir son los  siguientes:
- id
- fecha
- hora
- moneda_from
- cantidad_from
- moneda_to
- cantidad_to
4. En el archivo config definir la ruta a la base de datos.
