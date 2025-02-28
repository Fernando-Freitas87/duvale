const PDFDocument = require("pdfkit");
const db = require("../db");

async function getRelatorioImoveis(req, res) {
  try {
      console.log("Recebida requisição para relatório de imóveis...");

      // Testa conexão com banco
      await db.execute("SELECT 1");
      console.log("Conexão com banco de dados OK!");

      // 1) Consulta o banco de dados
      const [rows] = await db.execute(`
          SELECT id, descricao, endereco, enel, cagece, tipo, status 
          FROM imoveis
      `);

      if (!rows || rows.length === 0) {
          return res.status(404).json({ error: "Nenhum imóvel encontrado." });
      }

      // 2) Configura os cabeçalhos HTTP
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=relatorio_imoveis.pdf");

      // 3) Cria o documento PDF
      const doc = new PDFDocument({ margin: 50 });
      doc.pipe(res); // Envia o PDF diretamente na resposta HTTP

      // 4) Adiciona título ao PDF
      doc.fontSize(18).text("Relatório de Imóveis", { align: "center" });
      doc.moveDown(1);

      // 5) Configuração da tabela
      const table = {
          headers: ["ID", "Descrição", "Endereço", "ENEL", "CAGECE", "Tipo", "Status"],
          rows: rows.map(row => [
              row.id, row.descricao, row.endereco, row.enel, row.cagece, row.tipo, row.status
          ])
      };

      // 6) Renderiza a tabela no PDF
      doc.table(table, {
          prepareHeader: () => doc.fontSize(12).font("Helvetica-Bold"),
          prepareRow: () => doc.fontSize(10).font("Helvetica")
      });

      // 7) Finaliza corretamente
      doc.on("finish", () => {
          console.log("PDF finalizado corretamente.");
      });
      doc.end();

  } catch (error) {
      console.error("Erro ao gerar relatório de imóveis:", error);
      res.status(500).json({ error: "Erro interno ao gerar relatório." });
  }
}

module.exports = { getRelatorioImoveis };



