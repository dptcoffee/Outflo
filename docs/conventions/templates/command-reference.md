# OUTFLO — COMMAND REFERENCE

Status: ACTIVE  
Scope: Quick-access commands for daily workflow

Purpose:

Reduce cognitive drag.

Do not memorize commands.  
Reference them.

Keep this document minimal and useful.

---

## 1. Git — Commit + Push

# Save all changes and push to remote
git add .
git commit -m "message"
git push

---

## 2. Git — Timeline (Compact)

# View commit history as a clean timeline
git log --oneline --graph --decorate

---

## 3. Git — Full History

# View full commit details (author, date, message)
git log

---

## 4. Git — Inspect Commit

# See exact changes in a specific commit
git show <commit_hash>

---

## 5. Git — File / Folder History

# See history for a specific directory
git log -- docs/

---

## 6. Git — Compare Changes

# Compare differences between two commits
git diff <commit1> <commit2>

---

## 7. Git — Status

# See current working state (modified, staged, etc.)
git status

---

## 8. Timestamp Script (PowerShell)

# Generate canonical Outflō timestamp (unix_ms + exact human time)
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$iso = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$human = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss.fff UTC")

Write-Output $ts
Write-Output $iso
Write-Output $human

---

## 9. Timestamp Filename Format

# Format for event documents (must match timestamp law)
{name}-vN__{unix_ms}__{YYYY-MM-DD_HH-MM-SS-mmm}.md

---

## 10. Dev — Run Server

# Start local development server
npm run dev

---

## 11. Dev — Build

# Create production build
npm run build

---

## 12. Supabase — Get User

# Retrieve authenticated user (server-side)
const { data: { user } } = await supabase.auth.getUser();

---

## 13. Mental Shortcuts

git log  → timeline  
git show → inspect change  
git diff → compare changes  
timestamp → create event doc  

---

## Rule

Only add commands you actually reuse.

If it’s not used repeatedly, it does not belong here.

---

End of Document.