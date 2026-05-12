const db = require('../config/database');

/**
 * Cadastra uma nova pergunta de completar frase
 */
async function cadastrarPergunta(usuario_id, { nivel_id, texto_frase, resposta_correta, palavras_opcoes }) {
    if (!nivel_id || !texto_frase || !resposta_correta || !palavras_opcoes) {
        throw new Error('Preencha todos os campos');
    }

    try {
        // Verificar se o nível existe
        const [nivelCheck] = await db.query('SELECT id FROM niveis WHERE id = ? AND usuario_id = ?', [nivel_id, usuario_id]);
        if (nivelCheck.length === 0) {
            throw new Error('Nível não encontrado');
        }

        // Contar perguntas existentes
        const [countResult] = await db.query('SELECT COUNT(*) as total FROM perguntas_completar WHERE nivel_id = ?', [nivel_id]);
        const ordem = countResult[0].total + 1;

        // 🔥 CORREÇÃO: Garantir que palavras_opcoes seja um array JSON válido
        let opcoesJson;
        if (typeof palavras_opcoes === 'string') {
            // Se veio como string separada por vírgula
            opcoesJson = JSON.stringify(palavras_opcoes.split(',').map(p => p.trim()));
        } else if (Array.isArray(palavras_opcoes)) {
            opcoesJson = JSON.stringify(palavras_opcoes);
        } else {
            throw new Error('Formato inválido para opções de palavras');
        }

        const sql = `
            INSERT INTO perguntas_completar 
            (nivel_id, texto_frase, resposta_correta, palavras_opcoes, ordem, usuario_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.query(sql, [nivel_id, texto_frase, resposta_correta, opcoesJson, ordem, usuario_id]);
        return result.insertId;
    } catch (err) {
        throw new Error('Erro ao cadastrar pergunta: ' + err.message);
    }
}

/**
 * Busca perguntas aleatórias de completar frase
 */
async function buscarPerguntasAleatorias(nivel_id, quantidade = 5) {
    if (!nivel_id) {
        throw new Error('Parâmetro nivel_id é obrigatório');
    }

    try {
        // 🔥 CORREÇÃO: Usar placeholder correto para quantidade
        const [check] = await db.query('SELECT COUNT(*) as total FROM perguntas_completar WHERE nivel_id = ?', [nivel_id]);
        
        if (check[0].total === 0) {
            throw new Error('Não há perguntas de completar frase para este nível');
        }

        // No buscarPerguntasAleatorias, substitua:
        const [perguntas] = await db.query(
            `SELECT * FROM perguntas_completar WHERE nivel_id = ? ORDER BY RAND() LIMIT ${parseInt(quantidade)}`,
            [nivel_id]
        );

        // Parse das opções JSON com segurança
        perguntas.forEach(p => {
            try {
                p.palavras_opcoes = typeof p.palavras_opcoes === 'string' 
                    ? JSON.parse(p.palavras_opcoes) 
                    : p.palavras_opcoes;
            } catch (e) {
                console.error('Erro ao parsear JSON:', p.palavras_opcoes);
                p.palavras_opcoes = [];
            }
        });

        // Buscar XP do nível
        const [nivel] = await db.query('SELECT xp_total FROM niveis WHERE id = ?', [nivel_id]);
        const xp_total = nivel[0]?.xp_total || 30;

        return { perguntas, xp_total };
    } catch (err) {
        console.error('Erro detalhado:', err);
        throw new Error('Erro ao buscar perguntas: ' + err.message);
    }
}

/**
 * Buscar perguntas por nível (admin)
 */
async function buscarPerguntasPorNivel(nivel_id) {
    try {
        const [perguntas] = await db.query(
            'SELECT * FROM perguntas_completar WHERE nivel_id = ? ORDER BY ordem ASC',
            [nivel_id]
        );
        
        perguntas.forEach(p => {
            try {
                if (p.palavras_opcoes) {
                    p.palavras_opcoes = typeof p.palavras_opcoes === 'string' 
                        ? JSON.parse(p.palavras_opcoes) 
                        : p.palavras_opcoes;
                }
            } catch (e) {
                console.error('Erro ao parsear JSON:', p.palavras_opcoes);
                p.palavras_opcoes = [];
            }
        });
        
        return perguntas;
    } catch (err) {
        throw new Error('Erro ao buscar perguntas: ' + err.message);
    }
}

/**
 * Buscar pergunta por ID
 */
async function buscarPerguntaPorId(id) {
    try {
        const [result] = await db.query('SELECT * FROM perguntas_completar WHERE id = ?', [id]);
        if (result.length === 0) {
            throw new Error('Pergunta não encontrada');
        }
        try {
            if (result[0].palavras_opcoes) {
                result[0].palavras_opcoes = typeof result[0].palavras_opcoes === 'string' 
                    ? JSON.parse(result[0].palavras_opcoes) 
                    : result[0].palavras_opcoes;
            }
        } catch (e) {
            result[0].palavras_opcoes = [];
        }
        return result[0];
    } catch (err) {
        throw new Error('Erro ao buscar pergunta: ' + err.message);
    }
}

/**
 * Atualizar pergunta
 */
async function atualizarPergunta(id, { texto_frase, resposta_correta, palavras_opcoes }) {
    try {
        let opcoesJson;
        if (typeof palavras_opcoes === 'string') {
            opcoesJson = JSON.stringify(palavras_opcoes.split(',').map(p => p.trim()));
        } else if (Array.isArray(palavras_opcoes)) {
            opcoesJson = JSON.stringify(palavras_opcoes);
        } else {
            throw new Error('Formato inválido para opções de palavras');
        }

        const [result] = await db.query(
            'UPDATE perguntas_completar SET texto_frase = ?, resposta_correta = ?, palavras_opcoes = ? WHERE id = ?',
            [texto_frase, resposta_correta, opcoesJson, id]
        );
        
        if (result.affectedRows === 0) {
            throw new Error('Pergunta não encontrada');
        }
    } catch (err) {
        throw new Error('Erro ao atualizar pergunta: ' + err.message);
    }
}

/**
 * Excluir pergunta
 */
async function excluirPergunta(id) {
    try {
        const [result] = await db.query('DELETE FROM perguntas_completar WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            throw new Error('Pergunta não encontrada');
        }
    } catch (err) {
        throw new Error('Erro ao excluir pergunta: ' + err.message);
    }
}

module.exports = {
    cadastrarPergunta,
    buscarPerguntasAleatorias,
    buscarPerguntasPorNivel,
    buscarPerguntaPorId,
    atualizarPergunta,
    excluirPergunta
};