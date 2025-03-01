// Verifica se jsPDF está carregado
if (!window.jspdf) {
  console.error("⚠ Erro: jsPDF não carregado. Verifique a importação da biblioteca.");
  alert("Erro ao carregar jsPDF. Atualize a página e tente novamente.");
  return;
}

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
    document.body.style.cursor = "wait"; // Exibe indicador de carregamento

    // 1️⃣ Faz requisição ao backend para obter os dados do relatório
    const response = await fetch(`${apiBaseUrl}/api/relatorios/${tipoRelatorio}`);

    document.body.style.cursor = "default"; // Remove indicador de carregamento

    if (!response.ok) {
      throw new Error(`Erro ao buscar relatório (${response.status})`);
    }

    const dadosRelatorio = await response.json();

    // 2️⃣ Cria um novo documento PDF no modo paisagem
    const doc = new jsPDF({ orientation: "landscape" });

    // 3️⃣ Adiciona o título do relatório
    doc.setFontSize(18);
    doc.text(dadosRelatorio.titulo, 15, 20);

    // 4️⃣ Adiciona a descrição
    doc.setFontSize(12);
    doc.text(dadosRelatorio.descricao, 15, 30);

    // 5️⃣ Adiciona uma tabela com os dados
    let y = 40; // Posição inicial

    // Adiciona cabeçalhos com colunas mais espaçadas
    doc.setFontSize(10).setFont("helvetica", "bold");
    doc.text("Descrição", 30, y);
    doc.text("Endereço", 70, y);
    doc.text("ENEL", 140, y);
    doc.text("CAGECE", 160, y);
    doc.text("Tipo", 180, y);
    doc.text("Status", 210, y);
    y += 10;

    // Adiciona os dados do relatório
    doc.setFontSize(10).setFont("helvetica", "normal");
    dadosRelatorio.dados.forEach((item) => {
      if (y > 190) { // Se a página estiver cheia, adiciona uma nova página
        doc.addPage();
        y = 20; // Reinicia a posição
      }

      doc.text(item.descricao, 30, y);
      doc.text(item.endereco, 70, y);
      doc.text(String(item.enel), 140, y);
      doc.text(String(item.cagece), 160, y);
      doc.text(item.tipo, 180, y);
      doc.text(item.status, 210, y);
      y += 10;
    });

    // 6️⃣ Abre o PDF no navegador
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
  document.querySelectorAll(".btn-primary-relatorio").forEach(botao => {
    botao.addEventListener("click", (event) => {
      event.preventDefault();
      const tipoRelatorio = botao.getAttribute("data-relatorio") || "imoveis";
      gerarPDF(tipoRelatorio);
    });
  });
};

// Executa a configuração assim que o DOM estiver carregado
document.addEventListener("DOMContentLoaded", configurarBotoesRelatorio);