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
      exibirEmailUsuario("usuario@email.com");
      return;
    }

    const response = await fetch(`${apiBaseUrl}/api/usuario`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      console.warn(`Erro ao carregar o usuário: ${response.status}`);
      exibirNomeUsuario("Usuário");
      exibirEmailUsuario("usuario@email.com");
      return;
    }

    const usuario = await response.json();
    exibirNomeUsuario(usuario.nome || "Usuário");
    exibirEmailUsuario(usuario.email || "usuario@email.com");
  } catch (error) {
    console.error("Erro ao carregar o nome do usuário:", error);
    exibirNomeUsuario("Usuário");
    exibirEmailUsuario("usuario@email.com");
  }
}

/**
 * Exibe o nome do usuário no elemento #usuarioLogado e #usuarioLogadoSidebar.
 */
function exibirNomeUsuario(nome) {
  const userNameElement = document.getElementById("usuarioLogado");
  const userNameSidebar = document.getElementById("usuarioLogadoSidebar");
  if (userNameElement) userNameElement.textContent = nome;
  if (userNameSidebar) userNameSidebar.textContent = nome;
}

/**
 * Exibe o email do usuário no elemento #emailLogadoSidebar.
 */
function exibirEmailUsuario(email) {
  const emailSidebar = document.getElementById("emailLogadoSidebar");
  if (emailSidebar) emailSidebar.textContent = email;
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
      window.location.href = "index.html";
    });
  }
}

/**
 * Protege rotas que exigem autenticação.
 * Redireciona para index.html caso não haja token.
 */
export function protegerRota() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "index.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  configurarLogout();
});
