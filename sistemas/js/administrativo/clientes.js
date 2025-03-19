//#############################################################################
// ✅ Função para GERAR QR CODE MERCADO PAGO
//#############################################################################
const apiBaseUrl = "https://duvale-production.up.railway.app"; // ou a URL correta da API
/**
 * Gera um QR Code PIX usando a API do Mercado Pago.
 * 
 * - Obtém o valor da mensalidade do elemento HTML.
 * - Envia uma requisição `POST` para `/gerar-qrcode` no backend.
 * - Exibe o QR Code gerado e o código PIX no frontend.
 */
async function gerarQRCode() {
    console.log("Função gerarQRCode() foi chamada!");

    // 🔍 Obtém o valor da mensalidade na interface
    const valorLabel = document.getElementById('valor');
    const valorResponse = await fetch('/api/mensalidade');
    const valorData = await valorResponse.json();
    const valor = parseFloat(valorData.valor.replace("R$", "").replace(",", ".").trim());

    // 🚨 Verifica se o valor é válido
    if (isNaN(valor) || valor <= 0) {
        document.getElementById('resultado').innerHTML = "❌ Informe um valor válido!";
        return;
    }

    try {
        // 📡 Faz a requisição ao backend para gerar o QR Code
        const response = await fetch(`${apiBaseUrl}/gerar-qrcode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem("authToken")}` },
            body: JSON.stringify({ valor: valor, descricao: "Mensalidade Aluguel" })
        });

        // 🚨 Verifica se a resposta do servidor é válida
        if (!response.ok) {
            throw new Error(`Erro no servidor (${response.status})`);
        }

        const data = await response.json();
        console.log("Resposta do servidor:", data);

        // 🚨 Garante que os dados necessários foram retornados
        if (!data || !data.qr_code || !data.qr_data || !data.payment_id) {
            document.getElementById('resultado').innerText = "❌ Erro ao gerar QR Code.";
            return;
        }

        // ✅ Exibe o QR Code gerado
        document.getElementById('qrcode-container').style.display = 'block';
        document.getElementById('qrcode').src = `data:image/png;base64,${data.qr_code}`;
        document.getElementById('qrcode').style.display = 'block';

        // ✅ Exibe código PIX e botão de cópia
        const codigoPixElemento = document.getElementById('codigo-pix');
        const botaoCopiar = document.getElementById('botao-copiar');

        codigoPixElemento.value = data.qr_data;
        codigoPixElemento.style.display = 'block';
        botaoCopiar.style.display = 'inline-block';

        // ✅ Define um tempo limite de 3 minutos para o pagamento
        iniciarTemporizador(3, data.payment_id);

    } catch (error) {
        document.getElementById('resultado').innerText = `❌ Erro: ${error.message}`;
        console.error("Erro:", error);
    }
}

//#############################################################################
// ✅ Função para carregar dados do cliente e da mensalidade
async function carregarDadosCliente() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn('Token de autenticação não encontrado.');
            return;
        }

        const response = await fetch(`${apiBaseUrl}/api/cliente/mensalidade`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            console.warn(`Erro ao carregar os dados do cliente: ${response.status}`);
            return;
        }

        const data = await response.json();
        document.getElementById("user-name").textContent = data.nome || "Usuário";
        document.getElementById("valor").innerHTML = `<sup>R$</sup> ${data.mensalidade.toFixed(2)}`;
    } catch (error) {
        console.error('Erro ao carregar dados do cliente:', error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await carregarDadosCliente();
    } catch (error) {
        console.error("Erro na inicialização:", error);
    }
});

//#############################################################################
// ✅ Função para VERIFICAR STATUS DO PAGAMENTO COM TEMPO LIMITE
//#############################################################################

/**
 * Verifica periodicamente o status do pagamento via API do Mercado Pago.
 * 
 * - Consulta o status do pagamento a cada 10 segundos.
 * - Para a verificação se o pagamento for aprovado ou o tempo limite for atingido.
 */
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