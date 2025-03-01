const express = require("express");
const router = express.Router();
const { getRelatorioImoveis } = require("../controllers/relatoriosController"); // Confirme este caminho!

// Verifica se a função está definida
if (!getRelatorioImoveis) {
  throw new Error("Erro crítico: getRelatorioImoveis não foi importado corretamente.");
}

// Define a rota para gerar o relatório de imóveis
router.get("/relatorios/imoveis", getRelatorioImoveis);

module.exports = router;