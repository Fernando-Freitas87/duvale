const express = require('express');
const router = express.Router();
const caixaController = require('../controllers/caixaController');

// Rota para obter o saldo e transações
router.get('/', caixaController.getCaixa);

// Rota para registrar uma nova transação (entrada ou saída)
router.post('/', caixaController.registrarTransacao);

module.exports = router;