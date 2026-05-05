const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const router = express.Router();

/**
 * Rota para salvar progresso (chamar quando usuário completar um nível)
 * POST /progresso
 */
router.post('/', authenticateToken, async (req, res) => {
  const { nivel_id, xp_ganho, ordem } = req.body;
  const usuario_id = req.user.id;

  if (!nivel_id || !xp_ganho || !ordem || isNaN(nivel_id) || isNaN(xp_ganho) || isNaN(ordem)) {
    return res.status(400).json({ success: false, message: 'Parâmetros inválidos' });
  }

  if (ordem < 1 || ordem > 12) {
    return res.status(400).json({ success: false, message: 'Ordem deve estar entre 1 e 12' });
  }

  try {
    await db.beginTransaction();

    const [nivelRows] = await db.query('SELECT id FROM niveis WHERE id = ?', [nivel_id]);
    if (nivelRows.length === 0) {
      await db.rollback();
      return res.status(404).json({ success: false, message: 'Nível não encontrado' });
    }

    const [progressoRows] = await db.query(
      'SELECT xp_ganho, ordem FROM ProgressoUsuario WHERE usuario_id = ? AND nivel_id = ? AND ordem = ?',
      [usuario_id, nivel_id, ordem]
    );

    let novoXpGanho = xp_ganho;
    const concluido = xp_ganho > 0 ? 1 : 0;

    if (progressoRows.length > 0) {
      const progressoAtual = progressoRows[0];
      novoXpGanho = progressoAtual.xp_ganho + xp_ganho;
      await db.query(
        'UPDATE ProgressoUsuario SET xp_ganho = ?, concluido = ? WHERE usuario_id = ? AND nivel_id = ? AND ordem = ?',
        [novoXpGanho, concluido, usuario_id, nivel_id, ordem]
      );
    } else {
      await db.query(
        'INSERT INTO ProgressoUsuario (usuario_id, nivel_id, xp_ganho, ordem, concluido) VALUES (?, ?, ?, ?, ?)',
        [usuario_id, nivel_id, novoXpGanho, ordem, concluido]
      );
    }

    if (xp_ganho > 0) {
      await db.query(
        'UPDATE Usuarios SET xp_total = xp_total + ? WHERE id_usuario = ?',
        [xp_ganho, usuario_id]
      );
    }

    await db.commit();
    res.json({ success: true, message: 'Progresso salvo com sucesso', xp_ganho: novoXpGanho, ordem });
  } catch (error) {
    await db.rollback();
    console.error('Erro ao salvar progresso:', error);
    res.status(500).json({ success: false, error: 'Erro ao salvar progresso', details: error.message });
  }
});

/**
 * Rota para buscar progresso dos botões por nível
 * GET /progresso/botoes/:nivelId
 */
router.get('/botoes/:nivelId', authenticateToken, async (req, res) => {
  try {
    const nivelId = req.params.nivelId;
    const usuarioId = req.user.id;

    const [progresso] = await db.query(
      `SELECT ordem, concluido, xp_ganho
       FROM ProgressoUsuario 
       WHERE usuario_id = ? AND nivel_id = ?
       ORDER BY ordem ASC`,
      [usuarioId, nivelId]
    );

    const botoesCompletos = {};
    progresso.forEach(item => {
      botoesCompletos[item.ordem] = {
        concluido: item.concluido,
        xp_ganho: item.xp_ganho
      };
    });

    res.json({ botoesCompletos });
  } catch (error) {
    console.error('Erro ao buscar progresso dos botões:', error);
    res.status(500).json({ error: 'Erro ao buscar progresso dos botões.' });
  }
});

/**
 * Rota para buscar progresso detalhado do usuário
 * GET /progresso/detalhado
 */
router.get('/detalhado', authenticateToken, async (req, res) => {
  try {
    const usuario_id = req.user.id;

    const [progresso] = await db.query(
      `SELECT nivel_id, COUNT(*) AS perguntas_completas
       FROM ProgressoUsuario
       WHERE usuario_id = ? AND concluido = true
       GROUP BY nivel_id`,
      [usuario_id]
    );

    const niveisCompletos = progresso.reduce((map, item) => {
      map[item.nivel_id] = item.perguntas_completas;
      return map;
    }, {});

    res.json({ success: true, niveisCompletos });
  } catch (error) {
    console.error('Erro ao buscar progresso detalhado:', error);
    res.status(500).json({ error: 'Erro ao buscar progresso detalhado' });
  }
});

module.exports = router;