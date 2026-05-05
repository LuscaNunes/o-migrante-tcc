const db = require('../config/database');

async function salvarProgresso(usuario_id, { nivel_id, xp_ganho, ordem }) {
  if (!nivel_id || !xp_ganho || !ordem || isNaN(nivel_id) || isNaN(xp_ganho) || isNaN(ordem)) {
    throw new Error('Parâmetros inválidos');
  }
  if (ordem < 1 || ordem > 12) {
    throw new Error('Ordem deve estar entre 1 e 12');
  }

  try {
    await db.beginTransaction();

    const [nivelRows] = await db.query('SELECT id FROM niveis WHERE id = ?', [nivel_id]);
    if (nivelRows.length === 0) {
      await db.rollback();
      throw new Error('Nível não encontrado');
    }

    const [progressoRows] = await db.query(
      'SELECT xp_ganho, ordem FROM ProgressoUsuario WHERE usuario_id = ? AND nivel_id = ? AND ordem = ?',
      [usuario_id, nivel_id, ordem]
    );

    let novoXpGanho = xp_ganho;
    const concluido = xp_ganho > 0 ? 1 : 0;

    if (progressoRows.length > 0) {
      novoXpGanho = progressoRows[0].xp_ganho + xp_ganho;
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
      await db.query('UPDATE Usuarios SET xp_total = xp_total + ? WHERE id_usuario = ?', [xp_ganho, usuario_id]);
    }

    await db.commit();
    return { xp_ganho: novoXpGanho, ordem };
  } catch (error) {
    await db.rollback();
    throw new Error('Erro ao salvar progresso: ' + error.message);
  }
}

async function buscarProgressoBotoes(usuario_id, nivel_id) {
  try {
    const [progresso] = await db.query(
      `SELECT ordem, concluido, xp_ganho FROM ProgressoUsuario 
       WHERE usuario_id = ? AND nivel_id = ? ORDER BY ordem ASC`,
      [usuario_id, nivel_id]
    );

    const botoesCompletos = {};
    progresso.forEach(item => {
      botoesCompletos[item.ordem] = { concluido: item.concluido, xp_ganho: item.xp_ganho };
    });
    return botoesCompletos;
  } catch (error) {
    throw new Error('Erro ao buscar progresso dos botões: ' + error.message);
  }
}

async function buscarProgressoDetalhado(usuario_id) {
  try {
    const [progresso] = await db.query(
      `SELECT nivel_id, COUNT(*) AS perguntas_completas
       FROM ProgressoUsuario
       WHERE usuario_id = ? AND concluido = true
       GROUP BY nivel_id`,
      [usuario_id]
    );

    return progresso.reduce((map, item) => {
      map[item.nivel_id] = item.perguntas_completas;
      return map;
    }, {});
  } catch (error) {
    throw new Error('Erro ao buscar progresso detalhado: ' + error.message);
  }
}

module.exports = { salvarProgresso, buscarProgressoBotoes, buscarProgressoDetalhado };