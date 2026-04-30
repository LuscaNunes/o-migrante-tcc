const express = require('express');
const { authenticateToken, checkAdmin } = require('../middleware/auth');
const nivelService = require('../services/nivelService');
const router = express.Router();

// POST /niveis - Cadastrar nível
router.post('/', authenticateToken, async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const id = await nivelService.cadastrarNivel(usuario_id, req.body);
    res.json({ success: true, message: 'Nível cadastrado com sucesso!', id });
  } catch (err) {
    console.error('Erro ao cadastrar nível:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /niveis - Buscar níveis
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { busca } = req.query;
    const niveis = await nivelService.buscarNiveis(busca);
    res.json({ niveis });
  } catch (err) {
    console.error('Erro ao buscar níveis:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /niveis/ativos - Buscar níveis ativos (público)
router.get('/ativos', async (req, res) => {
  try {
    const niveis = await nivelService.buscarNiveisAtivos();
    res.json({ niveis });
  } catch (err) {
    console.error('Erro ao buscar níveis ativos:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /niveis/:id - Buscar nível por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const nivel = await nivelService.buscarNivelPorId(req.params.id);
    res.json(nivel);
  } catch (err) {
    console.error('Erro ao buscar nível:', err);
    res.status(404).json({ error: err.message });
  }
});

// PUT /niveis/:id - Atualizar nível
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    await nivelService.atualizarNivel(req.params.id, req.body);
    res.json({ success: true, message: 'Nível atualizado com sucesso!' });
  } catch (err) {
    console.error('Erro ao editar nível:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /niveis/:id/ativar - Ativar/desativar nível
router.put('/:id/ativar', authenticateToken, async (req, res) => {
  try {
    const { ativo, posicao } = req.body;
    await nivelService.ativarNivel(req.params.id, ativo, posicao);
    res.json({ success: true, message: ativo ? 'Nível ativado com sucesso!' : 'Nível desativado com sucesso!' });
  } catch (err) {
    console.error('Erro ao processar solicitação:', err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /niveis/:id - Excluir nível
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await nivelService.excluirNivel(req.params.id);
    res.json({ success: true, message: 'Nível excluído com sucesso!' });
  } catch (err) {
    console.error('Erro ao excluir nível:', err);
    res.status(404).json({ success: false, message: err.message });
  }
});

module.exports = router;