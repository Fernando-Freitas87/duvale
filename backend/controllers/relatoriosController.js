const db = require("../db");

async function getRelatorioImoveis(req, res) {
  try {
      console.log("Recebida requisição para relatório de imóveis...");

      // 1) Testa conexão com banco
      await db.execute("SELECT 1");
      console.log("Conexão com banco de dados OK!");

      // 2) Consulta os dados dos imóveis
      const [rows] = await db.execute(`
          SELECT id, descricao, endereco, enel, cagece, tipo, status 
          FROM imoveis
      `);

      if (!rows || rows.length === 0) {
          return res.status(404).json({ error: "Nenhum imóvel encontrado." });
      }

      // 3) Retorna os dados como JSON
      res.json({
          titulo: "Relatório de Imóveis",
          descricao: "Lista de imóveis cadastrados no sistema.",
          dados: rows
      });

  } catch (error) {
      console.error("Erro ao gerar JSON de imóveis:", error);
      res.status(500).json({ error: "Erro ao buscar os dados dos imóveis." });
  }
}

module.exports = { getRelatorioImoveis };