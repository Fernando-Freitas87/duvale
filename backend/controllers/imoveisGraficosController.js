const db = require('../db'); // Conexão com o banco de dados

/**
 * Controlador para obter dados para os gráficos de imóveis
 */
const getImoveisGraficos = async (req, res) => {
  try {
    // 1) Consulta para contar imóveis por status
    const [rowsStatus] = await db.query(`
      SELECT status, COUNT(*) AS total
      FROM imoveis
      GROUP BY status
    `);

    // 2) Consulta para contar imóveis por tipo
    const [rowsTipo] = await db.query(`
      SELECT tipo, COUNT(*) AS total
      FROM imoveis
      GROUP BY tipo
    `);

    // Monta objeto-base com 0 para cada status
    // para evitar "undefined" se algo não existir no banco
    const statusResultado = {
      disponivel: 0,
      alugado: 0,
      indisponivel: 0,
    };

    // Monta objeto-base com 0 para cada tipo
    const tipoResultado = {
      comercial: 0,
      residencial: 0,
    };

    // Popula statusResultado de acordo com o que vier do DB
    rowsStatus.forEach((row) => {
      const status = row.status.toLowerCase(); 
      // Atenção: Ajuste se no DB estiver como "disponível", "disponivel", etc.
      if (statusResultado.hasOwnProperty(status)) {
        statusResultado[status] = parseInt(row.total, 10);
      }
    });

    // Popula tipoResultado de acordo com o que vier do DB
    rowsTipo.forEach((row) => {
      const tipo = row.tipo.toLowerCase();  
      // Ajuste se no DB estiver "Comercial"/"Residencial" com maiúsculas e acentos
      if (tipoResultado.hasOwnProperty(tipo)) {
        tipoResultado[tipo] = parseInt(row.total, 10);
      }
    });

    // Monta a resposta final, agrupando os dois "gráficos" que quer exibir
    const resultado = {
      status: statusResultado,
      tipo: tipoResultado,
    };

    // Retorna o objeto em JSON
    res.status(200).json(resultado);

  } catch (error) {
    console.error('Erro ao obter dados dos gráficos de imóveis:', error);
    res.status(500).json({ error: 'Erro ao carregar dados dos gráficos de imóveis.' });
  }
};

module.exports = { getImoveisGraficos };