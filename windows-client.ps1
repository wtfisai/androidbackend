# Android Remote Diagnostic Client for Windows
# PowerShell script to connect to your Android device API

param(
    [Parameter(Mandatory=$false)]
    [string]$ServerUrl = "http://192.168.1.100:3000",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiKey = ""
)

# Configuration
if ($ApiKey -eq "") {
    $ApiKey = Read-Host "Enter your API Key" -AsSecureString
    $ApiKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($ApiKey))
}

$headers = @{
    "x-api-key" = $ApiKey
    "Content-Type" = "application/json"
}

# Helper function for API calls
function Invoke-AndroidAPI {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [hashtable]$Body = @{}
    )
    
    $uri = "$ServerUrl$Endpoint"
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method $Method
        } else {
            $jsonBody = $Body | ConvertTo-Json
            $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method $Method -Body $jsonBody
        }
        return $response
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
        return $null
    }
}

# Main menu
function Show-Menu {
    Write-Host "`n===== Android Remote Diagnostic Tool =====" -ForegroundColor Cyan
    Write-Host "1. System Information"
    Write-Host "2. Device Properties"
    Write-Host "3. Battery Status"
    Write-Host "4. Network Status"
    Write-Host "5. Process List"
    Write-Host "6. Storage Information"
    Write-Host "7. Package List"
    Write-Host "8. View Logcat"
    Write-Host "9. Execute ADB Command"
    Write-Host "10. Execute Shell Command"
    Write-Host "11. Test Connection"
    Write-Host "0. Exit"
    Write-Host "==========================================" -ForegroundColor Cyan
}

# Main loop
do {
    Show-Menu
    $choice = Read-Host "`nSelect an option"
    
    switch ($choice) {
        "1" {
            Write-Host "`nFetching system information..." -ForegroundColor Yellow
            $info = Invoke-AndroidAPI -Endpoint "/api/system"
            if ($info) {
                Write-Host "`nSystem Information:" -ForegroundColor Green
                Write-Host "Hostname: $($info.hostname)"
                Write-Host "Platform: $($info.platform)"
                Write-Host "Architecture: $($info.arch)"
                Write-Host "CPUs: $($info.cpus)"
                Write-Host "Total Memory: $([math]::Round($info.totalMemory / 1GB, 2)) GB"
                Write-Host "Free Memory: $([math]::Round($info.freeMemory / 1GB, 2)) GB"
                Write-Host "Uptime: $([math]::Round($info.uptime / 3600, 2)) hours"
            }
        }
        
        "2" {
            Write-Host "`nFetching device properties..." -ForegroundColor Yellow
            $props = Invoke-AndroidAPI -Endpoint "/api/device/properties"
            if ($props) {
                Write-Host "`nDevice Properties:" -ForegroundColor Green
                Write-Host "Android Version: $($props.androidVersion)"
                Write-Host "SDK Version: $($props.sdkVersion)"
                Write-Host "Device: $($props.device)"
                Write-Host "Model: $($props.model)"
                Write-Host "Manufacturer: $($props.manufacturer)"
                Write-Host "Build ID: $($props.buildId)"
                Write-Host "Build Date: $($props.buildDate)"
            }
        }
        
        "3" {
            Write-Host "`nFetching battery status..." -ForegroundColor Yellow
            $battery = Invoke-AndroidAPI -Endpoint "/api/device/battery"
            if ($battery) {
                Write-Host "`nBattery Status:" -ForegroundColor Green
                $battery | Format-Table -AutoSize
            }
        }
        
        "4" {
            Write-Host "`nFetching network status..." -ForegroundColor Yellow
            $network = Invoke-AndroidAPI -Endpoint "/api/device/network"
            if ($network) {
                Write-Host "`nNetwork Interfaces:" -ForegroundColor Green
                foreach ($iface in $network.interfaces) {
                    Write-Host "Interface: $($iface.name)"
                    foreach ($addr in $iface.addresses) {
                        Write-Host "  Address: $addr"
                    }
                }
            }
        }
        
        "5" {
            Write-Host "`nFetching process list..." -ForegroundColor Yellow
            $processes = Invoke-AndroidAPI -Endpoint "/api/processes"
            if ($processes) {
                Write-Host "`nProcess Count: $($processes.count)" -ForegroundColor Green
                $processes.processes | Select-Object -First 20 | Format-Table -AutoSize
                Write-Host "(Showing first 20 processes)"
            }
        }
        
        "6" {
            Write-Host "`nFetching storage information..." -ForegroundColor Yellow
            $storage = Invoke-AndroidAPI -Endpoint "/api/storage"
            if ($storage) {
                Write-Host "`nStorage Information:" -ForegroundColor Green
                $storage.storage | Format-Table -AutoSize
            }
        }
        
        "7" {
            Write-Host "`nFetching package list..." -ForegroundColor Yellow
            $packages = Invoke-AndroidAPI -Endpoint "/api/packages"
            if ($packages) {
                Write-Host "`nTotal Packages: $($packages.count)" -ForegroundColor Green
                $search = Read-Host "Enter search term (or press Enter to show all)"
                if ($search) {
                    $filtered = $packages.packages | Where-Object { $_ -like "*$search*" }
                    $filtered | ForEach-Object { Write-Host $_ }
                    Write-Host "`nFound $($filtered.Count) packages matching '$search'"
                } else {
                    $packages.packages | Select-Object -First 20 | ForEach-Object { Write-Host $_ }
                    Write-Host "`n(Showing first 20 packages)"
                }
            }
        }
        
        "8" {
            $lines = Read-Host "Number of lines to fetch (default: 100)"
            if (-not $lines) { $lines = 100 }
            $filter = Read-Host "Log filter (optional)"
            
            Write-Host "`nFetching logcat..." -ForegroundColor Yellow
            $endpoint = "/api/logcat?lines=$lines"
            if ($filter) { $endpoint += "&filter=$filter" }
            
            $logs = Invoke-AndroidAPI -Endpoint $endpoint
            if ($logs) {
                Write-Host "`nLogcat Output ($($logs.count) lines):" -ForegroundColor Green
                $logs.logs | Select-Object -Last 50 | ForEach-Object { Write-Host $_ }
            }
        }
        
        "9" {
            Write-Host "`nAvailable safe ADB commands:" -ForegroundColor Yellow
            Write-Host "- devices"
            Write-Host "- shell getprop"
            Write-Host "- shell dumpsys battery"
            Write-Host "- shell pm list packages"
            Write-Host "- logcat -d -t 100"
            
            $command = Read-Host "`nEnter ADB command"
            $force = Read-Host "Force execution (bypass whitelist)? (y/N)"
            
            $body = @{ command = $command }
            if ($force -eq "y") { $body.force = $true }
            
            Write-Host "`nExecuting ADB command..." -ForegroundColor Yellow
            $result = Invoke-AndroidAPI -Endpoint "/api/adb/execute" -Method "POST" -Body $body
            if ($result) {
                Write-Host "`nOutput:" -ForegroundColor Green
                Write-Host $result.output
                if ($result.stderr) {
                    Write-Host "`nErrors:" -ForegroundColor Red
                    Write-Host $result.stderr
                }
            }
        }
        
        "10" {
            Write-Host "`nWARNING: Shell commands are executed directly!" -ForegroundColor Red
            $command = Read-Host "Enter shell command"
            
            Write-Host "`nExecuting shell command..." -ForegroundColor Yellow
            $result = Invoke-AndroidAPI -Endpoint "/api/shell" -Method "POST" -Body @{ command = $command }
            if ($result) {
                Write-Host "`nOutput:" -ForegroundColor Green
                Write-Host $result.output
                if ($result.stderr) {
                    Write-Host "`nErrors:" -ForegroundColor Red
                    Write-Host $result.stderr
                }
            }
        }
        
        "11" {
            Write-Host "`nTesting connection to $ServerUrl..." -ForegroundColor Yellow
            try {
                $health = Invoke-RestMethod -Uri "$ServerUrl/health" -Method GET
                Write-Host "Connection successful!" -ForegroundColor Green
                Write-Host "Server Status: $($health.status)"
                Write-Host "Server Uptime: $([math]::Round($health.uptime / 60, 2)) minutes"
                
                # Test authenticated endpoint
                $test = Invoke-AndroidAPI -Endpoint "/api/system"
                if ($test) {
                    Write-Host "Authentication successful!" -ForegroundColor Green
                } else {
                    Write-Host "Authentication failed! Check your API key." -ForegroundColor Red
                }
            } catch {
                Write-Host "Connection failed: $_" -ForegroundColor Red
            }
        }
        
        "0" {
            Write-Host "`nExiting..." -ForegroundColor Yellow
            break
        }
        
        default {
            Write-Host "`nInvalid option!" -ForegroundColor Red
        }
    }
    
    if ($choice -ne "0") {
        Read-Host "`nPress Enter to continue"
    }
    
} while ($choice -ne "0")

Write-Host "Goodbye!" -ForegroundColor Green