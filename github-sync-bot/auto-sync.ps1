param(
  [string]$ProjectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path,
  [string]$ProjectRemote = "",
  [string]$BotRemote = "",
  [string]$Branch = "main",
  [switch]$RunQuality,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step {
  param([string]$Message)
  Write-Host "[nobleclean-sync] $Message"
}

function Invoke-Checked {
  param(
    [string]$FilePath,
    [string[]]$Arguments,
    [string]$WorkingDirectory
  )

  $display = "$FilePath $($Arguments -join ' ')"
  Write-Step $display

  if ($DryRun) {
    return
  }

  $process = Start-Process `
    -FilePath $FilePath `
    -ArgumentList $Arguments `
    -WorkingDirectory $WorkingDirectory `
    -NoNewWindow `
    -PassThru `
    -Wait

  if ($process.ExitCode -ne 0) {
    throw "Command failed with exit code $($process.ExitCode): $display"
  }
}

function Assert-InProject {
  param([string]$Path)

  $resolvedRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
  $resolvedPath = (Resolve-Path -LiteralPath $Path).Path

  if (-not $resolvedPath.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to operate outside project root: $resolvedPath"
  }
}

function Test-CommandAvailable {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Assert-NoForbiddenTrackedFiles {
  param([string]$Root)

  $forbiddenRegex = '(^|/)(\.env($|\.)|node_modules/|\.next/|out/|build/|dist/|\.tools/|\.playwright-cli/|\.vercel/|supabase/\.temp/)|\.(pem|key|crt|p12|pfx)$'
  $tracked = & git -C $Root ls-files
  $forbidden = @(
    $tracked | Where-Object {
      $normalized = $_ -replace '\\', '/'
      $isEnvironmentExample =
        $normalized -eq ".env.example" -or
        $normalized -match '^\.env\..+\.example$'

      -not $isEnvironmentExample -and $normalized -match $forbiddenRegex
    }
  )

  if ($forbidden.Count -gt 0) {
    $list = $forbidden -join [Environment]::NewLine
    throw "Refusing to sync forbidden tracked files:$([Environment]::NewLine)$list"
  }
}

function Ensure-Origin {
  param(
    [string]$Root,
    [string]$RemoteUrl
  )

  if ([string]::IsNullOrWhiteSpace($RemoteUrl)) {
    Write-Step "No remote URL provided for $Root; skipping remote configuration."
    return
  }

  $remoteNames = @(& git -C $Root remote)
  $hasOrigin = $remoteNames -contains "origin"
  $existing = if ($hasOrigin) { (& git -C $Root remote get-url origin).Trim() } else { "" }

  if ([string]::IsNullOrWhiteSpace($existing)) {
    Invoke-Checked -FilePath "git" -Arguments @("-C", $Root, "remote", "add", "origin", $RemoteUrl) -WorkingDirectory $Root
    return
  }

  if ($existing -ne $RemoteUrl) {
    throw "Origin already points to '$existing'. Refusing to replace it with '$RemoteUrl'."
  }
}

function Ensure-Branch {
  param([string]$Root, [string]$Name)

  $current = (& git -C $Root branch --show-current).Trim()

  if ($current -eq $Name) {
    return
  }

  if ($DryRun) {
    Write-Step "Would switch/create branch $Name from $current."
    return
  }

  Invoke-Checked -FilePath "git" -Arguments @("-C", $Root, "branch", "-M", $Name) -WorkingDirectory $Root
}

function Commit-IfNeeded {
  param([string]$Root, [string]$Message)

  $changes = (& git -C $Root status --porcelain)

  if ([string]::IsNullOrWhiteSpace(($changes -join ""))) {
    Write-Step "No changes to commit in $Root."
    return
  }

  Invoke-Checked -FilePath "git" -Arguments @("-C", $Root, "add", "--all") -WorkingDirectory $Root
  Invoke-Checked -FilePath "git" -Arguments @("-C", $Root, "commit", "-m", $Message) -WorkingDirectory $Root
}

function Push-Origin {
  param([string]$Root, [string]$Name)

  $remoteNames = @(& git -C $Root remote)
  $hasOrigin = $remoteNames -contains "origin"
  $origin = if ($hasOrigin) { (& git -C $Root remote get-url origin).Trim() } else { "" }

  if ([string]::IsNullOrWhiteSpace($origin)) {
    Write-Step "No origin configured for $Name. Provide a remote URL to push."
    return
  }

  Invoke-Checked -FilePath "git" -Arguments @("-C", $Root, "push", "-u", "origin", $Branch) -WorkingDirectory $Root
}

function Sync-BotRepository {
  param([string]$RemoteUrl)

  if ([string]::IsNullOrWhiteSpace($RemoteUrl)) {
    Write-Step "No bot remote provided; bot repository push skipped."
    return
  }

  $botSource = (Resolve-Path -LiteralPath $PSScriptRoot).Path
  $botWorkRoot = Join-Path $ProjectRoot ".sync-work\nobleclean-sync-bot"
  $botWorkParent = Split-Path -Parent $botWorkRoot

  if (-not $DryRun) {
    New-Item -ItemType Directory -Force -Path $botWorkParent | Out-Null

    if (Test-Path -LiteralPath $botWorkRoot) {
      Remove-Item -LiteralPath $botWorkRoot -Recurse -Force
    }

    New-Item -ItemType Directory -Force -Path $botWorkRoot | Out-Null
    Copy-Item -LiteralPath (Join-Path $botSource "*") -Destination $botWorkRoot -Recurse -Force
    Invoke-Checked -FilePath "git" -Arguments @("-C", $botWorkRoot, "init") -WorkingDirectory $botWorkRoot
  } else {
    Write-Step "Would create bot worktree at $botWorkRoot."
  }

  Ensure-Origin -Root $botWorkRoot -RemoteUrl $RemoteUrl
  Ensure-Branch -Root $botWorkRoot -Name $Branch
  Commit-IfNeeded -Root $botWorkRoot -Message "Initialize NobleClean sync bot"
  Push-Origin -Root $botWorkRoot -Name "bot"
}

Assert-InProject -Path $ProjectRoot

if (-not (Test-CommandAvailable -Name "git")) {
  throw "Git is required."
}

Write-Step "Project root: $ProjectRoot"
Assert-NoForbiddenTrackedFiles -Root $ProjectRoot

if ($RunQuality) {
  Invoke-Checked -FilePath "npm" -Arguments @("run", "quality") -WorkingDirectory $ProjectRoot
}

Ensure-Origin -Root $ProjectRoot -RemoteUrl $ProjectRemote
Ensure-Branch -Root $ProjectRoot -Name $Branch
Commit-IfNeeded -Root $ProjectRoot -Message "Sync NobleClean project files"
Push-Origin -Root $ProjectRoot -Name "project"
Sync-BotRepository -RemoteUrl $BotRemote

Write-Step "Sync flow finished."
