#!/bin/bash

test -e /etc/httpd/conf.d/virtual-host.conf || cat <<EOT | sudo tee /etc/httpd/conf.d/virtual-host.conf
<VirtualHost *:80>
  ServerName opkraambezoek.nl
  ServerAlias www.opkraambezoek.nl
</VirtualHost>
EOT

sudo certbot -n -d opkraambezoek.nl,www.opkraambezoek.nl --apache --agree-tos --email arnold@jasny.net

