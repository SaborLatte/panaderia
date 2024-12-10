const express = require("express");
const mysql = require("mysql2");
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/imagenes'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Renombra el archivo para evitar conflictos
    }
});

const upload = multer({ storage });




// Configuración de la base de datos
var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'n0m3l0',
    database: 'panaderia'
});
con.connect();

// Middleware para manejar sesiones
app.use(session({
    secret: 'clave_secreta', // Cambia esto por una clave secreta más segura
    resave: false,
    saveUninitialized: true
}));

// Middleware para manejar los datos del formulario
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Rutas de productos
app.post('/agregarProducto', upload.single('imagen'), (req, res) => {
    const idCliente = req.session.userId;
    if (!idCliente) {
        return res.send('Debes iniciar sesión para agregar productos.');
    }

    let nombre = req.body.nombre;
    let precio = parseFloat(req.body.precio);
    let cantidad_stock = parseInt(req.body.cantidad_stock);
    let imagen = req.file ? `/imagenes/${req.file.filename}` : null; // Ruta de la imagen

    if (precio < 0 || cantidad_stock < 0) {
        return res.status(400).send("<h1 style='color: orange;'>El precio y la cantidad en stock deben ser valores positivos.</h1>");
    }

    con.query('SELECT * FROM productos WHERE nombre = ?', [nombre], (err, resultado) => {
        if (err) {
            console.log("Error al verificar existencia del producto", err);
            return res.status(500).send("Error al verificar existencia del producto");
        }

        if (resultado.length > 0) {
            return res.status(400).send(`<h1 style="color: orange;">El producto con el nombre "${nombre}" ya existe.</h1>`);
        }

        con.query('INSERT INTO productos (nombre, precio, cantidad_stock, imagen) VALUES (?, ?, ?, ?)', [nombre, precio, cantidad_stock, imagen], (err, respuesta) => {
            if (err) {
                console.log("Error al agregar producto", err);
                return res.status(500).send("Error al agregar producto");
            }
            return res.send(`<h1 style="color: orange;">Producto Agregado:</h1> <p>${nombre} - Precio: ${precio} - Stock: ${cantidad_stock} - Imagen: ${imagen}</p>`);
        });
    });
});


// Obtener productos
app.get('/obtenerProductos', (req, res) => {
    const idCliente = req.session.userId;
    if (!idCliente) {
        return res.send('Debes iniciar sesión para ver los productos.');
    }

    con.query('SELECT * FROM productos', (err, respuesta) => {
        if (err) return console.log('ERROR: ', err);

        let productosHTML = '';
        respuesta.forEach(producto => {
            productosHTML += `
            <tr>
                <td style="padding: 10px; text-align: center;">${producto.id_producto}</td>
                <td style="padding: 10px; text-align: center;">${producto.nombre}</td>
                <td style="padding: 10px; text-align: center;">$${parseFloat(producto.precio).toFixed(2)}</td>
                <td style="padding: 10px; text-align: center;">${producto.cantidad_stock}</td>
                <td style="padding: 10px; text-align: center;">
                    <img src="${producto.imagen}" alt="${producto.nombre}" style="width: 100px; height: auto; border-radius: 10px;">
                </td>
            </tr>
        `;
        
        });

        return res.send(`
            <div style="font-family: Arial, sans-serif; max-width: 90%; margin: 20px auto;">
                <h1 style="text-align: center; color: #6f4f28; margin-bottom: 20px;">Productos Disponibles</h1>
                <table style="width: 100%; border-collapse: collapse; background-color: #fff; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);">
                    <thead style="background-color: #6f4f28; color: white;">
                        <tr>
                            <th style="padding: 15px; text-align: center;">ID</th>
                            <th style="padding: 15px; text-align: center;">Nombre</th>
                            <th style="padding: 15px; text-align: center;">Precio</th>
                            <th style="padding: 15px; text-align: center;">Stock</th>
                            <th style="padding: 15px; text-align: center;">Imagen</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productosHTML}
                    </tbody>
                </table>
            </div>
        `);
    });
});


// Borrar producto
app.post('/borrarProducto', (req, res) => {
    const idCliente = req.session.userId;
    if (!idCliente) {
        return res.send('Debes iniciar sesión para borrar los productos.');
    }

    let id = req.body.id_producto;

    con.query('DELETE FROM productos WHERE id_producto = ?', [id], (err, respuesta) => {
        if (err) {
            console.log("Error al borrar producto", err);
            return res.status(500).send("Error al borrar producto");
        }

        if (respuesta.affectedRows === 0) {
            return res.send("No se encontró el producto con el ID proporcionado.");
        }

        return res.send(`Producto con ID ${id} ha sido eliminado.`);
    });
});

// Actualizar producto
app.post('/actualizarProducto', upload.single('imagen'), (req, res) => {
    const idCliente = req.session.userId;
    if (!idCliente) {
        return res.send('Debes iniciar sesión para actualizar los productos.');
    }

    let id = req.body.id_producto;
    let nuevo_nombre = req.body.nuevo_nombre;
    let nuevo_precio = parseFloat(req.body.nuevo_precio);
    let nuevo_stock = parseInt(req.body.nuevo_stock);
    let nueva_imagen = req.file ? `/imagenes/${req.file.filename}` : null;

    if (nuevo_precio < 0 || nuevo_stock < 0) {
        return res.status(400).send("El nuevo precio y la nueva cantidad en stock deben ser valores positivos.");
    }

    con.query('UPDATE productos SET nombre = ?, precio = ?, cantidad_stock = ?, imagen = ? WHERE id_producto = ?', [nuevo_nombre, nuevo_precio, nuevo_stock, nueva_imagen, id], (err, respuesta) => {
        if (err) {
            console.log("Error al actualizar producto", err);
            return res.status(500).send("Error al actualizar producto");
        }

        if (respuesta.affectedRows === 0) {
            return res.send("No se encontró el producto con el ID proporcionado.");
        }

        return res.send(`Producto con ID ${id} ha sido actualizado.`);
    });
});


function checkSession(req, res, next) {
    if (req.session.userId) {

        return res.status(400).send('<h1>Para volver a ingresar, cierra tu sesión activa</h1>');
    }
    next();
}

// Ruta para login
app.post('/login', checkSession, (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).send('Por favor ingresa usuario, contraseña y tipo de usuario');
    }

    let sql;
    if (role === 'Cliente') {
        sql = 'SELECT * FROM clientes WHERE username = ?';
    } else if (role === 'Desarrollador') {
        sql = 'SELECT * FROM desarrolladores WHERE username = ?';
    } else {
        return res.status(400).send('Tipo de usuario no válido');
    }

    con.query(sql, [username], (err, result) => {
        if (err) {
            console.log('Error en la consulta', err);
            return res.status(500).send('Error en el servidor');
        }

        if (result.length === 0) {
            return res.status(401).send('Usuario no encontrado');
        }

        const user = result[0];

        // Comparar la contraseña directamente (sin cifrado)
        if (password === user.password) {
            req.session.userId = role === 'Cliente' ? user.id_cliente : user.id_desarrollador; // Asigna el ID correcto
            req.session.username = user.username;
            req.session.role = role;

            if (role === 'Cliente') {
                return res.redirect('/cliente.html');
            } else if (role === 'Desarrollador') {
                return res.redirect('/desarrollador.html');
            }
        } else {
            return res.status(401).send('Contraseña incorrecta');
        }
    });
});



// Ruta para registro (con generación de cookie de sesión)
app.post('/register', checkSession, (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Por favor, ingrese un nombre de usuario y una contraseña');
    }

    // Insertar nuevo cliente en la base de datos
    con.query('INSERT INTO clientes (username, password,dinero) VALUES (?, ?,?)', [username, password,50], (err, result) => {
        if (err) {
            console.log("Error al registrar usuario", err);
            return res.status(500).send("Error al registrar usuario");
        }

        // Obtener el usuario recién registrado
        con.query('SELECT * FROM clientes WHERE username = ?', [username], (err, result) => {
            if (err) {
                console.log('Error al obtener el usuario recién registrado', err);
                return res.status(500).send('Error al obtener el usuario');
            }

            const user = result[0];  // El primer resultado que debería ser el único usuario con ese nombre

            // Crear una sesión para el usuario registrado
            req.session.userId = user.id_cliente;  // Asignar el ID del cliente
            req.session.username = user.username; // Asignar el nombre de usuario
            req.session.role = 'Cliente';         // Asignar el rol de cliente

            return res.redirect('/cliente.html');  // Redirigir al cliente a su página después de iniciar sesión
        });
    });
});


// Ruta de cierre de sesión
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error al cerrar sesión');
        }
        res.redirect('/Index.html'); // Redirigir al login después de destruir la sesión
    });
});

function checkSessionRedirect(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).send('<h1>Necesitas iniciar sesión para acceder a esta página</h1>');
    }
    next(); // Si la sesión está activa, permite continuar con la solicitud
}

// Ruta para cliente.html, asegurando que el usuario esté autenticado
app.get('/cliente.html', checkSessionRedirect, (req, res) => {
    res.sendFile(__dirname + '/public/cliente.html');
});

// Ruta para desarrollador.html, asegurando que el usuario esté autenticado
app.get('/desarrollador.html', checkSessionRedirect, (req, res) => {
    res.sendFile(__dirname + '/public/desarrollador.html');
});

// Ruta para agregar productos al carrito de compras
// Ruta para agregar productos al carrito de compras
app.post('/agregarAlCarrito', (req, res) => {
    const { id_producto, cantidad } = req.body;
    const idCliente = req.session.userId;

    if (!idCliente) {
        return res.send('Debes iniciar sesión para agregar productos al carrito');
    }

    // Verificar cuántos productos distintos tiene el cliente en el carrito
    con.query('SELECT COUNT(*) AS cantidadProductos FROM carrito_compras WHERE id_cliente = ?', [idCliente], (err, resultado) => {
        if (err) {
            console.log("Error al verificar cantidad de productos en carrito", err);
            return res.status(500).send('Error al verificar carrito');
        }

        const cantidadProductos = resultado[0].cantidadProductos || 0;

        // Si el cliente ya tiene 10 productos distintos en el carrito, no permitir agregar más
        if (cantidadProductos >= 10) {
            return res.send('No puedes agregar más de 10 productos al carrito');
        }

        // Verificar si el producto existe en la base de datos
        con.query('SELECT * FROM productos WHERE id_producto = ?', [id_producto], (err, resultado) => {
            if (err) {
                console.log("Error al buscar producto", err);
                return res.status(500).send('Error al buscar producto');
            }

            const producto = resultado[0];
            if (!producto) {
                return res.send('Producto no encontrado');
            }

            // Validar la cantidad
            const cantidadNumerica = parseInt(cantidad);
                if (isNaN(cantidadNumerica) || cantidadNumerica < 1 || cantidadNumerica > 100) {
                return res.send('La cantidad debe ser un número entre 1 y 100');
                }

            

            // Verificar si el cliente ya tiene el producto en su carrito
            con.query('SELECT * FROM carrito_compras WHERE id_cliente = ? AND id_producto = ?', [idCliente, id_producto], (err, resultadoCarrito) => {
                if (err) {
                    console.log("Error al verificar carrito", err);
                    return res.status(500).send('Error al verificar carrito');
                }

                if (resultadoCarrito.length > 0) {
                    // Si el producto ya está en el carrito, actualizamos la cantidad con la nueva cantidad
                    if (cantidadNumerica > producto.cantidad_stock) {
                        return res.send('No hay suficiente stock disponible');
                    }

                    // Actualizar la cantidad en el carrito (reemplazar la existente con la nueva)
                    con.query('UPDATE carrito_compras SET cantidad = ? WHERE id_cliente = ? AND id_producto = ?', [cantidadNumerica, idCliente, id_producto], (err, respuesta) => {
                        if (err) {
                            console.log("Error al actualizar carrito", err);
                            return res.status(500).send('Error al actualizar carrito');
                        }

                        res.send('Producto actualizado en el carrito');
                    });
                } else {
                    // Si el producto no está en el carrito, lo agregamos
                    if (cantidadNumerica > producto.cantidad_stock) {
                        return res.send('No hay suficiente stock disponible');
                    }

                    // Insertar producto en el carrito, incluyendo el nombre del producto y el precio unitario
                    con.query('INSERT INTO carrito_compras (id_cliente, id_producto, producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?)', 
                    [idCliente, id_producto, producto.nombre, cantidadNumerica, producto.precio], 
                    (err, respuesta) => {
                        if (err) {
                            console.log("Error al agregar producto al carrito", err);
                            return res.status(500).send('Error al agregar producto al carrito');
                        }

                        res.send('Producto agregado al carrito');
                    });
                }
            });
        });
    });
});



// Ruta para ver los productos del carrito
app.get('/carrito', (req, res) => {
    const idCliente = req.session.userId;
    if (!idCliente) {
        return res.send('Debes iniciar sesión para ver los productos.');
    }

    // Consulta para obtener los productos en el carrito y calcular el total
    con.query('SELECT *, (cantidad * precio_unitario) AS total_producto FROM carrito_compras WHERE id_cliente = ?', [idCliente], (err, respuesta) => {
        if (err) {
            console.log('ERROR: ', err);
            return res.status(500).send('Error al obtener productos del carrito');
        }

        if (respuesta.length === 0) {
            return res.send('<h1>Tu carrito está vacío.</h1>');
        }

        let carritoHTML = '';
        let totalCarrito = 0; // Variable para almacenar el total del carrito

        // Iterar sobre los productos en el carrito
        respuesta.forEach(item => {
            const totalProducto = parseFloat(item.total_producto); // Asegurarnos de que sea un número decimal
            carritoHTML += `<tr>
                                <td style="text-align: center;">${item.id_cliente}</td>
                                <td style="text-align: center;">${item.id_producto}</td>
                                <td style="text-align: center;">${item.producto}</td>
                                <td style="text-align: center;">${item.cantidad}</td>
                                <td style="text-align: center;">${item.precio_unitario}</td>
                                <td style="text-align: center;">${totalProducto.toFixed(2)}</td>
                            </tr>`;
            totalCarrito += totalProducto; // Sumar el total del producto al total del carrito
        });

        return res.send(`
            <div class="container d-flex justify-content-center align-items-center min-vh-100">
                <div class="text-center">
                    <h2 class="text-warning">Carrito</h2>
                    <table class="table table-bordered table-hover" style="font-size: 1.5rem; background-color: white; color: black;">
                        <thead class="thead-dark" style="background-color: #6f4f28;">
                            <tr>
                                <th style="text-align: center;">cliente</th>
                                <th style="text-align: center;">id_producto</th>
                                <th style="text-align: center;">producto</th>
                                <th style="text-align: center;">cantidad</th>
                                <th style="text-align: center;">PU</th>
                                <th style="text-align: center;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${carritoHTML}
                        </tbody>
                    </table>
                    <h3>Total del carrito: $${totalCarrito.toFixed(2)}</h3>
                </div>
            </div>
        `);
    });
});

app.post('/eliminarcarro', (req, res) => {
    const idCliente = req.session.userId;
    if (!idCliente) {
        return res.send('Debes iniciar sesión para borrar los productos.');
    }

    let id = req.body.id_producto;

    con.query('DELETE FROM carrito_compras WHERE id_producto = ?', [id], (err, respuesta) => {
        if (err) {
            console.log("Error al borrar producto", err);
            return res.status(500).send("Error al borrar producto");
        }

        if (respuesta.affectedRows === 0) {
            return res.send("No se encontró el producto con el ID proporcionado.");
        }

        return res.send(`Producto con ID ${id} ha sido eliminado.`);
    });
});



// Ruta para agregar dinero a la cuenta de cliente
app.post('/dinero', (req, res) => {
    const idCliente = req.session.userId;
    if (!idCliente) {
        return res.status(401).send('Debes iniciar sesión para agregar dinero.');
    }

    let cantidad = parseFloat(req.body.cantidad_dinero);

    // Validar que la cantidad sea un número válido
    if (isNaN(cantidad)) {
        return res.status(400).send('La cantidad debe ser un número válido.');
    }

    // Validaciones adicionales
    if (cantidad <= 0) {
        return res.status(400).send('La cantidad debe ser mayor a 0.');
    }

    if (cantidad > 30000) {
        return res.status(400).send('No puedes ingresar más de $30,000.');
    }

    // Obtener el saldo actual del cliente
    con.query('SELECT dinero FROM clientes WHERE id_cliente = ?', [idCliente], (err, result) => {
        if (err) {
            console.log("Error al obtener saldo del cliente", err);
            return res.status(500).send("Error al obtener saldo del cliente");
        }

        let saldoActual = parseFloat(result[0].dinero) || 0;
        let nuevoSaldo = saldoActual + cantidad;

        if (nuevoSaldo > 30000) {
            return res.status(400).send('El saldo total no puede exceder $30,000.');
        }

        // Actualizar saldo en la base de datos
        con.query('UPDATE clientes SET dinero = ? WHERE id_cliente = ?', [nuevoSaldo, idCliente], (err, resultado) => {
            if (err) {
                console.log("Error al actualizar saldo del cliente", err);
                return res.status(500).send("Error al actualizar saldo del cliente");
            }
            return res.send(`Dinero agregado correctamente. Tu nuevo saldo es: $${nuevoSaldo.toFixed(2)}`);
        });
    });
});

app.get('/verSaldo', (req, res) => {
    const idCliente = req.session.userId;
    if (!idCliente) {
        return res.status(401).send('Debes iniciar sesión para ver tu saldo.');
    }

    // Obtener el saldo actual del cliente
    con.query('SELECT dinero FROM clientes WHERE id_cliente = ?', [idCliente], (err, result) => {
        if (err) {
            console.log("Error al obtener saldo del cliente", err);
            return res.status(500).send("Error al obtener saldo del cliente");
        }

        let saldoActual = parseFloat(result[0].dinero) || 0;
        return res.send(`Tu saldo actual es: $${saldoActual.toFixed(2)}`);
    });
});


// Ruta para realizar la compra
app.post('/realizarCompra', (req, res) => {
    const idCliente = req.session.userId;
    if (!idCliente) {
        return res.status(401).send('Debes iniciar sesión para realizar una compra.');
    }

    con.query(`SELECT c.*, p.cantidad_stock 
               FROM carrito_compras c 
               JOIN productos p ON c.id_producto = p.id_producto 
               WHERE c.id_cliente = ?`, [idCliente], (err, carrito) => {
        if (err) {
            console.log("Error al obtener productos del carrito", err);
            return res.status(500).send('Error al obtener productos del carrito');
        }

        if (carrito.length === 0) {
            return res.status(400).send('Tu carrito está vacío.');
        }

        let totalCompra = 0;
        let detalles = carrito.map(item => {
            const precioUnitario = parseFloat(item.precio_unitario) || 0;
            const totalProducto = item.cantidad * precioUnitario;
            totalCompra += totalProducto;

            return {
                id_producto: item.id_producto,
                nombre: item.producto,
                cantidad: item.cantidad,
                precio_unitario: precioUnitario,
                total_producto: totalProducto
            };
        });

        con.query('SELECT dinero FROM clientes WHERE id_cliente = ?', [idCliente], (err, result) => {
            if (err) {
                console.log("Error al obtener saldo del cliente", err);
                return res.status(500).send('Error al obtener saldo del cliente');
            }

            const saldoActual = parseFloat(result[0].dinero) || 0;

            if (saldoActual < totalCompra) {
                return res.status(400).send('No tienes suficiente saldo para realizar esta compra.');
            }

            con.beginTransaction(err => {
                if (err) {
                    console.log("Error al iniciar transacción", err);
                    return res.status(500).send('Error al iniciar la transacción');
                }

                const nuevoSaldo = saldoActual - totalCompra;
                con.query('UPDATE clientes SET dinero = ? WHERE id_cliente = ?', [nuevoSaldo, idCliente], (err) => {
                    if (err) {
                        console.log("Error al actualizar saldo del cliente", err);
                        return con.rollback(() => {
                            res.status(500).send('Error al actualizar saldo del cliente');
                        });
                    }

                    // Registrar el pedido
                    con.query(
                        'INSERT INTO pedidos (id_cliente, monto, detalles, fecha_compra) VALUES (?, ?, ?, NOW())',
                        [idCliente, totalCompra, JSON.stringify(detalles)],
                        (err, result) => {
                            if (err) {
                                console.log("Error al registrar el pedido", err);
                                return con.rollback(() => {
                                    res.status(500).send('Error al registrar el pedido');
                                });
                            }

                            const idPedido = result.insertId;

                            // Reducir el stock de los productos comprados
                            let stockPromises = carrito.map(item => {
                                return new Promise((resolve, reject) => {
                                    const nuevoStock = item.cantidad_stock - item.cantidad;

                                    if (nuevoStock < 0) {
                                        return reject(`No hay suficiente stock para el producto ${item.producto}`);
                                    }

                                    con.query(
                                        'UPDATE productos SET cantidad_stock = ? WHERE id_producto = ?',
                                        [nuevoStock, item.id_producto],
                                        (err) => {
                                            if (err) {
                                                console.log("Error al reducir el stock del producto", err);
                                                return reject(`Error al reducir el stock del producto ${item.producto}`);
                                            }
                                            resolve();
                                        }
                                    );
                                });
                            });

                            // Esperar a que todas las actualizaciones de stock se completen
                            Promise.all(stockPromises)
                                .then(() => {
                                    // Vaciar el carrito después de actualizar el stock
                                    con.query('DELETE FROM carrito_compras WHERE id_cliente = ?', [idCliente], (err) => {
                                        if (err) {
                                            console.log("Error al vaciar el carrito", err);
                                            return con.rollback(() => {
                                                res.status(500).send('Error al vaciar el carrito');
                                            });
                                        }

                                        con.commit(err => {
                                            if (err) {
                                                console.log("Error al confirmar la transacción", err);
                                                return con.rollback(() => {
                                                    res.status(500).send('Error al realizar la compra');
                                                });
                                            }

                                            let ticketHTML = `
                                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
                                                    <h1 style="text-align: center; color: #6f4f28;">Panadería La Desesperanza</h1>
                                                    <h3 style="text-align: center; color: #888;">Número de Venta: ${idPedido}</h3>
                                                    <p style="text-align: center; color: #555;">Fecha: ${new Date().toLocaleString()}</p>
                                                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                                                    <h3 style="color: #6f4f28;">Productos Comprados:</h3>
                                                    <table style="width: 100%; border-collapse: collapse;">
                                                        <thead>
                                                            <tr>
                                                                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Producto</th>
                                                                <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Cantidad</th>
                                                                <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Precio</th>
                                                                <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            ${detalles.map(item => `
                                                                <tr>
                                                                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.nombre}</td>
                                                                    <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">${item.cantidad}</td>
                                                                    <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">$${item.precio_unitario.toFixed(2)}</td>
                                                                    <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">$${item.total_producto.toFixed(2)}</td>
                                                                </tr>
                                                            `).join('')}
                                                        </tbody>
                                                    </table>
                                                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                                                    <h2 style="text-align: right; color: #6f4f28;">Total: $${totalCompra.toFixed(2)}</h2>
                                                    <p style="text-align: center; color: #555;">¡Gracias por tu compra! Esperamos verte de nuevo pronto.</p>
                                                </div>
                                            `;

                                            res.send(ticketHTML);
                                        });
                                    });
                                })
                                .catch(err => {
                                    console.log("Error al reducir el stock:", err);
                                    con.rollback(() => {
                                        res.status(400).send(err);
                                    });
                                });
                        }
                    );
                });
            });
        });
    });
});





app.get('/verTodosPedidos', (req, res) => {
    if (!req.session.userId || req.session.role !== 'Desarrollador') {
        return res.status(401).send('<h1>No tienes permiso para ver esta página.</h1>');
    }

    con.query('SELECT p.*, c.username FROM pedidos p JOIN clientes c ON p.id_cliente = c.id_cliente', (err, pedidos) => {
        if (err) {
            console.log("Error al obtener los pedidos", err);
            return res.status(500).send('Error al obtener los pedidos.');
        }

        if (pedidos.length === 0) {
            return res.send('<h1>No hay pedidos registrados.</h1>');
        }

        let pedidosHTML = pedidos.map(pedido => {
            let detalles;
            try {
                // Verifica si ya es un objeto, de lo contrario, parsea
                detalles = typeof pedido.detalles === 'string' ? JSON.parse(pedido.detalles) : pedido.detalles;
            } catch (error) {
                console.log(`Error al parsear los detalles del pedido #${pedido.id_pedido}:`, error);
                detalles = [];
            }

            const productosHTML = detalles.map(producto => `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${producto.nombre}</td>
                    <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">${producto.cantidad}</td>
                    <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">$${producto.precio_unitario.toFixed(2)}</td>
                    <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">$${producto.total_producto.toFixed(2)}</td>
                </tr>
            `).join('');

            return `
                <div style="margin-bottom: 40px; border: 1px solid #ccc; border-radius: 10px; background-color: #f9f9f9; padding: 20px;">
                    <h3 style="text-align: center; color: #6f4f28;">Pedido #${pedido.id_pedido}</h3>
                    <p style="text-align: center; color: #888;">Cliente: ${pedido.username}</p>
                    <p style="text-align: center; color: #888;">Fecha: ${new Date(pedido.fecha_compra).toLocaleString()}</p>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Producto</th>
                                <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Cantidad</th>
                                <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Precio</th>
                                <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productosHTML}
                        </tbody>
                    </table>
                    <h4 style="text-align: right; color: #6f4f28;">Total del Pedido: $${parseFloat(pedido.monto).toFixed(2)}</h4>
                </div>
            `;
        }).join('');

        res.send(`
            <div style="font-family: Arial, sans-serif; max-width: 90%; margin: 20px auto;">
                <h1 style="text-align: center; color: #6f4f28;">Historial de Todos los Pedidos</h1>
                ${pedidosHTML}
            </div>
        `);
    });
});



app.listen(3002, () => {
    console.log('Servidor escuchando en el puerto 3002');
});