const express = require('express');

// This file should only contain the controller logic and exports.
// Example (adjust or restore your actual logic):
// exports.getUserInfo = async (req, res) => { ... }
// exports.getAvisos = async (req, res) => { ... }
// exports.getDadosCliente = async (req, res) => { ... }
// exports.gerarPix = async (req, res) => { ... }
// exports.logout = async (req, res) => { ... }

// ---------------------------------------------------------------------
// Exporta o roteador
// ---------------------------------------------------------------------
module.exports = {
    getUserInfo,
    getAvisos,
    getDadosCliente,
    gerarPix,
    logout,
    obterClientePorId,
    listarClientes
};