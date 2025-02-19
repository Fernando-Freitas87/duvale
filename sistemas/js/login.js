/**
 * URL do backend.
 * Substitua por 'duvale-production.up.railway.app' quando necessário.
 */
const backendUrl = 'https://duvale-production.up.railway.app';

/**
 * Função para mostrar ou ocultar o indicador de carregamento.
 * @param {boolean} show - Determina se o indicador deve ser exibido.
 */
function toggleLoading(show) {
    const loadingIndicator = document.getElementById('loading');
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'block' : 'none';
    }
}

/**
 * Valida o PIN e realiza a autenticação do usuário.
 * @param {string} pin - PIN informado pelo usuário.
 */
async function validatePin(pin) {
    // Verifica se o PIN é válido (exatamente 6 dígitos numéricos).
    if (!pin || !/^\d{6}$/.test(pin)) {
        alert('PIN inválido. O PIN deve conter exatamente 6 dígitos.');
        return;
    }

    try {
        // Exibe o indicador de carregamento.
        toggleLoading(true);

        // Faz a requisição ao backend para autenticar o usuário.
        const response = await fetch(`${backendUrl}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin }),
        });

        // Remove o indicador de carregamento.
        toggleLoading(false);

        // Verifica se a resposta do servidor não é bem-sucedida.
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro: ${response.status} - ${errorText}`);
        }

        // Processa os dados recebidos do servidor.
        const data = await response.json();

        // Verifica se os dados essenciais estão presentes na resposta.
        if (!data.token || !data.type) {
            throw new Error('Resposta do servidor incompleta.');
        }

        // Armazena o token de autenticação no localStorage.
        localStorage.setItem('authToken', data.token);

        // Redireciona o usuário com base no tipo de conta.
        if (data.type === 'cliente') {
            window.location.href = 'cliente.html';
        } else if (data.type === 'administrador') {
            window.location.href = 'Inicial.html';
        } else {
            alert('Tipo de usuário inválido.');
        }
    } catch (error) {
        // Remove o indicador de carregamento e exibe o erro.
        toggleLoading(false);
        console.error('Erro na validação do PIN:', error);
        alert(error.message || 'Erro ao conectar ao servidor.');
    }
}

/**
 * Configura o formulário de login e adiciona os eventos necessários.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Seleciona o formulário de login e o campo de entrada do PIN.
    const loginForm = document.getElementById('login-form');
    const pinInput = document.getElementById('pin-input');

    // Verifica se os elementos necessários existem na página.
    if (loginForm && pinInput) {
        // Adiciona o evento de submissão ao formulário.
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Evita o recarregamento da página.
            const pin = pinInput.value.trim();
            validatePin(pin); // Chama a função de validação do PIN.
        });
    } else {
        console.error('Elemento de formulário ou campo PIN não encontrado.');
    }
});