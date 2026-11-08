# 🧮 Calculadora React

Uma calculadora web desenvolvida com **React**, **JavaScript** e **Webpack**, com interface responsiva e operações matemáticas básicas.

O projeto foi criado para praticar desenvolvimento frontend, componentização com React, gerenciamento de estado com Hooks e configuração de ambiente com Webpack e Babel.

## ✨ Funcionalidades

- Adição, subtração, multiplicação e divisão.
- Validação para impedir divisão por zero.
- Validação dos campos numéricos.
- Exibição do resultado formatado de acordo com a localidade brasileira.
- Histórico das últimas 6 operações.
- Opção para limpar os campos e o resultado.
- Opção para limpar o histórico.
- Interface responsiva para diferentes tamanhos de tela.

## 🛠️ Tecnologias utilizadas

- [React](https://react.dev/) — construção da interface.
- [JavaScript](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript) — lógica da aplicação.
- [Webpack](https://webpack.js.org/) — empacotamento e servidor de desenvolvimento.
- [Babel](https://babeljs.io/) — transformação de JSX e JavaScript.
- HTML5 e CSS3 — estrutura e estilização.

## 📁 Estrutura do projeto

```text
CalculadoraSimples/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx
│   ├── index.jsx
│   └── style.css
├── package.json
├── webpack.config.js
└── README.md
```

## ⚙️ Pré-requisitos

Antes de executar o projeto, instale:

- [Node.js](https://nodejs.org/) (que já inclui o npm).
- Git (opcional, para enviar o projeto ao GitHub).

## 🚀 Como executar localmente

### 1. Clone o repositório

```bash
git clone https://github.com/SEU-USUARIO/CalculadoraSimples.git
```

Entre na pasta do projeto:

```bash
cd CalculadoraSimples
```

> Se você baixou o projeto como ZIP, extraia o arquivo e abra o terminal dentro da pasta `CalculadoraSimples`.

### 2. Instale as dependências

No Windows PowerShell, utilize:

```powershell
npm.cmd install
```

No Prompt de Comando, Git Bash, Linux ou macOS, utilize:

```bash
npm install
```

### 3. Inicie a aplicação

No Windows PowerShell:

```powershell
npm.cmd start
```

Nos demais terminais:

```bash
npm start
```

O Webpack iniciará o servidor de desenvolvimento. Abra no navegador:

```text
http://localhost:3000
```

## 📦 Gerar versão de produção

Para gerar os arquivos otimizados para produção:

No Windows PowerShell:

```powershell
npm.cmd run build
```

Em outros terminais:

```bash
npm run build
```

Os arquivos gerados ficarão na pasta `dist/`.

## 🧠 Lógica da calculadora

A aplicação recebe dois números e uma operação matemática. O cálculo é realizado de acordo com o operador selecionado:

| Operação | Operador |
|---|---|
| Adição | `+` |
| Subtração | `-` |
| Multiplicação | `*` |
| Divisão | `/` |

A aplicação verifica se os campos foram preenchidos, valida os valores numéricos e impede a divisão por zero. Quando o cálculo é concluído, o resultado é apresentado na tela e a operação é adicionada ao histórico.

## 📚 Objetivos de aprendizado

Este projeto permite praticar:

- Criação de componentes com React.
- Uso do Hook `useState`.
- Manipulação de eventos e formulários.
- Renderização condicional.
- Validação de entradas.
- Organização de arquivos em um projeto frontend.
- Configuração de Webpack e Babel.

## 👨‍💻 Autor

Desenvolvido como projeto de estudo e prática de desenvolvimento frontend.

---

Se este projeto foi útil para seus estudos, fique à vontade para deixar uma ⭐ no repositório!
