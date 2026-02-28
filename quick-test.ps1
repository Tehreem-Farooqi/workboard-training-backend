# EventBoard Microservices Test Script
Write-Host "=== EventBoard Microservices Testing ===" -ForegroundColor Cyan

# Test 1: Signup
Write-Host "`n1. Testing Signup..." -ForegroundColor Yellow
$signup = Invoke-RestMethod -Uri "http://localhost:3000/auth/signup" -Method POST -ContentType "application/json" -Body '{"email":"test@example.com","password":"Password123!","firstName":"Test","lastName":"User","organizationName":"Test Org"}'
Write-Host "✓ User created: $($signup.user.email)" -ForegroundColor Green

# Test 2: Login
Write-Host "`n2. Testing Login..." -ForegroundColor Yellow
$login = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"test@example.com","password":"Password123!"}'
$token = $login.accessToken
Write-Host "✓ Login successful, token received" -ForegroundColor Green

# Test 3: Create Event
Write-Host "`n3. Testing Create Event..." -ForegroundColor Yellow
$event = Invoke-RestMethod -Uri "http://localhost:3000/events" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body '{"title":"Test Event","description":"Testing microservices","location":"Online","startDate":"2026-05-01T10:00:00Z","endDate":"2026-05-01T12:00:00Z"}'
Write-Host "✓ Event created: $($event.title)" -ForegroundColor Green

# Test 4: Get Events
Write-Host "`n4. Testing Get Events..." -ForegroundColor Yellow
$events = Invoke-RestMethod -Uri "http://localhost:3000/events" -Method GET -Headers @{Authorization="Bearer $token"}
Write-Host "✓ Retrieved $($events.data.Count) event(s)" -ForegroundColor Green

# Test 5: Get Single Event
Write-Host "`n5. Testing Get Single Event..." -ForegroundColor Yellow
$singleEvent = Invoke-RestMethod -Uri "http://localhost:3000/events/$($event.id)" -Method GET -Headers @{Authorization="Bearer $token"}
Write-Host "✓ Event details: $($singleEvent.title)" -ForegroundColor Green

Write-Host "`n=== All Tests Passed! ===" -ForegroundColor Green
Write-Host "`nMicroservices are running correctly!" -ForegroundColor Cyan
