const apiBaseUrl = "https://duvale-production.up.railway.app"; 

// ✅ Adiciona evento para carregar o nome do cliente ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    carregarNomeCliente();
});

/**
 * ✅ Função para carregar o nome do cliente da API e exibir no HTML.
 * - Obtém o token de autenticação do localStorage.
 * - Faz uma requisição à API `/api/cliente/dados`.
 * - Exibe o nome do cliente no elemento com id `nome-cliente`.
 */
async function carregarNomeCliente() {
    try {
        console.log("📡 Buscando nome do cliente...");
        const response = await fetch(`${apiBaseUrl}/api/cliente/dados`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem("authToken")}` }
        });
        if (!response.ok) throw new Error("Erro ao obter dados do cliente.");

        const data = await response.json();
        console.log("✅ Nome do cliente carregado:", data.nome);
        document.getElementById("nome-cliente").textContent = data.nome || "Usuário";
    } catch (error) {
        console.error("❌ Erro ao carregar nome do cliente:", error);
        document.getElementById("nome-cliente").textContent = "Erro ao carregar usuário";
    }
}

/**
 * ✅ Função para realizar logout e redirecionar para a página de login.
 */
function logout() {
    console.log("🔒 Realizando logout...");
    localStorage.removeItem("authToken"); // Remove o token de autenticação
    window.location.href = "Index.html"; // Redireciona para a página de login
}