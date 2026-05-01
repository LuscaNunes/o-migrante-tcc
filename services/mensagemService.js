const db = require('../config/database');

async function cadastrarMensagem({ usuario_id, versao, livro, capitulo, versiculo, texto_versiculo, titulo, descricao }) {
    if (!versao || !livro || !capitulo || !versiculo || !texto_versiculo || !titulo || !descricao) {
        throw new Error('Preencha todos os campos');
    }
    if (typeof capitulo !== 'number' || capitulo <= 0) {
        throw new Error('Capítulo deve ser um número positivo');
    }
    if (typeof versiculo !== 'number' || versiculo <= 0) {
        throw new Error('Versículo deve ser um número positivo');
    }

    try {
        // CORRIGIDO: tabela minúscula, coluna com acento
        const [lastOrder] = await db.query('SELECT MAX(ordem_exibição) as maxOrder FROM mensagensdiarias');
        const ordem_exibicao = (lastOrder[0].maxOrder || 0) + 1;

        await db.query(
            'INSERT INTO mensagensdiarias (usuario_id, versao, livro, capitulo, versiculo, texto_versiculo, titulo, descricao, ordem_exibição) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [usuario_id, versao, livro, capitulo, versiculo, texto_versiculo, titulo, descricao, ordem_exibicao]
        );
    } catch (error) {
        throw new Error('Erro ao salvar mensagem: ' + error.message);
    }
}

async function listarMensagens(busca) {
    try {
        // CORRIGIDO: tabela minúscula, coluna com acento
        let query = 'SELECT id_mensagem, usuario_id, versao, livro, capitulo, versiculo, texto_versiculo, titulo, descricao, ordem_exibição FROM mensagensdiarias WHERE 1=1';
        const params = [];
        if (busca) {
            query += ' AND (LOWER(titulo) LIKE LOWER(?) OR LOWER(livro) LIKE LOWER(?) OR LOWER(texto_versiculo) LIKE LOWER(?))';
            params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
        }
        query += ' ORDER BY ordem_exibição DESC';
        const [results] = await db.query(query, params);
        return results;
    } catch (error) {
        throw new Error('Erro ao listar mensagens: ' + error.message);
    }
}

async function obterMensagemDoDia() {
    try {
        const startDate = new Date('2025-06-01');
        const today = new Date();
        const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        
        // CORRIGIDO: tabela minúscula
        const [count] = await db.query('SELECT COUNT(*) as total FROM mensagensdiarias');
        const totalMensagens = count[0].total;
        if (totalMensagens === 0) return null;
        const ordem_exibicao = (daysSinceStart % totalMensagens) + 1;

        const [results] = await db.query(
            // CORRIGIDO: tabela minúscula, coluna com acento
            'SELECT id_mensagem, versao, livro, capitulo, versiculo, texto_versiculo, titulo, descricao FROM mensagensdiarias WHERE ordem_exibição = ?',
            [ordem_exibicao]
        );
        return results[0] || null;
    } catch (error) {
        throw new Error('Erro ao buscar mensagem do dia: ' + error.message);
    }
}

module.exports = { cadastrarMensagem, listarMensagens, obterMensagemDoDia };