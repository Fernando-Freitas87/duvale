// controlador para gerenciamento de contratos
// backend/controllers/contratosController.js

const db = require('../db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Lista todos os contratos do banco.
 * Rota GET /api/contratos
 */
exports.listarContratos = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.id,
        cli.nome AS cliente,
        cli.nacionalidade,
        cli.documento_identidade,
        cli.numero_documento_identidade,
        i.descricao AS imovel,
        c.total_meses,
        c.valor_aluguel,
        c.dia_vencimento,
        c.data_inicio,
        c.data_fim
      FROM contratos c
      JOIN clientes cli ON c.cliente_id = cli.id
      JOIN imoveis i ON c.imovel_id = i.id
      ORDER BY c.id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar contratos:', error.message);
    res.status(500).json({ error: 'Erro ao buscar contratos.' });
  }
};

/**
 * (Opcional) Cria um novo contrato.
 * Rota POST /api/contratos
 */
exports.criarContrato = async (req, res) => {
  try {
    const { cliente_id, imovel_id, total_meses, valor_aluguel, dia_vencimento, cliente_nacionalidade, documento_identidade, numero_documento_identidade, data_inicio, data_fim } = req.body;
    // Valide os campos necessários
    if (!cliente_id || !imovel_id || !data_inicio) {
      return res.status(400).json({ error: 'Informe ao menos cliente_id, imovel_id e data_inicio.' });
    }

    const [result] = await db.query(`
      INSERT INTO contratos
        (cliente_id, imovel_id, total_meses, valor_aluguel, cliente_nacionalidade, documento_identidade, numero_documento_identidade, dia_vencimento, data_inicio, data_fim, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ativo')
    `, [cliente_id, imovel_id, total_meses, valor_aluguel, cliente_nacionalidade, documento_identidade, numero_documento_identidade, dia_vencimento, data_inicio, data_fim]);

    res.status(201).json({
      message: 'Contrato criado com sucesso!',
      insertId: result.insertId
    });
  } catch (error) {
    console.error('Erro ao criar contrato:', error.message);
    res.status(500).json({ error: 'Erro ao criar contrato.' });
  }
};



exports.gerarContratoPDF = async (req, res) => {
  try {
    const { contratoId } = req.params;

    // Buscar os dados do contrato no banco
    const [[contrato]] = await db.query(`
      SELECT 
        c.id AS contrato_id, 
        cl.nome AS cliente_nome, 
        cl.nacionalidade AS cliente_nacionalidade, 
        cl.data_nascimento, 
        cl.cpf AS cliente_cpf, 
        cl.documento_identidade, 
        cl.numero_documento_identidade,
        cl.telefone AS cliente_telefone,
        cl.numero_documento_identidade,
        cl.documento_identidade,
        cl.nacionalidade,
        i.descricao AS imovel_descricao, 
        i.tipo AS imovel_tipo, 
        i.endereco AS imovel_endereco,
        c.total_meses, 
        c.valor_aluguel, 
        c.dia_vencimento,
        c.data_inicio, 
        c.data_fim
      FROM contratos c
      JOIN clientes cl ON c.cliente_id = cl.id
      JOIN imoveis i ON c.imovel_id = i.id
      WHERE c.id = ?
    `, [contratoId]);

    if (!contrato) {
      return res.status(404).json({ error: 'Contrato não encontrado.' });
    }

    // Validar dados obrigatórios
    if (!contrato.cliente_nome || !contrato.imovel_endereco || !contrato.data_inicio) {
      return res.status(400).json({ error: 'Dados do contrato incompletos.' });
    }

    // Criar o documento PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=contrato_${contratoId}.pdf`);
    doc.pipe(res);

    // Configuração do contrato
    doc.fontSize(16).text("CONTRATO DE LOCAÇÃO DE IMÓVEL", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text("Os signatários que contratam nas qualidades indicadas neste ato, têm entre si, ajustadas a presente locação, mediante as seguintes cláusulas e condições:");
    doc.moveDown();

    // Locador
    doc.text("LOCADOR: DUVALE CONSTRUTORA, IMOBILIARIA E LOCACAO DE MAQUINAS LTDA, CNPJ: 25.093.384/0001-65.");
    doc.text("Endereço: Av José Monteiro de Melo, 590 – Sala 02, Bairro Rodagem, Acaraú-CE, CEP.: 62580-000.");
    doc.moveDown();

    // Locatário
    doc.text(`LOCATÁRIO: ${contrato.cliente_nome}, ${contrato.nacionalidade}, maior e capaz, nascido aos ${new Date(contrato.data_nascimento).toLocaleDateString('pt-BR')}, inscrito no CPF n° ${contrato.cliente_cpf}, e portador do documento de ${contrato.documento_identidade} sob Registro n° ${contrato.numero_documento_identidade}.`);
    doc.moveDown();

    // Objeto da Locação
    doc.text(`OBJETO DA LOCAÇÃO: Um imóvel situado à ${contrato.imovel_endereco}, identificado como "${contrato.imovel_descricao}". Fim a que se destina: ${contrato.imovel_tipo}.`);
    doc.moveDown();

    // Prazo da Locação
    doc.text(`PRAZO DA LOCAÇÃO: Vigência de ${contrato.total_meses} meses, com início em ${new Date(contrato.data_inicio).toLocaleDateString('pt-BR')} e término em ${new Date(contrato.data_fim).toLocaleDateString('pt-BR')}. Uma vez expirado o prazo mencionado considera-se extinto todos os efeitos jurídicos do presente contrato de locação, obrigando-se as partes pela confecção de outro, caso eclodam interesses pela permanência no imóvel, ficando previamente cientificado que o valor locatício será aquele praticado no mercado imobiliário.`);
    doc.moveDown();

    // Valor do Aluguel
    doc.text(`VALOR DO ALUGUEL: R$ ${parseFloat(contrato.valor_aluguel).toFixed(2)}, com vencimento no dia ${contrato.dia_vencimento} de cada mês.`);
    doc.moveDown();

    // Caução
    doc.text(`"CAUÇÃO: O Locador recebe neste ato do Locatário, a importância de R$ ${parseFloat(contrato.valor_aluguel).toFixed(2)}, a título de garantia locatária, referente a 01 (um) mês de aluguel, mediante PIX na seguinte conta: Agência 0001-9, Conta Corrente 7263515-0 Banco Inter, favorecido DUVALE CONSTRUTORA, IMOBILIARIA E LOCACAO DE MAQUINAS LTDA, CNPJ: 25.093.384/0001-65. O aluguel mensal acima indicado deve ser pago IMPRORROGAVELMENTE até o dia ${contrato.dia_vencimento} de cada mês a vencer através de PIX na conta acima citada."`);
    doc.moveDown();

    // Cláusulas adicionais
    doc.text("DA INEXISTÊNCIA DE DEVOLUÇÃO: No caso de encerramento da estadia antes do prazo, o locador não devolverá valores ao inquilino.");
    doc.moveDown();

    // Cláusulas adicionais
    doc.text("DA DEMORA NA DESOCUPAÇÃO: A permanência no imóvel após o prazo contratado implicará no pagamento da diária em dobro.");
    doc.moveDown();

    // Cláusulas adicionais
    doc.text("TRIBUTOS E DEMAIS ENCARGOS: Os consumos de água, luz, IPTU e demais tributos ficam a cargo do LOCATÁRIO. majorações, ficam a cargo do LOCATÁRIO e, seu não pagamento na época determinada acarretará a rescisão deste contrato.");
    doc.moveDown();

    // Cláusulas adicionais
    doc.text("OBRIGAÇÕES GERAIS: O LOCATÁRIO não poderá sublocar, no seu todo ou em parte, o imóvel, e dele usará de forma a não prejudicar as condições estéticas e de segurança, moral, bem como a tranquilidade e o bem-estar dos vizinhos.");
    doc.text("no caso de qualquer obra, reforma ou adaptação, devidamente autorizada pelo LOCADOR, o LOCATÁRIO se obriga a repor o imóvel locado, em estado primitivo, por ocasião a entrega efetiva das chaves, não podendo exigir qualquer indenização;");
    doc.moveDown();
    doc.text("é vedado ao LOCATÁRIO a prática de atos que possam desvalorizar o imóvel locado, bem como a utilização do mesmo para fins ilícitos ou contrários à moral e aos bons costumes;");
    doc.moveDown();
    doc.text("O LOCADOR, por si ou por preposto, poderá visitar o imóvel, durante a locação, para verificar o exato cumprimento das cláusulas deste contrato.");
    doc.moveDown();
    doc.text("MULTA POR INFRAÇÃO: A infração de qualquer das cláusulas deste contrato faz incorrer o infrator na multa irredutível de 20% (vinte por cento), sobre o aluguel anual em vigor à época da infração, e importa na sua rescisão de pleno direito, independentemente de qualquer notificação ou aviso, sujeitando-se a parte inadimplente ao pagamento das perdas e danos que forem apuradas.");
    doc.moveDown();
    doc.text("A responsabilidade do LOCATÁRIO pelo aluguel e demais obrigações legais e contratuais só terminará com a devolução definitiva das chaves e quitação de todos os débitos de locação e os consectários legais e contratuais, inclusive reparos, se necessários.");
    doc.text("Na hipótese de ser necessária qualquer medida judicial, o LOCADOR e o LOCATÁRIO poderão ser citados pelo correio, com AR (Aviso de Recebimento) dirigido aos respectivos endereços mencionados no preâmbulo deste instrumento.");
    doc.moveDown();
    doc.text("As partes contratantes elegem o FORO da cidade de Acaraú/CE qualquer que sejam seus domicílios presentes ou futuros, para dirimir quaisquer dúvidas oriundas deste contrato, renunciando a qualquer outro por mais privilegiado que seja.");
    doc.moveDown();

    doc.text("E assim, por estarem justos e contratados, assinam o presente instrumento em 02 (duas) vias de igual teor, na presença das testemunhas que igualmente abaixo assinam.");
    doc.moveDown();

    doc.text(`Acaraú/CE, ${new Date().toLocaleDateString('pt-BR')}`, { align: "center" });
    doc.moveDown();

    // Adiciona assinaturas com espaçamento correto
    doc.text("___________________________                    ___________________________", { align: "center" });
    doc.text(`${contrato.cliente_nome}                                       DUVALE IMOBILIARIA`, { align: "center" });
    doc.text(`CPF n° ${contrato.cliente_cpf}                               CNPJ: 25.093.384/0001-65`, { align: "center" });
    doc.text("LOCATÁRIO                                                 LOCADOR", { align: "center" });
    doc.moveDown();

    // Adiciona a seção de testemunhas
    doc.text("Testemunhas:", { align: "center" });
    doc.moveDown();
    doc.text("1. NOME: ___________________________ RG:____________  CPF: ____________ 2. NOME: ___________________________ RG:____________  CPF: ____________  ", { align: "left" });

    doc.end();
  } catch (error) {
    console.error("Erro ao gerar contrato:", error.stack);
    res.status(500).json({ error: "Erro ao gerar contrato. Detalhes: " + error.message });
  }
};

/**
 * Atualiza um contrato existente pelo ID.
 * Rota: PUT /api/contratos/:id
 */
exports.atualizarContrato = async (req, res) => {
  try {
    const { id } = req.params; // ID do contrato vindo dos parâmetros da URL

    // Dados recebidos do corpo da requisição
    const { total_meses, valor_aluguel, dia_vencimento, data_inicio } = req.body;

    // Verificação de campos obrigatórios
    if (!total_meses || !valor_aluguel || !dia_vencimento || !data_inicio) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }

    // Atualização do contrato, com cálculo da data final (data_fim)
    const query = `
      UPDATE contratos
      SET 
        total_meses = ?,
        valor_aluguel = ?,
        dia_vencimento = ?,
        data_inicio = ?,
        data_fim = DATE_ADD(?, INTERVAL ? MONTH)
      WHERE id = ?
    `;

    const params = [
      total_meses,
      valor_aluguel,
      dia_vencimento,
      data_inicio,
      data_inicio,
      total_meses,
      id,
    ];

    const [result] = await db.query(query, params);

    // Verificar se algum contrato foi atualizado
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Contrato não encontrado.' });
    }

    res.json({ message: 'Contrato atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar contrato:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar contrato.' });
  }
};

/**
 * Deleta (inativa) um contrato existente pelo ID.
 * Rota: DELETE /api/contratos/:id
 */
exports.deletarContrato = async (req, res) => {
  try {
    const { id } = req.params; // ID do contrato vindo dos parâmetros da URL

    // 1. Buscar o imóvel relacionado ao contrato
    const [[contrato]] = await db.query(`
      SELECT imovel_id
      FROM contratos
      WHERE id = ?
    `, [id]);

    if (!contrato) {
      return res.status(404).json({ error: 'Contrato não encontrado.' });
    }

    const imovelId = contrato.imovel_id;

    // 2. Atualizar o contrato para 'inativo'
    await db.query(`
      UPDATE contratos
      SET status = 'inativo'
      WHERE id = ?
    `, [id]);

    // 3. Atualizar o imóvel para 'disponível'
    await db.query(`
      UPDATE imoveis
      SET status = 'disponível'
      WHERE id = ?
    `, [imovelId]);

    // 4. Remover mensalidades futuras ou pendentes relacionadas ao contrato
    await db.query(`
      DELETE FROM mensalidades
      WHERE contrato_id = ?
        AND status = 'pendente'
    `, [id]);

    // Responder com sucesso
    res.json({ message: 'Contrato inativado e imóvel liberado com sucesso!' });

  } catch (error) {
    console.error('Erro ao inativar contrato:', error.message);
    res.status(500).json({ error: 'Erro ao remover (inativar) contrato.' });
  } // Aqui finaliza o bloco try-catch corretamente
};