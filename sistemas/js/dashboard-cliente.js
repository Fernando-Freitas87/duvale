/**
 * dashboard-cliente.js
 *
 * Script principal da página de cliente, responsável por:
 *  1) Verificar token de autenticação.
 *  2) Carregar dados do usuário (nome, contrato, mensalidade).
 *  3) Popular informações na tela (cards e histórico).
 *  4) Gerar PIX (se disponível).
 *  5) Configurar logout.
 */

// ============================================================
// 1) Configurações Globais e Evento DOMContentLoaded
// ============================================================

const apiBaseUrl = "https://duvale-production.up.railway.app";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Verifica se existe token
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      alert("Sessão expirada. Faça login novamente.");
      window.location.href = "index.html";
      return;
    }

    // Carrega dados do usuário via API
    const userInfo = await carregarUsuario();
    
    // Prepara o botão de logout
    configurarLogout();

    // Prepara o botão de gerar Pix (caso exista no DOM)
    configurarGerarPix();

    // Exibe dados básicos na tela (mensalidade, contrato etc.)
    popularDadosBasicosNaTela(userInfo);

    // Carrega e exibe histórico (tabela dinâmica)
    await carregarHistoricoUsuario();

  } catch (error) {
    console.error("Erro geral na inicialização da página:", error);
    alert("Ocorreu um erro ao carregar a página de cliente. Tente novamente.");
  }
});

// ============================================================
// 2) Função: Carregar dados do usuário (nome, etc.)
// ============================================================
async function carregarUsuario() {
  try {
    // Obtém o token de autenticação do localStorage
    const token = localStorage.getItem("authToken");

    // Se não houver token, exibe nome genérico e retorna null
    if (!token) {
      console.warn("Token de autenticação não encontrado.");
      exibirNomeUsuario("Usuário");
      return null;
    }

    // Define a URL da API e os headers necessários
    const url = `${apiBaseUrl}/api/usuario`;
    const headers = { Authorization: `Bearer ${token}` };

    // Faz a requisição à API
    const response = await fetch(url, { headers });

    // Tratamento especial para token inválido ou expirado (erro 401)
    if (response.status === 401) {
      console.warn("Token inválido ou expirado. Redirecionando para login...");
      localStorage.removeItem("authToken"); // Remove token inválido
      window.location.href = "index.html"; // Redireciona para a página de login
      return null;
    }

    // Se houver outro erro na resposta, exibe uma mensagem e retorna null
    if (!response.ok) {
      console.warn(`Erro ao carregar o usuário: status ${response.status}`);
      exibirNomeUsuario("Usuário");
      return null;
    }

    // Converte a resposta para JSON e extrai os dados do usuário
    const usuario = await response.json();

    // Exibe o nome do usuário na interface (ou "Usuário" se não houver nome)
    exibirNomeUsuario(usuario.nome || "Usuário");

    // Retorna os dados do usuário para outras funções utilizarem
    return usuario;

  } catch (error) {
    // Captura e exibe no console qualquer erro inesperado durante a execução
    console.error("Erro ao carregar dados do usuário:", error);
    
    // Exibe nome genérico em caso de erro
    exibirNomeUsuario("Usuário");
    
    return null;
  }
}

// ============================================================
// 3) Exibir Nome do Usuário na Navbar
// ============================================================
/*function exibirNomeUsuario(nome) {
  const userNameElement = document.getElementById("user-name");
  if (!userNameElement) {
    console.error('Elemento com ID "user-name" não encontrado no DOM.');
    return;
  }
  userNameElement.textContent = nome;
}*/

// ============================================================
// 4) Configurar Logout (limpa token e redireciona)
// ============================================================
function configurarLogout() {
  const sairLink = document.getElementById("sair");
  if (!sairLink) {
    console.warn('Link para sair ("#sair") não encontrado.');
    return;
  }

  sairLink.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!confirm("Tem certeza que deseja sair?")) return;

    try {
      const token = localStorage.getItem("authToken");

      if (token) {
        await fetch("https://duvale-production.up.railway.app/api/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.warn("Erro ao deslogar no servidor:", error);
    }

    // Aguarda um tempo para evitar redirecionamento prematuro
    await new Promise(resolve => setTimeout(resolve, 500));

    localStorage.removeItem("authToken");
    localStorage.removeItem("userName");
    window.location.href = "index.html";
  });
}

// ============================================================
// 5) Configurar Geração de Pix (POST na API)
// ============================================================
function configurarGerarPix() {
  const gerarPixButton = document.getElementById("gerar-pix");
  if (!gerarPixButton) {
    // Se o botão não existir na página, não faz nada
    return;
  }

  gerarPixButton.addEventListener("click", async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("Token de autenticação não encontrado. Faça login novamente.");
        return;
      }

      // Caso esteja em produção, confirme se a rota /api/gerar-pix está correta no back-end
      const response = await fetch(`${apiBaseUrl}/api/gerar-pix`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro na geração do PIX. Status: ${response.status}`);
      }

      const data = await response.json();
      alert(data.message || "PIX gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar QR Code para pagamento com PIX:", error);
      alert("Erro ao gerar QR Code para pagamento com PIX.");
    }
  });
}

// ============================================================
// 7) Carregar os dados do cliente
// ============================================================

async function carregarDadosBasicos() {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("Token não encontrado.");

    const response = await fetch(`${apiBaseUrl}/api/cliente/dados-basicos`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar dados básicos do cliente. Código: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || Object.keys(data).length === 0) {
      console.warn("Resposta da API está vazia.");
      return;
    }

    // Atualiza a interface com os dados recebidos
    popularDadosBasicosNaTela(data);

  } catch (error) {
    console.error("Erro em carregarDadosBasicos:", error);
    alert("Falha ao carregar os dados básicos do cliente.");
  }
}

function popularDadosBasicosNaTela(userInfo) {
  if (!userInfo) return;

  // Atualiza a mensalidade
  const mensalidadeElement = document.getElementById("mensalidade-cliente");
  if (mensalidadeElement) {
    mensalidadeElement.textContent = userInfo.mensalidade;
  } else {
    console.warn('Elemento "mensalidade-cliente" não encontrado no DOM.');
  }

  // Atualiza os dados do contrato, se existirem
  if (userInfo.contrato) {
    const contratoElement = document.getElementById("contrato-cliente");
    if (contratoElement) {
      contratoElement.textContent = userInfo.contrato.meses 
        ? `${userInfo.contrato.meses} Meses`
        : "-- Meses";
    } else {
      console.warn("Elemento 'contrato-cliente' não encontrado.");
    }

    // Atualiza os avisos do contrato
    const avisosContrato = document.querySelectorAll(".avisos-li");
    if (avisosContrato.length >= 3) {
      avisosContrato[0].textContent = `Vigência: ${userInfo.contrato.vigencia}`;
      avisosContrato[1].textContent = `Valor Mensal: ${userInfo.contrato.valorMensal}`;
      avisosContrato[2].textContent = `Valor Total: ${userInfo.contrato.valorTotal}`;
    }
  } else {
    console.warn("Contrato não encontrado na resposta da API.");
  }
}

// ============================================================
// 7) Carregar Histórico do Usuário e Popular na Tabela
// ============================================================
async function carregarHistoricoUsuario() {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.warn("Token não encontrado para histórico.");
      return;
    }

    // Ajuste a rota /api/historico conforme seu backend real
    const response = await fetch(`${apiBaseUrl}/api/historico`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`Erro ao buscar histórico: ${response.status}`);
    }

    const historicoData = await response.json();

    // Localiza o container "table" para inserir as linhas
    const historicoTable = document.querySelector(".historico .table");
    if (!historicoTable) {
      console.warn("Tabela de histórico não encontrada (.historico .table).");
      return;
    }

    // Para cada item do histórico, cria uma linha
    historicoData.forEach((entry) => {
      const row = document.createElement("div");
      row.classList.add("row");

      // Cria as "células" .cell para cada valor do objeto
      Object.values(entry).forEach((value) => {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.textContent = value;
        row.appendChild(cell);
      });

      // Exemplo: célula de ação
      const actionCell = document.createElement("div");
      actionCell.classList.add("cell");
      const actionButton = document.createElement("button");
      actionButton.textContent = "Detalhes";
      actionButton.addEventListener("click", () => {
        alert(`Detalhes de ${entry.nome || "Não informado"}`);
      });
      actionCell.appendChild(actionButton);
      row.appendChild(actionCell);

      // Anexa a row na tabela
      historicoTable.appendChild(row);
    });
  } catch (error) {
    console.error("Erro ao carregar histórico do usuário:", error);
    alert("Não foi possível carregar o histórico. Tente novamente mais tarde.");
  }
}

// ====================================================================
// 8) Funções de exemplo (carregarEmAtraso, carregarAVencer...) OPCIONAL
// ====================================================================

/*
async function carregarEmAtraso() {
  try {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`${apiBaseUrl}/api/mensalidades/em-atraso`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Erro ao carregar Em Atraso: ${response.status}`);

    const data = await response.json();
    const tbody = document.getElementById('tabela-atraso-corpo');
    if (!tbody) return;

    tbody.innerHTML = "";
    data.forEach((item) => {
      const tr = document.createElement("tr");
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
  // Similar a carregarEmAtraso()
}
*/