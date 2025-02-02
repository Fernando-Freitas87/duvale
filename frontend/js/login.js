/**
 * Mostra ou oculta o indicador de carregamento.
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
    if (!pin || !/^\d{6}$/.test(pin)) {
        alert('PIN inválido. O PIN deve conter exatamente 6 dígitos.');
        return;
    }

    try {
        toggleLoading(true);

        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin }),
        });

        toggleLoading(false);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        if (!data.token || !data.type) {
            throw new Error('Resposta do servidor incompleta.');
        }

        localStorage.setItem('authToken', data.token);
        if (data.type === 'cliente') {
            window.location.href = 'cliente.html';
        } else if (data.type === 'administrador') {
            window.location.href = 'gerencial.html';
        } else {
            alert('Tipo de usuário inválido.');
        }
    } catch (error) {
        toggleLoading(false);
        console.error('Erro na validação do PIN:', error);
        alert(error.message || 'Erro ao conectar ao servidor.');
    }
}

// Adiciona o evento ao formulário de login
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const pinInput = document.getElementById('pin-input');

    if (loginForm && pinInput) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Evita o reload da página
            const pin = pinInput.value.trim();
            validatePin(pin);
        });
    } else {
        console.error('Elemento de formulário ou campo PIN não encontrado.');
    }
});