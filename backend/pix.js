require('dotenv').config();
const express = require('express');
const axios = require('axios');
const router = express.Router();


// Rota para gerar QR Code Pix via Mercado Pago
router.post('/', async (req, res) => {

    try {
        console.log("🛠️ Corpo da requisição recebido:", req.body);

        const { valor, descricao, vencimento, user } = req.body;
        const contrato_id = req.body.contrato_id && req.body.contrato_id !== 'CONTRATO-NAO-DEFINIDO'
            ? req.body.contrato_id
            : (req.body?.user?.contrato_id || 'REF-122318');
        const [first_name, ...resto] = (user?.nome || "").split(" ");
        const last_name = resto.join(" ") || "Não Informado";

        if (!valor || isNaN(valor)) {
            console.error("❌ Erro: Valor inválido recebido:", valor);
            return res.status(400).json({ error: "Valor inválido!" });
        }

        console.log("✅ Processando pagamento com os seguintes dados:");
        console.log("Valor:", valor);
        console.log("Descrição:", descricao);
        console.log("Contrato ID:", contrato_id || req.body.contrato_id);
        console.log("Vencimento:", vencimento);
        console.log("Usuário:", user);

        const payload = {
          transaction_amount: parseFloat(valor),
          description: descricao || "Mensalidade de Aluguel",
          payment_method_id: "pix",
          notification_url: "https://setta.dev.br/notificacao-pagamento",
          payer: {
            email: user?.email || "email@indefinido.com",
            identification: {
              type: "CPF",
              number: user?.cpf || "27841534876"
            }
          },
          external_reference: `mensalidade-${contrato_id}-${vencimento}`
        };

        const headers = {
          'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `${Date.now()}-${Math.random()}`
        };

        const resposta = await axios.post('https://api.mercadopago.com/v1/payments', payload, { headers });

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

// Rota de notificação do Mercado Pago
router.post('/notificacao-pagamento', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type !== 'payment' || !data?.id) {
      return res.sendStatus(200); // Ignora se não for notificação de pagamento
    }

    const pagamentoId = data.id;

    const resposta = await axios.get(`https://api.mercadopago.com/v1/payments/${pagamentoId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
      }
    });

    const pagamento = resposta.data;

    if (pagamento.status === 'approved') {
      const contratoId = pagamento.metadata?.contrato_id;

      if (contratoId) {
        console.log(`✅ Pagamento aprovado para contrato ${contratoId}. Atualizando status no banco...`);
        const conexao = require('./db'); // Certifique-se de que o arquivo db.js exporta a conexão MySQL
        await conexao.query("UPDATE mensalidades SET status = 'pago' WHERE contrato_id = ?", [contratoId]);
      }
    }

    res.sendStatus(200);
  } catch (erro) {
    console.error("❌ Erro ao processar notificação de pagamento:", erro.message);
    res.sendStatus(500);
  }
});

// Rota de teste
router.get('/test', (req, res) => {
    res.send("🔥 API PIX RODANDO!");
});

module.exports = router;
