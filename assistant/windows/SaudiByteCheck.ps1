#requires -Version 5.1
# SAUDI BYTE | One-time local Windows diagnostics
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$form = New-Object Windows.Forms.Form
$form.Text = 'SAUDI BYTE | فحص ويندوز'
$form.Width = 630
$form.Height = 420
$form.StartPosition = 'CenterScreen'
$form.RightToLeft = 'Yes'
$form.RightToLeftLayout = $true
$panel = New-Object Windows.Forms.FlowLayoutPanel
$panel.Dock = 'Fill'
$panel.FlowDirection = 'TopDown'
$panel.WrapContents = $false
$panel.AutoScroll = $true
$form.Controls.Add($panel)
function Add-Control($type, $label) {
    $control = New-Object ("Windows.Forms." + $type)
    $control.Text = $label
    $control.AutoSize = $true
    $panel.Controls.Add($control)
    return $control
}
[void](Add-Control 'Label' 'اختر الفحوصات لهذه المرة. تُعرض النتائج على جهازك.')
$all = Add-Control 'CheckBox' 'اختيار جميع الفحوصات'
$hardware = Add-Control 'CheckBox' 'مواصفات الجهاز ومساحة قرص النظام لمقارنة الألعاب'
$malware = Add-Control 'CheckBox' 'فحص سريع عبر Defender (قد يعزل تهديدات وفق إعدادات ويندوز)'
$drivers = Add-Control 'CheckBox' 'مشاكل الأجهزة وتحديثات التعريفات المتاحة من Windows Update'
$apps = Add-Control 'CheckBox' 'البرامج التي لها تحديث في مصادر WinGet'
$checks = @($hardware, $malware, $drivers, $apps)
$run = Add-Control 'Button' 'أوافق وأبدأ الفحوصات المحددة'
$run.Enabled = $false
$cancel = Add-Control 'Button' 'إلغاء'
$cancel.DialogResult = 'Cancel'
$form.CancelButton = $cancel
$all.Add_Click({ foreach ($check in $checks) { $check.Checked = $all.Checked } })
foreach ($box in $checks) {
    $box.Add_CheckedChanged({$run.Enabled = @($checks | Where-Object Checked).Count -gt 0})
    $box.Add_Click({$all.Checked = @($checks | Where-Object Checked).Count -eq $checks.Count})
}
$run.DialogResult = 'OK'
if ($form.ShowDialog() -ne 'OK') { $form.Dispose(); return }
$selected = @($checks | ForEach-Object { $_.Checked })
$form.Dispose()
$report = [ordered]@{format='saudi-byte-device-v1'; created=(Get-Date).ToString('o')}
function Invoke-Check($name, [scriptblock]$action) {
    Write-Host $name
    try { $report[$name] = @{status='ok'; data=(& $action)} }
    catch { $report[$name] = @{status='unavailable'; reason=$_.Exception.Message} }
}
if ($selected[0]) {
    Invoke-Check 'hardware' {
        $os = Get-CimInstance Win32_OperatingSystem
        $sys = Get-CimInstance Win32_ComputerSystem
        $disk = Get-CimInstance Win32_LogicalDisk -Filter ("DeviceID='" + $os.SystemDrive + "'")
        @{
            cpu = (@(Get-CimInstance Win32_Processor | ForEach-Object Name) -join ', ')
            gpu = (@(Get-CimInstance Win32_VideoController | ForEach-Object Name) -join ', ')
            ram = [math]::Round($sys.TotalPhysicalMemory / 1GB, 2)
            space = [math]::Floor($disk.FreeSpace / 1GB)
            os = $os.Caption
            drive = $os.SystemDrive
        }
    }
}
if ($selected[1]) {
    Invoke-Check 'defender' {
        $state = Get-MpComputerStatus
        if (-not $state.AntivirusEnabled) { throw 'Microsoft Defender Antivirus is unavailable.' }
        $started = Get-Date
        Start-MpScan -ScanType QuickScan -ErrorAction Stop
        $state = Get-MpComputerStatus
        if (-not $state.QuickScanEndTime -or $state.QuickScanEndTime -lt $started.AddSeconds(-1)) {
            throw 'Scan completion could not be confirmed. Check Windows Security.'
        }
        @{ completed=$state.QuickScanEndTime.ToString('o'); activeThreats=@(Get-MpThreat | Where-Object IsActive | ForEach-Object ThreatName) }
    }
}
if ($selected[2]) {
    Invoke-Check 'deviceIssues' {
        @(Get-CimInstance Win32_PnPEntity -Filter 'ConfigManagerErrorCode > 0' | ForEach-Object { "$($_.Name) (code $($_.ConfigManagerErrorCode))" })
    }
    Invoke-Check 'driverUpdates' {
        $session = New-Object -ComObject Microsoft.Update.Session
        $result = $session.CreateUpdateSearcher().Search("IsInstalled=0 and IsHidden=0 and Type='Driver'")
        if ([int]$result.ResultCode -ne 2) { throw 'Windows Update search did not complete successfully.' }
        @($result.Updates | ForEach-Object Title)
    }
}
if ($selected[3]) {
    Invoke-Check 'appUpdates' {
        $winget = Get-Command winget.exe -CommandType Application
        $lines = & $winget.Source list --upgrade-available --disable-interactivity 2>&1
        if ($LASTEXITCODE -ne 0) { throw ("WinGet returned " + $LASTEXITCODE + ". " + ($lines | Select-Object -Last 1)) }
        ($lines | Out-String -Width 240).Trim()
    }
}
$json = $report | ConvertTo-Json -Depth 6
$results = New-Object Windows.Forms.Form
$results.Text = 'SAUDI BYTE | نتائج الفحوصات المحلية'
$results.Width = 780
$results.Height = 540
$text = New-Object Windows.Forms.TextBox
$text.Multiline = $true
$text.ReadOnly = $true
$text.ScrollBars = 'Both'
$text.Dock = 'Fill'
$text.Text = $json
$save = New-Object Windows.Forms.Button
$save.Text = 'حفظ نسخة JSON لاختيارها داخل الموقع'
$save.Dock = 'Bottom'
$save.Height = 42
$save.Add_Click({
    $dialog = New-Object Windows.Forms.SaveFileDialog
    $dialog.Filter = 'JSON (*.json)|*.json'
    $dialog.FileName = 'saudi-byte-device.json'
    if ($dialog.ShowDialog() -eq 'OK') {
        [System.IO.File]::WriteAllText($dialog.FileName,$json,(New-Object System.Text.UTF8Encoding($false)))
    }
    $dialog.Dispose()
})
$results.Controls.Add($text)
$results.Controls.Add($save)
[void]$results.ShowDialog()
$results.Dispose()
