const db = require('../db');

/**
 * Registra uma movimentação no caixa.
 */
exports.registrarTransacao = async (req, res) => {
  try {
    const { tipo, valor, descricao, usuario } = req.body;

    if (!tipo || !valor || !descricao || !usuario) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    await db.query(
      'INSERT INTO caixa (tipo, valor, descricao, usuario) VALUES (?, ?, ?, ?)',
      [tipo, valor, descricao, usuario]
    );

    res.status(201).json({ message: 'Transação registrada com sucesso!' });
  } catch (error) {
    console.error('Erro ao registrar transação:', error.message);
    res.status(500).json({ error: 'Erro ao registrar transação.' });
  }
};

/**
 * Carrega o saldo atual e o histórico de transações.
 */
exports.getCaixa = async (req, res) => {
  try {
    // Calcula saldo
    const [[{ saldo }]] = await db.query(`
      SELECT SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END) AS saldo FROM caixa
    `);

    // Busca transações
    const [transacoes] = await db.query(`
      SELECT id, tipo, valor, descricao, usuario, data
      FROM caixa
      ORDER BY data DESC
    `);

    res.json({ saldo: saldo || 0, transacoes });
  } catch (error) {
    console.error('Erro ao carregar caixa:', error.message);
    res.status(500).json({ error: 'Erro ao carregar caixa.' });
  }
};