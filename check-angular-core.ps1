$dep = (Get-Content package.json -Raw | ConvertFrom-Json).dependencies.'@angular/core'
if ($dep) { Write-Output "declared: $dep" } else { Write-Output "not declared" }
