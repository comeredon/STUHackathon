Write-Host "Testing API..."
$uri = "http://localhost:3000/api/chat/demo"
$body = '{"message":"What are the top 5 accounts by revenue?"}'
try {
    $response = Invoke-WebRequest -Uri $uri -Method Post -ContentType "application/json" -Body $body -TimeoutSec 180
    Write-Host "Status: $($response.StatusCode)"
    Write-Host $response.Content
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
