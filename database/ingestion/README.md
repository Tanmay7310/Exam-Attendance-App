# Subject Ingestion Workflow

This folder contains the operational ingestion pipeline artifacts for subject catalog imports.

## Workflow

1. Place source Word file (`.docx`) anywhere inside workspace.
2. Run the ingestion script from repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-subject-ingestion.ps1 -SourceDocx ".\database\Brance name (with code).docx"
```

3. Script outputs:
- Normalized run file: `database\ingestion\normalized\subjects_import_<runId>.xlsx`
- Latest handoff file: `database\subjects_import.xlsx`
- Audit log JSON: `database\ingestion\logs\subject_ingestion_<runId>.json`
- Audit log TXT: `database\ingestion\logs\subject_ingestion_<runId>.txt`

4. Optional one-command import after normalization:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-subject-ingestion.ps1 `
  -SourceDocx ".\database\Brance name (with code).docx" `
  -RunImport `
  -ApiBaseUrl "http://localhost:8080" `
  -Username "admin1" `
  -Password "Admin@123"
```

## Canonical normalization

- Branch values:
  - `Computer Science and Engineering`
  - `Information Technology`
  - `Electronics and Communication Engineering`
  - `Civil Engineering`
  - `Mechanical Engineering`
- Semester values: `"1"` to `"8"`.
- Subject code format: uppercase hyphen + optional elective suffix, for example `EC-803(C)`.

## Folder purpose

- `incoming/`: run-stamped source DOCX copy.
- `normalized/`: run-stamped normalized XLSX output.
- `logs/`: ingestion run audit summaries.

## One-time rollback of imported subjects

Use this when you need to remove subjects that came from import artifacts while keeping other records.

1. Preview only (creates deletion manifest, no data is removed):

```powershell
powershell -ExecutionPolicy Bypass -File .\rollback-imported-subjects.ps1 `
  -Mode Preview `
  -ApiBaseUrl "http://localhost:8080" `
  -Username "admin1" `
  -Password "Admin@123"
```

2. Execute deletion from manifest (uses existing `DELETE /api/admin/subjects/{id}` path):

```powershell
powershell -ExecutionPolicy Bypass -File .\rollback-imported-subjects.ps1 `
  -Mode Execute `
  -ApiBaseUrl "http://localhost:8080" `
  -Username "admin1" `
  -Password "Admin@123"
```

3. Rollback audit files are written to:
- `database\ingestion\logs\rollback_preview_<runId>.json|txt`
- `database\ingestion\logs\rollback_execute_<runId>.json|txt`
