/********************************************************
 * Controller de Cadastro de Imóveis
 * Responsável por inserir e listar imóveis no banco
 ********************************************************/
const db = require('../db');

/**
 * Cadastra um novo imóvel na tabela "imoveis"
 */
exports.cadastrarImovel = async (req, res) => {
  // Desestrutura os campos recebidos no body, incluindo "enel" e "cagece"
  const { descricao, endereco, status, tipo, enel, cagece } = req.body;

  // Verifica se campos essenciais (descricao, endereco, status, tipo) foram informados
  if (!descricao || !endereco || !status || !tipo) {
    return res.status(400).json({ error: 'Dados insuficientes para cadastrar imóvel.' });
  }

  try {
    // Insere na tabela, incluindo enel e cagece com valores vazios caso venham undefined
    await db.query(
      `INSERT INTO imoveis (descricao, endereco, status, tipo, enel, cagece)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [descricao, endereco, status, tipo, enel || '', cagece || '']
    );
    return res.status(201).json({ message: 'Imóvel cadastrado com sucesso!' });
  } catch (error) {
    console.error('Erro ao cadastrar imóvel:', error.message);
    return res.status(500).json({ error: 'Erro ao cadastrar imóvel.' });
  }
};

/**
 * Lista somente os imóveis que estão com 'status = disponivel'
 * e não aparecem na tabela de contratos
 */
exports.listarDisponiveis = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM imoveis
      WHERE status = 'disponivel'
        AND id NOT IN (SELECT imovel_id FROM contratos)
    `);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Nenhum imóvel disponível.' });
    }

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar imóveis disponíveis:', error.message);
    return res.status(500).json({ error: 'Erro ao buscar imóveis disponíveis.' });
  }
};