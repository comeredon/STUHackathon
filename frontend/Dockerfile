# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code and .env.production
COPY . .

# Build arguments for Vite
ARG VITE_AZURE_CLIENT_ID
ARG VITE_AZURE_AUTHORITY
ARG VITE_REDIRECT_URI
ARG VITE_POST_LOGOUT_REDIRECT_URI
ARG VITE_FABRIC_AGENT_API_URL
ARG VITE_FUNCTIONS_API_URL

# Set environment variables from build args
ENV VITE_AZURE_CLIENT_ID=$VITE_AZURE_CLIENT_ID
ENV VITE_AZURE_AUTHORITY=$VITE_AZURE_AUTHORITY
ENV VITE_REDIRECT_URI=$VITE_REDIRECT_URI
ENV VITE_POST_LOGOUT_REDIRECT_URI=$VITE_POST_LOGOUT_REDIRECT_URI
ENV VITE_FABRIC_AGENT_API_URL=$VITE_FABRIC_AGENT_API_URL
ENV VITE_FUNCTIONS_API_URL=$VITE_FUNCTIONS_API_URL

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration (optional, for SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
