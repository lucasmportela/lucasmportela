# Aurea Dental Studio

Site institucional demonstrativo para clínica odontológica desenvolvido com HTML, CSS e JavaScript puro, com foco em apresentação visual, navegação simples e adaptação para telas menores.

## Objetivo

Demonstrar a criação de uma página institucional/landing page para o segmento, com conteúdo organizado, identidade visual própria e caminhos claros para contato.

## Funcionalidades

- Apresentação da clínica e da experiência de atendimento.
- Seções de benefícios, tratamentos, diferenciais e depoimentos.
- Perguntas frequentes com abertura de uma pergunta por vez.
- Chamadas para avaliação e contato via WhatsApp.
- Menu responsivo e navegação por âncoras.

## Tecnologias utilizadas

- **HTML5** — estrutura semântica do conteúdo.
- **CSS3** — layout, identidade visual, animações e responsividade.
- **JavaScript** — menu mobile, interações do FAQ e pequenos comportamentos da interface.

## Estrutura de pastas

```text
clinica-premium/
├── index.html
├── styles.css
├── script.js
├── .gitignore
└── prints/
    ├── README.md
    └── .gitkeep
```

## Como executar localmente

Não é necessário instalar dependências.

**Opção 1 — abrir diretamente:** abra o arquivo `index.html` no navegador.

**Opção 2 — servidor local com Python:**

```bash
python -m http.server 5500
```

Depois, acesse `http://localhost:5500` no navegador, mantendo o terminal aberto na pasta do projeto.

No Windows, se o comando `python` não funcionar, tente:

```bash
py -m http.server 5500
```

Também é possível abrir a pasta no Visual Studio Code e executar com a extensão **Live Server**.

## Prints da aplicação

A pasta `prints/` está preparada para receber capturas reais das versões desktop e mobile. Consulte `prints/README.md` para os nomes recomendados.

## Publicação no GitHub Pages

1. Envie os arquivos deste projeto para um repositório GitHub.
2. Abra **Settings → Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**.
4. Selecione a branch `main` e a pasta `/ (root)`.
5. Salve e aguarde a publicação.

## Back-end

O projeto não possui back-end, API ou banco de dados. Os botões de contato direcionam o visitante para o WhatsApp.

## Observações antes de publicar

- A marca, os textos, os valores, as métricas, os depoimentos e as informações de contato são demonstrativos.
- Substitua o telefone de exemplo `5511999999999` pelo número oficial (DDI + DDD + número) em todos os links `wa.me`.
- Revise as informações clínicas e comerciais com os responsáveis técnicos antes de publicar ou utilizar o site com pacientes.

---

Projeto de portfólio. Ajuste textos, imagens, links e informações de contato conforme o uso pretendido.
