$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Owner = "lucasmportela"
$BaseBranch = "main"
$Projects = @(
    @{ Folder = "SistemaContasBancarias"; Repository = "Conta-Plus-Sistema-de-Contas-Bancarias"; Description = "Conta+ - aplicação educacional de contas bancárias com Flask, SQLite e testes automatizados." },
    @{ Folder = "MonitoramentoRackDataCenter"; Repository = "Rack-Monitor-Monitoramento-Termico-de-Data-Centers"; Description = "Rack Monitor - monitoramento térmico de racks de servidores com React, Node.js e Docker." },
    @{ Folder = "SistemaDeFaturamentoDeProdutos"; Repository = "Sistema-de-Faturamento-Comercial-Cadastro-e-Controle-de-Estoque"; Description = "Sistema de faturamento e controle de estoque com Python, Flask e React." },
    @{ Folder = "AuditoriaDeEventosSistema"; Repository = "Sentinela-Sistema-de-Auditoria-de-Eventos"; Description = "Sentinela - aplicação educacional para registro e consulta de eventos de auditoria." }
)

function Invoke-CheckedCommand {
    param([string]$Executable, [string[]]$Arguments)
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao executar: $Executable $($Arguments -join ' ')"
    }
}

$RepoRoot = (& git rev-parse --show-toplevel).Trim()
if ($LASTEXITCODE -ne 0 -or -not $RepoRoot) {
    throw "Execute este script dentro de um clone do repositório lucasmportela."
}

$CurrentBranch = (& git -C $RepoRoot branch --show-current).Trim()
if ($CurrentBranch -ne $BaseBranch) {
    throw "Troque para a branch '$BaseBranch' antes de executar o script."
}

$RemoteUrl = (& git -C $RepoRoot remote get-url origin).Trim()
if ($RemoteUrl -notmatch "github\.com[:/]$Owner/lucasmportela(\.git)?$") {
    throw "O remote origin não aponta para github.com/$Owner/lucasmportela."
}

$WorkingChanges = & git -C $RepoRoot status --porcelain
if ($WorkingChanges) {
    throw "Existem alterações locais. Faça commit ou descarte-as antes de publicar os projetos."
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI não encontrado. Instale com: winget install --id GitHub.cli -e"
}

# Lista os repositórios existentes uma única vez. Não usa "gh repo view" para
# nomes inexistentes, pois algumas versões/configurações do PowerShell tratam
# a resposta GraphQL 404 como NativeCommandError e interrompem o script.
$ExistingRepositoryNames = @(
    & gh repo list $Owner --limit 1000 --json name --jq '.[].name'
)
if ($LASTEXITCODE -ne 0) {
    throw "Não foi possível consultar os repositórios de $Owner. Verifique gh auth status."
}

& gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Faça login no GitHub CLI primeiro, executando: gh auth login"
}

$GitHubUserId = (& gh api user --jq .id).Trim()
if ($LASTEXITCODE -ne 0 -or -not $GitHubUserId) {
    throw "Não foi possível identificar a conta autenticada no GitHub."
}
$CommitEmail = "$GitHubUserId+$Owner@users.noreply.github.com"

$RepositoriesToLink = @()

foreach ($Project in $Projects) {
    $SourcePath = Join-Path $RepoRoot $Project.Folder
    if (-not (Test-Path -LiteralPath $SourcePath -PathType Container)) {
        throw "Pasta do projeto não encontrada: $SourcePath"
    }

    if (-not (Test-Path -LiteralPath (Join-Path $SourcePath "README.md") -PathType Leaf)) {
        throw "README.md não encontrado em: $SourcePath"
    }

    $FullName = "$Owner/$($Project.Repository)"
    Write-Host ""
    Write-Host "==> Verificando $FullName" -ForegroundColor Cyan

    if ($ExistingRepositoryNames -contains $Project.Repository) {
        Write-Warning "O repositório $FullName já existe. Não será sobrescrito."
        $RepositoriesToLink += $Project
        continue
    }

    $TempPath = Join-Path $env:TEMP ("publish-" + $Project.Repository + "-" + [guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Path $TempPath | Out-Null

    try {
        # Copia também arquivos ocultos, como .gitignore e workflows.
        Get-ChildItem -LiteralPath $SourcePath -Force | ForEach-Object {
            Copy-Item -LiteralPath $_.FullName -Destination $TempPath -Recurse -Force
        }

        # Não publica o arquivo de dados local do faturamento; ele é recriado pelo backend.
        if ($Project.Repository -eq "Sistema-de-Faturamento-Comercial-Cadastro-e-Controle-de-Estoque") {
            $LocalData = Join-Path $TempPath "backend/data/produtos.json"
            if (Test-Path -LiteralPath $LocalData) {
                Remove-Item -LiteralPath $LocalData -Force
            }
        }

        Invoke-CheckedCommand -Executable "git" -Arguments @("-C", $TempPath, "init", "--initial-branch=main")
        Invoke-CheckedCommand -Executable "git" -Arguments @("-C", $TempPath, "add", "--all")
        Invoke-CheckedCommand -Executable "git" -Arguments @(
            "-C", $TempPath, "-c", "user.name=Lucas Martins Portela",
            "-c", "user.email=$CommitEmail",
            "commit", "-m", "chore: initial import of $($Project.Repository)"
        )

        Write-Host "Criando repositório público e enviando os arquivos..." -ForegroundColor Yellow
        Invoke-CheckedCommand -Executable "gh" -Arguments @(
            "repo", "create", $FullName, "--public",
            "--description", $Project.Description,
            "--source", $TempPath, "--remote", "origin", "--push"
        )

        $RepositoriesToLink += $Project
        Write-Host "Publicado: https://github.com/$FullName" -ForegroundColor Green
    }
    finally {
        if (Test-Path -LiteralPath $TempPath) {
            Remove-Item -LiteralPath $TempPath -Recurse -Force
        }
    }
}

$ProfileReadme = Join-Path $RepoRoot "README.md"
$ReadmeContent = [System.IO.File]::ReadAllText($ProfileReadme)
$UpdatedContent = $ReadmeContent

foreach ($Project in $RepositoriesToLink) {
    $OldUrl = "https://github.com/$Owner/lucasmportela/tree/main/$($Project.Folder)"
    $NewUrl = "https://github.com/$Owner/$($Project.Repository)"
    $UpdatedContent = $UpdatedContent.Replace($OldUrl, $NewUrl)
}

if ($UpdatedContent -ne $ReadmeContent) {
    [System.IO.File]::WriteAllText($ProfileReadme, $UpdatedContent, [System.Text.UTF8Encoding]::new($false))
    Invoke-CheckedCommand -Executable "git" -Arguments @("-C", $RepoRoot, "add", "README.md")
    Invoke-CheckedCommand -Executable "git" -Arguments @(
        "-C", $RepoRoot, "-c", "user.name=Lucas Martins Portela",
        "-c", "user.email=$CommitEmail",
        "commit", "-m", "docs(profile): link featured projects to standalone repositories"
    )
    Invoke-CheckedCommand -Executable "git" -Arguments @("-C", $RepoRoot, "push", "origin", $BaseBranch)
}

Write-Host ""
Write-Host "Processo concluído. Confira os quatro repositórios no GitHub." -ForegroundColor Green
