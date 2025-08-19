# MediPort Hub - Docker Setup Guide

This guide will help you run the MediPort Hub application entirely using Docker on any system.

## Prerequisites

Before you start, ensure you have the following installed on your system:

1. **Docker** - [Download and install Docker](https://docs.docker.com/get-docker/)
2. **Docker Compose** - Usually included with Docker Desktop
3. **Git** - [Download and install Git](https://git-scm.com/downloads)

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd mediport-hub
```

### 2. Environment Setup

The project includes a `.env` file with the necessary configuration. If you need to customize any settings, you can modify the `.env` file:

```bash
# Example .env configuration (already included)
DATABASE_URL=postgresql://edith_user:edith_password@localhost:5432/edith_medical
NODE_ENV=development
JWT_SECRET=your-jwt-secret
# ... other environment variables
```

### 3. Run the Application

```bash
# Start the entire application (database + web app)
docker-compose up -d --build
```

This single command will:
- Build the Next.js application image
- Start a PostgreSQL database container
- Run database migrations
- Start the web application
- Make the app available at http://localhost:3000

### 4. Verify the Setup

Check that all containers are running:

```bash
docker-compose ps
```

You should see two containers:
- `edith-postgres` (PostgreSQL database)
- `edith-app` (Next.js application)

### 5. Access the Application

Open your web browser and navigate to:
**http://localhost:3000**

## Application Features

The MediPort Hub includes:

- **Patient Registration & Login**
- **Doctor Registration & Login** 
- **Medical Records Management**
- **Consent Management System** (GDPR-compliant)
- **Appointment Scheduling**
- **Role-based Access Control**
- **Encrypted PII Data**

## Testing the Consent Management System

1. Register as a patient at: http://localhost:3000/register/patient
2. Login with your patient credentials
3. Navigate to the Patient Dashboard
4. Click on the **"Privacy & Consent"** tab
5. Test features like:
   - View consent history
   - Withdraw marketing consent
   - Manage all consents
   - View consent templates

## Docker Commands Reference

### Basic Operations

```bash
# Start all services
docker-compose up -d

# Start with rebuild (if you made code changes)
docker-compose up -d --build

# Stop all services
docker-compose down

# Stop and remove all data (fresh start)start
docker-compose down -v

# Restart services
docker-compose restart
```

### Monitoring

```bash
# View all container status
docker-compose ps

# View application logs
docker-compose logs -f app

# View database logs
docker-compose logs -f postgres

# View logs for all services
docker-compose logs -f
```

### Database Management

```bash
# Access the database directly
docker-compose exec postgres psql -U edith_user -d edith_medical

# Run database migrations manually (if needed)
docker-compose exec app npx prisma migrate deploy

# View database status
docker-compose exec postgres pg_isready -U edith_user
```

## Troubleshooting

### Container Won't Start

1. **Check Docker is running:**
   ```bash
   docker --version
   docker-compose --version
   ```

2. **Check for port conflicts:**
   ```bash
   # Make sure ports 3000 and 5432 are available
   lsof -i :3000
   lsof -i :5432
   ```

3. **Clean Docker cache:**
   ```bash
   docker system prune -f
   docker-compose up -d --build
   ```

### Database Connection Issues

1. **Wait for database to be ready:**
   ```bash
   # Check database health
   docker-compose logs postgres
   ```

2. **Reset database:**
   ```bash
   docker-compose down -v
   docker-compose up -d --build
   ```

### Application Errors

1. **Check application logs:**
   ```bash
   docker-compose logs -f app
   ```

2. **Rebuild the application:**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

### Permission Issues

If you encounter permission errors:

```bash
# On Linux/macOS, you might need to fix file permissions
sudo chown -R $USER:$USER .
```

## Development Workflow

### Making Code Changes

1. Stop the containers:
   ```bash
   docker-compose down
   ```

2. Make your code changes

3. Rebuild and start:
   ```bash
   docker-compose up -d --build
   ```

### Database Schema Changes

1. Update the Prisma schema in `prisma/schema.prisma`

2. Generate a new migration:
   ```bash
   docker-compose exec app npx prisma migrate dev --name your-migration-name
   ```

3. Restart the application:
   ```bash
   docker-compose restart app
   ```

## Port Configuration

The application uses these ports:
- **3000**: Web application (Next.js)
- **5432**: PostgreSQL database

If these ports conflict with other services on your system, you can modify them in `docker-compose.yml`:

```yaml
services:
  app:
    ports:
      - "3001:3000"  # Change 3000 to 3001
  postgres:
    ports:
      - "5433:5432"  # Change 5432 to 5433
```

Don't forget to update the `DATABASE_URL` in `.env` if you change the database port.

## Architecture

The Docker setup includes:

- **Multi-stage Docker build** for optimized production images
- **PostgreSQL 15** database with health checks
- **Next.js 15** application with standalone output
- **Automated database migrations** on startup
- **Volume persistence** for database data
- **Network isolation** between containers

## Security Considerations

- Database credentials are configured for development use
- JWT secrets should be changed for production
- The application includes GDPR-compliant consent management
- PII data is encrypted at rest
- All API endpoints include proper authentication

## Support

If you encounter any issues:

1. Check the logs: `docker-compose logs -f`
2. Ensure all prerequisites are installed
3. Try a clean rebuild: `docker-compose down -v && docker-compose up -d --build`
4. Check the troubleshooting section above

## Production Deployment

For production deployment:

1. Update environment variables in `.env`
2. Change default passwords and secrets
3. Use proper SSL certificates
4. Configure reverse proxy (nginx/Apache)
5. Set up proper backup strategies for the database
6. Use Docker Swarm or Kubernetes for orchestration

---

**Happy coding! 🚀**

The MediPort Hub application should now be running successfully on your system using Docker.