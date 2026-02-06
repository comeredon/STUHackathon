Add-Type -AssemblyName System.Net.Http

$token = az account get-access-token --resource "https://ai.azure.com" --query "accessToken" -o tsv
$filePath = "C:\Users\comeredon\Downloads\TESTING FILE.xlsx"
$uri = "https://admin-5064-resource.services.ai.azure.com/api/projects/admin-5064/files?api-version=2025-05-01"

$httpClient = New-Object System.Net.Http.HttpClient
$httpClient.DefaultRequestHeaders.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", $token)

$content = New-Object System.Net.Http.MultipartFormDataContent

# Add purpose field
$purposeContent = New-Object System.Net.Http.StringContent("assistants")
$content.Add($purposeContent, "purpose")

# Add file - read as proper byte array
$fileStream = [System.IO.File]::OpenRead($filePath)
$fileName = [System.IO.Path]::GetFileName($filePath)
$streamContent = New-Object System.Net.Http.StreamContent($fileStream)
$streamContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
$content.Add($streamContent, "file", $fileName)

# Send request
$response = $httpClient.PostAsync($uri, $content).Result
$responseContent = $response.Content.ReadAsStringAsync().Result
Write-Host "Status: $($response.StatusCode)"
Write-Host $responseContent

$fileStream.Dispose()
$httpClient.Dispose()
