// mensalidades.js

const apiBaseUrl = "https://duvale-production.up.railway.app";

/**
 * Carrega o resumo geral e atualiza os cards e tabelas do DOM.
 */
export async function carregarResumo() {
  try {
    const response = await fetch(`${apiBaseUrl}/api/mensalidades/resumo`);
    if (!response.ok) throw new Error("Erro ao carregar resumo.");

    const data = await response.json();
    const resumoCorrigido = {
      totalImoveis: data.totalImoveis || 0,
      totalContratos: data.totalAlugados || 0,
      totalReceber: data.totalReceber || 0,
      totalAtraso: data.totalAtraso || 0,
    };

    atualizarCards(resumoCorrigido);
    atualizarTabela("tabela-atraso-corpo", data.emAtraso || []);
    atualizarTabela("tabela-vencer-corpo", data.aVencer || []);
  } catch (error) {
    console.error("Erro ao carregar resumo:", error);
    atualizarCards({ totalImoveis: 0, totalContratos: 0, totalReceber: 0, totalAtraso: 0 });
    atualizarTabela("tabela-atraso-corpo", []);
    atualizarTabela("tabela-vencer-corpo", []);
  }
}

/**
 * Atualiza os valores exibidos nos cards.
 */
export function atualizarCards({ totalImoveis, totalContratos, totalReceber, totalAtraso }) {
  try {
    document.getElementById("card-imoveis-cadastrados-valor").textContent = totalImoveis;
    document.getElementById("card-contratos-ativos-valor").textContent = totalContratos;
    document.getElementById("card-a-receber").textContent = `R$ ${totalReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    document.getElementById("card-total-em-atraso-valor").textContent = `R$ ${totalAtraso.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  } catch (error) {
    console.error("Erro ao atualizar os cards:", error);
  }
}

/**
 * Atualiza a tabela do DOM com base nos dados fornecidos.
 */
export function atualizarTabela(tabelaId, dados) {
  const tabelaCorpo = document.getElementById(tabelaId);
  if (!tabelaCorpo) return;

  tabelaCorpo.innerHTML = "";

  if (!dados || dados.length === 0) {
    tabelaCorpo.innerHTML = `<tr><td colspan="6" style="text-align: center;"> Nenhum dado encontrado.</td></tr>`;
    return;
  }

  dados.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.cliente_nome || "N/A"}</td>
      <td>${item.imovel_descricao || "N/A"}</td>
      <td>${new Date(item.data_vencimento).toLocaleDateString("pt-BR") || "Data Inválida"}</td>
      <td>R$ ${parseFloat(item.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
      <td>${item.dias_atraso || "0"}</td>
      <td><a href="#" class="btn-icone-baixar" data-id="${item.id}" title="Baixar Pagamento"><i class="fas fa-download"></i></a></td>
    `;
    tabelaCorpo.appendChild(tr);

    // Evento para o botão de baixar pagamento
    tr.querySelector(".btn-icone-baixar").addEventListener("click", (event) => {
      event.preventDefault();
      atualizarStatusMensalidade(item.id, "em dias", item.valor);
    });
  });
}

/**
 * Carrega mensalidades atrasadas e atualiza a tabela correspondente.
 */
export async function carregarEmAtraso(page = 1, limit = 10) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/mensalidades/em-atraso?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error(`Erro ao carregar mensalidades em atraso: ${response.status}`);

    const { data, total } = await response.json();
    atualizarTabela("tabela-atraso-corpo", data);
    atualizarPaginacao("atraso", page, total, limit);
  } catch (error) {
    console.error("Erro ao carregar mensalidades em atraso:", error);
    alert("Não foi possível carregar mensalidades em atraso.");
  }
}

/**
 * Carrega mensalidades a vencer e atualiza a tabela correspondente.
 */
export async function carregarAVencer(page = 1, limit = 10) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/mensalidades/a-vencer?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error(`Erro ao carregar mensalidades a vencer: ${response.status}`);

    const { data, total } = await response.json();
    atualizarTabela("tabela-vencer-corpo", data);
    atualizarPaginacao("vencer", page, total, limit);
  } catch (error) {
    console.error("Erro ao carregar mensalidades a vencer:", error);
    alert("Não foi possível carregar mensalidades a vencer.");
  }
}

/**
 * Atualiza o status de uma mensalidade.
 */
async function atualizarStatusMensalidade(id, novoStatus, valor) {
  try {
    const response = await fetch(`${apiBaseUrl}/${id}/api/mensalidades/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus, valor }),
    });

    if (!response.ok) throw new Error("Erro ao atualizar status da mensalidade.");
    alert("Status atualizado com sucesso!");
    carregarEmAtraso(); // Recarrega as tabelas
    carregarAVencer();
  } catch (error) {
    console.error("Erro ao atualizar status da mensalidade:", error);
    alert("Erro ao atualizar status da mensalidade.");
  }
}
/**
 * Carrega os avisos e retorna os dados.
 */
export async function carregarAvisos() {
  try {
    const response = await fetch(`${apiBaseUrl}/api/mensalidades/avisos`);
    if (!response.ok) throw new Error(`Erro ao carregar avisos: ${response.statusText}`);

    const { data } = await response.json();

    // Valida se 'data' é um array
    if (!data || !Array.isArray(data)) {
      throw new Error("Formato de resposta inválido: dados não são um array.");
    }

    return data; // Retorna os avisos corretamente
  } catch (error) {
    console.error("Erro ao carregar avisos:", error);
    return []; // Retorna um array vazio em caso de erro
  }
}

/**
 * Atualiza o container de avisos no DOM.
 */
function atualizarAvisosContainer(avisos) {
  const avisosContainer = document.getElementById("avisos-container");
  if (!avisosContainer) return;

  avisosContainer.innerHTML = avisos.length
    ? avisos
        .map(
          (aviso) => `
        <div class="aviso">
          <h3>${aviso.imovel_descricao || "Descrição não disponível"}</h3>
          <p><strong>Endereço:</strong> ${aviso.imovel_endereco || "Não informado"}</p>
          <p>${aviso.aviso || "Sem detalhes."}</p>
        </div>`
        )
        .join("")
    : "<p>Nenhum aviso disponível.</p>";
}

/**
 * Atualiza a paginação de uma tabela.
 * @param {string} tipo - Identifica o tipo de tabela (e.g., "atraso" ou "vencer").
 * @param {number} page - Página atual.
 * @param {number} total - Número total de itens disponíveis.
 * @param {number} limit - Número de itens por página.
 */
function atualizarPaginacao(tipo, page, total, limit) {
  const paginacaoContainer = document.getElementById(`paginacao-${tipo}`);
  if (!paginacaoContainer) return; // Verifica se o container existe

  const totalPages = Math.ceil(total / limit); // Calcula o número total de páginas
  paginacaoContainer.innerHTML = Array.from({ length: totalPages }, (_, i) => {
    const num = i + 1; // Número da página (começa em 1)
    // Cria botões de paginação, desabilitando o botão da página atual
    return `<button class="btn-paginacao" ${num === page ? "disabled" : ""}>${num}</button>`;
  }).join(""); // Junta os botões em uma única string de HTML

  // Adiciona eventos de clique para os botões
  paginacaoContainer.querySelectorAll("button").forEach((btn, i) => {
    btn.addEventListener("click", () => {
      if (tipo === "atraso") carregarEmAtraso(i + 1, limit); // Chama a função para carregar dados em atraso
      if (tipo === "vencer") carregarAVencer(i + 1, limit); // Chama a função para carregar dados a vencer
    });
  });
}

/**
 * Carrega a biblioteca do Google Charts
 */
google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(carregarGraficos); // Chama a função ao carregar a biblioteca

/**
 * Obtém o nome dos meses correspondentes para o título dos gráficos.
 * @param {number} offset - Offset relativo ao mês atual (e.g., -1 para mês anterior, 0 para mês atual, +1 para próximo mês).
 * @returns {string} - Nome do mês correspondente.
 */
function obterNomeDoMes(offset = 0) {
  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const dataAtual = new Date();
  const mesAtual = dataAtual.getMonth();
  const mesCalculado = (mesAtual + offset + 12) % 12; // Calcula o mês considerando os offsets
  return meses[mesCalculado];
}

/**
 * Cria um gráfico de pizza usando Google Charts, formatando valores em R$.
 * @param {Object} dados - ex: { em_dia: 5, atrasadas: 3, pendentes: 2 }
 * @param {string} id - ID do elemento HTML onde o gráfico será renderizado
 */
function criarGraficoPizza(dados, id) {
  const graficoContainer = document.getElementById(id);
  if (!graficoContainer) {
    console.error(`Elemento com ID ${id} não encontrado.`);
    return;
  }

  // 1) Converte os dados para o formato do Google Charts
  const chartData = [["Status", "Valor"]];
  Object.keys(dados).forEach((status) => {
    // Se quiser ter certeza de que é numérico, use parseFloat:
    const valor = parseFloat(dados[status]) || 0;
    chartData.push([status, valor]);
  });

  const data = google.visualization.arrayToDataTable(chartData);

  // 2) Formatação de número em R$ (moeda brasileira)
  const formatter = new google.visualization.NumberFormat({
    prefix: "R$ ",
    decimalSymbol: ",",
    groupingSymbol: ".",
    fractionDigits: 2,
  });
  // A coluna 1 (índice 1) é a de valores
  formatter.format(data, 1);

  // 3) Monta as opções do gráfico, destacando o mês no título
  const options = {
    // Deixe o mês em maiúsculo para destacar, ou pode estilizar como preferir
    title: `Mês de ${graficoContainer.dataset.mes.toUpperCase()}`,
    pieHole: 0.4, // gráfico de rosca
    colors: ["#2F80ED", "#56CCF2", "#BB6BD9"], // paleta suave de exemplo
    pieSliceText: "value",
    pieSliceTextStyle: {
      fontSize: 14,
      bold: true,
      color: "#333",
    },
    tooltip: {
      text: "value", // Mostra o valor em R$
    },
    legend: {
      position: "none", // Remove a legenda padrão
    },
    chartArea: {
      width: "90%",
      height: "80%",
    },
    // Se quiser deixar o título em negrito, adicione titleTextStyle:
    titleTextStyle: {
      fontSize: 16,
      bold: true,
      color: "#333"
    },
  };

  // 4) Desenha o gráfico
  const chart = new google.visualization.PieChart(graficoContainer);
  chart.draw(data, options);

  // 5) Criar a legenda personalizada (caso queira manter)
  const legendaContainer = document.createElement("div");
  legendaContainer.classList.add("legenda-container");

  Object.keys(dados).forEach((status, index) => {
    const legendaItem = document.createElement("div");
    legendaItem.classList.add("legenda-item");

    const cor = document.createElement("span");
    cor.classList.add("legenda-cor");
    cor.style.backgroundColor = options.colors[index];

    const texto = document.createElement("span");
    texto.textContent = status.replace("_", " ");

    legendaItem.appendChild(cor);
    legendaItem.appendChild(texto);
    legendaContainer.appendChild(legendaItem);
  });

  // 6) Anexa a legenda abaixo do gráfico
  graficoContainer.parentNode.appendChild(legendaContainer);
}
/**
 * Carrega os dados dos gráficos de mensalidades e renderiza-os no DOM.
 */
async function carregarGraficos() {
  try {
    const response = await fetch(`${apiBaseUrl}/api/mensalidades/graficos`);
    if (!response.ok) throw new Error("Erro ao carregar os dados dos gráficos");

    const data = await response.json();
    console.log("Dados carregados:", data);

    // Define os nomes dos meses dinamicamente nos containers
    document.getElementById("grafico-anterior").dataset.mes = obterNomeDoMes(-1);
    document.getElementById("grafico-atual").dataset.mes = obterNomeDoMes(0);
    document.getElementById("grafico-proximo").dataset.mes = obterNomeDoMes(1);

    criarGraficoPizza(data.anterior, "grafico-anterior");
    criarGraficoPizza(data.atual, "grafico-atual");
    criarGraficoPizza(data.proximo, "grafico-proximo");
  } catch (error) {
    console.error("Erro ao carregar os gráficos:", error);

    // Exibe mensagens de erro nos gráficos
    ["grafico-anterior", "grafico-atual", "grafico-proximo"].forEach((id) => {
      const grafico = document.getElementById(id);
      if (grafico) {
        grafico.innerHTML = `<p style="color: red; text-align: center;">Erro ao carregar o gráfico.</p>`;
      }
    });
  }
}

// Inicia o carregamento dos gráficos ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM totalmente carregado. Iniciando o carregamento dos gráficos...");
  carregarGraficos();
});