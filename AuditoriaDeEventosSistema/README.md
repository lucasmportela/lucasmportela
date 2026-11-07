# Sentinela — Sistema de Auditoria de Eventos

Aplicação web didática para registrar e consultar ações realizadas por usuários em um sistema corporativo. O projeto nasceu de um exercício de Python sobre gravação de logs.

## Tecnologias
- **Backend:** Python 3 e Flask
- **Frontend:** HTML5, CSS3 e JavaScript
- **Armazenamento:** arquivo de texto (`auditoria_sistema.log`)

## Funcionalidades
- Registrar usuário, ação executada e status da operação.
- Gerar automaticamente data e hora do registro.
- Acrescentar eventos ao final do arquivo, sem apagar o histórico.
- Consultar eventos, com os mais recentes primeiro.
- Filtrar registros por sucesso ou falha.
- Exibir totais de eventos, sucessos e falhas.
- Validar os dados antes de gravar.

## Estrutura
```text
auditoria-eventos-sistema/
├── app.py
├── requirements.txt
├── README.md
├── .gitignore
├── auditoria_sistema.log  # criado automaticamente ao registrar o primeiro evento
├── templates/
│   └── index.html
└── static/
    ├── css/style.css
    └── js/app.js
```

## Como executar

### Pré-requisitos
- Python 3.10 ou superior
- pip

### 1. Clone o repositório
```bash
git clone URL_DO_SEU_REPOSITORIO
cd auditoria-eventos-sistema
```

### 2. Crie e ative um ambiente virtual

Windows PowerShell:
```powershell
py -m venv .venv
.venv\\Scripts\\Activate.ps1
```

Windows CMD:
```cmd
py -m venv .venv
.venv\\Scripts\\activate.bat
```

Linux/macOS:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Instale as dependências
```bash
pip install -r requirements.txt
```

### 4. Inicie o servidor
Windows:
```bash
py app.py
```
Linux/macOS:
```bash
python3 app.py
```

Abra http://127.0.0.1:5000 no navegador. O arquivo `auditoria_sistema.log` será criado automaticamente no primeiro registro.

## Regras de negócio
A função central segue a proposta do exercício:

```python
from datetime import datetime

def registrar_evento(usuario, acao, status):
    data_hora = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    with open("auditoria_sistema.log", "a", encoding="utf-8") as arquivo:
        arquivo.write(
            f"[{data_hora}] Usuário: {usuario} | "
            f"Ação: {acao} | Status: {status}\\n"
        )
```

O modo `a` (*append*) acrescenta a linha ao final do arquivo e preserva os registros anteriores. A interface disponibiliza as ações `LOGIN`, `LOGOUT`, `SAQUE`, `DEPOSITO`, `EXCLUSAO`, `EDICAO` e `CONSULTA`, com status `SUCESSO` ou `FALHA`.

## API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/eventos` | Lista eventos gravados |
| POST | `/api/eventos` | Valida e registra um novo evento |

Exemplo de corpo JSON:
```json
{
  "usuario": "Lucas",
  "acao": "LOGIN",
  "status": "SUCESSO"
}
```

Exemplo de linha gravada:
```text
[07/11/2026 14:30:00] Usuário: Lucas | Ação: LOGIN | Status: SUCESSO
```

## Nota de segurança
Projeto para estudo. Um arquivo local editável não garante uma trilha de auditoria inviolável. Em produção, implemente autenticação e controle de acesso, armazenamento centralizado, proteção contra adulteração, rotação e retenção de logs, sincronização de horário e monitoração. O servidor Flask deste projeto usa modo de desenvolvimento e não deve ser exposto diretamente à internet.


## 📸 Capturas de tela

As capturas reais da aplicação podem ser adicionadas em `docs/screenshots/`. Depois de incluir as imagens, insira-as aqui, por exemplo:

```markdown
![Tela inicial](docs/screenshots/tela-inicial.png)
```

Nenhuma imagem demonstrativa foi inventada; registre a aplicação em execução para documentar a interface real.
