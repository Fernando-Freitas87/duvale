// ---------------------------------------------------------------------
// app.js
// ---------------------------------------------------------------------
// Script responsável por:
// - Gerenciar a entrada do PIN pelo usuário.
// - Validar sessão e redirecionar para páginas específicas.
// - Carregar informações iniciais (caso haja token).
// ---------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // Seleciona campos do PIN e elemento de mensagens
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
    setInterval(updateDatetime, 1000);
    updateDatetime();
  
    /**
     * Configura eventos de input e navegação (Backspace) nos campos do PIN.
     */
    pinBoxes.forEach((box, index) => {
      // Permite somente números
      box.addEventListener('input', () => {
        box.value = box.value.replace(/[^0-9]/g, '');
        if (box.value && index < pinBoxes.length - 1) {
          pinBoxes[index + 1].focus();
        } else if (index === pinBoxes.length - 1) {
          const pin = Array.from(pinBoxes).map(b => b.value).join('');
          validatePin(pin);
        }
      });
  
      // Retorna ao campo anterior se Backspace for pressionado e o campo estiver vazio
      box.addEventListener('keydown', (event) => {
        if (event.key === 'Backspace' && !box.value && index > 0) {
          pinBoxes[index - 1].focus();
        }
      });
    });
  
    /**
     * Verifica existência de token de autenticação.
     * Se não existir e este for o login.html, não faz nada.
     * Caso contrário, redireciona para login se estiver em outra página.
     *
     * Ajuste a lógica conforme a sua estrutura de páginas.
     */
    const authToken = localStorage.getItem('authToken');
    const currentPage = window.location.pathname; // Ex: '/index.html', '/login.html' etc.
  
    // Exemplo: se não tiver token e não estiver na página de login, força login
    if (!authToken && !currentPage.includes('index.html')) {
      alert('Sessão expirada. Faça login novamente.');
      window.location.href = 'index.html';
      return;
    }
  
    // Se a página for de login, não carrega dados do usuário
    if (authToken && currentPage.includes('index.html')) {
      // Já logado? Redireciona para a página cliente ou gerencial se desejar
      // (Descomente se quiser esse comportamento)
      // window.location.href = 'gerencial.html';
    }
  
    // Se tiver token e não estiver na página de login, tenta validar
    if (authToken && !currentPage.includes('index.html')) {
      fetch('http://localhost:3000/api/usuario', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then(response => {
          if (!response.ok) throw new Error('Erro ao carregar dados do usuário.');
          return response.json();
        })
        .then(userData => {
          console.log('Dados do usuário:', userData);
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
     * Função para validar o PIN digitado e realizar login.
     * Caso o PIN seja válido, redireciona para página de cliente ou admin.
     */
    async function validatePin(pin) {
      if (pin.length !== 6) {
        displayMessage('O PIN deve conter 6 dígitos.', 'error');
        resetPinFields();
        return;
      }
  
      try {
        const response = await fetch('http://localhost:3000/api/login', {
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
     * Exibe mensagem para o usuário.
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