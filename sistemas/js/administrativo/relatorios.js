// Importa a função jsPDF do objeto global da biblioteca 'jspdf'
// Obs.: essa biblioteca deve ter sido incluída via script no HTML 
// (por exemplo, <script src="jspdf.umd.min.js"></script>) para que 'window.jspdf' esteja disponível.
const { jsPDF } = window.jspdf;

/**
 * Gera um PDF simples usando jsPDF e inicia o download.
 *
 * @param {string} titulo - Título do relatório.
 * @param {string} descricao - Descrição do relatório.
 */
const gerarPDF = (titulo, descricao) => {
  // 1) Cria uma instância de documento PDF.
  const doc = new jsPDF();

  // 2) Define a fonte do título. O valor 16 indica o tamanho da fonte.
  doc.setFontSize(16);
  // Posiciona o texto (título) nas coordenadas X=10, Y=20 (unidades default do jsPDF).
  doc.text(titulo, 10, 20);

  // 3) Define a fonte para a descrição com tamanho menor (12).
  doc.setFontSize(12);
  // Posiciona o texto (descrição) mais abaixo, nas coordenadas X=10, Y=30.
  doc.text(descricao, 10, 30);

  // 4) Gera o download do arquivo PDF, nomeando de acordo com o título.
  // Exemplo: se titulo for "Relatório de Imóveis", o arquivo será "Relatório de Imóveis.pdf".
  doc.save(`${titulo}.pdf`);
};

// Quando o DOM estiver totalmente carregado, executa a lógica de seleção de botões e escuta de eventos.
document.addEventListener("DOMContentLoaded", () => {
  // 1) Seleciona todos os elementos que tenham a classe "btn-primary"
  // (no seu caso, são os botões de "Gerar Relatório" em cada card).
  const botoesRelatorio = document.querySelectorAll(".btn-primary");

  // 2) Para cada botão, atribui um evento de clique.
  botoesRelatorio.forEach(botao => {
    botao.addEventListener("click", event => {
      // a) Impede o comportamento padrão de redirecionamento (se for <a> com href, por exemplo).
      event.preventDefault();

      // b) Identifica o card ao qual o botão pertence.
      //    'closest' percorre os nós pai até achar um elemento com a classe .card.
      const card = botao.closest('.card-relatorio');
      if (!card) {
        console.error('Card não encontrado para o botão:', botao);
        return;
      }

      // c) Extrai o título (tag <h3>) e descrição (tag <p>) desse card.
      //    O operador ?. evita erro se 'querySelector' retornar null 
      //    e o 'trim()' remove espaços adicionais.
      const titulo = card.querySelector('h3')?.innerText.trim() || 'Relatório';
      const descricao = card.querySelector('p')?.innerText.trim() || 'Descrição não disponível';

      // d) Chama a função para gerar o PDF, passando o título e descrição detectados.
      gerarPDF(titulo, descricao);
    });
  });
});