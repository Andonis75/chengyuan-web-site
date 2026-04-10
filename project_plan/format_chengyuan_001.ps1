$ErrorActionPreference = "Stop"

$projectPlanDir = "D:\Projects\chengyuan-web\project_plan"
$tocTitle = [string]::Concat([char]30446, [char]24405)
$appendixTitle = [string]::Concat([char]38468, [char]24405)
$chapterChar = [string][char]31456
$fullWidthColon = [string][char]65306
$fullWidthLeftParen = [string][char]65288

$sourceItem = Get-ChildItem -LiteralPath $projectPlanDir -File |
    Where-Object {
        $_.Extension -eq ".docx" -and
        $_.Name -like "*001*" -and
        $_.Name -notlike "*backup*" -and
        $_.Name -notlike "*reformatted*"
    } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if ($null -eq $sourceItem) {
    throw "Unable to locate the source 001 document in $projectPlanDir"
}

$sourcePath = $sourceItem.FullName
$outputPath = $sourcePath
$fallbackOutputPath = Join-Path $projectPlanDir ($sourceItem.BaseName + "_reformatted" + $sourceItem.Extension)
$backupPath = Join-Path $projectPlanDir ($sourceItem.BaseName + "_backup_" + (Get-Date -Format "yyyyMMdd_HHmmss") + $sourceItem.Extension)

function Normalize-Text {
    param([string]$Text)

    if ($null -eq $Text) {
        return ""
    }

    $value = $Text.Replace("`r", "")
    $value = $value.Replace([string][char]7, "")
    $value = $value.Replace([string][char]11, "")
    $value = $value.Replace([string][char]12, "")
    $value = $value.Replace([string][char]160, " ")
    $value = $value.Replace([string][char]8203, "")
    $value = $value.Replace([string][char]65279, "")
    $value = [regex]::Replace($value, "\s+", " ")
    return $value.Trim()
}

function Set-Font {
    param(
        $Range,
        [string]$Name,
        [double]$Size,
        [int]$Bold
    )

    $Range.Font.Name = $Name
    $Range.Font.NameFarEast = $Name
    $Range.Font.Size = $Size
    $Range.Font.Bold = $Bold
    $Range.Font.Italic = 0
}

function Set-ParagraphFormat {
    param(
        $Range,
        [int]$Alignment,
        [double]$FirstLineIndent,
        [double]$LeftIndent,
        [double]$SpaceBefore,
        [double]$SpaceAfter,
        [double]$LineSpacing
    )

    $pf = $Range.ParagraphFormat
    $pf.Alignment = $Alignment
    $pf.FirstLineIndent = $FirstLineIndent
    $pf.LeftIndent = $LeftIndent
    $pf.RightIndent = 0
    $pf.SpaceBefore = $SpaceBefore
    $pf.SpaceAfter = $SpaceAfter
    $pf.LineSpacingRule = 5
    $pf.LineSpacing = $LineSpacing
}

function Apply-TitleStyle {
    param($Range)
    Set-Font -Range $Range -Name "SimHei" -Size 18 -Bold 1
    Set-ParagraphFormat -Range $Range -Alignment 1 -FirstLineIndent 0 -LeftIndent 0 -SpaceBefore 0 -SpaceAfter 18 -LineSpacing 24
}

function Apply-TocTitleStyle {
    param($Range)
    Set-Font -Range $Range -Name "SimHei" -Size 16 -Bold 1
    Set-ParagraphFormat -Range $Range -Alignment 1 -FirstLineIndent 0 -LeftIndent 0 -SpaceBefore 12 -SpaceAfter 12 -LineSpacing 20
}

function Apply-TocEntryStyle {
    param(
        $Range,
        [double]$LeftIndent
    )

    Set-Font -Range $Range -Name "SimSun" -Size 12 -Bold 0
    Set-ParagraphFormat -Range $Range -Alignment 0 -FirstLineIndent 0 -LeftIndent $LeftIndent -SpaceBefore 0 -SpaceAfter 3 -LineSpacing 18
}

function Apply-ChapterStyle {
    param($Range)
    Set-Font -Range $Range -Name "SimHei" -Size 16 -Bold 1
    Set-ParagraphFormat -Range $Range -Alignment 0 -FirstLineIndent 0 -LeftIndent 0 -SpaceBefore 12 -SpaceAfter 8 -LineSpacing 20
}

function Apply-SectionStyle {
    param($Range)
    Set-Font -Range $Range -Name "SimHei" -Size 15 -Bold 1
    Set-ParagraphFormat -Range $Range -Alignment 0 -FirstLineIndent 0 -LeftIndent 0 -SpaceBefore 8 -SpaceAfter 6 -LineSpacing 18
}

function Apply-SubsectionStyle {
    param($Range)
    Set-Font -Range $Range -Name "SimHei" -Size 14 -Bold 1
    Set-ParagraphFormat -Range $Range -Alignment 0 -FirstLineIndent 0 -LeftIndent 0 -SpaceBefore 6 -SpaceAfter 4 -LineSpacing 18
}

function Apply-BodyStyle {
    param($Range)
    Set-Font -Range $Range -Name "SimSun" -Size 12 -Bold 0
    Set-ParagraphFormat -Range $Range -Alignment 3 -FirstLineIndent 24 -LeftIndent 0 -SpaceBefore 0 -SpaceAfter 3 -LineSpacing 20
}

function Apply-ListStyle {
    param($Range)
    Set-Font -Range $Range -Name "SimSun" -Size 12 -Bold 0
    Set-ParagraphFormat -Range $Range -Alignment 3 -FirstLineIndent 0 -LeftIndent 0 -SpaceBefore 0 -SpaceAfter 3 -LineSpacing 20
}

function Apply-ImageParagraphStyle {
    param($Range)
    Set-ParagraphFormat -Range $Range -Alignment 1 -FirstLineIndent 0 -LeftIndent 0 -SpaceBefore 6 -SpaceAfter 6 -LineSpacing 18
}

function Format-Tables {
    param($Document)

    foreach ($table in $Document.Tables) {
        $table.Range.Font.Name = "SimSun"
        $table.Range.Font.NameFarEast = "SimSun"
        $table.Range.Font.Size = 10.5
        $table.Range.ParagraphFormat.FirstLineIndent = 0
        $table.Range.ParagraphFormat.LeftIndent = 0
        $table.Range.ParagraphFormat.SpaceBefore = 0
        $table.Range.ParagraphFormat.SpaceAfter = 0
        $table.Range.ParagraphFormat.LineSpacingRule = 0
        $table.Rows.Alignment = 1
        $table.Rows.AllowBreakAcrossPages = 0
    }
}

function Test-IsChapterHeading {
    param([string]$Text)

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return $false
    }

    return (
        -not ($Text -match "^\d") -and
        $Text.Contains($chapterChar) -and
        ($Text.Contains(":") -or $Text.Contains($fullWidthColon))
    )
}

function Find-ChapterMarkers {
    param($Document)

    $firstIndex = -1
    $secondIndex = -1
    $firstHeadingText = ""

    for ($i = 1; $i -le $Document.Paragraphs.Count; $i++) {
        $text = Normalize-Text $Document.Paragraphs.Item($i).Range.Text
        if (-not (Test-IsChapterHeading -Text $text)) {
            continue
        }

        if ($firstIndex -lt 0) {
            $firstIndex = $i
            $firstHeadingText = $text
            continue
        }

        if ($text -eq $firstHeadingText) {
            $secondIndex = $i
            break
        }
    }

    return @{
        First = $firstIndex
        Second = $secondIndex
    }
}

Copy-Item -LiteralPath $sourcePath -Destination $backupPath -Force
attrib -R $outputPath

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$document = $null

try {
    $resolvedOutput = (Get-Item -LiteralPath $outputPath).FullName

    try {
        $document = $word.Documents.Open($resolvedOutput, $false, $false)
    }
    catch {
        Copy-Item -LiteralPath $sourcePath -Destination $fallbackOutputPath -Force
        attrib -R $fallbackOutputPath
        $resolvedOutput = (Get-Item -LiteralPath $fallbackOutputPath).FullName
        $outputPath = $resolvedOutput
        $document = $word.Documents.Open($resolvedOutput, $false, $false)
    }

    $document.PageSetup.PaperSize = 7
    $document.PageSetup.Orientation = 0
    $document.PageSetup.TopMargin = $word.CentimetersToPoints(2.54)
    $document.PageSetup.BottomMargin = $word.CentimetersToPoints(2.54)
    $document.PageSetup.LeftMargin = $word.CentimetersToPoints(3.17)
    $document.PageSetup.RightMargin = $word.CentimetersToPoints(3.17)
    $document.ReadOnlyRecommended = $false

    for ($i = $document.Paragraphs.Count; $i -ge 1; $i--) {
        $paragraph = $document.Paragraphs.Item($i)
        $rawText = [string]$paragraph.Range.Text
        $normalized = Normalize-Text $rawText
        if ($rawText -eq [string][char]1 -or $normalized -eq [string][char]1) {
            $paragraph.Range.Text = ""
        }
    }

    $markers = Find-ChapterMarkers -Document $document
    if ($markers.First -lt 0 -or $markers.Second -lt 0) {
        throw "Unable to locate both TOC and main body chapter markers."
    }

    $tocExists = $false
    for ($i = 1; $i -lt $markers.First; $i++) {
        $text = Normalize-Text $document.Paragraphs.Item($i).Range.Text
        if ($text -eq $tocTitle) {
            $tocExists = $true
            break
        }
    }

    if (-not $tocExists) {
        $document.Paragraphs.Item($markers.First).Range.InsertBefore($tocTitle + "`r")
    }

    $markers = Find-ChapterMarkers -Document $document
    $titleApplied = $false
    $inBody = $false

    for ($i = 1; $i -le $document.Paragraphs.Count; $i++) {
        $paragraph = $document.Paragraphs.Item($i)
        $text = Normalize-Text $paragraph.Range.Text

        if ($text.Length -eq 0) {
            continue
        }

        if ($paragraph.Range.InlineShapes.Count -gt 0) {
            Apply-ImageParagraphStyle -Range $paragraph.Range
            continue
        }

        if (-not $titleApplied) {
            Apply-TitleStyle -Range $paragraph.Range
            $titleApplied = $true
            continue
        }

        if ($i -ge $markers.Second) {
            $inBody = $true
        }

        if (-not $inBody) {
            if ($text -eq $tocTitle) {
                Apply-TocTitleStyle -Range $paragraph.Range
                continue
            }

            if (Test-IsChapterHeading -Text $text) {
                Apply-TocEntryStyle -Range $paragraph.Range -LeftIndent 0
                continue
            }

            if ($text -match "^\d+\.\d+\.\d+") {
                Apply-TocEntryStyle -Range $paragraph.Range -LeftIndent 48
                continue
            }

            if ($text -match "^\d+\.\d+") {
                Apply-TocEntryStyle -Range $paragraph.Range -LeftIndent 24
                continue
            }

            Apply-TocEntryStyle -Range $paragraph.Range -LeftIndent 0
            continue
        }

        if (Test-IsChapterHeading -Text $text) {
            Apply-ChapterStyle -Range $paragraph.Range
            continue
        }

        if ($text -eq $appendixTitle) {
            Apply-ChapterStyle -Range $paragraph.Range
            continue
        }

        if ($text.StartsWith($appendixTitle) -and $text.Length -gt $appendixTitle.Length) {
            Apply-SectionStyle -Range $paragraph.Range
            continue
        }

        if ($text -match "^\d+\.\d+\.\d+\s*") {
            Apply-SubsectionStyle -Range $paragraph.Range
            continue
        }

        if ($text -match "^\d+\.\d+\s*") {
            Apply-SectionStyle -Range $paragraph.Range
            continue
        }

        if ($text.StartsWith("(") -or
            $text.StartsWith($fullWidthLeftParen) -or
            $text -match "^[0-9]+[.)]") {
            Apply-ListStyle -Range $paragraph.Range
            continue
        }

        Apply-BodyStyle -Range $paragraph.Range
    }

    Format-Tables -Document $document
    $document.Repaginate()
    $document.Save()
    attrib -R $outputPath
    Write-Output ("FormattedOutput=" + $outputPath)
    Write-Output ("BackupCreated=" + $backupPath)
}
finally {
    if ($null -ne $document) {
        try { $document.Close() } catch {}
        try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($document) } catch {}
    }

    if ($null -ne $word) {
        try { $word.Quit() } catch {}
        try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) } catch {}
    }

    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
