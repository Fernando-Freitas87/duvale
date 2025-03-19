// dashboard-cliente.js
document.addEventListener("DOMContentLoaded", () => {
    // Defina a URL base da API
    const apiBaseUrl = "https://duvale-production.up.railway.app";
  
    // Seletores de elementos do DOM
    const userNameSpan       = document.getElementById("user-name");
    const mensalidadeCliente = document.getElementById("mensalidade-cliente");
    const gerarPixBtn        = document.getElementById("gerar-pix");
    const qrcodeContainer    = document.getElementById("qrcode-container");
    const qrcodeImg          = document.getElementById("qrcode");
    const codigoPixInput     = document.getElementById("codigo-pix");
    const tempoRestante      = document.getElementById("tempo-restante");
    const contratoSpan       = document.getElementById("Contrato");
    const botaoSair          = document.getElementById("sair");
  
    // -----------------------------------------------------------
    // 1. Carregar dados do cliente
    // -----------------------------------------------------------
    async function carregarDadosCliente() {
      try {
        // Recupera o token do localStorage
        const token = localStorage.getItem("authToken");
        if (!token) {
          alert("Sessão expirada ou inexistente. Faça login novamente.");
          window.location.href = "index.html";
          return;
        }
  
        // Faz GET para /api/clientes/dados com cabeçalho Authorization
        const response = await fetch(`${apiBaseUrl}/api/clientes/dados`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
  
        if (!response.ok) {
          throw new Error("Erro ao carregar dados do cliente");
        }
  
        // Exemplo de JSON esperado:
        // { nome: 'Fulano', mensalidade: 500, contrato: 12, ... }
        const dados = await response.json();
  
        // Exibir ou tratar dados no HTML
        userNameSpan.textContent       = dados.nome || "Usuário";
        mensalidadeCliente.textContent = `R$ ${Number(dados.mensalidade || 0).toFixed(2)}`;
        contratoSpan.textContent       = `${dados.contrato || 0} Meses`;
      } catch (error) {
        console.error(error);
        alert("Não foi possível carregar as informações do cliente.");
      }
    }
  
    // -----------------------------------------------------------
    // 2. Gerar Pix e mostrar QR Code
    // -----------------------------------------------------------
    async function gerarPix() {
      try {
        // Recupera o token do localStorage
        const token = localStorage.getItem("authToken");
        if (!token) {
          alert("Sessão expirada ou inexistente. Faça login novamente.");
          window.location.href = "index.html";
          return;
        }
  
        // Chama rota POST /api/clientes/gerar-pix
        const response = await fetch(`${apiBaseUrl}/api/clientes/gerar-pix`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
  
        if (!response.ok) {
          throw new Error("Falha ao gerar Pix");
        }
  
        // Exemplo de JSON:
        // { qrcodeUrl: "...", codigoPix: "...", expiracaoSegundos: 300 }
        const dadosPix = await response.json();
  
        // Atualiza a imagem do QR Code e o campo de texto
        qrcodeImg.src = dadosPix.qrcodeUrl || "";
        codigoPixInput.value = dadosPix.codigoPix || "";
  
        // Exibe o container do QR Code
        qrcodeContainer.style.display = "block";
  
        // Inicia contagem regressiva
        iniciarContagemRegressiva(dadosPix.expiracaoSegundos || 300);
      } catch (erro) {
        console.error(erro);
        alert("Erro ao gerar Pix. Ver console para detalhes.");
      }
    }
  
    // -----------------------------------------------------------
    // 3. Copiar o código Pix
    // -----------------------------------------------------------
    window.copiarCodigoPix = () => {
      codigoPixInput.select();
      document.execCommand("copy");
      alert("Código Pix copiado para a área de transferência!");
    };
  
    // -----------------------------------------------------------
    // 4. Contagem regressiva do Pix
    // -----------------------------------------------------------
    let intervalo = null;
    function iniciarContagemRegressiva(segundos) {
      clearInterval(intervalo);
  
      let tempoRestanteSegundos = segundos;
  
      function atualizarTimer() {
        if (tempoRestanteSegundos <= 0) {
          clearInterval(intervalo);
          tempoRestante.textContent = "Tempo de pagamento expirou!";
          return;
        }
  
        const minutos = Math.floor(tempoRestanteSegundos / 60);
        const segs = tempoRestanteSegundos % 60;
        tempoRestante.textContent = `Expira em ${String(minutos).padStart(2, "0")}:${String(segs).padStart(2, "0")} minutos`;
  
        tempoRestanteSegundos--;
      }
  
      atualizarTimer();
      intervalo = setInterval(atualizarTimer, 1000);
    }
  
    // -----------------------------------------------------------
    // 5. Logout Seguro
    // -----------------------------------------------------------
    if (botaoSair) {
      botaoSair.addEventListener("click", async (event) => {
        event.preventDefault();
        try {
          const token = localStorage.getItem("authToken");
          if (!token) {
            alert("Sessão expirada ou inexistente. Faça login novamente.");
            window.location.href = "index.html";
            return;
          }
  
          // Rota POST /api/logout
          await fetch(`${apiBaseUrl}/api/logout`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
  
          // Limpa token local e redireciona
          localStorage.removeItem("authToken");
          document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          window.location.href = "index.html";
        } catch (err) {
          console.error("Erro ao sair", err);
          alert("Não foi possível efetuar logout.");
        }
      });
    }
  
    // -----------------------------------------------------------
    // Execução Inicial
    // -----------------------------------------------------------
    carregarDadosCliente();
  
    if (gerarPixBtn) {
      gerarPixBtn.addEventListener("click", gerarPix);
    }
  });