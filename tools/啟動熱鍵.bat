@echo off
rem Start the ICD-10 HIS paste hotkey without installing AutoHotkey.
rem Put AutoHotkey64.exe (from AutoHotkey_2.0.26.zip) next to this file.
cd /d "%~dp0"

if not exist "his-paste.ahk" (
  echo [ERROR] his-paste.ahk not found in this folder.
  pause
  exit /b 1
)

if exist "AutoHotkey64.exe" (
  start "" "AutoHotkey64.exe" "his-paste.ahk"
  exit /b 0
)

rem Fall back to an installed AutoHotkey v2, if there is one.
set "AHK=%LOCALAPPDATA%\Programs\AutoHotkey\v2\AutoHotkey64.exe"
if exist "%AHK%" (
  start "" "%AHK%" "his-paste.ahk"
  exit /b 0
)
set "AHK=%ProgramFiles%\AutoHotkey\v2\AutoHotkey64.exe"
if exist "%AHK%" (
  start "" "%AHK%" "his-paste.ahk"
  exit /b 0
)

echo [ERROR] AutoHotkey64.exe not found.
echo Unzip AutoHotkey_2.0.26.zip and copy AutoHotkey64.exe into this folder,
echo or install AutoHotkey_2.0.26_setup.exe first.
pause
exit /b 1
