# Auditoria de Consumo de Combustível da Frota

Aplicação web educacional para auditar o consumo de combustível dos veículos que retornam à base operacional durante um turno de trabalho.

O projeto transforma um exercício de lógica em Python em uma aplicação com frontend e backend, mantendo as regras de cálculo e classificação do código original.

## Funcionalidades

- Registro contínuo de veículos durante o turno.
- Entrada de distância percorrida em quilômetros e combustível consumido em litros.
- Validação para aceitar somente valores maiores que zero.
- Cálculo do consumo médio individual em km/l.
- Classificação automática do desempenho:
  - **Econômico:** consumo maior ou igual a 12 km/l.
  - **Padrão:** consumo maior ou igual a 9 e menor que 12 km/l.
  - **Alto Consumo:** consumo inferior a 9 km/l.
- Acumuladores do turno: quantidade de veículos, quilometragem total e soma dos consumos individuais.
- Fechamento do turno com média geral de consumo da frota.
- Opção para iniciar uma nova auditoria.

## Tecnologias utilizadas

- **Backend:** Python 3 e Flask.
- **Frontend:** HTML5, CSS3 e JavaScript.
- **Comunicação:** API HTTP com JSON.

## Estrutura de pastas

```text
AuditoriaConsumoCombustivel/
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

### 1. Acesse a pasta do projeto

```bash
cd AuditoriaConsumoCombustivel
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

### 4. Inicie o backend

```bash
python backend/app.py
```

### 5. Abra no navegador

```text
http://127.0.0.1:5000
```

> Acesse pelo endereço do Flask. Não abra o `index.html` diretamente nem utilize o Live Server, pois a interface precisa se comunicar com a API.

## Regras de negócio

| Regra | Comportamento |
|---|---|
| Distância | Deve ser maior que zero para registrar um veículo |
| Encerramento | O botão Encerrar turno representa a entrada de `0` km do exercício |
| Combustível | Deve ser estritamente maior que zero |
| Econômico | Consumo >= 12 km/l |
| Padrão | 9 km/l <= consumo < 12 km/l |
| Alto Consumo | Consumo < 9 km/l |
| Média geral | Soma dos consumos individuais / quantidade de veículos |

A média geral segue a regra do código original: média aritmética dos consumos individuais registrados, e não a divisão da quilometragem total pelo total de litros.

## API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Carrega a interface web. |
| POST | `/api/auditoria/processar` | Calcula e classifica um veículo. |
| POST | `/api/auditoria/resumo` | Calcula o resumo do turno a partir dos acumuladores. |

Exemplo de requisição para processar um veículo:

```json
{
  "km": 150,
  "litros": 12.5
}
```

## Restrição técnica e observações

O exercício original solicita o uso exclusivo de acumuladores e variáveis numéricas primitivas, sem listas ou estruturas compostas. A interface web mantém os acumuladores numéricos (`vehicleCount`, `totalKm` e `sumConsumptions`) no JavaScript durante o turno; o backend recebe os valores do veículo e os acumuladores para realizar os cálculos e validações.

Como se trata de uma aplicação web, os dados ficam somente em memória durante a sessão no navegador e não são persistidos em banco de dados.

## Autor

Projeto desenvolvido para praticar lógica de programação, estruturas de repetição, validação de entradas, acumuladores, operações aritméticas, Python, Flask e integração frontend/backend.
