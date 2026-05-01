const express = require('express');
const { authenticateToken, checkAdmin } = require('../middleware/auth');
const db = require('../config/database');
const router = express.Router();

// Cadastrar mensagem (admin)
router.post('/', authenticateToken, checkAdmin, async (req, res) => {
    console.log('POST /mensagens received:', req.body);
    const { versao, livro, capitulo, versiculo, texto_versiculo, titulo, descricao } = req.body;
    const usuario_id = req.user.id;

    if (!versao || !livro || !capitulo || !versiculo || !texto_versiculo || !titulo || !descricao) {
        return res.status(400).json({ success: false, message: 'Preencha todos os campos.' });
    }

    try {
        // Usar os nomes EXATOS das colunas no banco: capítulo e versículo (com acento)
        const [lastOrder] = await db.query('SELECT MAX(ordem_exibição) as maxOrder FROM mensagensdiarias');
        const ordem_exibicao = (lastOrder[0].maxOrder || 0) + 1;

        await db.query(
            'INSERT INTO mensagensdiarias (usuario_id, versao, livro, capítulo, versículo, texto_versículo, título, descrição, ordem_exibição) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [usuario_id, versao, livro, capitulo, versiculo, texto_versiculo, titulo, descricao, ordem_exibicao]
        );
        res.json({ success: true, message: 'Mensagem cadastrada com sucesso!' });
    } catch (error) {
        console.error('Erro ao cadastrar mensagem:', error);
        res.status(500).json({ success: false, message: 'Erro ao cadastrar mensagem: ' + error.message });
    }
});

// Listar mensagens
router.get('/', authenticateToken, checkAdmin, async (req, res) => {
    const { busca } = req.query;

    try {
        let query = 'SELECT id_mensagem, usuario_id, versao, livro, capítulo, versículo, texto_versículo, título, descrição, ordem_exibição FROM mensagensdiarias WHERE 1=1';
        const params = [];
        if (busca) {
            query += ' AND (LOWER(título) LIKE LOWER(?) OR LOWER(livro) LIKE LOWER(?) OR LOWER(texto_versículo) LIKE LOWER(?))';
            params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
        }
        query += ' ORDER BY ordem_exibição DESC';
        
        const [results] = await db.query(query, params);
        res.json({ success: true, mensagens: results });
    } catch (error) {
        console.error('Erro ao listar mensagens:', error);
        res.status(500).json({ success: false, message: 'Erro ao listar mensagens.' });
    }
});

// Mensagem do dia
router.get('/diaria', authenticateToken, async (req, res) => {
    try {
        const startDate = new Date('2025-06-01');
        const today = new Date();
        const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        
        const [count] = await db.query('SELECT COUNT(*) as total FROM mensagensdiarias');
        const totalMensagens = count[0].total;
        
        if (totalMensagens === 0) {
            return res.status(404).json({ success: false, message: 'Nenhuma mensagem disponível.' });
        }
        
        const ordem_exibicao = (daysSinceStart % totalMensagens) + 1;

        const [results] = await db.query(
            'SELECT id_mensagem, versao, livro, capítulo, versículo, texto_versículo, título, descrição FROM mensagensdiarias WHERE ordem_exibição = ?',
            [ordem_exibicao]
        );
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Nenhuma mensagem para hoje.' });
        }
        res.json({ success: true, mensagem: results[0] });
    } catch (error) {
        console.error('Erro ao buscar mensagem do dia:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar mensagem do dia.' });
    }
});

module.exports = router;