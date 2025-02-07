const express = require('express');
const router = express.Router();
const mensalidadesController = require('../controllers/mensalidadesController');
const { authenticateToken } = require("../middlewares/auth");

// Aplica autenticação a todas as rotas
router.use(authenticateToken);

// Rotas existentes no controlador mensalidadesController
// Obtém os avisos gerenciais relacionados às mensalidades
router.get('/avisos', mensalidadesController.getAvisosGerenciais);

// Retorna uma lista de mensalidades em atraso
router.get('/em-atraso', mensalidadesController.getAtrasados);

// Retorna uma lista de mensalidades a vencer
router.get('/a-vencer', mensalidadesController.getAVencer);

// Fornece um resumo das mensalidades
router.get('/resumo', mensalidadesController.getResumo);

// Atualiza o status de uma mensalidade específica
router.put('/:id/status', mensalidadesController.atualizarStatusMensalidade);

module.exports = router;