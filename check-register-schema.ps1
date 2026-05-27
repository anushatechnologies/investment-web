$res = Invoke-WebRequest -Uri 'https://api.anushatrade.com/v3/api-docs' -UseBasicParsing -TimeoutSec 15
$json = $res.Content | ConvertFrom-Json

Write-Host "=== RegisterRequest Schema ==="
$json.components.schemas.RegisterRequest | ConvertTo-Json -Depth 6

Write-Host ""
Write-Host "=== All Auth-related schemas ==="
$json.components.schemas.PSObject.Properties.Name | Where-Object { $_ -match "Register|Login|Admin|User|Role" }
