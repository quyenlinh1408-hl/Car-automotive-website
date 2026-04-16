# Use official Node.js runtime as a parent image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=3000

# Build args for environment variables
ARG ADMIN_SECRET_KEY="change-in-production"
ARG GOOGLE_TRANSLATE_API_KEY=""
ARG OPENAI_API_KEY=""
ARG GEMINI_API_KEY=""

# Set environment from build args
ENV ADMIN_SECRET_KEY=${ADMIN_SECRET_KEY}
ENV GOOGLE_TRANSLATE_API_KEY=${GOOGLE_TRANSLATE_API_KEY}
ENV OPENAI_API_KEY=${OPENAI_API_KEY}
ENV GEMINI_API_KEY=${GEMINI_API_KEY}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run the application
CMD ["node", "server.js"]
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
