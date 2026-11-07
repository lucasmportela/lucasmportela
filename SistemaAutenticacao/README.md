# Sistema de Autenticação

Aplicação web que transforma um exercício de autenticação feito em Python no terminal em uma interface web com frontend e backend.

O usuário cadastra uma senha numérica de quatro dígitos. Em seguida, o sistema solicita a confirmação da senha, permite até três tentativas e, quando o acesso é liberado, executa uma contagem regressiva de inicialização de 5 até 1.

## Funcionalidades

- Cadastro de senha numérica com exatamente 4 dígitos.
- Validação no backend.
- Até 3 tentativas para confirmar a senha.
- Bloqueio após 3 tentativas incorretas.
- Contagem regressiva de inicialização após autenticação bem-sucedida.
- Reinicialização da demonstração.
- Senha armazenada como hash na sessão, em vez de texto puro.

## Tecnologias

- **Backend:** Python e Flask.
- **Frontend:** HTML5, CSS3 e JavaScript.
- **Comunicação:** API HTTP com JSON.

## Estrutura de pastas

```text
SistemaAutenticacao/
├── backend/
│   ├── app.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── README.md
```

## Como executar

### 1. Pré-requisitos

- Python 3.10 ou superior.
- pip.

### 2. Abra o terminal na pasta do projeto

```bash
cd SistemaAutenticacao
```

### 3. Crie e ative um ambiente virtual (recomendado)

Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

Se o PowerShell bloquear a ativação, você pode executar diretamente o pip e o Python do ambiente virtual, ou usar o Prompt de Comando.

### 4. Instale as dependências

```bash
pip install -r backend/requirements.txt
```

### 5. Inicie o backend

```bash
python backend/app.py
```

### 6. Acesse no navegador

Abra:

```text
http://127.0.0.1:5000
```

## Como testar

1. Cadastre uma senha de quatro dígitos, por exemplo `1234`.
2. Confirme a senha na etapa de acesso.
3. Teste uma senha incorreta para visualizar a redução das tentativas.
4. Com a senha correta, acompanhe a contagem regressiva de 5 até 1.
5. Use **Reiniciar demonstração** para limpar a sessão e começar novamente.
6. Para testar o bloqueio, cadastre uma senha e erre as três tentativas.

## Rotas da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/status` | Consulta o estado da sessão. |
| POST | `/api/setup` | Cadastra a senha de quatro dígitos. |
| POST | `/api/login` | Confirma a senha e controla as tentativas. |
| POST | `/api/reset` | Reinicia a sessão da demonstração. |

Exemplo de corpo JSON para cadastro e login:

```json
{
  "password": "1234"
}
```

## Regras de negócio implementadas

- A senha deve conter exatamente quatro caracteres numéricos.
- O backend permite três tentativas de autenticação.
- Uma tentativa correta libera o acesso.
- Uma tentativa incorreta reduz o total de tentativas restantes.
- Ao chegar a zero, a sessão fica bloqueada.
- A contagem regressiva só acontece depois da autenticação bem-sucedida.

## Observação de segurança

Este projeto é educacional e demonstra fluxo de autenticação. A sessão é mantida pelo Flask e a senha é armazenada como hash na sessão. Antes de publicar ou usar em produção, altere `app.secret_key` para uma chave forte mantida em variável de ambiente, desative `debug`, configure HTTPS e implemente controles adicionais de segurança. O bloqueio deste exemplo é por sessão/navegador, não um mecanismo de proteção para contas reais.

## Autor

Desenvolvido como projeto de estudo de lógica de programação, Python, APIs e desenvolvimento web.
