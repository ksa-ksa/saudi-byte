# SAUDI BYTE PC Assistant - experimental, local-only Windows report.
# Review this source before running. No remote commands, no elevation, no persistence.
$ErrorActionPreference = 'Stop'
function Ask([string]$Text) { (Read-Host "$Text [y/N]") -match '^(?i:y|yes)$' }
function GiB($Bytes) { if ($null -ne $Bytes) { [math]::Round([double]$Bytes / 1GB, 2) } }
Write-Host 'SAUDI BYTE PC ASSISTANT - BETA'
Write-Host 'Choose each check. Nothing is uploaded to SAUDI BYTE.'
Write-Host 'Update checks contact your configured Windows Update / WinGet sources.'
Write-Host 'Defender may quarantine threats automatically according to its existing policy.'
$all = Ask 'Allow ALL FOUR checks, including a Defender quick scan?'
if ($all) { $hardware=$true; $security=$true; $drivers=$true; $apps=$true }
else {
 $hardware = Ask 'Read CPU, GPU, RAM, OS and free drive space?'
 $security = Ask 'Start Microsoft Defender quick scan and read protection status?'
 $drivers = Ask 'List installed drivers and search Windows Update for driver updates?'
 $apps = Ask 'List available application updates using WinGet?'
}
if (-not ($hardware -or $security -or $drivers -or $apps)) { Write-Host 'No permission granted.'; return }
$report = [ordered]@{schema='saudi-byte-pc-report-v1'; createdUtc=[DateTime]::UtcNow.ToString('o'); hardware=$null; security=$null; drivers=$null; applications=$null}
if ($hardware) {
 Write-Host 'Reading hardware...'
 try {
  $cpu = @(Get-CimInstance Win32_Processor | ForEach-Object { [string]$_.Name })
  $gpu = @(Get-CimInstance Win32_VideoController | ForEach-Object { [string]$_.Name })
  $sys = Get-CimInstance Win32_ComputerSystem
  $os = Get-CimInstance Win32_OperatingSystem
  $drives = @(Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | ForEach-Object { @{drive=[string]$_.DeviceID;freeGB=(GiB $_.FreeSpace);totalGB=(GiB $_.Size)} })
  $report.hardware = @{status='ok';cpu=$cpu;gpu=$gpu;ramGB=(GiB $sys.TotalPhysicalMemory);os=[string]$os.Caption;architecture=[string]$os.OSArchitecture;drives=$drives}
 } catch { $report.hardware=@{status='unavailable'} }
}
if ($security) {
 Write-Host 'Starting Defender quick scan; this may take time.'
 $s = [ordered]@{status='unavailable';scan='not_completed';activeThreats=$null;realTimeProtection=$null;signatureAgeDays=$null}
 try {
  $before=Get-MpComputerStatus
  $s.realTimeProtection=$before.RealTimeProtectionEnabled
  $s.signatureAgeDays=$before.AntivirusSignatureAge
  if ($before.AntivirusEnabled -ne $true) { $s.scan='defender_disabled' }
  else {
   Start-MpScan -ScanType QuickScan
   $after=Get-MpComputerStatus
   $s.scan='requested'
   if ($after.QuickScanEndTime -and $after.QuickScanEndTime -gt $before.QuickScanEndTime) { $s.scan='completed' }
   $s.activeThreats=@(Get-MpThreat | Where-Object { $_.IsActive -eq $true }).Count
   $s.status='ok'
  }
 } catch { $s.status='unavailable' }
 $report.security=$s
}
if ($drivers) {
 Write-Host 'Checking driver inventory and Windows Update...'
 $d=[ordered]@{status='unavailable';installed=@();updates=@();updateSearch='not_completed'}
 try {
  $d.installed=@(Get-CimInstance Win32_PnPSignedDriver | Where-Object { $_.DeviceName } | Select-Object -First 500 | ForEach-Object { @{name=[string]$_.DeviceName;version=[string]$_.DriverVersion;provider=[string]$_.DriverProviderName} })
  $d.status='ok'
 } catch {}
 try {
  $session=New-Object -ComObject Microsoft.Update.Session
  $searcher=$session.CreateUpdateSearcher()
  $result=$searcher.Search("IsInstalled=0 and IsHidden=0 and Type='Driver'")
  $d.updates=@(for($i=0;$i -lt $result.Updates.Count -and $i -lt 200;$i++){[string]$result.Updates.Item($i).Title})
  $d.updateSearch=if($result.ResultCode -eq 2){'ok'}else{'partial'}
 } catch { $d.updateSearch='unavailable' }
 $report.drivers=$d
}
if ($apps) {
 Write-Host 'Listing available WinGet updates (no installations)...'
 $a=[ordered]@{status='unavailable';output='';exitCode=$null}
 try {
  if (Get-Command winget.exe -ErrorAction SilentlyContinue) {
   $output = & winget.exe list --upgrade-available --disable-interactivity 2>&1 | Out-String
   $a.exitCode=$LASTEXITCODE
   $a.output=$output.Substring(0,[Math]::Min(30000,$output.Length))
   $a.status=if($a.exitCode -eq 0){'ok'}else{'partial'}
  }
 } catch {}
 $report.applications=$a
}
if (-not (Ask 'Save the selected results as a local JSON report?')) { Write-Host 'Report discarded.'; return }
$path=Join-Path (Get-Location) ('SAUDI-BYTE-PC-'+[DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss')+'.json')
$report | ConvertTo-Json -Depth 7 | Set-Content -LiteralPath $path -Encoding UTF8
Write-Host "Local report: $path"
Write-Host 'Open PC Assistant in your browser and select the report. It stays in your browser.'
