-- Create the main database for the restaurant
CREATE DATABASE restaurant_db;
USE restaurant_db;

-- Table to store user information, including roles
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role VARCHAR(50)
);

-- Table to store sales transactions
CREATE TABLE sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_number VARCHAR(20) NOT NULL,
  order_details TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  staff_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES users(id)
);



-- Table to store expense records
CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  description VARCHAR(255),
  amount DECIMAL(10,2),
  added_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (added_by) REFERENCES users(id)
);


-- Inventory table
CREATE TABLE inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) DEFAULT NULL,
  quantity INT DEFAULT 0,
  status ENUM('instock','outofstock') NOT NULL DEFAULT 'instock',
  notes TEXT DEFAULT NULL,
  added_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (added_by) REFERENCES users(id)
);
