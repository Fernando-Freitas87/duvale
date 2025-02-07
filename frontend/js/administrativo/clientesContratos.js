/**
 * Carrega os clientes do banco de dados e exibe na tabela do painel gerencial.
 */
const apiBaseUrl = "https://duvale-production.up.railway.app";


/**
 * Verifica se o token de autenticação está presente no localStorage.
 * Caso contrário, redireciona o usuário para a página de login.
 */
function verificarTokenAutenticacao() {
  const token = localStorage.getItem("authToken"); // Obtém o token de autenticação do localStorage
  if (!token) {
    console.error("Token de autenticação ausente. Redirecionando para a página de login."); // Loga um erro no console
    alert("Sua sessão expirou. Por favor, faça login novamente."); // Alerta ao usuário
    window.location.href = "index.html"; // Redireciona para a página de login
  }
  return token; // Retorna o token, caso exista
}

/**
 * Função assíncrona para carregar os clientes do banco de dados
 * e exibi-los na tabela do painel gerencial.
 */
export async function carregarClientes() {
  try {
    const token = verificarTokenAutenticacao(); // Verifica e obtém o token de autenticação

    // Faz a requisição para a API de clientes
    const response = await fetch(`${apiBaseUrl}/api/clientes`, {
      headers: {
        Authorization: `Bearer ${token}`, // Inclui o token no cabeçalho de autorização
      },
    });

    // Verifica se a resposta foi bem-sucedida
    if (!response.ok) {
      const errorText = await response.text(); // Obtém detalhes do erro, se fornecido pelo backend
      throw new Error(`Erro ao buscar clientes. Status: ${response.status}. Detalhes: ${errorText}`);
    }

    const lista = await response.json(); // Converte a resposta em JSON

    // Seleciona o corpo da tabela onde os clientes serão exibidos
    const tbody = document.getElementById("clientes-corpo");
    if (!tbody) {
      console.error("Elemento tbody para clientes não encontrado no DOM."); // Loga um erro se o elemento não for encontrado
      return;
    }

    tbody.innerHTML = ""; // Limpa a tabela antes de adicionar novos dados

    // Filtra a lista para exibir apenas os clientes que não são administradores
    const clientesVisiveis = lista.filter((cli) => cli.tipo_usuario !== "administrador");

    // Caso não haja clientes visíveis, exibe uma mensagem padrão
    if (clientesVisiveis.length === 0) {
      exibirMensagemNenhumCliente(tbody); // Chama a função para exibir a mensagem
      return;
    }

    // Adiciona cada cliente visível na tabela
    clientesVisiveis.forEach((cliente) => adicionarClienteNaTabela(cliente, tbody));
  } catch (error) {
    console.error("Erro ao carregar clientes:", error.message || error); // Loga o erro no console
    alert("Erro ao carregar clientes. Verifique sua conexão ou tente novamente."); // Notifica o usuário
  }
}

/**
 * Exibe uma mensagem de "Nenhum cliente encontrado" na tabela.
 * @param {HTMLElement} tbody - Corpo da tabela onde a mensagem será exibida.
 */
function exibirMensagemNenhumCliente(tbody) {
  const tr = document.createElement("tr"); // Cria uma nova linha na tabela
  tr.innerHTML = `
    <td colspan="6" style="text-align:center;font-weight:bold;">
      Nenhum cliente encontrado.
    </td>`; // Preenche a linha com a mensagem
  tbody.appendChild(tr); // Adiciona a linha ao corpo da tabela
}

/**
 * Adiciona um cliente como uma linha na tabela.
 * @param {object} cliente - Dados do cliente.
 * @param {HTMLElement} tbody - Corpo da tabela onde o cliente será adicionado.
 */
function adicionarClienteNaTabela(cliente, tbody) {
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

  // Adiciona eventos aos botões de ação
  configurarEventosDeAcoes(tr, cliente.id);

  tbody.appendChild(tr);
}

/**
 * Configura os eventos de ação (editar/excluir) para os botões em uma linha da tabela.
 * @param {HTMLElement} tr - Linha da tabela onde os eventos serão configurados.
 * @param {number} clienteId - ID do cliente associado à linha.
 */
function configurarEventosDeAcoes(tr, clienteId) {
  const btnEditar = tr.querySelector(".btn-icone-editar");
  const btnExcluir = tr.querySelector(".btn-icone-excluir");

  if (btnEditar) {
    btnEditar.addEventListener("click", (event) => {
      event.preventDefault(); // Previne comportamento padrão do link
      if (clienteId) {
        editarClienteModal(clienteId); // Função para editar cliente
      } else {
        console.error("ID do cliente não encontrado no botão de edição.");
      }
    });
  } else {
    console.error("Botão de edição não encontrado na linha da tabela.");
  }

  if (btnExcluir) {
    btnExcluir.addEventListener("click", (event) => {
      event.preventDefault();
      if (clienteId) {
        if (confirm(`Deseja realmente excluir o cliente ID: ${clienteId}?`)) {
          excluirCliente(clienteId); // Função para excluir cliente
        }
      } else {
        console.error("ID do cliente não encontrado no botão de exclusão.");
      }
    });
  } else {
    console.error("Botão de exclusão não encontrado na linha da tabela.");
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
  try {
    // Verifica se o ID do cliente foi fornecido
    if (!clienteId) {
      console.error("ID do cliente não fornecido.");
      alert("Erro: ID do cliente não fornecido.");
      return;
    }

    // Obtém o modal de edição pelo ID
    const modal = document.getElementById("modal-editar-cliente");
    if (!modal) {
      console.error("Modal de edição de cliente não encontrado no DOM.");
      return;
    }

    // Faz a requisição para buscar os dados do cliente
    const response = await fetch(`${apiBaseUrl}/api/clientes/${clienteId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    // Verifica se a requisição foi bem-sucedida
    if (!response.ok) {
      const errorText = await response.text(); // Detalhes do erro do backend
      console.error(`Erro ao buscar detalhes do cliente. Status: ${response.status}, Detalhes: ${errorText}`);
      alert("Erro ao carregar os dados do cliente.");
      return;
    }

    // Converte a resposta em JSON
    const cliente = await response.json();

    // Preenche os campos do modal com os dados do cliente
    preencherCamposDoModal(cliente);

    // Exibe o modal
    modal.style.display = "block";

    // Define os eventos dos botões do modal
    configurarEventosDoModal(clienteId, modal);
  } catch (error) {
    console.error("Erro ao carregar cliente:", error.message || error);
    alert("Erro ao carregar os dados do cliente.");
  }
}

/**
 * Preenche os campos do modal com os dados do cliente.
 * @param {object} cliente - Dados do cliente retornados pela API.
 */
function preencherCamposDoModal(cliente) {
  document.getElementById("edit-cliente-nome").value = cliente.nome || "";
  document.getElementById("edit-cliente-cpf").value = cliente.cpf || "";
  document.getElementById("edit-cliente-telefone").value = cliente.telefone || "";
  document.getElementById("edit-cliente-pin").value = cliente.pin || "";
  document.getElementById("edit-cliente-observacoes").value = cliente.observacoes || "";
  document.getElementById("edit-cliente-nacionalidade").value = cliente.nacionalidade || "";
  document.getElementById("edit-cliente-data-nascimento").value = cliente.data_nascimento || "";
  document.getElementById("edit-cliente-documento-identidade").value = cliente.documento_identidade || "";
  document.getElementById("edit-cliente-numero-documento").value = cliente.numero_documento_identidade || "";
}

/**
 * Configura os eventos dos botões "Salvar" e "Cancelar" no modal.
 * @param {number} clienteId - ID do cliente sendo editado.
 * @param {HTMLElement} modal - Referência ao modal de edição.
 */
function configurarEventosDoModal(clienteId, modal) {
  // Evento para salvar alterações
  const btnSalvar = document.getElementById("btn-salvar-cliente");
  if (btnSalvar) {
    btnSalvar.onclick = () => salvarEdicaoCliente(clienteId);
  } else {
    console.error("Botão 'Salvar' não encontrado no modal.");
  }

  // Evento para cancelar edição e fechar o modal
  const btnCancelar = document.getElementById("btn-cancelar-cliente");
  if (btnCancelar) {
    btnCancelar.onclick = () => {
      modal.style.display = "none";
    };
  } else {
    console.error("Botão 'Cancelar' não encontrado no modal.");
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

    // Obtém o token de autenticação do localStorage
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("Token de autenticação ausente. Faça login novamente.");

    // Envia os dados para o backend
    const response = await fetch(`${apiBaseUrl}/api/clientes/${clienteId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Adiciona o cabeçalho de autorização
      },
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
    alert(`Não foi possível editar o cliente: ${error.message}`);
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
  const contratoId = event.currentTarget.getAttribute("data-id"); // Isso está pegando o ID do contrato
  editarContrato(contratoId); // Certifique-se de usar a função correta
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

/**
 * Função para carregar os dados de um contrato e preencher os campos no modal de edição.
 * @param {number} contratoId - ID do contrato a ser editado.
 */
async function editarContrato(contratoId) {
  try {
    // Verifica se o ID do contrato foi fornecido
    if (!contratoId) {
      throw new Error("ID do contrato não foi fornecido.");
    }

    // Obtém o modal de edição de contrato
    const modal = document.getElementById("modal-editar-contrato");
    if (!modal) {
      console.error("Modal de edição de contrato não encontrado.");
      return;
    }

    // Exibe o modal antes de carregar os dados
    modal.style.display = "block";

    // Obtém o token de autenticação
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("Token de autenticação ausente. Faça login novamente.");
    }

    // Faz a requisição para buscar os dados do contrato
    const response = await fetch(`${apiBaseUrl}/api/contratos/${contratoId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Verifica se a requisição foi bem-sucedida
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao buscar contrato. Status: ${response.status}. Detalhes: ${errorText}`);
    }

    // Converte a resposta para JSON
    const contrato = await response.json();

    // Obtém os elementos do modal
    const totalMesesInput = document.getElementById("edit-total-meses");
    const valorAluguelInput = document.getElementById("edit-valor-aluguel");
    const diaVencimentoInput = document.getElementById("edit-dia-vencimento");
    const dataInicioInput = document.getElementById("edit-contrato-data-inicio"); // Corrigido ID do input de data

    // Verifica se os elementos do formulário existem antes de atribuir valores
    if (!totalMesesInput || !valorAluguelInput || !diaVencimentoInput || !dataInicioInput) {
      throw new Error("Um ou mais elementos do formulário não foram encontrados no DOM.");
    }

    // Preenche os campos do modal com os dados do contrato
    totalMesesInput.value = contrato.total_meses || "";
    valorAluguelInput.value = contrato.valor_aluguel || "";
    diaVencimentoInput.value = contrato.dia_vencimento || "";
    dataInicioInput.value = contrato.data_inicio ? contrato.data_inicio.split("T")[0] : ""; // Formata a data corretamente

    // Obtém os botões do modal
    const btnSalvar = document.getElementById("btn-contrato-salvar");
    const btnCancelar = document.getElementById("btn-contrato-cancelar");

    // Configura evento de salvar contrato
    if (btnSalvar) {
      btnSalvar.onclick = () => salvarEdicaoContrato(contratoId);
    } else {
      console.error("Botão 'Salvar' não encontrado no modal.");
    }

    // Configura evento para fechar o modal ao cancelar
    if (btnCancelar) {
      btnCancelar.onclick = () => {
        modal.style.display = "none";
      };
    } else {
      console.error("Botão 'Cancelar' não encontrado no modal.");
    }

  } catch (error) {
    // Loga erro no console e exibe um alerta ao usuário
    console.error("Erro ao editar contrato:", error.message || error);
    alert(`Erro ao editar contrato: ${error.message || "Erro desconhecido"}`);
  }
}

function preencherCamposContrato(contrato) {
  const totalMesesInput = document.getElementById("edit-total-meses");
  const valorAluguelInput = document.getElementById("edit-valor-aluguel");
  const diaVencimentoInput = document.getElementById("edit-dia-vencimento");
  const dataInicioInput = document.getElementById("edit-data-inicio");

  if (totalMesesInput) totalMesesInput.value = contrato.total_meses || "";
  if (valorAluguelInput) valorAluguelInput.value = contrato.valor_aluguel || "";
  if (diaVencimentoInput) diaVencimentoInput.value = contrato.dia_vencimento || "";
  if (dataInicioInput) dataInicioInput.value = contrato.data_inicio || "";
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
