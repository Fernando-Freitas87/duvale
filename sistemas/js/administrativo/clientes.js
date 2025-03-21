async function gerarQRCode() {
    try {
        mostrarToast("🔄 Gerando QR Code...");

        const token = localStorage.getItem('authToken');
        if (!token || typeof token !== 'string' || token.trim() === '') {
            window.location.href = 'Index.html';
            return;
        }

        const valorTotal = await calcularValorTotalAtrasado(token);
        if (!valorTotal || isNaN(valorTotal)) {
            mostrarToast("❌ Valor da mensalidade inválido.");
            return;
        }

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