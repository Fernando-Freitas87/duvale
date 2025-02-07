const db = require('../db'); // Importa o módulo de conexão com o banco de dados
const logger = require('../utils/logger'); // Importa o logger para registro de logs

/**
 * Função para cadastrar um cliente no banco de dados
 * @param {Object} req - Objeto de requisição contendo os dados do cliente no corpo da requisição
 * @param {Object} res - Objeto de resposta para retornar os resultados da operação
 */
exports.cadastrarCliente = async (req, res) => {
  // Desestrutura os dados do corpo da requisição
  const {
    nome,
    cpf,
    telefone,
    pin,
    tipo_usuario = 'cliente', // Valor padrão: cliente
    observacoes,
    nacionalidade,
    data_nascimento,
    documento_identidade,
    numero_documento_identidade,
  } = req.body;

  // Validação: verifica se todos os campos obrigatórios foram preenchidos
  if (!nome || !cpf || !telefone || !pin || !nacionalidade || !data_nascimento || !documento_identidade || !numero_documento_identidade) {
    return res.status(400).json({
      error: 'Todos os campos obrigatórios devem ser preenchidos.',
    });
  }

  // Validação do CPF
  if (!validarCPF(cpf)) {
    return res.status(400).json({ error: 'CPF inválido.' });
  }

  // Validação do Telefone
  if (!validarTelefone(telefone)) {
    return res.status(400).json({ error: 'Telefone inválido.' });
  }

  try {
    // Insere os dados no banco de dados
    const [result] = await db.query(
      `INSERT INTO clientes 
       (nome, cpf, telefone, pin, tipo_usuario, observacoes, nacionalidade, data_nascimento, documento_identidade, numero_documento_identidade) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        cpf,
        telefone,
        pin,
        tipo_usuario,
        observacoes,
        nacionalidade,
        data_nascimento,
        documento_identidade,
        numero_documento_identidade,
      ]
    );

    // Retorna sucesso com o ID do cliente inserido
    res.status(201).json({
      message: 'Cliente cadastrado com sucesso!',
      id: result.insertId,
    });
  } catch (error) {
    // Registra o erro no log e retorna erro interno
    logger.error('Erro ao cadastrar cliente:', error.message);
    res.status(500).json({ error: 'Erro ao cadastrar cliente.' });
  }
};

/**
 * Função para validar CPF
 * @param {string} cpf - CPF a ser validado
 * @returns {boolean} - Retorna true se o CPF for válido
 */
function validarCPF(cpf) {
  if (!cpf || typeof cpf !== 'string') return false;

  // Remove caracteres não numéricos
  cpf = cpf.replace(/\D/g, '');

  // Verifica se tem 11 dígitos ou se todos os dígitos são iguais
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0, resto;

  // Valida o primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpf[i - 1]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[9])) return false;

  soma = 0;

  // Valida o segundo dígito verificador
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpf[i - 1]) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[10])) return false;

  return true;
}

/**
 * Função para validar telefone
 * @param {string} telefone - Telefone a ser validado
 * @returns {boolean} - Retorna true se o telefone for válido
 */
function validarTelefone(telefone) {
  const telefoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/; // Formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX
  return telefoneRegex.test(telefone);
}