# Redeploy helper: rebuilds the source tarball, ships it, and rebuilds on the
# server. Run from the project root after editing code or copy (src/data/copy.ts).
#
#   powershell -ExecutionPolicy Bypass -File deploy\redeploy.ps1
#
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$key  = "C:\Users\lcfaj\OneDrive\Documents\Neogogy.Ai\keys\neogogy-fresh-20260625-180854.pem"
$ip   = "52.77.118.48"
$opts = @("-i", $key, "-o", "StrictHostKeyChecking=no", "-o", "UserKnownHostsFile=/dev/null")

Set-Location $root
tar -czf "deploy\app.tar.gz" --exclude=node_modules --exclude=.next --exclude=deploy/app.tar.gz `
  src public package.json package-lock.json next.config.mjs postcss.config.cjs tailwind.config.ts tsconfig.json next-env.d.ts .env.example
Write-Host "tarball built"

scp @opts "deploy\app.tar.gz" "ec2-user@${ip}:/home/ec2-user/app.tar.gz"
ssh @opts "ec2-user@$ip" "set -e; rm -rf /opt/neogogy/app/src /opt/neogogy/app/public; tar -xzf /home/ec2-user/app.tar.gz -C /opt/neogogy/app; cd /opt/neogogy/app; npm ci --no-audit --no-fund; npm run build; sudo systemctl restart neogogy; sleep 3; curl -s -o /dev/null -w 'app:%{http_code}\n' http://127.0.0.1:3000/"
Write-Host "redeploy complete"
