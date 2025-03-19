const mysql = require('mysql2/promise'); // 🔄 Substituído por conexão dinâmica
require('dotenv').config(); // ✅ Para carregar variáveis de ambiente

// ✅ Configuração do banco de dados
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 * Registra uma movimentação no caixa.
 */
exports.registrarTransacao = async (req, res) => {
  try {
    const { tipo, valor, descricao, usuario } = req.body;

    if (!tipo || !valor || !descricao || !usuario) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const conn = await pool.getConnection();
    await conn.execute(
      'INSERT INTO caixa (tipo, valor, descricao, usuario) VALUES (?, ?, ?, ?)',
      [tipo, valor, descricao, usuario]
    );
    conn.release();

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
    const conn = await pool.getConnection();

    // Calcula saldo
    const [[{ saldo }]] = await conn.execute(`
      SELECT SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END) AS saldo FROM caixa
    `);

    // Busca transações
    const [transacoes] = await conn.execute(`
      SELECT id, tipo, valor, descricao, usuario, data
      FROM caixa
      ORDER BY data DESC
    `);

    conn.release();

    res.json({ saldo: saldo || 0, transacoes });
  } catch (error) {
    console.error('Erro ao carregar caixa:', error.message);
    res.status(500).json({ error: 'Erro ao carregar caixa.' });
  }
};