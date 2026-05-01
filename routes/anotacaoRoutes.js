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

// Rota para buscar uma anotação específica (para edição)
router.get('/:id', async (req, res) => {
    try {
        const usuario_id = req.user?.id;
        const { id } = req.params;
        
        if (!usuario_id) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuário não autenticado' 
            });
        }
        
        const db = require('../config/database');
        const [anotacoes] = await db.query(
            `SELECT 
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
            WHERE id_anotacao = ? AND usuario_id = ?`,
            [id, usuario_id]
        );
        
        if (anotacoes.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Anotação não encontrada' 
            });
        }
        
        res.json({ 
            success: true, 
            anotacao: anotacoes[0]
        });
    } catch (error) {
        console.error('Erro ao buscar anotação:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao buscar anotação: ' + error.message
        });
    }
});

// Rota para atualizar anotação (editar)
router.put('/:id', async (req, res) => {
    try {
        const usuario_id = req.user?.id;
        const { id } = req.params;
        const { texto_anotacao, visibilidade } = req.body;
        
        if (!usuario_id) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuário não autenticado' 
            });
        }
        
        if (!texto_anotacao || texto_anotacao.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'O texto da anotação não pode estar vazio'
            });
        }
        
        const db = require('../config/database');
        
        // Verificar se a anotação pertence ao usuário
        const [check] = await db.query(
            `SELECT usuario_id FROM Anotacoes WHERE id_anotacao = ?`,
            [id]
        );
        
        if (check.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Anotação não encontrada' 
            });
        }
        
        if (check[0].usuario_id !== usuario_id) {
            return res.status(403).json({ 
                success: false, 
                message: 'Você não tem permissão para editar esta anotação' 
            });
        }
        
        // Atualizar anotação
        await db.query(
            `UPDATE Anotacoes 
             SET texto_anotacao = ?, visibilidade = ?
             WHERE id_anotacao = ?`,
            [texto_anotacao, visibilidade, id]
        );
        
        // Buscar anotação atualizada
        const [anotacaoAtualizada] = await db.query(
            `SELECT 
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
            WHERE id_anotacao = ?`,
            [id]
        );
        
        res.json({ 
            success: true, 
            message: 'Anotação atualizada com sucesso!',
            anotacao: anotacaoAtualizada[0]
        });
    } catch (error) {
        console.error('Erro ao atualizar anotação:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao atualizar anotação: ' + error.message
        });
    }
});

// Rota para excluir anotação
router.delete('/:id', async (req, res) => {
    try {
        const usuario_id = req.user?.id;
        const { id } = req.params;
        
        if (!usuario_id) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuário não autenticado' 
            });
        }
        
        const db = require('../config/database');
        
        // Verificar se a anotação pertence ao usuário
        const [check] = await db.query(
            `SELECT usuario_id FROM Anotacoes WHERE id_anotacao = ?`,
            [id]
        );
        
        if (check.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Anotação não encontrada' 
            });
        }
        
        if (check[0].usuario_id !== usuario_id) {
            return res.status(403).json({ 
                success: false, 
                message: 'Você não tem permissão para excluir esta anotação' 
            });
        }
        
        // Excluir anotação
        await db.query(`DELETE FROM Anotacoes WHERE id_anotacao = ?`, [id]);
        
        res.json({ 
            success: true, 
            message: 'Anotação excluída com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao excluir anotação:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao excluir anotação: ' + error.message
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