const express = require('express');
const router = express.Router();
const cadastroMensalidadesController = require('../controllers/cadastroMensalidadesController');

router.post('/gerar', cadastroMensalidadesController.gerarMensalidades);
router.get('/mensalidades/cliente/:id/atrasadas', cadastroMensalidadesController.getMensalidadesAtrasadasCliente);

module.exports = router;
