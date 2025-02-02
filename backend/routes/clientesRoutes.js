const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth'); // Middleware de autenticação
const clientesController = require('../controllers/clientesController'); // Controlador de clientes

// ---------------------------------------------------------------------
// Rotas relacionadas aos clientes
// ---------------------------------------------------------------------

// 1. Obter informações do usuário autenticado
// Endpoint: GET /api/clientes/info
router.get('/info', authenticateToken, clientesController.getUserInfo);

// 2. Buscar avisos do cliente autenticado
// Endpoint: GET /api/clientes/avisos
router.get('/avisos', authenticateToken, clientesController.getAvisos);

// 3. Listar todos os clientes (apenas administradores)
// Endpoint: GET /api/clientes/listar
//router.get('/listar', authenticateToken, clientesController.listarClientes);

// 4. lista todos os clientes
// Endpoint: GET /api/clientes
router.get('/', authenticateToken, clientesController.listarClientes);



// ---------------------------------------------------------------------
// Exporta o roteador
// ---------------------------------------------------------------------
module.exports = router;