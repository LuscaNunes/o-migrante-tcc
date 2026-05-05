const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const router = express.Router();

// POST /progresso - Salvar progresso (sem transação complexa)
router.post('/', authenticateToken, async (req, res) => {
  const { nivel_id, xp_ganho, ordem } = req.body;
  const usuario_id = req.user.id;

  if (!nivel_id || xp_ganho === undefined || !ordem) {
    return res.status(400).json({ success: false, message: 'Parâmetros inválidos' });
  }

  try {
    // Verificar se já existe progresso para esta ordem
    const [existing] = await db.query(
      'SELECT id, xp_ganho as xp_atual, concluido FROM ProgressoUsuario WHERE usuario_id = ? AND nivel_id = ? AND ordem = ?',
      [usuario_id, nivel_id, ordem]
    );

    let novoXpGanho = xp_ganho;
    let concluido = false;

    if (existing.length > 0) {
      // Se já existe, soma o XP
      novoXpGanho = existing[0].xp_atual + xp_ganho;
      
      // Marcar como concluído se XP atingir ou ultrapassar 5 (5 perguntas * 1 XP cada)
      // Ou se a ordem já foi concluída antes
      if (novoXpGanho >= 5 || existing[0].concluido === 1) {
        concluido = true;
      }
      
      await db.query(
        'UPDATE ProgressoUsuario SET xp_ganho = ?, concluido = ? WHERE usuario_id = ? AND nivel_id = ? AND ordem = ?',
        [novoXpGanho, concluido, usuario_id, nivel_id, ordem]
      );
    } else {
      // Primeira vez, concluído só se ganhou 5 XP ou mais
      concluido = (xp_ganho >= 5);
      await db.query(
        'INSERT INTO ProgressoUsuario (usuario_id, nivel_id, xp_ganho, ordem, concluido) VALUES (?, ?, ?, ?, ?)',
        [usuario_id, nivel_id, xp_ganho, ordem, concluido]
      );
    }

    // Atualizar XP total do usuário (só se for XP novo)
    if (xp_ganho > 0) {
      await db.query('UPDATE Usuarios SET xp_total = xp_total + ? WHERE id_usuario = ?', [xp_ganho, usuario_id]);
    }

    console.log('Progresso salvo:', { usuario_id, nivel_id, ordem, novoXpGanho, concluido });
    res.json({ success: true, message: 'Progresso salvo com sucesso', xp_ganho: novoXpGanho, concluido });

  } catch (error) {
    console.error('Erro ao salvar progresso:', error);
    res.status(500).json({ success: false, error: 'Erro ao salvar progresso', details: error.message });
  }
});

// GET /progresso/botoes/:nivelId - Buscar progresso dos botões
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
    
    // Inicializar todos os botões como não concluídos
    for (let i = 1; i <= 12; i++) {
      botoesCompletos[i] = { concluido: false, xp_ganho: 0 };
    }
    
    // Preencher com dados do banco
    progresso.forEach(item => {
      botoesCompletos[item.ordem] = {
        concluido: item.concluido === 1,
        xp_ganho: item.xp_ganho
      };
    });

    res.json({ botoesCompletos });
  } catch (error) {
    console.error('Erro ao buscar progresso dos botões:', error);
    res.status(500).json({ error: 'Erro ao buscar progresso dos botões.' });
  }
});

// GET /progresso/detalhado - Buscar progresso detalhado
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