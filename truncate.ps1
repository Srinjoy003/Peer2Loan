$content = Get-Content "c:\Users\srinj\SSD\peer2loan1\frontend\src\App.tsx" -Raw
$lines = $content -split "`r?`n"
$truncated = $lines[0..666] -join "`n"
Set-Content "c:\Users\srinj\SSD\peer2loan1\frontend\src\App.tsx" -Value $truncated -NoNewline
