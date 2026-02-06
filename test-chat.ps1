$body = @{
    message = "What columns are in the Excel file you have access to? List them all."
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/chat/demo" -Method Post -ContentType "application/json" -Body $body
Write-Host ($response | ConvertTo-Json -Depth 10)
