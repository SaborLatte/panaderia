const express = require("express");
const mysql = require("mysql2");
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();

var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'n0m3l0',
    database: 'desesperanza'
});
con.connect();

app.use(session({
    secret: 'clave_secreta', // Cambia esto por una clave secreta más segura
    resave: false,
    saveUninitialized: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

function checkSession(req, res, next) {
  if (req.session.userId) {
      // Si el usuario ya tiene sesión activa, se muestra un alert con el mensaje
      return res.send(`
          <script>
              alert('Para volver a ingresar, cierra tu sesión activa');
              window.location.href = '/'; // Redirige al usuario a la página de inicio o login
          </script>
      `);
  }
  // Si no hay sesión activa, la ejecución continúa
  next();
}

app.post('/registro', checkSession, (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).send('Por favor, ingresa un nombre de usuario y una contraseña');
    }
  
    // Verificar si el usuario ya está registrado
    con.query('SELECT * FROM clientes WHERE username = ?', [username], (err, result) => {
      if (err) {
        console.log('Error al verificar usuario', err);
        return res.status(500).send('Error al verificar usuario');
      }
  
      if (result.length > 0) {
        return res.status(409).send('<script>alert("Usuario ya registrado"); window.location.href="/registro.html";</script>');
      }

      con.query('INSERT INTO clientes (username, password, dinero) VALUES (?, ?, ?)', [username, password, 50], (err, result) => {
        if (err) {
          console.log('Error al registrar usuario', err);
          return res.status(500).send('<script>alert("Error al registrar el usuario"); window.location.href="/registro.html";</script>');
        }
  
        con.query('SELECT * FROM clientes WHERE username = ?', [username], (err, result) => {
          if (err) {
            console.log('Error al obtener el usuario', err);
            return res.status(500).send('Error al obtener el usuario');
          }
  
          const user = result[0]; 
  
          req.session.userId = user.id_cliente; // Asignar el ID del cliente
          req.session.username = user.username; // Asignar el nombre de usuario
          req.session.role = 'Cliente'; // Asignar el rol de cliente
  
          return res.redirect('/clien.html'); // Redirigir al cliente a su página después de iniciar sesión
        });
      });
    });
  });
  
app.post('/login', checkSession, (req, res) => {
  const { username, password } = req.body;
if (!username || !password) {
      return res.send(`
          <script>
         alert('Por favor, ingrese usuario y contraseña');
          window.history.back();
          </script>
      `);
    }
  let sql = 'SELECT * FROM clientes WHERE username = ?';
  con.query(sql, [username], (err, result) => {
      if (err) {
          console.log('Error en la consulta', err);
          return res.status(500).send(`
          <script>
         alert('Usuario no valido');
          window.history.back();
          </script>
            `);
      }
      if (result.length === 0) {
          console.log('Usuario no encontrado.');
          const secondarySql = 'SELECT * FROM usuarios WHERE username = ?';
          con.query(secondarySql, [username], (err, secondaryResult) => {
              if (err) {
                  console.log('Error en la consulta', err);
                  return res.status(500).send(`
                    <script>
                   alert('Usuario no valido');
                    window.history.back();
                    </script>
                      `);
              }

              if (secondaryResult.length === 0) {
                  return res.send(`
                      <script>
                          alert('Usuario no encontrado');
                          window.history.back();
                      </script>
                  `);
              }
     const user = secondaryResult[0];
    console.log('Usuario encontrado.', user);
      if (password === user.password) {
          req.session.userId = user.id_usuario; 
          req.session.username = user.username;
          return res.redirect('/usuario.html');
    } else {
          return res.send(`
              <script>
                  alert('Contraseña incorrecta');
                  window.history.back();
              </script>
          `);
         }
          });
      } else {
          const user = result[0];
          console.log('Usuario encontrado', user);

          if (password === user.password) {
              req.session.userId = user.id_cliente;
              req.session.username = user.username;
              return res.redirect('/clien.html'); 
          } else {
              return res.send(`
                  <script>
                      alert('Contraseña incorrecta');
                      window.history.back();
                  </script>
              `);
          }
      }
  });
});
app.post('/logindes', checkSession, (req, res) => {
  const { username, password } = req.body;
if (!username || !password) {
      return res.send(`
          <script>
              alert('Por favor, ingrese usuario y contraseña');
              window.history.back();
          </script>
      `);
  }
  const sql = 'SELECT * FROM desarrolladores WHERE username = ?';
  con.query(sql, [username], (err, result) => {
      if (err) {
          console.log('Error en la consulta', err);
          return res.status(500).send('Error');
      }
      if (result.length === 0) {
          return res.send(`
              <script>
                  alert('Desarrollador no encontrado');
                  window.history.back();
              </script>
          `);
      }
    const developer = result[0];
    console.log('Desarrollador encontrado:', developer);

      if (password === developer.password) {
          req.session.userId = developer.id_desarrollador;
          req.session.username = developer.username;

          return res.redirect('/desarrollador.html');
      } else {
          return res.send(`
              <script>
                  alert('Contraseña incorrecta');
                  window.history.back();
              </script>
          `);
      }
  });
});

app.get('/desarrollador.html', checkSessionRedirect, (req, res) => {
    res.sendFile(__dirname + '/public/desarrollador.html');
});
function checkSessionRedirect(req, res, next) {
    if (!req.session.userId) {
        return res.send(`
            <script>
                alert('Necesitas iniciar sesión para acceder a esta página');
                window.location.href = '/'; // Redirige al usuario a la página de inicio o login
            </script>
        `);
    }
    next(); 
}
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send(`
                <script>
                    alert('Error al cerrar sesión');
                    window.location.href = '/Index.html'; // Redirige a la página de inicio de sesión
                </script>
            `);
        }
        return res.status(200).send(`
            <script>
                alert('Has cerrado sesión correctamente');
                window.location.href = '/Index.html'; // Redirige a la página de inicio de sesión
            </script>
        `);
    });
});
app.post('/agregarProducto', (req, res) => {
    const idCliente = req.session.userId;
    if (!idCliente) {
        return res.send(`
            <script>
                alert('Debes iniciar sesión para agregar productos.');
                window.location.href = '/Iniciod.html';
            </script>
        `);
    }

    let nombre = req.body.nombre;
    let precio = parseFloat(req.body.precio);
    let cantidad_stock = parseInt(req.body.cantidad_stock);

    if (precio < 0 || cantidad_stock < 0) {
        return res.send(`
            <script>
                alert('El precio y la cantidad en stock deben ser valores positivos.');
                window.location.href = '/desarrollador.html';
            </script>
        `);
    }

    con.query('SELECT * FROM productos WHERE nombre = ?', [nombre], (err, resultado) => {
        if (err) {
            console.log("Error al verificar existencia del producto", err);
            return res.send(`
                <script>
                    alert('Error al verificar existencia del producto.');
                    window.location.href = '/desarrollador.html';
                </script>
            `);
        }

        if (resultado.length > 0) {
            return res.send(`
                <script>
                    alert('El producto con el nombre "${nombre}" ya existe.');
                    window.location.href = '/desarrollador.html';
                </script>
            `);
        }

        con.query('INSERT INTO productos (nombre, precio, cantidad_stock) VALUES (?, ?, ?)', [nombre, precio, cantidad_stock], (err, respuesta) => {
            if (err) {
                console.log("Error al agregar producto", err);
                return res.send(`
                    <script>
                        alert('Error al agregar producto.');
                        window.location.href = '/desarrollador.html';
                    </script>
                `);
            }
            return res.send(`
                <script>
                    alert('Producto ${nombre} agregado con éxito. Precio: ${precio}, Stock: ${cantidad_stock}');
                    window.location.href = '/desarrollador.html';
                </script>
            `);
        });
    });
});
app.get('/obtenerProductos', (req, res) => {
    const idCliente = req.session.userId;
    if (!idCliente) {
        return res.send('Debes iniciar sesión para ver los productos.');
    }

    con.query('SELECT * FROM productos', (err, respuesta) => {
        if (err) return console.log('ERROR: ', err);
        var productosHTML = ``;
        respuesta.forEach(producto => {
            productosHTML += `<tr><td>${producto.id_producto}</td><td>${producto.nombre}</td><td>${producto.precio}</td><td>${producto.cantidad_stock}</td></tr>`;
        });
        return res.send(`
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,100..900;1,100..900&family=Figtree:ital,wght@0,300..900;1,300..900&family=Marmelad&family=Mona+Sans:ital,wght@0,200..900;1,200..900&family=Noto+Sans+KR:wght@100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Sora:wght@100..800&family=Varela+Round&display=swap');
        </style>
</head>
<body style="margin: 0px;
padding: 0px;
font-family: Varela Round, serif;
font-weight: 500;
font-style: normal;
background: #D4B48C;
position: relative;
justify-content: center;
align-items: center;">
<header style="display: flex;
flex-direction: column;
box-shadow: 3px 3px 20px black;
position: fixed; /* Hace que el header se quede fijo */
top: 0; /* Se posiciona en la parte superior */
left: 0; /* Alineado al borde izquierdo */
width: 100%; /* Ocupa todo el ancho de la pantalla */
z-index: 1000; /* Asegura que el header esté por encima de otros elementos */" ><div class="n1" style="    display: flex;
    justify-content: space-around;
    background-color: #4E2C22;
    color: white;     font-size: 15px;"><h1>La Desesperanza</h1> <h3>Bienvenido</h3></div>
    <div class="n2" style="
    background-color: #C49A6C;
    height: 50px;"><ul style="    list-style: none;
    display: flex;
    justify-content: space-evenly;">
        <li><a href="desarrollador.html" style="    text-decoration: none;
    color: white;">Regresar</a></li>
    </ul> </div></header>
        <div class="lol" style="margin-top: 180px;">
            <div class="text-center">
                <h2 class="text-warning"  style="font-size: 30px; color: #4E2C22; padding-top: 20px; font-family: Arial, Helvetica, sans-serif; text-align: center">Productos Disponibles</h2>
                <table class="table table-bordered table-hover" style="font-size: 30px;  text-align: center; color: white; font-family: Arial, Helvetica, sans-serif;width:800px; margin-left: 20%;">
                    <thead class="thead-dark" style="background-color: #4E2C22;">
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Precio</th>
                            <th>Stock</th>
                        </tr>
                    </thead>
                    <tbody style="background-color:white; color: #4E2C22;">
                        ${productosHTML}
                    </tbody>
                </table>
            </div>
        </div>
</body>
        `);
    });
});
app.post('/borrarProducto', (req, res) => {
    const idCliente = req.session.userId;
    if (!idCliente) {
        return res.send('<script>alert("Debes iniciar sesión para borrar los productos."); window.location.href = "/iniciod.html";</script>');
    }

    let id = req.body.id_producto;

    con.query('DELETE FROM productos WHERE id_producto = ?', [id], (err, respuesta) => {
        if (err) {
            console.log("Error al borrar producto", err);
            return res.send('<script>alert("Error al borrar el producto"); window.location.href = "/desarrollador.html";</script>');
        }

        if (respuesta.affectedRows === 0) {
            return res.send('<script>alert("No se encontró el producto."); window.location.href = "/desarrollador.html";</script>');
        }

        return res.send('<script>alert("Producto con ID ' + id + ' ha sido eliminado."); window.location.href = "/desarrollador.html";</script>');
    });
});
app.post('/actualizarProducto', (req, res) => {
    const idCliente = req.session.userId;
    if (!idCliente) {
        return res.send(`
            <script>
                alert('Debes iniciar sesión para actualizar los productos.');
                window.location.href = '/login'; // Redirige a la página de login
            </script>
        `);
    }

    let id = req.body.id_producto;
    let nuevo_nombre = req.body.nuevo_nombre;
    let nuevo_precio = parseFloat(req.body.nuevo_precio);
    let nuevo_stock = parseInt(req.body.nuevo_stock);

    if (nuevo_precio < 0 || nuevo_stock < 0) {
        return res.send(`
            <script>
                alert('El nuevo precio y la nueva cantidad en stock deben ser valores positivos.');
            </script>
        `);
    }

    con.query('UPDATE productos SET nombre = ?, precio = ?, cantidad_stock = ? WHERE id_producto = ?', [nuevo_nombre, nuevo_precio, nuevo_stock, id], (err, respuesta) => {
        if (err) {
            console.log("Error al actualizar producto", err);
            return res.send(`
                <script>
                    alert('Error al actualizar producto.');
                </script>
            `);
        }

        if (respuesta.affectedRows === 0) {
            return res.send(`
                <script>
                    alert('No se encontró el producto con el ID proporcionado.');
                </script>
            `);
        }

        return res.send(`
            <script>
                alert('Producto con ID ${id} ha sido actualizado.');
                window.location.href = '/desarrollador.html'; // Redirige a la página de login
            </script>
        `);
    });
});
app.post('/insertarSaldo', (req, res) => {
    const idCliente = req.session.userId;

    // Verifica si el usuario está autenticado
    if (!idCliente) {
        return res.send(`
            <script>
                alert('Debes iniciar sesión para actualizar el saldo.');
                window.location.href = '/index.html'; // Redirige a la página de login
            </script>
        `);
    }

    console.log('Datos recibidos:', req.body);
    // Obtén el monto ingresado por el usuario
    const monto = parseFloat(req.body.CA);

    console.log('Saldo recibido:', monto);
    // Validaciones del monto
    if (isNaN(monto) || monto <= 0) {
        return res.send(`
            <script>
                alert('Por favor, ingresa un monto válido.');
                window.history.back(); // Regresa al formulario anterior
            </script>
        `);
    }

    if (monto > 999999999999) {
        return res.send(`
            <script>
                alert('El monto no puede exceder 999,999,999,999 pesos.');
                window.history.back(); // Regresa al formulario anterior
            </script>
        `);
    }

    // Consulta para verificar si el cliente ya tiene saldo
    const selectQuery = `
        SELECT monto FROM Saldo WHERE id_cliente = ?
    `;

    con.query(selectQuery, [idCliente], (err, results) => {
        if (err) {
            console.error('Error al verificar el saldo:', err);
            return res.send(`
                <script>
                    alert('Ocurrió un error al verificar el saldo.');
                    window.history.back(); 
                </script>
            `);
        }

        if (results.length > 0) {
            // El cliente ya tiene saldo, actualiza el monto
            console.log('Saldo existente:', results[0].monto);

            const nuevoMonto = parseFloat(results[0].monto) + monto;

            console.log('Nuevo saldo calculado:', nuevoMonto);

            if (nuevoMonto > 999999999999) {
                return res.send(`
                    <script>
                        alert('El monto total no puede exceder 999,999,999,999 pesos.');
                        window.history.back(); // Regresa al formulario anterior
                    </script>
                `);
            }

            const updateQuery = `
                UPDATE Saldo SET monto = ? WHERE id_cliente = ?
            `;

            con.query(updateQuery, [nuevoMonto, idCliente], (updateErr) => {
                if (updateErr) {
                    console.error('Error al actualizar el saldo:', updateErr);
                    return res.send(`
                        <script>
                            alert('Ocurrió un error al actualizar el saldo.');
                            window.history.back(); 
                        </script>
                    `);
                }

                return res.send(`
                    <script>
                        alert('El saldo ha sido actualizado con éxito.');
                        window.location.href = '/clien.html'; // Redirige al perfil del usuario
                    </script>
                `);
            });
        } else {
            // El cliente no tiene saldo, inserta un nuevo registro
            console.log('No se encontró saldo previo, insertando nuevo saldo:', monto);

            const insertQuery = `
                INSERT INTO Saldo (id_cliente, monto) VALUES (?, ?)
            `;

            con.query(insertQuery, [idCliente, monto], (insertErr) => {
                if (insertErr) {
                    console.error('Error al insertar el saldo:', insertErr);
                    return res.send(`
                        <script>
                            alert('Ocurrió un error al insertar el saldo.');
                            window.history.back(); // Regresa al formulario anterior
                        </script>
                    `);
                }

                return res.send(`
                    <script>
                        alert('El saldo ha sido agregado con éxito.');
                        window.location.href = '/clien.html'; // Redirige al perfil del usuario
                    </script>
                `);
            });
        }
    });
});

app.post('/eliminarSaldo', (req, res) => {
    const idCliente = req.session.userId;

    // Verifica si el usuario está autenticado
    if (!idCliente) {
        return res.send(`
            <script>
                alert('Debes iniciar sesión para eliminar el saldo.');
                window.location.href = '/index.html'; // Redirige a la página de login
            </script>
        `);
    }
    console.log('ID de cliente:', idCliente);
    // Consulta para eliminar el saldo del cliente en la tabla "Saldo"
    const deleteQuery = `DELETE FROM Saldo WHERE id_cliente = ?`;
    console.log('Ejecutando consulta DELETE con ID cliente:', idCliente);

    con.query(deleteQuery, [idCliente], (err, results) => {
        if (err) {
            console.error('Error al eliminar el saldo:', err);
            return res.send(`
                <script>
                    alert('Ocurrió un error al eliminar el saldo.');
                    window.history.back(); // Regresa al formulario anterior
                </script>
            `);
        }
    

        // Si el saldo fue eliminado correctamente
        return res.send(`
            <script>
                alert('El saldo ha sido eliminado con éxito.');
                window.location.href = '/clien.html'; // Redirige al perfil del usuario
            </script>
        `);
    });
});
app.get('/consultarSaldo',(req,res)=>{
    const idCliente = req.session.userId;
    if (!idCliente) {
        return res.send(`
            <script>
                alert('Debes iniciar sesión para consultar tu saldo.');
                window.location.href = '/index.html'; // Redirige a la página de login
            </script>
        `);
    }

    // Consulta para obtener el saldo del cliente
    const selectQuery = `SELECT monto FROM Saldo WHERE id_cliente = ?`;

    con.query(selectQuery, [idCliente], (err, results) => {
        if (err) {
            console.error('Error al consultar el saldo:', err);
            return res.send(`
                <script>
                    alert('Ocurrió un error al consultar el saldo.');
                    window.history.back();
                </script>
            `);
        }

        if (results.length > 0) {
            const saldo = results[0].monto;
            console.log('Saldo encontrado:', saldo);
            return res.send(`
                <script>
                    alert('Tu saldo actual es: ${saldo}');
                    window.location.href = '/clien.html'; // Redirige a la página del cliente
                </script>
            `);
        } else {
            return res.send(`
                <script>
                    alert('No se encontró saldo para este usuario.');
                    window.location.href = '/clien.html'; // Redirige a la página del cliente
                </script>
            `);
        }
    });

});
app.post('/agregarCarrito', (req, res) => {
    const { id_producto, cantidad } = req.body; // Obtenemos el id del producto y la cantidad
    const idCliente = req.session.userId;

    // Verificar si el cliente está autenticado
    if (!idCliente) {
        return res.send(`
            <script>
                alert('Debes iniciar sesión para actualizar los productos.');
                history.back(); // Regresa a la página anterior sin recargar
            </script>
        `);
    }

    // Verificar si el producto existe en la base de datos
    con.query('SELECT * FROM Productos WHERE id_producto = ?', [id_producto], (err, resultado) => {
        if (err) {
            console.log("Error al buscar producto", err);
            return res.status(500).send('Error al buscar producto');
        }

        const producto = resultado[0];
        if (!producto) {
            return res.send(`
                <script>
                    alert('Producto no encontrado');
                    history.back(); // Regresa a la página anterior sin recargar
                </script>
            `);
        }

        // Validar la cantidad
        const cantidadNumerica = parseInt(cantidad);
        if (cantidadNumerica < 1 || cantidadNumerica > 100) {
            return res.send(`
                <script>
                    alert('La cantidad debe estar entre 1 y 100');
                    history.back(); // Regresa a la página anterior sin recargar
                </script>
            `);
        }

        // Verificar si el cliente ya tiene el producto en su carrito
        con.query('SELECT * FROM carrito WHERE id_cliente = ? AND id_producto = ?', [idCliente, id_producto], (err, resultadoCarrito) => {
            if (err) {
                console.log("Error al verificar carrito", err);
                return res.status(500).send('Error al verificar carrito');
            }

            if (resultadoCarrito.length > 0) {
                // Si el producto ya está en el carrito, actualizamos la cantidad
                const nuevaCantidad = resultadoCarrito[0].cantidad + cantidadNumerica;
                const total = producto.precio * nuevaCantidad; // Total del producto (precio * nueva cantidad)

                // Actualizar la cantidad y el total en el carrito
                con.query(
                    'UPDATE carrito SET cantidad = ?, total = ? WHERE id_cliente = ? AND id_producto = ?',
                    [nuevaCantidad, total, idCliente, id_producto],
                    (err, respuesta) => {
                        if (err) {
                            console.log("Error al actualizar carrito", err);
                            return res.status(500).send('Error al actualizar carrito');
                        }

                        res.send(`
                            <script>
                                alert('Producto actualizado en el carrito');
                                history.back(); // Regresa a la página anterior sin recargar
                            </script>
                        `);
                    }
                );
            } else {
                // Si el producto no está en el carrito, lo agregamos
                const fechaPedido = new Date().toISOString().slice(0, 19).replace('T', ' '); // Fecha actual en formato DATETIME
                const total = producto.precio * cantidadNumerica; // Total del producto (precio * cantidad)

                // Insertar el producto en el carrito, ahora también con el precio unitario
                con.query(
                    'INSERT INTO carrito (id_cliente, id_producto, cantidad, fecha_pedido, precio_unidad, total) VALUES (?, ?, ?, ?, ?, ?)',
                    [idCliente, id_producto, cantidadNumerica, fechaPedido, producto.precio, total],
                    (err, respuesta) => {
                        if (err) {
                            console.log("Error al agregar producto al carrito", err);
                            return res.status(500).send('Error al agregar producto al carrito');
                        }

                        res.send(`
                            <script>
                                alert('Producto agregado al carrito');
                                history.back(); // Regresa a la página anterior sin recargar
                            </script>
                        `);
                    }
                );
            }
        });
    });
});
app.post('/eliminarCarrito', (req, res) => {
    const idCliente = req.session.userId; // Obtenemos el ID del cliente desde la sesión
    const { id_producto } = req.body; // Obtenemos el ID del producto a eliminar

    // Verifica si el usuario está autenticado
    if (!idCliente) {
        return res.send(`
            <script>
                alert('Debes iniciar sesión para eliminar un producto del carrito.');
                window.location.href = '/index.html'; // Redirige a la página de inicio de sesión
            </script>
        `);
    }

    // Verifica si el ID del producto fue enviado
    if (!id_producto) {
        return res.send(`
            <script>
                alert('No se ha especificado el producto a eliminar.');
                window.history.back(); // Regresa al formulario anterior
            </script>
        `);
    }

    // Consulta para eliminar el producto del carrito
    const deleteQuery = `DELETE FROM carrito WHERE id_cliente = ? AND id_producto = ?`;
    
    con.query(deleteQuery, [idCliente, id_producto], (err, results) => {
        if (err) {
            console.error('Error al eliminar el producto del carrito:', err);
            return res.send(`
                <script>
                    alert('Ocurrió un error al eliminar el producto del carrito.');
                    window.history.back(); // Regresa al formulario anterior
                </script>
            `);
        }

        // Si no se encontró el producto en el carrito
        if (results.affectedRows === 0) {
            return res.send(`
                <script>
                    alert('El producto no se encuentra en tu carrito.');
                    window.history.back(); // Regresa al formulario anterior
                </script>
            `);
        }

        // Si el producto fue eliminado correctamente
        return res.send(`
            <script>
                alert('El producto ha sido eliminado del carrito con éxito.');
               window.history.back(); // Regresa al formulario anterior
            </script>
        `);
    });
});
app.get('/consultaCarrito', (req, res) => {
    const idCliente = req.session.userId; // Obtener el ID del cliente desde la sesión

    // Verificar si el usuario está autenticado
    if (!idCliente) {
        return res.send(`
            <script>
                alert('Debes iniciar sesión para ver el carrito.');
                window.location.href = '/index.html'; // Redirige a la página de inicio de sesión
            </script>
        `);
    }

    // Consulta para obtener los productos del carrito
    const query = `
        SELECT p.nombre AS producto, c.cantidad, c.total AS total_producto, p.precio AS precio_unitario
        FROM carrito c
        JOIN productos p ON c.id_producto = p.id_producto
        WHERE c.id_cliente = ?
    `;

    con.query(query, [idCliente], (err, respuesta) => {
        if (err) {
            console.error('Error al obtener el carrito:', err);
            return res.send(`
                <script>
                    alert('Ocurrió un error al obtener los productos del carrito.');
                    window.history.back(); // Regresa al formulario anterior
                </script>
            `);
        }

        // Si el carrito está vacío
        if (respuesta.length === 0) {
            return res.send('<h1>Tu carrito está vacío.</h1>');
        }

        let carritoHTML = '';
        let totalCarrito = 0;

        // Generar las filas de la tabla
        respuesta.forEach(item => {
            const totalProducto = parseFloat(item.total_producto); // Asegurar que es un número decimal
            carritoHTML += `<tr>
                                <td style="text-align: center;">${item.producto}</td>
                                <td style="text-align: center;">${item.cantidad}</td>
                                <td style="text-align: center;">$${parseFloat(item.precio_unitario).toFixed(2)}</td>
                                <td style="text-align: center;">$${totalProducto.toFixed(2)}</td>
                            </tr>`;
            totalCarrito += totalProducto; // Sumar el total del producto al total general
        });

        // Enviar la respuesta con el HTML
        return res.send(`
            <div class="container d-flex justify-content-center align-items-center min-vh-100">
            <div class="text-center p-4 rounded shadow-lg" style="background-color: #f9f9f9; border: 1px solid #ccc; max-width: 800px; width: 100%;">
        <!-- Título centrado -->
        <h2 class="text-warning mb-4">Carrito de Compras</h2>
        
        <!-- Tabla centrada -->
        <div class="table-responsive">
            <table class="table table-striped table-hover mx-auto" style="max-width: 100%; text-align: center;">
                <thead style="background-color: #ffce54; color: #fff;">
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${carritoHTML}
                </tbody>
                <tfoot>
                    <tr style="background-color: #f7f7f7;">
                        <td colspan="3" style="text-align: right; font-weight: bold;">Total del carrito:</td>
                        <td style="font-weight: bold;">$${totalCarrito.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <!-- Botón centrado -->
        <div class="mt-4">
            <a href="/clien.html" class="btn btn-primary px-4 py-2" style="font-size: 1.2rem;">Regresar</a>
        </div>
    </div>
</div>


        `);
    });
});

app.post('/comprarCarrito', (req, res) => {
    const idCliente = req.session.userId;

    if (!idCliente) {
        return res.send(`
            <script>
                alert('Debes iniciar sesión para realizar una compra.');
                window.location.href = '/index.html';
            </script>
        `);
    }

    const queryCarrito = `
        SELECT c.id_producto, c.cantidad, c.total, p.nombre, p.cantidad_stock
        FROM carrito c
        JOIN productos p ON c.id_producto = p.id_producto
        WHERE c.id_cliente = ?
    `;

    con.query(queryCarrito, [idCliente], (err, resultados) => {
        if (err) {
            console.error('Error al obtener el carrito:', err);
            return res.status(500).send('Error al procesar la compra.');
        }

        if (resultados.length === 0) {
            return res.send(`
                <script>
                    alert('Tu carrito está vacío.');
                    window.location.href = '/clien.html';
                </script>
            `);
        }

        // Validar que no haya productos con cantidad 0
        const productoInvalido = resultados.find(producto => producto.cantidad <= 0);
        if (productoInvalido) {
            return res.send(`
                <script>
                    alert('No puedes realizar una compra porque el producto "${productoInvalido.nombre}" tiene una cantidad de 0.');
                    window.location.href = '/clien.html';
                </script>
            `);
        }

        // Calcular el total del carrito
        let totalCarrito = resultados.reduce((sum, producto) => sum + (parseFloat(producto.total) || 0), 0);

        // Verificar que totalCarrito sea un número válido
        if (isNaN(totalCarrito) || totalCarrito <= 0) {
            return res.send(`
                <script>
                    alert('El total de la compra no es válido.');
                    window.location.href = '/clien.html';
                </script>
            `);
        }

        // Simular el procesamiento del pago
        const pagoExitoso = true;

        if (!pagoExitoso) {
            return res.send(`
                <script>
                    alert('Error al procesar el pago. Inténtalo nuevamente.');
                    window.history.back();
                </script>
            `);
        }

        // Obtener el saldo actual del cliente
        const querySaldo = 'SELECT monto FROM saldo WHERE id_cliente = ?';
        con.query(querySaldo, [idCliente], (err, resultadosSaldo) => {
            if (err) {
                console.error('Error al obtener el saldo del cliente:', err);
                return res.status(500).send('Error al procesar la compra.');
            }

            if (resultadosSaldo.length === 0) {
                return res.send(`
                    <script>
                        alert('Cliente no encontrado.');
                        window.location.href = '/index.html';
                    </script>
                `);
            }

            const saldoActual = parseFloat(resultadosSaldo[0].monto);

            // Verificar que el cliente tiene suficiente saldo
            if (saldoActual < totalCarrito) {
                return res.send(`
                    <script>
                        alert('Saldo insuficiente para realizar la compra.');
                        window.location.href = '/clien.html';
                    </script>
                `);
            }

            // Restar el saldo del cliente
            const nuevoSaldo = saldoActual - totalCarrito;

            // Verificar que el nuevo saldo es válido
            if (isNaN(nuevoSaldo) || nuevoSaldo < 0) {
                return res.send(`
                    <script>
                        alert('Error al calcular el nuevo saldo.');
                        window.location.href = '/clien.html';
                    </script>
                `);
            }

            const updateSaldo = 'UPDATE saldo SET monto = ? WHERE id_cliente = ?';
            con.query(updateSaldo, [nuevoSaldo, idCliente], (err) => {
                if (err) {
                    console.error('Error al actualizar el saldo del cliente:', err);
                    return res.status(500).send('Error al actualizar el saldo.');
                }

                // Actualizar el stock de los productos comprados
                const actualizarStock = resultados.map(producto => {
                    return new Promise((resolve, reject) => {
                        const nuevoStock = producto.cantidad_stock - producto.cantidad;

                        // Evitar stocks negativos
                        if (nuevoStock < 0) {
                            reject(`Stock insuficiente para el producto "${producto.nombre}".`);
                            return;
                        }

                        const queryUpdateStock = `
                            UPDATE productos SET cantidad_stock = ? WHERE id_producto = ?
                        `;
                        con.query(queryUpdateStock, [nuevoStock, producto.id_producto], (err) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                });

                Promise.all(actualizarStock)
                    .then(() => {
                        // Insertar la factura en la tabla `facturas`
                        const insertFactura = `INSERT INTO facturas (id_cliente, monto, fecha_emision) VALUES (?, ?, ?)`;
                        const fechaEmision = new Date().toISOString().slice(0, 19).replace('T', ' '); // Fecha y hora actual
                        
                        // Usar un idPedido autogenerado si corresponde (supondré que este campo es auto-incremental en la DB)
                        con.query(insertFactura, [idCliente, totalCarrito, fechaEmision], (err) => {
                            if (err) {
                                console.error('Error al insertar la factura:', err);
                                return res.status(500).send('Error al procesar la compra.');
                            }

                            // Vaciar el carrito
                            const deleteCarrito = 'DELETE FROM carrito WHERE id_cliente = ?';
                            con.query(deleteCarrito, [idCliente], (err) => {
                                if (err) {
                                    console.error('Error al vaciar el carrito:', err);
                                    return res.status(500).send('Error al vaciar el carrito después de la compra.');
                                }

                                res.send(`
                                    <script>
                                        alert('Compra realizada con éxito. Tu carrito ha sido vaciado.');
                                        window.location.href = '/ticket';
                                    </script>
                                `);
                            });
                        });
                    })
                    .catch(err => {
                        console.error('Error al actualizar el stock:', err);
                        res.status(500).send('Error al procesar la compra.');
                    });
            });
        });
    });
});

app.get('/ticket', (req, res) => {
    const idCliente = req.session.userId;

    if (!idCliente) {
        return res.send(`
            <script>
                alert('Debes iniciar sesión para ver tu ticket.');
                window.location.href = '/index.html';
            </script>
        `);
    }

    const queryFactura = `
        SELECT id_factura, monto, fecha_emision
        FROM facturas
        WHERE id_cliente = ?
        ORDER BY fecha_emision DESC
        LIMIT 1
    `;

    con.query(queryFactura, [idCliente], (err, resultados) => {
        if (err) {
            console.error('Error al obtener el ticket:', err);
            return res.status(500).send('Error al cargar el ticket.');
        }

        if (resultados.length === 0) {
            return res.send(`
                <script>
                    alert('No se encontró ningún ticket reciente.');
                    window.location.href = '/clien.html';
                </script>
            `);
        }

        const ticketData = resultados[0];

        // Retornar el HTML con los datos directamente
        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ticket de Compra</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        line-height: 1.6;
                    }
                    h1 {
                        color: #333;
                    }
                    .ticket {
                        border: 1px solid #ccc;
                        padding: 20px;
                        margin-top: 20px;
                        max-width: 600px;
                        background-color: #f9f9f9;
                    }
                    .btn {
                        display: inline-block;
                        margin-top: 20px;
                        padding: 10px 20px;
                        background-color: #007BFF;
                        color: #fff;
                        text-decoration: none;
                        border-radius: 5px;
                    }
                    .btn:hover {
                        background-color: #0056b3;
                    }
                </style>
            </head>
            <body>
                <h1>Ticket de Compra</h1>
                <div class="ticket">
                    <p><strong>Número de Factura:</strong> ${ticketData.id_factura}</p>
                    <p><strong>Monto Total:</strong> $${ticketData.monto}</p>
                    <p><strong>Fecha de Emisión:</strong> ${new Date(ticketData.fecha_emision).toLocaleString()}</p>
                </div>
                <a href="/clien.html" class="btn">Volver</a>
            </body>
            </html>
        `);
    });
});











// Iniciar el servidor
app.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
});
