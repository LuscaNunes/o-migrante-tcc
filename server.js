const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Defined' : 'Undefined');

// Módulos
const db = require('./config/database');
const { authenticateToken, checkAdmin } = require('./middleware/auth');

// Rotas da API
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const nivelRoutes = require('./routes/nivelRoutes');
const perguntaRoutes = require('./routes/perguntaRoutes');
const progressoRoutes = require('./routes/progressoRoutes');
const anotacaoRoutes = require('./routes/anotacaoRoutes');
const mensagemRoutes = require('./routes/mensagemRoutes');
const amizadeRoutes = require('./routes/amizadeRoutes');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

// =======================================================
// 🔑 CONFIGURAÇÃO DO EJS (NOVO MOTOR DE TEMPLATE)
// =======================================================
app.set('view engine', 'ejs');
// Define um array de caminhos para que o Express procure templates.
// 1. Templates de Admin
// 2. Templates Públicos (usuário)
// 3. (OPCIONAL: Um diretório central para layout/sidebar, se você o criar)
app.set('views', [
    path.join(__dirname, 'admin', 'telas'),
    path.join(__dirname, 'public', 'telas')
]);
// =======================================================

// --- 1. ROTAS PÚBLICAS (Login/Cadastro e Arquivo Index) ---

// Rota para a tela inicial (Index.html -> Index.ejs)
app.get('/', (req, res) => {
    // Se o Index for uma página simples que não usa o layout, mantenha o sendFile.
    // Se quiser que ela use EJS, mude para res.render('Index');
res.render('Index', { title: 'Login e Cadastro - O Migrante' });});

// Rotas de Autenticação (Login e Cadastro)
app.use('/auth', authRoutes);    

// Servir arquivos estáticos PÚBLICOS (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/biblia', express.static(path.join(__dirname, 'public', 'biblia')));

// --- 2. APLICAÇÃO DO MIDDLEWARE DE AUTENTICAÇÃO ---

// 🛑 A partir daqui, todas as rotas/arquivos estáticos precisam de autenticação!

// Rotas de API que precisam de token
app.use('/usuarios', authenticateToken, userRoutes);
app.use('/niveis', authenticateToken, nivelRoutes);
app.use('/perguntas', authenticateToken, perguntaRoutes);
app.use('/progresso', authenticateToken, progressoRoutes);
app.use('/anotacoes', authenticateToken, anotacaoRoutes);
app.use('/mensagens', authenticateToken, mensagemRoutes);
app.use('/amizades', authenticateToken, amizadeRoutes);

// =======================================================
// 🔑 ROTAS DE VISUALIZAÇÃO (USANDO EJS)
// =======================================================

// Rota para a área do usuário logado (ex: Painel.ejs)
// Agora renderiza o template .ejs em vez de servir o arquivo estático.
app.get('/app/painel', authenticateToken, (req, res) => {
    // O EJS irá procurar por 'painel.ejs' no array de views configurado.
    // Você deve criar 'layout.ejs' e 'sidebar.ejs' no mesmo diretório ou em um central.
    res.render('layout', { 
        title: 'Painel do Usuário', 
        // Renderiza Painel.ejs como string (o true é para retornar o HTML, não enviar)
        body: res.render('Painel', { /* dados */ }, true) 
    });
});

// Rota para a área de ADMIN (Exemplo: Pesquisa de Usuários)
app.get('/admin/pesquisar', authenticateToken, checkAdmin, (req, res) => {
    // Assume que 'PesquisarUsuario.ejs' está em 'admin/telas'
    res.render('layout', { 
        title: 'Admin - Pesquisar Usuários', 
        // Renderiza PesquisarUsuario.ejs como string
        body: res.render('PesquisarUsuario', { /* dados */ }, true)
    });
});

// Se houver outros arquivos HTML em public/telas, crie rotas app.get similares para eles.

// =======================================================
// 🛑 ATENÇÃO: Desabilite esta linha após converter todos os HTMLs!
// Se você ainda tem arquivos HTML que precisam ser servidos, use:
app.use('/app', authenticateToken, express.static(path.join(__dirname, 'public', 'telas')));
// Mas o ideal é que todas as páginas de usuário migrem para rotas EJS!
// =======================================================


// --- 3. LIMPEZA E ERROS ---

app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err.stack); // Use .stack para mais detalhes
    res.status(500).json({ error: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT} - ${new Date().toLocaleString()}`));
