FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Use the exact package-manager version declared in package.json.
# This preserves lockfile integrity instead of installing the latest pnpm globally.
RUN npm install -g pnpm@9.12.0 && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the app
RUN pnpm run build

# Expose port
EXPOSE 3000

# Start the server
CMD ["pnpm", "start"]
