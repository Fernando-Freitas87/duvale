document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM utilizados
  const pinBoxes = document.querySelectorAll('.pin-box');
  const message = document.getElementById('message');
  const datetimeElement = document.getElementById('datetime');

  // ✅ Define a URL base da API do backend
  const apiBaseUrl = "https://duvale-production.up.railway.app"; 

  /**
   * Atualiza data e hora no elemento apropriado (a cada segundo).
   */
  function updateDatetime() {
    try {
      const now = new Date();
      const dayNames = [
        'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
        'Quinta-feira', 'Sexta-feira', 'Sábado',
      ];
      datetimeElement.textContent =
        `${dayNames[now.getDay()]}, ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    } catch (error) {
      console.error('Erro ao atualizar data e hora:', error);
    }
  }
  setInterval(updateDatetime, 1000);
  updateDatetime();

  /**
   * Configura eventos de input e navegação nos campos do PIN.
   */
  pinBoxes.forEach((box, index) => {
    // Permite somente números e navegação automática entre os campos
    box.addEventListener('input', () => {
      box.value = box.value.replace(/[^0-9]/g, ''); // Permitir apenas números
      if (box.value && index < pinBoxes.length - 1) {
        pinBoxes[index + 1].focus();
      } else if (index === pinBoxes.length - 1) {
        const pin = Array.from(pinBoxes).map(b => b.value).join('');
        validatePin(pin);
      }
    });

    // Navega para o campo anterior com Backspace
    box.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' && !box.value && index > 0) {
        pinBoxes[index - 1].focus();
      }
    });
  });

  /**
   * Valida a existência de token de autenticação e redireciona conforme a necessidade.
   */
  const authToken = localStorage.getItem('authToken');
  const currentPage = window.location.pathname;

  if (!authToken && !currentPage.includes('Index.html')) {
    alert('Sessão expirada. Faça login novamente.');
    window.location.href = 'Index.html';
    return;
  }

  if (authToken && !currentPage.includes('Index.html')) {
    fetch(`${apiBaseUrl}/api/usuario`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(response => {
        if (!response.ok) throw new Error('Erro ao carregar dados do usuário.');
        return response.json();
      })
      .then(userData => {
        localStorage.setItem('userName', userData.nome || 'Usuário');
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) userNameElement.textContent = userData.nome;
      })
      .catch(err => {
        console.error('Erro ao validar sessão:', err);
        alert('Sessão inválida. Faça login novamente.');
        localStorage.removeItem('authToken');
        window.location.href = 'Index.html';
      });
  }

  /**
   * Valida o PIN digitado e realiza login no sistema.
   */
  let attempts = 0;
  const MAX_ATTEMPTS = 5;
  
  async function validatePin(pin) {
    if (pin.length !== 6) {
      displayMessage('O PIN deve conter 6 dígitos.', 'error');
      resetPinFields();
      return;
    }
  
    if (attempts >= MAX_ATTEMPTS) {
      displayMessage('Muitas tentativas falhas. Tente novamente mais tarde.', 'error');
      return;
    }
  
    try {
      const response = await fetch(`${apiBaseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
  
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        if (data.type === 'cliente') {
          window.location.href = 'cliente.html';
        } else if (data.type === 'administrador') {
          window.location.href = 'Inicial.html';
        } else {
          displayMessage('Tipo de usuário inválido.', 'error');
        }
      } else {
        attempts++; // Incrementa tentativa
        displayMessage(`PIN inválido. Tentativa ${attempts} de ${MAX_ATTEMPTS}.`, 'error');
        resetPinFields();
      }
    } catch (error) {
      console.error('Erro na validação do PIN:', error);
      displayMessage('Erro ao conectar ao servidor.', 'error');
    }
  }

  /**
   * Exibe mensagens de feedback para o usuário.
   */
  function displayMessage(text, type) {
    if (message) {
      message.textContent = text;
      message.className = `message ${type}`;
      setTimeout(() => {
        message.textContent = '';
        message.className = 'message';
      }, 3000); // Remove após 3 segundos
    }
  }

  /**
   * Reseta os campos de entrada do PIN.
   */
  function resetPinFields() {
    pinBoxes.forEach(box => (box.value = ''));
    pinBoxes[0].focus();
  }

  // Função para carregar o nome do cliente
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
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (!response.ok) throw new Error('Erro ao obter dados do cliente.');
      const data = await response.json();
      console.log("✅ Nome do cliente carregado:", data.nome);
      document.getElementById('nome-cliente').textContent = data.nome || 'Usuário';
    } catch (error) {
      console.error('❌ Erro ao carregar nome do cliente:', error);
      document.getElementById('nome-cliente').textContent = 'Erro ao carregar usuário';
    }
  }

  /**
   * ✅ Função para realizar logout e redirecionar para a página de login.
   */
  window.logout = function () {
    console.log("🔒 Realizando logout...");
    localStorage.removeItem("authToken"); // Remove o token de autenticação
    window.location.href = "Index.html"; // Redireciona para a página de login
  }

  carregarNomeCliente();
});