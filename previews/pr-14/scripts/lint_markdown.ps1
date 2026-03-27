param(
    [switch]$Fix
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path "$PSScriptRoot\..").Path
Set-Location $repoRoot

function Get-MarkdownlintRunner {
    param(
        [string]$RepoRootPath
    )

    $localCandidates = @(
        (Join-Path $RepoRootPath "node_modules\.bin\markdownlint.cmd"),
        (Join-Path $RepoRootPath "node_modules\.bin\markdownlint.ps1"),
        (Join-Path $RepoRootPath "node_modules\.bin\markdownlint")
    )

    foreach ($candidate in $localCandidates) {
        if (Test-Path $candidate) {
            return @{
                Name       = "local"
                Command    = $candidate
                PrefixArgs = @()
            }
        }
    }

    $globalNames = @("markdownlint", "markdownlint-cli")
    foreach ($name in $globalNames) {
        $globalCmd = Get-Command $name -ErrorAction SilentlyContinue
        if ($globalCmd) {
            return @{
                Name       = "global"
                Command    = $globalCmd.Source
                PrefixArgs = @()
            }
        }
    }

    return $null
}

function Write-MarkdownlintSetupHints {
    Write-Host ""
    Write-Host "No offline markdownlint runner is currently available." -ForegroundColor Yellow
    Write-Host "Install one of these once, then rerun:" -ForegroundColor Yellow
    Write-Host "  npm i -g markdownlint-cli" -ForegroundColor Yellow
    Write-Host "  npm i -D markdownlint-cli" -ForegroundColor Yellow
}

function Invoke-Markdownlint {
    param(
        [switch]$DoFix
    )

    $mdArgs = @("**/*.md", "--config", ".markdownlint.jsonc", "--ignore-path", ".markdownlintignore")
    if ($DoFix) {
        $mdArgs += "--fix"
    }

    $runner = Get-MarkdownlintRunner -RepoRootPath $repoRoot
    if (-not $runner) {
        Write-MarkdownlintSetupHints
        Write-Host "markdownlint runner not found." -ForegroundColor Red
        return 1
    }

    $runnerArgs = @($runner.PrefixArgs + $mdArgs)
    & $runner.Command @runnerArgs
    $exitCode = $LASTEXITCODE

    return $exitCode
}

$exitCode = Invoke-Markdownlint -DoFix:$Fix
if ($exitCode -ne 0) {
    exit $exitCode
}

Write-Host "Markdown lint passed." -ForegroundColor Green