const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticateToken, checkAdmin } = require('../middleware/auth');
const db = require('../config/database'); // db aqui é o Pool de Conexões (já promise-enabled)
const router = express.Router();

/**
 * Rota para listar ou buscar usuários (filtro por ID, nome ou email)
 * GET /usuarios
 * Requer autenticação e permissão de admin
 * Se 'busca' for fornecido, filtra. Caso contrário, lista todos. (NOVA LÓGICA)
 */
router.get('/', authenticateToken, checkAdmin, async (req, res) => {
	const { busca } = req.query;

	let sql = 'SELECT * FROM Usuarios'; // Query padrão: lista todos
	const params = [];

	if (busca) {
		// Se houver um termo de busca, adiciona a cláusula WHERE e os filtros.
		sql += ' WHERE 1=1'; 

		if (!isNaN(busca)) {
			// Busca por ID
			sql += ' AND id_usuario = ?';
			params.push(busca);
		} else {
			// Busca por nome ou email (case-insensitive)
			sql += ' AND (LOWER(nome) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?))';
			params.push(`%${busca}%`, `%${busca}%`);
		}
	}

	try {
		// Executa a consulta com ou sem filtros.
		const [rows] = await db.execute(sql, params);
		res.json({ usuarios: rows });
	} catch (err) {
		console.error('Erro ao buscar ou listar usuários:', err);
		res.status(500).json({ error: 'Erro ao buscar ou listar usuários.' });
	}
});

/**
 * Rota para buscar informações públicas de um usuário
 * GET /usuarios/public/:id
 * Requer autenticação
 */
router.get('/public/:id', authenticateToken, async (req, res) => {
	try {
		// CORRIGIDO: Removido .promise()
		const [results] = await db.query(
			'SELECT id_usuario, nome, email, xp_total, fase_atual, tipo, criado_em FROM Usuarios WHERE id_usuario = ?',
			[req.params.id]
		);
		if (results.length === 0) {
			return res.status(404).json({ error: 'Usuário não encontrado.' });
		}
		res.json(results[0]);
	} catch (err) {
		console.error('Erro ao buscar usuário:', err);
		res.status(500).json({ error: 'Erro ao buscar usuário.' });
	}
});

/**
 * Rota para atualizar o perfil do usuário autenticado
 * PUT /usuarios/atualizar
 * Requer autenticação
 * Aceita atualização parcial (apenas os campos enviados)
 */
router.put('/atualizar', authenticateToken, async (req, res) => {
  console.log('=== ROTA /atualizar ACIONADA ===');
  console.log('Headers:', req.headers);
  console.log('Body recebido:', req.body);
  console.log('Usuário ID:', req.user?.id);
  console.log('Usuário nome:', req.user?.nome);
  
  const { nome, email, senha } = req.body;
  const usuario_id = req.user.id;

  console.log('Dados extraídos:', { nome, email, senha: senha ? '***' : undefined });

  // Verificar se pelo menos um campo foi enviado
  if (!nome && !email && !senha) {
    console.log('ERRO: Nenhum campo enviado');
    return res.status(400).json({ 
      success: false, 
      message: 'Pelo menos um campo (nome, email ou senha) deve ser enviado para atualização.' 
    });
  }

  try {
    // Buscar dados atuais do usuário
    const [currentUser] = await db.query(
      'SELECT nome, email FROM Usuarios WHERE id_usuario = ?', 
      [usuario_id]
    );
    
    if (currentUser.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    // Construir a query dinamicamente baseada nos campos enviados
    const updates = [];
    const queryParams = [];

    // Validar e adicionar nome se foi enviado
    if (nome) {
      if (nome.trim().length < 2) {
        return res.status(400).json({ 
          success: false, 
          message: 'O nome deve ter pelo menos 2 caracteres.' 
        });
      }
      updates.push('nome = ?');
      queryParams.push(nome.trim());
    }

    // Validar e adicionar email se foi enviado
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Email inválido.' });
      }
      
      // Verificar se email já está em uso por outro usuário
      const [existingUser] = await db.query(
        'SELECT id_usuario FROM Usuarios WHERE email = ? AND id_usuario != ?',
        [email, usuario_id]
      );
      if (existingUser.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Este email já está em uso por outro usuário.' 
        });
      }
      updates.push('email = ?');
      queryParams.push(email);
    }

    // Validar e adicionar senha se foi enviada
    if (senha) {
      if (senha.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'A senha deve ter pelo menos 6 caracteres.' 
        });
      }
      const hashedPassword = await bcrypt.hash(senha, 10);
      updates.push('senha = ?');
      queryParams.push(hashedPassword);
    }

    // Se não há nada para atualizar
    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nenhum dado válido para atualizar.' 
      });
    }

    // Adicionar o ID do usuário no final
    queryParams.push(usuario_id);
    
    // Montar e executar a query
    const updateQuery = `UPDATE Usuarios SET ${updates.join(', ')} WHERE id_usuario = ?`;
    const [result] = await db.query(updateQuery, queryParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    // Retornar quais campos foram atualizados
    const updatedFields = [];
    if (nome) updatedFields.push('nome');
    if (email) updatedFields.push('email');
    if (senha) updatedFields.push('senha');

    res.json({ 
      success: true, 
      message: `Perfil atualizado com sucesso! Campo(s) atualizado(s): ${updatedFields.join(', ')}`,
      updatedFields
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar perfil. Tente novamente mais tarde.' 
    });
  }
});


/**
 * Rota para buscar um usuário por ID
 * GET /usuarios/:id
 * Requer autenticação e permissão de admin
 */
router.get('/:id', authenticateToken, checkAdmin, async (req, res) => {
	try {
		// CORRIGIDO: Removido .promise()
		const [results] = await db.query('SELECT * FROM Usuarios WHERE id_usuario = ?', [req.params.id]);
		if (results.length === 0) {
			return res.status(404).send('Usuário não encontrado.');
		}
		res.send(results[0]);
	} catch (err) {
		console.error('Erro ao buscar usuário:', err);
		res.status(500).send('Erro ao buscar usuário.');
	}
});


/**
 * Rota para atualizar um usuário
 * PUT /usuarios/:id
 * Requer autenticação e permissão de admin
 */
router.put('/:id', authenticateToken, checkAdmin, async (req, res) => {
	const { nome, email, tipo, xp_total, fase_atual } = req.body;

	if (!nome || !email || !tipo || !xp_total || !fase_atual) {
		return res.status(400).json({ success: false, message: 'Preencha todos os campos.' });
	}

	try {
		// CORRIGIDO: Removido .promise()
		const [result] = await db.query(
			'UPDATE Usuarios SET nome = ?, email = ?, tipo = ?, xp_total = ?, fase_atual = ? WHERE id_usuario = ?',
			[nome, email, tipo, xp_total, fase_atual, req.params.id]
		);
		if (result.affectedRows === 0) {
			return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
		}
		res.json({ success: true, message: 'Usuário atualizado com sucesso!' });
	} catch (err) {
		console.error('Erro ao editar usuário:', err);
		res.status(500).json({ success: false, message: 'Erro ao editar usuário.' });
	}
});



/**
 * Rota para buscar o perfil do usuário autenticado
 * GET /usuarios/perfil
 * Requer autenticação
 */
router.get('/perfil', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id_usuario, nome, email, tipo, xp_total, fase_atual, criado_em FROM Usuarios WHERE id_usuario = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }
    res.json({ success: true, usuario: rows[0] });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar perfil' });
  }
});
// REMOVIDO: A rota /app/painel foi removida por estar fora de lugar aqui (já está em server.js).

/**
 * Rota para deletar um usuário
 * DELETE /usuarios/:id
 * Requer autenticação e permissão de admin
 */
router.delete('/:id', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const usuarioId = req.params.id;
    
    // Verificar se o usuário existe
    const [check] = await db.query('SELECT id_usuario, nome, tipo FROM Usuarios WHERE id_usuario = ?', [usuarioId]);
    
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }
    
    // Impedir admin de deletar a si mesmo
    if (parseInt(usuarioId) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Você não pode deletar seu próprio usuário.' });
    }
    
    // 🔥 INICIAR TRANSAÇÃO (para garantir consistência)
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. Deletar registros relacionados primeiro (ON DELETE CASCADE vai cuidar da maioria)
      // Mas por segurança, deletamos explicitamente
      
      await connection.query('DELETE FROM ProgressoUsuario WHERE usuario_id = ?', [usuarioId]);
      await connection.query('DELETE FROM Amizades WHERE id_usuario1 = ? OR id_usuario2 = ?', [usuarioId, usuarioId]);
      await connection.query('DELETE FROM Curtidas WHERE usuario_id = ?', [usuarioId]);
      await connection.query('DELETE FROM Comentarios WHERE usuario_id = ?', [usuarioId]);
      await connection.query('DELETE FROM Anotacoes WHERE usuario_id = ?', [usuarioId]);
      await connection.query('DELETE FROM perguntas WHERE usuario_id = ?', [usuarioId]);
      await connection.query('DELETE FROM niveis WHERE usuario_id = ?', [usuarioId]);
      await connection.query('DELETE FROM mensagensdiarias WHERE usuario_id = ?', [usuarioId]);
      
      // 2. Finalmente deletar o usuário
      const [result] = await connection.query('DELETE FROM Usuarios WHERE id_usuario = ?', [usuarioId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Usuário não encontrado durante deleção');
      }
      
      // Commit da transação
      await connection.commit();
      
      res.json({ success: true, message: 'Usuário e todos os seus dados foram deletados com sucesso!' });
      
    } catch (err) {
      // Rollback em caso de erro
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
    
  } catch (err) {
    console.error('Erro ao deletar usuário:', err);
    res.status(500).json({ success: false, message: 'Erro ao deletar usuário: ' + err.message });
  }
});

module.exports = router;