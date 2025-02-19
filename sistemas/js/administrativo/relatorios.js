// Importa a função jsPDF do objeto global da biblioteca
const { jsPDF } = window.jspdf;

/**
 * Gera um PDF simples usando jsPDF e inicia o download.
 *
 * @param {string} titulo - Título do relatório.
 * @param {string} descricao - Descrição do relatório.
 */
const gerarPDF = (titulo, descricao) => {
  // Instancia um novo documento PDF
  const doc = new jsPDF();

  // Define o título no PDF com fonte maior
  doc.setFontSize(16);
  doc.text(titulo, 10, 20);

  // Define a descrição no PDF com fonte menor
  doc.setFontSize(12);
  doc.text(descricao, 10, 30);

  // Salva o PDF com o nome baseado no título
  doc.save(`${titulo}.pdf`);
};

// Aguarda o carregamento completo do DOM
document.addEventListener("DOMContentLoaded", () => {
  // Seleciona todos os botões que devem acionar a geração do relatório
  const botoesRelatorio = document.querySelectorAll(".btn-primary");

  // Adiciona o listener de clique para cada botão
  botoesRelatorio.forEach(botao => {
    botao.addEventListener("click", event => {
      // Previne o comportamento padrão (por exemplo, redirecionamento de link)
      event.preventDefault();

      // Localiza o card mais próximo do botão clicado
      const card = botao.closest('.card');
      if (!card) {
        console.error('Card não encontrado para o botão:', botao);
        return;
      }

      // Captura o título e a descrição do card
      // Usa o operador de encadeamento opcional e trim para garantir que os valores sejam strings limpas
      const titulo = card.querySelector('h3')?.innerText.trim() || 'Relatório';
      const descricao = card.querySelector('p')?.innerText.trim() || 'Descrição não disponível';

      // Chama a função que gera e faz o download do PDF
      gerarPDF(titulo, descricao);
    });
  });
});