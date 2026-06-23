#!/bin/bash
set -eux

APP=/opt/neogogy/app
mkdir -p "$APP"
tar -xzf /home/ec2-user/app.tar.gz -C "$APP"
cp /home/ec2-user/.env.production "$APP/.env.production"

cd "$APP"
npm ci --no-audit --no-fund
npm run build

# systemd service
sudo cp /home/ec2-user/neogogy.service /etc/systemd/system/neogogy.service
sudo touch /var/log/neogogy.log
sudo chown ec2-user:ec2-user /var/log/neogogy.log
sudo systemctl daemon-reload
sudo systemctl enable neogogy
sudo systemctl restart neogogy

# nginx
sudo cp /home/ec2-user/nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl restart nginx

sleep 3
echo "--- service status ---"
systemctl is-active neogogy || true
echo "--- local curl ---"
curl -s -o /dev/null -w "app:%{http_code}\n" http://127.0.0.1:3000/ || true
curl -s -o /dev/null -w "nginx:%{http_code}\n" http://127.0.0.1/ || true
