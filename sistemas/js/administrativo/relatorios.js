// Define a URL base da API (muda automaticamente entre local e produção)
const apiBaseUrl = window.location.hostname.includes("localhost")
  ? "http://localhost:3000"
  : "https://duvale-production.up.railway.app";

/**
 * Testa se a API do relatório está respondendo corretamente antes de abrir o PDF.
 *
 * @param {string} tipoRelatorio - Tipo do relatório (ex: "imoveis", "clientes", "contratos").
 */
const abrirRelatorio = async (tipoRelatorio) => {
  // Monta a URL do relatório no backend
  const urlRelatorio = `${apiBaseUrl}/api/relatorios/${tipoRelatorio}`;

  console.log(`🔍 Testando API: ${urlRelatorio}`);

  try {
    // Testa se a API retorna um status válido antes de abrir o PDF
    const response = await fetch(urlRelatorio, { method: "HEAD" });

    if (!response.ok) {
      console.error(`❌ Erro ao acessar ${urlRelatorio}:`, response.status);
      alert(`Erro ao gerar o relatório (${response.status}). Tente novamente.`);
      return;
    }

    console.log("✅ API respondeu corretamente. Abrindo relatório...");
    window.open(urlRelatorio, "_blank");

  } catch (error) {
    console.error("❌ Erro ao se conectar com a API:", error);
    alert("Erro ao conectar-se ao servidor. Verifique sua conexão e tente novamente.");
  }
};

/**
 * Função que adiciona eventos aos botões de geração de relatório.
 */
const configurarBotoesRelatorio = () => {
  // Seleciona todos os botões que possuem a classe "btn-primary"
  const botoesRelatorio = document.querySelectorAll(".btn-primary");

  botoesRelatorio.forEach((botao) => {
    botao.addEventListener("click", (event) => {
      event.preventDefault(); // Impede o comportamento padrão

      // Busca o tipo de relatório definido no botão via atributo "data-relatorio"
      const tipoRelatorio = botao.getAttribute("data-relatorio") || "imoveis";

      // Abre o relatório correspondente (agora testando a API primeiro)
      abrirRelatorio(tipoRelatorio);
    });
  });
};

// Executa a configuração assim que o DOM estiver carregado
document.addEventListener("DOMContentLoaded", configurarBotoesRelatorio);