const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.static('Doctrack2')); // Sirve los archivos HTML, CSS, JS

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto 3000 :)`);
});
