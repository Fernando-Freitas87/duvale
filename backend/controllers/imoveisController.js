//controlador para gerenciar imoveis 
// backend/controllers/imoveisController.js

const db = require('../db');

/**
 * Lista todos os imóveis do banco.
 * Rota GET /api/imoveis
 */
exports.listarImoveis = async (req, res) => {
  try {
    // Obtém os parâmetros de paginação (se não fornecidos, define valores padrão)
    let { page = 1, limit = 10 } = req.query; 
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit; // Cálculo do deslocamento

    // Consulta SQL com LIMIT e OFFSET para paginação
    const [rows] = await db.query(`
      SELECT 
        id,
        descricao,
        endereco,
        status,
        enel,
        cagece,
        tipo  -- Novo campo
      FROM imoveis
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // Consulta para contar o total de registros
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM imoveis`);

    // Retorna os imóveis junto com informações de paginação
    res.json({
      imoveis: rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Erro ao listar imóveis:', error.message);
    res.status(500).json({ error: 'Erro ao buscar imóveis.' });
  }
};

/**
 * (Opcional) Cria um novo imóvel.
 * Rota POST /api/imoveis
 */
/**
 * Cria um novo imóvel.
 * Rota POST /api/imoveis
 */
exports.criarImovel = async (req, res) => {
  try {
    const { descricao, endereco, status, enel, cagece, tipo } = req.body;

    if (!descricao || !endereco) {
      return res.status(400).json({ error: 'Informe ao menos descrição e endereço do imóvel.' });
    }

    const [result] = await db.query(`
      INSERT INTO imoveis (descricao, endereco, status, enel, cagece, tipo)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [descricao, endereco, status || 'disponível', enel || '', cagece || '', tipo || 'residencial']);

    res.status(201).json({ 
      message: 'Imóvel criado com sucesso!',
      insertId: result.insertId
    });
  } catch (error) {
    console.error('Erro ao criar imóvel:', error.message);
    res.status(500).json({ error: 'Erro ao criar imóvel.' });
  }
};

/**
 * (Opcional) Atualiza um imóvel existente pelo ID.
 * Rota PUT /api/imoveis/:id
 */
exports.atualizarImovel = async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, endereco, status, enel, cagece, tipo } = req.body;

    if (!["residencial", "comercial"].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de imóvel inválido. Escolha entre "residencial" ou "comercial".' });
    }

    const [result] = await db.query(`
      UPDATE imoveis
      SET descricao = ?, 
          endereco = ?, 
          status = ?, 
          enel = ?, 
          cagece = ?, 
          tipo = ?
      WHERE id = ?
    `, [descricao, endereco, status, enel, cagece, tipo, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Imóvel não encontrado.' });
    }

    res.json({ message: 'Imóvel atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar imóvel:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar imóvel.' });
  }
};

/**
 * (Opcional) Deleta um imóvel existente pelo ID.
 * Rota DELETE /api/imoveis/:id
 */
exports.deletarImovel = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(`
      DELETE FROM imoveis
      WHERE id = ?
    `, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Imóvel não encontrado.' });
    }

    res.json({ message: 'Imóvel removido com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar imóvel:', error.message);
    res.status(500).json({ error: 'Erro ao remover imóvel.' });
  }
};