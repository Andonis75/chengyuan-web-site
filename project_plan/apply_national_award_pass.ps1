$ErrorActionPreference = "Stop"

$projectPlanDir = "D:\Projects\chengyuan-web\project_plan"
$baseDoc = Get-ChildItem -LiteralPath $projectPlanDir | Where-Object { $_.Name -like '*v32.docm' } | Select-Object -First 1 -ExpandProperty FullName
$outDoc = Join-Path $projectPlanDir "chengyuan_v33_tmp.docm"
$rewritePath = Join-Path $projectPlanDir "national_award_rewrites.json"

if (!(Test-Path -LiteralPath $baseDoc)) {
    throw "Base document not found."
}

if (!(Test-Path -LiteralPath $rewritePath)) {
    throw "Rewrite map not found."
}

Copy-Item -LiteralPath $baseDoc -Destination $outDoc -Force
attrib -R $outDoc

function Normalize-ParagraphText([string]$text) {
    if ($null -eq $text) {
        return ""
    }

    $normalized = $text.Replace("`r", "").Replace([string][char]7, "")
    $normalized = $normalized.Replace([string][char]11, "").Replace([string][char]12, "")
    $normalized = $normalized.Replace([string][char]160, " ").Replace([string][char]8203, "")
    $normalized = $normalized.Replace([string][char]65279, "")
    $normalized = $normalized.Replace([string][char]0x201C, [string][char]34)
    $normalized = $normalized.Replace([string][char]0x201D, [string][char]34)
    $normalized = $normalized.Replace([string][char]0x2018, [string][char]39)
    $normalized = $normalized.Replace([string][char]0x2019, [string][char]39)
    $normalized = [regex]::Replace($normalized, "\s+", " ").Trim()
    return $normalized
}

$rewriteItems = Get-Content -LiteralPath $rewritePath -Raw -Encoding UTF8 | ConvertFrom-Json
$rewriteMap = @{}
foreach ($item in $rewriteItems) {
    $key = Normalize-ParagraphText([string]$item.source)
    if ($rewriteMap.ContainsKey($key)) {
        throw "Duplicate rewrite key detected."
    }
    $rewriteMap[$key] = [string]$item.target
}

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$doc = $null
$replaced = 0

try {
    $doc = $word.Documents.Open($outDoc, $false, $false)
    foreach ($para in $doc.Paragraphs) {
        $text = Normalize-ParagraphText([string]$para.Range.Text)
        if (-not $text) {
            continue
        }

        if ($rewriteMap.ContainsKey($text)) {
            $range = $para.Range.Duplicate
            if ($range.End -gt $range.Start) {
                $range.End = $range.End - 1
            }
            $range.Text = $rewriteMap[$text]
            $replaced++
        }
    }

    if ($doc.TablesOfContents.Count -gt 0) {
        foreach ($toc in $doc.TablesOfContents) {
            $toc.Update()
        }
    }

    $doc.Fields.Update() | Out-Null
    $doc.Repaginate()
    $doc.Save()
}
finally {
    if ($doc -ne $null) {
        $doc.Close()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($doc) | Out-Null
    }
    if ($word -ne $null) {
        $word.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    }
    [gc]::Collect()
    [gc]::WaitForPendingFinalizers()
}

$finalDoc = Join-Path $projectPlanDir ((Split-Path -Leaf $baseDoc) -replace 'v32\.docm$', 'v33.docm')
Move-Item -LiteralPath $outDoc -Destination $finalDoc -Force
Write-Output ("REPLACED=" + $replaced)
