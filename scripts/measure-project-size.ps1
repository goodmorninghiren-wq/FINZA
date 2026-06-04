# Reports largest folders under the project root (excludes nothing by default).
$root = Split-Path -Parent $PSScriptRoot
Write-Host "Project size audit: $root`n"

$top = Get-ChildItem $root -Directory -Force | ForEach-Object {
    $bytes = (Get-ChildItem $_.FullName -Recurse -File -Force -ErrorAction SilentlyContinue |
        Measure-Object -Property Length -Sum).Sum
    [PSCustomObject]@{ Name = $_.Name; SizeMB = [math]::Round($bytes / 1MB, 2) }
} | Sort-Object SizeMB -Descending

$top | Format-Table -AutoSize

$total = (Get-ChildItem $root -Recurse -File -Force -ErrorAction SilentlyContinue |
    Measure-Object -Property Length -Sum).Sum
Write-Host ("Total on disk: {0:N2} MB" -f ($total / 1MB))

Write-Host "`nLargest files (>5 MB):"
Get-ChildItem $root -Recurse -File -Force -ErrorAction SilentlyContinue |
    Where-Object { $_.Length -gt 5MB } |
    Sort-Object Length -Descending |
    Select-Object -First 15 @{N='SizeMB';E={[math]::Round($_.Length/1MB,2)}}, FullName |
    Format-Table -AutoSize
