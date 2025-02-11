const db = require("../db");

/**
 * Retorna dados básicos do cliente (mensalidade, contrato, imóvel).
 */
async function getDadosBasicosCliente(req, res) {
  try {
    const clienteId = req.userId;

    if (!clienteId) {
      console.warn("Tentativa de acesso sem clienteId válido.");
      return res.status(401).json({ error: "Não autorizado. Cliente não identificado." });
    }

    // 1) Busca o contrato do cliente
    const [contratos] = await db.query(`
      SELECT id, data_inicio, data_fim, valor_mensal
      FROM contratos
      WHERE cliente_id = ?
      LIMIT 1
    `, [clienteId]);

    if (contratos.length === 0) {
      return res.json({
        mensalidade: "R$ 0,00",
        contrato: null,
        imovel: null
      });
    }

    const contrato = contratos[0];

    // 2) Cálculo da duração do contrato em meses
    const dataInicio = contrato.data_inicio ? new Date(contrato.data_inicio) : null;
    const dataFim = contrato.data_fim ? new Date(contrato.data_fim) : null;

    let mesesContrato = 0;
    if (dataInicio && dataFim && !isNaN(dataInicio) && !isNaN(dataFim)) {
      mesesContrato = Math.max(
        0,
        (dataFim.getFullYear() - dataInicio.getFullYear()) * 12 +
          (dataFim.getMonth() - dataInicio.getMonth()) +
          1
      );
    } else {
      console.warn(`Datas inválidas para contrato do cliente ${clienteId}`);
    }

    // 3) Busca a mensalidade mais recente
    const [mensalidades] = await db.query(`
      SELECT valor, data_vencimento, status
      FROM mensalidades
      WHERE contrato_id = ?
      ORDER BY data_vencimento DESC
      LIMIT 1
    `, [contrato.id]);

    const mensalidadeInfo = mensalidades.length > 0
      ? mensalidades[0]
      : { valor: 0, data_vencimento: null, status: "pendente" };

    // 4) Busca imóvel associado ao cliente
    const [imoveis] = await db.query(`
      SELECT id, descricao, endereco, status, tipo
      FROM imoveis
      WHERE cliente_id = ?
      LIMIT 1
    `, [clienteId]);

    const imovelInfo = imoveis.length > 0 ? imoveis[0] : null;

    // 5) Construção do objeto de resposta
    const valorMensal = contrato.valor_mensal || 0;
    const valorTotal = valorMensal * mesesContrato;

    const resultado = {
      mensalidade: `R$ ${mensalidadeInfo.valor?.toFixed(2) || "0,00"}`,
      contrato: contrato
        ? {
            meses: mesesContrato,
            vigencia: `${formatarDataBR(contrato.data_inicio)} - ${formatarDataBR(contrato.data_fim)}`,
            valorMensal: `R$ ${valorMensal.toFixed(2)}`,
            valorTotal: `R$ ${valorTotal.toFixed(2)}`
          }
        : null,
      imovel: imovelInfo || null
    };

    res.status(200).json(resultado);

  } catch (error) {
    console.error("Erro ao obter dados básicos do cliente:", error);
    res.status(500).json({ error: "Erro ao buscar dados básicos." });
  }
}



/**
 * Retorna o histórico de pagamentos do cliente.
 */
async function getHistoricoCliente(req, res) {
  try {
    const clienteId = req.userId;

    if (!clienteId) {
      console.warn("Tentativa de acesso sem clienteId válido.");
      return res.status(401).json({ error: "Não autorizado. Cliente não identificado." });
    }

    // 1) Busca o histórico de pagamentos do cliente
    const [historico] = await db.query(`
      SELECT 
        h.id, 
        h.descricao, 
        h.data_vencimento, 
        h.valor, 
        h.status, 
        i.descricao AS imovel
      FROM historico_pagamentos h
      LEFT JOIN imoveis i ON h.imovel_id = i.id
      WHERE h.cliente_id = ?
      ORDER BY h.data_vencimento DESC
    `, [clienteId]);

    if (historico.length === 0) {
      return res.status(404).json({ message: "Nenhum histórico encontrado." });
    }

    // 2) Formatação da resposta
    const historicoFormatado = historico.map(item => ({
      id: item.id,
      descricao: item.descricao,
      imovel: item.imovel || "Não especificado",
      vencimento: formatarDataBR(item.data_vencimento),
      valor: `R$ ${item.valor?.toFixed(2) || "0,00"}`,
      status: item.status
    }));

    res.status(200).json(historicoFormatado);

  } catch (error) {
    console.error("Erro ao obter histórico do cliente:", error);
    res.status(500).json({ error: "Erro ao buscar histórico do cliente." });
  }
}

/**
 * Função auxiliar para formatar data no padrão DD/MM/AAAA
 */
function formatarDataBR(dataString) {
  if (!dataString) return "--/--/----";
  const data = new Date(dataString);
  return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()}`;
}

/**
 * Formata datas no padrão DD/MM/AAAA
 */
function formatarDataBR(dataString) {
  if (!dataString) return "--/--/----";
  const data = new Date(dataString);
  return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()}`;
}

module.exports = {
  getDadosBasicosCliente,
  getHistoricoCliente
};