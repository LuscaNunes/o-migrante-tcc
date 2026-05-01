const express = require('express');
const router = express.Router();
const anotacoesService = require('../services/anotacaoService');

// Rota para criar anotação
router.post('/', async (req, res) => {
    try {
        const usuario_id = req.user?.id;
        
        if (!usuario_id) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuário não autenticado' 
            });
        }

        const { versao, livro, capitulo, versiculo, texto_versiculo, texto_anotacao, visibilidade } = req.body;
        
        // Converte para números
        const capituloNum = parseInt(capitulo);
        const versiculoNum = parseInt(versiculo);
        
        const anotacao = await anotacoesService.criarAnotacao(usuario_id, {
            versao,
            livro,
            capitulo: capituloNum,
            versiculo: versiculoNum,
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

// Rota para anotações públicas (não requer autenticação)
router.get('/publicas', async (req, res) => {
    try {
        const db = require('../config/database');
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
                visibilidade_label: anotacao.visibilidade === 'public' ? 'Público' : 'Privado'
            }))
        });
    } catch (error) {
        console.error('Erro ao buscar anotações públicas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar anotações públicas: ' + error.message
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