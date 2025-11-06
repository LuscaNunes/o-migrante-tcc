// middleware/auth.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

// 🛑 IMPORTANTE: Você precisará adaptar a importação e a função abaixo
// Se você tiver um módulo de banco de dados (ex: 'db'), importe-o aqui.
const db = require('../config/database');

// 🎯 Funções auxiliares para interagir com o DB (Você precisa adaptar ou importar)
// Esta função é CRUCIAL para buscar o nome!
async function getUserById(id) {
  try {
    // ASSUMIMOS QUE VOCÊ TEM UMA TABELA 'USUARIOS'
    const [rows] = await db.query('SELECT nome, email, tipo FROM usuarios WHERE id_usuario = ?', [id]); if (rows.length > 0) {
      // Retorna o objeto completo do usuário
      return rows[0];
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar usuário por ID no middleware:", error);
    return null;
  }
}


function authenticateToken(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    console.log('Token não fornecido');
    return res.status(401).json({ success: false, message: 'Token não fornecido.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
    if (err) {
      console.log('Token inválido ou expirado:', err.message);
      res.clearCookie('token');
      return res.status(403).json({ success: false, message: 'Token inválido ou expirado.' });
    }

    // O token foi verificado. Agora, usamos o ID contido nele para buscar o nome no DB.
    const userDetails = await getUserById(decodedToken.id);

    if (!userDetails) {
      console.log('Usuário não encontrado no DB para ID:', decodedToken.id);
      // Se o usuário não existir mais, invalida o token
      res.clearCookie('token');
      return res.status(404).json({ success: false, message: 'Usuário associado ao token não encontrado.' });
    }

    // 🎯 Popula req.user com TODAS as informações necessárias
    // ATENÇÃO: req.user agora contém { id, tipo, nome, email, ... }
    req.user = {
      id: decodedToken.id, // ID do token
      tipo: userDetails.tipo, // Tipo do DB (ou do token, se for o caso)
      nome: userDetails.nome, // NOME DO DB
      email: userDetails.email, // Email do DB
      // Você pode incluir mais campos aqui conforme precisar no Painel.ejs
    };

    console.log('Token válido. req.user populado com:', req.user.nome, req.user.tipo);
    next();
  });
}

function checkAdmin(req, res, next) {
  // Note: Usamos req.user.tipo que agora vem do DB/token
  if (!req.user || req.user.tipo !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acesso restrito a administradores.' });
  }
  next();
}

module.exports = { authenticateToken, checkAdmin, getUserById };