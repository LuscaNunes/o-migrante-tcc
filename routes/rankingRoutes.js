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

// GET /ranking/posicao - Retorna posição e XP do usuário logado
router.get('/posicao', authenticateToken, async (req, res) => {
  try {
    const usuario_id = req.user.id;
    
    // Buscar XP do usuário
    const [userData] = await db.query(
      'SELECT xp_total, nome FROM Usuarios WHERE id_usuario = ?',
      [usuario_id]
    );
    
    if (userData.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Contar quantos usuários têm XP maior que o seu
    const [posicaoData] = await db.query(
      'SELECT COUNT(*) as total FROM Usuarios WHERE xp_total > (SELECT xp_total FROM Usuarios WHERE id_usuario = ?)',
      [usuario_id]
    );
    
    const posicao = posicaoData[0].total + 1;
    
    res.json({
      posicao: posicao,
      xp_total: userData[0].xp_total || 0,
      nome: userData[0].nome
    });
  } catch (err) {
    console.error('Erro ao buscar posição:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;