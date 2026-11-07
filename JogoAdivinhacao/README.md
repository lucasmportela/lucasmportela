# Jogo de Adivinhação

Jogo web em que o usuário disputa três rodadas contra a máquina para descobrir um número secreto entre 1 e 50. Cada rodada oferece até cinco tentativas, com pontuação variável conforme a rapidez do acerto.

## Funcionalidades

- Três rodadas fixas e número secreto aleatório em cada uma.
- Até cinco palpites por rodada, com dicas de maior ou menor.
- Pontuação: 100, 75, 50, 25 ou 10 pontos conforme a tentativa do acerto.
- Rodada sem acerto concede zero pontos.
- Soma da pontuação e classificação final: Excelente (acima de 200), Bom (100 a 200) ou Tente Novamente (abaixo de 100).
- Reinício da partida.

## Tecnologias

- Python 3 + Flask (backend).
- HTML5, CSS3 e JavaScript (frontend).
- Biblioteca `random` para gerar o número secreto.

## Estrutura

```text
JogoAdivinhacao/
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

Requer Python 3.10 ou superior.

1. Entre na pasta do projeto:
   ```bash
   cd JogoAdivinhacao
   ```
2. (Opcional) Crie e ative um ambiente virtual no Windows:
   ```powershell
   python -m venv .venv
   .venv\\Scripts\\Activate.ps1
   ```
3. Instale a dependência:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. Inicie o servidor:
   ```bash
   python backend/app.py
   ```
5. Abra `http://127.0.0.1:5000` no navegador.

> Abra pelo endereço do Flask, não diretamente pelo arquivo HTML nem pelo Live Server, pois a interface utiliza a API do backend.

## Pontuação

| Tentativa | Pontos |
|---|---:|
| 1ª | 100 |
| 2ª | 75 |
| 3ª | 50 |
| 4ª | 25 |
| 5ª | 10 |
| Sem acerto | 0 |

## Classificação

| Pontuação total | Resultado |
|---|---|
| Acima de 200 | Excelente |
| De 100 até 200 | Bom |
| Abaixo de 100 | Tente Novamente |

## API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Exibe a interface. |
| POST | `/api/jogo/iniciar` | Inicia ou reinicia a partida. |
| POST | `/api/jogo/palpite` | Valida um palpite e atualiza a partida. |

Exemplo de JSON enviado para registrar um palpite:

```json
{"palpite": 25}
```

## Observação sobre a lógica original

A aplicação mantém o número secreto e o estado da partida no backend. O jogo utiliza variáveis individuais para rodada, tentativa e pontuação, sem armazenar as rodadas em listas ou vetores. A pontuação da quinta tentativa é de 10 pontos, conforme a fórmula e as regras do exercício.

Projeto educacional para praticar `for`, `while`, `if/elif/else`, números aleatórios, validação de entradas, Python, Flask e integração frontend/backend.
