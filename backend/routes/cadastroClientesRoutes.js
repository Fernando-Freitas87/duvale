const express = require('express');
const router = express.Router();
const cadastroClientesController = require('../controllers/cadastroClientesController');
const db = require('../db'); // <--- IMPORTANTE: importar o arquivo de conexão com o banco

// Rota para cadastro de clientes
router.post('/', cadastroClientesController.cadastrarCliente);

// GET /api/cadastro/clientes
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM clientes');
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Nenhum cliente encontrado.' });
    }
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ error: 'Erro ao listar clientes.' });
  }
});

module.exports = router;