// mensalidades.js

/**
 * Carrega o resumo geral (cards) e já pega emAtraso e aVencer (sem paginação)
 * do endpoint /api/mensalidades/resumo.
 */
const apiBaseUrl = "https://duvale-production.up.railway.app";

export async function carregarResumo() {
  try {
    const response = await fetch(`${apiBaseUrl}/api/mensalidades/resumo`);
    if (!response.ok) {
      console.warn("Erro ao carregar resumo, usando valores padrão.");
      atualizarCards({ totalImoveis:0, totalContratos:0, totalReceber:0, totalAtraso:0 });
      atualizarTabela("tabela-atraso-corpo", []);
      atualizarTabela("tabela-vencer-corpo", []);
      return;
    }

    const data = await response.json();
    // Ajustar se o back retorna "totalAlugados" mas o front quer "totalContratos"
    const resumoCorrigido = {
      totalImoveis: data.totalImoveis || 0,
      totalContratos: data.totalAlugados || 0,
      totalReceber: data.totalReceber || 0,
      totalAtraso: data.totalAtraso || 0
    };
    
    atualizarCards(resumoCorrigido);
    atualizarTabela("tabela-atraso-corpo", data.emAtraso || []);
    atualizarTabela("tabela-vencer-corpo", data.aVencer || []);

  } catch (error) {
    console.error("Erro ao carregar resumo:", error);
  }
}

/**
 * Atualiza os cards no DOM.
 */
export function atualizarCards({ totalImoveis, totalContratos, totalReceber, totalAtraso }) {
  try {
    const imoveisValor = document.getElementById("card-imoveis-cadastrados-valor");
    const contratosValor = document.getElementById("card-contratos-ativos-valor");
    const atrasadoValor = document.getElementById("card-total-em-atraso-valor");
    const aVencerValor = document.getElementById("card-a-receber");

    if (imoveisValor) imoveisValor.textContent = totalImoveis;
    if (contratosValor) contratosValor.textContent = totalContratos;
    if (aVencerValor) {
      aVencerValor.textContent = `R$ ${parseFloat(totalReceber).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}`;
    }
    if (atrasadoValor) {
      atrasadoValor.textContent = `R$ ${parseFloat(totalAtraso).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}`;
    }
  } catch (err) {
    console.error("Erro ao atualizar cards:", err);
  }
}

/**
 * Atualiza a tabela (genérica) recebendo um ID e um array de dados.
 */
export function atualizarTabela(tabelaId, dados) {
  const tabelaCorpo = document.getElementById(tabelaId);
  if (!tabelaCorpo) return;

  tabelaCorpo.innerHTML = "";

  if (!dados || dados.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" style="text-align: center; font-weight: bold;">Nenhum dado encontrado.</td>`;
    tabelaCorpo.appendChild(tr);
    return;
  }

  dados.forEach(item => {
    const tr = document.createElement("tr");
    const inquilino = item.inquilino || item.cliente_nome || "N/A";
    const imovel = item.imovel || item.imovel_descricao || "N/A";
    const vencimento = item.vencimento
      ? new Date(item.vencimento).toLocaleDateString("pt-BR")
      : "Data Inválida";
    const valor = item.valor
      ? `R$ ${parseFloat(item.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      : "R$ 0,00";
    const dias = item.dias_atraso || "0";

    tr.innerHTML = `
    <td>${clienteNome}</td>
    <td>${imovelDescricao}</td>
    <td>${dataVencimento}</td>
    <td>${valor}</td>
    <td>${dias_atraso}</td>
    <td>
        <a href="#" class="btn-icone-baixar" data-id="${item.id}" title="Baixar Pagamento">
          <i class="fas fa-download"></i>
        </a>
    </td>
  `;
  
  // Adiciona evento ao ícone
  tr.querySelector(".btn-icone-baixar").addEventListener("click", (event) => {
    event.preventDefault(); // Evita comportamento padrão do link
    const mensalidadeId = event.currentTarget.getAttribute("data-id");
    atualizarStatusMensalidade(mensalidadeId, "em dias", parseFloat(item.valor));
  });
    tabelaCorpo.appendChild(tr);
  });
}

/**
 * Carrega mensalidades em atraso de forma paginada.
 * @param {number} page - Página atual da listagem (default: 1).
 * @param {number} limit - Número de itens por página (default: 10).
 */
export async function carregarEmAtraso(page = 1, limit = 10) {
  try {
    // Requisição para a API de mensalidades em atraso, com suporte a paginação.
    const response = await fetch(`${apiBaseUrl}/api/mensalidades/em-atraso?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Erro ao carregar mensalidades em atraso. Status: ${response.status}`);
    }

    // Desestruturação do JSON retornado pela API.
    const { data, total } = await response.json();

    // Seleciona o corpo da tabela onde os dados serão exibidos.
    const tbody = document.getElementById("tabela-atraso-corpo");
    tbody.innerHTML = ""; // Limpa a tabela antes de carregar os novos dados.

    // Exibe mensagem padrão caso não haja dados.
    if (!data || data.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="6" style="text-align:center;">Nenhuma mensalidade em atraso encontrada.</td>`;
      tbody.appendChild(tr);
      return;
    }

    // Renderiza as linhas da tabela para cada item recebido da API.
    data.forEach((item) => {
      const clienteNome = item.cliente_nome || "N/A"; // Nome do cliente ou "N/A".
      const imovelDescricao = item.imovel_descricao || "N/A"; // Descrição do imóvel ou "N/A".
      const dataVencimento = item.data_vencimento
        ? new Date(item.data_vencimento).toLocaleDateString("pt-BR") // Formata a data no padrão brasileiro.
        : "Data Inválida"; // Exibe mensagem de data inválida caso não exista.
      const valor = item.valor
        ? `R$ ${parseFloat(item.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` // Formata o valor no padrão monetário brasileiro.
        : "R$ 0,00"; // Valor padrão caso não exista.
      const dias_atraso = item.dias_atraso !== undefined
        ? `${item.dias_atraso} dias` // Dias de atraso ou "N/A".
        : "N/A";

      // Cria uma linha para cada item.
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${clienteNome}</td>
        <td>${imovelDescricao}</td>
        <td>${dataVencimento}</td>
        <td>${valor}</td>
        <td>${dias_atraso}</td>
        <td class="coluna-acoes">
          <a href="#" class="btn-icone-baixar" data-id="${item.id}" title="Baixar Pagamento">
            <i class="fas fa-download"></i>
          </a>
        </td>
      `;

      // Adiciona evento ao ícone de "Baixar Pagamento".
      tr.querySelector(".btn-icone-baixar").addEventListener("click", (event) => {
        event.preventDefault(); // Evita o comportamento padrão do link.
        const mensalidadeId = event.currentTarget.getAttribute("data-id");
        atualizarStatusMensalidade(mensalidadeId, "em dias", parseFloat(item.valor)); // Chama a função para atualizar o status da mensalidade.
      });

      tbody.appendChild(tr); // Adiciona a linha na tabela.
    });

    // Atualiza a paginação para refletir os novos dados.
    atualizarPaginacao("atraso", page, total, limit);
  } catch (error) {
    console.error("Erro ao carregar mensalidades em atraso:", error);
    alert("Não foi possível carregar mensalidades em atraso."); // Exibe mensagem de erro ao usuário.
  }
}
/**
 * Carrega as mensalidades "a vencer" de forma paginada e atualiza a tabela correspondente.
 * @param {number} page - Número da página atual (default: 1).
 * @param {number} limit - Quantidade de itens por página (default: 10).
 */
export async function carregarAVencer(page = 1, limit = 10) {
  try {
    // Faz a requisição para o endpoint de mensalidades "a vencer".
    const response = await fetch(`${apiBaseUrl}/api/mensalidades/a-vencer?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Erro ao carregar mensalidades a vencer. Status: ${response.status}`);
    }

    // Desestrutura os dados retornados pela API.
    const { data, total } = await response.json();

    // Seleciona o corpo da tabela onde os dados serão exibidos.
    const tbody = document.getElementById("tabela-vencer-corpo");
    tbody.innerHTML = ""; // Limpa a tabela antes de carregar novos dados.

    // Exibe mensagem padrão caso não haja dados.
    if (!data || data.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="6" style="text-align:center;">Nenhuma mensalidade a vencer encontrada.</td>`;
      tbody.appendChild(tr);
      return;
    }

    // Renderiza cada item na tabela.
    data.forEach((item) => {
      const clienteNome = item.cliente_nome || "N/A"; // Nome do cliente ou "N/A".
      const imovelDescricao = item.imovel_descricao || "N/A"; // Descrição do imóvel ou "N/A".
      const dataVencimento = item.data_vencimento
        ? new Date(item.data_vencimento).toLocaleDateString("pt-BR") // Formata a data no padrão brasileiro.
        : "Data Inválida"; // Exibe mensagem de data inválida caso não exista.
      const valor = item.valor
        ? `R$ ${parseFloat(item.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` // Formata o valor no padrão monetário brasileiro.
        : "R$ 0,00"; // Valor padrão caso não exista.
      const dias_atraso = item.dias_atraso || 0; // Dias de atraso ou 0 se não houver atraso.

      // Cria uma linha da tabela com os dados formatados.
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${clienteNome}</td>
        <td>${imovelDescricao}</td>
        <td>${dataVencimento}</td>
        <td>${valor}</td>
        <td>${dias_atraso}</td>
        <td class="coluna-acoes">
          <a href="#" class="btn-icone-baixar" data-id="${item.id}" title="Baixar Pagamento">
            <i class="fas fa-download"></i>
          </a>
        </td>
      `;

      // Adiciona evento ao ícone de "Baixar Pagamento".
      tr.querySelector(".btn-icone-baixar").addEventListener("click", (event) => {
        event.preventDefault(); // Evita o comportamento padrão do link.
        const mensalidadeId = event.currentTarget.getAttribute("data-id");
        atualizarStatusMensalidade(mensalidadeId, "em dias", parseFloat(item.valor)); // Atualiza o status da mensalidade.
      });

      tbody.appendChild(tr); // Adiciona a linha na tabela.
    });

    // Atualiza a paginação com os novos dados.
    atualizarPaginacao("vencer", page, total, limit);
  } catch (error) {
    // Loga o erro no console e exibe uma mensagem de erro ao usuário.
    console.error("Erro ao carregar mensalidades a vencer:", error);
    alert("Não foi possível carregar mensalidades a vencer.");
  }
}

/**
 * Atualiza a navegação de páginas (paginação) da tabela.
 * @param {string} tipo - Tipo de tabela (ex.: "atraso" ou "vencer").
 * @param {number} page - Página atual.
 * @param {number} total - Total de itens disponíveis.
 * @param {number} limit - Número de itens por página.
 */
function atualizarPaginacao(tipo, page, total, limit) {
  const paginacaoContainer = document.getElementById(`paginacao-${tipo}`);
  if (!paginacaoContainer) return;

  paginacaoContainer.innerHTML = ""; // Limpa a navegação existente.
  const totalPages = Math.ceil(total / limit); // Calcula o total de páginas.

  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.classList.add("btn-paginacao");
    button.textContent = i;
    button.disabled = i === page; // Desativa o botão da página atual.

    // Adiciona evento de clique para mudar de página.
    button.addEventListener("click", () => {
      if (tipo === "atraso") carregarEmAtraso(i, limit);
      if (tipo === "vencer") carregarAVencer(i, limit);
    });

    paginacaoContainer.appendChild(button); // Adiciona o botão à navegação.
  }
}

/**
 * Atualiza o status de uma mensalidade para "em dias".
 * @param {number} mensalidadeId - ID da mensalidade
 * @param {string} novoStatus - Novo status da mensalidade
 * @param {number} valor - Valor da mensalidade
 */
async function atualizarStatusMensalidade(mensalidadeId, novoStatus, valor) {
  try {
    // Verifica se os parâmetros obrigatórios foram fornecidos
    if (!mensalidadeId || !novoStatus) {
      throw new Error("ID da mensalidade ou status inválido.");
    }

    // Realiza a requisição para atualizar o status da mensalidade
    const response = await fetch(`${apiBaseUrl}/api/mensalidades/${mensalidadeId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus, valor }), // Incluímos o valor no corpo da requisição
    });

    // Verifica se a requisição foi bem-sucedida
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Erro ao atualizar status da mensalidade.");
    }

    // Mostra uma mensagem de sucesso ao usuário
    alert("Status atualizado com sucesso!");

    // Atualiza as tabelas de mensalidades "Em Atraso" e "A Vencer"
    await carregarEmAtraso(1, 10); // Página 1, limite de 10 itens
    await carregarAVencer(1, 10); // Página 1, limite de 10 itens
  } catch (error) {
    // Loga o erro no console e exibe um alerta ao usuário
    console.error("Erro ao atualizar status da mensalidade:", error.message);
    alert(`Erro ao atualizar status da mensalidade: ${error.message}`);
  }
}

// Disponibiliza a função globalmente para ser utilizada em eventos de clique ou outros módulos
window.atualizarStatusMensalidade = atualizarStatusMensalidade;

/**
 * Se tiver avisos gerenciais no mesmo endpoint, pode colocar aqui também
 */
export async function carregarAvisos(page = 1, limit = 5, usarPaginacao = false) {
  try {
    let url = `"${apiBaseUrl}/api/mensalidades/avisos"`;
    if (usarPaginacao) {
      url += `?page=${page}&limit=${limit}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erro ao carregar avisos.");
    const resposta = await response.json();
    const avisos = resposta.data || [];
    const total = resposta.total || avisos.length;

    atualizarAvisosContainer(avisos);

    if (usarPaginacao) {
      atualizarPaginacaoAvisos(page, total, limit);
    }
  } catch (error) {
    console.error("Erro ao carregar avisos:", error);
  }
}

function atualizarAvisosContainer(avisos) {
  const avisosContainer = document.getElementById("avisos-container");
  if (!avisosContainer) return;
  avisosContainer.innerHTML = "";

  if (!avisos || avisos.length === 0) {
    avisosContainer.innerHTML = "<p>Nenhum aviso disponível.</p>";
    return;
  }

  avisos.forEach((aviso) => {
    const div = document.createElement("div");
    div.classList.add("aviso");
    div.innerHTML = `
      <h3>${aviso.imovel_descricao || "Descrição não disponível"}</h3>
      <p><strong>Endereço:</strong> ${aviso.imovel_endereco || "Endereço não informado"}</p>
      <p><strong>Aviso:</strong> ${aviso.aviso || "Sem detalhes"}</p>
    `;
    avisosContainer.appendChild(div);
  });
}

/**
 * Exemplo de paginação para avisos
 */
function atualizarPaginacaoAvisos(page, total, limit) {
  const paginationContainer = document.getElementById("avisos-pagination");
  if (!paginationContainer) return;

  paginationContainer.innerHTML = "";
  const totalPages = Math.ceil(total / limit);

  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.textContent = i;
    button.disabled = (i === page);
    button.classList.add("btn-paginacao");
    button.addEventListener("click", () => {
      carregarAvisos(i, limit, true);
    });
    paginationContainer.appendChild(button);
  }
}
