$base = 'https://api.anushatrade.com'

function Test-Endpoint([string]$Method, [string]$Path, $Body = $null) {
    try {
        $headers = @{ 'Content-Type' = 'application/json' }
        $params = @{ Method = $Method; Uri = "$base$Path"; Headers = $headers; TimeoutSec = 10; ErrorAction = 'Stop'; UseBasicParsing = $true }
        if ($Body) { $params.Body = ($Body | ConvertTo-Json -Compress) }
        $res = Invoke-WebRequest @params
        Write-Host "  OK   [$($res.StatusCode)] $Method $Path"
    } catch {
        $code = $null
        try { $code = [int]$_.Exception.Response.StatusCode } catch {}
        if ($code) {
            Write-Host "  FAIL [$code] $Method $Path"
        } else {
            $msg = $_.Exception.Message -replace "`n.*",""
            Write-Host "  ERR  [NET] $Method $Path -- $msg"
        }
    }
}

Write-Host ""
Write-Host "=== AUTH / PUBLIC APIS ==="
Test-Endpoint "POST" "/api/auth/send-otp" @{ email = "test@example.com" }
Test-Endpoint "POST" "/api/auth/verify-otp" @{ idToken = "dummy" }
Test-Endpoint "POST" "/api/auth/register" @{ fullName="Test"; email="t@t.com"; mobileNumber="9999999999"; password="Test@1234" }
Test-Endpoint "POST" "/api/auth/login" @{ email="admin@test.com"; password="test" }
Test-Endpoint "POST" "/api/auth/refresh-token" @{ refreshToken="dummy" }
Test-Endpoint "POST" "/api/auth/reset-password" @{ idToken="dummy"; newPassword="Test@1234" }
Test-Endpoint "POST" "/api/auth/onboarding/register" @{ fullName="Test"; email="t@t.com"; mobileNumber="9999999999"; password="Test@1234" }
Test-Endpoint "POST" "/api/auth/set-mpin" @{ mpin="1234" }

Write-Host ""
Write-Host "=== INVESTOR APIS (no token - expect 401) ==="
Test-Endpoint "GET" "/api/dashboard"
Test-Endpoint "GET" "/api/kyc/status"
Test-Endpoint "GET" "/api/bank/details"
Test-Endpoint "POST" "/api/bank/link" @{ accountHolderName="Test" }
Test-Endpoint "GET" "/api/plans"
Test-Endpoint "GET" "/api/investments"
Test-Endpoint "GET" "/api/wallet"
Test-Endpoint "GET" "/api/wallet/transactions"
Test-Endpoint "GET" "/api/withdrawals"
Test-Endpoint "GET" "/api/referrals/tree"
Test-Endpoint "GET" "/api/referrals/commissions"
Test-Endpoint "GET" "/api/notifications"
Test-Endpoint "POST" "/api/investments/apply" @{ investmentPlanId="1"; investmentAmount=10000 }
Test-Endpoint "POST" "/api/withdrawals/request" @{ requestedAmount=1000 }

Write-Host ""
Write-Host "=== PROFILE APIS (expect 401 or 404/500) ==="
Test-Endpoint "PUT" "/api/profile"
Test-Endpoint "POST" "/api/profile/update"
Test-Endpoint "PUT" "/api/user/profile"

Write-Host ""
Write-Host "=== ADMIN APIS (no token - expect 401) ==="
Test-Endpoint "GET" "/api/admin/dashboard"
Test-Endpoint "GET" "/api/admin/users"
Test-Endpoint "GET" "/api/admin/kyc/pending"
Test-Endpoint "GET" "/api/admin/investments"
Test-Endpoint "GET" "/api/admin/investments/pending"
Test-Endpoint "GET" "/api/admin/withdrawals/pending"
Test-Endpoint "GET" "/api/admin/fraud-alerts"
Test-Endpoint "GET" "/api/admin/audit-logs"
Test-Endpoint "GET" "/api/admin/reports/monthly"
Test-Endpoint "GET" "/api/admin/interest/rates"
Test-Endpoint "GET" "/api/admin/plans"

Write-Host ""
Write-Host "=== SYSTEM APIS ==="
Test-Endpoint "GET" "/actuator/health"
Test-Endpoint "GET" "/v3/api-docs"

Write-Host ""
Write-Host "Done."
