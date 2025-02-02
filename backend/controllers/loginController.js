// ---------------------------------------------------------------------
// loginController.js
// ---------------------------------------------------------------------
// Responsável por:
// 1) Validar o PIN de acesso (6 dígitos).
// 2) Consultar o banco de dados para confirmar a existência do PIN.
// 3) Gerar um token JWT (expira em 1 hora) com os dados do usuário.
// 4) Atualizar o status das mensalidades para "em atraso" (caso necessário)
//    sempre que um login for bem-sucedido.
// ---------------------------------------------------------------------

const jwt = require('jsonwebtoken');
const db = require('../db');
const logger = require('../utils/logger');
const { atualizarStatusMensalidades } = require('../services/mensalidadesService');

exports.login = async (req, res) => {
  const { pin } = req.body;

  try {
    // 1) Verifica se a variável de ambiente JWT_SECRET está configurada
    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET não configurada. Verifique o arquivo .env.');
      return res.status(500).json({ error: 'Erro na configuração do servidor.' });
    }

    // 2) Validação básica do formato do PIN (precisa ser 6 dígitos numéricos)
    if (!pin || !/^\d{6}$/.test(pin)) {
      logger.warn(`Tentativa de login com PIN inválido: ${pin}`);
      return res.status(400).json({ error: 'Formato de PIN inválido (use 6 dígitos).' });
    }

    // 3) Consulta o PIN no banco de dados
    //    Busca o ID e o tipo_usuario (ex.: 'administrador' ou 'cliente') para gerar token
    const [rows] = await db.query(
      'SELECT id, tipo_usuario, nome FROM clientes WHERE pin = ?',
      [pin]
    );

    if (rows.length === 0) {
      logger.warn(`PIN não encontrado no banco de dados: ${pin}`);
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const user = rows[0];

    // 4) Opcional: Atualizar status de mensalidades para "em atraso"
    //    toda vez que alguém logar, garantindo que os dados estejam consistentes.
    //    Se desejar evitar lentidão no login, você pode rodar isto de forma assíncrona
    //    sem await (mas então perderia certeza de conclusão).
    await atualizarStatusMensalidades();

    // 5) Gera o token JWT com expiração de 1h
    //    Incluímos no payload: id do usuário, tipo_usuario e nome
    const token = jwt.sign(
      { id: user.id, type: user.tipo_usuario, nome: user.nome },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    logger.info(`Usuário autenticado com sucesso. ID: ${user.id}`);

    // 6) Retorna token + tipo do usuário + nome do usuário
    return res.json({ token, type: user.tipo_usuario, nome: user.nome });

  } catch (error) {
    logger.error(`Erro ao autenticar o PIN: ${error.message}`);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};