FROM node:20-alpine

# WireGuard tools pra gerar chaves e ping pra health check
RUN apk add --no-cache wireguard-tools iputils-ping openssh-client

WORKDIR /app

COPY package.json .
RUN npm install --production

COPY src/ src/

EXPOSE 3000

CMD ["node", "src/server.js"]
