// ---------------------------------------------------------------------
// app.js
// ---------------------------------------------------------------------
// Script responsável por:
// - Gerenciar a entrada do PIN pelo usuário.
// - Validar sessão e redirecionar para páginas específicas.
// - Carregar informações iniciais (caso haja token).
// ---------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM utilizados
  const pinBoxes = document.querySelectorAll('.pin-box');
  const message = document.getElementById('message');
  const datetimeElement = document.getElementById('datetime');

  /**
   * Atualiza data e hora no elemento apropriado (a cada segundo).
   */
  function updateDatetime() {
    const now = new Date();
    const dayNames = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
      'Quinta-feira', 'Sexta-feira', 'Sábado',
    ];
    datetimeElement.textContent =
      `${dayNames[now.getDay()]}, ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  }
  setInterval(updateDatetime, 1000); // Atualiza a cada segundo
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

  if (!authToken && !currentPage.includes('index.html')) {
    alert('Sessão expirada. Faça login novamente.');
    window.location.href = 'index.html';
    return;
  }

  if (authToken && !currentPage.includes('index.html')) {
    fetch('https://duvale-production.up.railway.app/api/usuario', {
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
        window.location.href = 'index.html';
      });
  }

  /**
   * Valida o PIN digitado e realiza login no sistema.
   */
  async function validatePin(pin) {
    if (pin.length !== 6) {
      displayMessage('O PIN deve conter 6 dígitos.', 'error');
      resetPinFields();
      return;
    }

    try {
      const response = await fetch('https://duvale-production.up.railway.app/api/login', {
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
          window.location.href = 'gerencial.html';
        } else {
          displayMessage('Tipo de usuário inválido.', 'error');
        }
      } else {
        displayMessage('PIN inválido.', 'error');
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
    }
  }

  /**
   * Reseta os campos de entrada do PIN.
   */
  function resetPinFields() {
    pinBoxes.forEach(box => (box.value = ''));
    pinBoxes[0].focus();
  }
});