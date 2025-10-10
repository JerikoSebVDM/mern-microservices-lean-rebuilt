FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm i --omit=dev
COPY . .
CMD ["npm", "start"]
