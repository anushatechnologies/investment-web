$res = Invoke-WebRequest -Uri 'https://api.anushatrade.com/v3/api-docs' -UseBasicParsing -TimeoutSec 15
$json = $res.Content | ConvertFrom-Json

# Check /api/admin/users endpoint for POST (create admin)
Write-Host "=== /api/admin/users methods ==="
$json.paths.'/api/admin/users'.PSObject.Properties.Name

# Check /api/auth/register body schema
Write-Host ""
Write-Host "=== /api/auth/register POST body ==="
$schema = $json.paths.'/api/auth/register'.post.requestBody.content.'application/json'.schema
$schema | ConvertTo-Json -Depth 5

Write-Host ""
Write-Host "=== /api/admin/users POST body (if exists) ==="
$adminSchema = $json.paths.'/api/admin/users'.post.requestBody.content.'application/json'.schema
$adminSchema | ConvertTo-Json -Depth 5
