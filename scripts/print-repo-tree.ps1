# ==========================================================
# OUTFLO - REPOSITORY TREE PRINTER
# File: scripts/print-repo-tree.ps1
# Scope: Generate current repository tree and timestamped snapshots
# ==========================================================

param(
  [switch]$WriteToDocs,
  [int]$MaxDepth = 6
)

$ErrorActionPreference = "Stop"

# ------------------------------
# Repo Root + Output Paths
# ------------------------------
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $RepoRoot

$RepositoryDir = Join-Path $RepoRoot "docs\repository"
$CurrentDir = Join-Path $RepositoryDir "current"
$SnapshotsDir = Join-Path $RepositoryDir "snapshots"

$CurrentOutPath = Join-Path $CurrentDir "repository-tree.txt"

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
  "out",
  "coverage"
)

$ExcludeFiles = @(
  ".DS_Store"
)

# ------------------------------
# Helpers
# ------------------------------
function Is-ExcludedPath {
  param([string]$FullName)

  foreach ($d in $ExcludeDirs) {
    $pattern = "(^|\\)$([Regex]::Escape($d))(\\|$)"
    if ($FullName -match $pattern) {
      return $true
    }
  }

  return $false
}

function Is-ExcludedFile {
  param([string]$Name)

  return $ExcludeFiles -contains $Name
}

function Get-Children {
  param([string]$Path)

  Get-ChildItem -LiteralPath $Path -Force |
    Where-Object {
      if ($_.PSIsContainer) {
        -not (Is-ExcludedPath $_.FullName)
      }
      else {
        (-not (Is-ExcludedPath $_.FullName)) -and (-not (Is-ExcludedFile $_.Name))
      }
    } |
    Sort-Object @{ Expression = { -not $_.PSIsContainer } }, Name
}

function Print-Node {
  param(
    [string]$Path,
    [string]$Prefix,
    [int]$Depth,
    [int]$LimitDepth
  )

  if ($Depth -gt $LimitDepth) {
    return @()
  }

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
    }
    else {
      $lines += ($Prefix + $branch + $item.Name)
    }
  }

  return $lines
}

function Ensure-Directory {
  param([string]$Path)

  if (!(Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

# ------------------------------
# Build Output
# ------------------------------
$Now = Get-Date
$UnixTime = [DateTimeOffset]$Now
$UnixSeconds = $UnixTime.ToUnixTimeSeconds()
$HumanStamp = $Now.ToString("yyyy-MM-dd_HH-mm")
$SnapshotFileName = "$UnixSeconds" + "__" + "$HumanStamp.txt"
$SnapshotOutPath = Join-Path $SnapshotsDir $SnapshotFileName

$Lines = @()
$Lines += "OUTFLO - REPOSITORY TREE"
$Lines += ("Generated: " + $Now.ToString("yyyy-MM-dd HH:mm:ss"))
$Lines += ("Unix: " + $UnixSeconds)
$Lines += ("Root: " + $RepoRoot)
$Lines += ""

foreach ($root in $IncludeRoots) {
  $full = Join-Path $RepoRoot $root

  if (!(Test-Path -LiteralPath $full)) {
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
  Ensure-Directory -Path $RepositoryDir
  Ensure-Directory -Path $CurrentDir
  Ensure-Directory -Path $SnapshotsDir

  $Lines | Set-Content -Path $CurrentOutPath -Encoding UTF8
  $Lines | Set-Content -Path $SnapshotOutPath -Encoding UTF8

  Write-Host ("Wrote current tree: " + $CurrentOutPath)
  Write-Host ("Wrote snapshot: " + $SnapshotOutPath)
}
else {
  $Lines | ForEach-Object { Write-Output $_ }
}