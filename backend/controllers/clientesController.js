// ---------------------------------------------------------------------
// clientesController.js
// ---------------------------------------------------------------------
// Controlador responsável por operações relacionadas aos clientes, como
// listar clientes, buscar informações de usuário autenticado e obter avisos.
// ---------------------------------------------------------------------

// Importa o banco de dados e o logger
const db = require('../db');       // Ajuste o caminho conforme necessário
const logger = require('../utils/logger'); // Ajuste o caminho conforme necessário

/**
 * Lista todos os clientes do tipo 'cliente' (exclui administradores).
 * Endpoint: GET /api/clientes
 *
 * Restrito a usuários administradores (req.auth.type === 'administrador').
 */
exports.listarClientes = async (req, res) => {
  try {
    // Verifica se o usuário autenticado possui permissão (administrador).
    if (req.auth.type !== 'administrador') {
      return res.status(403).json({
        error: 'Permissão insuficiente. Acesso restrito a administradores.',
      });
    }

    // Consulta para selecionar apenas usuários do tipo 'cliente'.
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

    // Se não houver registros, retorna mensagem apropriada.
    if (rows.length === 0) {
      logger.warn('Nenhum cliente encontrado.');
      return res.status(404).json({ message: 'Nenhum cliente encontrado.' });
    }

    // Retorna a lista de clientes encontrados.
    res.json(rows);
  } catch (error) {
    // Loga e retorna erro em caso de falha na consulta ou execução.
    logger.error(`Erro ao listar clientes: ${error.message}`);
    res.status(500).json({ error: 'Erro ao listar clientes.' });
  }
};

/**
 * (OPCIONAL) Obtém um cliente específico por ID.
 * Endpoint: GET /api/clientes/:id
 *
 * - Útil se o frontend estiver chamando /api/clientes/24, por exemplo.
 * - Ajuste a permissão conforme a regra de negócio (admin ou próprio cliente).
 */
exports.obterClientePorId = async (req, res) => {
  try {
    // Exemplo de permissão: somente administradores podem acessar qualquer cliente
    if (req.auth.type !== 'administrador') {
      return res.status(403).json({
        error: 'Permissão insuficiente. Acesso restrito a administradores.',
      });
    }

    // Extrai o ID do cliente do parâmetro de rota
    const { id } = req.params;

    // Busca o cliente no banco de dados
    const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [id]);

    // Caso não encontre o cliente, retorna mensagem apropriada
    if (!rows || rows.length === 0) {
      logger.warn(`Cliente não encontrado para ID ${id}.`);
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    // Retorna o cliente encontrado
    res.json(rows[0]);
  } catch (error) {
    // Loga e retorna erro em caso de falha na consulta ou execução
    logger.error(`Erro ao obter cliente por ID: ${error.message}`);
    res.status(500).json({ error: 'Erro ao obter cliente por ID.' });
  }
};

/**
 * Retorna informações específicas do usuário autenticado.
 * Endpoint: GET /api/usuario
 *
 * - Se for cliente, retorna informações do próprio cliente.
 * - Se for administrador, retorna informações de administrador.
 */
exports.getUserInfo = async (req, res) => {
  try {
    // Se o usuário autenticado for do tipo 'cliente'
    if (req.auth.type === 'cliente') {
      const userId = req.auth.id;
      const [rows] = await db.query(
        'SELECT nome, email, telefone FROM clientes WHERE id = ?',
        [userId]
      );

      // Verifica se o cliente foi encontrado
      if (rows.length === 0) {
        logger.warn(`Cliente não encontrado para ID ${userId}.`);
        return res.status(404).json({ error: 'Cliente não encontrado.' });
      }

      // Retorna as informações do cliente autenticado
      return res.json({
        nome: rows[0].nome,
        email: rows[0].email,
        telefone: rows[0].telefone,
      });
    }

    // Se o usuário autenticado for do tipo 'administrador'
    if (req.auth.type === 'administrador') {
      return res.json({
        id: req.auth.id,
        nome: req.auth.nome || 'Administrador',
        email: req.auth.email || 'admin@example.com',
      });
    }

    // Se o tipo de usuário não for reconhecido
    return res.status(400).json({ error: 'Tipo de usuário desconhecido.' });
  } catch (error) {
    logger.error(`Erro ao buscar informações do usuário: ${error.message}`);
    res.status(500).json({ error: 'Erro ao buscar informações do usuário.' });
  }
};

/**
 * Busca avisos específicos do cliente autenticado.
 * Endpoint: GET /api/clientes/:id/avisos
 *
 * - Neste caso, somente um cliente (req.auth.type === 'cliente')
 *   pode acessar seus próprios avisos.
 */
exports.getAvisos = async (req, res) => {
  try {
    // Verifica se o usuário autenticado é do tipo 'cliente'.
    if (req.auth.type !== 'cliente') {
      return res.status(403).json({
        error: 'Permissão insuficiente. Apenas clientes podem acessar seus avisos.',
      });
    }

    const userId = req.auth.id;

    // Consulta para obter os avisos do cliente autenticado
    const [rows] = await db.query(
      'SELECT titulo, mensagem, data_aviso FROM avisos WHERE cliente_id = ? ORDER BY data_aviso DESC',
      [userId]
    );

    // Se não houver avisos, retorna mensagem apropriada
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Nenhum aviso encontrado.' });
    }

    // Retorna a lista de avisos encontrados
    res.json(rows);
  } catch (error) {
    logger.error(`Erro ao buscar avisos do cliente: ${error.message}`);
    res.status(500).json({ error: 'Erro ao buscar avisos do cliente.' });
  }
};