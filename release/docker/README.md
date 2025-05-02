# URL Shortener Docker Deployment

This directory contains Docker Compose configuration for deploying the URL Shortener application. The application consists of three services: MongoDB database, Node.js backend, and React frontend.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10.0 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.10.0 or higher)

## Quick Start

### 1. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment variables as needed
nano .env
```

Key environment variables to configure:
- `MONGO_INITDB_ROOT_USERNAME` and `MONGO_INITDB_ROOT_PASSWORD`: MongoDB credentials
- `BACKEND_PUBLIC_URL`: Public URL where the backend will be accessible (e.g., http://localhost:5000)

### 2. Deploy the Application

```bash
# Start all services in detached mode
docker compose up -d

# Check the status of the containers
docker compose ps
```

### 3. Access the Application

- Frontend: [http://localhost:4173](http://localhost:4173)
- Backend API: [http://localhost:5000](http://localhost:5000)

## Service Details

The deployment consists of three services:

1. **mongo**: MongoDB database
   - Port: 27017 (internal)
   - Volumes: `mongodb_data` and `mongodb_config` for persistence

2. **server**: Node.js backend
   - Port: 5000 (exposed)
   - Depends on: mongo
   - Health check endpoint: http://localhost:5000/health

3. **client**: React frontend
   - Port: 4173 (exposed)
   - Depends on: server
   - Configured to connect to the backend using the `BACKEND_PUBLIC_URL` environment variable

## Common Commands

```bash
# Start the services in the background
docker compose up -d

# View logs from all services
docker compose logs

# View logs from a specific service
docker compose logs server

# Follow logs in real-time
docker compose logs -f

# Stop all services
docker compose stop

# Stop and remove containers, networks, and volumes
docker compose down

# Stop and remove containers, networks, volumes, and images
docker compose down --rmi local
```

## Data Persistence

MongoDB data is persisted using named volumes:
- `mongodb_data`: Stores the database files
- `mongodb_config`: Stores the MongoDB configuration

These volumes persist even when containers are removed using `docker compose down`. To completely remove the volumes and all data:

```bash
docker compose down -v
```

## Rebuilding Images

If you've made changes to the application code and need to rebuild the images:

```bash
# Rebuild a specific service
docker compose build server

# Rebuild all services
docker compose build

# Rebuild and start all services
docker compose up -d --build
```

## Troubleshooting

### Checking container status
```bash
docker compose ps
```

### Checking container logs
```bash
docker compose logs -f
```

### Inspecting MongoDB data
```bash
# Connect to MongoDB container
docker compose exec mongo mongosh --username $MONGO_INITDB_ROOT_USERNAME --password $MONGO_INITDB_ROOT_PASSWORD

# Inside the MongoDB shell
use urlshortener
db.urls.find()
```

### Checking container health
```bash
docker compose exec server wget -q -O - http://localhost:5000/health
docker compose exec client wget -q -O - http://localhost:4173/
```

## Security Considerations

- Default MongoDB credentials in the `.env.example` file are for demonstration only. Always change them in your `.env` file.
- All containers run with read-only filesystems where possible, with temporary storage mounted as needed.
- All containers run as non-root users.
- Container resource limits are implemented to prevent resource exhaustion.

## Performance Tuning

The Docker Compose file includes resource constraints for each service. Adjust these values in the `docker-compose.yml` file based on your environment:

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'   # Maximum CPU allocation
      memory: 1G    # Maximum memory allocation
    reservations:
      cpus: '0.5'   # Guaranteed CPU allocation
      memory: 512M  # Guaranteed memory allocation
```