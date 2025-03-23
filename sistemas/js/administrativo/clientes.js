const apiBaseUrl = "https://duvale-production.up.railway.app";

async function obterClienteId(token) {
    try {
        const respostaUsuario = await fetch(`${apiBaseUrl}/api/usuario`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (respostaUsuario.status === 403) {
            localStorage.removeItem('authToken');
            window.location.href = 'Index.html';
            return;
        }
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

async function carregarUsuario() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token || typeof token !== 'string' || token.trim() === '') {
            window.location.href = 'Index.html';
            return;
        }

        const clienteId = await obterClienteId(token);
        if (!clienteId) {
            console.error("ID do cliente não encontrado.");
            return;
        }

        const respostaMensalidades = await fetch(`${apiBaseUrl}/api/mensalidades/cliente/${clienteId}`, {
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

        lista.sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento));

        lista.forEach((mensalidade, index) => {
            const mensalidadePaga = mensalidade.status === 'pago';
            const valor = parseFloat(mensalidade.valor) || 0;
            const dataVenc = new Date(mensalidade.data_vencimento);
            const hoje = new Date();
            const diasAtraso = Math.ceil((hoje - dataVenc) / (1000 * 60 * 60 * 24));
 
            // if (diasAtraso <= 0) return; // Ignora mensalidades não vencidas
 
            datas.push(dataVenc);
            subtotal += valor;
 
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

        let nome = "Usuário"; // Definir um valor padrão

        try {
            const respostaUsuario = await fetch(`${apiBaseUrl}/api/usuario`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!respostaUsuario.ok) {
                window.location.href = '/Index.html';
                return;
            }

            const dadosUsuario = await respostaUsuario.json();
            nome = dadosUsuario.nome ? dadosUsuario.nome : "Usuário"; // Garantir que `nome` tenha um valor válido
        } catch (erro) {
            console.error("Erro ao obter nome do usuário:", erro);
        }

        const saudacao = gerarSaudacao();
        document.getElementById('saudacao').textContent = `${saudacao}, ${nome.split(' ').slice(0, 2).join(' ')}!`;

        const primeiroItemValor = lista.length && lista[0].status !== 'pago'
            ? calcularJurosEMulta(parseFloat(lista[0].valor), Math.ceil((new Date() - new Date(lista[0].data_vencimento)) / (1000 * 60 * 60 * 24))).valorTotal
            : parseFloat(lista[0]?.valor) || 0;

        document.getElementById('valor').textContent = primeiroItemValor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

        const indicatorsContainer = document.getElementById('carousel-indicators');
        const innerContainer = document.getElementById('carousel-inner');

        if (!indicatorsContainer || !innerContainer) {
            console.error("🚫 Elementos do carrossel não encontrados no DOM.");
            return;
        }

        lista.forEach((mensalidade, index) => {
            const mensalidadePaga = mensalidade.status === 'pago';
            const valor = parseFloat(mensalidade.valor) || 0;
            const dataVenc = new Date(mensalidade.data_vencimento);
            const hoje = new Date();
            const diasAtraso = Math.ceil((hoje - dataVenc) / (1000 * 60 * 60 * 24));
            let multa = 0, juros = 0, valorTotal = valor;
            let tipoTaxa = "Juros";
            
            if (diasAtraso > 0) {
                const resultado = calcularJurosEMulta(valor, diasAtraso);
                multa = resultado.multa;
                juros = resultado.juros;
                valorTotal = resultado.valorTotal;
            } else {
                tipoTaxa = "Desconto";
                const desconto = valor * 0.00033 * Math.abs(diasAtraso);
                juros = desconto;
                valorTotal = valor - desconto;
            }

            // Indicadores
            const botao = document.createElement('button');
            botao.setAttribute('type', 'button');
            botao.setAttribute('data-target', '#carouselExampleIndicators');
            botao.setAttribute('data-slide-to', index.toString());

            let statusClasse = '';
            let statusLabel = '';

            if (mensalidadePaga) {
                statusClasse = 'pago';
                statusLabel = '✅';
            } else if (diasAtraso > 0) {
                statusClasse = 'atrasado';
                statusLabel = ' ⚠️ ';
            } else {
                statusLabel = ' 📆 ';
                statusClasse = 'emdia';

            }

            botao.className = `${index === 0 ? 'active' : ''} btn-indicador ${statusClasse}`;
            const mesAno = dataVenc.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
            botao.textContent = `${mesAno}${statusLabel}`;

            indicatorsContainer.appendChild(botao);

            // Conteúdo da mensalidade
            const div = document.createElement('div');
            div.className = `carousel-item${index === 0 ? ' active' : ''}`;
            div.innerHTML = `
            <div class="cupom-estilo">
              <div class="title">DuVale</div>
              <hr>
              <div class="linha"><strong>Vencimento:</strong> ${dataVenc.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</div>
              <div class="linha"><strong>Valor:</strong> ${valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
              ${diasAtraso > 0 ? `<div class="linha"><strong>Multa:</strong> ${multa.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>` : ''}
              <div class="linha"><strong>${tipoTaxa}:</strong> ${juros.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
              <hr>
              <div class="linha"><strong>Total:</strong> ${valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
            </div>
          `;
            div.dataset.valorPix = valorTotal.toFixed(2);
            div.dataset.pago = mensalidadePaga;
            innerContainer.appendChild(div);
        });

        $('#carouselExampleIndicators').on('slid.bs.carousel', function (e) {
            const index = $(e.relatedTarget).index();
            const botoes = document.querySelectorAll('.btn-indicador');
            botoes.forEach((b, i) => b.classList.toggle('active', i === index));
            const ativo = botoes[index];
            ativo.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

            const itens = document.querySelectorAll('.carousel-item');
            const itemAtual = itens[index];
            const gerarBtn = document.getElementById('gerar-pix');

    if (itemAtual && gerarBtn) {
        const isPago = itemAtual.dataset.pago === "true";
        gerarBtn.disabled = isPago;
    }
    const valorSpan = document.getElementById('valor');
    if (valorSpan && itemAtual.dataset.valorPix) {
        const valorAtual = parseFloat(itemAtual.dataset.valorPix);
        if (!isNaN(valorAtual)) {
            valorSpan.textContent = valorAtual.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            });
        }
    }
        });
        

    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
        mostrarToast("❌ Não foi possível carregar todos os dados necessários.");
    }
}

function gerarSaudacao() {
    const hora = new Date().getHours();
    if (hora < 12) return "BOM DIA";
    if (hora < 18) return "BOA TARDE";
    return "BOA NOITE";
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

        const token = localStorage.getItem('authToken');
        if (!token || typeof token !== 'string' || token.trim() === '') {
            window.location.href = 'Index.html';
            return;
        }

        const itemAtivo = document.querySelector('.carousel-item.active');
        const valorTotal = itemAtivo ? parseFloat(itemAtivo.dataset.valorPix) : 0;
        if (!valorTotal || isNaN(valorTotal)) {
            mostrarToast("❌ Valor da mensalidade inválido.");
            return;
        }

        console.log("📌 Rota /api/pix foi acessada"); // Log de depuração inicial

        const resposta = await fetch(`${apiBaseUrl}/api/pix`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                valor: valorTotal.toFixed(2),
                descricao: "Mensalidade DuVale"
            })
        });

        console.log("🛠️ Corpo da requisição enviado:", {
            valor: valorTotal.toFixed(2),
            descricao: "Mensalidade DuVale"
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
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => carregarUsuario(), 300);
});