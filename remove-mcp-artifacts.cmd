@echo off
REM Wrapper to call the PowerShell script from CMD / explorer double-click
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0remove-mcp-artifacts.ps1" %*
exit /b %errorlevel%
