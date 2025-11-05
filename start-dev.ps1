Write-Host "NAMASTE-SYNC Development Environment Starter" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

Write-Host "Checking if Docker is running..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not available"
    }
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker is not running or not installed." -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    Write-Host "Download Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Starting Supabase local environment..." -ForegroundColor Yellow
npx supabase start
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start Supabase. Please check the error message above." -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Starting MongoDB (if not already running)..." -ForegroundColor Yellow
try {
    Start-Service MongoDB -ErrorAction SilentlyContinue
    Write-Host "MongoDB service started or already running" -ForegroundColor Green
} catch {
    Write-Host "Note: MongoDB service not found. Make sure MongoDB is running on port 27017" -ForegroundColor Yellow
}

Write-Host "Starting NAMASTE-SYNC application..." -ForegroundColor Yellow
npm run dev:full

Write-Host ""
Write-Host "Development environment started successfully!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:3001" -ForegroundColor Cyan
pause