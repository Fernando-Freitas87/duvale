const apiBaseUrl = "https://duvale-production.up.railway.app";
document.addEventListener("DOMContentLoaded", () => {
  /***************************************************************
   * [1] VARIÁVEIS E ELEMENTOS PRINCIPAIS
   ***************************************************************/
  let currentStep = 0; // Indica qual formulário está sendo exibido
  const forms = document.querySelectorAll(".carousel-item"); 
  // Referência aos rádios (novo modelo de “etapas” via input radio)
  const radios = document.querySelectorAll(".radio-inputs input[name='etapa']");

  /***************************************************************
   * [2] FUNÇÕES DE NAVEGAÇÃO ENTRE FORMULÁRIOS
   ***************************************************************/

  /**
   * Exibe apenas o formulário cujo índice corresponde ao currentStep,
   * aplicando/removendo a classe "active".
   */
  function updateFormDisplay() {
    forms.forEach((form, index) => {
      // Se o índice for o atual, exibe (adiciona .active); caso contrário, oculta
      if (index === currentStep) {
        form.classList.add("active");
      } else {
        form.classList.remove("active");
      }
    });
  }

  /**
   * Observa as mudanças nos rádios (novo layout de etapas),
   * atualizando o currentStep conforme o índice do rádio selecionado.
   */
  function setupRadioNavigation() {
    radios.forEach((radio, index) => {
      radio.addEventListener("change", () => {
        currentStep = index;       // Atualiza a etapa
        updateFormDisplay();       // Exibe o formulário correspondente
      });
    });
  }
/***************************************************************
 * [3] CARREGAR E EXIBIR NOME DO USUÁRIO LOGADO
 ***************************************************************/
async function carregarUsuario() {
  try {
    const token = localStorage.getItem('authToken');

    // Verifica se o token é válido antes de continuar
    if (!token || token.trim() === '') {
      console.warn('Token inválido ou ausente. Exibindo nome padrão.');
      exibirNomeUsuario('Usuário');
      return;
    }

    // Requisição para buscar os dados do usuário logado
    const response = await fetch(`${apiBaseUrl}/api/usuario`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Verifica se a resposta é válida
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn('Token expirado ou inválido. Redirecionando para login...');
        localStorage.removeItem('authToken');
        window.location.href = '/login.html'; // Redireciona para o login
      } else {
        console.warn(`Erro ao carregar usuário (${response.status}): ${response.statusText}`);
      }
      exibirNomeUsuario('Usuário');
      return;
    }

    // Verifica se a resposta da API contém um objeto válido
    const usuario = await response.json();
    if (!usuario || typeof usuario !== 'object') {
      console.warn('Resposta da API inválida.');
      exibirNomeUsuario('Usuário');
      return;
    }

    // Atualiza a interface com o nome do usuário
    exibirNomeUsuario(usuario.nome || 'Usuário');
  } catch (error) {
    console.error('Erro ao carregar o nome do usuário:', error.message, error.stack);
    exibirNomeUsuario('Usuário');
  }
}

/**
 * Atualiza o nome do usuário na interface
 * @param {string} nome Nome do usuário a ser exibido
 */
function exibirNomeUsuario(nome) {
  const userNameElement = document.getElementById('user-name');
  if (userNameElement) {
    userNameElement.textContent = nome;
  } else {
    console.error('Elemento com ID "user-name" não encontrado no DOM.');
  }
}

/***************************************************************
 * [4] FUNÇÕES DE FEEDBACK VISUAL (LOADING E ALERTS)
 ***************************************************************/

/**
 * Exibe um indicador de carregamento na tela.
 * Evita a criação de múltiplas instâncias simultâneas.
 */
const showLoading = (message) => {
  if (document.getElementById("loading")) return; // Previne múltiplas instâncias
  
  const loadingDiv = document.createElement("div");
  loadingDiv.id = "loading";
  loadingDiv.innerHTML = `<span class="loader"></span> ${message}`;
  document.body.appendChild(loadingDiv);
};

/**
 * Remove o indicador de carregamento da tela.
 */
const hideLoading = () => {
  const loadingDiv = document.getElementById("loading");
  if (loadingDiv) loadingDiv.remove();
};

/**
 * Exibe um alerta na tela e remove automaticamente após 3 segundos.
 * Evita acúmulo de alertas.
 */
const showAlert = (message, type = "success") => {
  const existingAlert = document.querySelector(".alert");
  if (existingAlert) existingAlert.remove(); // Remove alerta anterior antes de exibir outro

  const alertDiv = document.createElement("div");
  alertDiv.className = `alert ${type}`;
  alertDiv.textContent = message;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3000);
};

  /***************************************************************
   * [5] MÁSCARAS DE CAMPOS (CPF, TELEFONE)
   ***************************************************************/
  function aplicarMascaraCPF() {
    const cpfInput = document.getElementById("cpf-cliente");
    if (cpfInput) {
      cpfInput.addEventListener("input", () => {
        let cpf = cpfInput.value.replace(/\D/g, "");
        cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
        cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
        cpf = cpf.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        cpfInput.value = cpf;
      });
    }
  }

  function aplicarMascaraTelefone() {
    const telefoneInput = document.getElementById("telefone-cliente");
    if (telefoneInput) {
      telefoneInput.addEventListener("input", () => {
        let telefone = telefoneInput.value.replace(/\D/g, "");
        telefone = telefone.replace(/^(\d{2})(\d)/, "($1) $2");
        telefone = telefone.replace(/(\d{4,5})(\d{4})$/, "$1-$2");
        telefoneInput.value = telefone;
      });
    }
  }


  /***************************************************************
   * [6] CARREGAR CLIENTES E IMÓVEIS (PARA CONTRATOS)
   ***************************************************************/
  async function carregarClientes() {
    try {
      showLoading("Carregando clientes...");
      const response = await fetch(`${apiBaseUrl}/api/cadastro/clientes`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Nenhum cliente encontrado.");
        throw new Error("Erro ao carregar clientes.");
      }

      const clientes = await response.json();
      const selectClienteContrato = document.getElementById("cliente-contrato");

      if (selectClienteContrato) {
        if (clientes.length === 0) {
          selectClienteContrato.innerHTML = '<option value="">Nenhum cliente disponível</option>';
        } else {
          selectClienteContrato.innerHTML = '<option value="">Selecione um cliente</option>';
          clientes.forEach((cliente) => {
            const option = document.createElement("option");
            option.value = cliente.id;
            option.textContent = cliente.nome;
            selectClienteContrato.appendChild(option);
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error.message);
      showAlert("Erro ao carregar clientes: " + error.message, "error");
    } finally {
      hideLoading();
    }
  }

  async function carregarImoveis() {
    try {
      showLoading("Carregando imóveis...");
      const response = await fetch(`${apiBaseUrl}/api/cadastro/imoveis/disponiveis`);
      if (!response.ok) {
        if (response.status === 404) throw new Error("Nenhum imóvel disponível.");
        throw new Error("Erro ao carregar imóveis.");
      }

      const imoveis = await response.json();
      const selectImovelContrato = document.getElementById("imovel-contrato");

      if (selectImovelContrato) {
        if (imoveis.length === 0) {
          selectImovelContrato.innerHTML = '<option value="">Nenhum imóvel disponível</option>';
        } else {
          selectImovelContrato.innerHTML = '<option value="">Selecione um imóvel</option>';
          imoveis.forEach((imovel) => {
            const option = document.createElement("option");
            option.value = imovel.id;
            option.textContent = imovel.descricao;
            selectImovelContrato.appendChild(option);
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar imóveis:", error.message);
      showAlert("Erro ao carregar imóveis: " + error.message, "error");
    } finally {
      hideLoading();
    }
  }

  /***************************************************************
   * [7] SUBMISSÃO DE FORMULÁRIOS
   ***************************************************************/

  const formCliente = document.getElementById("cadastro-cliente");

  if (formCliente) {
      formCliente.addEventListener("submit", async (e) => {
          e.preventDefault();
  
          const botaoSubmit = formCliente.querySelector("button[type='submit']");
          botaoSubmit.disabled = true;
  
          const cliente = {
              nome: document.getElementById("nome-cliente").value.trim(),
              cpf: document.getElementById("cpf-cliente").value.replace(/[^\d]/g, ""), // Remove pontuação
              telefone: document.getElementById("telefone-cliente").value.trim(),
              pin: document.getElementById("pin-cliente").value.trim(),
              tipo_usuario: "cliente", // Mantém fixo
              observacoes: document.getElementById("observacoes-cliente").value.trim(),
              nacionalidade: document.getElementById("nacionalidade-cliente").value.trim(),
              data_nascimento: document.getElementById("data-nascimento-cliente").value,
              documento_identidade: document.getElementById("documento-identidade-cliente").value.trim(),
              numero_documento_identidade: document.getElementById("numero-documento-cliente").value.trim(),
          };
  
          // ✅ Validações antes do envio
          if (!validarCPF(cliente.cpf)) {
              showAlert("CPF inválido. Verifique e tente novamente.", "error");
              botaoSubmit.disabled = false;
              return;
          }
  
          if (!/^\d{6}$/.test(cliente.pin)) {
              showAlert("O PIN deve conter exatamente 6 números.", "error");
              botaoSubmit.disabled = false;
              return;
          }
  
          if (!validarTelefone(cliente.telefone)) {
              showAlert("Número de telefone inválido. Use o formato (XX) XXXXX-XXXX.", "error");
              botaoSubmit.disabled = false;
              return;
          }
  
          try {
              showLoading("Cadastrando cliente...");
              const response = await fetch(`${apiBaseUrl}/api/cadastro/clientes`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(cliente),
              });
  
              if (!response.ok) {
                  const errorText = await response.json().catch(() => ({ message: "Erro desconhecido" }));
                  throw new Error(errorText.message || "Erro ao cadastrar cliente.");
              }
  
              showAlert("Cliente cadastrado com sucesso!", "success");
              formCliente.reset();
          } catch (error) {
              console.error("Erro ao cadastrar cliente:", error.message);
              showAlert(`Erro ao cadastrar cliente: ${error.message}`, "error");
          } finally {
              hideLoading();
              botaoSubmit.disabled = false;
          }
      });
  }


/* b) Cadastro de Imóveis */
const formImovel = document.getElementById("cadastro-imovel");

if (formImovel) {
  formImovel.addEventListener("submit", async (e) => {
    e.preventDefault();

    const botaoSubmit = formImovel.querySelector("button[type='submit']");
    botaoSubmit.disabled = true;

    // Lê os valores dos radio buttons
    const tipoInput = document.querySelector('input[name="tipo-imovel"]:checked');
    const statusInput = document.querySelector('input[name="status-imovel"]:checked');

    if (!tipoInput || !statusInput) {
      showAlert("Selecione o tipo e o status do imóvel.", "error");
      botaoSubmit.disabled = false;
      return;
    }

    const imovel = {
      descricao: document.getElementById("descricao-imovel").value.trim(),
      endereco: document.getElementById("endereco-imovel").value.trim(),
      tipo: tipoInput.value.trim(),
      status: statusInput.value.trim(),
      enel: document.getElementById("enel-imovel").value.trim(),
      cagece: document.getElementById("cagece-imovel").value.trim(),
    };

    // Verifica se todos os campos obrigatórios foram preenchidos
    if (!imovel.descricao || !imovel.endereco || !imovel.enel || !imovel.cagece) {
      showAlert("Todos os campos são obrigatórios.", "error");
      botaoSubmit.disabled = false;
      return;
    }

    try {
      showLoading("Cadastrando imóvel...");
      
      const response = await fetch(`${apiBaseUrl}/api/cadastro/imoveis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imovel),
      });

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.json();
        } catch {
          errorText = { message: "Erro desconhecido ao cadastrar imóvel." };
        }
        throw new Error(errorText.message || "Erro ao cadastrar imóvel.");
      }

      showAlert("Imóvel cadastrado com sucesso!", "success");
      formImovel.reset();
    } catch (error) {
      console.error("Erro ao cadastrar imóvel:", error.message);
      showAlert(`Erro ao cadastrar imóvel: ${error.message}`, "error");
    } finally {
      hideLoading();
      botaoSubmit.disabled = false;
    }
  });
}

 /* c) Cadastro de Contratos */
const formContrato = document.getElementById("cadastro-contrato");

if (formContrato) {
  formContrato.addEventListener("submit", async (e) => {
    e.preventDefault();

    const botaoSubmit = formContrato.querySelector("button[type='submit']");
    botaoSubmit.disabled = true;

    const clienteId = document.getElementById("cliente-contrato").value;
    const imovelId = document.getElementById("imovel-contrato").value;
    const totalMeses = parseInt(document.getElementById("total-meses").value.trim(), 10);
    const valorAluguel = parseFloat(document.getElementById("valor-aluguel").value.trim());
    const diaVencimento = parseInt(document.getElementById("dia-vencimento").value.trim(), 10);
    const dataInicio = new Date(document.getElementById("data-inicio").value);
    
    if (!clienteId || !imovelId) {
      showAlert("Selecione um cliente e um imóvel antes de continuar.", "error");
      botaoSubmit.disabled = false;
      return;
    }

    if (!totalMeses || totalMeses <= 0) {
      showAlert("Informe um número válido de meses.", "error");
      botaoSubmit.disabled = false;
      return;
    }

    if (!valorAluguel || isNaN(valorAluguel) || valorAluguel <= 0) {
      showAlert("Informe um valor válido para o aluguel.", "error");
      botaoSubmit.disabled = false;
      return;
    }

    if (!diaVencimento || diaVencimento < new Date().getDate()) {
      showAlert("O dia de vencimento deve ser igual ou posterior ao dia de hoje.", "error");
      botaoSubmit.disabled = false;
      return;
    }

    if (!dataInicio) {
      showAlert("Informe a data de início do contrato.", "error");
      botaoSubmit.disabled = false;
      return;
    }

    // Calcula a data de término automaticamente
    const dataFim = new Date(dataInicio);
    dataFim.setMonth(dataFim.getMonth() + totalMeses);
    document.getElementById("data-fim").value = dataFim.toISOString().split("T")[0];

    const contrato = {
      cliente_id: clienteId,
      imovel_id: imovelId,
      total_meses: totalMeses,
      valor_aluguel: valorAluguel,
      dia_vencimento: diaVencimento,
      data_inicio: dataInicio.toISOString().split("T")[0],
      data_fim: dataFim.toISOString().split("T")[0],
      parcelas: gerarParcelas(diaVencimento, totalMeses, valorAluguel, dataInicio),
    };

    try {
      showLoading("Cadastrando contrato...");

      const response = await fetch(`${apiBaseUrl}/api/cadastro/contratos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contrato),
      });

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.json();
        } catch {
          errorText = { message: "Erro desconhecido ao cadastrar contrato." };
        }
        throw new Error(errorText.message || "Erro ao cadastrar contrato.");
      }

      const { contratoId } = await response.json();
      if (contratoId) {
        await baixarContrato(contratoId);
        showAlert("Contrato cadastrado e contrato gerado com sucesso!", "success");
      } else {
        showAlert("Contrato cadastrado, mas não foi possível gerar o PDF.", "warning");
      }

      formContrato.reset();
    } catch (error) {
      console.error("Erro ao cadastrar contrato:", error.message);
      showAlert("Erro ao cadastrar contrato: " + error.message, "error");
    } finally {
      hideLoading();
      botaoSubmit.disabled = false;
    }
  });
}

/**
 * Função para gerar as parcelas do contrato
 * @param {number} diaVencimento Dia do vencimento da primeira parcela
 * @param {number} totalMeses Número total de parcelas
 * @param {number} valorAluguel Valor de cada parcela
 * @param {Date} dataInicio Data de início do contrato
 * @returns {Array} Lista de parcelas com datas e valores
 */
function gerarParcelas(diaVencimento, totalMeses, valorAluguel, dataInicio) {
  let parcelas = [];
  let dataParcela = new Date(dataInicio);
  dataParcela.setDate(diaVencimento);

  for (let i = 0; i < totalMeses; i++) {
    parcelas.push({
      numero: i + 1,
      data_vencimento: dataParcela.toISOString().split("T")[0],
      valor: valorAluguel.toFixed(2),
    });
    dataParcela.setMonth(dataParcela.getMonth() + 1);
  }
  return parcelas;
}

/**
 * Função auxiliar para gerar e baixar o contrato PDF
 * @param {number} contratoId ID do contrato recém-criado
 */
async function baixarContrato(contratoId) {
  if (!contratoId) {
    showAlert("Erro ao gerar o contrato. ID inválido.", "error");
    return;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/contratos/${contratoId}/gerar-pdf`);
    if (!response.ok) {
      throw new Error("Erro ao gerar PDF do contrato.");
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `contrato_${contratoId}.pdf`;
    link.click();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    showAlert(`Erro ao gerar PDF: ${error.message}`, "error");
  }
}


  /***************************************************************
   * [8] INICIALIZAÇÕES GERAIS
   ***************************************************************/
  setupRadioNavigation();  // Vincula a navegação dos rádios
  updateFormDisplay();     // Exibe o formulário inicial

  aplicarMascaraCPF();
  aplicarMascaraTelefone();

  carregarClientes();
  carregarImoveis();
  carregarUsuario();
  exibirNomeUsuario();
});