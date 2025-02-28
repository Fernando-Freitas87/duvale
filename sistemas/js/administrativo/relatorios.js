// Define a URL base da API (muda automaticamente entre local e produção)
const apiBaseUrl = window.location.hostname.includes("localhost")
  ? "http://localhost:3000"
  : "https://duvale-production.up.railway.app";

/**
 * Abre o relatório em PDF no navegador, consumindo a API do backend.
 *
 * @param {string} tipoRelatorio - Tipo do relatório (ex: "imoveis", "clientes", "contratos").
 */
const abrirRelatorio = (tipoRelatorio) => {
  // Monta a URL do relatório no backend
  const urlRelatorio = `${apiBaseUrl}/api/relatorios/${tipoRelatorio}`;

  // Abre o relatório em uma nova aba do navegador
  window.open(urlRelatorio, "_blank");
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

      // Abre o relatório correspondente
      abrirRelatorio(tipoRelatorio);
    });
  });
};

// Executa a configuração assim que o DOM estiver carregado
document.addEventListener("DOMContentLoaded", configurarBotoesRelatorio);