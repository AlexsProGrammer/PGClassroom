This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Prerequisites

- **Docker** and **Docker Compose** (for Postgres and Piston)
- **Node.js** (>= 18)
- **pnpm** (`npm i -g pnpm`)

### Setup

1. **Clone the repository** and install dependencies:
   ```bash
   git clone <repo-url> && cd Pro-GrammerClassroom
   pnpm install
   ```

2. **Start infrastructure** (Postgres + Piston):
   ```bash
   docker compose up -d
   ```

3. **Install language runtimes** in Piston (first time only — persisted via Docker volume):
   ```bash
   curl -X POST http://localhost:2000/api/v2/packages \
     -H "Content-Type: application/json" \
     -d '{"language":"python","version":"3.12.0"}'

   curl -X POST http://localhost:2000/api/v2/packages \
     -H "Content-Type: application/json" \
     -d '{"language":"java","version":"15.0.2"}'
   ```

4. **Configure environment** — create `.env` in the project root:
   ```
   DATABASE_URL="postgresql://user:pass@localhost:5433/lms"
   PISTON_URL="http://localhost:2000"
   AUTH_SECRET="<generate-a-random-secret>"
   REDIS_URL="redis://localhost:6380"

   BOOTSTRAP_ADMIN_EMAIL="teacher@test.com"
   BOOTSTRAP_ADMIN_NAME="First Teacher"
   BOOTSTRAP_ADMIN_ROLE="TEACHER"
   BOOTSTRAP_ADMIN_PASSWORD_HASH="<bcrypt-hash>"
   ```

   Generate a bcrypt hash in the console:
   ```bash
   pnpm hash:password -- "Admin123!"
   ```

5. **Push the database schema**:
   ```bash
   pnpm prisma db push
   ```

6. **Create/update the first login account**:
   ```bash
   pnpm bootstrap:admin
   ```

7. **Start the dev server**:
   ```bash
   pnpm dev
   ```

8. **Verify**:
   - Admin dashboard: [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)
   - Student workspace: `http://localhost:3000/student/quest/<assignment-id>`
   - Piston runtimes: `curl http://localhost:2000/api/v2/runtimes`
