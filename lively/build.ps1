# requires: node, npm, yarn, python, zip

Write-Host "Building AudiOrbits..."
Set-Location ..
& yarn install
& yarn prod
Set-Location ./lively


if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "Running python property transformer..."
    & python transform.py
}
else {
    Write-Warning "Python is not installed. Skipping property transform..."
}


Write-Host "Copying extra files..."
Copy-Item ./public/* ../dist/production

Write-Host "Creating Zip-Archive..."
Compress-Archive -Force -Path ../dist/production/* -DestinationPath ./audiorbits_lively.zip
