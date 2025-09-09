#!/bin/bash

test -e /etc/httpd/conf.d/virtual-host.conf || cat <<EOT | sudo tee /etc/httpd/conf.d/virtual-host.conf
<VirtualHost *:80>
  ServerName opkraambezoek.nl
  ServerAlias www.opkraambezoek.nl
</VirtualHost>
EOT

if command -v certbot >/dev/null 2>&1; then
  sudo certbot -n -d opkraambezoek.nl,www.opkraambezoek.nl --apache --redirect --agree-tos --email arnold@jasny.net
else
  echo "certbot not installed" >&2
fi

