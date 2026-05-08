const db = require('../config/database');

/**
 * Busca o ranking global de usuários ordenados por XP total
 * @param {number} limit - Quantidade de usuários a retornar (padrão: 50)
 * @returns {Promise<Array>} Lista de usuários com posição e dados
 */
async function getRankingGlobal(limit = 50) {
  try {
    const [rows] = await db.query(`
      SELECT 
        id_usuario,
        nome,
        email,
        xp_total,
        tipo,
        criado_em,
        @row_number := @row_number + 1 AS posicao
      FROM Usuarios, (SELECT @row_number := 0) AS vars
      WHERE tipo = 'user' OR tipo = 'admin'
      ORDER BY xp_total DESC, id_usuario ASC
      LIMIT ?
    `, [limit]);

    return rows;
  } catch (error) {
    throw new Error('Erro ao buscar ranking global: ' + error.message);
  }
}

/**
 * Busca a posição específica de um usuário no ranking
 * @param {number} usuario_id - ID do usuário
 * @returns {Promise<Object>} Posição do usuário
 */
async function getUserRankPosition(usuario_id) {
  try {
    const [rows] = await db.query(`
      SELECT COUNT(*) + 1 AS posicao
      FROM Usuarios
      WHERE xp_total > (SELECT xp_total FROM Usuarios WHERE id_usuario = ?)
      AND (tipo = 'user' OR tipo = 'admin')
    `, [usuario_id]);

    return { posicao: rows[0]?.posicao || 1 };
  } catch (error) {
    throw new Error('Erro ao buscar posição do usuário: ' + error.message);
  }
}

/**
 * Busca os top usuários por nível concluído
 * @param {number} nivelId - ID do nível específico (opcional)
 * @param {number} limit - Quantidade de usuários
 * @returns {Promise<Array>} Lista de usuários que mais completaram níveis
 */
async function getRankingNiveisCompletos(limit = 20) {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.id_usuario,
        u.nome,
        u.xp_total,
        COUNT(p.concluido) AS niveis_completos
      FROM Usuarios u
      LEFT JOIN ProgressoUsuario p ON u.id_usuario = p.usuario_id AND p.concluido = true
      WHERE u.tipo = 'user' OR u.tipo = 'admin'
      GROUP BY u.id_usuario
      ORDER BY niveis_completos DESC, u.xp_total DESC
      LIMIT ?
    `, [limit]);

    return rows;
  } catch (error) {
    throw new Error('Erro ao buscar ranking por níveis: ' + error.message);
  }
}

/**
 * Busca os usuários com maior progresso semanal (XP ganho nos últimos 7 dias)
 * @param {number} limit - Quantidade de usuários
 * @returns {Promise<Array>} Lista de usuários com XP semanal
 */
async function getRankingSemanal(limit = 20) {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.id_usuario,
        u.nome,
        u.xp_total,
        COALESCE(SUM(p.xp_ganho), 0) AS xp_semana
      FROM Usuarios u
      LEFT JOIN ProgressoUsuario p ON u.id_usuario = p.usuario_id 
        AND p.criado_em >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      WHERE u.tipo = 'user' OR u.tipo = 'admin'
      GROUP BY u.id_usuario
      ORDER BY xp_semana DESC, u.xp_total DESC
      LIMIT ?
    `, [limit]);

    return rows;
  } catch (error) {
    throw new Error('Erro ao buscar ranking semanal: ' + error.message);
  }
}

/**
 * Busca estatísticas gerais do ranking
 * @returns {Promise<Object>} Estatísticas
 */
async function getRankingStats() {
  try {
    const [totalUsuarios] = await db.query(`
      SELECT COUNT(*) as total FROM Usuarios WHERE tipo = 'user' OR tipo = 'admin'
    `);
    
    const [totalXP] = await db.query(`
      SELECT SUM(xp_total) as total FROM Usuarios WHERE tipo = 'user' OR tipo = 'admin'
    `);
    
    const [mediaXP] = await db.query(`
      SELECT AVG(xp_total) as media FROM Usuarios WHERE tipo = 'user' OR tipo = 'admin'
    `);
    
    return {
      totalUsuarios: totalUsuarios[0]?.total || 0,
      totalXP: totalXP[0]?.total || 0,
      mediaXP: Math.round(mediaXP[0]?.media || 0)
    };
  } catch (error) {
    throw new Error('Erro ao buscar estatísticas: ' + error.message);
  }
}

module.exports = {
  getRankingGlobal,
  getUserRankPosition,
  getRankingNiveisCompletos,
  getRankingSemanal,
  getRankingStats
};