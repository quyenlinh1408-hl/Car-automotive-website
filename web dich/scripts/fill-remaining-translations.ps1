param(
  [string]$FilePath = "d:\CODE visual studio\Web VS code\web dich\asi-system-terms.json"
)

$ErrorActionPreference = "Stop"

function Get-MyMemory {
  param(
    [Parameter(Mandatory = $true)][string]$Text,
    [Parameter(Mandatory = $true)][string]$Target
  )

  $q = [uri]::EscapeDataString($Text)
  $u = "https://api.mymemory.translated.net/get?q=$q&langpair=en|$Target"
  $r = Invoke-RestMethod -Uri $u -Method Get -TimeoutSec 25
  $t = [string]$r.responseData.translatedText
  if ([string]::IsNullOrWhiteSpace($t)) {
    return $Text
  }

  return $t.Trim()
}

$d = Get-Content $FilePath -Raw | ConvertFrom-Json
$props = $d.terms.PSObject.Properties
$total = ($props | Measure-Object).Count

$groups = $props | Group-Object { [string]$_.Value.english }
$groupTotal = ($groups | Measure-Object).Count
$groupIndex = 0
$translatedTerms = 0
$failedTerms = 0

foreach ($g in $groups) {
  $groupIndex++
  $english = [string]$g.Name
  if ([string]::IsNullOrWhiteSpace($english)) {
    continue
  }

  $sample = $g.Group[0].Value
  $needVi = -not ($sample.vietnamese -and ($sample.vietnamese -ne $english))
  $needJa = -not ($sample.japanese -and $sample.japanese.kanji -and ($sample.japanese.kanji -ne $english))
  $needZh = -not ($sample.chinese_simplified -and ($sample.chinese_simplified -ne $english))

  if (-not ($needVi -or $needJa -or $needZh)) {
    continue
  }

  try {
    $vi = if ($needVi) { Get-MyMemory -Text $english -Target "vi" } else { $sample.vietnamese }
    $ja = if ($needJa) { Get-MyMemory -Text $english -Target "ja" } else { $sample.japanese.kanji }
    $zh = if ($needZh) { Get-MyMemory -Text $english -Target "zh-CN" } else { $sample.chinese_simplified }

    foreach ($entry in $g.Group) {
      $term = $entry.Value
      if ($needVi) { $term.vietnamese = $vi }
      if ($needJa) {
        $term.japanese.kanji = $ja
        $term.japanese.romaji = $ja
      }
      if ($needZh) { $term.chinese_simplified = $zh }
      $translatedTerms++
    }

    if (($translatedTerms % 60) -eq 0) {
      ($d | ConvertTo-Json -Depth 12) | Set-Content -Path $FilePath -Encoding UTF8
      Write-Host "Checkpoint translated=$translatedTerms failed=$failedTerms groups=$groupIndex/$groupTotal"
    }
  }
  catch {
    $failedTerms += $g.Count
  }
}

($d | ConvertTo-Json -Depth 12) | Set-Content -Path $FilePath -Encoding UTF8
Write-Host "Done total=$total translated=$translatedTerms failed=$failedTerms"
