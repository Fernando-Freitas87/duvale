-- Criação do Banco de Dados
CREATE DATABASE IF NOT EXISTS topogeo;
USE topogeo;

-- Tabela: Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    pin VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: Services
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    client_link VARCHAR(255) NOT NULL UNIQUE, -- Link único para o cliente
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: Service_Steps
CREATE TABLE IF NOT EXISTS service_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL, -- Chave estrangeira para Services
    step_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('Pending', 'In Progress', 'Completed') DEFAULT 'Pending',
    responsible VARCHAR(255) DEFAULT NULL,
    start_date TIMESTAMP NULL,
    end_date TIMESTAMP NULL,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);
