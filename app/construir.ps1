# Parlia — build do app Android (Capacitor). Correr no PowerShell, na pasta parlia-app:  .\construir.ps1
# 1) Antes, se for para a Play Store, aumentar versionCode (e versionName) em versao-app.json.
# 2) Copia o site (eliana-voz.html e companhia) para www/, sincroniza os plugins e compila o .aab e o .apk assinados.
# A senha da chave vem da cópia cifrada pelo Windows (parlia-chaves\senha-keystore.dpapi), só para este processo.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Remove-Item Env:NoDefaultCurrentDirectoryInExePath -ErrorAction SilentlyContinue
$env:JAVA_HOME = 'C:\Users\HP840G~1\.bubblewrap\jdk\jdk-21.0.13.1+2'
$env:ANDROID_HOME = 'C:\Users\HP840G~1\.bubblewrap\android_sdk'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
Set-Content android\local.properties 'sdk.dir=C\:\\Users\\HP840G~1\\.bubblewrap\\android_sdk' -Encoding ascii
node copiar-site.js
npx cap sync android | Out-Null
$sec = Get-Content 'C:\Users\HP 840 G1\parlia-chaves\senha-keystore.dpapi' | ConvertTo-SecureString
$env:PARLIA_KS_PASS = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)); Remove-Variable sec
$env:PARLIA_KEYSTORE = 'C:\Users\HP840G~1\parlia-chaves\parlia-upload.keystore'
try {
  Push-Location android
  & .\gradlew.bat bundleRelease assembleRelease --no-daemon -q *> ..\build.log
  if ($LASTEXITCODE -ne 0) { throw "Falhou o build (ver build.log)" }
} finally { Pop-Location; Remove-Item Env:PARLIA_KS_PASS, Env:PARLIA_KEYSTORE -ErrorAction SilentlyContinue }
$v = Get-Content versao-app.json -Raw | ConvertFrom-Json
$site = (Select-String -Path www\index.html -Pattern 'const APP_VERSION = (\d+)').Matches[0].Groups[1].Value
$nome = "Parlia-$($v.versionName)-codigo$($v.versionCode)-site-v$site"
New-Item -ItemType Directory -Force saida | Out-Null
Copy-Item android\app\build\outputs\bundle\release\app-release.aab "saida\$nome.aab" -Force
Copy-Item android\app\build\outputs\apk\release\app-release.apk "saida\$nome-teste.apk" -Force
"Pronto: app $($v.versionName) (código $($v.versionCode)), feito do site v$site"
"  Play Store: saida\$nome.aab"
"  Teste no celular: saida\$nome-teste.apk"
