const express = require('express');
const router = express.Router();

// Rota para listar anotações públicas
router.get('/publicas', async (req, res) => {
  try {
    // ❌ REMOVA o .promise()
    const [anotacoes] = await db.query(
      `SELECT 
         a.id_anotacao AS id,
         a.versao,
         a.livro,
         a.capitulo,
         a.versiculo,
         a.texto_versiculo,
         a.texto_anotacao,
         a.visibilidade,
         a.criado_em,
         u.nome AS autor
       FROM Anotacoes a
       JOIN Usuarios u ON a.usuario_id = u.id_usuario
       WHERE a.visibilidade = 'public'
       ORDER BY a.criado_em DESC`
    );
    console.log('Anotações públicas retornadas:', anotacoes);
    res.json({
      success: true,
      anotacoes: anotacoes.map(anotacao => ({
        ...anotacao,
        visibilidade: anotacao.visibilidade === 'public' ? 'publico' : 'privado'
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar anotações públicas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar anotações públicas.'
    });
  }
});

module.exports = router;