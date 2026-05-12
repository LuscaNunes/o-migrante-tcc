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

        const sql = `
            INSERT INTO perguntas_completar 
            (nivel_id, texto_frase, resposta_correta, palavras_opcoes, ordem, usuario_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.query(sql, [nivel_id, texto_frase, resposta_correta, JSON.stringify(palavras_opcoes), ordem, usuario_id]);
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
        // Verificar se há perguntas
        const [check] = await db.query('SELECT COUNT(*) as total FROM perguntas_completar WHERE nivel_id = ?', [nivel_id]);
        
        if (check[0].total === 0) {
            throw new Error('Não há perguntas de completar frase para este nível');
        }

        // Buscar perguntas aleatórias
        const [perguntas] = await db.query(
            'SELECT * FROM perguntas_completar WHERE nivel_id = ? ORDER BY RAND() LIMIT ?',
            [nivel_id, quantidade]
        );

        // Parse das opções JSON
        perguntas.forEach(p => {
            p.palavras_opcoes = JSON.parse(p.palavras_opcoes);
        });

        // Buscar XP do nível
        const [nivel] = await db.query('SELECT xp_total FROM niveis WHERE id = ?', [nivel_id]);
        const xp_total = nivel[0]?.xp_total || 30;

        return { perguntas, xp_total };
    } catch (err) {
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
            if (p.palavras_opcoes) {
                p.palavras_opcoes = JSON.parse(p.palavras_opcoes);
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
        if (result[0].palavras_opcoes) {
            result[0].palavras_opcoes = JSON.parse(result[0].palavras_opcoes);
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
        const [result] = await db.query(
            'UPDATE perguntas_completar SET texto_frase = ?, resposta_correta = ?, palavras_opcoes = ? WHERE id = ?',
            [texto_frase, resposta_correta, JSON.stringify(palavras_opcoes), id]
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