const db = require('../db'); // Conexão com o banco de dados

/**
 * Controlador para obter dados para os gráficos de mensalidades
 */
const getMensalidadesGraficos = async (req, res) => {
  try {
    // Consulta SQL para contar as mensalidades por status e mês
    const query = `
      SELECT 
        CASE 
          WHEN status = 'em_dia' THEN 'em_dia'
          WHEN status = 'atrasada' THEN 'atrasada'
          WHEN status = 'pendente' THEN 'pendente'
          ELSE 'outros'
        END AS status,
        MONTH(data_vencimento) AS mes,
        COUNT(*) AS quantidade
      FROM mensalidades
      WHERE data_vencimento BETWEEN DATE_ADD(NOW(), INTERVAL -1 MONTH) AND DATE_ADD(NOW(), INTERVAL 1 MONTH)
      GROUP BY status, mes
      ORDER BY mes, status;
    `;

    // Executa a consulta no banco
    const [rows] = await db.query(query);

    // Organiza os dados em um formato adequado para os gráficos
    const resultado = {
      anterior: { em_dia: 0, atrasadas: 0, pendentes: 0 },
      atual: { em_dia: 0, atrasadas: 0, pendentes: 0 },
      proximo: { em_dia: 0, atrasadas: 0, pendentes: 0 },
    };

    rows.forEach((row) => {
      const mesAtual = new Date().getMonth() + 1; // Obtém o mês atual (1-12)
      let periodo = '';

      if (row.mes === mesAtual - 1) {
        periodo = 'anterior';
      } else if (row.mes === mesAtual) {
        periodo = 'atual';
      } else if (row.mes === mesAtual + 1) {
        periodo = 'proximo';
      }

      if (periodo) {
        resultado[periodo][row.status] = row.quantidade;
      }
    });

    // Retorna o resultado
    res.status(200).json(resultado);
  } catch (error) {
    console.error('Erro ao obter dados dos gráficos:', error.message);
    res.status(500).json({ error: 'Erro ao carregar dados dos gráficos.' });
  }
};

module.exports = { getMensalidadesGraficos };