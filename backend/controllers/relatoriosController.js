// relatoriosController.js
const db = require('../db');
const PdfTable = require("pdfkit-table");

async function getRelatorioImoveis(req, res) {
  try {
      // 1) Consulta o banco de dados e obtém os dados
      const [rows] = await db.execute(`
          SELECT id, descricao, endereco, enel, cagece, tipo, status 
          FROM imoveis
      `);

      // 2) Configura os cabeçalhos HTTP para exibir inline no navegador
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=relatorio_imoveis.pdf");

      // 3) Cria o documento PDF
      const doc = new PDFDocument({ margin: 50 });
      doc.pipe(res); // Envia o PDF diretamente na resposta HTTP

      // 4) Adiciona título ao PDF
      doc.fontSize(18).text("Relatório de Imóveis", { align: "center" });
      doc.moveDown(1);

      // 5) Define a estrutura da tabela
      const table = {
          headers: [
              { label: "ID", property: "id", width: 50 },
              { label: "Descrição", property: "descricao", width: 150 },
              { label: "Endereço", property: "endereco", width: 200 },
              { label: "ENEL", property: "enel", width: 50 },
              { label: "CAGECE", property: "cagece", width: 50 },
              { label: "Tipo", property: "tipo", width: 70 },
              { label: "Status", property: "status", width: 70 },
          ],
          datas: rows, // Usa os dados consultados no banco
      };

      // 6) Renderiza a tabela no PDF
      await doc.table(table, {
          prepareHeader: () => doc.fontSize(12).font("Helvetica-Bold"),
          prepareRow: () => doc.fontSize(10).font("Helvetica")
      });

      // 7) Finaliza o documento
      doc.end();

  } catch (error) {
      console.error("Erro ao gerar relatório de imóveis em PDF:", error);
      res.status(500).json({ error: "Erro ao gerar relatório de imóveis." });
  }
}
  
  // Exemplo de controlador para relatório de clientes:
  async function getRelatorioClientes(req, res) {
    try {
      // const clientes = await db.query("SELECT * FROM clientes");
      const clientes = [
        { id: 1, nome: "João Silva", telefone: "9999-0001" },
        { id: 2, nome: "Maria Oliveira", telefone: "9999-0002" },
      ];
  
      return res.json({ data: clientes });
    } catch (error) {
      console.error("Erro ao gerar relatório de clientes:", error);
      return res.status(500).json({ error: "Erro ao gerar relatório de clientes." });
    }
  }
  
  // Exemplo de controlador para relatório de contratos:
  async function getRelatorioContratos(req, res) {
    try {
      // const contratos = await db.query("SELECT * FROM contratos");
      const contratos = [
        { id: 1, imovel_id: 1, cliente_id: 1, status: "Ativo" },
        { id: 2, imovel_id: 2, cliente_id: 2, status: "Inativo" },
      ];
  
      return res.json({ data: contratos });
    } catch (error) {
      console.error("Erro ao gerar relatório de contratos:", error);
      return res.status(500).json({ error: "Erro ao gerar relatório de contratos." });
    }
  }
  
  // Exemplo de controlador para relatório financeiro:
  async function getRelatorioFinanceiro(req, res) {
    try {
      // const financeiro = await db.query("SELECT * FROM pagamentos");
      // Ou consulte várias tabelas e monte um resumo
      const financeiro = {
        totalRecebido: 10000,
        totalAReceber: 2000,
        totalAtrasado: 800,
      };
  
      return res.json({ data: financeiro });
    } catch (error) {
      console.error("Erro ao gerar relatório financeiro:", error);
      return res.status(500).json({ error: "Erro ao gerar relatório financeiro." });
    }
  }
  
  module.exports = {
    getRelatorioImoveis,
    getRelatorioClientes,
    getRelatorioContratos,
    getRelatorioFinanceiro,
  };