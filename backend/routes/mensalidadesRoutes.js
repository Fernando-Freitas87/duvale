const express = require('express');
const router = express.Router();
const mensalidadesController = require('../controllers/mensalidadesController');
const { getDadosBasicosCliente, getHistoricoCliente } = require("../controllers/inquilinoController");
const { authenticateToken } = require("../middlewares/auth");

// Rotas do controlador mensalidadesController
router.get('/avisos', mensalidadesController.getAvisosGerenciais);
router.get('/em-atraso', mensalidadesController.getAtrasados);
router.get('/a-vencer', mensalidadesController.getAVencer);
router.get('/resumo', mensalidadesController.getResumo);
router.put('/:id/status', mensalidadesController.atualizarStatusMensalidade);

// Rotas do cliente
router.get("/cliente/dados-basicos", authenticateToken, getDadosBasicosCliente);
router.get("/historico", authenticateToken, getHistoricoCliente);

module.exports = router;