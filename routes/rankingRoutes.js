const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const rankingService = require('../services/rankingService');
const router = express.Router();

// GET /ranking/global - Ranking global geral
router.get('/global', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const ranking = await rankingService.getRankingGlobal(limit);
    const userPosition = await rankingService.getUserRankPosition(req.user.id);
    const stats = await rankingService.getRankingStats();
    
    res.json({
      success: true,
      ranking,
      userPosition: userPosition.posicao,
      stats
    });
  } catch (error) {
    console.error('Erro ao buscar ranking global:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /ranking/niveis - Ranking por níveis completados
router.get('/niveis', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const ranking = await rankingService.getRankingNiveisCompletos(limit);
    res.json({ success: true, ranking });
  } catch (error) {
    console.error('Erro ao buscar ranking por níveis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /ranking/semanal - Ranking semanal
router.get('/semanal', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const ranking = await rankingService.getRankingSemanal(limit);
    res.json({ success: true, ranking });
  } catch (error) {
    console.error('Erro ao buscar ranking semanal:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /ranking/posicao/:usuarioId - Posição específica de um usuário
router.get('/posicao/:usuarioId', authenticateToken, async (req, res) => {
  try {
    const position = await rankingService.getUserRankPosition(req.params.usuarioId);
    res.json({ success: true, position: position.posicao });
  } catch (error) {
    console.error('Erro ao buscar posição:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;