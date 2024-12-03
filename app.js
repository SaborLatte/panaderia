const express = require("express");
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('public'));
app.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
});