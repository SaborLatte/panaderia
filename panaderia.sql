create database panaderia;
USE panaderia;
CREATE TABLE Producto (
    id_producto INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL,
    categoria VARCHAR(50), -- Ejemplos: "Día de Muertos", "Halloween", etc.
    imagen_url VARCHAR(255)
);
CREATE TABLE Cliente (
    id_cliente INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(15)
);
CREATE TABLE Pedidos (
    id_pedido INT PRIMARY KEY AUTO_INCREMENT,
    numero_pedido VARCHAR(20) UNIQUE NOT NULL, 
    id_cliente INT, 
    id_producto INT, 
    especificaciones TEXT, 
    fecha_pedido DATETIME NOT NULL, 
    fecha_entrega DATETIME, 
    sucursal VARCHAR(100), 
    metodo_pago ENUM('Efectivo', 'Tarjeta', 'Transferencia', 'Otro') NOT NULL, 
    total DECIMAL(10, 2) NOT NULL, 
    estado ENUM('Pagado', 'Pendiente') NOT NULL, 
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente),
    FOREIGN KEY (id_producto) REFERENCES Productos(id_producto)
);
CREATE TABLE Facturas (
    id_factura INT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT,
    monto DECIMAL(10, 2) NOT NULL,
    fecha_emision DATETIME NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES Pedidos(id_pedido)
);