const apiBaseUrl = "https://duvale-production.up.railway.app"; 

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

        if (!data || !data.qr_code || !data.payment_id) {
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