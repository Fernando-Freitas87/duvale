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
document.addEventListener("DOMContentLoaded", async () => {
  await carregarResumo();
  await carregarEmAtraso();
  await carregarAVencer();
});

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
    const response = await fetch(`${apiBaseUrl}/api/mensalidades/${id}/status`, {
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


