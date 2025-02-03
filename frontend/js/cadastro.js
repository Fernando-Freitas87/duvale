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
      if (!token) {
        console.warn('Token de autenticação não encontrado. Nome padrão será exibido.');
        exibirNomeUsuario('Usuário');
        return;
      }

      const response = await fetch(`${apiBaseUrl}/api/usuario`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        console.warn(`Erro ao carregar o usuário: ${response.status}`);
        exibirNomeUsuario('Usuário');
        return;
      }

      const usuario = await response.json();
      exibirNomeUsuario(usuario.nome || 'Usuário');
    } catch (error) {
      console.error('Erro ao carregar o nome do usuário:', error);
      exibirNomeUsuario('Usuário');
    }
  }

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
  const showLoading = (message) => {
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "loading";
    loadingDiv.textContent = message;
    document.body.appendChild(loadingDiv);
  };

  const hideLoading = () => {
    const loadingDiv = document.getElementById("loading");
    if (loadingDiv) loadingDiv.remove();
  };

  const showAlert = (message, type = "success") => {
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

  /* a) Cadastro de Clientes */
  const formCliente = document.getElementById("cadastro-cliente");
  if (formCliente) {
    formCliente.addEventListener("submit", async (e) => {
      e.preventDefault();

      const cliente = {
        nome: document.getElementById("nome-cliente").value.trim(),
        cpf: document
          .getElementById("cpf-cliente")
          .value.replace(/[^\d]/g, ""), // Remove pontuação
        telefone: document.getElementById("telefone-cliente").value.trim(),
        pin: document.getElementById("pin-cliente").value.trim(),
        tipo_usuario: "cliente", // Mantém fixo
        observacoes: document
          .getElementById("observacoes-cliente")
          .value.trim(),
        nacionalidade: document
          .getElementById("nacionalidade-cliente")
          .value.trim(),
        data_nascimento: document.getElementById("data-nascimento-cliente").value,
        documento_identidade: document
          .getElementById("documento-identidade-cliente")
          .value.trim(),
        numero_documento_identidade: document
          .getElementById("numero-documento-cliente")
          .value.trim(),
      };

      try {
        showLoading("Cadastrando cliente...");
        const response = await fetch(`${apiBaseUrl}/api/cadastro/clientes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cliente),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Erro ao cadastrar cliente.");
        }

        showAlert("Cliente cadastrado com sucesso!", "success");
        formCliente.reset();
      } catch (error) {
        console.error("Erro ao cadastrar cliente:", error.message);
        showAlert(`Erro ao cadastrar cliente: ${error.message}`, "error");
      } finally {
        hideLoading();
      }
    });
  }

/* b) Cadastro de Imóveis */
const formImovel = document.getElementById("cadastro-imovel");
if (formImovel) {
  formImovel.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Lê o valor do radio "tipo-imovel" selecionado
    const tipoValue = document.querySelector('input[name="tipo-imovel"]:checked').value;
    // Lê o valor do radio "status-imovel" selecionado
    const statusValue = document.querySelector('input[name="status-imovel"]:checked').value;

    const imovel = {
      descricao: document.getElementById("descricao-imovel").value.trim(),
      endereco: document.getElementById("endereco-imovel").value.trim(),
      tipo: tipoValue.trim(),
      status: statusValue.trim(),
      enel: document.getElementById("enel-imovel").value.trim(),
      cagece: document.getElementById("cagece-imovel").value.trim(),
    };

    try {
      showLoading("Cadastrando imóvel...");
      const response = await fetch(`${apiBaseUrl}/api/cadastro/imoveis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imovel),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Erro ao cadastrar imóvel.");
      }

      showAlert("Imóvel cadastrado com sucesso!", "success");
      formImovel.reset();
    } catch (error) {
      console.error("Erro ao cadastrar imóvel:", error.message);
      showAlert(`Erro ao cadastrar imóvel: ${error.message}`, "error");
    } finally {
      hideLoading();
    }
  });
}

  /* c) Cadastro de Contratos */
  const formContrato = document.getElementById("cadastro-contrato");
  if (formContrato) {
    // Primeira parte: Cadastrar Contrato
    formContrato.addEventListener("submit", async (e) => {
      e.preventDefault();

      const clienteId = document.getElementById("cliente-contrato").value;
      const imovelId = document.getElementById("imovel-contrato").value;

      if (!clienteId || !imovelId) {
        showAlert("Selecione um cliente e um imóvel antes de continuar.", "error");
        return;
      }

      const contrato = {
        cliente_id: clienteId,
        imovel_id: imovelId,
        total_meses: document.getElementById("total-meses").value.trim(),
        valor_aluguel: document.getElementById("valor-aluguel").value.trim(),
        dia_vencimento: document.getElementById("dia-vencimento").value.trim(),
        data_inicio: document.getElementById("data-inicio").value,
        data_fim: document.getElementById("data-fim").value,
      };

      try {
        showLoading("Cadastrando contrato...");
        const response = await fetch(`${apiBaseUrl}/api/cadastro/contratos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contrato),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Erro ao cadastrar contrato.");
        }

        // Segunda parte: gerar e baixar contrato
        const { contratoId } = await response.json();
        await baixarContrato(contratoId);
        showAlert("Contrato cadastrado e contrato gerado com sucesso!", "success");
        formContrato.reset();
      } catch (error) {
        console.error("Erro ao cadastrar contrato:", error.message);
        showAlert("Erro ao cadastrar contrato: " + error.message, "error");
      } finally {
        hideLoading();
      }
    });
  }

  /**
   * Função auxiliar para gerar e baixar o contrato PDF
   * @param {number} contratoId ID do contrato recém-criado
   */
  async function baixarContrato(contratoId) {
    try {
      const response = await fetch(`${apiBaseUrl}/api/contratos/${contratoId}/gerar-pdf`);
      if (!response.ok) {
        throw new Error("Erro ao gerar PDF do contrato.");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Cria um link para forçar o download do PDF
      const link = document.createElement("a");
      link.href = url;
      link.download = `contrato_${contratoId}.pdf`;
      link.click();

      // Libera o objeto do PDF
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