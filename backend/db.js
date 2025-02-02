// db.js

require('dotenv').config();
const mysql = require('mysql2');

// Cria o pool de conexões
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Exporta o pool como Promises
const db = pool.promise();
module.exports = db;

// Testar conexão (opcional)
(async () => {
    try {
        // Aqui usamos o próprio pool para teste
        const [result] = await db.query('SELECT 1');
        console.log('Conexão com o banco de dados estabelecida com sucesso.');
    } catch (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    }
})();