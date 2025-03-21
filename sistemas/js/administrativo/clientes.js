const apiBaseUrl = "https://duvale-production.up.railway.app";

async function obterClienteId(token) {
    try {
        const respostaUsuario = await fetch(`${apiBaseUrl}/api/usuario`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!respostaUsuario.ok) throw new Error('Erro ao buscar ID do cliente.');

        const dadosUsuario = await respostaUsuario.json();
        return dadosUsuario.id || null;  // Retorna apenas o ID do cliente

    } catch (erro) {
        console.error("Erro ao obter ID do cliente:", erro);
        return null;
    }
}

function calcularJurosEMulta(valorMensalidade, diasAtraso) {
    valorMensalidade = parseFloat(valorMensalidade) || 0; // Garantir que seja um número
    const multa = valorMensalidade * 0.02;
    const jurosDiarios = valorMensalidade * 0.00033;
    const juros = jurosDiarios * diasAtraso;

    return {
        multa,
        juros,
        valorTotal: valorMensalidade + multa + juros
    };
}

async function calcularValorTotalAtrasado(token) {
    try {
        const resposta = await fetch(`${apiBaseUrl}/api/cliente/mensalidades?status=atraso`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!resposta.ok) throw new Error('Falha ao carregar mensalidades atrasadas.');

        const respostaJson = await resposta.json();
        const mensalidades = Array.isArray(respostaJson.mensalidades) ? respostaJson.mensalidades : [];

        let valorTotal = 0;

        mensalidades.forEach(mensalidade => {
            const valor = parseFloat(mensalidade.valor) || 0;
            const dataVencimento = new Date(mensalidade.data_vencimento);
            const hoje = new Date();
            const diasAtraso = Math.max(Math.ceil((hoje - dataVencimento) / (1000 * 60 * 60 * 24)), 0);

            const { valorTotal: valorComJurosEMulta } = calcularJurosEMulta(valor, diasAtraso);

            valorTotal += valorComJurosEMulta;
        });

        return valorTotal;

    } catch (erro) {
        console.error("Erro ao calcular total atrasado:", erro);
        mostrarToast("❌ Erro ao calcular mensalidades atrasadas.");
        return 0;
    }
}

async function carregarUsuario() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = 'sistemas/Index.html';
            return;
        }

        const clienteId = await obterClienteId(token);
        if (!clienteId) {
            console.error("ID do cliente não encontrado.");
            return;
        }

        const respostaMensalidades = await fetch(`${apiBaseUrl}/api/mensalidades/cliente/${clienteId}/atrasadas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!respostaMensalidades.ok) throw new Error('Falha ao carregar mensalidades atrasadas.');

        const respostaJson = await respostaMensalidades.json();
        const lista = Array.isArray(respostaJson.mensalidades) ? respostaJson.mensalidades : [];

        if (!lista.length) {
            console.warn("⚠️ Nenhuma mensalidade atrasada encontrada.");
        }

        let subtotal = 0;
        let totalCorrigido = 0;
        const datas = [];

        lista.forEach(mensalidade => {
            const valor = parseFloat(mensalidade.valor) || 0;
            const dataVenc = new Date(mensalidade.data_vencimento);
            datas.push(dataVenc);

            subtotal += valor;

            const hoje = new Date();
            const diasAtraso = Math.max(Math.ceil((hoje - dataVenc) / (1000 * 60 * 60 * 24)), 0);

            const { valorTotal } = calcularJurosEMulta(valor, diasAtraso);
            totalCorrigido += valorTotal;
        });

        let referencia = "Nenhuma mensalidade em atraso";
        if (datas.length > 0) {
            datas.sort((a, b) => a - b);
            const inicio = datas[0].toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
            const fim = datas[datas.length - 1].toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
            referencia = inicio === fim ? inicio : `${inicio} até ${fim}`;
        }

        const respostaUsuario = await fetch(`${apiBaseUrl}/api/usuario`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!respostaUsuario.ok) {
            window.location.href = '/Index.html';
            return;
        }

        const dadosUsuario = await respostaUsuario.json();
        const nome = dadosUsuario.nome || "Usuário"; // Definir nome antes de usar
        document.getElementById('user-name').textContent = nome.split(' ').slice(0,2).join(' ');

        document.getElementById('mes-referencia').textContent = referencia;
        document.getElementById('subtotal').textContent = Math.round(subtotal).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        document.getElementById('juros').textContent = Math.round(totalCorrigido - subtotal).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        document.getElementById('valor').textContent = Math.round(totalCorrigido).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
        mostrarToast("❌ Não foi possível carregar todos os dados necessários.");
    }
}

//✅ Exibir saudação personalizada
function exibirSaudacao(nome) {
    const hora = new Date().getHours();
    let saudacao;

    if (hora < 12) saudacao = "BOM DIA";
    else if (hora < 18) saudacao = "BOA TARDE";
    else saudacao = "BOA NOITE";

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

// Função simples para logout
function logout() {
    localStorage.removeItem('authToken');
    window.location.href = 'Index.html';
}

async function carregarMensalidadesCliente(token) {
    try {
        const clienteId = await obterClienteId(token);
        if (!clienteId) {
            console.error("ID do cliente não encontrado.");
            return;
        }

        const respostaMensalidades = await fetch(`${apiBaseUrl}/api/cliente/${clienteId}/atrasadas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!respostaMensalidades.ok) throw new Error('Erro ao carregar mensalidades atrasadas.');

        const lista = await respostaMensalidades.json();
        console.log("Mensalidades atrasadas:", lista);

    } catch (erro) {
        console.error("Erro ao carregar mensalidades:", erro);
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