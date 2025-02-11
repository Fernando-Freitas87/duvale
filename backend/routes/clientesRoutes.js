const express = require("express");
const router = express.Router();
const { getDadosBasicosCliente } = require("../controllers/clienteController");
const authMiddleware = require("../middlewares/authMiddleware");

// Rota GET /api/cliente/dados-basicos
router.get("/dados-basicos", authMiddleware, getDadosBasicosCliente);

module.exports = router;