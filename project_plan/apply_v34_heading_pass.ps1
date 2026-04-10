$ErrorActionPreference = "Stop"

$projectPlanDir = "D:\Projects\chengyuan-web\project_plan"
$baseDoc = Get-ChildItem -LiteralPath $projectPlanDir | Where-Object { $_.Name -like '*v33.docm' } | Select-Object -First 1 -ExpandProperty FullName
$outDoc = Join-Path $projectPlanDir ("chengyuan_v34_tmp_" + [Guid]::NewGuid().ToString("N") + ".docm")
$rewritePath = Join-Path $projectPlanDir "v34_heading_rewrites.json"

if (!(Test-Path -LiteralPath $baseDoc)) {
    throw "Base document not found."
}
if (!(Test-Path -LiteralPath $rewritePath)) {
    throw "Rewrite config not found."
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

function Is-HeadingStyle($styleName) {
    return $styleName -in @("标题 1", "标题 2", "标题 3")
}

$rewriteJson = Get-Content -LiteralPath $rewritePath -Raw -Encoding UTF8 | ConvertFrom-Json
$rewriteMap = @{}
foreach ($prop in $rewriteJson.PSObject.Properties) {
    $rewriteMap[[string]$prop.Name] = [string]$prop.Value
}
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$doc = $null
$replaced = 0

try {
    $doc = $word.Documents.Open($outDoc, $false, $false)
    $paras = $doc.Paragraphs

    for ($i = 1; $i -le $paras.Count; $i++) {
        $para = $paras.Item($i)
        $text = Normalize-ParagraphText([string]$para.Range.Text)
        if (-not $text) {
            continue
        }

        if ($rewriteMap.ContainsKey("__ABSTRACT__") -and $text.StartsWith("摘要 ")) {
            $range = $para.Range.Duplicate
            if ($range.End -gt $range.Start) {
                $range.End = $range.End - 1
            }
            $range.Text = [string]$rewriteMap["__ABSTRACT__"]
            $replaced++
            continue
        }

        if (-not $rewriteMap.ContainsKey($text)) {
            continue
        }

        for ($j = $i + 1; $j -le $paras.Count; $j++) {
            $nextPara = $paras.Item($j)
            $nextText = Normalize-ParagraphText([string]$nextPara.Range.Text)
            if (-not $nextText) {
                continue
            }

            $nextStyle = ""
            try {
                $nextStyle = $nextPara.Range.Style.NameLocal
            }
            catch {
            }

            if (Is-HeadingStyle $nextStyle) {
                break
            }

            $range = $nextPara.Range.Duplicate
            if ($range.End -gt $range.Start) {
                $range.End = $range.End - 1
            }
            $range.Text = [string]$rewriteMap[$text]
            $replaced++
            break
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

$finalDoc = Join-Path $projectPlanDir ((Split-Path -Leaf $baseDoc) -replace 'v33\.docm$', 'v34.docm')
if (Test-Path -LiteralPath $finalDoc) {
    Remove-Item -LiteralPath $finalDoc -Force
}
Move-Item -LiteralPath $outDoc -Destination $finalDoc -Force
Write-Output ("REPLACED=" + $replaced)
