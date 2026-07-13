# Run `just` to list recipes. Requires: just (https://github.com/casey/just) + bun.

set dotenv-load := false

# Show available recipes
default:
    @just --list

# Install dependencies
install:
    bun install

# --- Dev ---

# Run server + client together (concurrently)
dev:
    bun run dev

# Server only (tsx --watch)
dev-server:
    bun run dev:server

# Client only (vite)
dev-client:
    bun run dev:client

# --- Build / run ---

# Type-check and build (tsc && vite build)
build:
    bun run build

# Run the built server (after `just build`)
start:
    bun run start

# Preview the built client (vite preview)
preview:
    bun run preview

# --- Quality ---

# Type-check only, no emit
type:
    bunx tsc --noEmit

# Remove build output
clean:
    rm -rf dist
