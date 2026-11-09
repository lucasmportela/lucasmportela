# Publicar os projetos em repositórios individuais

O portfólio mantém os projetos organizados no repositório principal. Este script publica cópias independentes dos quatro sistemas de destaque e atualiza os links correspondentes no README do perfil. Os nomes abaixo são os nomes atuais dos repositórios no GitHub.

## Repositórios utilizados

| Projeto | Repositório |
|---|---|
| Conta+ | [Conta-Plus-Sistema-de-Contas-Bancarias](https://github.com/lucasmportela/Conta-Plus-Sistema-de-Contas-Bancarias) |
| Rack Monitor | [Rack-Monitor-Monitoramento-Termico-de-Data-Centers](https://github.com/lucasmportela/Rack-Monitor-Monitoramento-Termico-de-Data-Centers) |
| Sistema de Faturamento | [Sistema-de-Faturamento-Comercial-Cadastro-e-Controle-de-Estoque](https://github.com/lucasmportela/Sistema-de-Faturamento-Comercial-Cadastro-e-Controle-de-Estoque) |
| Sentinela — Auditoria de Eventos | [Sentinela-Sistema-de-Auditoria-de-Eventos](https://github.com/lucasmportela/Sentinela-Sistema-de-Auditoria-de-Eventos) |

## Pré-requisitos

- Git instalado.
- GitHub CLI instalado.
- Autenticação do GitHub CLI concluída.
- Clone local de `https://github.com/lucasmportela/lucasmportela`.
- Branch `main` atualizada e sem alterações locais pendentes.

### Instalar e autenticar o GitHub CLI

No Windows PowerShell:

```powershell
winget install --id GitHub.cli -e
gh auth login
```

Feche e abra o terminal novamente após instalar o GitHub CLI.

## Executar

Na pasta raiz do clone do repositório `lucasmportela/lucasmportela`, execute:

```powershell
git switch main
git pull origin main
powershell -ExecutionPolicy Bypass -File .\scripts\publish-featured-repositories.ps1
```

O script:

1. Confere a branch, o remote, a autenticação e a ausência de alterações locais.
2. Copia os arquivos de cada projeto, incluindo README, screenshots, `.gitignore` e workflows.
3. Cria como públicos apenas os repositórios que ainda não existirem na conta `lucasmportela`; os existentes são preservados.
4. Envia os arquivos para a branch `main` de cada novo repositório.
5. Atualiza os links dos quatro projetos no README principal e envia essa alteração para o GitHub.

## Segurança e comportamento

- O script não apaga nem renomeia as pastas do repositório principal.
- Os repositórios existentes nunca são sobrescritos; se algum já existir, o script o ignora.
- A criação é pública porque estes projetos fazem parte do portfólio.
- Se o processo for interrompido, execute novamente. Repositórios que já existirem serão ignorados e o processo continuará com os demais, sem sobrescrever seu conteúdo.
- Revise os arquivos e remova qualquer segredo ou dado pessoal antes de publicar.

## Observação sobre o histórico

Cada repositório recebe um commit inicial com os arquivos atuais do projeto. O histórico antigo do monorepo não é copiado. O repositório principal continua preservado como índice do portfólio.
