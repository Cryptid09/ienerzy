@echo off
setlocal enabledelayedexpansion

REM Ienerzy MVP Setup Script for Windows
REM This script will set up the database, environment, and install dependencies

echo ==========================================
echo     Ienerzy MVP Setup Script
echo ==========================================
echo.

echo 🚀 Starting Ienerzy MVP Setup...
echo.

REM Check if PostgreSQL is installed
echo [INFO] Checking PostgreSQL installation...
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL is not installed. Please install it first:
    echo    Download from: https://www.postgresql.org/download/windows/
    echo    Or use: https://chocolatey.org/packages/postgresql
    pause
    exit /b 1
) else (
    echo [SUCCESS] PostgreSQL is installed
    for /f "tokens=3" %%i in ('psql --version') do set PSQL_VERSION=%%i
    echo    Version: !PSQL_VERSION!
)
echo.

REM Check if Node.js is installed
echo [INFO] Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it first:
    echo    Visit: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo [SUCCESS] Node.js is installed
    for /f %%i in ('node --version') do set NODE_VERSION=%%i
    echo    Version: !NODE_VERSION!
)
echo.

REM Check if npm is installed
echo [INFO] Checking npm installation...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install it first:
    echo    Visit: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo [SUCCESS] npm is installed
    for /f %%i in ('npm --version') do set NPM_VERSION=%%i
    echo    Version: !NPM_VERSION!
)
echo.

REM Setup PostgreSQL database
echo [INFO] Setting up PostgreSQL database...
echo Checking if database 'ienerzy_mvp' exists...

REM Check if database exists
psql -U postgres -lqt | findstr "ienerzy_mvp" >nul 2>nul
if %errorlevel% equ 0 (
    echo [WARNING] Database 'ienerzy_mvp' already exists
    set /p "RECREATE=Do you want to drop and recreate it? (y/N): "
    if /i "!RECREATE!"=="y" (
        echo [INFO] Dropping existing database...
        dropdb -U postgres ienerzy_mvp
    ) else (
        echo [INFO] Using existing database
        goto :install_deps
    )
)

REM Create database
echo [INFO] Creating database 'ienerzy_mvp'...
createdb -U postgres ienerzy_mvp
if %errorlevel% equ 0 (
    echo [SUCCESS] Database 'ienerzy_mvp' created successfully
) else (
    echo [ERROR] Failed to create database. Please check PostgreSQL permissions.
    pause
    exit /b 1
)
echo.

:install_deps
REM Install dependencies
echo [INFO] Installing project dependencies...



REM Install server dependencies
echo [INFO] Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install server dependencies
    pause
    exit /b 1
)
cd ..

REM Install client dependencies
echo [INFO] Installing client dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install client dependencies
    pause
    exit /b 1
)
cd ..

echo [SUCCESS] All dependencies installed successfully
echo.

REM Setup environment file
echo [INFO] Setting up environment configuration...
if exist "server\.env" (
    echo [WARNING] Environment file already exists
    set /p "OVERWRITE=Do you want to overwrite it? (y/N): "
    if /i "!OVERWRITE!"=="y" (
        copy "server\env.example" "server\.env" >nul
    ) else (
        echo [INFO] Keeping existing environment file
    )
) else (
    copy "server\env.example" "server\.env" >nul
    echo [SUCCESS] Environment file created
)

REM Get database password from user
echo.
set /p "DB_PASSWORD=Enter PostgreSQL password for user 'postgres': "

REM Update environment file with actual password
powershell -Command "(Get-Content 'server\.env') -replace 'DB_PASSWORD=password', 'DB_PASSWORD=%DB_PASSWORD%' | Set-Content 'server\.env'"
echo [SUCCESS] Environment file configured
echo.

REM Setup database schema
echo [INFO] Setting up database schema...
cd server
call npm run setup-db
if %errorlevel% neq 0 (
    echo [ERROR] Failed to setup database schema
    pause
    exit /b 1
)
cd ..

echo [SUCCESS] Database schema setup completed
echo.

REM Test database connection
echo [INFO] Testing database connection...
cd server
node -e "require('dotenv').config(); const { Pool } = require('pg'); const pool = new Pool({ user: process.env.DB_USER || 'postgres', host: process.env.DB_HOST || 'localhost', database: process.env.DB_NAME || 'ienerzy_mvp', password: process.env.DB_PASSWORD || 'password', port: process.env.DB_PORT || 5432, }); pool.query('SELECT NOW()', (err, res) => { if (err) { console.error('❌ Database connection failed:', err.message); process.exit(1); } else { console.log('✅ Database connection successful'); console.log('   Current time:', res.rows[0].now); pool.end(); } });"
if %errorlevel% neq 0 (
    echo [ERROR] Database connection test failed
    pause
    exit /b 1
)
cd ..

echo.
echo [SUCCESS] Setup completed successfully! 🎉
echo.
echo Next steps:
echo 1. Start the application: npm run dev
echo 2. Open http://localhost:3000 in your browser
echo 3. Login with:
echo    - Dealer: 8888888888
echo    - Admin: 9999999999
echo    (Check console for OTP codes)
echo.
echo Available commands:
echo   npm run dev          - Start both servers
echo   npm run server       - Start backend only
echo   npm run client       - Start frontend only
echo   npm run setup-db     - Reset database schema
echo.
pause 