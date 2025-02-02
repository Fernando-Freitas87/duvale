const express = require('express');
const router = express.Router();
const CadastroImoveisController = require('../controllers/CadastroImoveisController');
const db = require('../db');  // Conexão com o banco de dados

router.post('/', CadastroImoveisController.cadastrarImovel);
// Rota para listar apenas imóveis sem contrato
router.get('/disponiveis', async (req, res) => {
    try {
      // Exemplo de consulta simples que filtra imóveis não presentes na tabela de contratos
      const [rows] = await db.query(`
        SELECT *
        FROM imoveis
        WHERE id NOT IN (SELECT imovel_id FROM contratos)
      `);
  
      // Se quiser filtrar também por status = 'disponível', basta adicionar:
      // WHERE status = 'disponivel'
      //   AND id NOT IN (SELECT imovel_id FROM contratos)
  
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Nenhum imóvel disponível.' });
      }
  
      res.status(200).json(rows);
    } catch (error) {
      console.error('Erro ao buscar imóveis disponíveis:', error);
      res.status(500).json({ error: 'Erro ao buscar imóveis disponíveis.' });
    }
  });
  


module.exports = router;
