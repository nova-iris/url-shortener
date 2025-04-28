# Docker Setup for URL Shortener

This directory contains Docker Compose configuration for running the URL Shortener application.

## Quick Start

1. Make sure you have Docker and Docker Compose installed on your system
2. Navigate to the parent directory (`release`)
3. Run the application:

```bash
cd docker
docker compose up -d
```

The application will be available at:
- Frontend: http://localhost:4173
- Backend API: http://localhost:5000

## Configuration

Configuration is managed through environment variables defined in the `.env` file located in the parent (`release`) directory. 

A sample configuration file with default values is provided as `default.env`. Copy this file to `../.env` if you don't already have an environment file:

```bash
cp default.env ../.env
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Node.js environment | production |
| PORT | Server port | 5000 |
| MONGO_INITDB_ROOT_USERNAME | MongoDB username | admin |
| MONGO_INITDB_ROOT_PASSWORD | MongoDB password | IcKeW8b5wxMixE7ByYMkkJ1389/+he4cL7UHi9iEoZc= |
| MONGODB_HOST | MongoDB host | mongo |
| MONGODB_PORT | MongoDB port | 27017 |
| MONGODB_DATABASE | MongoDB database name | urlshortener |
| BASEURI | Base URL for shortened links | http://localhost:5000 |
| CLIENT_URL | Client URL | http://localhost:4173 |

## Data Persistence

MongoDB data is stored in Docker volumes to ensure persistence across restarts:
- `mongodb_data`: Stores the actual database data
- `mongodb_config`: Stores MongoDB configuration

## Useful Commands

### Start the application
```bash
docker compose up -d
```

### Stop the application
```bash
docker compose down
```

### View logs
```bash
docker compose logs -f
```

### Rebuild containers after code changes
```bash
docker compose build
docker compose up -d
```

### Completely reset (including volumes)
```bash
docker compose down -v
```