// Importa jsPDF (certifique-se de que a biblioteca está no projeto)
const { jsPDF } = window.jspdf;

// Define a URL base da API (muda automaticamente entre local e produção)
const apiBaseUrl = window.location.hostname.includes("localhost")
  ? "http://localhost:3000"
  : "https://duvale-production.up.railway.app";

/**
 * Busca os dados do relatório no backend e gera o PDF no frontend.
 *
 * @param {string} tipoRelatorio - Tipo do relatório (ex: "imoveis", "clientes", "contratos").
 */
const gerarPDF = async (tipoRelatorio) => {
  try {
    // 1️⃣ Faz requisição ao backend para obter os dados do relatório
    const response = await fetch(`${apiBaseUrl}/api/relatorios/${tipoRelatorio}`);

    if (!response.ok) {
      throw new Error(`Erro ao buscar relatório (${response.status})`);
    }

    const dadosRelatorio = await response.json();

    // 2️⃣ Cria um novo documento PDF
    const doc = new jsPDF();

    // 3️⃣ Adiciona o título do relatório
    doc.setFontSize(18);
    doc.text(dadosRelatorio.titulo, 10, 20);

    // 4️⃣ Adiciona a descrição
    doc.setFontSize(12);
    doc.text(dadosRelatorio.descricao, 10, 30);

    // 5️⃣ Adiciona uma tabela com os dados
    let y = 40; // Posição inicial

    // Adiciona cabeçalhos
    doc.setFontSize(10).setFont("helvetica", "bold");
    doc.text("ID", 10, y);
    doc.text("Descrição", 30, y);
    doc.text("Endereço", 90, y);
    doc.text("ENEL", 150, y);
    doc.text("CAGECE", 170, y);
    doc.text("Tipo", 190, y);
    doc.text("Status", 210, y);
    y += 10;

    // Adiciona os dados do relatório
    doc.setFontSize(10).setFont("helvetica", "normal");
    dadosRelatorio.dados.forEach((item) => {
      doc.text(String(item.id), 10, y);
      doc.text(item.descricao, 30, y);
      doc.text(item.endereco, 90, y);
      doc.text(String(item.enel), 150, y);
      doc.text(String(item.cagece), 170, y);
      doc.text(item.tipo, 190, y);
      doc.text(item.status, 210, y);
      y += 10;
    });

    // 6️⃣ abre o PDF no navegador
    window.open(doc.output("bloburl"), "_blank");

  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    alert("Erro ao gerar relatório. Tente novamente.");
  }
};

/**
 * Adiciona eventos aos botões de relatório.
 */
const configurarBotoesRelatorio = () => {
  document.querySelectorAll(".btn-primary").forEach(botao => {
    botao.addEventListener("click", (event) => {
      event.preventDefault();
      const tipoRelatorio = botao.getAttribute("data-relatorio") || "imoveis";
      gerarPDF(tipoRelatorio);
    });
  });
};

// Executa a configuração assim que o DOM estiver carregado
document.addEventListener("DOMContentLoaded", configurarBotoesRelatorio);