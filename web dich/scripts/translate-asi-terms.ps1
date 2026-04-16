param(
  [string]$InputFile = "d:\CODE visual studio\Web VS code\web dich\asi-system-terms.json",
  [string]$OutputFile = "d:\CODE visual studio\Web VS code\web dich\asi-system-terms.json",
  [switch]$Resume
)

$ErrorActionPreference = "Stop"

function Get-GtxPayload {
  param(
    [Parameter(Mandatory = $true)][string]$Text,
    [Parameter(Mandatory = $true)][string]$Target,
    [switch]$NeedRomaji
  )

  $escaped = [uri]::EscapeDataString($Text)
  $url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=$Target&dt=t&q=$escaped"
  if ($NeedRomaji) {
    $url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=$Target&dt=t&dt=rm&q=$escaped"
  }

  $attempt = 0
  while ($attempt -lt 4) {
    try {
      $result = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 30
      return $result
    }
    catch {
      $attempt++
      if ($attempt -ge 4) {
        throw
      }
    }
  }
}

function Get-MyMemoryTranslatedText {
  param(
    [Parameter(Mandatory = $true)][string]$Text,
    [Parameter(Mandatory = $true)][string]$Target
  )

  $escaped = [uri]::EscapeDataString($Text)
  $pair = "en|$Target"
  $url = "https://api.mymemory.translated.net/get?q=$escaped&langpair=$pair"
  $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 30
  $translated = [string]$response.responseData.translatedText

  if ([string]::IsNullOrWhiteSpace($translated)) {
    return $Text
  }

  return $translated.Trim()
}

function Get-TranslatedText {
  param(
    [Parameter(Mandatory = $true)][string]$Text,
    [Parameter(Mandatory = $true)][string]$Target
  )

  try {
    $payload = Get-GtxPayload -Text $Text -Target $Target
    $translated = $null

    if ($payload -and $payload.Count -gt 0 -and $payload[0] -and $payload[0].Count -gt 0) {
      $translated = [string]$payload[0][0][0]
    }

    if (-not [string]::IsNullOrWhiteSpace($translated)) {
      return $translated.Trim()
    }
  }
  catch {
  }

  return Get-MyMemoryTranslatedText -Text $Text -Target $Target
}

function Get-JapaneseTextAndRomaji {
  param([Parameter(Mandatory = $true)][string]$Text)

  $kanji = $Text
  $romaji = $Text

  try {
    $payload = Get-GtxPayload -Text $Text -Target "ja" -NeedRomaji

    if ($payload -and $payload.Count -gt 0 -and $payload[0] -and $payload[0].Count -gt 0) {
      if ($payload[0][0] -and $payload[0][0].Count -gt 0 -and $payload[0][0][0]) {
        $kanji = [string]$payload[0][0][0]
      }

      if ($payload[0].Count -gt 1 -and $payload[0][1] -and $payload[0][1].Count -gt 2 -and $payload[0][1][2]) {
        $romaji = [string]$payload[0][1][2]
      }
      else {
        $romaji = $kanji
      }
    }
  }
  catch {
    $kanji = Get-MyMemoryTranslatedText -Text $Text -Target "ja"
    $romaji = $kanji
  }

  return @{
    kanji = $kanji.Trim()
    romaji = $romaji.Trim()
  }
}

if (-not (Test-Path $InputFile)) {
  throw "Input file not found: $InputFile"
}

Write-Host "Loading ASI term file: $InputFile"
$data = Get-Content $InputFile -Raw | ConvertFrom-Json
$termProps = $data.terms.PSObject.Properties
$total = ($termProps | Measure-Object).Count
Write-Host "Total terms: $total"

$translatedCount = 0
$skippedCount = 0
$failedCount = 0
$checkpointEvery = 50

$groups = $termProps | Group-Object { [string]$_.Value.english }
$groupTotal = ($groups | Measure-Object).Count
$groupIndex = 0

$translationCache = @{}

foreach ($group in $groups) {
  $groupIndex++
  $english = [string]$group.Name

  if ([string]::IsNullOrWhiteSpace($english)) {
    $skippedCount += $group.Count
    continue
  }

  $sampleTerm = $group.Group[0].Value
  if ($Resume) {
    $hasVi = $sampleTerm.vietnamese -and ($sampleTerm.vietnamese -ne $english)
    $hasZh = $sampleTerm.chinese_simplified -and ($sampleTerm.chinese_simplified -ne $english)
    $hasJa = $sampleTerm.japanese -and $sampleTerm.japanese.kanji -and ($sampleTerm.japanese.kanji -ne $english)
    if ($hasVi -and $hasZh -and $hasJa) {
      $skippedCount += $group.Count
      continue
    }
  }

  try {
    if (-not $translationCache.ContainsKey($english)) {
      $vi = Get-TranslatedText -Text $english -Target "vi"
      $zh = Get-TranslatedText -Text $english -Target "zh-CN"
      $jaObj = Get-JapaneseTextAndRomaji -Text $english
      $translationCache[$english] = @{
        vi = $vi
        zh = $zh
        jaKanji = $jaObj.kanji
        jaRomaji = $jaObj.romaji
      }
    }

    $mapped = $translationCache[$english]
    foreach ($entry in $group.Group) {
      $term = $entry.Value
      $term.vietnamese = $mapped.vi
      $term.chinese_simplified = $mapped.zh
      $term.japanese.kanji = $mapped.jaKanji
      $term.japanese.romaji = $mapped.jaRomaji
      $translatedCount++
    }

    if (($translatedCount % $checkpointEvery) -eq 0) {
      $json = $data | ConvertTo-Json -Depth 12
      Set-Content -Path $OutputFile -Value $json -Encoding UTF8
      Write-Host "Checkpoint: terms-translated=$translatedCount skipped=$skippedCount failed=$failedCount groups=$groupIndex/$groupTotal"
    }
  }
  catch {
    $failedCount += $group.Count
    Write-Warning "Failed translating [group=$english] count=$($group.Count) - $($_.Exception.Message)"
  }
}

$json = $data | ConvertTo-Json -Depth 12
Set-Content -Path $OutputFile -Value $json -Encoding UTF8

Write-Host "Done. translated=$translatedCount skipped=$skippedCount failed=$failedCount total=$total"
