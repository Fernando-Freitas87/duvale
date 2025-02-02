// controllers/usuarioController.js
const db = require('../db');
const logger = require('../utils/logger');

exports.getUsuario = async (req, res) => {
  try {
    // Verifica se existe req.auth (definido pelo middleware authenticateToken)
    if (!req.auth) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const { id, type } = req.auth;
    if (!id || !type) {
      return res.status(400).json({ error: 'Dados do usuário ausentes no token.' });
    }

    // Exemplo: se tipo_usuario = 'cliente', busca dados na tabela clientes
    // Ajuste se houver tipo 'administrador' ou outra tabela de usuários
    if (type === 'cliente') {
      // Busca dados do cliente no banco
      const [rows] = await db.query(
        'SELECT nome, email, telefone FROM clientes WHERE id = ? LIMIT 1',
        [id]
      );
      if (rows.length === 0) {
        logger.warn(`Cliente não encontrado para ID ${id}.`);
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      const userRow = rows[0];
      return res.json({
        id,
        type,
        nome: userRow.nome || 'Usuário desconhecido',
        email: userRow.email || 'E-mail não informado',
        telefone: userRow.telefone || 'Telefone não informado',
      });
    }

    // Se for administrador, ajustar conforme necessidade:
    if (type === 'administrador') {
      // Exemplo simplificado: se administradores também estão na tabela clientes
      const [rows] = await db.query(
        'SELECT nome, email, telefone FROM clientes WHERE id = ? LIMIT 1',
        [id]
      );
      if (rows.length === 0) {
        logger.warn(`Administrador não encontrado para ID ${id}.`);
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      const adminRow = rows[0];
      return res.json({
        id,
        type,
        nome: adminRow.nome || 'Administrador',
        email: adminRow.email || 'admin@example.com',
        telefone: adminRow.telefone || '',
      });
    }

    // Caso haja outros tipos de usuário ou o type não seja reconhecido
    return res.status(400).json({
      error: 'Tipo de usuário não suportado ou desconhecido.',
    });

  } catch (err) {
    logger.error(`Erro ao buscar usuário: ${err.message}`);
    return res.status(500).json({ error: 'Erro interno ao buscar usuário.' });
  }
};