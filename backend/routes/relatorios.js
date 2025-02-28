// routes/relatorios.js

const express = require("express");
const router = express.Router();
const {
  getRelatorioImoveis,
  getRelatorioClientes,
  getRelatorioContratos,
  getRelatorioFinanceiro,
} = require("../controllers/relatoriosController");

// Rota para relatório de Imóveis
router.get("/imoveis", getRelatorioImoveis);

// Rota para relatório de Clientes
router.get("/clientes", getRelatorioClientes);

// Rota para relatório de Contratos
router.get("/contratos", getRelatorioContratos);

// Rota para relatório Financeiro
router.get("/financeiro", getRelatorioFinanceiro);

module.exports = router;