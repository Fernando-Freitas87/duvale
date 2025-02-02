// ---------------------------------------------------------------------
// dashboard-admin.js
// ---------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  /**
   * 1) Verificação do Token de Autenticação
   */
  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "index.html";
    return;
  }

  /**
   * 2) Carregamento Inicial
   *    - Buscamos dados do usuário (para exibir nome, mensalidade, etc.).
   *    - Carregamos avisos, histórico, etc. se necessário.
   *    - Configuramos também o botão de logout.
   */
  const userInfo = await carregarUsuario(); // Exibe o nome do usuário e retorna objeto
  configurarLogout();
  gerarPix(); // Configura o botão (caso exista) para gerar PIX

  // Exemplo de carregar dados adicionais (caso precise):
  //await carregarEmAtraso();
  //await carregarAVencer();
  //await carregarContratos();
  //await carregarImoveis();
  //await carregarClientes();
  //await carregarResumo();           // se houver
  //await carregarAvisosGerenciais(); // se houver

  // Preenche informações na tela, se existirem elementos HTML correspondentes
  popularDadosBasicosNaTela(userInfo);

  // Exemplo: buscar histórico do usuário e exibir na tabela “historico”
  // (depende da sua estrutura HTML - caso você use .historico .table)
  await carregarHistoricoUsuario();

  /**
   * 3) Configuração dos Cards (cliques) para exibir e ocultar seções
   *    - Selecionamos os cards pelo ID
   *    - Selecionamos as seções de tabela pelo ID
   *    - Ao clicar em cada card, exibimos apenas a seção correspondente
   */
  const cardImoveis       = document.getElementById("card-imoveis-cadastrados");
  const cardContratos     = document.getElementById("card-contratos-ativos");
  const cardAVencer       = document.getElementById("card-a-vencer");
  const cardEmAtraso      = document.getElementById("card-total-em-atraso");

  // Seções das tabelas
  const secaoEmAtraso       = document.getElementById("em-atraso-section");
  const secaoAVencer        = document.getElementById("a-vencer-section");
  const secaoImoveis        = document.getElementById("gerenciar-imoveis-section");
  const secaoContratos      = document.getElementById("gerenciar-contratos-section");
  const secaoClientes       = document.getElementById("gerenciar-clientes-section");

  // Função para ocultar todas as seções de tabela
  function ocultarTodasSecoes() {
    if (secaoEmAtraso)   secaoEmAtraso.style.display   = "none";
    if (secaoAVencer)    secaoAVencer.style.display    = "none";
    if (secaoImoveis)    secaoImoveis.style.display    = "none";
    if (secaoContratos)  secaoContratos.style.display  = "none";
    if (secaoClientes)   secaoClientes.style.display   = "none";
  }

  // Exibe “Em Atraso” por padrão (caso seja o comportamento desejado)
  ocultarTodasSecoes();
  if (secaoEmAtraso) secaoEmAtraso.style.display = "block";

  // Clique no card "Total em Atraso"
  if (cardEmAtraso) {
    cardEmAtraso.addEventListener("click", () => {
      ocultarTodasSecoes();
      if (secaoEmAtraso) secaoEmAtraso.style.display = "block";
    });
  }

  // Clique no card "A Vencer"
  if (cardAVencer) {
    cardAVencer.addEventListener("click", () => {
      ocultarTodasSecoes();
      if (secaoAVencer) secaoAVencer.style.display = "block";
    });
  }

  // Clique no card "Contratos Ativos" -> exibe Contratos + Clientes
  if (cardContratos) {
    cardContratos.addEventListener("click", () => {
      ocultarTodasSecoes();
      if (secaoContratos) secaoContratos.style.display = "block";
      if (secaoClientes)  secaoClientes.style.display  = "block";
    });
  }

  // Clique no card "Imóveis Cadastrados"
  if (cardImoveis) {
    cardImoveis.addEventListener("click", () => {
      ocultarTodasSecoes();
      if (secaoImoveis) secaoImoveis.style.display = "block";
    });
  }

  // -------------------------------------------------------------------
  // FIM da configuração de cliques nos cards
  // -------------------------------------------------------------------
});

/**
 * Carrega dados do usuário (nome, contrato, mensalidade) via API e exibe o nome na navbar.
 * Retorna o objeto de usuário para uso posterior (ex.: popular telas).
 */
async function carregarUsuario() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('Token de autenticação não encontrado. Será exibido "Usuário" como padrão.');
      exibirNomeUsuario('Usuário');
      return null;
    }

    // Faz a requisição ao endpoint do backend
    const response = await fetch('http://localhost:3000/api/usuario', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      // Erro na resposta
      console.warn(`Erro ao carregar o usuário: ${response.status}`);
      exibirNomeUsuario('Usuário');
      return null;
    }

    const usuario = await response.json();
    exibirNomeUsuario(usuario.nome || 'Usuário');
    return usuario;
  } catch (error) {
    console.error('Erro ao carregar o nome do usuário:', error);
    exibirNomeUsuario('Usuário');
    return null;
  }
}

/**
 * Atualiza o elemento HTML <span id="user-name"> com o nome do usuário.
 */
function exibirNomeUsuario(nome) {
  const userNameElement = document.getElementById('user-name');
  if (userNameElement) {
    userNameElement.textContent = nome;
  } else {
    console.error('Elemento com ID "user-name" não encontrado no DOM.');
  }
}

/**
 * Configura o botão "Sair" para limpar o localStorage e redirecionar ao login.
 */
function configurarLogout() {
  const sairLink = document.getElementById("sair");
  if (sairLink) {
    sairLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("authToken");
      localStorage.removeItem("userName");
      window.location.href = "index.html";
    });
  }
}

/**
 * Se existir um botão de gerar Pix com id="gerar-pix", configura a ação de POST na API.
 */
function gerarPix() {
  const gerarPixButton = document.getElementById("gerar-pix");
  if (gerarPixButton) {
    gerarPixButton.addEventListener("click", async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:3000/api/gerar-pix', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        alert(data.message);
      } catch (error) {
        console.error('Erro ao gerar QR Code para pagamento com PIX:', error);
        alert('Erro ao gerar QR Code para pagamento com PIX.');
      }
    });
  }
}

/**
 * Exemplo de função para popular dados básicos na tela (mensalidade, contrato etc.),
 * caso os elementos existam no HTML.
 */
function popularDadosBasicosNaTela(userInfo) {
  if (!userInfo) return;

  // Exibe informações da mensalidade
  const mensalidadeCliente = document.getElementById("mensalidade-cliente");
  if (mensalidadeCliente) {
    mensalidadeCliente.textContent = userInfo.mensalidade || "R$ 0,00";
  }

  // Preenche informações do contrato (por exemplo #Contrato, .avisos-li, etc.)
  const contratoElement = document.getElementById("Contrato");
  if (contratoElement) {
    contratoElement.textContent = userInfo.contrato?.meses || "-- Meses";
  }

  const avisosContrato = document.querySelectorAll(".avisos-li");
  if (avisosContrato && avisosContrato.length >= 3) {
    const [vigenciaElement, mensalElement, totalElement] = avisosContrato;
    if (vigenciaElement) {
      vigenciaElement.textContent = `Vigência: ${userInfo.contrato?.vigencia || "--/--/---- - --/--/----"}`;
    }
    if (mensalElement) {
      mensalElement.textContent = `Valor Mensal: ${userInfo.contrato?.valorMensal || "R$ 0,00"}`;
    }
    if (totalElement) {
      totalElement.textContent = `Valor Total: ${userInfo.contrato?.valorTotal || "R$ 0,00"}`;
    }
  }
}

/**
 * Exemplo de busca do histórico do usuário na API e exibição em .historico .table
 * Ajuste conforme sua estrutura real ou use outra função genérica.
 */
async function carregarHistoricoUsuario() {
  try {
    const apiBaseUrl = 'http://localhost:3000/api';
    const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };

    // Faz a request
    const historicoResponse = await fetch(`${apiBaseUrl}/historico`, { headers });
    if (!historicoResponse.ok) throw new Error("Erro ao buscar histórico.");

    const historicoData = await historicoResponse.json();

    // Exemplo de preenchimento numa DIV .historico > .table (mobile-style)
    // Se seu HTML usa table <tr>/<td>, ajuste aqui.
    const historicoTable = document.querySelector(".historico .table");
    if (!historicoTable) return;

    historicoData.forEach((entry) => {
      const row = document.createElement("div");
      row.classList.add("row");

      // Cria células com os valores do objeto
      Object.values(entry).forEach((value) => {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.textContent = value;
        row.appendChild(cell);
      });

      // Exemplo: adicionando célula de ação
      const actionCell = document.createElement("div");
      actionCell.classList.add("cell");

      const actionButton = document.createElement("button");
      actionButton.textContent = "Detalhes";
      actionButton.addEventListener("click", () => {
        alert(`Detalhes de ${entry.nome}`);
      });

      actionCell.appendChild(actionButton);
      row.appendChild(actionCell);

      historicoTable.appendChild(row);
    });
  } catch (error) {
    console.error("Erro ao carregar histórico do usuário:", error.message);
    alert("Não foi possível carregar o histórico. Tente novamente mais tarde.");
  }
}

/* ====================================================================
   ABAIXO, EXEMPLOS DE FUNÇÕES PARA CARREGAR/POPULAR TABELAS ESPECÍFICAS
   (caso deseje usar rotas do back-end e IDs definidos nas seções)
   ====================================================================*/

/**
 * Exemplo: Carrega dados de "Em Atraso" e preenche a tabela #tabela-atraso-corpo
 */
async function carregarEmAtraso() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('http://localhost:3000/api/mensalidades/em-atraso', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`Erro ao carregar Em Atraso: ${response.status}`);

    const data = await response.json();
    const tbody = document.getElementById('tabela-atraso-corpo');
    if (!tbody) return;

    tbody.innerHTML = ""; // limpa antes
    data.forEach((item) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.inquilino}</td>
        <td>${item.imovel}</td>
        <td>${item.vencimento}</td>
        <td>R$ ${item.valor}</td>
        <td>${item.status}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro em carregarEmAtraso:", error);
  }
}

async function carregarAVencer() {
  // Lógica muito similar a carregarEmAtraso()
}

async function carregarImoveis() {
  // fetch em /api/imoveis -> preenche #imoveis-corpo
}

async function carregarClientes() {
  // fetch em /api/clientes -> preenche #clientes-corpo
}

async function carregarContratos() {
  // fetch em /api/contratos -> preenche #contratos-corpo
}

/* 
   Você pode criar funções de paginação, filtro por data, etc.
   dependendo do que seu backend suportar, integrando o 
   query string (ex.: ?startDate=...&endDate=...) para filtrar dados.
*/