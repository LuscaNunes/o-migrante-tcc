const express = require('express');
const { authenticateToken, checkAdmin } = require('../middleware/auth');
const completarService = require('../services/completarService');
const router = express.Router();

// POST - Cadastrar pergunta (admin)
router.post('/', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const usuario_id = req.user.id;
        const id = await completarService.cadastrarPergunta(usuario_id, req.body);
        res.json({ success: true, message: 'Pergunta cadastrada com sucesso!', id });
    } catch (err) {
        console.error('Erro ao cadastrar:', err);
        res.status(400).json({ success: false, message: err.message });
    }
});

// GET - Buscar perguntas aleatórias (usuário)
router.get('/aleatorias', authenticateToken, async (req, res) => {
    try {
        const { nivel_id, quantidade } = req.query;
        const result = await completarService.buscarPerguntasAleatorias(nivel_id, quantidade || 5);
        res.json(result);
    } catch (err) {
        console.error('Erro ao buscar perguntas:', err);
        res.status(400).json({ error: err.message });
    }
});

// GET - Buscar perguntas por nível (admin)
router.get('/', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { nivel_id } = req.query;
        const perguntas = await completarService.buscarPerguntasPorNivel(nivel_id);
        res.json({ perguntas });
    } catch (err) {
        console.error('Erro ao buscar perguntas:', err);
        res.status(400).json({ error: err.message });
    }
});

// GET - Buscar pergunta por ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const pergunta = await completarService.buscarPerguntaPorId(req.params.id);
        res.json(pergunta);
    } catch (err) {
        console.error('Erro ao buscar pergunta:', err);
        res.status(404).json({ error: err.message });
    }
});

// PUT - Atualizar pergunta (admin)
router.put('/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        await completarService.atualizarPergunta(req.params.id, req.body);
        res.json({ success: true, message: 'Pergunta atualizada com sucesso!' });
    } catch (err) {
        console.error('Erro ao atualizar:', err);
        res.status(400).json({ error: err.message });
    }
});

// DELETE - Excluir pergunta (admin)
router.delete('/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        await completarService.excluirPergunta(req.params.id);
        res.json({ success: true, message: 'Pergunta excluída com sucesso!' });
    } catch (err) {
        console.error('Erro ao excluir:', err);
        res.status(404).json({ error: err.message });
    }
});

module.exports = router;