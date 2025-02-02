// rota para gerenciar imoveis 
// backend/routes/imoveisRoutes.js
const express = require('express');
const router = express.Router();
const imoveisController = require('../controllers/imoveisController');

// GET /api/imoveis -> Lista todos
router.get('/', imoveisController.listarImoveis);

// POST /api/imoveis -> Cria um novo imóvel (se quiser)
router.post('/', imoveisController.criarImovel);

// PUT /api/imoveis/:id -> Atualiza imóvel existente (se quiser)
router.put('/:id', imoveisController.atualizarImovel);

// DELETE /api/imoveis/:id -> Deleta imóvel (se quiser)
router.delete('/:id', imoveisController.deletarImovel);

module.exports = router;