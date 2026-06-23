#!/bin/bash
# Run this AFTER assessment.neogogy.ai resolves to this server's Elastic IP.
# It obtains a Let's Encrypt certificate and switches nginx to HTTPS with an
# automatic http -> https redirect. Auto-renewal is handled by the certbot timer.
set -eux
sudo certbot --nginx -d assessment.neogogy.ai \
  --non-interactive --agree-tos -m push.ro@gmail.com --redirect
sudo systemctl status certbot-renew.timer --no-pager || sudo systemctl list-timers | grep -i certbot || true
echo "SSL configured. Visit https://assessment.neogogy.ai"
