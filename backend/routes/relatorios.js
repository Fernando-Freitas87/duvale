const express = require("express");
const router = express.Router();
const { getRelatorioImoveis } = require("../controllers/relatoriosController");

// 🔥 A rota deve estar exatamente assim:
router.get("/imoveis", getRelatorioImoveis);

module.exports = router;