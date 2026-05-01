const db = require('../config/database');

/**
 * Cria uma nova anotação para o usuário
 */
async function criarAnotacao(usuario_id, { versao, livro, capitulo, versiculo, texto_versiculo, texto_anotacao, visibilidade = 'private' }) {
  if (!versao || !livro || !capitulo || !versiculo || !texto_versiculo || !texto_anotacao) {
    throw new Error('Todos os campos são obrigatórios');
  }
  if (typeof capitulo !== 'number' || capitulo <= 0) {
    throw new Error('Capítulo deve ser um número positivo');
  }
  if (typeof versiculo !== 'number' || versiculo <= 0) {
    throw new Error('Versículo deve ser um número positivo');
  }
  if (!['public', 'private'].includes(visibilidade)) {
    throw new Error(`Visibilidade deve ser "public" ou "private", recebido: ${visibilidade}`);
  }

  try {
    const [result] = await db.query(
      `INSERT INTO Anotacoes 
       (usuario_id, versao, livro, capitulo, versiculo, texto_versiculo, texto_anotacao, visibilidade) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, versao, livro, capitulo, versiculo, texto_versiculo, texto_anotacao, visibilidade]
    );

    const [anotacao] = await db.query(
      `SELECT 
         id_anotacao AS id,
         usuario_id,
         versao,
         livro,
         capitulo,
         versiculo,
         texto_versiculo,
         texto_anotacao,
         visibilidade,
         criado_em
       FROM Anotacoes 
       WHERE id_anotacao = ?`,
      [result.insertId]
    );

    return anotacao[0];
  } catch (err) {
    throw new Error('Erro ao salvar anotação: ' + err.message);
  }
}

/**
 * Lista todas as anotações de um usuário
 */
async function listarAnotacoes(usuario_id, visibilidade) {
  try {
    let query = `
      SELECT 
         id_anotacao AS id,
         versao,
         livro,
         capitulo,
         versiculo,
         texto_versiculo,
         texto_anotacao,
         visibilidade,
         criado_em
       FROM Anotacoes
       WHERE usuario_id = ?
    `;
    const params = [usuario_id];

    if (visibilidade && ['public', 'private'].includes(visibilidade)) {
      query += ` AND visibilidade = ?`;
      params.push(visibilidade);
    }

    query += ` ORDER BY criado_em DESC`;

    const [anotacoes] = await db.query(query, params);
    return anotacoes;
  } catch (error) {
    throw new Error('Erro ao buscar anotações: ' + error.message);
  }
}

/**
 * Atualiza a visibilidade de uma anotação
 */
async function atualizarVisibilidadeAnotacao(id_anotacao, usuario_id, visibilidade) {
  console.log('Atualizando visibilidade:', { id_anotacao, usuario_id, visibilidade });
  if (!['public', 'private'].includes(visibilidade)) {
    throw new Error(`Visibilidade deve ser "public" ou "private", recebido: ${visibilidade}`);
  }

  try {
    const [anotacao] = await db.query(
      `SELECT usuario_id FROM Anotacoes WHERE id_anotacao = ?`,
      [id_anotacao]
    );

    if (anotacao.length === 0) {
      throw new Error('Anotação não encontrada');
    }
    if (anotacao[0].usuario_id !== usuario_id) {
      throw new Error('Usuário não autorizado para editar esta anotação');
    }

    await db.query(
      `UPDATE Anotacoes SET visibilidade = ? WHERE id_anotacao = ?`,
      [visibilidade, id_anotacao]
    );

    const [anotacaoAtualizada] = await db.query(
      `SELECT 
         id_anotacao AS id,
         usuario_id,
         versao,
         livro,
         capitulo,
         versiculo,
         texto_versiculo,
         texto_anotacao,
         visibilidade,
         criado_em
       FROM Anotacoes 
       WHERE id_anotacao = ?`,
      [id_anotacao]
    );

    return anotacaoAtualizada[0];
  } catch (err) {
    throw new Error('Erro ao atualizar visibilidade: ' + err.message);
  }
}

module.exports = {
  criarAnotacao,
  listarAnotacoes,
  atualizarVisibilidadeAnotacao
};