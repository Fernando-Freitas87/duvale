require('dotenv').config();
const express = require('express');
const axios = require('axios');
const router = express.Router();


// Rota para gerar QR Code Pix via Mercado Pago
router.post('/', async (req, res) => {

    try {
        console.log("🛠️ Corpo da requisição recebido:", req.body);

        const { valor, descricao } = req.body;

        if (!valor || isNaN(valor)) {
            console.error("❌ Erro: Valor inválido recebido:", valor);
            return res.status(400).json({ error: "Valor inválido!" });
        }

        console.log(`✅ Processando pagamento: Valor: R$ ${valor}, Descrição: ${descricao}`);

        const resposta = await axios.post('https://api.mercadopago.com/v1/payments', {
            transaction_amount: parseFloat(valor),
            description: descricao || "Mensalidade de Aluguel - DuVale",
            payment_method_id: "pix",
            statement_descriptor: "DUVALE ALUGUEL",
            payer: {
                email: "grupoesilveira@gmail.com",
                first_name: "Fernando",
                last_name: "Freitas",
                identification: {
                    type: "CPF",
                    number: "01973165309"
                },
                address: {
                    zip_code: "62595-000",
                    street_name: "Rua do Contrato",
                    street_number: "100",
                    neighborhood: "Centro",
                    city: "Cruz",
                    federal_unit: "CE"
                }
            },
            metadata: {
                origem: "mensalidade-contrato",
                contrato_id: "EXEMPLO1234",
                vencimento: new Date().toISOString().split("T")[0]
            },
            external_reference: `mensalidade-${Date.now()}`,
            notification_url: "https://setta.dev.br/notificacao-pagamento"
        },
         
        {
            headers: {
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': `${Date.now()}-${Math.random()}`
            }
        });

        console.log("🔄 Resposta da API do Mercado Pago:", resposta.data);

        if (!resposta.data || !resposta.data.point_of_interaction) {
            throw new Error("Erro na resposta do Mercado Pago: Estrutura inesperada.");
        }

        console.log("✅ QR Code gerado com sucesso:", resposta.data.point_of_interaction.transaction_data.qr_code);

        return res.json({
            qr_code: resposta.data.point_of_interaction.transaction_data.qr_code_base64 || null,
            qr_data: resposta.data.point_of_interaction.transaction_data.qr_code || null,
            payment_id: resposta.data.id
        });

    } catch (error) {
        console.error("❌ Erro ao gerar QR Code:", error.response ? error.response.data : error.message);
        
        let mensagemErro = "Erro ao processar pagamento";
        if (error.response) {
            mensagemErro = `Erro ${error.response.status}: ${JSON.stringify(error.response.data)}`;
        }

        res.status(500).json({ error: mensagemErro });
    }
});

// Rota de teste
router.get('/test', (req, res) => {
    res.send("🔥 API PIX RODANDO!");
});

module.exports = router;
