FROM node:20-alpine AS base
WORKDIR /app

# By copying only the package.json and package-lock.json here, we ensure that the following `-deps` steps are independent of the source code.
# Therefore, the `-deps` steps will be skipped if only the source code changes.
COPY package.json package-lock.json ./

FROM base AS prod-deps
RUN npm install --omit=dev

FROM base AS build-deps
RUN npm install

FROM build-deps AS build
COPY . .
RUN npm run build

FROM base AS runtime
# Create a non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

# Create data directory for SQLite database
RUN mkdir -p /app/data && \
    chown -R nodejs:nodejs /app/data

# Copy dependencies
COPY --from=prod-deps /app/node_modules ./node_modules 
# Copy the built output
COPY --from=build /app/dist ./dist 

# Set proper ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Bind to all interfaces
ENV HOST=0.0.0.0
# Port to listen on
ENV PORT=4321
# Just convention, not required
EXPOSE 4321

# Start the app
CMD node ./dist/server/entry.mjs