
// ---------------------------------------------------------------------
// clientesController.js
// ---------------------------------------------------------------------
// Controlador responsável por operações relacionadas aos clientes, como
// listar clientes, buscar informações do usuário autenticado e obter avisos.
// ---------------------------------------------------------------------
const db = require('../db'); // Certifique-se de que o caminho para o módulo está corretoconst logger = require('../utils/logger');

/**
 * Lista todos os clientes do tipo 'cliente', excluindo administradores.
 * Endpoint: GET /api/clientes
 */
exports.listarClientes = async (req, res) => {
  try {
    // Verifica se o usuário autenticado possui permissão (administrador).
    if (req.auth.type !== 'administrador') {
      return res.status(403).json({
        error: 'Permissão insuficiente. Acesso restrito a administradores.'
      });
    }

    // Consulta para selecionar apenas clientes do tipo 'cliente'.
    const query = `
      SELECT 
        id, 
        nome, 
        cpf, 
        telefone, 
        pin, 
        observacoes 
      FROM clientes
      WHERE tipo_usuario = 'cliente';
    `;
    const [rows] = await db.query(query);

    // Retorna mensagem caso nenhum cliente seja encontrado.
    if (rows.length === 0) {
      logger.warn('Nenhum cliente encontrado.');
      return res.status(404).json({ message: 'Nenhum cliente encontrado.' });
    }

    // Retorna os clientes encontrados.
    res.json(rows);
  } catch (error) {
    // Loga e retorna erro em caso de falha na consulta.
    logger.error(`Erro ao listar clientes: ${error.message}`);
    res.status(500).json({ error: 'Erro ao listar clientes.' });
  }
};

/**
 * Retorna informações específicas do usuário autenticado.
 * Endpoint: GET /api/usuario
 */
exports.getUserInfo = async (req, res) => {
  try {
    // Lógica para retornar informações do cliente autenticado.
    if (req.auth.type === 'cliente') {
      const userId = req.auth.id;
      const [rows] = await db.query(
        'SELECT nome, email, telefone FROM clientes WHERE id = ?',
        [userId]
      );

      // Verifica se o cliente foi encontrado.
      if (rows.length === 0) {
        logger.warn(`Cliente não encontrado para ID ${userId}.`);
        return res.status(404).json({ error: 'Cliente não encontrado.' });
      }

      // Retorna as informações do cliente.
      return res.json({
        nome: rows[0].nome,
        email: rows[0].email,
        telefone: rows[0].telefone,
      });
    }

    // Lógica para retornar informações do administrador autenticado.
    if (req.auth.type === 'administrador') {
      return res.json({
        id: req.auth.id,
        nome: req.auth.nome || 'Administrador',
        email: req.auth.email || 'admin@example.com',
      });
    }

    // Retorna erro caso o tipo de usuário não seja reconhecido.
    return res.status(400).json({ error: 'Tipo de usuário desconhecido.' });
  } catch (error) {
    // Loga e retorna erro em caso de falha na consulta.
    logger.error(`Erro ao buscar informações do usuário: ${error.message}`);
    res.status(500).json({ error: 'Erro ao buscar informações do usuário.' });
  }
};

/**
 * Busca avisos específicos do cliente autenticado.
 * Endpoint: GET /api/clientes/:id/avisos
 */
exports.getAvisos = async (req, res) => {
  try {
    // Verifica se o usuário autenticado é um cliente.
    if (req.auth.type !== 'cliente') {
      return res.status(403).json({
        error: 'Permissão insuficiente. Apenas clientes podem acessar seus avisos.'
      });
    }

    const userId = req.auth.id;

    // Consulta para obter os avisos do cliente autenticado.
    const [rows] = await db.query(
      'SELECT titulo, mensagem, data_aviso FROM avisos WHERE cliente_id = ? ORDER BY data_aviso DESC',
      [userId]
    );

    // Verifica se há avisos para o cliente.
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Nenhum aviso encontrado.' });
    }

    // Retorna os avisos encontrados.
    res.json(rows);
  } catch (error) {
    // Loga e retorna erro em caso de falha na consulta.
    logger.error(`Erro ao buscar avisos do cliente: ${error.message}`);
    res.status(500).json({ error: 'Erro ao buscar avisos do cliente.' });
  }
};
