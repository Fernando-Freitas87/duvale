const db = require("../db"); // arquivo de conexão do banco de dados

/**
 * Retorna dados básicos do cliente para popular a tela (mensalidade, contrato, imóvel, etc.).
 * É apenas um EXEMPLO: adapte para corresponder às suas tabelas e relacionamentos.
 */
async function getDadosBasicosCliente(req, res) {
  try {
    // Exemplo: obtém o 'clienteId' do token (caso use um middleware de autenticação).
    // Se você armazena no token, ou se vem em req.params, etc., ajuste conforme sua lógica.
    const clienteId = req.userId; 
    if (!clienteId) {
      return res.status(400).json({ error: "Cliente não identificado." });
    }

    // 1) Busca o contrato do cliente
    //    Supondo que exista uma tabela 'contratos' com campos:
    //    - id, cliente_id, data_inicio, data_fim, valor_mensal, ...
    const [contratos] = await db.query(`
      SELECT id, data_inicio, data_fim, valor_mensal
      FROM contratos
      WHERE cliente_id = ?
      LIMIT 1
    `, [clienteId]);

    if (contratos.length === 0) {
      // Se não existir contrato, retorne algo básico
      return res.json({
        mensalidade: "R$ 0,00",
        contrato: {
          meses: null,
          vigencia: "--/--/---- - --/--/----",
          valorMensal: "R$ 0,00",
          valorTotal: "R$ 0,00",
        },
        imovel: null
      });
    }

    const contrato = contratos[0];

    // Calcula a diferença de meses (exemplo)
    // Ajuste se já existir um campo "meses" na tabela
    const dataInicio = new Date(contrato.data_inicio);
    const dataFim = new Date(contrato.data_fim);
    const mesesContrato = Math.max(
      0,
      (dataFim.getFullYear() - dataInicio.getFullYear()) * 12 +
        (dataFim.getMonth() - dataInicio.getMonth()) +
        1
    );

    // 2) Busca a mensalidade mais recente ou em aberto, usando o contrato_id
    //    Tabela 'mensalidades': id, contrato_id, valor, data_vencimento, status, ...
    const [mensalidades] = await db.query(`
      SELECT valor, data_vencimento, status
      FROM mensalidades
      WHERE contrato_id = ?
      ORDER BY data_vencimento DESC
      LIMIT 1
    `, [contrato.id]);

    let mensalidadeInfo = {
      valor: 0,
      data_vencimento: null,
      status: "pendente" // Ou algo padrão
    };

    if (mensalidades.length > 0) {
      mensalidadeInfo = mensalidades[0];
    }

    // 3) Busca algum imóvel associado ao cliente
    //    Tabela 'imoveis': id, cliente_id, descricao, endereco, status, tipo, ...
    const [imoveis] = await db.query(`
      SELECT id, descricao, endereco, status, tipo
      FROM imoveis
      WHERE cliente_id = ?
      LIMIT 1
    `, [clienteId]);

    let imovelInfo = null;
    if (imoveis.length > 0) {
      imovelInfo = {
        id: imoveis[0].id,
        descricao: imoveis[0].descricao,
        endereco: imoveis[0].endereco,
        status: imoveis[0].status,
        tipo: imoveis[0].tipo
      };
    }

    // Monta o objeto final para popular no front-end
    const resultado = {
      // Mensalidade formatada com “R$”
      mensalidade: `R$ ${mensalidadeInfo.valor?.toFixed(2) || "0,00"}`,

      // Dados do contrato
      contrato: {
        meses: mesesContrato, 
        vigencia: `${formatarDataBR(contrato.data_inicio)} - ${formatarDataBR(contrato.data_fim)}`,
        valorMensal: `R$ ${contrato.valor_mensal?.toFixed(2) || "0,00"}`,
        valorTotal: `R$ ${(contrato.valor_mensal * mesesContrato)?.toFixed(2) || "0,00"}`
      },

      // Dados do imóvel
      imovel: imovelInfo
    };

    res.status(200).json(resultado);

  } catch (error) {
    console.error("Erro ao obter dados básicos do cliente:", error);
    res.status(500).json({ error: "Erro ao buscar dados básicos." });
  }
}

/**
 * Função auxiliar para formatar data em DD/MM/AAAA
 */
function formatarDataBR(dataString) {
  if (!dataString) return "--/--/----";
  const data = new Date(dataString);
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

module.exports = {
  getDadosBasicosCliente
};