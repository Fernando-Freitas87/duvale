// ---------------------------------------------------------------------
// server.js
// ---------------------------------------------------------------------
// Responsável por inicializar o servidor Express, conectar ao banco e
// registrar as rotas disponíveis na aplicação.
// ---------------------------------------------------------------------

/**
 * Importação de Módulos
 */
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const db = require('./db');             // Conexão com o banco de dados
const logger = require('./utils/logger'); 
const { authenticateToken } = require('./middlewares/auth');
const { atualizarStatusMensalidades } = require('./services/mensalidadesService');

/**
 * Importação de Controllers e Rotas
 */
const loginRoutes = require('./routes/login');
const usuarioController = require('./controllers/usuarioController');
const clientesRoutes = require('./routes/clientesRoutes');
const gerencialRoutes = require('./routes/gerencialRoutes');
const mensalidadesRoutes = require('./routes/mensalidadesRoutes');
const cadastroClientesRoutes = require('./routes/cadastroClientesRoutes');
const cadastroImoveisRoutes = require('./routes/cadastroImoveisRoutes');
const cadastroContratosRoutes = require('./routes/cadastroContratosRoutes');
const cadastroMensalidadesRoutes = require('./routes/cadastroMensalidadesRoutes');
const imoveisRoutes = require('./routes/imoveisRoutes');
const contratosRoutes = require('./routes/contratosRoutes');
const caixaRoutes = require('./routes/caixaRoutes');


/**
 * Configuração do Servidor Express
 */
const app = express();

/**
 * Middlewares Globais
 */
app.use(cors({
  origin: 'https://fernando-freitas87.github.io/duvale/frontend', // Substitua pelo domínio exato do GitHub Pages
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'frontend')));

/**
 * Teste de Conexão com o Banco
 * - Se falhar, o servidor não inicia.
 */
db.query('SELECT 1')
  .then(() => logger.info('Conexão com o banco de dados bem-sucedida.'))
  .catch(err => {
    logger.error('Erro ao conectar ao banco de dados:', err.message);
    process.exit(1); // Encerra o servidor em caso de falha no banco
  });

/**
 * Registro de Rotas
 */
app.use('/api/login', loginRoutes);                    // Rotas de autenticação (PIN)
app.use('/api/clientes', clientesRoutes);              // Rotas para operações com clientes
app.use('/api/gerencial', gerencialRoutes);            // Rotas para painel gerencial
app.use('/api/mensalidades', mensalidadesRoutes);      // Rotas para operações de mensalidades
app.use('/api/cadastro/clientes', cadastroClientesRoutes); // Rotas para cadastro de clientes
app.use('/api/cadastro/imoveis', cadastroImoveisRoutes);   // Rotas para cadastro de imóveis
app.use('/api/cadastro/contratos', cadastroContratosRoutes); // Rotas para cadastro de contratos
app.use('/api/cadastro/mensalidades', cadastroMensalidadesRoutes); // Rotas para cadastro de mensalidades
app.use('/api/imoveis', imoveisRoutes);                // Rotas para operações com imóveis
app.use('/api/contratos', contratosRoutes);            // Rotas para operações com contratos
app.use('/api/caixa', caixaRoutes);                    // Rotas para operações de caixa

/**
 * Rota para Obter Informações do Usuário Autenticado
 */
app.get('/api/usuario', authenticateToken, usuarioController.getUsuario);

/**
 * Rota de teste para avisos gerenciais
 * (chama um método de controller para verificar avisos)
 */
app.get('/test-avisos', async (req, res) => {
  try {
    const mensalidadesController = require('./controllers/mensalidadesController');
    await mensalidadesController.getAvisosGerenciais(req, res);
  } catch (error) {
    logger.error('Erro no teste de avisos:', error.message);
    res.status(500).json({ error: 'Erro ao testar avisos gerenciais.' });
  }
});

/**
 * CRON Jobs
 * 1. Atualização de Status de Mensalidades (diariamente à meia-noite)
 */
cron.schedule('0 0 * * *', async () => {
  logger.info("Executando tarefa de atualização de status de mensalidades...");
  await atualizarStatusMensalidades();
});

/**
 * 2. Atualização de Status de Contratos (diariamente à meia-noite)
 */
const atualizarStatusContratos = async () => {
  try {
    const query = `
      UPDATE contratos
      SET status = 'inativo'
      WHERE data_fim <= NOW() AND status = 'ativo';
    `;
    await db.query(query);
    logger.info("Status dos contratos atualizados com sucesso.");
  } catch (error) {
    logger.error("Erro ao atualizar o status dos contratos:", error.message);
  }
};

// Agendar a execução diária (meia-noite)
cron.schedule('0 0 * * *', async () => {
  console.log("Executando tarefa de atualização de contratos...");
  await atualizarStatusContratos();
});

/**
 * Endpoint para forçar manualmente a atualização de mensalidades
 */
app.get('/api/testar-atualizacao', async (req, res) => {
  try {
    await atualizarStatusMensalidades();
    res.status(200).json({ message: 'Status das mensalidades atualizado com sucesso!' });
  } catch (error) {
    logger.error('Erro ao atualizar status das mensalidades:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar status das mensalidades.' });
  }
});

/**
 * Exemplo: Geração de QR Code (código simplificado)
 * - Salva e retorna um QR Code com base em dados do contrato
 */
app.post('/api/gerar-qrcode', async (req, res) => {
  const { contratoId, valor, dataVencimento } = req.body;

  if (!contratoId || !valor || !dataVencimento) {
    logger.warn('Tentativa de gerar QR Code com dados insuficientes.');
    return res.status(400).json({ error: 'Dados insuficientes.' });
  }

  try {
    // Verifica se já existe um QR code para este contrato e data
    const [existing] = await db.query(
      'SELECT id FROM qrcodes_pix WHERE contrato_id = ? AND data_vencimento = ?',
      [contratoId, dataVencimento]
    );

    if (existing.length > 0) {
      logger.warn(`QR Code já gerado para contrato ${contratoId}, vencimento ${dataVencimento}.`);
      return res.status(409).json({ error: 'QR Code já gerado.' });
    }

    // Monta a string e gera o link do QR Code
    const qrCodeTexto = `PIX:${contratoId}|VALOR:${valor}|VENCIMENTO:${dataVencimento}`;
    const qrCodeImagem = `https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=${encodeURIComponent(qrCodeTexto)}`;

    // Insere registro no banco
    await db.query(
      'INSERT INTO qrcodes_pix (contrato_id, data_vencimento, qr_code_texto, qr_code_imagem, valor) VALUES (?, ?, ?, ?, ?)',
      [contratoId, dataVencimento, qrCodeTexto, qrCodeImagem, valor]
    );

    logger.info(`QR Code gerado com sucesso para o contrato ${contratoId}.`);
    res.status(201).json({ message: 'QR Code gerado com sucesso!', qrCodeImagem });
  } catch (error) {
    logger.error(`Erro ao gerar QR Code: ${error.message}`);
    res.status(500).json({ error: 'Erro ao gerar QR Code.' });
  }
});

/**
 * Inicialização do Servidor
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Servidor rodando em http://localhost:${PORT}`);
});