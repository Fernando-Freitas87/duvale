const express = require('express');
const { getImoveisGraficos } = require('../controllers/imoveisGraficosController');

const router = express.Router();

/**
 * Rota: /api/imoveis/graficos
 * Descrição: Retorna os dados necessários para gerar os gráficos de imóveis.
 */
router.get('/graficos', getImoveisGraficos);

module.exports = router;