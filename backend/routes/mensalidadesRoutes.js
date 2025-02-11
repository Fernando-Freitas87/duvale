const express = require('express');
const router = express.Router();
const mensalidadesController = require('../controllers/mensalidadesController'); // Adicione esta linha
const { getDadosBasicosCliente } = require("../controllers/inquilinoController");
const { authenticateToken } = require("../middlewares/auth");

// Rotas existentes no controlador mensalidadesController
router.get('/avisos', mensalidadesController.getAvisosGerenciais);
router.get('/em-atraso', mensalidadesController.getAtrasados);
router.get('/a-vencer', mensalidadesController.getAVencer);
router.get('/resumo', mensalidadesController.getResumo);
router.put('/:id/status', mensalidadesController.atualizarStatusMensalidade);
router.get("/cliente/dados-basicos", authenticateToken, getDadosBasicosCliente);

module.exports = router;