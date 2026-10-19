FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY src ./src
USER node
ENV NODE_ENV=production
CMD ["node", "src/worker.js"]
