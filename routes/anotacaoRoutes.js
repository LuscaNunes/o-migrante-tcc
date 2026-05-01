const express = require('express');
const router = express.Router();
const db = require('../config/database');
const anotacoesService = require('../services/anotacoesService');

// Middleware para extrair usuário do token (seu auth middleware já faz isso)
// Rota para criar anotação
router.post('/', async (req, res) => {
    try {
        // Pega o usuario_id do middleware authenticateToken
        const usuario_id = req.user?.id;
        
        if (!usuario_id) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuário não autenticado' 
            });
        }

        const { versao, livro, capitulo, versiculo, texto_versiculo, texto_anotacao, visibilidade } = req.body;
        
        const anotacao = await anotacoesService.criarAnotacao(usuario_id, {
            versao,
            livro,
            capitulo: parseInt(capitulo),
            versiculo: parseInt(versiculo),
            texto_versiculo,
            texto_anotacao,
            visibilidade: visibilidade || 'private'
        });
        
        res.json({ 
            success: true, 
            anotacao 
        });
    } catch (error) {
        console.error('Erro ao criar anotação:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Erro ao salvar anotação' 
        });
    }
});

// Rota para listar anotações do usuário
router.get('/', async (req, res) => {
    try {
        const usuario_id = req.user?.id;
        
        if (!usuario_id) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuário não autenticado' 
            });
        }
        
        const { visibilidade } = req.query;
        const anotacoes = await anotacoesService.listarAnotacoes(usuario_id, visibilidade);
        
        res.json({ 
            success: true, 
            anotacoes 
        });
    } catch (error) {
        console.error('Erro ao listar anotações:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Erro ao buscar anotações' 
        });
    }
});

// Rota para anotações públicas
router.get('/publicas', async (req, res) => {
    try {
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

// Rota para atualizar visibilidade
router.put('/:id/visibilidade', async (req, res) => {
    try {
        const usuario_id = req.user?.id;
        const { id } = req.params;
        const { visibilidade } = req.body;
        
        if (!usuario_id) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuário não autenticado' 
            });
        }
        
        const anotacao = await anotacoesService.atualizarVisibilidadeAnotacao(id, usuario_id, visibilidade);
        
        res.json({ 
            success: true, 
            anotacao 
        });
    } catch (error) {
        console.error('Erro ao atualizar visibilidade:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Erro ao atualizar visibilidade' 
        });
    }
});

module.exports = router;