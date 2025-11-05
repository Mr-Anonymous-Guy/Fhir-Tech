@echo off
echo NAMASTE-SYNC Development Environment Starter
echo ==========================================

echo Checking if Docker is running...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running or not installed.
    echo Please start Docker Desktop and try again.
    echo Download Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo Starting Supabase local environment...
npx supabase start
if %errorlevel% neq 0 (
    echo ERROR: Failed to start Supabase. Please check the error message above.
    pause
    exit /b 1
)

echo Starting MongoDB (if not already running)...
net start MongoDB >nul 2>&1
if %errorlevel% neq 0 (
    echo Note: MongoDB service not found or already running.
    echo Make sure MongoDB is running on port 27017
)

echo Starting NAMASTE-SYNC application...
npm run dev:full

echo.
echo Development environment started successfully!
echo Frontend: http://localhost:8080
echo Backend API: http://localhost:3001
pause