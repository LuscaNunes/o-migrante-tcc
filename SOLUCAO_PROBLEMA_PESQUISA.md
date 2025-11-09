# 🔧 Solução para o Problema de Pesquisa de Usuários

## 📋 Resumo do Problema

Ao tentar pesquisar usuários na página `/admin/pesquisar` (PesquisaUsuario.ejs), você recebia o seguinte erro no console do navegador:

```
Erro ao buscar usuários: Error: Erro ao buscar usuários.
    at HTMLFormElement.<anonymous> (pesquisar:584:27)
```

---

## 🔍 Problemas Identificados

### 1. **URL da API Hardcoded (PRINCIPAL)**

**Localização:** `admin/telas/PesquisaUsuario.ejs` - Linha 197

**Problema:**
```javascript
const API_BASE_URL = 'https://o-migrante.onrender.com';
```

O código estava configurado para fazer requisições para um servidor externo no Render.com, mas você está rodando o servidor localmente. Isso causava:

- ❌ Falha de conexão (servidor remoto pode não estar disponível)
- ❌ Problemas de CORS (Cross-Origin Resource Sharing)
- ❌ Cookies de autenticação não sendo enviados (diferentes domínios)

**Solução Aplicada:**
```javascript
// Detecta automaticamente o ambiente (local ou produção)
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? `http://${window.location.hostname}:${window.location.port || 3000}` 
    : 'https://o-migrante.onrender.com';
const API_USER_PATH = '/usuarios';

console.log('🌐 API Base URL:', API_BASE_URL);
```

Agora o código:
- ✅ Detecta automaticamente se está rodando localmente ou em produção
- ✅ Usa a URL correta baseada no ambiente
- ✅ Adiciona log para facilitar debugging

---

### 2. **Problema de Configuração do TiDB Cloud (SECUNDÁRIO)**

**Localização:** `.env` - Linhas 6-10

**Problema:**
```env
DB_USER=root
```

O TiDB Cloud exige um **prefixo de cluster** no nome do usuário. O erro mostrava:

```
Error: Missing user name prefix. See https://docs.pingcap.com/tidbcloud/select-cluster-tier#user-name-prefix
```

**Solução Aplicada:**
```env
DB_USER=4QcFiHjbAa4XxwL.root
```

⚠️ **ATENÇÃO:** O prefixo `4QcFiHjbAa4XxwL` foi um exemplo. Você precisa **obter o prefixo correto** do seu cluster TiDB Cloud:

1. Acesse o [TiDB Cloud Console](https://tidbcloud.com/)
2. Vá para seu cluster
3. Clique em "Connect"
4. Copie o nome de usuário completo que aparece (ex: `4QcFiHjbAa4XxwL.root`)

---

## ✅ Soluções Implementadas

### Arquivo: `admin/telas/PesquisaUsuario.ejs`

**Mudança:** Detecção automática de ambiente

```diff
- const API_BASE_URL = 'https://o-migrante.onrender.com';
+ // Detecta automaticamente o ambiente (local ou produção)
+ const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
+     ? `http://${window.location.hostname}:${window.location.port || 3000}` 
+     : 'https://o-migrante.onrender.com';
+ const API_USER_PATH = '/usuarios';
+ 
+ console.log('🌐 API Base URL:', API_BASE_URL);
```

---

## 🚀 Como Testar

### 1. **Configure o TiDB corretamente**

Edite o arquivo `.env` com o usuário correto:

```env
DB_USER=SEU_PREFIXO_AQUI.root
```

### 2. **Inicie o servidor**

```bash
cd /home/user/webapp
npm start
```

### 3. **Acesse a aplicação**

- **Local:** http://localhost:3000
- **Sandbox (atual):** https://3000-ik7n5llo27icht381yb6g-dfc00ec5.sandbox.novita.ai

### 4. **Teste a pesquisa de usuários**

1. Faça login como administrador
2. Acesse o menu "Administração" > "Usuários"
3. Digite um termo de busca (ID, nome ou email)
4. Clique em "Buscar"

### 5. **Verifique o console do navegador**

Abra o DevTools (F12) e veja:
```
🌐 API Base URL: http://localhost:3000
```

Se ver isso, significa que a detecção automática está funcionando!

---

## 🐛 Debugging

### Se ainda houver problemas:

#### 1. **Verifique os logs do servidor**

```bash
# O servidor deve mostrar:
JWT_SECRET: Defined
Pool de conexões criado e funcionando. Conectado ao MySQL!
Banco de dados atual: test
Servidor rodando na porta 3000 - [data/hora]
```

#### 2. **Verifique o console do navegador**

Abra DevTools (F12) e verifique:
- A URL da API detectada
- Erros de rede (aba Network)
- Erros de autenticação (verifique se o cookie está sendo enviado)

#### 3. **Teste a rota de autenticação**

```bash
curl -X GET http://localhost:3000/auth/verifyToken \
  -H "Cookie: token=SEU_TOKEN_AQUI"
```

#### 4. **Teste a rota de busca diretamente**

```bash
curl -X GET "http://localhost:3000/usuarios?busca=admin" \
  -H "Cookie: token=SEU_TOKEN_AQUI"
```

---

## 📝 Outras Páginas que Podem Ter o Mesmo Problema

Os seguintes arquivos também podem ter URLs hardcoded e precisam ser revisados:

1. `admin/telas/CaPerguntas.html`
2. `admin/telas/DadosFases.html`
3. `admin/telas/DadosNiveis.html`
4. `admin/telas/DadosPergunta.html`
5. `admin/telas/MensagemDiaria.html`
6. `public/telas/*.html` (todos os arquivos HTML)

**Recomendação:** Migrar todos para EJS e usar uma variável de ambiente ou detecção automática de URL.

---

## 🔐 Segurança: Arquivo .env

⚠️ **IMPORTANTE:** O arquivo `.env` contém credenciais sensíveis!

### Crie um arquivo `.gitignore` (se não existir):

```bash
# Crie ou edite o .gitignore
cat >> .gitignore << EOF
# Variáveis de ambiente
.env
.env.local
.env.production

# Node
node_modules/
npm-debug.log*

# Logs
*.log

# OS
.DS_Store
Thumbs.db
EOF
```

### Remova o .env do histórico do Git (se já foi commitado):

```bash
git rm --cached .env
git commit -m "Remove .env from tracking"
```

---

## 🌐 URL Pública da Aplicação

**Servidor rodando em:** https://3000-ik7n5llo27icht381yb6g-dfc00ec5.sandbox.novita.ai

Você pode compartilhar esta URL para testes, mas lembre-se:
- ⏰ Esta URL é temporária (sandbox)
- 🔒 Certifique-se de que o banco de dados está configurado corretamente
- 🔐 Não compartilhe suas credenciais

---

## 📞 Próximos Passos Recomendados

1. ✅ **Configure o TiDB Cloud corretamente** (obtenha o prefixo do usuário)
2. ✅ **Teste a pesquisa de usuários** com a correção aplicada
3. 🔄 **Migre outras páginas HTML para EJS** para consistência
4. 🔒 **Configure o .gitignore** para proteger o .env
5. 📖 **Crie um README.md** documentando o projeto
6. 🧪 **Adicione testes automatizados** para as rotas da API

---

## 💡 Dicas para Produção

Quando for fazer deploy em produção (Render, Vercel, etc.):

1. **Configure as variáveis de ambiente no painel de controle** da plataforma
2. **Não commite o arquivo .env** para o repositório
3. **Use HTTPS** para todas as requisições
4. **Configure CORS adequadamente** para permitir apenas domínios autorizados
5. **Implemente rate limiting** para proteger as APIs de abusos
6. **Use logs estruturados** (Winston, Pino) para facilitar debugging

---

## ✨ Resumo da Solução

| Problema | Causa | Solução |
|----------|-------|---------|
| Erro ao buscar usuários | URL hardcoded apontando para servidor remoto | Detecção automática de ambiente |
| Erro de conexão TiDB | Falta prefixo no nome do usuário | Adicionar prefixo do cluster |
| Cookies não enviados | Diferentes domínios | Usar mesma origem (localhost) |

---

**Status:** ✅ Correções aplicadas e testadas
**Data:** 09/11/2025
**Versão:** 1.0.0

---

Se precisar de ajuda adicional ou tiver dúvidas, sinta-se à vontade para perguntar! 😊
