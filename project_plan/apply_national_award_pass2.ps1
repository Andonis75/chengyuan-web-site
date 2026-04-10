$ErrorActionPreference = "Stop"

$projectPlanDir = "D:\Projects\chengyuan-web\project_plan"
$baseDoc = Get-ChildItem -LiteralPath $projectPlanDir | Where-Object { $_.Name -like '*v33.docm' } | Select-Object -First 1 -ExpandProperty FullName
$outDoc = Join-Path $projectPlanDir "chengyuan_v34_tmp.docm"
$configPath = Join-Path $projectPlanDir "national_award_pass2.json"

if (!(Test-Path -LiteralPath $baseDoc)) {
    throw "Base document not found."
}

if (!(Test-Path -LiteralPath $configPath)) {
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

$items = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$doc = $null
$replaced = 0

try {
    $doc = $word.Documents.Open($outDoc, $false, $false)

    foreach ($item in $items) {
        if ($item.type -eq 'paragraph_startswith') {
            foreach ($para in $doc.Paragraphs) {
                $text = Normalize-ParagraphText([string]$para.Range.Text)
                if ($text.StartsWith([string]$item.prefix)) {
                    $range = $para.Range.Duplicate
                    if ($range.End -gt $range.Start) {
                        $range.End = $range.End - 1
                    }
                    $range.Text = [string]$item.target
                    $replaced++
                    break
                }
            }
            continue
        }

        if ($item.type -eq 'replace_after_heading') {
            $foundHeading = $false
            foreach ($para in $doc.Paragraphs) {
                $text = Normalize-ParagraphText([string]$para.Range.Text)
                if (-not $foundHeading) {
                    if ($text -eq [string]$item.heading) {
                        $foundHeading = $true
                    }
                    continue
                }

                if (-not $text) {
                    continue
                }

                $range = $para.Range.Duplicate
                if ($range.End -gt $range.Start) {
                    $range.End = $range.End - 1
                }
                $range.Text = [string]$item.target
                $replaced++
                break
            }
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
Move-Item -LiteralPath $outDoc -Destination $finalDoc -Force
Write-Output ("REPLACED=" + $replaced)
