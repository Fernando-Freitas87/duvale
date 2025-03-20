const apiBaseUrl = "https://duvale-production.up.railway.app";

//✅ Carregar nome e saudação do usuário
async function carregarUsuario() {
    try {
        const respostaUsuario = await fetch(`${apiBaseUrl}/api/usuario`);
        if (!respostaUsuario.ok) throw new Error('Falha ao carregar usuário.');
 
        const dadosUsuario = await respostaUsuario.json();
        const nome = dadosUsuario.nome || "Usuário";
        document.getElementById('user-name').textContent = nome;
 
        exibirSaudacao(nome);
 
        const respostaMensalidade = await fetch(`${apiBaseUrl}/api/cliente/mensalidade?status=atraso`);
        if (!respostaMensalidade.ok) throw new Error('Falha ao carregar mensalidade.');
 
        const dadosMensalidade = await respostaMensalidade.json();
        const mesReferencia = new Date(dadosMensalidade.data_vencimento).toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
 
        document.getElementById('mes-referencia').textContent = mesReferencia;
        document.getElementById('subtotal').textContent = dadosMensalidade.subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        document.getElementById('desconto').textContent = dadosMensalidade.desconto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        document.getElementById('juros').textContent = dadosMensalidade.juros.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        document.getElementById('valor').textContent = dadosMensalidade.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
        mostrarToast("❌ Não foi possível carregar todos os dados necessários.");
    }
}

//✅ Exibir saudação personalizada
function exibirSaudacao(nome) {
    const hora = new Date().getHours();
    let saudacao;

    if (hora < 12) saudacao = "Bom dia";
    else if (hora < 18) saudacao = "Boa tarde";
    else saudacao = "Boa noite";

    document.getElementById('saudacao').textContent = `${saudacao}, ${nome}!`;
}

//✅ Gerar QR Code via Node.js e API Externa
async function gerarQRCode() {
    try {
        mostrarToast("🔄 Gerando QR Code...");
        
        const valorApi = await fetch('https://api.exemplo.com/valor-mensalidade');
        if (!valorApi.ok) throw new Error(`Falha ao buscar valor: ${valorApi.status}`);
        
        const { valor } = await valorApi.json();

        if (!valor || isNaN(valor)) {
            mostrarToast("❌ Valor da mensalidade inválido.");
            return;
        }

        const resposta = await fetch(`${apiBaseUrl}/gerar-qrcode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                valor: valor,
                descricao: "Mensalidade Aluguel"
            })
        });

        if (!resposta.ok) throw new Error(`Erro do servidor: ${resposta.status}`);

        const dados = await resposta.json();

        if (!dados.qr_code || !dados.qr_data || !dados.payment_id) {
            mostrarToast("❌ Erro ao gerar QR Code.");
            return;
        }

        exibirQRCode(dados);
        iniciarTemporizador(3, dados.payment_id);

    } catch (erro) {
        console.error("Erro:", erro);
        mostrarToast(`❌ ${erro.message}`);
    }
}

//✅ Exibir QR Code no HTML
function exibirQRCode({ qr_code, qr_data }) {
    document.getElementById('qrcode-container').style.display = 'block';
    document.getElementById('qrcode').src = `data:image/png;base64,${qr_code}`;
    document.getElementById('codigo-pix').value = qr_data;
    document.getElementById('codigo-pix').style.display = 'block';
    document.getElementById('botao-copiar').style.display = 'inline-block';
}

//✅ Verificar pagamento
async function verificarPagamento(paymentId, intervaloTimer) {
    const inicio = Date.now();
    const tempoLimite = 3 * 60 * 1000;

    const checarIntervalo = setInterval(async () => {
        if (Date.now() - inicio >= tempoLimite) {
            clearInterval(checarIntervalo);
            clearInterval(intervaloTimer);
            ocultarElementos();
            mostrarToast("⏰ Tempo limite atingido. Gere outro QR Code.");
            return;
        }

        try {
            const resposta = await fetch(`${apiBaseUrl}/verificar-pagamento/${paymentId}`);
            if (!resposta.ok) throw new Error(`Erro na verificação: ${resposta.status}`);

            const dados = await resposta.json();

            if (dados.status === 'approved') {
                clearInterval(checarIntervalo);
                clearInterval(intervaloTimer);
                ocultarElementos();
                mostrarToast("✅ Pagamento aprovado com sucesso!");
            }
        } catch (erro) {
            console.error("Erro:", erro);
        }
    }, 10000);
}

//✅ Temporizador com barra de progresso
function iniciarTemporizador(minutos, paymentId) {
    let tempoRestante = minutos * 60;
    const tempoTotal = tempoRestante;

    const progressBar = document.getElementById("progress-bar");
    const progressContainer = progressBar.parentElement;
    progressContainer.style.display = "block";

    const intervaloTimer = setInterval(() => {
        if (tempoRestante <= 0) {
            clearInterval(intervaloTimer);
            progressContainer.style.display = "none";
            return;
        }

        const porcentagem = (tempoRestante / tempoTotal) * 100;
        progressBar.style.width = `${porcentagem}%`;

        tempoRestante--;
    }, 1000);

    verificarPagamento(paymentId, intervaloTimer);
}

//✅ Copiar código PIX
function copiarCodigoPix() {
    const codigoPix = document.getElementById('codigo-pix').value;

    navigator.clipboard.writeText(codigoPix)
        .then(() => mostrarToast("📋 Código PIX copiado!"))
        .catch(err => mostrarToast("❌ Falha ao copiar código PIX."));
}

//✅ Mostrar notificações (toast)
function mostrarToast(msg) {
    const toast = document.createElement("div");
    toast.textContent = msg;
    toast.style.cssText = `
        position:fixed; top:20px; left:50%; transform:translateX(-50%);
        background-color:#333; color:#fff; padding:10px 20px;
        border-radius:5px; box-shadow:0 3px 5px rgba(0,0,0,0.3); z-index:9999;
        opacity:0; transition:opacity 0.5s;
    `;
    document.body.appendChild(toast);

    setTimeout(() => toast.style.opacity = 1, 100);
    setTimeout(() => {
        toast.style.opacity = 0;
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

//✅ Ocultar elementos após conclusão ou falha
function ocultarElementos() {
    document.getElementById('qrcode-container').style.display = 'none';
    document.getElementById('botao-copiar').style.display = 'none';
    document.getElementById('codigo-pix').style.display = 'none';
}

//✅ Inicializa tudo ao carregar a página
document.addEventListener('DOMContentLoaded', carregarUsuario);