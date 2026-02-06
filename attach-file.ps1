$token = az account get-access-token --resource "https://ai.azure.com" --query "accessToken" -o tsv
$body = '{"tool_resources":{"code_interpreter":{"file_ids":["assistant-Lvo94V9HST7KR8PLzkrrhc"]}}}'
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$uri = "https://admin-5064-resource.services.ai.azure.com/api/projects/admin-5064/assistants/asst_RhaG1J2y28ns7f11jsAJeqwd?api-version=2025-05-01"

$response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body
Write-Host ($response | ConvertTo-Json -Depth 5)
