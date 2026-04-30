const express = require('express');
const { authenticateToken, checkAdmin } = require('../middleware/auth');
const db = require('../config/database'); // JÁ É um pool com Promise
const router = express.Router();

/**
 * Rota para cadastrar níveis
 * POST /niveis
 * Requer autenticação
 */
router.post('/', authenticateToken, async (req, res) => {
  const { titulo, descricao, xp_total, posicao, requisito_xp, ativo } = req.body;
  const usuario_id = req.user.id;

  if (!titulo || !descricao || !xp_total) {
    return res.status(400).json({ success: false, message: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    const sql = 'INSERT INTO niveis (titulo, descricao, xp_total, posicao, requisito_xp, ativo, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const [result] = await db.query(sql, [titulo, descricao, xp_total, posicao || null, requisito_xp || 0, ativo !== undefined ? ativo : 1, usuario_id]);
    res.json({ success: true, message: 'Nível cadastrado com sucesso!', id: result.insertId });
  } catch (err) {
    console.error('Erro ao cadastrar nível:', err);
    res.status(500).json({ success: false, message: 'Erro ao cadastrar nível.' });
  }
});

/**
 * Rota para buscar níveis (filtro por ID, título ou descrição)
 * GET /niveis
 * Requer autenticação
 */
router.get('/', authenticateToken, async (req, res) => {
  const { busca } = req.query;
  let sql = 'SELECT * FROM niveis WHERE 1=1';
  const params = [];

  if (busca) {
    if (!isNaN(busca)) {
      sql += ' AND id = ?';
      params.push(parseInt(busca));
    } else {
      sql += ' AND (LOWER(titulo) LIKE LOWER(?) OR LOWER(descricao) LIKE LOWER(?))';
      params.push(`%${busca}%`, `%${busca}%`);
    }
  }

  sql += ' ORDER BY posicao ASC, id ASC';

  try {
    const [results] = await db.query(sql, params);
    res.json({ niveis: results });
  } catch (err) {
    console.error('Erro ao buscar níveis:', err);
    res.status(500).json({ error: 'Erro ao buscar níveis.' });
  }
});

/**
 * Rota para buscar um nível por ID
 * GET /niveis/:id
 * Requer autenticação
 */
router.get('/:id', authenticateToken, async (req, res) => {
  const nivelId = parseInt(req.params.id);
  console.log('Buscando nível com ID:', nivelId);

  if (!nivelId || isNaN(nivelId)) {
    console.error('ID do nível inválido:', nivelId);
    return res.status(400).json({ error: 'ID do nível inválido.' });
  }

  try {
    const [results] = await db.query('SELECT * FROM niveis WHERE id = ?', [nivelId]);
    if (results.length === 0) {
      console.error('Nível não encontrado para ID:', nivelId);
      return res.status(404).json({ error: 'Nível não encontrado.' });
    }
    console.log('Nível encontrado:', results[0]);
    res.json(results[0]);
  } catch (err) {
    console.error('Erro ao buscar nível:', err);
    res.status(500).json({ error: 'Erro ao buscar nível.' });
  }
});

/**
 * Rota para editar um nível
 * PUT /niveis/:id
 * Requer autenticação
 */
router.put('/:id', authenticateToken, async (req, res) => {
  const nivelId = parseInt(req.params.id);
  const { titulo, descricao, xp_total, posicao, requisito_xp, ativo } = req.body;

  if (!titulo || !descricao || !xp_total) {
    return res.status(400).json({ success: false, message: 'Preencha todos os campos.' });
  }

  try {
    const [results] = await db.query('SELECT * FROM niveis WHERE id = ?', [nivelId]);
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Nível não encontrado.' });
    }

    const updateNivelSql = `
      UPDATE niveis 
      SET titulo = ?, descricao = ?, xp_total = ?, posicao = ?, requisito_xp = ?, ativo = ?
      WHERE id = ?
    `;
    await db.query(updateNivelSql, [titulo, descricao, xp_total, posicao || null, requisito_xp || 0, ativo !== undefined ? ativo : 1, nivelId]);
    res.json({ success: true, message: 'Nível atualizado com sucesso!' });
  } catch (err) {
    console.error('Erro ao editar nível:', err);
    res.status(500).json({ success: false, message: 'Erro ao editar nível.' });
  }
});

/**
 * Rota para ativar/desativar um nível
 * PUT /niveis/:id/ativar
 * Requer autenticação
 */
router.put('/:id/ativar', authenticateToken, async (req, res) => {
  const nivelId = parseInt(req.params.id);
  const { ativo, posicao } = req.body;

  if (ativo === undefined) {
    return res.status(400).json({ error: 'O campo "ativo" é obrigatório.' });
  }

  // Iniciar transação
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const [results] = await connection.query('SELECT * FROM niveis WHERE id = ?', [nivelId]);
    if (results.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Nível não encontrado.' });
    }

    const nivel = results[0];

    if (!ativo) {
      // Desativar nível
      await connection.query('UPDATE niveis SET ativo = false, posicao = NULL WHERE id = ?', [nivelId]);
      if (nivel.posicao) {
        await connection.query('UPDATE niveis SET posicao = posicao - 1 WHERE posicao > ?', [nivel.posicao]);
      }
      await connection.commit();
      connection.release();
      res.json({ success: true, message: 'Nível desativado com sucesso!' });
    } else {
      // Ativar nível
      if (!posicao || posicao <= 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'Informe uma posição válida.' });
      }

      // Deslocar níveis para abrir espaço
      await connection.query('UPDATE niveis SET posicao = posicao + 1 WHERE posicao >= ? AND ativo = true', [posicao]);
      
      // Ativar nível na nova posição
      await connection.query('UPDATE niveis SET ativo = true, posicao = ? WHERE id = ?', [posicao, nivelId]);
      
      await connection.commit();
      connection.release();
      res.json({ success: true, message: `Nível ativado com sucesso na posição ${posicao}!` });
    }
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('Erro ao processar solicitação:', err);
    res.status(500).json({ error: 'Erro ao processar solicitação.' });
  }
});

/**
 * Rota para buscar níveis ativos ordenados por posição
 * GET /niveis/ativos
 * Acessível sem autenticação
 */
router.get('/ativos', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM niveis WHERE ativo = true ORDER BY posicao ASC');
    res.json({ niveis: results });
  } catch (err) {
    console.error('Erro ao buscar níveis ativos:', err);
    res.status(500).json({ error: 'Erro ao buscar níveis ativos.' });
  }
});

/**
 * Rota para excluir um nível
 * DELETE /niveis/:id
 * Requer autenticação
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  const nivelId = parseInt(req.params.id);

  try {
    // Primeiro excluir perguntas relacionadas
    await db.query('DELETE FROM perguntas WHERE nivel_id = ?', [nivelId]);
    // Depois excluir o nível
    const [result] = await db.query('DELETE FROM niveis WHERE id = ?', [nivelId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Nível não encontrado.' });
    }

    res.json({ success: true, message: 'Nível excluído com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir nível:', err);
    res.status(500).json({ success: false, message: 'Erro ao excluir nível.' });
  }
});

module.exports = router;