# Sistema de Autenticação

Aplicação web de autenticação e autorização por usuário, desenvolvida com Python, Flask e SQLite. Cada pessoa possui sua própria conta, e as permissões são verificadas pelo backend em todas as rotas protegidas.

## Funcionalidades

- Cadastro de usuários com nome, e-mail e senha individual.
- Senhas armazenadas com hash seguro do Werkzeug; nunca são salvas em texto puro.
- Login, logout e consulta da sessão autenticada.
- Sessões individuais com cookie \`HttpOnly\`, \`SameSite=Lax\`, expiração e \`Secure\` em produção.
- Proteção CSRF para operações que alteram dados.
- Autorização baseada em papéis (**RBAC**): \`user\` e \`admin\`.
- Painel administrativo para listar usuários e alterar seus papéis.
- Contas comuns não podem acessar endpoints administrativos.
- Bloqueio temporário da conta após cinco tentativas incorretas.
- Proteção para impedir que o último administrador ativo seja rebaixado.
- Criação do primeiro administrador por comando CLI; o cadastro público nunca concede privilégios administrativos.
- Cabeçalhos HTTP de segurança e respostas sem cache.

## Demonstração visual

As capturas de tela existentes registram a versão demonstrativa anterior. A interface foi atualizada para cadastro, login e painel por perfil; atualize as imagens da pasta \`docs/screenshots\` após executar a nova versão.

## Tecnologias

- **Backend:** Python 3.10+ e Flask.
- **Banco de dados:** SQLite.
- **Segurança:** Werkzeug password hashing, sessões Flask, CSRF token e autorização por papéis.
- **Frontend:** HTML5, CSS3 e JavaScript puro.
- **Testes:** \`unittest\` e Flask test client.

## Estrutura de pastas

\`\`\`text
SistemaAutenticacao/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── tests/
│       └── test_security.py
├── docs/
│   └── screenshots/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── README.md
\`\`\`

O banco \`instance/auth.db\` é criado automaticamente na primeira execução e não deve ser versionado.

## Como executar no Windows (PowerShell)

A partir da raiz do repositório:

\`\`\`powershell
cd SistemaAutenticacao
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
$env:SECRET_KEY = python -c "import secrets; print(secrets.token_urlsafe(48))"
python backend/app.py
\`\`\`

Se a ativação do ambiente virtual for bloqueada pelo PowerShell, execute diretamente:

\`\`\`powershell
.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
.venv\Scripts\python.exe backend/app.py
\`\`\`

Acesse http://127.0.0.1:5000.

## Criar o primeiro administrador

O cadastro pela interface cria exclusivamente usuários comuns. Para criar uma conta administrativa, pare o servidor e execute o comando de dentro da pasta `SistemaAutenticacao`:

\`\`\`powershell
flask --app backend.app create-admin
\`\`\`

Informe nome, e-mail e senha quando solicitado. A senha é digitada de forma oculta e não deve ser passada como argumento de linha de comando.

Depois, inicie novamente o servidor:

\`\`\`powershell
python backend/app.py
\`\`\`

Faça login com a conta administrativa para acessar o painel de gerenciamento de usuários.

## Variáveis de ambiente

| Variável | Finalidade | Padrão |
|---|---|---|
| \`SECRET_KEY\` | Chave de assinatura das sessões | Gerada temporariamente em desenvolvimento; obrigatória em produção |
| \`APP_ENV\` | Ambiente de execução | \`development\` |
| \`AUTH_DATABASE\` | Caminho do arquivo SQLite | \`SistemaAutenticacao/instance/auth.db\` |
| \`FLASK_HOST\` | Endereço de escuta | \`127.0.0.1\` |
| \`PORT\` | Porta HTTP | \`5000\` |
| \`FLASK_DEBUG\` | Ativa debug somente fora de produção | \`false\` |

Para produção, configure \`APP_ENV=production\`, uma \`SECRET_KEY\` aleatória de pelo menos 32 caracteres, HTTPS e um servidor WSGI apropriado. O cookie passa a exigir HTTPS (\`Secure\`).

## Rotas da API

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | \`/api/status\` | Público | Estado da sessão e token CSRF |
| POST | \`/api/register\` | Público + CSRF | Cadastro de usuário comum |
| POST | \`/api/login\` | Público + CSRF | Autenticação |
| GET | \`/api/me\` | Autenticado | Dados do usuário atual |
| POST | \`/api/logout\` | Autenticado + CSRF | Encerramento da sessão |
| GET | \`/api/admin/users\` | Administrador | Lista usuários |
| PATCH | \`/api/admin/users/<id>/role\` | Administrador + CSRF | Altera papel do usuário |

Todas as operações POST/PATCH exigem o token CSRF recebido em \`/api/status\` ou no retorno de login, enviado no cabeçalho \`X-CSRF-Token\`.

### Papéis e permissões

- **user:** pode autenticar e consultar apenas os próprios dados em \`/api/me\`.
- **admin:** possui as permissões de usuário e pode listar contas e alterar papéis no painel administrativo.

O backend consulta o usuário e seu papel no banco a cada requisição protegida. O frontend não é usado como mecanismo de segurança.

## Testes automatizados

Na raiz do repositório, execute:

\`\`\`powershell
python -m unittest discover -s SistemaAutenticacao/backend/tests -v
\`\`\`

Ou, dentro da pasta \`SistemaAutenticacao\`:

\`\`\`powershell
python -m unittest discover -s backend/tests -v
\`\`\`

Os testes cobrem cadastro, hash de senha, validações, e-mail duplicado, CSRF, login, sessão, logout, bloqueio por tentativas, rotas protegidas, permissões administrativas, alteração de papéis e cabeçalhos de segurança.

## Segurança e limitações

Este é um projeto educacional, não uma solução pronta para proteger sistemas críticos.

- Use HTTPS em produção e mantenha a chave \`SECRET_KEY\` fora do código e do Git.
- O projeto utiliza sessões assinadas padrão do Flask; apenas o identificador do usuário e o token CSRF são armazenados na sessão, nunca a senha ou seu hash. Para ambientes distribuídos, considere armazenamento de sessão no servidor.
- O bloqueio por conta ajuda a reduzir tentativas repetidas, mas precisa ser complementado por limitação de requisições por IP, monitoramento e controles contra negação de serviço.
- A recuperação de senha, confirmação de e-mail, MFA, auditoria administrativa e gestão de sessões/dispositivos não fazem parte desta versão.
- O primeiro administrador deve ser criado por um operador confiável usando o comando CLI.

## Autor

Desenvolvido como projeto de portfólio para praticar Python, Flask, SQLite, autenticação, autorização, segurança web e testes automatizados.
