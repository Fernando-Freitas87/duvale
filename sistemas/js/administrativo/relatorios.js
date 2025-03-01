document.addEventListener("DOMContentLoaded", () => {
  if (!window.jspdf) {
    console.error("⚠ Erro: jsPDF não carregado. Verifique a importação da biblioteca.");
    alert("Erro ao carregar jsPDF. Atualize a página e tente novamente.");
    return;
  }

  const { jsPDF } = window.jspdf;

  const apiBaseUrl = window.location.hostname.includes("localhost")
    ? "http://localhost:3000"
    : "https://duvale-production.up.railway.app";

  const gerarPDF = async (tipoRelatorio) => {
    try {
      document.body.style.cursor = "wait";

      console.log(`🔗 Buscando relatório: ${tipoRelatorio}`);
      const response = await fetch(`${apiBaseUrl}/api/relatorios/${tipoRelatorio}`);

      document.body.style.cursor = "default";

      if (!response.ok) {
        console.error(`❌ Erro na API (${response.status}):`, await response.text());
        throw new Error(`Erro ao buscar relatório (${response.status})`);
      }

      const dadosRelatorio = await response.json();
      console.log("📄 Dados do relatório recebidos:", dadosRelatorio);

      // Criar documento PDF no modo paisagem
      const doc = new jsPDF({ orientation: "landscape" });

      // CABEÇALHO - Adicionando Logo corretamente
      fetch("./img/duvale.png")
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            doc.addImage(reader.result, "PNG", 15, 10, 30, 10);
          };
          reader.readAsDataURL(blob);
        })
        .catch(() => console.warn("⚠️ Logo não carregado. Verifique o caminho."));

      // Título do relatório
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(dadosRelatorio.titulo, 100, 20);

      // Data de geração do relatório
      const dataAtual = new Date().toLocaleDateString();
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text(`Data de emissão: ${dataAtual}`, 240, 20);

      // Descrição
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(dadosRelatorio.descricao, 15, 35);

      let y = 50;
      const limitePagina = doc.internal.pageSize.getHeight() - 20;

      // Cabeçalhos da tabela
      doc.setFontSize(10).setFont("helvetica", "bold");
      doc.setFillColor(200, 200, 200);
      doc.rect(15, y - 5, 260, 8, "F");
      doc.text("ID", 18, y);
      doc.text("Descrição", 40, y);
      doc.text("Endereço", 90, y);
      doc.text("ENEL", 160, y);
      doc.text("CAGECE", 180, y);
      doc.text("Tipo", 200, y);
      doc.text("Status", 230, y);
      y += 10;

      // Conteúdo da tabela
      doc.setFontSize(10).setFont("helvetica", "normal");
      dadosRelatorio.dados.forEach((item) => {
        if (y > limitePagina) {
          doc.addPage();
          y = 20;
        }

        doc.text(String(item.id), 18, y);
        doc.text(item.descricao, 40, y);
        doc.text(item.endereco, 90, y);
        doc.text(String(item.enel), 160, y);
        doc.text(String(item.cagece), 180, y);
        doc.text(item.tipo, 200, y);
        doc.text(item.status, 230, y);
        y += 8;
      });

      // Rodapé
      const totalPaginas = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Página ${i} de ${totalPaginas}`, 250, doc.internal.pageSize.getHeight() - 10);
      }

      // Abre o PDF no navegador
      window.open(doc.output("bloburl"), "_blank");

    } catch (error) {
      console.error("❌ Erro ao gerar PDF:", error);
      alert("Erro ao gerar relatório. Tente novamente.");
    }
  };

  // Adiciona eventos aos botões de relatório
  document.querySelectorAll(".btn-primary-relatorio").forEach(botao => {
    botao.addEventListener("click", (event) => {
      event.preventDefault();
      const tipoRelatorio = botao.getAttribute("data-relatorio") || "imoveis";
      gerarPDF(tipoRelatorio);
    });
  });
});