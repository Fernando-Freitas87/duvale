// relatoriosController.js
const PDFDocument = require("pdfkit");
const db = require("../db");

async function getRelatorioImoveis(req, res) {
  try {
      // 1) Consulta o banco de dados e verifica se há dados
      const [rows] = await db.execute(`
          SELECT id, descricao, endereco, enel, cagece, tipo, status 
          FROM imoveis
      `);

      if (!rows || rows.length === 0) {
          return res.status(404).json({ error: "Nenhum imóvel encontrado." });
      }

      // 2) Configura cabeçalhos para exibir o PDF corretamente
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=relatorio_imoveis.pdf");

      // 3) Cria o documento PDF
      const doc = new PDFDocument({ margin: 50 });
      doc.pipe(res); // Envia o PDF diretamente na resposta HTTP

      // 4) Adiciona título ao PDF
      doc.fontSize(18).text("Relatório de Imóveis", { align: "center" });
      doc.moveDown(1);

      // 5) Define a estrutura da tabela (formato correto para pdfkit-table)
      const table = {
          headers: ["ID", "Descrição", "Endereço", "ENEL", "CAGECE", "Tipo", "Status"],
          rows: rows.map(row => [
              row.id, row.descricao, row.endereco, row.enel, row.cagece, row.tipo, row.status
          ])
      };

      // 6) Renderiza a tabela no PDF (sem await)
      doc.table(table, {
          prepareHeader: () => doc.fontSize(12).font("Helvetica-Bold"),
          prepareRow: () => doc.fontSize(10).font("Helvetica")
      });

      // 7) Finaliza o documento corretamente
      doc.on("finish", () => {
          console.log("PDF gerado com sucesso!");
      });
      doc.end();

  } catch (error) {
      console.error("Erro ao gerar relatório de imóveis:", error);
      res.status(500).json({ error: "Erro interno ao gerar relatório." });
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