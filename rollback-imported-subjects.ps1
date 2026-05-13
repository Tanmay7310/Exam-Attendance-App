param(
    [ValidateSet("Preview", "Execute")]
    [string]$Mode = "Preview",
    [string]$ApiBaseUrl = "http://localhost:8080",
    [string]$Username = "admin1",
    [string]$Password = "Admin@123",
    [string]$ManifestPath,
    [string[]]$SourceFiles = @(
        "D:\Exam Attendance app\database\subjects_import.xlsx",
        "D:\Exam Attendance app\database\subjects_import_small.xlsx"
    )
)

$ErrorActionPreference = "Stop"

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
        "cs" = "Computer Science and Engineering"
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

function Normalize-Header {
    param([string]$Header)
    if ($null -eq $Header) { return "" }
    return ($Header -replace "[^a-zA-Z]", "").ToLower()
}

function Build-SubjectKey {
    param(
        [string]$Name,
        [string]$SubjectCode,
        [string]$Branch,
        [string]$Semester
    )
    return ("{0}|{1}|{2}|{3}" -f $Name.Trim().ToLower(), $SubjectCode.Trim().ToUpper(), $Branch.Trim().ToLower(), $Semester.Trim())
}

function Resolve-ManifestPath {
    param([string]$LogsDir, [string]$InputPath)
    if ([string]::IsNullOrWhiteSpace($InputPath)) {
        $latest = Get-ChildItem -Path $LogsDir -Filter "rollback_preview_*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($null -eq $latest) {
            throw "No rollback preview manifest found in $LogsDir. Run Preview mode first or pass -ManifestPath."
        }
        return $latest.FullName
    }
    $resolved = Resolve-Path -Path $InputPath -ErrorAction Stop
    return $resolved.Path
}

function Get-ApiToken {
    param([string]$ApiBase, [string]$User, [string]$Pass)
    $loginBody = @{ username = $User; password = $Pass } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri ($ApiBase.TrimEnd("/") + "/api/auth/login") -Method Post -ContentType "application/json" -Body $loginBody
    if (-not $login.token) {
        throw "Login succeeded but no token returned."
    }
    return $login.token
}

function Get-ErrorMessage {
    param([object]$Exception)
    $response = $Exception.Exception.Response
    if ($null -eq $response) {
        return $Exception.Exception.Message
    }
    try {
        $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
        $body = $reader.ReadToEnd()
        $reader.Close()
        if (-not [string]::IsNullOrWhiteSpace($body)) {
            try {
                $json = $body | ConvertFrom-Json
                if ($json.message) { return [string]$json.message }
            }
            catch { }
            return $body
        }
    }
    catch { }
    return $Exception.Exception.Message
}

function Read-SubjectsFromExcel {
    param([string[]]$Files)
    $rows = @()
    $issues = @()

    try {
        $excel = New-Object -ComObject Excel.Application
    }
    catch {
        throw "Microsoft Excel COM automation is required to read XLSX files."
    }

    $excel.DisplayAlerts = $false
    $excel.Visible = $false
    try {
        foreach ($file in $Files) {
            $resolved = Resolve-Path -Path $file -ErrorAction Stop
            $path = $resolved.Path

            $workbook = $excel.Workbooks.Open($path)
            try {
                $sheet = $workbook.Worksheets.Item(1)
                $used = $sheet.UsedRange
                $rowCount = [int]$used.Rows.Count
                $colCount = [int]$used.Columns.Count

                if ($rowCount -lt 2) { continue }

                $headerMap = @{}
                for ($col = 1; $col -le $colCount; $col++) {
                    $header = [string]$sheet.Cells.Item(1, $col).Text
                    $key = Normalize-Header $header
                    if (-not [string]::IsNullOrWhiteSpace($key)) {
                        $headerMap[$key] = $col
                    }
                }

                if (-not $headerMap.ContainsKey("name") -or -not $headerMap.ContainsKey("subjectcode") -or -not $headerMap.ContainsKey("branch") -or -not $headerMap.ContainsKey("semester")) {
                    throw "Excel file is missing required headers (name, subjectCode, branch, semester): $path"
                }

                for ($rowNum = 2; $rowNum -le $rowCount; $rowNum++) {
                    $nameRaw = ([string]$sheet.Cells.Item($rowNum, $headerMap["name"]).Text).Trim()
                    $codeRaw = ([string]$sheet.Cells.Item($rowNum, $headerMap["subjectcode"]).Text).Trim()
                    $branchRaw = ([string]$sheet.Cells.Item($rowNum, $headerMap["branch"]).Text).Trim()
                    $semesterRaw = ([string]$sheet.Cells.Item($rowNum, $headerMap["semester"]).Text).Trim()

                    if ([string]::IsNullOrWhiteSpace($nameRaw) -and [string]::IsNullOrWhiteSpace($codeRaw) -and [string]::IsNullOrWhiteSpace($branchRaw) -and [string]::IsNullOrWhiteSpace($semesterRaw)) {
                        continue
                    }

                    $name = $nameRaw.Trim()
                    $subjectCode = Normalize-SubjectCode $codeRaw
                    $branch = Get-CanonicalBranch $branchRaw
                    $semester = Get-CanonicalSemester $semesterRaw

                    if ([string]::IsNullOrWhiteSpace($name) -or [string]::IsNullOrWhiteSpace($subjectCode) -or [string]::IsNullOrWhiteSpace($branchRaw) -or [string]::IsNullOrWhiteSpace($semesterRaw)) {
                        $issues += "Skipped $path row ${rowNum}: missing required fields."
                        continue
                    }
                    if ($null -eq $branch) {
                        $issues += "Skipped $path row ${rowNum}: unknown branch alias '$branchRaw'."
                        continue
                    }
                    if ($null -eq $semester) {
                        $issues += "Skipped $path row ${rowNum}: unknown semester alias '$semesterRaw'."
                        continue
                    }
                    if (-not (Is-ValidSubjectCode $subjectCode)) {
                        $issues += "Skipped $path row ${rowNum}: malformed subject code '$codeRaw'."
                        continue
                    }

                    $rows += [pscustomobject]@{
                        sourceFile = $path
                        sourceRow = $rowNum
                        name = $name
                        subjectCode = $subjectCode
                        branch = $branch
                        semester = $semester
                        key = (Build-SubjectKey -Name $name -SubjectCode $subjectCode -Branch $branch -Semester $semester)
                    }
                }
            }
            finally {
                $workbook.Close($false)
                [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($sheet)
                [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($used)
                [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($workbook)
            }
        }
    }
    finally {
        $excel.Quit()
        [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
        [GC]::Collect()
        [GC]::WaitForPendingFinalizers()
    }

    return [pscustomobject]@{
        rows = $rows
        issues = $issues
    }
}

function Normalize-DbSubject {
    param([object]$Subject)
    $name = ([string]$Subject.name).Trim()
    $code = Normalize-SubjectCode ([string]$Subject.subjectCode)
    $branchRaw = ([string]$Subject.branch).Trim()
    $semesterRaw = ([string]$Subject.semester).Trim()

    $branchCanonical = Get-CanonicalBranch $branchRaw
    if ($null -eq $branchCanonical) { $branchCanonical = $branchRaw }
    $semesterCanonical = Get-CanonicalSemester $semesterRaw
    if ($null -eq $semesterCanonical) { $semesterCanonical = $semesterRaw }

    return [pscustomobject]@{
        id = [int64]$Subject.id
        name = $name
        subjectCode = $code
        branch = $branchCanonical
        semester = $semesterCanonical
        key = (Build-SubjectKey -Name $name -SubjectCode $code -Branch $branchCanonical -Semester $semesterCanonical)
        nbsKey = ("{0}|{1}|{2}" -f $name.ToLower(), $branchCanonical.ToLower(), $semesterCanonical)
        codeKey = $code.ToUpper()
    }
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$logsDir = Join-Path $repoRoot "database\ingestion\logs"
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

$runId = Get-Date -Format "yyyyMMdd-HHmmss"
$timestamp = (Get-Date).ToString("o")

if ($Mode -eq "Preview") {
    $parsed = Read-SubjectsFromExcel -Files $SourceFiles
    $parsedRows = @($parsed.rows)
    $parserIssues = @($parsed.issues | ForEach-Object { [string]$_ })
    $parserIssuesPreview = @()
    for ($i = 0; $i -lt $parserIssues.Count -and $i -lt 20; $i++) {
        $parserIssuesPreview += $parserIssues[$i]
    }

    $candidateMap = @{}
    foreach ($row in $parsedRows) {
        if (-not $candidateMap.ContainsKey($row.key)) {
            $candidateMap[$row.key] = $row
        }
    }
    $candidates = @($candidateMap.Values)

    $token = Get-ApiToken -ApiBase $ApiBaseUrl -User $Username -Pass $Password
    $headers = @{ Authorization = "Bearer $token" }
    $dbRaw = Invoke-RestMethod -Uri ($ApiBaseUrl.TrimEnd("/") + "/api/admin/subjects") -Method Get -Headers $headers
    $dbSubjects = @($dbRaw | ForEach-Object { Normalize-DbSubject $_ })

    $exactMap = @{}
    $byCode = @{}
    $byNbs = @{}
    foreach ($s in $dbSubjects) {
        if (-not $exactMap.ContainsKey($s.key)) { $exactMap[$s.key] = @() }
        $exactMap[$s.key] += $s

        if (-not $byCode.ContainsKey($s.codeKey)) { $byCode[$s.codeKey] = @() }
        $byCode[$s.codeKey] += $s

        if (-not $byNbs.ContainsKey($s.nbsKey)) { $byNbs[$s.nbsKey] = @() }
        $byNbs[$s.nbsKey] += $s
    }

    $matched = @()
    $notFound = @()
    $ambiguous = @()
    $deleteIds = @()

    foreach ($candidate in $candidates) {
        $exact = @()
        if ($exactMap.ContainsKey($candidate.key)) { $exact = @($exactMap[$candidate.key]) }

        if ($exact.Count -eq 1) {
            $subject = $exact[0]
            $matched += [pscustomobject]@{
                id = $subject.id
                key = $candidate.key
                name = $candidate.name
                subjectCode = $candidate.subjectCode
                branch = $candidate.branch
                semester = $candidate.semester
                sourceFile = $candidate.sourceFile
                sourceRow = $candidate.sourceRow
            }
            if (-not ($deleteIds -contains $subject.id)) {
                $deleteIds += [long]$subject.id
            }
            continue
        }
        if ($exact.Count -gt 1) {
            $ambiguous += [pscustomobject]@{
                key = $candidate.key
                reason = "Multiple exact matches in DB"
                sourceFile = $candidate.sourceFile
                sourceRow = $candidate.sourceRow
                candidate = $candidate
                matches = $exact
            }
            continue
        }

        $nbsKey = ("{0}|{1}|{2}" -f $candidate.name.ToLower(), $candidate.branch.ToLower(), $candidate.semester)
        $codeKey = $candidate.subjectCode.ToUpper()
        $codeMatches = if ($byCode.ContainsKey($codeKey)) { @($byCode[$codeKey]) } else { @() }
        $nbsMatches = if ($byNbs.ContainsKey($nbsKey)) { @($byNbs[$nbsKey]) } else { @() }

        if ($codeMatches.Count -gt 0 -or $nbsMatches.Count -gt 0) {
            $ambiguous += [pscustomobject]@{
                key = $candidate.key
                reason = "Partial match found (code or name/branch/semester)"
                sourceFile = $candidate.sourceFile
                sourceRow = $candidate.sourceRow
                candidate = $candidate
                codeMatches = $codeMatches
                nbsMatches = $nbsMatches
            }
        }
        else {
            $notFound += [pscustomobject]@{
                key = $candidate.key
                name = $candidate.name
                subjectCode = $candidate.subjectCode
                branch = $candidate.branch
                semester = $candidate.semester
                sourceFile = $candidate.sourceFile
                sourceRow = $candidate.sourceRow
            }
        }
    }

    $manifest = @{
        runId = $runId
        mode = "preview"
        timestamp = $timestamp
        operator = $env:USERNAME
        apiBaseUrl = $ApiBaseUrl
        sourceFiles = $SourceFiles
        candidatesTotal = $candidates.Count
        matchedInDb = $matched.Count
        notFound = $notFound.Count
        ambiguous = $ambiguous.Count
        parserIssuesCount = $parserIssues.Count
        parserIssuesPreview = $parserIssuesPreview
        deletePlan = @($deleteIds)
        matchedCandidates = @($matched)
        notFoundCandidates = @($notFound)
        ambiguousCandidates = @($ambiguous)
    }

    $jsonPath = Join-Path $logsDir ("rollback_preview_{0}.json" -f $runId)
    $txtPath = Join-Path $logsDir ("rollback_preview_{0}.txt" -f $runId)
    $manifest | ConvertTo-Json -Depth 15 | Set-Content -Path $jsonPath -Encoding UTF8

    $txt = @()
    $txt += "Rollback Preview Run: $runId"
    $txt += "Timestamp: $timestamp"
    $txt += "Operator: $($env:USERNAME)"
    $txt += "API: $ApiBaseUrl"
    $txt += "Source Files:"
    foreach ($sf in $SourceFiles) { $txt += "- $sf" }
    $txt += ""
    $txt += "Candidates Total: $($candidates.Count)"
    $txt += "Matched In DB: $($matched.Count)"
    $txt += "Not Found: $($notFound.Count)"
    $txt += "Ambiguous: $($ambiguous.Count)"
    $txt += "Parser Issues: $($parserIssues.Count)"
    $txt += "Delete Plan IDs: $((@($deleteIds) -join ', '))"
    if ($parserIssues.Count -gt 0) {
        $txt += ""
        $txt += "Parser Issues Preview:"
        foreach ($issue in $parserIssuesPreview) {
            $txt += "- $issue"
        }
    }
    if ($ambiguous.Count -gt 0) {
        $txt += ""
        $txt += "Ambiguous Preview:"
        foreach ($a in ($ambiguous | Select-Object -First 10)) {
            $txt += "- $($a.reason) | $($a.candidate.subjectCode) | $($a.candidate.name)"
        }
    }
    $txt | Set-Content -Path $txtPath -Encoding UTF8

    Write-Host "Preview completed."
    Write-Host "Run ID: $runId"
    Write-Host "Manifest JSON: $jsonPath"
    Write-Host "Summary TXT: $txtPath"
    Write-Host "Matched IDs to delete: $($deleteIds.Count)"
    exit 0
}

$resolvedManifestPath = Resolve-ManifestPath -LogsDir $logsDir -InputPath $ManifestPath
$manifest = Get-Content -Path $resolvedManifestPath | ConvertFrom-Json
if ($manifest.mode -ne "preview") {
    throw "Provided manifest is not a preview manifest: $resolvedManifestPath"
}

$deleteIds = @()
if ($manifest.deletePlan) {
    $deleteIds = @($manifest.deletePlan)
}

$token = Get-ApiToken -ApiBase $ApiBaseUrl -User $Username -Pass $Password
$headers = @{ Authorization = "Bearer $token" }

$deleted = 0
$failures = @()

foreach ($id in $deleteIds) {
    try {
        Invoke-RestMethod -Uri ($ApiBaseUrl.TrimEnd("/") + "/api/admin/subjects/$id") -Method Delete -Headers $headers
        $deleted++
    }
    catch {
        $message = Get-ErrorMessage -Exception $_
        $failures += [pscustomobject]@{
            subjectId = [long]$id
            error = $message
        }
    }
}

$dbRawAfter = Invoke-RestMethod -Uri ($ApiBaseUrl.TrimEnd("/") + "/api/admin/subjects") -Method Get -Headers $headers
$dbAfter = @($dbRawAfter | ForEach-Object { Normalize-DbSubject $_ })
$dbAfterMap = @{}
foreach ($s in $dbAfter) {
    if (-not $dbAfterMap.ContainsKey($s.key)) { $dbAfterMap[$s.key] = @() }
    $dbAfterMap[$s.key] += $s
}

$remainingMatches = 0
$matchedCandidates = @()
if ($manifest.matchedCandidates) { $matchedCandidates = @($manifest.matchedCandidates) }
foreach ($mc in $matchedCandidates) {
    if ($dbAfterMap.ContainsKey($mc.key)) {
        $remainingMatches += @($dbAfterMap[$mc.key]).Count
    }
}

$execRunId = Get-Date -Format "yyyyMMdd-HHmmss"
$execution = @{
    runId = $execRunId
    mode = "execute"
    timestamp = (Get-Date).ToString("o")
    operator = $env:USERNAME
    apiBaseUrl = $ApiBaseUrl
    sourceManifest = $resolvedManifestPath
    attempted = $deleteIds.Count
    deleted = $deleted
    failed = $failures.Count
    remainingMatches = $remainingMatches
    failures = $failures
}

$execJsonPath = Join-Path $logsDir ("rollback_execute_{0}.json" -f $execRunId)
$execTxtPath = Join-Path $logsDir ("rollback_execute_{0}.txt" -f $execRunId)
$execution | ConvertTo-Json -Depth 10 | Set-Content -Path $execJsonPath -Encoding UTF8

$summaryTxt = @()
$summaryTxt += "Rollback Execution Run: $execRunId"
$summaryTxt += "Timestamp: $($execution.timestamp)"
$summaryTxt += "Operator: $($execution.operator)"
$summaryTxt += "API: $($execution.apiBaseUrl)"
$summaryTxt += "Source Manifest: $resolvedManifestPath"
$summaryTxt += "Attempted: $($execution.attempted)"
$summaryTxt += "Deleted: $($execution.deleted)"
$summaryTxt += "Failed: $($execution.failed)"
$summaryTxt += "Remaining Matches: $($execution.remainingMatches)"
if ($failures.Count -gt 0) {
    $summaryTxt += ""
    $summaryTxt += "Failures:"
    foreach ($f in $failures) {
        $summaryTxt += "- Subject ID $($f.subjectId): $($f.error)"
    }
}
$summaryTxt | Set-Content -Path $execTxtPath -Encoding UTF8

Write-Host "Execution completed."
Write-Host "Source Manifest: $resolvedManifestPath"
Write-Host "Audit JSON: $execJsonPath"
Write-Host "Audit TXT: $execTxtPath"
Write-Host "Deleted: $deleted / Attempted: $($deleteIds.Count)"
Write-Host "Remaining matches by manifest keys: $remainingMatches"
