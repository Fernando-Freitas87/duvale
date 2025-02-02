// Roteamento para gerenciar contratos
// backend/routes/contratosRoutes.js
const express = require('express');
const router = express.Router();
const contratosController = require('../controllers/contratosController');

// GET /api/contratos - Lista todos os contratos
router.get('/', contratosController.listarContratos);

// POST /api/contratos - Cria um novo contrato
router.post('/', contratosController.criarContrato);

// GET /api/contratos/gerar/:contratoId - Gera e disponibiliza um contrato em formato PDF
router.get('/gerar/:contratoId', contratosController.gerarContratoPDF);

// PUT /api/contratos/:id - Atualiza os detalhes de um contrato existente
router.put('/:id', contratosController.atualizarContrato);

// DELETE /api/contratos/:id - Exclui (ou inativa) um contrato existente
router.delete('/:id', contratosController.deletarContrato);

module.exports = router;