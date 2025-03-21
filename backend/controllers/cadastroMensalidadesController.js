const db = require('../db');

exports.gerarMensalidades = async (req, res) => {
    const { contrato_id, total_meses, valor_aluguel, dia_vencimento, data_inicio } = req.body;

    if (!contrato_id || !total_meses || !valor_aluguel || !dia_vencimento || !data_inicio) {
        return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    try {
        const mensalidades = [];
        let dataVencimento = new Date(data_inicio);

        for (let i = 0; i < total_meses; i++) {
            mensalidades.push([
                contrato_id,
                (new Date(dataVencimento)).toISOString().split('T')[0],
                valor_aluguel,
                'pendente',
            ]);
            dataVencimento.setMonth(dataVencimento.getMonth() + 1);
            dataVencimento.setDate(dia_vencimento);
        }

        await db.query(
            'INSERT INTO mensalidades (contrato_id, data_vencimento, valor, status) VALUES ?',
            [mensalidades]
        );

        res.status(201).json({ message: 'Mensalidades geradas com sucesso!' });
    } catch (error) {
        console.error('Erro ao gerar mensalidades:', error.message);
        res.status(500).json({ error: 'Erro ao gerar mensalidades.' });
    }
};

exports.getMensalidadesAtrasadasCliente = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: "ID do cliente é obrigatório." });
        }

        const [mensalidades] = await db.query(
            `SELECT 
                m.id,
                m.valor,
                m.data_vencimento,
                DATEDIFF(CURDATE(), m.data_vencimento) AS dias_atraso
            FROM mensalidades m
            JOIN contratos c ON m.contrato_id = c.id
            WHERE c.cliente_id = ? AND m.status = 'em atraso'
            ORDER BY m.data_vencimento ASC`, 
            [id]
        );

        if (mensalidades.length === 0) {
            return res.json({ message: "Nenhuma mensalidade em atraso.", mensalidades: [] });
        }

        res.json({ mensalidades });

    } catch (error) {
        console.error("Erro ao buscar mensalidades atrasadas:", error);
        res.status(500).json({ error: "Erro ao buscar mensalidades atrasadas." });
    }
};
