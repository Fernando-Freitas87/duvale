const db = require('../db');
const logger = require('../utils/logger');

/**
 * Obtém resumo geral das mensalidades e contratos.
 * Inclui o total de imóveis, contratos ativos, valor a receber e valor em atraso,
 * além das listas de mensalidades em atraso e a vencer.
 */
exports.getResumo = async (req, res) => {
  try {
    // 1. Buscar totais para os cards
    const queries = {
      totalImoveis: `SELECT COUNT(*) AS totalImoveis FROM imoveis`,
      totalAlugados: `SELECT COUNT(*) AS totalAlugados FROM contratos WHERE data_fim > NOW()`,
      totalReceber: `SELECT SUM(valor) AS totalReceber FROM mensalidades WHERE status = 'pendente'`,
      totalAtraso: `SELECT SUM(valor) AS totalAtraso FROM mensalidades WHERE status = 'em atraso'`
    };

    const [[imoveis]] = await db.query(queries.totalImoveis);
    const [[contratos]] = await db.query(queries.totalAlugados);
    const [[receber]] = await db.query(queries.totalReceber);
    const [[atraso]] = await db.query(queries.totalAtraso);

    // 2. Buscar linhas em atraso
    const [emAtrasoRows] = await db.query(`
      SELECT 
        c.nome AS inquilino,
        i.descricao AS imovel,
        m.data_vencimento AS vencimento,
        m.valor,
        DATEDIFF(CURDATE(), m.data_vencimento) AS dias_atraso
      FROM mensalidades m
      JOIN contratos con ON m.contrato_id = con.id
      JOIN clientes c ON con.cliente_id = c.id
      JOIN imoveis i ON con.imovel_id = i.id
      WHERE m.status = 'em atraso'
      ORDER BY m.data_vencimento ASC
    `);

    // 3. Buscar linhas a vencer
    const [aVencerRows] = await db.query(`
      SELECT 
        c.nome AS inquilino,
        i.descricao AS imovel,
        m.data_vencimento AS vencimento,
        m.valor,
        DATEDIFF(m.data_vencimento, CURDATE()) AS dias_atraso
      FROM mensalidades m
      JOIN contratos con ON m.contrato_id = con.id
      JOIN clientes c ON con.cliente_id = c.id
      JOIN imoveis i ON con.imovel_id = i.id
      WHERE m.status = 'pendente'
      ORDER BY m.data_vencimento ASC
    `);

    res.json({
      totalImoveis: imoveis.totalImoveis || 0,
      totalAlugados: contratos.totalAlugados || 0,
      totalReceber: parseFloat(receber.totalReceber) || 0,
      totalAtraso: parseFloat(atraso.totalAtraso) || 0,
      emAtraso: emAtrasoRows || [],
      aVencer: aVencerRows || []
    });
  } catch (error) {
    console.error(`Erro ao carregar resumo: ${error.message}`);
    res.status(500).json({ error: 'Erro no servidor ao buscar resumo.' });
  }
};

// Atualiza o status de uma mensalidade

/**
 * Atualiza o status de uma mensalidade e registra a entrada no caixa se necessário.
 */
exports.atualizarStatusMensalidade = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "O campo 'status' é obrigatório." });
    }

    // Busca o valor, imóvel e data de vencimento da mensalidade
    const [[mensalidade]] = await db.query(
      `SELECT 
         m.valor, 
         i.descricao AS imovel, 
         DATE_FORMAT(m.data_vencimento, '%d/%m/%Y') AS data_vencimento 
       FROM mensalidades m
       JOIN contratos c ON m.contrato_id = c.id
       JOIN imoveis i ON c.imovel_id = i.id
       WHERE m.id = ?`, 
      [id]
    );

    if (!mensalidade) {
      return res.status(404).json({ error: "Mensalidade não encontrada." });
    }

    const [result] = await db.query("UPDATE mensalidades SET status = ? WHERE id = ?", [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Mensalidade não encontrada ou já atualizada." });
    }

    if (status === "em dias") {
      const usuario = req.usuario?.nome || "Sistema";

      await db.query("INSERT INTO caixa (tipo, valor, descricao, usuario) VALUES (?, ?, ?, ?)", [
        "entrada",
        mensalidade.valor,
        `Aluguel - Imóvel: ${mensalidade.imovel}, Vencimento: ${mensalidade.data_vencimento}`,
        usuario
      ]);
    }

    res.json({ message: "Status da mensalidade atualizado com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar status da mensalidade:", error.message);
    res.status(500).json({ error: "Erro ao atualizar status da mensalidade." });
  }
};

/**
 * Atualiza as mensalidades de um contrato.
 * Remove as mensalidades existentes e recalcula novas mensalidades com base nas alterações no contrato.
 * @route PUT /api/mensalidades/atualizar/:contratoId
 */
exports.atualizarMensalidades = async (req, res) => {
  try {
    const { contratoId } = req.params;
    const { totalMeses, valorAluguel, diaVencimento, dataInicio } = req.body;

    if (!contratoId || !totalMeses || !valorAluguel || !diaVencimento || !dataInicio) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    // Remove mensalidades existentes para o contrato
    await db.query("DELETE FROM mensalidades WHERE contrato_id = ?", [contratoId]);

    // Recalcula as mensalidades
    const mensalidades = [];
    const dataInicioDate = new Date(dataInicio);

    for (let i = 0; i < totalMeses; i++) {
      const vencimento = new Date(dataInicioDate);
      vencimento.setMonth(vencimento.getMonth() + i);
      vencimento.setDate(diaVencimento);

      mensalidades.push([
        contratoId,
        valorAluguel,
        vencimento.toISOString().split("T")[0], // Formato YYYY-MM-DD
        "pendente" // Status inicial das mensalidades
      ]);
    }

    // Insere as novas mensalidades
    await db.query(
      "INSERT INTO mensalidades (contrato_id, valor, data_vencimento, status) VALUES ?",
      [mensalidades]
    );

    logger.info(`Mensalidades atualizadas para o contrato ${contratoId}`);
    res.json({ message: "Mensalidades atualizadas com sucesso!" });
  } catch (error) {
    logger.error(`Erro ao atualizar mensalidades: ${error.message}`);
    res.status(500).json({ error: "Erro ao atualizar mensalidades." });
  }
};

/**
 * Obtém mensalidades em atraso paginadas (sem filtro de data).
 * A rota é /api/mensalidades/em-atraso?page=...&limit=...
 */
exports.getAtrasados = async (req, res) => {
  try {
    // Pega paginação da querystring, com defaults
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Condição fixa, sem filtro de data
    const conditions = "WHERE m.status = 'em atraso'";
    // Monta parâmetros para LIMIT/OFFSET
    const params = [parseInt(limit), parseInt(offset)];

    // Query principal
    const query = `
      SELECT 
        m.id AS id,
        c.nome AS cliente_nome,
        i.descricao AS imovel_descricao,
        DATE_FORMAT(m.data_vencimento, '%Y-%m-%d') AS data_vencimento,
        m.valor,
        DATEDIFF(CURDATE(), m.data_vencimento) AS dias_atraso
      FROM mensalidades m
      JOIN contratos con ON m.contrato_id = con.id
      JOIN clientes c ON con.cliente_id = c.id
      JOIN imoveis i ON con.imovel_id = i.id
      ${conditions}
      ORDER BY dias_atraso DESC
      LIMIT ? OFFSET ?;
    `;

    // Query para contar total de registros
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM mensalidades m
      JOIN contratos con ON m.contrato_id = con.id
      JOIN clientes c ON con.cliente_id = c.id
      JOIN imoveis i ON con.imovel_id = i.id
      ${conditions};
    `;

    // Executa as duas queries
    const [rows] = await db.query(query, params);
    // Para o countQuery, removemos os 2 últimos parâmetros (limit, offset) com slice(0, -2) caso
    // você tenha manipulado os params. Aqui, não há start/end antes, então é só:
    const [[{ total }]] = await db.query(countQuery);

    res.json({
      data: rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Erro ao buscar mensalidades em atraso:', error.message);
    res.status(500).json({ error: 'Erro ao buscar mensalidades em atraso.' });
  }
};

/**
 * Obtém mensalidades a vencer paginadas (sem filtro de data).
 * A rota é /api/mensalidades/a-vencer?page=...&limit=...
 */
exports.getAVencer = async (req, res) => {
  try {
    // Pega paginação da querystring, com defaults
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Condição fixa, sem filtro de data
    const conditions = "WHERE m.status = 'pendente' AND m.data_vencimento >= CURDATE()";
    // Parâmetros para LIMIT/OFFSET
    const params = [parseInt(limit), parseInt(offset)];

    // Query principal
    const query = `
      SELECT 
        m.id AS id,
        c.nome AS cliente_nome,
        i.descricao AS imovel_descricao,
        i.endereco,
        DATE_FORMAT(m.data_vencimento, '%Y-%m-%d') AS data_vencimento,
        m.valor,
        DATEDIFF(m.data_vencimento, CURDATE()) AS dias_atraso
      FROM mensalidades m
      JOIN contratos con ON m.contrato_id = con.id
      JOIN clientes c ON con.cliente_id = c.id
      JOIN imoveis i ON con.imovel_id = i.id
      ${conditions}
      ORDER BY m.data_vencimento ASC
      LIMIT ? OFFSET ?;
    `;

    // Query para contar total de registros
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM mensalidades m
      JOIN contratos con ON m.contrato_id = con.id
      JOIN clientes c ON con.cliente_id = c.id
      JOIN imoveis i ON con.imovel_id = i.id
      ${conditions};
    `;

    const [rows] = await db.query(query, params);
    const [[{ total }]] = await db.query(countQuery);

    res.json({
      data: rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Erro ao buscar mensalidades a vencer:', error.message);
    res.status(500).json({ error: 'Erro ao buscar mensalidades a vencer.' });
  }
};

/**
 * Obtém mensalidades com atraso superior a 60 dias e outros avisos gerenciais.
 * /api/mensalidades/avisos?page=...&limit=...
 */
exports.getAvisosGerenciais = async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const offset = (page - 1) * limit;

    // Query principal para avisos gerenciais
    const avisosQuery = `
      SELECT 
        c.id AS contrato_id,
        i.descricao AS imovel_descricao,
        i.endereco AS imovel_endereco,
        CASE
          WHEN c.data_inicio >= CURDATE() THEN 'Contrato novo'
          WHEN c.data_fim < CURDATE() THEN 'Contrato vencido'
          WHEN DATEDIFF(c.data_fim, CURDATE()) BETWEEN 0 AND 30 THEN 'Contrato vencendo em até 30 dias'
          WHEN (
            SELECT COUNT(*)
            FROM mensalidades m2
            WHERE m2.contrato_id = c.id
              AND m2.status = 'em atraso'
              AND DATEDIFF(CURDATE(), m2.data_vencimento) > 60
          ) > 0 THEN 'Atraso grave (mais de 60 dias)'
          ELSE 'Sem aviso'
        END AS aviso
      FROM contratos c
      JOIN imoveis i ON c.imovel_id = i.id
      WHERE
        c.data_inicio >= CURDATE()
        OR c.data_fim < CURDATE()
        OR DATEDIFF(c.data_fim, CURDATE()) BETWEEN 0 AND 30
        OR (
          SELECT COUNT(*)
          FROM mensalidades m2
          WHERE m2.contrato_id = c.id
            AND m2.status = 'em atraso'
            AND DATEDIFF(CURDATE(), m2.data_vencimento) > 60
        ) > 0
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM contratos c
      WHERE
        c.data_inicio >= CURDATE()
        OR c.data_fim < CURDATE()
        OR DATEDIFF(c.data_fim, CURDATE()) BETWEEN 0 AND 30
        OR (
          SELECT COUNT(*)
          FROM mensalidades m2
          WHERE m2.contrato_id = c.id
            AND m2.status = 'em atraso'
            AND DATEDIFF(CURDATE(), m2.data_vencimento) > 60
        ) > 0
    `;
    const [avisos] = await db.query(avisosQuery, [parseInt(limit), parseInt(offset)]);
    const [[{ total }]] = await db.query(countQuery);
    
    res.json({
      data: avisos,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    logger.error(`Erro ao buscar avisos gerenciais: ${error.message}`);
    res.status(500).json({ error: "Erro ao buscar avisos gerenciais." });
  }
};

/**
 * Obtém contratos próximos ao vencimento em até 30 dias.
 * /api/mensalidades/contratos-proximos
 */
exports.getContratosProximos = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id AS contrato_id,
        i.descricao AS imovel_descricao,
        i.endereco AS imovel_endereco,
        DATEDIFF(c.data_fim, CURDATE()) AS dias_para_vencimento
      FROM contratos c
      JOIN imoveis i ON c.imovel_id = i.id
      WHERE DATEDIFF(c.data_fim, CURDATE()) BETWEEN 0 AND 30
    `;
  
    const [contratos] = await db.query(query);
    res.json(contratos);
  } catch (error) {
    logger.error(`Erro ao buscar contratos próximos: ${error.message}`);
    res.status(500).json({ error: 'Erro ao buscar contratos próximos ao vencimento.' });
  }
};

/**
 * Rota: GET /api/mensalidades/cliente/:id
 * Retorna TODAS as mensalidades (pagas, pendentes, em atraso) de um cliente
 */
exports.getMensalidadesPorCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        m.id AS id,
        m.valor,
        m.data_vencimento,
        m.status,
        c.nome AS cliente_nome,
        i.descricao AS imovel
      FROM mensalidades m
      JOIN contratos con ON m.contrato_id = con.id
      JOIN clientes c ON con.cliente_id = c.id
      JOIN imoveis i ON con.imovel_id = i.id
      WHERE c.id = ?
      ORDER BY m.data_vencimento ASC
    `;

    const [rows] = await db.query(query, [id]);
    res.json({ mensalidades: rows });
  } catch (error) {
    console.error("Erro ao buscar mensalidades do cliente:", error.message);
    res.status(500).json({ error: "Erro ao buscar mensalidades do cliente." });
  }
};