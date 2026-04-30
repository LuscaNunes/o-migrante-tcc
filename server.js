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

function renderViewToString(appInstance, viewName, data) {
    return new Promise((resolve, reject) => {
        // app.render() aceita o callback 'done' que estava faltando na chamada direta
        appInstance.render(viewName, data, (err, html) => {
            if (err) {
                return reject(err);
            }
            resolve(html);
        });
    });
}
// Rota para a área do usuário logado (ex: Painel.ejs)
app.get('/app/painel', authenticateToken, async (req, res) => {
    try {
        // Captura o HTML puro de Painel.ejs como string
        const bodyContent = await renderViewToString(req.app, 'Painel', { 
            // Passa o objeto do usuário (obtido do JWT) para a view Painel.ejs
            user: req.user
        });

        // Renderiza o layout principal, injetando o Painel.ejs (bodyContent) no layout
        res.render('layout', { 
            title: 'Painel do Usuário | O Migrante', // Título para o <title> do HTML
            body: bodyContent, // O conteúdo completo do Painel.ejs (incluindo o script, mas sem <html>)
            user: req.user // O objeto user para ser usado dentro de layout.ejs (como na sidebar)
        });
    } catch (error) {
        // Se houver um erro de renderização no Painel ou no Layout
        console.error('Erro ao renderizar Painel:', error);
        res.status(500).send('Erro interno ao carregar a página: ' + error.message);
    }
});

// Rota para a área de ADMIN (Pesquisa de Usuários) - Lógica de renderização CORRIGIDA
app.get('/admin/pesquisar', authenticateToken, checkAdmin, async (req, res) => {
    try {
        // 1. Renderiza o conteúdo (PesquisaUsuario.ejs) como string
        const bodyContent = await renderViewToString(req.app, 'PesquisaUsuario', {
            // É fundamental passar o user aqui para que a sidebar (que está no layout) funcione corretamente
            user: req.user 
        });

        // 2. Renderiza o layout principal, injetando o conteúdo
        res.render('layout', { 
            title: 'Admin - Pesquisar Usuários', 
            body: bodyContent,
            user: req.user
        });
    } catch (error) {
        console.error('Erro ao renderizar Pesquisa de Usuários:', error);
        res.status(500).send('Erro interno ao carregar a página administrativa.');
    }
});
app.get('/app/perfil', authenticateToken, async (req, res) => {
  const body = await renderViewToString(req.app, 'DadoUsuario', { user: req.user });
  res.render('layout', { title: 'Perfil | O Migrante', body, user: req.user });
});

app.get('/app/biblia', authenticateToken, async (req, res) => {
    try {
        const bodyContent = await renderViewToString(req.app, 'Biblia', {
            user: req.user
        });

        res.render('layout', {
            title: 'Bíblia | O Migrante',
            body: bodyContent,
            user: req.user
        });
    } catch (error) {
        console.error('Erro ao renderizar Bíblia:', error);
        res.status(500).send('Erro interno ao carregar a página: ' + error.message);
    }
});

// Rota para Cadastro de Perguntas (Admin)
app.get('/admin/cadastrar-perguntas', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const bodyContent = await renderViewToString(req.app, 'CaPerguntas', { 
            user: req.user 
        });
        
        res.render('layout', { 
            title: 'Admin - Cadastrar Perguntas | O Migrante',
            body: bodyContent,
            user: req.user
        });
    } catch (error) {
        console.error('Erro ao renderizar Cadastro de Perguntas:', error);
        res.status(500).send('Erro interno ao carregar a página.');
    }
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