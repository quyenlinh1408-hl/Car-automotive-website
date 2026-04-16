param(
  [string]$FilePath = "d:\CODE visual studio\Web VS code\web dich\asi-system-terms.json",
  [int]$BatchSize = 35
)

$ErrorActionPreference = "Stop"

function Invoke-GoogleBatch {
  param(
    [string[]]$Texts,
    [string]$Target
  )

  $joined = ($Texts -join "`n")
  $q = [uri]::EscapeDataString($joined)
  $u = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=$Target&dt=t&q=$q"

  $r = Invoke-RestMethod -Uri $u -Method Get -TimeoutSec 35
  $segments = $r[0]
  $out = @()
  foreach ($seg in $segments) {
    if ($seg -and $seg.Count -gt 0) {
      $out += ([string]$seg[0]).Trim()
    }
  }

  if ($out.Count -ne $Texts.Count) {
    throw "Batch mismatch target=$Target expected=$($Texts.Count) actual=$($out.Count)"
  }

  return $out
}

function Invoke-MyMemorySingle {
  param(
    [string]$Text,
    [string]$Target
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
$pending = @()
foreach ($g in $groups) {
  $english = [string]$g.Name
  if ([string]::IsNullOrWhiteSpace($english)) { continue }

  $sample = $g.Group[0].Value
  $needVi = -not ($sample.vietnamese -and ($sample.vietnamese -ne $english))
  $needJa = -not ($sample.japanese -and $sample.japanese.kanji -and ($sample.japanese.kanji -ne $english))
  $needZh = -not ($sample.chinese_simplified -and ($sample.chinese_simplified -ne $english))

  if ($needVi -or $needJa -or $needZh) {
    $pending += [pscustomobject]@{
      english = $english
      entries = $g.Group
      needVi = $needVi
      needJa = $needJa
      needZh = $needZh
    }
  }
}

Write-Host "Total terms=$total; pending groups=$($pending.Count); batchSize=$BatchSize"

$translatedTerms = 0
$failedTerms = 0
$batchIndex = 0

for ($i = 0; $i -lt $pending.Count; $i += $BatchSize) {
  $batchIndex++
  $batch = $pending[$i..([Math]::Min($i + $BatchSize - 1, $pending.Count - 1))]
  $englishList = $batch | ForEach-Object { $_.english }

  try {
    $viList = Invoke-GoogleBatch -Texts $englishList -Target "vi"
  } catch {
    $viList = @()
    foreach ($t in $englishList) { $viList += (Invoke-MyMemorySingle -Text $t -Target "vi") }
  }

  try {
    $jaList = Invoke-GoogleBatch -Texts $englishList -Target "ja"
  } catch {
    $jaList = @()
    foreach ($t in $englishList) { $jaList += (Invoke-MyMemorySingle -Text $t -Target "ja") }
  }

  try {
    $zhList = Invoke-GoogleBatch -Texts $englishList -Target "zh-CN"
  } catch {
    $zhList = @()
    foreach ($t in $englishList) { $zhList += (Invoke-MyMemorySingle -Text $t -Target "zh-CN") }
  }

  for ($j = 0; $j -lt $batch.Count; $j++) {
    $g = $batch[$j]
    $vi = $viList[$j]
    $ja = $jaList[$j]
    $zh = $zhList[$j]

    foreach ($entry in $g.entries) {
      $term = $entry.Value
      if ($g.needVi) { $term.vietnamese = $vi }
      if ($g.needJa) {
        $term.japanese.kanji = $ja
        $term.japanese.romaji = $ja
      }
      if ($g.needZh) { $term.chinese_simplified = $zh }
      $translatedTerms++
    }
  }

  if (($batchIndex % 3) -eq 0) {
    ($d | ConvertTo-Json -Depth 12) | Set-Content -Path $FilePath -Encoding UTF8
    Write-Host "Checkpoint batch=$batchIndex translatedTerms=$translatedTerms failedTerms=$failedTerms"
  }
}

($d | ConvertTo-Json -Depth 12) | Set-Content -Path $FilePath -Encoding UTF8
Write-Host "Done translatedTerms=$translatedTerms failedTerms=$failedTerms"
