# Jurupizza

Site institucional da Jurupizza, desenvolvido com HTML, CSS e JavaScript puro, com foco em apresentação visual, navegação simples e adaptação para telas menores.

## Objetivo

Apresentar a pizzaria, seu cardápio e seus canais de atendimento, com conteúdo organizado, identidade visual própria e caminhos claros para contato.

## Funcionalidades

- Apresentação da pizzaria, identidade visual e informações de contato.
- Seção de sabores, tamanhos, bebidas e promoções.
- Links de pedido que abrem o WhatsApp com mensagem pré-preenchida.
- Informações de endereço, horários e canais de atendimento.
- Menu responsivo para dispositivos móveis.

## Tecnologias utilizadas

- **HTML5** — estrutura semântica do conteúdo.
- **CSS3** — layout, identidade visual, animações e responsividade.
- **JavaScript** — menu mobile, interações do FAQ e pequenos comportamentos da interface.

## Estrutura de pastas

```text
jurupizza/
├── index.html
├── styles.css
├── script.js
├── .gitignore
├── logo-jurupizza.jpg
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

O projeto não possui back-end, API ou banco de dados. Os pedidos são encaminhados diretamente ao WhatsApp.

## Observações antes de publicar

- Confirme com o estabelecimento se telefone, e-mail, endereço, horários, preços e promoções continuam corretos.
- As fotos de comida são carregadas de endereços externos do Unsplash; é necessária conexão com a internet para exibi-las.
- O arquivo `logo-jurupizza.jpg` contém a imagem de marca recebida junto ao projeto.

---

Projeto de portfólio. Ajuste textos, imagens, links e informações de contato conforme o uso pretendido.
