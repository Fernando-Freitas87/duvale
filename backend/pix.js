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
    console.log("📌 Rota /api/pix foi acessada"); // Log para depuração
    try {
        const { valor, descricao } = req.body;

        if (!valor || isNaN(valor)) {
            return res.status(400).json({ error: "Valor inválido!" });
        }

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
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!resposta.data || !resposta.data.point_of_interaction) {
            throw new Error("Erro na resposta do Mercado Pago: Estrutura inesperada.");
        }

        return res.json({
            qr_code: resposta.data.point_of_interaction.transaction_data.qr_code_base64 || null,
            qr_data: resposta.data.point_of_interaction.transaction_data.qr_code || null,
            payment_id: resposta.data.id
        });

    } catch (error) {
        console.error("Erro ao gerar QR Code:", error.response ? error.response.data : error.message);
        
        let mensagemErro = "Erro ao processar pagamento";
        if (error.response) {
            mensagemErro = `Erro ${error.response.status}: ${JSON.stringify(error.response.data)}`;
        }

        res.status(500).json({ error: mensagemErro });
    }
});

// Rota de teste
app.get('/test', (req, res) => {
    res.send("🔥 API PIX RODANDO!");
});

// ✅ Webhook para verificar status de pagamento no Mercado Pago
app.post('/api/webhook', async (req, res) => {
    try {
        const { action, data } = req.body;

        if (action !== "payment.created" && action !== "payment.updated") {
            return res.status(200).json({ message: "Evento ignorado" });
        }

        const paymentId = data.id;

        // Consulta o status do pagamento no Mercado Pago
        const resposta = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
            }
        });

        const status = resposta.data.status;

        if (status === "approved") {
            console.log(`✅ Pagamento ${paymentId} aprovado!`);
        } else {
            console.log(`🔄 Pagamento ${paymentId} está no status: ${status}`);
        }

        return res.status(200).json({ message: "Webhook processado com sucesso" });

    } catch (error) {
        console.error("Erro ao processar webhook:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Erro ao processar webhook" });
    }
});

// Listar todas as rotas carregadas
app._router.stack.forEach((route) => {
    if (route.route) {
        console.log(`✅ Rota carregada: ${route.route.path}`);
    }
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`🔥 Servidor rodando na porta ${PORT}`);
});

//✅ Gerar QR Code via Node.js e API Externa
const VALOR_FIXO_MENSALIDADE = 150.00; // Defina aqui o valor correto

function calcularValorTotalAtrasado() {
    const hoje = new Date();
    const dataVencimento = new Date("2024-03-01"); // Definir a data correta
    const diasAtraso = Math.max(Math.ceil((hoje - dataVencimento) / (1000 * 60 * 60 * 24)), 0);

    const { valorTotal } = calcularJurosEMulta(VALOR_FIXO_MENSALIDADE, diasAtraso);

    return valorTotal;
}

async function gerarQRCode() {
    try {
        mostrarToast("🔄 Gerando QR Code...");

        const token = localStorage.getItem('authToken');
        if (!token || typeof token !== 'string' || token.trim() === '') {
            window.location.href = 'Index.html';
            return;
        }

        const valorTotal = calcularValorTotalAtrasado(); // Agora calcula direto no front

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