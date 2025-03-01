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
      document.body.style.cursor = "wait"; // Exibe indicador de carregamento

      console.log(`🔗 Buscando relatório: ${tipoRelatorio}`);
      const response = await fetch(`${apiBaseUrl}/api/relatorios/${tipoRelatorio}`);

      document.body.style.cursor = "default"; // Retorna cursor normal

      if (!response.ok) {
        console.error(`❌ Erro na API (${response.status}):`, await response.text());
        throw new Error(`Erro ao buscar relatório (${response.status})`);
      }

      const dadosRelatorio = await response.json();
      console.log("📄 Dados do relatório recebidos:", dadosRelatorio);

      // Criar documento PDF no modo paisagem
      const doc = new jsPDF({ orientation: "landscape" });

      doc.setFontSize(18);
      doc.text(dadosRelatorio.titulo, 15, 20);
      doc.setFontSize(12);
      doc.text(dadosRelatorio.descricao, 15, 30);

      let y = 40;
      const limitePagina = doc.internal.pageSize.getHeight() - 20;

      // Adiciona cabeçalhos
      doc.setFontSize(10).setFont("helvetica", "bold");
      doc.text("Descrição", 30, y);
      doc.text("Endereço", 70, y);
      doc.text("Enel", 140, y);
      doc.text("Escritura", 160, y);
      doc.text("Tipo", 180, y);
      doc.text("Status", 210, y);
      y += 10;

      // Adiciona os dados no PDF
      doc.setFontSize(10).setFont("helvetica", "normal");
      dadosRelatorio.dados.forEach((item) => {
        if (y > limitePagina) { // Se a página estiver cheia, adiciona uma nova
          doc.addPage();
          y = 20;
        }

        const descricao = doc.splitTextToSize(item.descricao, 60);
        doc.text(descricao, 30, y);
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