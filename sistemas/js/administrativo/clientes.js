const flaskApiUrl = "https://duvale-flask.up.railway.app";
const nodeApiUrl = "https://duvale-node.up.railway.app";
const apiBaseUrl = flaskApiUrl; // Backend definido claramente (Flask)

//######################################################
// ✅ Função unificada para carregar dados do cliente
//######################################################
async function carregarDadosCliente() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      mostrarToast('Sessão expirada, redirecionando...');
      setTimeout(() => logout(), 2000);
      return;
    }

    const response = await fetch(`${apiBaseUrl}/api/cliente/mensalidade`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      if (response.status === 401) {
        mostrarToast("Sessão expirada!");
        setTimeout(() => logout(), 2000);
        return;
      }
      console.warn(`Erro ao carregar dados do cliente: ${response.status}`);
      exibirNomeUsuario('Usuário');
      return;
    }

    const data = await response.json();
    exibirNomeUsuario(data.nome || "Usuário");
    document.getElementById("valor").textContent = `R$ ${data.mensalidade.toFixed(2)}`;

  } catch (error) {
    console.error('Erro ao carregar dados do cliente:', error);
    exibirNomeUsuario('Usuário');
  }
}

function exibirNomeUsuario(nome) {
  const userNameElement = document.getElementById('user-name');
  if (userNameElement) {
    userNameElement.textContent = nome;
  } else {
    console.error('Elemento com ID "user-name" não encontrado no DOM.');
  }
}

//######################################################
// ✅ LOGOUT DO USUÁRIO
//######################################################
function logout() {
  localStorage.removeItem("authToken");
  window.location.href = '/index.html';
}

// Inicialização unificada
document.addEventListener("DOMContentLoaded", carregarDadosCliente);

//######################################################
// ✅ Função para GERAR QR CODE MERCADO PAGO
//######################################################
async function gerarQRCode() {
  console.log("Função gerarQRCode() foi chamada!");

  const valorResponse = await fetch(`${apiBaseUrl}/api/mensalidade`);
  const valorData = await valorResponse.json();
  const valor = parseFloat(valorData.valor);

  if (isNaN(valor) || valor <= 0) {
    document.getElementById('resultado').innerHTML = "❌ Informe um valor válido!";
    return;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/gerar-qrcode`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${localStorage.getItem("authToken")}` 
      },
      body: JSON.stringify({ valor: valor, descricao: "Mensalidade Aluguel" })
    });

    const data = await response.json();

    if (data.erro) {
      document.getElementById('resultado').innerText = `❌ ${data.erro}`;
      return;
    }

    if (!data.qr_code || !data.qr_data || !data.payment_id) {
      document.getElementById('resultado').innerText = "❌ Erro ao gerar QR Code.";
      return;
    }

    document.getElementById('qrcode-container').style.display = 'block';
    document.getElementById('qrcode').src = `data:image/png;base64,${data.qr_code}`;
    document.getElementById('qrcode').style.display = 'block';

    const codigoPixElemento = document.getElementById('codigo-pix');
    const botaoCopiar = document.getElementById('botao-copiar');

    codigoPixElemento.value = data.qr_data;
    codigoPixElemento.style.display = 'block';
    botaoCopiar.style.display = 'inline-block';

    iniciarTemporizador(3, data.payment_id);

  } catch (error) {
    document.getElementById('resultado').innerText = `❌ Erro: ${error.message}`;
    console.error("Erro:", error);
  }
}

//######################################################
// ✅ Função VERIFICAR STATUS DO PAGAMENTO
//######################################################
async function verificarPagamento(paymentId, intervaloTimer) {
  console.log(`🔍 Iniciando verificação do pagamento ID: ${paymentId}...`);

  let verificandoPagamento = false;
  const tempoLimite = 3 * 60 * 1000;
  const inicio = Date.now();

  const intervaloPagamento = setInterval(async () => {
    if (verificandoPagamento) return;
    verificandoPagamento = true;

    const tempoDecorrido = Date.now() - inicio;

    if (tempoDecorrido >= tempoLimite) {
      console.log("⚠️ Tempo limite atingido. Parando verificação.");
      clearInterval(intervaloPagamento);
      clearInterval(intervaloTimer);
      ocultarElementos();
      document.getElementById('resultado').innerText = "";
      mostrarToast("Tempo limite excedido! Gere um novo QR Code.");
      verificandoPagamento = false;
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/verificar-pagamento/${paymentId}`);

      if (!response.ok) {
        throw new Error(`Erro ao consultar pagamento (HTTP ${response.status})`);
      }

      const data = await response.json();

      if (!data || !data.status) {
        throw new Error("Resposta inválida ou sem status definido.");
      }

      if (data.status === "approved") {
        console.log("✅ Pagamento aprovado! Encerrando verificação.");
        clearInterval(intervaloPagamento);
        clearInterval(intervaloTimer);
        ocultarElementos();
        document.getElementById('resultado').innerText = "";
        mostrarToast("✅ Pagamento aprovado!");
      }

    } catch (error) {
      console.error("❌ Erro ao verificar pagamento:", error.message);
    } finally {
      verificandoPagamento = false;
    }

  }, 10000);
}