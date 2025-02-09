const db = require("../db"); // Assumindo que você tem uma configuração de banco conectada

// Mensalidades com atraso
exports.getMensalidadesAtraso = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT m.*, c.nome AS cliente_nome, i.descricao AS imovel_descricao,
                DATEDIFF(NOW(), m.data_vencimento) AS dias_atraso
            FROM mensalidades m
            INNER JOIN contratos ctr ON m.contrato_id = ctr.id
            INNER JOIN clientes c ON ctr.cliente_id = c.id
            INNER JOIN imoveis i ON ctr.imovel_id = i.id
            WHERE m.status = 'atraso'
              AND DATEDIFF(NOW(), m.data_vencimento) IN (5, 30, 60)
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar mensalidades em atraso." });
    }
};

// Contratos com vencimentos próximos
exports.getContratosVencimentos = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT ctr.*, c.nome AS cliente_nome, i.descricao AS imovel_descricao,
                DATEDIFF(ctr.data_fim, NOW()) AS dias_restantes
            FROM contratos ctr
            INNER JOIN clientes c ON ctr.cliente_id = c.id
            INNER JOIN imoveis i ON ctr.imovel_id = i.id
            WHERE DATEDIFF(ctr.data_fim, NOW()) IN (30, 5)
               OR DATEDIFF(ctr.data_fim, NOW()) < 0
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar contratos com vencimentos próximos." });
    }
};

// Adicionar novo contrato (notificação)
exports.addNovoContrato = async (req, res) => {
    try {
        const { cliente_id, imovel_id, total_meses, valor_aluguel, dia_vencimento, data_inicio, data_fim } = req.body;

        const [result] = await db.query(`
            INSERT INTO contratos (cliente_id, imovel_id, total_meses, valor_aluguel, dia_vencimento, data_inicio, data_fim, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'ativo')
        `, [cliente_id, imovel_id, total_meses, valor_aluguel, dia_vencimento, data_inicio, data_fim]);

        res.status(201).json({ id: result.insertId, message: "Contrato adicionado com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao adicionar contrato." });
    }
};

// Nova movimentação no caixa
exports.addMovimentacaoCaixa = async (req, res) => {
    try {
        const { tipo, valor, descricao, usuario } = req.body;

        const [result] = await db.query(`
            INSERT INTO caixa (tipo, valor, descricao, usuario)
            VALUES (?, ?, ?, ?)
        `, [tipo, valor, descricao, usuario]);

        res.status(201).json({ id: result.insertId, message: "Movimentação registrada com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao registrar movimentação no caixa." });
    }
};