const bcrypt = require('bcryptjs');
const db = require('../config/database');

/**
 * Busca usuários com base em um termo de busca (ID, nome ou email)
 * @param {string|number} busca - Termo de busca
 * @returns {Promise<Array>} Lista de usuários
 */
async function buscarUsuarios(busca) {
  let sql = 'SELECT * FROM Usuarios WHERE 1=1';
  const params = [];

  if (busca) {
    if (!isNaN(busca)) {
      sql += ' AND id_usuario = ?';
      params.push(busca);
    } else {
      sql += ' AND (LOWER(nome) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?))';
      params.push(`%${busca}%`, `%${busca}%`);
    }
  }

  try {
    // CORRIGIDO: Removido .promise()
    const [results] = await db.query(sql, params);
    return results;
  } catch (err) {
    throw new Error('Erro ao buscar usuários: ' + err.message);
  }
}

/**
 * Busca informações públicas de um usuário por ID
 * @param {number} id - ID do usuário
 * @returns {Promise<Object>} Dados públicos do usuário
 */
async function buscarUsuarioPublico(id) {
  try {
    // CORRIGIDO: Removido .promise()
    const [results] = await db.query(
      'SELECT id_usuario, nome, email, xp_total, fase_atual, tipo, criado_em FROM Usuarios WHERE id_usuario = ?',
      [id]
    );
    if (results.length === 0) {
      throw new Error('Usuário não encontrado');
    }
    return results[0];
  } catch (err) {
    throw new Error('Erro ao buscar usuário: ' + err.message);
  }
}

/**
 * Busca um usuário por ID
 * @param {number} id - ID do usuário
 * @returns {Promise<Object>} Dados completos do usuário
 */
async function buscarUsuarioPorId(id) {
  try {
    // CORRIGIDO: Removido .promise()
    const [results] = await db.query('SELECT * FROM Usuarios WHERE id_usuario = ?', [id]);
    if (results.length === 0) {
      throw new Error('Usuário não encontrado');
    }
    return results[0];
  } catch (err) {
    throw new Error('Erro ao buscar usuário: ' + err.message);
  }
}

/**
 * Atualiza um usuário (admin)
 * @param {number} id - ID do usuário
 * @param {Object} dados - Dados a atualizar (nome, email, tipo, xp_total, fase_atual)
 * @returns {Promise<void>}
 */
async function atualizarUsuario(id, { nome, email, tipo, xp_total, fase_atual }) {
  if (!nome || !email || !tipo || !xp_total || !fase_atual) {
    throw new Error('Preencha todos os campos');
  }

  try {
    // CORRIGIDO: Removido .promise()
    const [result] = await db.query(
      'UPDATE Usuarios SET nome = ?, email = ?, tipo = ?, xp_total = ?, fase_atual = ? WHERE id_usuario = ?',
      [nome, email, tipo, xp_total, fase_atual, id]
    );
    if (result.affectedRows === 0) {
      throw new Error('Usuário não encontrado');
    }
  } catch (err) {
    throw new Error('Erro ao editar usuário: ' + err.message);
  }
}

/**
 * Atualiza o perfil do usuário autenticado
 * @param {number} usuario_id - ID do usuário
 * @param {Object} dados - Dados a atualizar (nome, email, senha) - todos opcionais
 * @returns {Promise<Object>} Campos atualizados
 */
async function atualizarPerfil(usuario_id, { nome, email, senha }) {
  // 🔥 CORREÇÃO: Verificar se pelo menos um campo foi enviado
  if (!nome && !email && !senha) {
    throw new Error('Pelo menos um campo (nome, email ou senha) deve ser enviado para atualização');
  }

  try {
    // Buscar dados atuais do usuário
    const [currentUser] = await db.query(
      'SELECT nome, email FROM Usuarios WHERE id_usuario = ?', 
      [usuario_id]
    );
    
    if (currentUser.length === 0) {
      throw new Error('Usuário não encontrado');
    }

    const updates = [];
    const queryParams = [];

    // Validar e adicionar nome se foi enviado
    if (nome) {
      if (nome.trim().length < 2) {
        throw new Error('O nome deve ter pelo menos 2 caracteres');
      }
      updates.push('nome = ?');
      queryParams.push(nome.trim());
    }

    // Validar e adicionar email se foi enviado
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Email inválido');
      }
      
      // Verificar se email já está em uso por outro usuário
      const [existingUser] = await db.query(
        'SELECT id_usuario FROM Usuarios WHERE email = ? AND id_usuario != ?',
        [email, usuario_id]
      );
      if (existingUser.length > 0) {
        throw new Error('Este email já está em uso por outro usuário');
      }
      updates.push('email = ?');
      queryParams.push(email);
    }

    // Validar e adicionar senha se foi enviada
    if (senha) {
      if (senha.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres');
      }
      const hashedPassword = await bcrypt.hash(senha, 10);
      updates.push('senha = ?');
      queryParams.push(hashedPassword);
    }

    // Se não há nada para atualizar
    if (updates.length === 0) {
      throw new Error('Nenhum dado válido para atualizar');
    }

    // Adicionar o ID do usuário no final
    queryParams.push(usuario_id);
    
    // Montar e executar a query
    const updateQuery = `UPDATE Usuarios SET ${updates.join(', ')} WHERE id_usuario = ?`;
    const [result] = await db.query(updateQuery, queryParams);

    if (result.affectedRows === 0) {
      throw new Error('Usuário não encontrado');
    }

    // Retornar quais campos foram atualizados
    const updatedFields = [];
    if (nome) updatedFields.push('nome');
    if (email) updatedFields.push('email');
    if (senha) updatedFields.push('senha');

    return { updatedFields };
    
  } catch (error) {
    throw new Error('Erro ao atualizar perfil: ' + error.message);
  }
}

module.exports = {
  buscarUsuarios,
  buscarUsuarioPublico,
  buscarUsuarioPorId,
  atualizarUsuario,
  atualizarPerfil
};