// auth.js

/**
 * Carrega as informações do usuário logado.
 * - Busca do localStorage o token.
 * - Faz requisição à /api/usuario para obter nome.
 * - Exibe no elemento #user-name.
 */
const apiBaseUrl = window.location.hostname.includes("setta.dev.br")
  ? "https://duvale-production.up.railway.app"
  : "http://localhost:5000";
  
export async function carregarUsuario() {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      exibirNomeUsuario("Usuário");
      return;
    }

    const response = await fetch(`${apiBaseUrl}/api/usuario`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      console.warn(`Erro ao carregar o usuário: ${response.status}`);
      exibirNomeUsuario("Usuário");
      return;
    }

    const usuario = await response.json();
    exibirNomeUsuario(usuario.nome || "Usuário");
  } catch (error) {
    console.error("Erro ao carregar o nome do usuário:", error);
    exibirNomeUsuario("Usuário");
  }
}

/**
 * Exibe o nome do usuário no elemento #user-name.
 */
function exibirNomeUsuario(nome) {
  const userNameElement = document.getElementById("usuarioLogado");
  if (userNameElement) {
    userNameElement.textContent = nome;
  } else {
    console.error('Elemento com ID "usuarioLogado" não encontrado no DOM.');
  }
}

/**
 * Configura o processo de logout.
 * - Remove authToken do localStorage
 * - Redireciona para index.html
 */
export function configurarLogout() {
  const sairLink = document.getElementById("sair");
  if (sairLink) {
    sairLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("authToken");
      window.location.href = "Index.html";
    });
  }
}
