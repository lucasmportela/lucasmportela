# Controle de Reposição de Almoxarifado

Aplicação web educacional para controlar o saldo de seis produtos industriais e identificar necessidades de reposição com base em um estoque mínimo de segurança.

O projeto transforma um exercício de lógica de programação em uma aplicação com frontend e backend separados.

## Funcionalidades

- Cadastro de seis produtos com código e saldo em estoque.
- Definição de um estoque mínimo de segurança único.
- Identificação dos produtos com saldo estritamente abaixo do mínimo.
- Identificação do produto com menor saldo absoluto.
- Identificação do produto com maior saldo absoluto.
- Exibição da mensagem **“Estoque Operando em Parâmetros Normais”** quando nenhum produto estiver abaixo do mínimo.
- Relatório visual com a situação individual de cada produto.
- Validação dos dados no backend.

## Tecnologias utilizadas

- **Backend:** Python 3 e Flask.
- **Frontend:** HTML5, CSS3 e JavaScript.
- **Comunicação:** API HTTP com JSON.

## Estrutura de pastas

```text
ControleReposicaoAlmoxarifado/
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

### Pré-requisitos

- Python 3.10 ou superior.
- pip.

### 1. Entre na pasta do projeto

```bash
cd ControleReposicaoAlmoxarifado
```

### 2. (Opcional) Crie um ambiente virtual

No Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### 3. Instale as dependências

```bash
pip install -r backend/requirements.txt
```

### 4. Inicie o servidor

```bash
python backend/app.py
```

### 5. Acesse no navegador

```text
http://127.0.0.1:5000
```

> Acesse pelo endereço do Flask. Não abra o arquivo `index.html` diretamente nem utilize o Live Server, pois a interface precisa se comunicar com a API.

## Regras de negócio

| Regra | Comportamento |
|---|---|
| Quantidade de produtos | Exatamente 6 |
| Código do produto | Número inteiro não negativo |
| Saldo em estoque | Número inteiro não negativo |
| Estoque mínimo | Número inteiro não negativo |
| Produto em alerta | Saldo estritamente menor que o mínimo |
| Menor saldo | Identificado por varredura |
| Maior saldo | Identificado por varredura |

Um saldo igual ao estoque mínimo **não** é considerado abaixo do mínimo, conforme o operador `<` definido no exercício.

## Restrição técnica

O backend utiliza dois vetores paralelos (`codigos` e `saldos`) com seis posições. A leitura e a análise percorrem os vetores com laços `for` e índices explícitos, mantendo os dados sincronizados.

A identificação dos maiores e menores saldos é feita por comparações e variáveis de controle, sem utilizar `max()`, `min()` ou funções prontas de busca.

## API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Carrega a interface web. |
| POST | `/api/estoque/analisar` | Valida e analisa os seis produtos. |

Exemplo de corpo da requisição:

```json
{
  "produtos": [
    {"codigo": 101, "saldo": 12},
    {"codigo": 102, "saldo": 35},
    {"codigo": 103, "saldo": 8},
    {"codigo": 104, "saldo": 50},
    {"codigo": 105, "saldo": 22},
    {"codigo": 106, "saldo": 41}
  ],
  "estoque_minimo": 15
}
```

## Observações

Este projeto tem finalidade educacional. Os dados são processados pela API e não são armazenados em banco de dados.

## Autor

Projeto desenvolvido para praticar lógica de programação, vetores paralelos, laços de repetição, índices, validação de dados, Python e desenvolvimento web.
