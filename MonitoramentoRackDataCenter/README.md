# 🌡️ Rack Monitor — Monitoramento Térmico de Data Centers

Aplicação web para simular o monitoramento térmico de três racks de servidores, com três sensores por rack. O sistema recebe as temperaturas, calcula a média de cada rack, identifica a maior leitura e alerta quando algum sensor atinge **75 °C ou mais**.

## Funcionalidades

- Entrada de temperatura para 9 sensores (3 racks × 3 sensores).
- Validação de temperaturas entre 10 °C e 90 °C.
- Cálculo da média de temperatura de cada rack.
- Identificação da maior temperatura e sua localização (rack e sensor).
- Alerta de superaquecimento a partir de 75 °C.
- Exibição dos resultados em painel e tabela.
- API REST para processar a matriz de temperaturas.
- Execução local ou com Docker Compose.

## 📸 Demonstração Visual

### Tela Inicial (Vazia)
Aguardando o registro dos valores de temperatura dos sensores dos rack para o monitoramento dos racks para informar a maior temperatura.
![Tela Inicial](docs/screenshots/tela-inicial.png)

### Relatório
Relatório térmico feito com o resultado da leitura dos registros de temperatura, com temperatura média de cada rack, a matriz de suas temperaturas, a maior temperatura e o status atual do sistema.
![Relatório](docs/screenshots/tela-relatorio.png)

### Alerta
Alerta exibido quando alguma temperatura de algum rack ultrapassar 75°C
![Alerta](docs/screenshots/tela-alerta.png)

## Tecnologias

**Frontend:** React, Vite, JavaScript, CSS e Lucide React.  
**Backend:** Node.js, Express e CORS.  
**Infraestrutura:** Docker, Docker Compose e Nginx.

## Estrutura do projeto

```text
rack-monitor/
├── backend/
│   ├── DOCKERFILE
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── DOCKERFILE
│   ├── index.html
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── style.css
├── .dockerignore
├── .gitignore
├── docker-compose.yml
└── README.md
```

## Regras de negócio

- A matriz deve conter exatamente 3 racks.
- Cada rack deve conter exatamente 3 sensores.
- Cada temperatura deve ser um número entre 10 °C e 90 °C.
- Uma leitura igual ou superior a 75 °C ativa o alerta de superaquecimento.
- As médias são calculadas individualmente para cada rack.
- A localização da maior leitura é apresentada com numeração iniciada em 1 na interface.

## Executar localmente

### Pré-requisitos

- Node.js e npm instalados.
- Git instalado.

### 1. Clone o repositório e entre na pasta do projeto

```bash
git clone https://github.com/lucasmportela/rack-monitor.git
cd rack-monitor
```

### 2. Iniciar o backend

Abra um terminal na raiz do projeto.

**Windows PowerShell:**

```powershell
cd backend
npm.cmd install
npm.cmd run dev
```

**Git Bash, Linux ou macOS:**

```bash
cd backend
npm install
npm run dev
```

A API ficará disponível em `http://localhost:3001`.

Verifique o status abrindo `http://localhost:3001/` no navegador.

### 3. Iniciar o frontend

Abra outro terminal na raiz do projeto.

**Windows PowerShell:**

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

**Git Bash, Linux ou macOS:**

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`.

O Vite encaminha automaticamente as requisições iniciadas por `/api` para o backend em `http://localhost:3001`. Assim, não é necessário alterar o endereço da API no código.

## Executar com Docker

Com Docker e Docker Compose instalados, abra um terminal na raiz do projeto e execute:

```bash
docker compose up --build
```

Acesse a aplicação em:

`http://localhost:8080`

O Nginx serve o frontend e encaminha as chamadas `/api` para o serviço `backend` pela rede interna do Docker.

Para parar e remover os containers:

```bash
docker compose down
```

## API

### `GET /`

Retorna uma mensagem indicando que a API está online.

### `POST /api/monitoramento`

Recebe uma matriz de três racks, cada um com três temperaturas.

Exemplo de requisição:

```json
{
  "matriz": [
    [25.5, 30.0, 35.2],
    [40.0, 45.5, 50.0],
    [60.0, 70.0, 78.5]
  ]
}
```

A resposta contém a matriz validada, as médias por rack, a maior temperatura, a localização do sensor mais quente, o indicador de alerta e uma mensagem.

## Teste rápido da API

Com o backend em execução, envie:

```bash
curl -X POST http://localhost:3001/api/monitoramento ^
  -H "Content-Type: application/json" ^
  -d "{\"matriz\":[[25,30,35],[40,45,50],[60,70,78.5]]}"
```

No PowerShell, se preferir, use `Invoke-RestMethod` ou uma ferramenta como Postman/Insomnia.

## Melhorias futuras

- Integração com sensores físicos.
- Persistência de histórico em banco de dados.
- Atualização automática das leituras.
- Autenticação e gerenciamento de usuários.
- Gráficos históricos e notificações.

## Autor

Projeto de estudo voltado ao desenvolvimento web, integração frontend/backend e monitoramento de infraestrutura de TI.

