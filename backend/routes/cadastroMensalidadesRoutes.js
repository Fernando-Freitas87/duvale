const express = require('express');
const router = express.Router();
const cadastroMensalidadesController = require('../controllers/cadastroMensalidadesController');

router.post('/gerar', cadastroMensalidadesController.gerarMensalidades);

module.exports = router;
