# 💼 Sistema de Faturamento Comercial — Cadastro e Controle de Estoque

Aplicação Full Stack desenvolvida a partir de um exercício de Python sobre Programação Orientada a Objetos. O sistema permite cadastrar produtos, controlar entradas e saídas de estoque e calcular o valor total armazenado.

As regras de negócio são protegidas no backend por meio de encapsulamento, `@property` e setters da classe `Produto`.

## Funcionalidades

- Cadastro e consulta de produtos.
- Validação de preço maior que zero.
- Validação de quantidade inteira e não negativa.
- Entrada de estoque.
- Saída de estoque com verificação de saldo.
- Cálculo do valor total por produto (`preço × quantidade`).
- Cálculo do valor total de todo o estoque.
- Busca por nome e exclusão de produtos.
- Persistência dos dados em arquivo JSON.

## 📸 Demonstração Visual

### Tela Inicial (Vazia)
Aguardando o registro do produto com o seu nome, valor unitário e quantidade.
![Tela Inicial](docs/screenshots/tela-inicial.png)

### Tela Registro
Contem a quantidade de tipos de produtos, unidades, e valor total de estoque. Registro dos produtos cadastrados contendo um catálogo com preço, estoque e valor total em estoque. Com opções de adicionar, subtrair ou excluir os produtos cadastrados.
![Registro](docs/screenshots/tela-registro.png)

## Tecnologias

**Backend:** Python, Flask, Flask-CORS, JSON.  
**Frontend:** React, JavaScript, Webpack, Babel, HTML e CSS.

## Estrutura

```text
sistema-faturamento-produtos/
├── backend/
│   ├── data/
│   │   └── produtos.json
│   ├── app.py
│   ├── produto.py
│   ├── repositorio.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.jsx
│   │   └── style.css
│   ├── package.json
│   └── webpack.config.js
├── .gitignore
└── README.md
```

## Regras de negócio

- `Produto(nome, preco, quantidade=0)` inicializa o objeto validando os atributos pelas propriedades.
- `preco` é armazenado em `_preco` e só aceita valor maior que zero.
- `quantidade` é armazenada em `_quantidade` e só aceita inteiro não negativo.
- `valor_total_estoque` é uma propriedade somente-leitura que calcula preço × quantidade.
- `adicionar_estoque(quantidade)` retorna `True` quando adiciona uma quantidade inteira positiva.
- `remover_estoque(quantidade)` retorna `True` somente quando a quantidade é válida e existe saldo suficiente.

## Como executar

### Pré-requisitos

- Python 3.10 ou superior
- Node.js e npm

### 1. Iniciar o backend

No terminal:

```powershell
cd backend
py -m venv .venv
```

Instale as dependências:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Inicie a API:

```powershell
.\.venv\Scripts\python.exe app.py
```

Backend: `http://localhost:5000`

### 2. Iniciar o frontend

Abra um segundo terminal:

```powershell
cd frontend
npm.cmd install
npm.cmd start
```

Frontend: `http://localhost:3000`

> No PowerShell do Windows, use `npm.cmd` para evitar o bloqueio de execução do arquivo `npm.ps1`.

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | Verifica o status da API |
| GET | `/api/produtos` | Lista produtos e valor total do estoque |
| POST | `/api/produtos` | Cadastra produto |
| PUT | `/api/produtos/<id>` | Atualiza produto |
| DELETE | `/api/produtos/<id>` | Exclui produto |
| POST | `/api/produtos/<id>/estoque/adicionar` | Adiciona estoque |
| POST | `/api/produtos/<id>/estoque/remover` | Remove estoque |

### Exemplo de cadastro

`POST /api/produtos`

```json
{
  "nome": "Notebook",
  "preco": 3500.00,
  "quantidade": 10
}
```

### Exemplo de movimentação

`POST /api/produtos/1/estoque/remover`

```json
{
  "quantidade": 3
}
```

## Conceitos praticados

- Classes e objetos.
- Encapsulamento e atributos protegidos.
- Decoradores `@property` e `@setter`.
- Propriedades somente-leitura.
- Validação e tratamento de erros.
- Métodos de instância.
- Criação de API REST.
- Integração frontend/backend.
- Persistência em JSON.

## Autor

Projeto desenvolvido para fins de estudo em Python, Programação Orientada a Objetos e desenvolvimento Full Stack.
