

//#############################################################################
            // ✅ Função para GERAR QR CODE MERCADO PAGO
//#############################################################################


async function gerarQRCode() {
    console.log("Função gerarQRCode() foi chamada!");

    const valorLabel = document.getElementById('valor');
    const valor = parseFloat(valorLabel.textContent.replace("R$", "").replace(",", ".").trim());

    if (isNaN(valor) || valor <= 0) {
        document.getElementById('resultado').innerHTML = "❌ Informe um valor válido!";
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/gerar-qrcode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor: valor, descricao: "Mensalidade Aluguel" })
        });

        if (!response.ok) {
            throw new Error(`Erro no servidor (${response.status})`);
        }

        const data = await response.json();
        console.log("Resposta do servidor:", data);

        if (!data || !data.qr_code || !data.qr_data || !data.payment_id) {
            document.getElementById('resultado').innerText = "❌ Erro ao gerar QR Code.";
            return;
        }

        // ✅ Exibe QR Code
        document.getElementById('qrcode-container').style.display = 'block';
        document.getElementById('qrcode').src = `data:image/png;base64,${data.qr_code}`;
        document.getElementById('qrcode').style.display = 'block';

        // ✅ Exibe código PIX e botão de cópia
        const codigoPixElemento = document.getElementById('codigo-pix');
        const botaoCopiar = document.getElementById('botao-copiar');

        codigoPixElemento.value = data.qr_data;
        codigoPixElemento.style.display = 'block';
        botaoCopiar.style.display = 'inline-block';

        // Removido: referência a 'tempo-restante' inexistente
        document.getElementById('resultado').innerText = "";

        // ✅ Definir tempo limite de 3 minutos
        iniciarTemporizador(3, data.payment_id);

    } catch (error) {
        document.getElementById('resultado').innerText = `❌ Erro: ${error.message}`;
        console.error("Erro:", error);
    }
}


//#############################################################################
// ✅ Função para VERIFICAR PAGAMENTO com tempo limite
//############################################################################+

async function verificarPagamento(paymentId, intervaloTimer) {
    console.log(`🔍 Iniciando verificação do pagamento ID: ${paymentId}...`);

    const tempoLimite = 3 * 60 * 1000; // ⏳ Tempo limite de 3 minutos (180000 ms)
    const inicio = Date.now(); // 🕒 Captura o tempo inicial da verificação

    // 🔄 Inicia um intervalo para checar o status do pagamento a cada 10 segundos
    const intervaloPagamento = setInterval(async () => {
        const tempoDecorrido = Date.now() - inicio; // ⏱️ Calcula o tempo já passado

        // 🚨 Se o tempo limite for atingido, para a verificação e exibe aviso
        if (tempoDecorrido >= tempoLimite) {
            console.log("⚠️ Tempo limite atingido. Parando verificação.");
            clearInterval(intervaloPagamento); // 🛑 Para o intervalo de verificação
            clearInterval(intervaloTimer); // 🛑 Para o temporizador da barra de progresso
            ocultarElementos(); // 🔻 Esconde os elementos do QR Code
            document.getElementById('resultado').innerText = "";
            mostrarToast("Tempo limite excedido! Gere um novo QR Code."); // 🔔 Alerta o usuário
            return;
        }

        try {
            console.log(`🔄 Consultando status do pagamento (ID: ${paymentId})...`);
            
            // 📡 Requisição para o backend verificar o status do pagamento
            const response = await fetch(`${apiBaseUrl}/verificar-pagamento/${paymentId}`);

            if (!response.ok) {
                throw new Error(`Erro ao consultar pagamento (HTTP ${response.status})`);
            }

            const data = await response.json();
            console.log("📌 Resposta do servidor:", data);

            // 🚨 Se a resposta não contiver um status válido, lança erro
            if (!data || !data.status) {
                throw new Error("Resposta do servidor inválida ou sem status definido.");
            }

            // ✅ Caso o pagamento seja aprovado, para a verificação e oculta os elementos
            if (data.status === "approved") {
                console.log("✅ Pagamento aprovado! Encerrando verificação.");
                clearInterval(intervaloPagamento); // 🛑 Para o intervalo de verificação
                clearInterval(intervaloTimer); // 🛑 Para o temporizador da barra de progresso
                ocultarElementos(); // 🔻 Esconde os elementos do QR Code
                document.getElementById('resultado').innerText = "";
                mostrarToast("✅ Pagamento aprovado!"); // 🎉 Notifica o usuário
                return;
            }

        } catch (error) {
            console.error("❌ Erro ao verificar pagamento:", error.message);
        }
    }, 10000); // ⏳ Executa a cada 10 segundos
}

// ✅ Função que controla a barra de progresso e o tempo do pagamento
function iniciarTemporizador(minutos, paymentId) {
    let tempoRestante = minutos * 60; // Converte minutos em segundos
    const tempoTotal = tempoRestante; // Guarda o tempo total para cálculo da porcentagem
    const progressBar = document.getElementById("progress-bar");
    const progressContainer = progressBar ? progressBar.parentElement : null; // Verifica se o elemento existe

    // ✅ Exibe a barra de progresso se ela existir
    if (progressContainer) {
        progressContainer.style.display = "block";
    } else {
        console.error("⚠️ Barra de progresso não encontrada no DOM.");
        return;
    }

    const intervaloTimer = setInterval(() => {
        if (tempoRestante <= 0) {
            clearInterval(intervaloTimer);
            progressContainer.style.display = "none"; // Oculta a barra de progresso
            document.getElementById('resultado').innerText = "";
            mostrarToast("Tempo limite excedido!");
            return;
        }

        // Calcula a porcentagem do tempo restante
        const porcentagem = (tempoRestante / tempoTotal) * 100;
        progressBar.style.width = `${porcentagem}%`; // Atualiza a largura da barra
        progressBar.setAttribute("aria-valuenow", porcentagem.toFixed(0)); // Atualiza o atributo de acessibilidade

        tempoRestante--;

    }, 1000); // Atualiza a cada 1 segundo

    // ✅ Agora passamos o `intervaloTimer` corretamente para `verificarPagamento`
    verificarPagamento(paymentId, intervaloTimer);
}

// ✅ Função para ocultar elementos do QR Code após expiração ou pagamento
function ocultarElementos() {
    document.getElementById('qrcode-container').style.display = 'none';
    document.getElementById('qrcode').style.display = 'none';
    document.getElementById('codigo-pix').style.display = 'none';
    document.getElementById('botao-copiar').style.display = 'none';
    const tempoRestanteEl = document.getElementById('tempo-restante');
    if (tempoRestanteEl) {
        tempoRestanteEl.style.display = 'none';
    }}

// ✅ Formata números menores que 10 com "0"
function formatarTempo(valor) {
    return valor < 10 ? `0${valor}` : valor;
}

window.copiarCodigoPix = function() {
    const codigoPixElemento = document.getElementById('codigo-pix');
    const botaoCopiar = document.getElementById('botao-copiar');

    if (!codigoPixElemento.value) {
        mostrarToast("❌ Nenhum código PIX disponível para copiar.");
        return;
    }

    codigoPixElemento.select();
    navigator.clipboard.writeText(codigoPixElemento.value)
        .then(() => {
            botaoCopiar.innerText = "✅ Copiado!";
            botaoCopiar.style.background = "#218838";

            setTimeout(() => {
                botaoCopiar.innerText = "📋 Copiar Código PIX";
                botaoCopiar.style.background = "#28a745";
            }, 2000); // Reseta o texto após 2 segundos
        })
        .catch(err => console.error("Erro ao copiar código PIX:", err));
};


function mostrarToast(mensagem) {
    const toast = document.createElement("div");
    toast.innerText = mensagem;
    toast.style.position = "fixed";
    toast.style.top = "50%";
    toast.style.left = "50%";
    toast.style.transform = "translate(-50%, -50%)";
    toast.style.backgroundColor = "#28a745";
    toast.style.color = "white";
    toast.style.padding = "10px 20px";
    toast.style.borderRadius = "5px";
    toast.style.fontSize = "16px";
    toast.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 500); // Remove após fade-out
    }, 4000); // Exibe por 4 segundos
}


// ✅ atualiza a mensalidade referente
document.addEventListener("DOMContentLoaded", function () {
    const dataAtual = new Date();
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const mesAno = `${meses[dataAtual.getMonth()]}/${dataAtual.getFullYear()}`;
    
    document.getElementById("mes-referencia").textContent = mesAno;
});


// ✅ atualiza o valor da mensalidade
document.addEventListener("DOMContentLoaded", function () {
    const valorElement = document.getElementById("valor");
    let valorMensalidade = 450.00; // Definir valor real
    valorElement.innerHTML = `<sup>R$</sup> ${valorMensalidade.toFixed(2)}`;
});