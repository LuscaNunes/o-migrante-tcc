const mysql = require('mysql2/promise');
require('dotenv').config();

// Se o DB_PORT não estiver definido, o default é 3306 (padrão)
// Mas vamos garantir que ele busque a porta 4000 do TiDB
const DB_PORT = process.env.DB_PORT || 3306;
const DB_HOST = process.env.DB_HOST || 'localhost';

/**
 * Configuração do Pool de Conexões com o banco de dados MySQL
 */
const poolConfig = {
    host: DB_HOST,
    port: DB_PORT,
    user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'test',
    connectTimeout: 10000,
    charset: 'utf8mb4',
    
    // --- Configurações do Pool (NOVO) ---
    waitForConnections: true, // Se o limite for atingido, espera por uma conexão livre
    connectionLimit: 10,      // Número máximo de conexões no pool
    queueLimit: 0,            // 0 significa sem limite para requisições na fila
    
    // --- Configurações de Resiliência para Cloud (NOVO) ---
    enableKeepAlive: true,      // Tenta ativamente manter a conexão viva
    keepAliveInitialDelay: 0,
    idleTimeout: 60000,         // 60 segundos antes de considerar uma conexão inativa
    
    // --- Configuração de SSL para Nuvem (TiDB) ---
    ssl: {
        rejectUnauthorized: true
    }
};

// Cria o Pool de Conexões
const pool = mysql.createPool(poolConfig);

/**
 * Funções de Verificação (Usando o Pool)
 */
pool.getConnection()
    .then(connection => {
        console.log('Pool de conexões criado e funcionando. Conectado ao MySQL!');
        
        // A conexão obtida também usa Promises
        return connection.query('SELECT DATABASE() AS db_name')
            .then(([rows]) => {
                console.log('Banco de dados atual:', rows[0].db_name);
                connection.release(); // LIBERA A CONEXÃO DE VOLTA AO POOL
            });
    })
    .catch(err => {
        // Captura o erro ao tentar obter a conexão
        console.error('Erro ao conectar ou verificar o Pool:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Verifique as credenciais e o Firewall/ACL!');
        }
    });

// Exporta o Pool, que é o que deve ser usado com .promise() nos seus routes
module.exports = pool;