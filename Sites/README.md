# Portfólio de Sites

Coleção de quatro sites demonstrativos desenvolvidos com **HTML5, CSS3 e JavaScript puro**. Cada projeto é independente e pode ser executado localmente ou publicado separadamente no GitHub Pages.

## Projetos

| Projeto | Segmento | Pasta |
|---|---|---|
| **Jurupizza** | Pizzaria e petiscaria | [`Jurupizza/`](Jurupizza/) |
| **Leal & Freitas Advocacia** | Serviços jurídicos | [`Leal&FreitasAdvocacia/`](Leal&FreitasAdvocacia/) |
| **Aurea Dental Studio** | Clínica odontológica | [`AureaDentalStudio/`](AureaDentalStudio/) |
| **Casa Norte Imóveis** | Mercado imobiliário | [`CasaNorteImóveis/`](CasaNorteImóveis/) |

## Tecnologias

- HTML5
- CSS3
- JavaScript (Vanilla)
- Google Fonts e imagens externas do Unsplash em alguns projetos

## Como executar

### 1. Clone o repositório e entre na pasta Sites

```bash
git clone https://github.com/lucasmportela/lucasmportela.git
cd lucasmportela/Sites
```

### 2. Escolha o site que deseja executar

Exemplo com o Jurupizza:

```bash
cd Jurupizza
python -m http.server 5500
```

Acesse `http://localhost:5500`. Para testar outro site, encerre o servidor com `Ctrl+C`, volte para a pasta `Sites` com `cd ..` e entre na pasta desejada. Use aspas em nomes que contenham espaços, acentos ou caracteres especiais, por exemplo: `cd "Leal&FreitasAdvocacia"`.

## Organização

Cada projeto contém seu próprio `README.md`, arquivos de front-end, `.gitignore` e pasta `prints/` para capturas de tela.

## Back-end

Os quatro projetos são sites estáticos e não incluem back-end, API ou banco de dados. Os fluxos de contato são feitos por links externos para WhatsApp. Não foi adicionada uma camada de servidor sem necessidade funcional.

## Antes de publicar

- Confira os `README.md` individuais.
- Adicione capturas reais na pasta `prints/` de cada projeto.
- Revise números de WhatsApp, endereços, preços, horários e demais dados.
- Os conteúdos de Advocacia, Clínica e Imobiliária são demonstrativos; substitua dados fictícios antes de qualquer uso comercial.
- Alguns recursos visuais dependem de conexão com a internet.

## Publicação

Você pode publicar o repositório completo como portfólio ou criar um repositório separado para cada pasta. Para publicar um projeto individual no GitHub Pages, siga as instruções do README da respectiva pasta.
