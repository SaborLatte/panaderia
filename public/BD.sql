CREATE DATABASE IF NOT EXISTS desesperanza;
USE desesperanza;
CREATE TABLE IF NOT EXISTS clientes (
id_cliente INT AUTO_INCREMENT PRIMARY KEY, 
username VARCHAR(255) NOT NULL, 
password VARCHAR(255) NOT NULL,
dinero decimal (10,2) not null
);

INSERT INTO clientes (username, password,dinero) VALUES
('Kike', '123456','50'),
('cliente2', '123456a','50'),
('cliente3', '123456','50');

CREATE TABLE IF NOT EXISTS desarrolladores (
id_desarrollador INT AUTO_INCREMENT PRIMARY KEY,
username VARCHAR(255) NOT NULL,
password VARCHAR(255) NOT NULL
);
INSERT INTO desarrolladores (username, password) VALUES
('di', 'dip'),
('d2' , 'd2p'),
('d3', 'd30');

CREATE TABLE IF NOT EXISTS productos(
id_producto INT auto_increment primary key not null,
nombre VARCHAR(255) NOT NULL,
precio DECIMAL(10, 2) NOT NULL, 
cantidad_stock INT NOT NULL );

INSERT INTO productos (nombre, precio, cantidad_stock) VALUES
('Pan de Caja', 15.50, 100),
('Baguette', '12.00', 58),
('Pan de Molde', 18.00, 200);
drop database desesperanza;