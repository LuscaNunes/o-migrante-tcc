# 🏔️ O Migrante - Sistema de Gamificação Bíblica

## 📖 Sobre o Projeto

**O Migrante** é uma plataforma interativa de aprendizado bíblico que combina gamificação, estudo de versículos e elementos sociais para tornar o aprendizado da Bíblia mais envolvente e dinâmico.

Desenvolvido como Trabalho de Conclusão de Curso (TCC), o sistema oferece uma experiência completa onde os usuários podem avançar por níveis, acumular XP, participar de quizzes, fazer anotações em versículos, competir em rankings e interagir com amigos.

## ✨ Funcionalidades

### 👤 Autenticação e Perfil
- Login e cadastro de usuários com JWT
- Perfil personalizado com avatar e estatísticas
- Edição de nome, email e senha
- Sistema de amigos (solicitar, aceitar, recusar)

### 🎮 Gamificação
- Sistema de níveis progressivos
- Acúmulo de XP (1 XP por pergunta acertada)
- Desbloqueio progressivo de fases (12 fases por nível)
- Barra de progresso visual

### ❓ Quiz Bíblico
- Perguntas de múltipla escolha
- 5 perguntas aleatórias por fase
- Feedback imediato (acerto/erro)
- Destaque da resposta correta quando erra
- Salvamento automático de progresso

### 📖 Bíblia Digital
- 3 versões disponíveis (ACF, NVI, AA)
- Navegação por livro, capítulo e versículo
- Sistema de anotações pessoais por versículo
- Marcação visual de versículos anotados
- Compartilhamento de versículos via URL

### 🏆 Ranking
- Ranking global por XP total
- Ranking por níveis completados
- Ranking semanal (últimos 7 dias)
- Posição do usuário em destaque

### 👥 Amizades
- Busca de usuários por nome/email
- Enviar, aceitar e recusar solicitações
- Lista de amigos ativos
- Cancelar solicitações enviadas

### 🛠️ Administração
- **Níveis:** CRUD completo, ordenação por drag & drop, ativação/desativação
- **Perguntas:** CRUD completo por nível
- **Usuários:** Busca, edição e exclusão
- **Mensagem Diária:** Configuração de versículo destacado

## 🎯 Sistema de Progresso

| Fase | Tipo | XP por Acerto | Total de Perguntas |
|------|------|---------------|-------------------|
| 1-12 | Quiz | 1 XP | 5 por fase |

- **Total de XP por fase:** 5 XP
- **Total de XP por nível:** 60 XP
- **Fases por nível:** 12

## 🚀 Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MySQL / TiDB** - Banco de dados relacional
- **JWT** - Autenticação e sessão
- **bcryptjs** - Hash de senhas

### Frontend
- **EJS** - Template engine
- **Tailwind CSS** - Framework CSS utilitário
- **Font Awesome** - Ícones
- **JavaScript Vanilla** - Interatividade

### Infraestrutura
- **Render.com** - Hospedagem
- **TiDB Cloud** - Banco de dados na nuvem
- **Git** - Controle de versão

## 📁 Estrutura do Projeto
O-Migrante/
├── src/
│ ├── config/ # Configurações (database)
│ ├── middleware/ # Middlewares (auth)
│ ├── public/ # Arquivos estáticos (CSS, JS, XML)
│ ├── routes/ # Rotas da API
│ ├── services/ # Regras de negócio
│ └── views/ # Telas EJS
│ ├── admin/ # Área administrativa
│ ├── auth/ # Login/Cadastro
│ ├── biblia/ # Bíblia Digital
│ ├── jogos/ # Mini-jogos (Quiz)
│ ├── layout/ # Layout base e sidebar
│ ├── missoes/ # Missões e níveis
│ └── user/ # Perfil, ranking, anotações
├── scripts/ # Scripts SQL
├── .env # Variáveis de ambiente
├── package.json
└── server.js


## 🔧 Instalação e Execução

### Pré-requisitos
- Node.js (v18+)
- MySQL ou TiDB
- Git

### Passos

```bash
# Clone o repositório
git clone https://github.com/LuscaNunes/o-migrante-tcc.git
cd o-migrante-tcc

# Instale as dependências
npm install

# Configure as variáveis de ambiente (crie um arquivo .env)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=****
DB_NAME=o_migrante
JWT_SECRET=seu_secret_aqui

# Execute as migrations (scripts SQL)
# Importe os arquivos da pasta scripts/

# Inicie o servidor
npm start
O servidor estará rodando em http://localhost:3000

## 📋 API Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Cadastro de usuário |
| POST | `/auth/login` | Login do usuário |
| GET | `/niveis` | Listar níveis |
| GET | `/perguntas/aleatorias` | Buscar perguntas aleatórias |
| POST | `/progresso` | Salvar progresso |
| GET | `/ranking/global` | Ranking global |
| GET | `/anotacoes` | Listar anotações |
| POST | `/amizades/criar` | Enviar solicitação de amizade |

📊 Banco de Dados
Principais Tabelas
Usuarios - Dados dos usuários
niveis - Níveis de aprendizado
perguntas - Perguntas do quiz
ProgressoUsuario - Progresso por fase
Anotacoes - Anotações da Bíblia
Amizades - Relações de amizade
Ranking - Estatísticas de XP

🎨 Design
O projeto utiliza uma paleta de cores baseada em tons de azul, roxo e ciano:
Primária: #3b82f6 (Azul)
Secundária: #8b5cf6 (Roxo)
Destaque: #06b6d4 (Ciano)
Fundo escuro: #0f172a a #1e293b
Totalmente responsivo, adaptado para desktop e mobile.

👨‍💻 Autor

Lucas Nunes - Desenvolvedor
GitHub: @LuscaNunes

📝 Status do Projeto
✅ Versão Final do TCC - Funcionalidades congeladas para entrega

📄 Licença
Este projeto está sob a licença MIT.

🌟 Agradecimentos
Professores e orientadores do curso de ADS

Colaboradores e testadores

Comunidade open-source
