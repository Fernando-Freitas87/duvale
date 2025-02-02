// ---------------------------------------------------------------------
// auth.js
// ---------------------------------------------------------------------
// Middleware responsável pela validação de tokens JWT e autorização
// de acordo com o tipo de usuário (cliente, administrador, etc.).
// ---------------------------------------------------------------------

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Enum para tipos de usuário
const USER_TYPES = {
  CLIENTE: 'cliente',
  ADMINISTRADOR: 'administrador',
};

/**
 * Função auxiliar para lidar com erros de autenticação.
 * Registra warning no logger e retorna JSON com erro.
 */
const handleAuthError = (res, message, status = 401) => {
  logger.warn(`${message} | IP: ${res.req.ip}`);
  return res.status(status).json({ error: message });
};

/**
 * Middleware para autenticação do token JWT.
 * - Verifica se o header Authorization existe
 * - Tenta decodificar o token e, se válido, anexa req.auth com id e type
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return handleAuthError(res, 'Cabeçalho Authorization inválido ou ausente.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return handleAuthError(res, 'Token não fornecido.');
    }

    // Verifica token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        const errorMsg =
          err.name === 'TokenExpiredError'
            ? 'Token expirado.'
            : `Token inválido: ${err.message}`;
        logger.error(`Erro na verificação do token: ${err.name} - ${err.message}`);
        return handleAuthError(res, errorMsg, 403);
      }

      if (!user || !user.id || !user.type) {
        return handleAuthError(res, 'Dados do token inválidos ou incompletos.', 403);
      }

      req.auth = user; // Salva os dados decodificados no request
      logger.info(`Usuário autenticado: ID ${user.id}, Tipo ${user.type}, Nome ${user.nome}`);
      next();
    });
  } catch (error) {
    logger.error(`Erro no middleware de autenticação: ${error.message}`);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

/**
 * Middleware para autorização.
 * - Verifica se o req.auth.type está na lista de tipos permitidos.
 */
const authorize = (requiredUserTypes) => (req, res, next) => {
  const allowedTypes = Array.isArray(requiredUserTypes)
    ? requiredUserTypes
    : [requiredUserTypes];

  if (!req.auth || !allowedTypes.includes(req.auth.type)) {
    logger.warn(`Acesso negado para o usuário ID: ${req.auth?.id || 'desconhecido'}`);
    return res.status(403).json({ error: 'Permissão insuficiente.' });
  }

  logger.info(`Usuário ID ${req.auth.id} autorizado.`);
  next();
};

module.exports = {
  authenticateToken,
  authorize,
  USER_TYPES,
};