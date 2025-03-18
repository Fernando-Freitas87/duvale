// dashboard-cliente.js
document.addEventListener("DOMContentLoaded", () => {
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
        // Placeholder de endpoint para obter dados do cliente (GET)
        const response = await fetch("/api/cliente/dados");
        if (!response.ok) {
          throw new Error("Erro ao carregar dados do cliente");
        }
  
        // Espera-se um JSON com algo como:
        // { nome: 'Fulano', mensalidade: 500, contrato: 12, ... }
        const dados = await response.json();
  
        // Exibir ou tratar dados no HTML
        userNameSpan.textContent       = dados.nome             || "Usuário";
        mensalidadeCliente.textContent = `R$ ${Number(dados.mensalidade || 0).toFixed(2)}`;
        contratoSpan.textContent       = `${dados.contrato || 0} Meses`;
      } catch (error) {
        console.error(error);
        alert("Não foi possível carregar as informações do cliente. Ver console para detalhes.");
      }
    }
  
    // -----------------------------------------------------------
    // 2. Gerar Pix e mostrar QR Code
    // -----------------------------------------------------------
    async function gerarPix() {
      try {
        // Placeholder de endpoint para gerar Pix (POST ou GET)
        const response = await fetch("/api/cliente/gerar-pix");
        if (!response.ok) {
          throw new Error("Falha ao gerar Pix");
        }
  
        // Espera-se um JSON com algo como:
        // { qrcodeUrl: "...", codigoPix: "...", expiracaoSegundos: 300 }
        const dadosPix = await response.json();
  
        // Atualiza a imagem do QR Code
        qrcodeImg.src = dadosPix.qrcodeUrl || "";
        // Atualiza o campo de texto com o código Pix
        codigoPixInput.value = dadosPix.codigoPix || "";
  
        // Exibe o container do QR Code
        qrcodeContainer.style.display = "block";
  
        // Inicia (ou reinicia) a contagem regressiva para expirar o Pix
        iniciarContagemRegressiva(dadosPix.expiracaoSegundos || 300);
      } catch (erro) {
        console.error(erro);
        alert("Erro ao gerar Pix. Ver console para detalhes.");
      }
    }
  
    // -----------------------------------------------------------
    // 3. Copiar o código Pix
    // -----------------------------------------------------------
    // Chamado no HTML com onclick="copiarCodigoPix()", mas também
    // poderíamos usar eventListener no botão "botao-copiar".
    window.copiarCodigoPix = () => {
      codigoPixInput.select();
      document.execCommand("copy");
      alert("Código Pix copiado para a área de transferência!");
    };
  
    // -----------------------------------------------------------
    // 4. Contagem regressiva para expiração do Pix
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
  
      // Chama imediatamente e depois a cada 1 segundo
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
          // Placeholder de endpoint para logout (POST)
          await fetch("/api/logout", { method: "POST" });
  
          // Se estiver usando localStorage ou cookies para tokens, limpe-os:
          localStorage.removeItem("token");
          document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  
          // Redireciona para a tela de login
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