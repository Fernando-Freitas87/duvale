const db = require('../db');
const logger = require('../utils/logger');

exports.cadastrarCliente = async (req, res) => {
  const {
    nome,
    cpf,
    telefone,
    pin,
    tipo_usuario = 'cliente',
    observacoes,
    nacionalidade,
    data_nascimento,
    documento_identidade,
    numero_documento_identidade,
  } = req.body;

  // Validação básica
  if (!nome || !cpf || !telefone || !pin || !nacionalidade || !data_nascimento || !documento_identidade || !numero_documento_identidade) {
    return res.status(400).json({
      error: 'Todos os campos obrigatórios devem ser preenchidos.'
    });
  }

  try {
    // Inserção no banco
    const [result] = await db.query(
      `INSERT INTO clientes 
       (nome, cpf, telefone, pin, tipo_usuario, observacoes, nacionalidade, data_nascimento, documento_identidade, numero_documento_identidade) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        cpf,
        telefone,
        pin,
        tipo_usuario,
        observacoes,
        nacionalidade,
        data_nascimento,
        documento_identidade,
        numero_documento_identidade,
      ]
    );

    res.status(201).json({
      message: 'Cliente cadastrado com sucesso!',
      id: result.insertId,
    });
  } catch (error) {
    logger.error('Erro ao cadastrar cliente:', error.message);
    res.status(500).json({ error: 'Erro ao cadastrar cliente.' });
  }
};