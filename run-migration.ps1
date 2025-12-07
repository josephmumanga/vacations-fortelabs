# Run Database Migration Script
# This script helps execute the SQL migration for magic link and password reset tokens

Write-Host "=== Running Database Migration ===" -ForegroundColor Cyan
Write-Host ""

$server = "vacations-sql-4819.database.windows.net"
$database = "vacations-db"
$username = "vacationsadmin"
$password = "Vacations2024!Secure"
$migrationFile = "azure-sql-migration-auth-tokens.sql"

Write-Host "Server: $server" -ForegroundColor Yellow
Write-Host "Database: $database" -ForegroundColor Yellow
Write-Host "Migration File: $migrationFile" -ForegroundColor Yellow
Write-Host ""

# Check if sqlcmd is available
$sqlcmdPath = Get-Command sqlcmd -ErrorAction SilentlyContinue

if ($sqlcmdPath) {
    Write-Host "✅ sqlcmd found. Running migration..." -ForegroundColor Green
    Write-Host ""
    
    $connectionString = "Server=$server;Database=$database;User Id=$username;Password=$password;Encrypt=True;TrustServerCertificate=False;"
    
    try {
        sqlcmd -S $server -d $database -U $username -P $password -i $migrationFile -e
        Write-Host ""
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    } catch {
        Write-Host ""
        Write-Host "❌ Migration failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Alternative: Use Azure Portal Query Editor:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://portal.azure.com" -ForegroundColor White
        Write-Host "2. Navigate to: vacations-sql-4819 > vacations-db > Query editor" -ForegroundColor White
        Write-Host "3. Copy and paste the contents of $migrationFile" -ForegroundColor White
        Write-Host "4. Click 'Run'" -ForegroundColor White
    }
} else {
    Write-Host "⚠️  sqlcmd not found. Please use Azure Portal Query Editor:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Steps:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://portal.azure.com" -ForegroundColor White
    Write-Host "2. Navigate to: SQL databases > vacations-db" -ForegroundColor White
    Write-Host "3. Click 'Query editor (preview)' in the left menu" -ForegroundColor White
    Write-Host "4. Sign in with SQL authentication:" -ForegroundColor White
    Write-Host "   - Server: $server" -ForegroundColor Gray
    Write-Host "   - Username: $username" -ForegroundColor Gray
    Write-Host "   - Password: $password" -ForegroundColor Gray
    Write-Host "5. Copy and paste the contents of: $migrationFile" -ForegroundColor White
    Write-Host "6. Click 'Run' to execute the migration" -ForegroundColor White
    Write-Host ""
    Write-Host "Or install sqlcmd:" -ForegroundColor Yellow
    Write-Host "   Download from: https://learn.microsoft.com/sql/tools/sqlcmd-utility" -ForegroundColor White
}

