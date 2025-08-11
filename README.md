# Edith Project

A Next.js-based medical records management system with comprehensive security features.

## Quick Start

### Development (Recommended)

1. **Start the database:**

   ```bash
   npm run db:up
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   # Update DATABASE_URL to: postgresql://edith_user:edith_password@localhost:5432/edith_medical
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Set up the database (creates tables + sample data):**

   ```bash
   npm run db:setup
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

### Docker (Optional)

For production-like testing or team consistency:

```bash
# Build and run everything
docker-compose up --build

# Or just the database
docker-compose up postgres
```

## Database Management

- `npm run db:up` - Start PostgreSQL container
- `npm run db:down` - Stop containers
- `npm run db:reset` - Reset database (removes all data)
- `npm run db:logs` - View database logs
- `npm run db:gui` - Start database GUI tools (pgAdmin + Adminer)
- `npm run db:studio` - Open Prisma Studio (recommended for development)

## Viewing Your Database Data

### **Prisma Studio (Recommended)**

```bash
npm run db:studio
```

Opens at `http://localhost:5555` - Beautiful web interface for your data

### **Database GUI Tools**

```bash
npm run db:gui
```

- **pgAdmin**: `http://localhost:5050` (admin@edith.com / admin123)
  - Advanced PostgreSQL management
  - SQL queries, table structure, data browsing
- **Adminer**: `http://localhost:8080`
  - Simple, lightweight database interface
  - Quick data viewing and editing

### **Connection Details**

- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `edith_medical`
- **Username**: `edith_user`
- **Password**: `edith_password`

## Why This Approach?

- **Next.js development stays simple** - No Docker complexity for frontend/backend development
- **Database consistency** - All developers use the same PostgreSQL version
- **Easy testing** - Reset database with one command
- **Production ready** - Docker setup available when needed

## Environment Variables

Create a `.env.local` file:

```env
DATABASE_URL="postgresql://edith_user:edith_password@localhost:5432/edith_medical"
JWT_SECRET="your-secret-key"
ENCRYPTION_KEY="your-32-character-encryption-key"
```

## Testing

```bash
# Run all tests
npm test

# Run security tests
npm run test:security

# Watch mode
npm run test:watch
```
