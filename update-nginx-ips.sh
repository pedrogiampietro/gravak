#!/bin/bash
# Script para atualizar os IPs dos containers na configuração do Nginx
# Executar após docker compose up

# Obter IPs atuais
ASSETS_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' t-engine-assets)
LOGIN_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' t-engine-login)
GAME_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' t-engine-game)

echo "Assets: $ASSETS_IP"
echo "Login: $LOGIN_IP"
echo "Game: $GAME_IP"

# Atualizar configuração do nginx
sudo sed -i "s|proxy_pass http://[0-9.]*:8000|proxy_pass http://$ASSETS_IP:8000|g" /etc/nginx/sites-enabled/gravak
sudo sed -i "s|proxy_pass http://[0-9.]*:1337|proxy_pass http://$LOGIN_IP:1337|g" /etc/nginx/sites-enabled/gravak
sudo sed -i "s|proxy_pass http://[0-9.]*:2222|proxy_pass http://$GAME_IP:2222|g" /etc/nginx/sites-enabled/gravak

# Testar e recarregar nginx
sudo nginx -t && sudo systemctl reload nginx

echo "Nginx atualizado com sucesso!"
