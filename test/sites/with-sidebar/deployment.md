# Deployment

## Production Build

```bash
npm run build
```

## Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## Environment Variables

- `NODE_ENV` — Set to `production`
- `PORT` — Override the default port
- `LOG_LEVEL` — One of `debug`, `info`, `warn`, `error`
