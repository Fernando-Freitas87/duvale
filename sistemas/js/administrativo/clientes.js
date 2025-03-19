// ✅ Define a URL base da API do backend
const apiBaseUrl = "https://duvale-production.up.railway.app"; 

// ✅ Aguarda o carregamento da página antes de buscar o nome do cliente
document.addEventListener("DOMContentLoaded", () => {
    carregarNomeCliente();
});

/**
 * ✅ Função para carregar o nome do cliente da API e exibir no HTML.
 * - Obtém o token de autenticação do localStorage.
 * - Faz uma requisição à API `/api/cliente/dados`.
 * - Exibe o nome do cliente no elemento com id `nome-cliente`.
 */
async function carregarNomeCliente() {
    try {
        console.log("📡 Buscando nome do cliente...");
        const response = await fetch(`${apiBaseUrl}/api/cliente/dados`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem("authToken")}` }
        });
        if (!response.ok) throw new Error("Erro ao obter dados do cliente.");
        
        const data = await response.json();
        console.log("✅ Nome do cliente carregado:", data.nome);
        document.getElementById("nome-cliente").textContent = data.nome || "Usuário";
    } catch (error) {
        console.error("❌ Erro ao carregar nome do cliente:", error);
        document.getElementById("nome-cliente").textContent = "Erro ao carregar usuário";
    }
}

/**
 * ✅ Função para gerar um QR Code PIX via Mercado Pago.
 * - Obtém o valor da mensalidade a partir do HTML.
 * - Valida se o valor é válido.
 * - Faz uma requisição `POST` à API `/gerar-qrcode` com os dados do pagamento.
 * - Exibe o QR Code e o código PIX na interface.
 */
async function gerarQRCode() {
    console.log("Função gerarQRCode() foi chamada!");

    // Obtém o valor da mensalidade no elemento HTML
    const valorLabel = document.getElementById('valor');
    const valor = parseFloat(valorLabel.textContent.replace("R$", "").replace(",", ".").trim());

    // Valida se o valor informado é válido
    if (isNaN(valor) || valor <= 0) {
        document.getElementById('resultado').innerHTML = "❌ Informe um valor válido!";
        return;
    }

    try {
        // Faz a requisição para gerar o QR Code PIX
        const response = await fetch(`${apiBaseUrl}/gerar-qrcode`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("authToken")}` // Se precisar de autenticação
            },
            body: JSON.stringify({ valor: valor, descricao: "Mensalidade Aluguel" })
        });

        if (!response.ok) {
            throw new Error(`Erro no servidor (${response.status})`);
        }

        const data = await response.json();
        console.log("Resposta do servidor:", data);

        // Valida se a resposta contém os dados necessários
        if (!data || !data.qr_code || !data.payment_id) {
            document.getElementById('resultado').innerText = "❌ Erro ao gerar QR Code.";
            return;
        }

        // ✅ Exibe o QR Code na tela
        document.getElementById('qrcode-container').style.display = 'block';
        document.getElementById('qrcode').src = `data:image/png;base64,${data.qr_code}`;
        document.getElementById('qrcode').style.display = 'block';

        // ✅ Exibe o código PIX e o botão de cópia
        const codigoPixElemento = document.getElementById('codigo-pix');
        const botaoCopiar = document.getElementById('botao-copiar');

        codigoPixElemento.value = data.qr_data;
        codigoPixElemento.style.display = 'block';
        botaoCopiar.style.display = 'inline-block';

        // Remove qualquer mensagem de erro anterior
        document.getElementById('resultado').innerText = "";

        // ✅ Define um tempo limite de 3 minutos para o pagamento
        iniciarTemporizador(3, data.payment_id);

    } catch (error) {
        document.getElementById('resultado').innerText = `❌ Erro: ${error.message}`;
        console.error("Erro:", error);
    }
}

/**
 * ✅ Função para realizar logout e redirecionar para a página de login.
 */
function logout() {
    console.log("🔒 Realizando logout...");
    localStorage.removeItem("authToken"); // Remove o token de autenticação
    window.location.href = "Index.html"; // Redireciona para a página de login
}
