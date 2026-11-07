# Sistema de Vendas

Aplicação web desenvolvida a partir de um exercício de Programação Orientada a Objetos em Python. O sistema permite registrar produtos, aplicar descontos automáticos, calcular parcelamentos de até 6 vezes e acompanhar o faturamento acumulado das vendas finalizadas.

## Funcionalidades

- Adicionar vários produtos a uma venda.
- Impedir valores negativos ou iguais a zero.
- Aplicar desconto automático sobre o subtotal:
  - Acima de R$ 100,00: 5%.
  - Acima de R$ 200,00: 10%.
- Escolher de 1 a 6 parcelas.
- Exibir o valor de cada parcela.
- Finalizar a venda e somar o total ao faturamento acumulado.
- Cancelar a venda atual sem alterar o faturamento já registrado.
- Interface responsiva para desktop e dispositivos móveis.

## Tecnologias

- **Backend:** Python 3 e Flask.
- **Frontend:** HTML5, CSS3 e JavaScript.
- **Comunicação:** API HTTP com JSON.
- **Sessão:** Flask Session para manter os dados da venda durante o uso.

## Estrutura do projeto

```text
SistemaVendas/
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

### 2. Entre na pasta do projeto

```bash
cd SistemaVendas
```

### 3. (Opcional) Crie e ative um ambiente virtual

Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### 4. Instale as dependências

```bash
pip install -r backend/requirements.txt
```

### 5. Inicie o servidor

```bash
python backend/app.py
```

### 6. Abra no navegador

```text
http://127.0.0.1:5000
```

## Como utilizar

1. Informe o valor de um produto e clique em **Adicionar**.
2. Repita para incluir os demais produtos.
3. Escolha a quantidade de parcelas (de 1 a 6).
4. Clique em **Calcular pagamento** para fechar a venda e visualizar o desconto e as parcelas.
5. Confira o resumo e clique em **Finalizar venda** para registrar o faturamento.
6. O faturamento acumulado será atualizado e o formulário ficará pronto para a próxima venda.
7. Use **Cancelar venda atual** para descartar os itens da venda em andamento sem alterar o faturamento acumulado.

## Regras de negócio

| Regra | Comportamento |
|---|---|
| Valor do produto | Deve ser maior que zero. |
| Subtotal acima de R$ 100 | Desconto de 5%, desde que não ultrapasse R$ 200. |
| Subtotal acima de R$ 200 | Desconto de 10%. |
| Parcelamento | De 1 a 6 parcelas. |
| Faturamento | Soma o total com desconto de cada venda finalizada. |

**Atenção aos limites:** seguindo o código original, subtotal exatamente igual a R$ 100,00 não recebe desconto; subtotal exatamente igual a R$ 200,00 recebe 5%; o desconto de 10% só começa acima de R$ 200,00.

## Rotas da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/status` | Consulta carrinho, totais e faturamento. |
| POST | `/api/produtos` | Adiciona um produto. |
| POST | `/api/fechar-venda` | Calcula desconto e parcelas. |
| POST | `/api/finalizar-venda` | Registra a venda no faturamento e limpa o carrinho. |
| POST | `/api/cancelar-venda` | Cancela a venda em andamento. |

Exemplo de requisição para adicionar produto:

```json
{
  "valor": 150.00
}
```

Exemplo de requisição para fechar a venda:

```json
{
  "parcelas": 3
}
```

## Observações

Este é um projeto educacional. Os dados são mantidos na sessão do navegador e não são armazenados em banco de dados. Ao encerrar ou limpar a sessão, o faturamento da sessão pode ser perdido. Para uso real, seria necessário implementar persistência em banco de dados, autenticação, proteção de sessão e configuração de produção do Flask.

## Autor

Projeto desenvolvido para praticar Python, orientação a objetos, regras de negócio, APIs e desenvolvimento web.
