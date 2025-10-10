FROM node:20-alpine

# Install curl for health checks / debugging
RUN apk add --no-cache curl

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install only production deps
RUN npm ci --omit=dev || npm i --omit=dev

# Copy source code
COPY . .

# 👇 Expose the port Prometheus (and Kubernetes) should reach
EXPOSE 8080

# Start the app
CMD ["npm", "start"]
