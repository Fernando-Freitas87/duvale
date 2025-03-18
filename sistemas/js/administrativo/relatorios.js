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

  const carregarImagemBase64 = (url) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function () {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });

  const gerarPDF = async (tipoRelatorio) => {
    try {
      document.body.style.cursor = "wait"; // Exibe indicador de carregamento

      const loader = document.createElement('div');
      loader.innerHTML = "Gerando PDF...";
      loader.style.position = "fixed";
      loader.style.top = "50%";
      loader.style.left = "50%";
      loader.style.transform = "translate(-50%, -50%)";
      loader.style.backgroundColor = "#fff";
      loader.style.padding = "10px 20px";
      loader.style.borderRadius = "5px";
      loader.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
      loader.style.zIndex = "1000";
      document.body.appendChild(loader);

      console.log(`🔗 Buscando relatório: ${tipoRelatorio}`);
      const response = await fetch(`${apiBaseUrl}/api/relatorios/${tipoRelatorio}`);

      document.body.style.cursor = "default"; // Retorna cursor normal
      document.body.removeChild(loader);

      if (!response.ok) {
        console.error(`❌ Erro na API (${response.status}):`, await response.text());
        throw new Error(`Erro ao buscar relatório (${response.status})`);
      }

      const dadosRelatorio = await response.json();
      console.log("📄 Dados do relatório recebidos:", dadosRelatorio);

      // Criar documento PDF no modo paisagem e tamanho A4
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      // CABEÇALHO - Adicionando Logo diretamente do link externo
      const logoUrl = "https://setta.dev.br/sistemas/img/logop.png";

      // Carregar e inserir imagem no PDF
      try {
        const imgData = await carregarImagemBase64(logoUrl);
        doc.addImage(imgData, "PNG", 15, 10, 30, 10);
      } catch (error) {
        console.warn("⚠️ Erro ao carregar a logo:", error);
      }

      // Título do relatório
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(dadosRelatorio.titulo, 140, 20, { align: "center" });

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

      // Definição das larguras das colunas
      const colWidths = {
        descricao: 30,
        endereco: 110,
        matricula: 25,
        tipo: 30,
        status: 30,
      };

      // **📌 Cabeçalho da Tabela**
      doc.setFontSize(10).setFont("helvetica", "bold");
      doc.setFillColor(180, 180, 180); // Fundo cinza médio
      doc.rect(15, y - 5, 260, 8, "F"); // Adiciona fundo ao cabeçalho
      doc.setTextColor(0, 0, 0); // Cor do texto preto
      doc.text("Descrição", 80, y);
      doc.text("Endereço", 180, y);
      doc.text("Matrícula Nº", 40, y);
      doc.text("Tipo", 40, y);
      doc.text("Status", 40, y);
      y += 10;

      // **📌 Conteúdo da Tabela**
      doc.setFontSize(10).setFont("helvetica", "normal");
      doc.setDrawColor(150, 150, 150); // Cor das bordas das células

      dadosRelatorio.dados.forEach((item, index) => {
        if (y > limitePagina) { // Se a página estiver cheia, adiciona uma nova
          doc.addPage();
          y = 20;
        }

        // Alterna fundo das linhas para melhorar leitura
        if (index % 2 === 0) {
          doc.setFillColor(230, 230, 230); // Cinza claro
          doc.rect(15, y - 5, 260, 8, "F");
        }

        // Ajustando espaçamento das colunas
        const descricao = doc.splitTextToSize(item.descricao, colWidths.descricao);
        const endereco = doc.splitTextToSize(item.endereco, colWidths.endereco);

        doc.text(descricao, 80, y);
        doc.text(endereco, 180, y);
        doc.text(String(item.cagece), 40, y, { align: "center" });
        doc.text(item.tipo, 40, y, { align: "center" });
        doc.text(item.status, 40, y, { align: "center" });

        y += 10; // Espaçamento maior entre as linhas
      });

      // **📌 Rodapé**
      const totalPaginas = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Página ${i} de ${totalPaginas}`, 250, doc.internal.pageSize.getHeight() - 10);
      }

      // **📌 Abre o PDF no navegador**
      window.open(doc.output("bloburl"), "_blank");

    } catch (error) {
      console.error("❌ Erro ao gerar PDF:", error);
      alert("Erro ao gerar relatório. Tente novamente.");
    }
  };

  // **📌 Eventos dos Botões**
  document.querySelectorAll(".btn-primary-relatorio").forEach(botao => {
    botao.addEventListener("click", (event) => {
      event.preventDefault();
      const tipoRelatorio = botao.getAttribute("data-relatorio") || "imoveis";
      gerarPDF(tipoRelatorio);
    });
  });
});