/* ==========================================================
   OUTFLO — REPOSITORY TREE PRINTER
   File: scripts/print-repo-tree.ps1
   Scope: Generate a stable repository filesystem snapshot
   ========================================================== */

param(
  [switch]$WriteToDocs
)

$ErrorActionPreference = "Stop"

# Resolve repo root
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$outPath = Join-Path $repoRoot "docs\repo-tree.txt"

# Top-level directories to show
$roots = @(
  "app",
  "components",
  "hooks",
  "lib",
  "public",
  "docs",
  "scripts"
)

# Excluded directories
$excludeDirs = @(
  "node_modules",
  ".next",
  ".git"
)

function Should-Skip($path) {
  foreach ($dir in $excludeDirs) {
    if ($path -match ("[\\\/]" + [Regex]::Escape($dir) + "([\\\/]|$)")) {
      return $true
    }
  }
  return $false
}

function Print-Tree($dir, $prefix = "") {

  if (!(Test-Path $dir)) {
    Write-Output "$prefix$dir/ (missing)"
    return
  }

  Write-Output "$prefix$dir/"

  $items = Get-ChildItem $dir | Sort-Object @{Expression = { -not $_.PSIsContainer }}, Name

  foreach ($item in $items) {

    if (Should-Skip $item.FullName) { continue }

    if ($item.PSIsContainer) {
      Write-Output "$prefix  ├─ $($item.Name)/"
    }
    else {
      Write-Output "$prefix  ├─ $($item.Name)"
    }
  }
}

$lines = @()
$lines += "OUTFLO — REPOSITORY TREE"
$lines += "Generated: $(Get-Date)"
$lines += ""

foreach ($root in $roots) {
  $lines += Print-Tree $root
  $lines += ""
}

if ($WriteToDocs) {
  $lines | Set-Content $outPath
  Write-Host "Repository tree written to docs/repo-tree.txt"
}
else {
  $lines
}