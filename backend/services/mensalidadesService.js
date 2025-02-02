const db = require('../db');
const moment = require('moment'); // Para manipulação de datas

async function atualizarStatusMensalidades() {
    try {
        const dataAtual = moment().format('YYYY-MM-DD'); // Data atual no formato do banco

        // Atualizar registros com status "pendente" para "em atraso"
        const [resultAtraso] = await db.query(
            `UPDATE mensalidades 
             SET status = 'em atraso' 
             WHERE status = 'pendente' AND data_vencimento < ?`,
            [dataAtual]
        );

        console.log(`Mensalidades atualizadas para 'em atraso': ${resultAtraso.affectedRows}`);

        // (Opcional) Atualizar registros vencendo hoje para "pendente"
        const [resultPendente] = await db.query(
            `UPDATE mensalidades 
             SET status = 'pendente' 
             WHERE status != 'pago' AND data_vencimento >= ?`,
            [dataAtual]
        );

        console.log(`Mensalidades mantidas como 'pendente': ${resultPendente.affectedRows}`);
    } catch (error) {
        console.error("Erro ao atualizar status das mensalidades:", error.message);
    }
}

module.exports = { atualizarStatusMensalidades };
