param(
    [Parameter(Mandatory = $true)]
    [string]$SourceDocx,
    [switch]$RunImport,
    [string]$ApiBaseUrl = "http://localhost:8080",
    [string]$Username = "admin1",
    [string]$Password = "Admin@123"
)

$ErrorActionPreference = "Stop"

function Get-NodeText {
    param(
        [Parameter(Mandatory = $true)]$Node,
        [Parameter(Mandatory = $true)]$NsManager
    )
    $texts = $Node.SelectNodes(".//w:t", $NsManager)
    if (-not $texts) { return "" }
    return (($texts | ForEach-Object { $_.'#text' }) -join "").Trim()
}

function Normalize-AliasKey {
    param([string]$Value)
    if ($null -eq $Value) { return "" }
    return ($Value -replace "[^a-zA-Z0-9]", "").ToLower()
}

function Get-CanonicalBranch {
    param([string]$Value)
    $aliases = @{
        "computerscienceandengineering" = "Computer Science and Engineering"
        "computerscienceengineering" = "Computer Science and Engineering"
        "computerscience" = "Computer Science and Engineering"
        "cse" = "Computer Science and Engineering"
        "informationtechnology" = "Information Technology"
        "it" = "Information Technology"
        "electronicsandcommunicationengineering" = "Electronics and Communication Engineering"
        "electronicscommunicationengineering" = "Electronics and Communication Engineering"
        "electronicsandcommunication" = "Electronics and Communication Engineering"
        "ece" = "Electronics and Communication Engineering"
        "ec" = "Electronics and Communication Engineering"
        "civilengineering" = "Civil Engineering"
        "civil" = "Civil Engineering"
        "ce" = "Civil Engineering"
        "mechanicalengineering" = "Mechanical Engineering"
        "mechanical" = "Mechanical Engineering"
        "me" = "Mechanical Engineering"
        "mech" = "Mechanical Engineering"
    }

    $key = Normalize-AliasKey $Value
    if ($aliases.ContainsKey($key)) {
        return $aliases[$key]
    }
    return $null
}

function Get-CanonicalSemester {
    param([string]$Value)
    $aliases = @{
        "1" = "1"; "1st" = "1"; "sem1" = "1"; "semester1" = "1"; "s1" = "1"; "i" = "1"; "first" = "1"
        "2" = "2"; "2nd" = "2"; "sem2" = "2"; "semester2" = "2"; "s2" = "2"; "ii" = "2"; "second" = "2"
        "3" = "3"; "3rd" = "3"; "sem3" = "3"; "semester3" = "3"; "s3" = "3"; "iii" = "3"; "third" = "3"
        "4" = "4"; "4th" = "4"; "sem4" = "4"; "semester4" = "4"; "s4" = "4"; "iv" = "4"; "fourth" = "4"
        "5" = "5"; "5th" = "5"; "sem5" = "5"; "semester5" = "5"; "s5" = "5"; "v" = "5"; "fifth" = "5"
        "6" = "6"; "6th" = "6"; "sem6" = "6"; "semester6" = "6"; "s6" = "6"; "vi" = "6"; "sixth" = "6"
        "7" = "7"; "7th" = "7"; "sem7" = "7"; "semester7" = "7"; "s7" = "7"; "vii" = "7"; "seventh" = "7"
        "8" = "8"; "8th" = "8"; "sem8" = "8"; "semester8" = "8"; "s8" = "8"; "viii" = "8"; "eighth" = "8"
    }

    $key = Normalize-AliasKey $Value
    if ($aliases.ContainsKey($key)) {
        return $aliases[$key]
    }
    return $null
}

function Normalize-SubjectCode {
    param([string]$Code)
    if ([string]::IsNullOrWhiteSpace($Code)) { return "" }
    $normalized = $Code.Trim().ToUpper()
    $normalized = [regex]::Replace($normalized, "\s*[-]\s*", "-")
    $normalized = [regex]::Replace($normalized, "\s*\(\s*", "(")
    $normalized = [regex]::Replace($normalized, "\s*\)\s*", ")")
    $normalized = [regex]::Replace($normalized, "([A-Z]{2,4})\s+(\d{3}(?:\([A-Z]\))?)", '$1-$2')
    $normalized = [regex]::Replace($normalized, "\s+", " ")
    return $normalized.Trim()
}

function Is-ValidSubjectCode {
    param([string]$Code)
    if ([string]::IsNullOrWhiteSpace($Code)) { return $false }
    return $Code -match "^[A-Z]{2,4}-\d{3}(\([A-Z]\))?$"
}

function Parse-SubjectsFromLine {
    param([string]$Line)
    $results = @()
    if ([string]::IsNullOrWhiteSpace($Line)) { return $results }

    $text = [regex]::Replace($Line, "\s+", " ").Trim()
    if ([string]::IsNullOrWhiteSpace($text)) { return $results }

    $lower = $text.ToLower()
    if ($lower -match "^subjects?\s*[-:]?$" -or $lower -match "^year\b") {
        return $results
    }

    $matches = [regex]::Matches($text, "(?i)([A-Z]{2,4}\s*-?\s*\d{3}(?:\s*\([A-Z]\))?)")
    if ($matches.Count -eq 0) { return $results }

    for ($i = 0; $i -lt $matches.Count; $i++) {
        $m = $matches[$i]
        $code = Normalize-SubjectCode $m.Groups[1].Value
        $start = $m.Index + $m.Length
        $end = if ($i -lt $matches.Count - 1) { $matches[$i + 1].Index } else { $text.Length }
        $name = $text.Substring($start, $end - $start).Trim(" ", "|", ",", ";", "-", ":")
        if ([string]::IsNullOrWhiteSpace($name)) { continue }
        if ($name.ToLower() -match "^subject\s*name$") { continue }

        $results += [pscustomobject]@{
            subjectCode = $code
            name = $name
        }
    }

    return $results
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$databaseDir = Join-Path $repoRoot "database"
$ingestionRoot = Join-Path $databaseDir "ingestion"
$incomingDir = Join-Path $ingestionRoot "incoming"
$normalizedDir = Join-Path $ingestionRoot "normalized"
$logsDir = Join-Path $ingestionRoot "logs"

New-Item -ItemType Directory -Force -Path $incomingDir | Out-Null
New-Item -ItemType Directory -Force -Path $normalizedDir | Out-Null
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

$sourceResolved = Resolve-Path $SourceDocx -ErrorAction Stop
$sourcePath = $sourceResolved.Path
if (-not (Test-Path $sourcePath)) {
    throw "Source DOCX not found: $SourceDocx"
}
if (-not $sourcePath.ToLower().EndsWith(".docx")) {
    throw "Source file must be .docx"
}

$runId = Get-Date -Format "yyyyMMdd-HHmmss"
$sourceLeaf = Split-Path -Leaf $sourcePath
$copiedDocx = Join-Path $incomingDir ("{0}-{1}" -f $runId, $sourceLeaf)
Copy-Item -Path $sourcePath -Destination $copiedDocx -Force

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($copiedDocx)
try {
    $entry = $zip.GetEntry("word/document.xml")
    if ($null -eq $entry) {
        throw "word/document.xml not found in DOCX archive."
    }
    $reader = New-Object IO.StreamReader($entry.Open())
    $xmlText = $reader.ReadToEnd()
    $reader.Close()
}
finally {
    $zip.Dispose()
}

[xml]$xml = $xmlText
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
$body = $xml.SelectSingleNode("//w:document/w:body", $ns)
if ($null -eq $body) {
    throw "DOCX body not found."
}

$currentBranch = $null
$currentSemester = $null
$rows = New-Object System.Collections.Generic.List[object]
$issues = New-Object System.Collections.Generic.List[string]
$contextRow = 1

foreach ($child in $body.ChildNodes) {
    if ($child.LocalName -eq "p") {
        $contextRow++
        $pText = Get-NodeText -Node $child -NsManager $ns
        if ([string]::IsNullOrWhiteSpace($pText)) { continue }

        if ($pText -match "(?i)brance\s*name\s*[:-]\s*(.+)$") {
            $candidate = $Matches[1].Trim()
            $canonical = Get-CanonicalBranch $candidate
            if ($null -eq $canonical) {
                $issues.Add("Row ${contextRow}: Unknown branch alias in heading: $candidate")
            } else {
                $currentBranch = $canonical
            }
            continue
        }

        if ($pText -match "(?i)^\s*sem") {
            $candidateSem = $Matches[0]
            $canonicalSem = Get-CanonicalSemester $candidateSem
            if ($null -ne $canonicalSem) {
                $currentSemester = $canonicalSem
            } else {
                $issues.Add("Row ${contextRow}: Unknown semester alias in heading: $candidateSem")
            }
            continue
        }

        $subjects = Parse-SubjectsFromLine $pText
        foreach ($subject in $subjects) {
            if ($null -eq $currentBranch -or $null -eq $currentSemester) {
                $issues.Add("Row ${contextRow}: Skipped subject '$($subject.name)' because branch/semester context is missing.")
                continue
            }
            if (-not (Is-ValidSubjectCode $subject.subjectCode)) {
                $issues.Add("Row ${contextRow}: Malformed subject code: $($subject.subjectCode)")
                continue
            }

            $rows.Add([pscustomobject]@{
                name = $subject.name.Trim()
                subjectCode = $subject.subjectCode
                branch = $currentBranch
                semester = $currentSemester
                sourceRow = $contextRow
            })
        }
    }
    elseif ($child.LocalName -eq "tbl") {
        $trs = $child.SelectNodes(".//w:tr", $ns)
        foreach ($tr in $trs) {
            $contextRow++
            $cells = @()
            foreach ($tc in $tr.SelectNodes("./w:tc", $ns)) {
                $cellText = Get-NodeText -Node $tc -NsManager $ns
                if (-not [string]::IsNullOrWhiteSpace($cellText)) { $cells += $cellText.Trim() }
            }

            if ($cells.Count -eq 0) { continue }
            $line = ($cells -join " | ").Trim()
            if ([string]::IsNullOrWhiteSpace($line)) { continue }

            if ($line -match "(?i)sem\s*[-:>]*\s*([1-8](?:st|nd|rd|th)?)") {
                $canonicalSem = Get-CanonicalSemester $Matches[1]
                if ($null -ne $canonicalSem) {
                    $currentSemester = $canonicalSem
                } else {
                    $issues.Add("Row ${contextRow}: Unknown semester alias in table row: $($Matches[1])")
                }
                $line = [regex]::Replace($line, "(?i)^\s*sem\s*[-:>]*\s*[1-8](?:st|nd|rd|th)?\s*", "")
            }

            $lowerLine = $line.ToLower()
            if ($lowerLine.Contains("subject code") -and $lowerLine.Contains("subject name")) { continue }

            $subjects = Parse-SubjectsFromLine $line
            foreach ($subject in $subjects) {
                if ($null -eq $currentBranch -or $null -eq $currentSemester) {
                    $issues.Add("Row ${contextRow}: Skipped subject '$($subject.name)' because branch/semester context is missing.")
                    continue
                }
                if (-not (Is-ValidSubjectCode $subject.subjectCode)) {
                    $issues.Add("Row ${contextRow}: Malformed subject code: $($subject.subjectCode)")
                    continue
                }

                $rows.Add([pscustomobject]@{
                    name = $subject.name.Trim()
                    subjectCode = $subject.subjectCode
                    branch = $currentBranch
                    semester = $currentSemester
                    sourceRow = $contextRow
                })
            }
        }
    }
}

if ($rows.Count -eq 0) {
    throw "No subjects could be parsed from DOCX."
}

$unique = @{}
foreach ($row in $rows) {
    $key = ("{0}|{1}|{2}|{3}" -f $row.name.ToLower(), $row.subjectCode.ToUpper(), $row.branch.ToLower(), $row.semester)
    if (-not $unique.ContainsKey($key)) {
        $unique[$key] = $row
    }
}
$finalRows = @($unique.Values)
$finalRows = $finalRows | Sort-Object branch, @{ Expression = { [int]$_.semester } }, subjectCode, name

try {
    $excel = New-Object -ComObject Excel.Application
}
catch {
    throw "Microsoft Excel COM automation is required for DOCX -> XLSX conversion on this machine."
}

$excel.DisplayAlerts = $false
$excel.Visible = $false
$workbook = $excel.Workbooks.Add()
$sheet = $workbook.Worksheets.Item(1)
$sheet.Name = "subjects"
$sheet.Cells.Item(1, 1).Value2 = "name"
$sheet.Cells.Item(1, 2).Value2 = "subjectCode"
$sheet.Cells.Item(1, 3).Value2 = "branch"
$sheet.Cells.Item(1, 4).Value2 = "semester"

$r = 2
foreach ($row in $finalRows) {
    $sheet.Cells.Item($r, 1).Value2 = $row.name
    $sheet.Cells.Item($r, 2).Value2 = $row.subjectCode
    $sheet.Cells.Item($r, 3).Value2 = $row.branch
    $sheet.Cells.Item($r, 4).Value2 = $row.semester
    $r++
}
$sheet.Columns.Item("A:D").AutoFit() | Out-Null

$normalizedRunXlsx = Join-Path $normalizedDir ("subjects_import_{0}.xlsx" -f $runId)
$latestXlsx = Join-Path $databaseDir "subjects_import.xlsx"
if (Test-Path $normalizedRunXlsx) { Remove-Item $normalizedRunXlsx -Force }
$workbook.SaveAs($normalizedRunXlsx, 51)
$workbook.Close($true)
$excel.Quit()
[void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($sheet)
[void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($workbook)
[void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
[GC]::Collect()
[GC]::WaitForPendingFinalizers()

Copy-Item -Path $normalizedRunXlsx -Destination $latestXlsx -Force

$importResult = $null
if ($RunImport) {
    $loginBody = @{ username = $Username; password = $Password } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri ($ApiBaseUrl.TrimEnd("/") + "/api/auth/login") -Method Post -ContentType "application/json" -Body $loginBody
    $token = $login.token
    if (-not $token) {
        throw "Login succeeded but no JWT token was returned."
    }

    $raw = & curl.exe -sS -X POST ($ApiBaseUrl.TrimEnd("/") + "/api/admin/subjects/import") -H ("Authorization: Bearer " + $token) -F ("file=@" + $latestXlsx)
    $importResult = $raw | ConvertFrom-Json
}

$distribution = $finalRows |
    Group-Object branch, semester |
    Sort-Object Name |
    ForEach-Object {
        [pscustomobject]@{
            bucket = $_.Name
            count = $_.Count
        }
    }

$summary = [ordered]@{
    runId = $runId
    timestamp = (Get-Date).ToString("o")
    operator = $env:USERNAME
    sourceDocx = $sourcePath
    copiedDocx = $copiedDocx
    normalizedXlsx = $normalizedRunXlsx
    latestXlsx = $latestXlsx
    parsedRows = $rows.Count
    uniqueRows = $finalRows.Count
    parserIssues = @($issues)
    parserIssuesPreview = @($issues | Select-Object -First 10)
    distribution = $distribution
    importExecuted = [bool]$RunImport
    importResult = $importResult
}

$summaryJsonPath = Join-Path $logsDir ("subject_ingestion_{0}.json" -f $runId)
$summaryTxtPath = Join-Path $logsDir ("subject_ingestion_{0}.txt" -f $runId)
$summary | ConvertTo-Json -Depth 10 | Set-Content -Path $summaryJsonPath -Encoding UTF8

$txt = @()
$txt += "Subject Ingestion Run: $runId"
$txt += "Timestamp: $($summary.timestamp)"
$txt += "Operator: $($summary.operator)"
$txt += "Source DOCX: $($summary.sourceDocx)"
$txt += "Copied DOCX: $($summary.copiedDocx)"
$txt += "Normalized XLSX: $($summary.normalizedXlsx)"
$txt += "Latest XLSX: $($summary.latestXlsx)"
$txt += "Parsed Rows: $($summary.parsedRows)"
$txt += "Unique Rows: $($summary.uniqueRows)"
$txt += "Parser Issues: $($summary.parserIssues.Count)"
$txt += ""
$txt += "Distribution (branch, semester => count):"
foreach ($item in $distribution) {
    $txt += "- $($item.bucket) => $($item.count)"
}
$txt += ""
if ($RunImport -and $null -ne $importResult) {
    $txt += "Import Executed: yes"
    if ($importResult.importBatchId) {
        $txt += "Import Batch ID: $($importResult.importBatchId)"
    }
    $txt += "Imported Count: $($importResult.importedCount)"
    $txt += "Skipped Count: $($importResult.skippedCount)"
    $errorList = @()
    if ($importResult.errors) { $errorList = @($importResult.errors) }
    $txt += "Import Errors Preview:"
    foreach ($err in ($errorList | Select-Object -First 10)) {
        $txt += "- $err"
    }
}
else {
    $txt += "Import Executed: no"
}
$txt | Set-Content -Path $summaryTxtPath -Encoding UTF8

Write-Host "Ingestion completed."
Write-Host "Run ID: $runId"
Write-Host "Normalized XLSX: $normalizedRunXlsx"
Write-Host "Latest XLSX: $latestXlsx"
Write-Host "Audit JSON: $summaryJsonPath"
Write-Host "Audit TXT: $summaryTxtPath"
if ($RunImport -and $null -ne $importResult) {
    Write-Host ("Import result -> Imported: {0}, Skipped: {1}" -f $importResult.importedCount, $importResult.skippedCount)
}
