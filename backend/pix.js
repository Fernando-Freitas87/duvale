require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Rota para gerar QR Code Pix via Mercado Pago
app.post('/api/pix', async (req, res) => {
    try {
        const { valor, descricao } = req.body;

        if (!valor || isNaN(valor)) {
            return res.status(400).json({ error: "Valor inválido!" });
        }

        // Configurar o pagamento via Mercado Pago
        const resposta = await axios.post('https://api.mercadopago.com/v1/payments', {
            transaction_amount: parseFloat(valor),
            description: descricao || "Pagamento via Pix",
            payment_method_id: "pix",
            payer: {
                email: "cliente@email.com",
                identification: {
                    type: "CPF",
                    number: "12345678900"
                }
            }
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        // Retornar os dados do QR Code
        const dados = resposta.data;
        return res.json({
            qr_code: dados.point_of_interaction.transaction_data.qr_code_base64,
            qr_data: dados.point_of_interaction.transaction_data.qr_code,
            payment_id: dados.id
        });

    } catch (error) {
        console.error("Erro ao gerar QR Code:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Erro ao processar pagamento" });
    }
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`🔥 Servidor rodando na porta ${PORT}`);
});

//✅ Gerar QR Code via Node.js e API Externa
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