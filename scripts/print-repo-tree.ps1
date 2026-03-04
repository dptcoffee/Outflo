# ==========================================================
# OUTFLO - REPOSITORY TREE PRINTER
# File: scripts/print-repo-tree.ps1
# Scope: Generate a stable repository filesystem snapshot
# ==========================================================

param(
  [switch]$WriteToDocs,
  [int]$MaxDepth = 4
)

$ErrorActionPreference = "Stop"

# ------------------------------
# Repo Root
# ------------------------------
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $RepoRoot

$OutPath = Join-Path $RepoRoot "docs\repo-tree.txt"

# ------------------------------
# Config
# ------------------------------
$IncludeRoots = @(
  "app",
  "components",
  "hooks",
  "lib",
  "public",
  "docs",
  "scripts"
)

$ExcludeDirs = @(
  "node_modules",
  ".next",
  ".git",
  ".vercel",
  ".turbo",
  "dist",
  "build",
  "out"
)

# ------------------------------
# Helpers
# ------------------------------
function Is-ExcludedPath {
  param([string]$FullName)

  foreach ($d in $ExcludeDirs) {
    $pattern = "(^|\\)$([Regex]::Escape($d))(\\|$)"
    if ($FullName -match $pattern) { return $true }
  }
  return $false
}

function Get-Children {
  param([string]$Path)

  Get-ChildItem -LiteralPath $Path -Force |
    Where-Object { -not (Is-ExcludedPath $_.FullName) } |
    Sort-Object @{ Expression = { -not $_.PSIsContainer } }, Name
}

function Print-Node {
  param(
    [string]$Path,
    [string]$Prefix,
    [int]$Depth,
    [int]$LimitDepth
  )

  if ($Depth -gt $LimitDepth) { return @() }

  $lines = @()
  $items = @(Get-Children -Path $Path)

  for ($i = 0; $i -lt $items.Count; $i++) {
    $item = $items[$i]
    $isLast = ($i -eq $items.Count - 1)

    $branch = "+-- "
    $nextPrefix = $Prefix + $(if ($isLast) { "    " } else { "|   " })

    if ($item.PSIsContainer) {
      $lines += ($Prefix + $branch + $item.Name + "\")
      $lines += Print-Node -Path $item.FullName -Prefix $nextPrefix -Depth ($Depth + 1) -LimitDepth $LimitDepth
    } else {
      $lines += ($Prefix + $branch + $item.Name)
    }
  }

  return $lines
}

# ------------------------------
# Build Output
# ------------------------------
$Lines = @()
$Lines += "OUTFLO - REPOSITORY TREE"
$Lines += ("Generated: " + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss"))
$Lines += ("Root: " + $RepoRoot)
$Lines += ""

foreach ($root in $IncludeRoots) {
  $full = Join-Path $RepoRoot $root

  if (!(Test-Path $full)) {
    $Lines += ($root + "\ (missing)")
    $Lines += ""
    continue
  }

  $Lines += ($root + "\")
  $Lines += Print-Node -Path $full -Prefix "" -Depth 1 -LimitDepth $MaxDepth
  $Lines += ""
}

# ------------------------------
# Output
# ------------------------------
if ($WriteToDocs) {
  $docsDir = Split-Path $OutPath -Parent
  if (!(Test-Path $docsDir)) { New-Item -ItemType Directory -Path $docsDir | Out-Null }

  $Lines | Set-Content -Path $OutPath -Encoding UTF8
  Write-Host ("Wrote: " + $OutPath)
} else {
  $Lines | ForEach-Object { Write-Output $_ }
}