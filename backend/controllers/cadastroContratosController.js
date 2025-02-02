const db = require('../db');

exports.cadastrarContrato = async (req, res) => {
  const {
    cliente_id,
    imovel_id,
    total_meses,
    valor_aluguel,
    dia_vencimento,
    data_inicio,
    data_fim
  } = req.body;

  // Validação
  if (
    !cliente_id ||
    !imovel_id ||
    !total_meses ||
    !valor_aluguel ||
    !dia_vencimento ||
    !data_inicio
  ) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  try {
    // Atualizar o status do imóvel para "Alugado" e associar cliente_id
    await db.query(
      `UPDATE imoveis SET status = 'alugado', cliente_id = ? WHERE id = ? AND status = 'disponivel'`,
      [cliente_id, imovel_id]
    );
    console.log("atualuzando status do imovel para alugado...");


    // Inserir o contrato
    const [result] = await db.query(
      `INSERT INTO contratos 
       (cliente_id, imovel_id, total_meses, valor_aluguel, dia_vencimento, data_inicio, data_fim) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente_id,
        imovel_id,
        total_meses,
        valor_aluguel,
        dia_vencimento,
        data_inicio,
        data_fim || null
      ]
    );
    console.log("inserindo contrato no banco...");


    const novoContratoId = result.insertId;

    // Gerar as mensalidades
    const mensalidades = [];
    const dataInicioDate = new Date(data_inicio);

    for (let i = 0; i < total_meses; i++) {
      const dataVencimento = new Date(
        dataInicioDate.getFullYear(),
        dataInicioDate.getMonth() + i,
        dia_vencimento
      );

      mensalidades.push([
        novoContratoId, // contrato_id
        valor_aluguel, // valor
        dataVencimento.toISOString().slice(0, 10), // data_vencimento
        "pendente", // status
        new Date(), // criado_em
        new Date(), // atualizado_em
      ]);
    }

    await db.query(
      `INSERT INTO mensalidades
       (contrato_id, valor, data_vencimento, status, criado_em, atualizado_em)
       VALUES ?`,
      [mensalidades]
    );
    console.log("inserindo mensalidades no banco...");


    res.status(201).json({
      message: 'Contrato cadastrado, imóvel atualizado e mensalidades geradas com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao cadastrar contrato:', error.message);
    res.status(500).json({ error: 'Erro ao cadastrar contrato.' });
  }
};