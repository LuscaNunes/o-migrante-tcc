// middleware/auth.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticateToken(req, res, next) {
  // 🛑 MUDANÇA CRUCIAL: Tenta obter o token do cookie chamado 'token'
  const token = req.cookies.token; 

  if (!token) {
    console.log('Token não fornecido');
    // Esta mensagem aparece quando se tenta acessar a página protegida (/app/Painel.html)
    return res.status(401).json({ success: false, message: 'Token não fornecido.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token inválido ou expirado:', err.message);
      // Se houver erro, limpa o cookie expirado (opcional, mas bom)
      res.clearCookie('token'); 
      return res.status(403).json({ success: false, message: 'Token inválido ou expirado.' });
    }
    console.log('Token válido:', user);
    req.user = user; // user contém { id, tipo, iat, exp }
    next();
  });
}

function checkAdmin(req, res, next) {
  if (req.user.tipo !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acesso restrito a administradores.' });
  }
  next();
}

module.exports = { authenticateToken, checkAdmin };