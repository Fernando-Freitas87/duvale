const express = require('express');
const { getMensalidadesGraficos } = require('../controllers/mensalidadesGraficosController');


const router = express.Router();

/**
 * Rota: /api/mensalidades/graficos
 * Descrição: Retorna os dados necessários para gerar os gráficos de mensalidades.
 */
router.get('/graficos', getMensalidadesGraficos);


module.exports = router;