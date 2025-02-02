const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth'); // Middleware para autenticação
const { getAvisosGerenciais } = require('../controllers/mensalidadesController');

// Rota protegida para obter avisos gerenciais
router.get('/avisos-gerenciais', authenticateToken, getAvisosGerenciais);

module.exports = router;