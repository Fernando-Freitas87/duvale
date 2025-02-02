const express = require('express');
const router = express.Router();
const cadastroContratosController = require('../controllers/cadastroContratosController'); const db = require("../db"); // Conexão com o banco de dados


router.post('/', cadastroContratosController.cadastrarContrato);
// Rota para gerar mensalidades
router.post("/gerar-mensalidades", async (req, res) => {
    const { contratoId, totalMeses, valorAluguel, diaVencimento, dataInicio } = req.body;
  
    if (!contratoId || !totalMeses || !valorAluguel || !diaVencimento || !dataInicio) {
      return res.status(400).json({ error: "Dados insuficientes para gerar mensalidades." });
    }
  
    try {
      const mensalidades = [];
      const dataInicioDate = new Date(dataInicio);
  
      for (let i = 0; i < totalMeses; i++) {
        const dataVencimento = new Date(
          dataInicioDate.getFullYear(),
          dataInicioDate.getMonth() + i,
          diaVencimento
        );
  
        mensalidades.push([
          contratoId,
          valorAluguel,
          dataVencimento.toISOString().slice(0, 10), // Formato YYYY-MM-DD
          "pendente", // Status inicial da mensalidade
          new Date(), // criado_em
          new Date(), // atualizado_em
        ]);
      }
  
      const query = `
        INSERT INTO mensalidades (contrato_id, valor, data_vencimento, status, criado_em, atualizado_em)
        VALUES ?
      `;
  
      await db.query(query, [mensalidades]);
  
      res.status(201).json({ message: "Mensalidades geradas com sucesso!" });
    } catch (error) {
      console.error("Erro ao gerar mensalidades:", error.message);
      res.status(500).json({ error: "Erro ao gerar mensalidades." });
    }
  });

module.exports = router;
