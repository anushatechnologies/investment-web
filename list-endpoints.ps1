$res = Invoke-WebRequest -Uri 'https://api.anushatrade.com/v3/api-docs' -UseBasicParsing -TimeoutSec 15
$json = $res.Content | ConvertFrom-Json
$allPaths = $json.paths.PSObject.Properties.Name | Sort-Object
Write-Host "=== ALL API ENDPOINTS ==="
$allPaths | ForEach-Object { Write-Host $_ }
Write-Host ""
Write-Host "=== ADMIN / AUTH RELATED ==="
$allPaths | Where-Object { $_ -like "*admin*" -or $_ -like "*register*" -or $_ -like "*create*" -or $_ -like "*role*" } | ForEach-Object { Write-Host $_ }
