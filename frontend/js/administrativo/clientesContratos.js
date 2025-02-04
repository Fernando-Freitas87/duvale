// clientesContratos.js

// 1) CLIENTES
const apiBaseUrl = "https://duvale-production.up.railway.app";

/**
 * Carrega os clientes do banco de dados e exibe na tabela do painel gerencial.
 */
export async function carregarClientes() {
  try {
    // Faz a requisição para obter os clientes
    const response = await fetch(`${apiBaseUrl}/api/clientes`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    // Verifica se a requisição foi bem-sucedida
    if (!response.ok) {
      throw new Error(`Erro ao buscar clientes. Status: ${response.status}`);
    }

    // Obtém a lista de clientes do JSON retornado
    const lista = await response.json();

    // Seleciona o corpo da tabela no DOM
    const tbody = document.getElementById("clientes-corpo");
    if (!tbody) return;

    // Limpa a tabela antes de adicionar novos dados
    tbody.innerHTML = "";

    // Filtra apenas os clientes que não são administradores
    const clientesVisiveis = lista.filter(cli => cli.tipo_usuario !== "administrador");

    // Caso não haja clientes visíveis, exibe uma mensagem padrão
    if (clientesVisiveis.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="6" style="text-align:center;font-weight:bold;">Nenhum cliente encontrado.</td>`;
      tbody.appendChild(tr);
      return;
    }

    // Adiciona cada cliente na tabela
    clientesVisiveis.forEach(cliente => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td>${cliente.nome || "Sem nome"}</td>
      <td>${cliente.cpf || "Sem CPF"}</td>
      <td>${cliente.telefone || "Sem telefone"}</td>
      <td>${cliente.pin || "Sem PIN"}</td>
      <td>${cliente.observacoes || "Sem observações"}</td>
      <td class="coluna-acoes">
        <a href="#" class="btn-icone-editar" data-id="${cliente.id}" title="Editar Cliente">
          <i class="fas fa-edit"></i>
        </a>
        <a href="#" class="btn-icone-excluir" data-id="${cliente.id}" title="Excluir Cliente">
          <i class="fas fa-trash-alt"></i>
        </a>
      </td>
      `;

      // Evento para abrir o modal de edição do cliente
      tr.querySelector(".btn-icone-editar").addEventListener("click", (event) => {
        const clienteId = event.currentTarget.getAttribute("data-id");
        editarClienteModal(clienteId); // Função para editar o cliente
      });

      // Evento para excluir o cliente
      tr.querySelector(".btn-icone-excluir").addEventListener("click", (event) => {
        const clienteId = event.currentTarget.getAttribute("data-id");
        if (confirm(`Deseja realmente excluir o cliente ID: ${clienteId}?`)) {
          excluirCliente(clienteId); // Função para excluir o cliente
        }
      });

      tbody.appendChild(tr);
    });
  } catch (error) {
    // Loga o erro no console e exibe uma mensagem ao usuário
    console.error("Erro ao carregar clientes:", error);
    alert("Não foi possível carregar clientes.");
  }
}

/**
 * Exclui um cliente pelo ID.
 * @param {number} clienteId - ID do cliente a ser excluído.
 */
async function excluirCliente(clienteId) {
  try {
    // Valida se o ID foi fornecido
    if (!clienteId) {
      throw new Error("ID do cliente não fornecido.");
    }

    // Faz a requisição para excluir o cliente
    const response = await fetch(`${apiBaseUrl}/api/clientes/${clienteId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    // Verifica se a exclusão foi bem-sucedida
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao excluir cliente. Status: ${response.status}, Detalhes: ${errorText}`);
    }

    alert("Cliente excluído com sucesso!");
    carregarClientes(); // Recarrega a tabela de clientes
  } catch (error) {
    // Loga o erro no console e exibe uma mensagem ao usuário
    console.error("Erro ao excluir cliente:", error);
    alert("Não foi possível excluir o cliente.");
  }
}

/**
 * Abre o modal de edição e preenche os campos com os dados do cliente.
 * @param {number} clienteId - ID do cliente a ser editado.
 */
async function editarClienteModal(clienteId) {
  // Obtém o modal de edição pelo ID
  const modal = document.getElementById("modal-editar-cliente");
  if (!modal) {
    console.error("Modal de edição de cliente não encontrado.");
    return;
  }

  // Exibe o modal
  modal.style.display = "block";

  try {
    // Valida o clienteId
    if (!clienteId) {
      console.error("ID do cliente não fornecido.");
      alert("Erro ao abrir modal: ID do cliente não fornecido.");
      return;
    }

    // Faz a requisição para buscar os dados do cliente
    const response = await fetch(`${apiBaseUrl}/api/clientes/${clienteId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
    });

    // Verifica se a requisição foi bem-sucedida
    if (!response.ok) {
      const errorText = await response.text(); // Obtém detalhes do erro do backend
      console.error(`Erro ao buscar detalhes do cliente. Status: ${response.status}, Detalhes: ${errorText}`);
      throw new Error("Erro ao buscar detalhes do cliente."); 
    }

    // Converte a resposta em JSON
    const cliente = await response.json();

    // Preenche os campos do modal com os dados do cliente
    document.getElementById("edit-cliente-nome").value = cliente.nome || "";
    document.getElementById("edit-cliente-cpf").value = cliente.cpf || "";
    document.getElementById("edit-cliente-telefone").value = cliente.telefone || "";
    document.getElementById("edit-cliente-pin").value = cliente.pin || "";
    document.getElementById("edit-cliente-observacoes").value = cliente.observacoes || "";
    document.getElementById("edit-cliente-nacionalidade").value = cliente.nacionalidade || "";
    document.getElementById("edit-cliente-data-nascimento").value = cliente.data_nascimento || "";
    document.getElementById("edit-cliente-documento-identidade").value = cliente.documento_identidade || "";
    document.getElementById("edit-cliente-numero-documento").value = cliente.numero_documento_identidade || "";

    // Define o evento do botão "Salvar" para salvar as alterações
    document.getElementById("btn-salvar-cliente").onclick = () => salvarEdicaoCliente(clienteId);

    // Define o evento do botão "Cancelar" para fechar o modal sem salvar
    document.getElementById("btn-cancelar-edicao-cliente").onclick = () => {
      modal.style.display = "none";
    };
  } catch (error) {
    // Trata erros na requisição ou na lógica
    console.error("Erro ao carregar cliente:", error);
    alert("Erro ao carregar dados do cliente.");
  }
}

/**
 * Salva a edição do cliente enviando os dados para a API.
 */
async function salvarEdicaoCliente(clienteId) {
  try {
    if (!clienteId) throw new Error("ID do cliente não fornecido.");

    // Coleta os valores dos campos do modal
    const nome = document.getElementById("edit-cliente-nome").value;
    const cpf = document.getElementById("edit-cliente-cpf").value;
    const telefone = document.getElementById("edit-cliente-telefone").value;
    const pin = document.getElementById("edit-cliente-pin").value;
    const observacoes = document.getElementById("edit-cliente-observacoes").value;
    const nacionalidade = document.getElementById("edit-cliente-nacionalidade").value;
    const dataNascimento = document.getElementById("edit-cliente-data-nascimento").value;
    const documentoIdentidade = document.getElementById("edit-cliente-documento-identidade").value;
    const numeroDocumento = document.getElementById("edit-cliente-numero-documento").value;

    // Envia os dados para o backend
    const response = await fetch(`${apiBaseUrl}/api/clientes/${clienteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        cpf,
        telefone,
        pin,
        observacoes,
        nacionalidade,
        data_nascimento: dataNascimento,
        documento_identidade: documentoIdentidade,
        numero_documento_identidade: numeroDocumento,
      }),
    });

    if (!response.ok) throw new Error(`Erro ao editar cliente. Status: ${response.status}`);

    alert("Cliente atualizado com sucesso!");
    document.getElementById("modal-editar-cliente").style.display = "none";
    carregarClientes(); // Atualiza a lista de clientes
  } catch (error) {
    console.error("Erro ao salvar edição do cliente:", error);
    alert("Não foi possível editar o cliente.");
  }
}

/**
 * Carrega a lista de contratos e preenche a tabela no frontend.
 */
export async function carregarContratos() {
  try {
    // Faz a requisição para obter os contratos
    const response = await fetch(`${apiBaseUrl}/api/contratos`);
    if (!response.ok) throw new Error(`Erro ao buscar contratos. Status: ${response.status}`);

    // Processa a resposta e seleciona o corpo da tabela
    const lista = await response.json();
    const tbody = document.getElementById("contratos-corpo");
    if (!tbody) return;

    // Limpa a tabela antes de preenchê-la
    tbody.innerHTML = "";

    // Itera sobre cada contrato e cria as linhas na tabela
    lista.forEach((contrato) => {
      const tr = document.createElement("tr");

      // Formata os dados para exibição
      const dataInicioFormatada = contrato.data_inicio
        ? new Date(contrato.data_inicio).toLocaleDateString("pt-BR")
        : "Sem início";
      const dataFimFormatada = contrato.data_fim
        ? new Date(contrato.data_fim).toLocaleDateString("pt-BR")
        : "Sem fim";
      const valorFormatado = contrato.valor_aluguel
        ? "R$ " + parseFloat(contrato.valor_aluguel).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
        : "Sem valor";

      // Adiciona o conteúdo da linha na tabela
      tr.innerHTML = `
      <td>${contrato.cliente || "Sem cliente"}</td>
      <td>${contrato.imovel || "Sem imóvel"}</td>
      <td>${contrato.total_meses || "Sem meses"}</td>
      <td>${valorFormatado}</td>
      <td>${contrato.dia_vencimento || "Sem vencimento"}</td>
      <td>${dataInicioFormatada}</td>
      <td>${dataFimFormatada}</td>
      <td class="coluna-acoes">
        <a href="#" class="btn-icone-baixar" data-id="${contrato.id}" title="Baixar Contrato">
          <i class="fas fa-file-download"></i>
        </a>
        <a href="#" class="btn-icone-editar" data-id="${contrato.id}" title="Editar Contrato">
          <i class="fas fa-edit"></i>
        </a>
        <a href="#" class="btn-icone-excluir" data-id="${contrato.id}" title="Excluir Contrato">
          <i class="fas fa-trash-alt"></i>
        </a>
      </td>
    `;
    
    // Evento para o ícone de baixar contrato
    tr.querySelector(".btn-icone-baixar").addEventListener("click", (event) => {
      const contratoId = event.currentTarget.getAttribute("data-id");
      baixarContrato(contratoId);
    });
    
    // Evento para o ícone de editar contrato
    tr.querySelector(".btn-icone-editar").addEventListener("click", (event) => {
      event.preventDefault(); // Previne o comportamento padrão do link
      const clienteId = event.currentTarget.getAttribute("data-id");
      editarClienteModal(clienteId); // Chama a função para abrir o modal
    });
    
    // Evento para o ícone de excluir contrato
    tr.querySelector(".btn-icone-excluir").addEventListener("click", (event) => {
      const contratoId = event.currentTarget.getAttribute("data-id");
      if (!confirm(`Deseja realmente excluir o contrato ID: ${contratoId}?`)) return;
      inativarContrato(contratoId);
    });
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar contratos:", error);
    alert("Não foi possível carregar a lista de contratos.");
  }
}

async function editarContrato(contratoId) {
  try {
    if (!contratoId) {
      throw new Error("ID do contrato não fornecido.");
    }

    const modal = document.getElementById("modal-editar-contrato");
    if (!modal) {
      console.error("Modal de edição de contrato não encontrado.");
      return;
    }

    modal.style.display = "block";

    // Busca os dados do contrato na API
    const response = await fetch(`${apiBaseUrl}/api/contratos/${contratoId}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao buscar contrato. Status: ${response.status}, Detalhes: ${errorText}`);
    }

    const contrato = await response.json();

    // Preenche os campos do modal com os dados do contrato
    document.getElementById("edit-total-meses").value = contrato.total_meses || "";
    document.getElementById("edit-valor-aluguel").value = contrato.valor_aluguel || "";
    document.getElementById("edit-dia-vencimento").value = contrato.dia_vencimento || "";
    document.getElementById("edit-data-inicio").value = contrato.data_inicio || "";

    // Define evento para salvar alterações
    document.getElementById("btn-salvar-contrato").onclick = () => salvarEdicaoContrato(contratoId);

    // Define evento para cancelar edição
    document.getElementById("btn-cancelar-edicao-contrato").onclick = () => {
      modal.style.display = "none";
    };
  } catch (error) {
    console.error("Erro ao editar contrato:", error.message);
    alert(`Erro ao editar contrato: ${error.message}`);
  }
}

/**
 * Função para baixar o contrato gerado pelo backend.
 * @param {number} contratoId - ID do contrato a ser baixado.
 */
async function baixarContrato(contratoId) {
  try {
    if (!contratoId) {
      throw new Error("ID do contrato não fornecido.");
    }

    // Faz a requisição ao backend para gerar o contrato
    const response = await fetch(`${apiBaseUrl}/api/contratos/gerar/${contratoId}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Erro ao gerar contrato.");
    }

    // Cria o arquivo para download a partir do blob retornado
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Define o nome do arquivo para download
    a.download = `contrato_${contratoId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Revoga a URL para liberar memória
    window.URL.revokeObjectURL(url);
    alert("Contrato baixado com sucesso!");
  } catch (error) {
    console.error("Erro ao baixar contrato:", error.message);
    alert(`Erro ao baixar contrato: ${error.message}`);
  }
}

/**
 * Função para salvar as alterações feitas em um contrato.
 * @param {number} contratoId - ID do contrato a ser atualizado.
 */
async function salvarEdicaoContrato(contratoId) {
  try {
    const totalMeses = document.getElementById("edit-total-meses").value;
    const valorAluguel = document.getElementById("edit-valor-aluguel").value;
    const diaVencimento = document.getElementById("edit-dia-vencimento").value;
    const dataInicio = document.getElementById("edit-data-inicio").value;

    const response = await fetch(`${apiBaseUrl}/api/contratos/${contratoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        total_meses: totalMeses,
        valor_aluguel: valorAluguel,
        dia_vencimento: diaVencimento,
        data_inicio: dataInicio,
      }),
    });
    if (!response.ok) throw new Error(`Erro ao editar contrato. Status: ${response.status}`);

    alert("Contrato atualizado com sucesso!");
    document.getElementById("modal-editar-contrato").style.display = "none";
    carregarContratos(); // Atualiza a tabela
  } catch (error) {
    console.error("Erro ao salvar edição do contrato:", error);
    alert("Não foi possível editar o contrato.");
  }
}

/**
 * Função para inativar (excluir logicamente) um contrato.
 * @param {number} contratoId - ID do contrato a ser inativado.
 */
async function inativarContrato(contratoId) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/contratos/${contratoId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error(`Erro ao deletar contrato. Status: ${response.status}`);

    alert("Contrato inativado com sucesso!");
    document.getElementById("modal-editar-contrato").style.display = "none";
    carregarContratos(); // Atualiza a tabela
  } catch (error) {
    console.error("Erro ao excluir contrato:", error);
    alert("Não foi possível inativar o contrato.");
  }
}
