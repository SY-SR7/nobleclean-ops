# ============================================================
# NoblecleanOps - Auto Git Sync
# ============================================================
# GitHub: https://github.com/SY-SR7/nobleclean-ops
# ============================================================

$repoPath = "D:\Files\Programming_Projects\nobleclean"
$checkIntervalSeconds = 30
$branch = "main"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  NoblecleanOps Auto-Sync is Running..." -ForegroundColor Green
Write-Host "  Path: $repoPath" -ForegroundColor Yellow
Write-Host "  Branch: $branch" -ForegroundColor Yellow
Write-Host "  Repo: https://github.com/SY-SR7/nobleclean-ops" -ForegroundColor Yellow
Write-Host "  Checking every $checkIntervalSeconds seconds" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $repoPath

while ($true) {
    try {
        $status = git status --porcelain 2>&1

        if ($status) {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Write-Host "[$timestamp] Changes found - Pushing..." -ForegroundColor Yellow

            git add -A 2>&1 | Out-Null

            $commitMsg = "auto-sync: $timestamp"
            git commit -m $commitMsg 2>&1 | Out-Null

            $pushResult = git push origin $branch 2>&1

            if ($LASTEXITCODE -eq 0) {
                Write-Host "[$timestamp] Push successful!" -ForegroundColor Green
            } else {
                Write-Host "[$timestamp] Push failed: $pushResult" -ForegroundColor Red
            }
        } else {
            $timestamp = Get-Date -Format "HH:mm:ss"
            Write-Host "[$timestamp] No changes." -ForegroundColor DarkGray
        }
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }

    Start-Sleep -Seconds $checkIntervalSeconds
}
