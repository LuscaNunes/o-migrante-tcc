const db = require('../config/database'); // JÁ É um pool com Promise

/**
 * Cadastra um novo nível
 * @param {number} usuario_id - ID do usuário
 * @param {Object} dados - Dados do nível (titulo, descricao, xp_total)
 * @returns {Promise<number>} ID do nível cadastrado
 */
async function cadastrarNivel(usuario_id, { titulo, descricao, xp_total }) {
  if (!titulo || !descricao || !xp_total) {
    throw new Error('Preencha todos os campos');
  }

  try {
    const sql = 'INSERT INTO niveis (titulo, descricao, xp_total, usuario_id) VALUES (?, ?, ?, ?)';
    const [result] = await db.query(sql, [titulo, descricao, xp_total, usuario_id]);
    return result.insertId;
  } catch (err) {
    throw new Error('Erro ao cadastrar nível: ' + err.message);
  }
}

/**
 * Busca níveis com base em um termo de busca (ID, título ou descrição)
 * @param {string|number} busca - Termo de busca
 * @returns {Promise<Array>} Lista de níveis
 */
async function buscarNiveis(busca) {
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
    return results;
  } catch (err) {
    throw new Error('Erro ao buscar níveis: ' + err.message);
  }
}

/**
 * Busca um nível por ID
 * @param {number} id - ID do nível
 * @returns {Promise<Object>} Dados do nível
 */
async function buscarNivelPorId(id) {
  const nivelId = parseInt(id);
  if (!nivelId || isNaN(nivelId)) {
    throw new Error('ID do nível inválido');
  }

  try {
    const [results] = await db.query('SELECT * FROM niveis WHERE id = ?', [nivelId]);
    if (results.length === 0) {
      throw new Error('Nível não encontrado');
    }
    return results[0];
  } catch (err) {
    throw new Error('Erro ao buscar nível: ' + err.message);
  }
}

/**
 * Atualiza um nível
 * @param {number} id - ID do nível
 * @param {Object} dados - Dados a atualizar (titulo, descricao, xp_total)
 * @returns {Promise<void>}
 */
async function atualizarNivel(id, { titulo, descricao, xp_total }) {
  const nivelId = parseInt(id);
  
  if (!titulo || !descricao || !xp_total) {
    throw new Error('Preencha todos os campos');
  }

  try {
    const [results] = await db.query('SELECT * FROM niveis WHERE id = ?', [nivelId]);
    if (results.length === 0) {
      throw new Error('Nível não encontrado');
    }

    const updateNivelSql = `
      UPDATE niveis 
      SET titulo = ?, descricao = ?, xp_total = ?
      WHERE id = ?
    `;
    await db.query(updateNivelSql, [titulo, descricao, xp_total, nivelId]);
  } catch (err) {
    throw new Error('Erro ao editar nível: ' + err.message);
  }
}

/**
 * Ativa ou desativa um nível
 * @param {number} id - ID do nível
 * @param {boolean} ativo - Estado ativo/inativo
 * @param {number} posicao - Posição (obrigatória se ativo=true)
 * @returns {Promise<void>}
 */
async function ativarNivel(id, ativo, posicao) {
  const nivelId = parseInt(id);
  
  if (ativo === undefined) {
    throw new Error('O campo "ativo" é obrigatório');
  }

  // Obter conexão para transação
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const [results] = await connection.query('SELECT * FROM niveis WHERE id = ?', [nivelId]);
    if (results.length === 0) {
      throw new Error('Nível não encontrado');
    }

    const nivel = results[0];

    if (!ativo) {
      // Desativar nível
      await connection.query('UPDATE niveis SET ativo = false, posicao = NULL WHERE id = ?', [nivelId]);
      if (nivel.posicao) {
        await connection.query('UPDATE niveis SET posicao = posicao - 1 WHERE posicao > ? AND ativo = true', [nivel.posicao]);
      }
    } else {
      if (!posicao || posicao <= 0) {
        throw new Error('Informe uma posição válida');
      }

      // Verificar se já existe nível na posição
      const [posicaoResults] = await connection.query('SELECT id FROM niveis WHERE posicao = ? AND ativo = true', [posicao]);
      if (posicaoResults.length > 0) {
        // Deslocar níveis para abrir espaço
        await connection.query('UPDATE niveis SET posicao = posicao + 1 WHERE posicao >= ? AND ativo = true', [posicao]);
      }
      
      // Ativar nível na nova posição
      await connection.query('UPDATE niveis SET ativo = true, posicao = ? WHERE id = ?', [posicao, nivelId]);
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw new Error('Erro ao processar solicitação: ' + err.message);
  } finally {
    connection.release();
  }
}

/**
 * Busca níveis ativos ordenados por posição
 * @returns {Promise<Array>} Lista de níveis ativos
 */
async function buscarNiveisAtivos() {
  try {
    const [results] = await db.query('SELECT * FROM niveis WHERE ativo = true ORDER BY posicao ASC');
    return results;
  } catch (err) {
    throw new Error('Erro ao buscar níveis ativos: ' + err.message);
  }
}

/**
 * Exclui um nível e todos os seus dados relacionados
 * @param {number} id - ID do nível
 * @returns {Promise<void>}
 */
async function excluirNivel(id) {
  const nivelId = parseInt(id);
  
  if (!nivelId || isNaN(nivelId)) {
    throw new Error('ID do nível inválido');
  }

  // Obter conexão para transação
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Verificar se o nível existe
    const [nivelCheck] = await connection.query('SELECT id FROM niveis WHERE id = ?', [nivelId]);
    if (nivelCheck.length === 0) {
      throw new Error('Nível não encontrado');
    }

    // 1. Deletar registros de progresso dos usuários (progressousuario)
    await connection.query('DELETE FROM ProgressoUsuario WHERE nivel_id = ?', [nivelId]);
    
    // 2. Deletar perguntas do tipo Quiz
    await connection.query('DELETE FROM perguntas WHERE nivel_id = ?', [nivelId]);
    
    // 3. Deletar perguntas do tipo Complete a Frase
    await connection.query('DELETE FROM perguntas_completar WHERE nivel_id = ?', [nivelId]);
    
    // 4. Finalmente deletar o nível
    const [result] = await connection.query('DELETE FROM niveis WHERE id = ?', [nivelId]);
    
    if (result.affectedRows === 0) {
      throw new Error('Nível não encontrado durante deleção');
    }
    
    // Commit da transação
    await connection.commit();
    
  } catch (err) {
    // Rollback em caso de erro
    await connection.rollback();
    throw new Error('Erro ao excluir nível: ' + err.message);
  } finally {
    connection.release();
  }
}

module.exports = {
  cadastrarNivel,
  buscarNiveis,
  buscarNivelPorId,
  atualizarNivel,
  ativarNivel,
  buscarNiveisAtivos,
  excluirNivel
};