#!/bin/bash
set -eux

# 2GB swap so `next build` does not OOM on a t3.micro (1GB RAM).
if [ ! -f /swapfile ]; then
  dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

dnf update -y || true
dnf install -y nodejs npm nginx git tar gzip

systemctl enable nginx
systemctl start nginx

# Application directory owned by ec2-user for SSH-based deploys.
mkdir -p /opt/neogogy
chown -R ec2-user:ec2-user /opt/neogogy

touch /opt/neogogy/.bootstrap-done
