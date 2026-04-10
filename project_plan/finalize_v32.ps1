$ErrorActionPreference = "Stop"

$projectPlanDir = "D:\Projects\chengyuan-web\project_plan"
$baseDoc = (Get-ChildItem -LiteralPath $projectPlanDir | Where-Object { $_.Name -like '*v31.docm' } | Select-Object -First 1 -ExpandProperty FullName)
$outDoc = Join-Path $projectPlanDir "chengyuan_v32_tmp.docm"

if (!(Test-Path -LiteralPath $baseDoc)) {
    throw "Base document not found: $baseDoc"
}

Copy-Item -LiteralPath $baseDoc -Destination $outDoc -Force
attrib -R $outDoc

function U([int[]]$codes) {
    return -join ($codes | ForEach-Object { [char]$_ })
}

function Get-CleanText($text) {
    if ($null -eq $text) {
        return ""
    }
    return ($text -replace "[`r`a]", "").Trim()
}

function Set-Style($paragraph, [int]$styleId) {
    try {
        $paragraph.Range.ListFormat.RemoveNumbers()
    }
    catch {
    }
    $paragraph.Range.Style = $styleId
}

$chapter8Title = U @(31532, 20843, 31456, 65306, 22242, 38431, 20171, 32461)
$chapter8Short = U @(65306, 22242, 38431, 20171, 32461)
$chapter9Title = U @(31532, 20061, 31456, 65306, 36130, 21153, 39044, 27979)
$figurePrefix = (U @(22270)) + "8-"
$leftParen = [char]65288

$wdStyleNormal = -1
$wdStyleHeading1 = -2
$wdStyleHeading2 = -3
$wdStyleHeading3 = -4
$wdAlignParagraphCenter = 1

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$doc = $null

try {
    $doc = $word.Documents.Open($outDoc, $false, $false)

    $inChapter8 = $false
    foreach ($para in $doc.Paragraphs) {
        $text = Get-CleanText $para.Range.Text
        if (-not $text) {
            continue
        }

        if ($text -eq $chapter8Title -or $text -eq $chapter8Short) {
            $inChapter8 = $true
            $range = $para.Range.Duplicate
            if ($range.End -gt $range.Start) {
                $range.End = $range.End - 1
            }
            $range.Text = $chapter8Title
            Set-Style $para $wdStyleHeading1
            continue
        }

        if ($text -eq $chapter9Title) {
            $inChapter8 = $false
            Set-Style $para $wdStyleHeading1
            continue
        }

        if (-not $inChapter8) {
            continue
        }

        if ($text -match '^8\.\d+\.\d+\s') {
            Set-Style $para $wdStyleHeading3
            continue
        }

        if ($text -match '^8\.\d+\s') {
            Set-Style $para $wdStyleHeading2
            continue
        }

        if ($text.StartsWith([string]$leftParen)) {
            Set-Style $para $wdStyleNormal
            continue
        }

        if ($text.StartsWith($figurePrefix)) {
            Set-Style $para $wdStyleNormal
            $para.Range.ParagraphFormat.Alignment = $wdAlignParagraphCenter
            $para.Range.ParagraphFormat.FirstLineIndent = 0
            continue
        }

        if ($text -ne "/") {
            Set-Style $para $wdStyleNormal
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

$finalDoc = Join-Path $projectPlanDir ((Split-Path -Leaf $baseDoc) -replace 'v31\.docm$', 'v32.docm')
Move-Item -LiteralPath $outDoc -Destination $finalDoc -Force
