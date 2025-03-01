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

      // CABEÇALHO - Adicionando Logo corretamente
      fetch("../img/duvalep.png")
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
      doc.text(dadosRelatorio.titulo, 130, 20, { align: "center" });

      // Data de geração do relatório
      const dataAtual = new Date().toLocaleDateString();
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text(`Data de emissão: ${dataAtual}`, 260, 20, { align: "right" });

      // Descrição
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(dadosRelatorio.descricao, 15, 35);

      let y = 50;
      const limitePagina = doc.internal.pageSize.getHeight() - 20;

      // Definição da largura das colunas
      const colWidths = {
        descricao: 60,
        endereco: 80,
        matricula: 50,
        tipo: 40,
        status: 40,
      };

      // Cabeçalhos da tabela
      doc.setFontSize(10).setFont("helvetica", "bold");
      doc.setFillColor(200, 200, 200); // Fundo cinza claro
      doc.rect(15, y - 5, 260, 8, "F"); // Desenha um retângulo de fundo
      doc.text("Descrição", 20, y);
      doc.text("Endereço", 90, y);
      doc.text("Matrícula Nº", 180, y);
      doc.text("Tipo", 220, y);
      doc.text("Status", 250, y);
      y += 10;

      // Conteúdo da tabela
      doc.setFontSize(10).setFont("helvetica", "normal");
      dadosRelatorio.dados.forEach((item) => {
        if (y > limitePagina) { // Se a página estiver cheia, adiciona uma nova
          doc.addPage();
          y = 20;
        }

        // Ajustando espaçamento das colunas
        const descricao = doc.splitTextToSize(item.descricao, colWidths.descricao);
        const endereco = doc.splitTextToSize(item.endereco, colWidths.endereco);

        doc.text(descricao, 20, y);
        doc.text(endereco, 90, y);
        doc.text(String(item.cagece), 180, y);
        doc.text(item.tipo, 220, y);
        doc.text(item.status, 250, y);
        y += 8; // Maior espaçamento entre as linhas
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