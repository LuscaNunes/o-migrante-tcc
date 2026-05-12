const express = require('express');
const { authenticateToken, checkAdmin } = require('../middleware/auth');
const perguntaService = require('../services/perguntaService');
const router = express.Router();

// POST /perguntas - Cadastrar pergunta
router.post('/', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const usuario_id = req.user.id;
    await perguntaService.cadastrarPergunta(usuario_id, req.body);
    res.json({ success: true, message: 'Pergunta cadastrada com sucesso!' });
  } catch (err) {
    console.error('Erro ao cadastrar pergunta:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /perguntas/aleatorias - Buscar perguntas aleatórias
router.get('/aleatorias', authenticateToken, async (req, res) => {
  try {
    const { nivel_id, quantidade } = req.query;
    const result = await perguntaService.buscarPerguntasAleatorias(nivel_id, quantidade);
    res.json(result);
  } catch (err) {
    console.error('Erro ao buscar perguntas aleatórias:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /perguntas - Buscar perguntas por nível
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { nivel_id } = req.query;
    const perguntas = await perguntaService.buscarPerguntasPorNivel(nivel_id);
    res.json({ perguntas });
  } catch (err) {
    console.error('Erro ao buscar perguntas:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /perguntas/:id - Buscar pergunta por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const pergunta = await perguntaService.buscarPerguntaPorId(req.params.id);
    res.json(pergunta);
  } catch (err) {
    console.error('Erro ao buscar pergunta:', err);
    res.status(404).json({ error: err.message });
  }
});

// PUT /perguntas/:id - Atualizar pergunta
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    await perguntaService.atualizarPergunta(req.params.id, req.body);
    res.json({ success: true, message: 'Pergunta atualizada com sucesso!' });
  } catch (err) {
    console.error('Erro ao editar pergunta:', err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /perguntas/:id - Excluir pergunta
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await perguntaService.excluirPergunta(req.params.id);
    res.json({ success: true, message: 'Pergunta excluída com sucesso!' });
  } catch (err) {
    console.error('Erro ao excluir pergunta:', err);
    res.status(404).json({ error: err.message });
  }
});

module.exports = router;