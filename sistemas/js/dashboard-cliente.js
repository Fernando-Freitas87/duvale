// dashboard-cliente.js
document.addEventListener("DOMContentLoaded", async () => {
    const userNameSpan       = document.getElementById("user-name");
    const mensalidadeCliente = document.getElementById("mensalidade-cliente");
    const gerarPixBtn        = document.getElementById("gerar-pix");
    const qrcodeContainer    = document.getElementById("qrcode-container");
    const qrcodeImg          = document.getElementById("qrcode");
    const codigoPixInput     = document.getElementById("codigo-pix");
    const tempoRestante      = document.getElementById("tempo-restante");
    const contratoSpan       = document.getElementById("Contrato");
  
    // 1. Carrega dados do cliente
    try {
      // Exemplo de endpoint para pegar dados do cliente
      const resposta = await fetch("/api/cliente/dados");
      if (!resposta.ok) {
        throw new Error("Não foi possível obter dados do cliente");
      }
  
      // Exemplo: Esperando algo como { nome: 'Fulano', mensalidade: 500, contrato: 12, ... }
      const dadosCliente = await resposta.json();
  
      // Atualiza o HTML com os dados retornados
      userNameSpan.textContent       = dadosCliente.nome             || "Usuário";
      mensalidadeCliente.textContent = `R$ ${dadosCliente.mensalidade?.toFixed(2) || "0,00"}`;
      contratoSpan.textContent       = `${dadosCliente.contrato || 0} Meses`;
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar dados do cliente. Ver console.");
    }
  
    // 2. Função para gerar Pix (exemplo)
    gerarPixBtn.addEventListener("click", async () => {
      try {
        // Exemplo de endpoint que retorna um objeto contendo:
        // { qrcodeUrl: "...", codigoPix: "...", expiracaoSegundos: 300 }
        const respPix = await fetch("/api/cliente/gerar-pix");
        if (!respPix.ok) {
          throw new Error("Falha ao gerar Pix");
        }
        const dadosPix = await respPix.json();
  
        // Atualiza a imagem do QR Code
        qrcodeImg.src = dadosPix.qrcodeUrl;
        // Atualiza o campo de texto com o código Pix
        codigoPixInput.value = dadosPix.codigoPix;
  
        // Exibe o container do QR Code
        qrcodeContainer.style.display = "block";
  
        // Inicia (ou reinicia) a contagem regressiva
        iniciarContagemRegressiva(dadosPix.expiracaoSegundos || 300);
      } catch (erro) {
        console.error(erro);
        alert("Erro ao gerar Pix. Ver console.");
      }
    });
  
    // 3. Função para copiar o código Pix (existe chamada inline no HTML: onclick="copiarCodigoPix()")
    //    - Podemos manter assim ou substituir por eventListener no JS.
    window.copiarCodigoPix = () => {
      codigoPixInput.select();
      document.execCommand("copy");
      alert("Código Pix copiado para área de transferência!");
    };
  
    // 4. Exemplo de contagem regressiva para expiração do Pix
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
  
        // Converte segundos para mm:ss
        const minutos = Math.floor(tempoRestanteSegundos / 60);
        const segs = tempoRestanteSegundos % 60;
        tempoRestante.textContent = `Expira em ${String(minutos).padStart(2, "0")}:${String(segs).padStart(2, "0")} minutos`;
  
        tempoRestanteSegundos--;
      }
  
      // Chama a primeira vez imediatamente e depois a cada 1 segundo
      atualizarTimer();
      intervalo = setInterval(atualizarTimer, 1000);
    }
  });