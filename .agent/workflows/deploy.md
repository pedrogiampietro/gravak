---
description: Como fazer deploy do projeto
---

# 🚀 Deploy do Projeto

Guia para fazer deploy do Tibia Browser Engine.

---

## Pré-requisitos

- Node.js 18+
- PostgreSQL
- Conta no Railway/Render/Fly.io (ou VPS)

---

## Opção 1: Railway (Recomendado)

### 1. Configurar Banco de Dados

1. Crie um projeto no [Railway](https://railway.app)
2. Adicione um PostgreSQL
3. Copie a `DATABASE_URL`

### 2. Configurar Variáveis de Ambiente

No Railway, adicione:

```
DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=7172
```

### 3. Configurar o Projeto

Certifique-se que o `package.json` tem:

```json
{
    "scripts": {
        "start": "node engine.js"
    }
}
```

### 4. Deploy

```bash
# Via CLI
railway login
railway init
railway up

# Ou conecte seu repositório GitHub no painel
```

---

## Opção 2: VPS (DigitalOcean, Vultr, etc.)

### 1. Instalar Dependências

```bash
# Conecte via SSH
ssh root@seu-ip

# Instale Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instale PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Instale PM2 (gerenciador de processos)
npm install -g pm2
```

### 2. Configurar PostgreSQL

```bash
sudo -u postgres psql

CREATE DATABASE tibia;
CREATE USER tibia WITH PASSWORD 'sua-senha';
GRANT ALL PRIVILEGES ON DATABASE tibia TO tibia;
\q
```

### 3. Configurar Projeto

```bash
# Clone o projeto
git clone https://github.com/seu-usuario/tibia-browser-engine.git
cd tibia-browser-engine

# Instale dependências
npm install

# Configure .env
cp .env.example .env
nano .env
# Adicione: DATABASE_URL=postgresql://tibia:sua-senha@localhost:5432/tibia
```

### 4. Iniciar com PM2

```bash
# Inicie os servidores
pm2 start engine.js --name "game-server"
pm2 start login.js --name "login-server"

# Salve a configuração
pm2 save
pm2 startup
```

### 5. Configurar Nginx (Proxy Reverso)

```bash
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/tibia
```

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Cliente estático
    location / {
        root /path/to/tibia-browser-engine/client;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # WebSocket do jogo
    location /game {
        proxy_pass http://localhost:7172;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Login server
    location /login {
        proxy_pass http://localhost:7171;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tibia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Opção 3: Docker

### 1. Build

```bash
docker-compose build
```

### 2. Run

```bash
docker-compose up -d
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: tibia
      POSTGRES_USER: tibia
      POSTGRES_PASSWORD: secret
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  game:
    build: .
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://tibia:secret@db:5432/tibia
      PORT: 7172
    ports:
      - "7172:7172"

  login:
    build: .
    command: node login.js
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://tibia:secret@db:5432/tibia
      PORT: 7171
    ports:
      - "7171:7171"

  client:
    image: python:3.11
    command: python -m http.server 8080
    working_dir: /app/client
    volumes:
      - ./client:/app/client
    ports:
      - "8080:8080"

volumes:
  postgres_data:
```

---

## Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL do PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `NODE_ENV` | Ambiente | `production` |
| `PORT` | Porta do game server | `7172` |
| `LOGIN_PORT` | Porta do login server | `7171` |

---

## Migrações do Banco

```bash
# Rodar migrações (Drizzle)
npm run db:migrate

# Ou manualmente
npx drizzle-kit push:pg
```

---

## Verificar Status

```bash
# PM2
pm2 status
pm2 logs

# Docker
docker-compose ps
docker-compose logs -f
```

---

## Troubleshooting

### Erro de Conexão WebSocket

Verifique se as portas 7171 e 7172 estão abertas no firewall:

```bash
sudo ufw allow 7171
sudo ufw allow 7172
```

### Erro de Banco de Dados

Verifique a conexão:

```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Health Check

Adicione endpoint de health check no `engine.js` para monitoramento:

```javascript
// Já existe no projeto
app.get('/health', (req, res) => res.status(200).send('OK'));
```
