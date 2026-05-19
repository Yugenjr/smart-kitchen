# Auth Service Documentation

## 1. Project Overview

### What is the Auth Service?

The Auth Service is an independent NestJS microservice responsible for user authentication, registration, and JWT-based access control in the Smart Kitchen ecosystem. It operates as a dedicated, deployable unit within the microservices architecture.

### Why Microservices Need Auth

In a microservices architecture, authentication cannot be embedded in every service. Instead:

- **Separation of Concerns**: Auth logic is isolated, allowing other services (Grocery, Recipe, Nutrition) to focus on domain logic.
- **Single Source of Truth**: All user credentials and tokens originate from one service, preventing inconsistencies.
- **Scalability**: The auth service can scale independently based on login/signup traffic.
- **Security**: Secrets and credential handling are centralized, reducing attack surface.
- **Reusability**: Other microservices consume Auth Service via JWT tokens without reimplementing auth logic.

### Responsibilities of Auth Service

1. **User Registration**: Accept signup requests, hash passwords, store user records in PostgreSQL.
2. **User Authentication**: Validate credentials (email/password) and issue JWT tokens.
3. **Token Validation**: Provide JWT verification mechanisms for other services.
4. **Protected Routes**: Enforce authentication guards on sensitive endpoints.
5. **User Profile Access**: Allow authenticated users to retrieve their own profile.

### Why Auth is Separated into Its Own Service

- **Scalability**: Can handle thousands of login requests independently.
- **Maintenance**: Changes to auth logic don't require redeploying all services.
- **Testability**: Isolated service makes unit and integration testing simpler.
- **Security Compliance**: Centralized password hashing and token generation enforce consistent security policies.

---

## 2. Tech Stack

### NestJS (`^11.0.1`)

**Why it exists**: NestJS is a progressive Node.js framework for building scalable server-side applications.

**Role**: Provides the foundation for HTTP request handling, dependency injection, and modular architecture.

**Where it's used**: 
- Core framework for all controllers, services, and modules
- HTTP server bootstrap in `main.ts`
- Request/response lifecycle management

**Why chosen**: Enterprise-grade framework with built-in support for microservices, guards, pipes, decorators, and middleware. TypeScript-first design ensures type safety across the codebase.

---

### TypeORM (`^0.3.30`)

**Why it exists**: TypeORM is an Object-Relational Mapping (ORM) library that bridges JavaScript objects and database tables.

**Role**: Manages database schema, entity relationships, and query execution without raw SQL.

**Where it's used**:
- Entity definitions in `src/auth/entities/user.entity.ts`
- Repository pattern for database operations in `AuthService`
- Automatic schema generation with `synchronize: true`

**Why chosen**: 
- Provides type-safe database access through TypeScript
- Supports PostgreSQL natively
- Auto-discovery of entities eliminates manual schema setup
- Relationships and migrations work seamlessly in NestJS

---

### PostgreSQL (via `pg` package v`^8.21.0`)

**Why it exists**: PostgreSQL is a robust, production-grade relational database.

**Role**: Persistent storage for user credentials, authentication metadata, and audit trails.

**Where it's used**:
- Supabase-hosted PostgreSQL instance stores the `users` table
- TypeORM connects via `DATABASE_URL` environment variable

**Why chosen**:
- ACID compliance ensures credential integrity
- Mature ecosystem with strong security practices
- Supabase integration simplifies deployment without infrastructure management

---

### Supabase

**Why it exists**: Supabase provides managed PostgreSQL hosting with simplified authentication infrastructure.

**Role**: Database provider. Hosts the PostgreSQL instance and manages backups, SSL, networking.

**Where it's used**:
- `DATABASE_URL` points to Supabase's PostgreSQL endpoint
- SSL configuration in `app.module.ts` handles Supabase's certificate validation

**Why chosen**:
- Zero infrastructure management required
- Built-in SSL for secure connections
- Scalable, production-ready PostgreSQL without operational overhead

**Important**: We use Supabase ONLY as a database provider. We do NOT use Supabase Auth; authentication logic stays fully inside NestJS.

---

### JWT (`@nestjs/jwt` v`^11.0.2`)

**Why it exists**: JSON Web Tokens enable stateless authentication across microservices.

**Role**: Generates and validates access tokens that prove a user's identity.

**Where it's used**:
- Token generation in `AuthService.generateToken()`
- Token validation in `src/auth/strategies/jwt.strategy.ts`
- Bearer token extraction in requests

**Why chosen**:
- Stateless: No server-side session storage required (critical for microservices)
- Microservice-friendly: Other services can validate tokens without contacting Auth Service
- Claims-based: Payload includes `sub` (user ID) and `email` for authorization decisions

---

### Passport & Passport-JWT (`passport` v`^0.7.0`, `passport-jwt` v`^4.0.1`)

**Why it exists**: Passport is an authentication middleware framework; passport-jwt is the JWT strategy plugin.

**Role**: Handles bearer token extraction from HTTP headers and validates token signatures.

**Where it's used**:
- `src/auth/strategies/jwt.strategy.ts` implements Passport's JWT validation
- `src/auth/guards/jwt-auth.guard.ts` applies Passport strategy to route handlers

**Why chosen**:
- Industry-standard authentication middleware
- Extensible strategy pattern allows multiple auth methods (JWT, OAuth, local, etc.)
- Decouples token validation logic from business logic

---

### bcrypt (`^6.0.0`)

**Why it exists**: bcrypt is a password hashing library that converts raw passwords into irreversible hashes.

**Role**: Securely stores passwords so even database breaches don't expose plaintext credentials.

**Where it's used**:
- `AuthService.signup()` hashes the password before saving
- `AuthService.validateUser()` compares plaintext input against stored hash

**Why chosen**:
- Deliberately slow (configurable work factor) to prevent brute-force attacks
- Industry standard for password security
- Built-in salt generation prevents rainbow table attacks

**Security principle**: Passwords are NEVER stored raw. The hash is irreversible; even Auth Service cannot retrieve the original password.

---

### class-validator (`^0.15.1`)

**Why it exists**: Provides decorators for runtime schema validation.

**Role**: Validates incoming DTOs (signup/login requests) before they reach services.

**Where it's used**:
- `@IsEmail()`, `@MinLength()` decorators in `LoginDto` and `SignupDto`
- NestJS `ValidationPipe` (in `main.ts`) enforces these rules

**Why chosen**:
- Declarative validation prevents invalid data from reaching database layer
- Reduces repetitive null checks and type validation in code
- Provides consistent error responses to API clients

---

### @nestjs/config (`^4.0.4`)

**Why it exists**: Centralizes environment variable loading and management.

**Role**: Makes `DATABASE_URL`, `JWT_SECRET`, `PORT` accessible via `ConfigService`.

**Where it's used**:
- `ConfigModule.forRoot()` in `src/app.module.ts` loads `.env` file globally
- `JwtModule.registerAsync()` reads `JWT_SECRET` via `ConfigService`
- `JwtStrategy` constructor accesses `JWT_SECRET` via `ConfigService`

**Why chosen**:
- Prevents hardcoded secrets in source code
- Works seamlessly with NestJS dependency injection
- Supports environment-specific configurations (dev/prod)

---

### Swagger/OpenAPI (`@nestjs/swagger` v`^11.4.3`, `swagger-ui-express` v`^5.0.1`)

**Why it exists**: Swagger generates interactive API documentation from code decorators.

**Role**: Provides self-documenting API explorer and client code generation.

**Where it's used**:
- `@ApiTags()`, `@ApiOperation()`, `@ApiBody()`, `@ApiBearerAuth()` decorators throughout controllers
- `/api/docs` endpoint serves interactive Swagger UI

**Why chosen**:
- API-first development: Documentation derives from actual code, staying in sync
- Enables testing endpoints directly from browser without Postman
- Generates OpenAPI schema for SDK generation

---

## 3. Folder Structure Explanation

```
src/
│
├── auth/                           # Auth domain module
│   ├── dto/
│   │   ├── login.dto.ts            # Login request validation schema
│   │   └── signup.dto.ts           # Signup request validation schema
│   │
│   ├── entities/
│   │   └── user.entity.ts          # User database table blueprint
│   │
│   ├── guards/
│   │   └── jwt-auth.guard.ts       # Route protection decorator
│   │
│   ├── strategies/
│   │   └── jwt.strategy.ts         # Passport JWT validation logic
│   │
│   ├── auth.controller.ts          # HTTP endpoint handlers
│   ├── auth.service.ts             # Business logic (signup, login, validation)
│   └── auth.module.ts              # NestJS module wiring
│
├── common/                         # Shared utilities
│   ├── decorators/
│   │   └── current-user.decorator.ts # @CurrentUser() decorator for controllers
│   │
│   └── interfaces/
│       └── jwt-payload.interface.ts  # TypeScript type for JWT claims
│
├── config/                         # Configuration constants
│   └── jwt.config.ts               # JWT settings
│
├── app.module.ts                   # Root NestJS module
└── main.ts                         # Application bootstrap
```

### Purpose of Every Folder

**`auth/`** - Encapsulates all authentication logic. This is a NestJS **module**, meaning it's a cohesive, reusable unit that can be imported by other services or applications.

**`auth/dto/`** - **Data Transfer Objects** validate incoming HTTP requests. DTOs define the contract: what fields are required, their types, and validation rules (email format, password length, etc.).

**`auth/entities/`** - TypeORM **entities** are TypeScript classes decorated with `@Entity`. Each entity maps to a PostgreSQL table. The `User` entity defines columns (`id`, `email`, `password`, etc.) and how they persist to the database.

**`auth/guards/`** - NestJS **guards** intercept requests before they reach controllers. `JwtAuthGuard` prevents unauthenticated users from accessing protected routes.

**`auth/strategies/`** - Passport **strategies** are pluggable authentication algorithms. `JwtStrategy` tells Passport: "extract the token from the Authorization header, verify its signature using `JWT_SECRET`, and populate `request.user` with the decoded payload."

**`auth.controller.ts`** - Controllers receive HTTP requests and orchestrate responses. They:
1. Accept requests
2. Delegate to services
3. Return HTTP responses

Controllers should NEVER contain business logic (validation, hashing, database queries). That belongs in services.

**`auth.service.ts`** - Services contain business logic:
- User registration (checking duplicate emails, hashing passwords)
- Login (credential validation, token generation)
- User profile retrieval

Services are injectable into controllers via dependency injection.

**`auth.module.ts`** - A NestJS module is a container that groups related components. It:
- Declares controllers that handle routes
- Declares providers (services, strategies, guards)
- Imports dependencies (TypeORM, JWT, Passport)
- Exposes services to other modules

**`common/`** - Shared utilities used across the application. The `CurrentUser` decorator and `JwtPayload` interface are generic enough to be used by multiple modules.

**`config/`** - Constants and configuration that don't belong to any single domain. `jwt.config.ts` centralizes JWT settings.

**`app.module.ts`** - The root NestJS module. It imports all feature modules (AuthModule) and configures global infrastructure (ConfigModule, TypeORM, Swagger).

**`main.ts`** - Application entry point. Bootstraps NestJS, enables global pipes/decorators, and starts the HTTP server.

### Why Separation Matters

**Clean Architecture**: Each folder has a single responsibility. If you need to add a new authentication method (e.g., OAuth), you add files to `strategies/` without touching DTOs or entities.

**Scalability**: As the Auth Service grows, this structure scales. You can add more DTOs, entities, guards, and strategies without the module becoming chaotic.

**Testability**: Separation makes unit testing easier. Test `AuthService` in isolation by mocking `UserRepository`. Test `JwtAuthGuard` by mocking `JwtStrategy`.

**Modularity**: `AuthModule` can be imported by other services in the future, or by a different NestJS application, without tight coupling.

---

## 4. Request Flow Architecture

### Signup Request Flow

```
POST /auth/signup
↓
SignupDto Validation (ValidationPipe)
├─ @IsEmail() validates email format
├─ @MinLength(6) validates password strength
└─ @IsNotEmpty() validates name
↓
AuthController.signup() [thin handler]
↓
AuthService.signup() [business logic]
├─ Check if email already exists
│  └─ UserRepository.findOneBy({ email })
├─ Hash password with bcrypt (salt rounds: 10)
├─ Create user object
└─ Save to PostgreSQL
↓
TypeORM / PostgreSQL
├─ INSERT into users table
├─ Generate UUID for id
└─ Set createdAt, updatedAt timestamps
↓
AuthService.buildAuthResult()
├─ Generate JWT token via JwtService.sign()
│  └─ Payload: { sub: user.id, email: user.email }
├─ Remove password field (return safe user)
└─ Return { accessToken, user }
↓
HTTP 201 Created
```

**Why each layer exists**:

1. **DTO Validation**: Prevents malformed data from entering the system. A ValidationPipe catches errors before reaching the service, failing fast with clear error messages.

2. **Controller**: The entry point. Receives the request, calls the service, and returns the response. Thin controllers keep HTTP concerns separate from business logic.

3. **Service**: Contains the core signup logic:
   - Checks email uniqueness (prevents duplicate accounts)
   - Hashes password using bcrypt (prevents plaintext storage)
   - Saves user to database

4. **Repository (TypeORM)**: Abstracts database access. Instead of raw SQL, the repository provides methods like `findOneBy()` and `save()`.

5. **Database**: Persistent storage. PostgreSQL enforces the unique email constraint and generates timestamps.

6. **JWT Generation**: After successful signup, a JWT token is issued. The token claims include `sub` (subject = user ID) and `email`, allowing future requests to be attributed to this user.

### Login Request Flow

```
POST /auth/login
↓
LoginDto Validation
├─ @IsEmail() validates email format
└─ @MinLength(6) validates password format
↓
AuthController.login()
↓
AuthService.login()
├─ Call validateUser(email, password)
│  ├─ Find user by email
│  │  └─ UserRepository.findOneBy({ email })
│  ├─ If user exists:
│  │  └─ Compare plaintext password against bcrypt hash
│  │     └─ bcrypt.compare(password, user.password)
│  └─ Return user if valid, null if invalid
├─ If validation fails
│  └─ Throw UnauthorizedException
└─ Call buildAuthResult(user)
   ├─ Generate JWT via JwtService.sign()
   └─ Return { accessToken, user (without password) }
↓
HTTP 200 OK
```

**Key security point**: The password is NEVER compared character-by-character. Instead:

- During signup: plaintext password → bcrypt hash → stored in DB
- During login: plaintext input + stored hash → bcrypt.compare() → boolean

If someone steals the database, they cannot reverse the hash to get the original password. They can only try brute force (which bcrypt intentionally makes slow).

### Protected Route Request Flow (GET /auth/profile)

```
GET /auth/profile
Header: Authorization: Bearer eyJhbGc...
↓
JwtAuthGuard.canActivate()
├─ Extract token from "Authorization: Bearer ..." header
├─ Pass to JwtStrategy for validation
↓
JwtStrategy.validate(payload)
├─ Verify token signature using JWT_SECRET
├─ Check token expiration (if exp claim is in past, reject)
├─ If valid, return decoded payload
│  └─ { sub: userId, email: userEmail, iat, exp }
↓
Request.user populated with payload
├─ sub (subject) = authenticated user's ID
└─ email = authenticated user's email
↓
AuthController.profile(@CurrentUser() user)
├─ @CurrentUser() decorator extracts user from Request.user
└─ Return user payload
↓
HTTP 200 OK
```

**Why guards exist**: A guard is middleware that runs before the controller. If `JwtAuthGuard` determines the request is unauthenticated (missing token, invalid signature, expired), it throws an exception, and the controller is never called.

**Why strategies exist**: A strategy encapsulates the authentication algorithm. `JwtStrategy` knows how to:
1. Extract JWT from HTTP headers
2. Verify the signature using a secret
3. Check expiration

This logic is decoupled from HTTP concerns, making it reusable and testable.

---

## 5. Dependency Injection

### How NestJS DI Works

NestJS uses a **constructor injection** pattern. Classes declare their dependencies in the constructor, and the NestJS container automatically provides them.

```typescript
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}
}
```

**Flow**:
1. `AuthService` declares it needs a `User` repository and `JwtService`
2. NestJS reads these declarations
3. When a controller needs `AuthService`, NestJS constructs it, injecting dependencies
4. If `JwtService` has its own dependencies, they're injected recursively

**Benefit**: No manual `new` statements or global state. Dependencies are explicit and testable.

### How Repositories Are Injected

Repositories are NOT manually constructed. TypeORM and NestJS handle it:

```typescript
// In auth.module.ts
imports: [
  TypeOrmModule.forFeature([User]),
]
```

`TypeOrmModule.forFeature([User])` tells NestJS:
- "I'm using the `User` entity"
- "Create a repository for this entity"
- "Make it available for injection in this module"

Then, inside `AuthService`:

```typescript
constructor(
  @InjectRepository(User)
  private readonly userRepository: Repository<User>,
) {}
```

`@InjectRepository(User)` says:
- "I want the repository for the User entity"
- "Inject it as `this.userRepository`"

**Why this is required**: 

- **Type Safety**: The injected repository is typed as `Repository<User>`, so TypeScript checks that you only call valid methods (`findOneBy()`, `save()`, etc.).
- **Testing**: Mock `Repository<User>` in unit tests without touching the real database.
- **Multi-Database Support**: If your app connects to multiple databases, different repositories connect to different databases. Explicit injection prevents confusion.

### Why Modules Matter

Modules are containers that bundle related components and dependencies. 

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({ ... }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
```

**What this says**:
- **imports**: This module needs TypeORM, Passport, and JWT modules
- **controllers**: `AuthController` handles routes in this module
- **providers**: `AuthService`, `JwtStrategy`, `JwtAuthGuard` are created once (singletons) and injected as needed
- **exports**: Other modules can import this module and access `AuthService`

**Why it matters**:
- **Encapsulation**: You can import `AuthModule` into another NestJS app without manual wiring.
- **Clear Dependencies**: You see immediately what this module requires and provides.
- **Scope Control**: Database connections, JWT secrets, and strategies are scoped to this module.

### How Providers Work

Providers are singletons created once when the module loads. They're cached and reused for every request.

```typescript
providers: [AuthService, JwtStrategy, JwtAuthGuard]
```

NestJS automatically injects these into controllers and other providers via constructor injection.

**Alternative syntax** (rarely needed):
```typescript
providers: [
  {
    provide: 'AUTH_SERVICE',
    useClass: AuthService,
  }
]
```

This named provider pattern is useful for:
- Multiple implementations of the same interface
- Conditional providers (different behavior in test vs. production)
- Factory providers (complex initialization logic)

---

## 6. Database Architecture

### Why Supabase PostgreSQL is Used

**Supabase advantages**:
1. **Zero DevOps**: No need to provision servers, configure backups, or manage patches
2. **Security**: Built-in SSL, role-based access control, and audit logging
3. **Scalability**: Handles millions of records and concurrent connections
4. **Reliability**: ACID compliance ensures data integrity (critical for authentication data)
5. **Cost**: Pay only for what you use; no expensive infrastructure bills

**In the context of Auth Service**:
- Supabase hosts the PostgreSQL instance
- TypeORM connects via `DATABASE_URL` (Supabase connection string)
- The `users` table stores all user credentials

### Why TypeORM Entities Exist

An **entity** is a TypeScript class that maps to a database table.

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Why this exists**:
- **Type Safety**: TypeScript enforces that `user.email` is a string, `user.id` is a UUID, etc.
- **Schema Definition**: Decorators like `@Column()`, `@PrimaryGeneratedColumn()`, `@CreateDateColumn()` define the SQL schema
- **Auto-Migration**: `synchronize: true` reads these decorators and creates/alters tables automatically

**Decorators explained**:
- `@Entity('users')`: Maps this class to a PostgreSQL table named `users`
- `@PrimaryGeneratedColumn('uuid')`: Auto-generates a UUID primary key
- `@Column({ unique: true })`: Creates a column with a UNIQUE constraint (prevents duplicate emails)
- `@CreateDateColumn()`: Auto-sets timestamp when row is inserted
- `@UpdateDateColumn()`: Auto-updates timestamp whenever the row is modified

### How synchronize:true Works

In `app.module.ts`:

```typescript
TypeOrmModule.forRoot({
  synchronize: process.env.NODE_ENV === 'development',
})
```

**What synchronize does**:
- On startup, TypeORM reads all entity decorators
- Compares them against the actual PostgreSQL schema
- Automatically executes `ALTER TABLE` / `CREATE TABLE` statements

**Example**:
1. Dev adds `@Column() phone: string` to `User` entity
2. Developer restarts the app
3. TypeORM detects the new column
4. Executes: `ALTER TABLE users ADD COLUMN phone VARCHAR(255)`
5. No manual migrations needed

**CRITICAL**: `synchronize: true` ONLY in development. In production, use migration tools (TypeORM's `migration` command or Flyway). Automatic schema changes in production risk data loss.

### Difference Between Entity and DTO

**Entity** = Database table blueprint
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  password: string;
}
```

**DTO** = Request/response contract
```typescript
export class SignupDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;
}

export class UserResponseDto {
  id: string;
  email: string;
  // NO password field (security)
}
```

**Why they're different**:
- **Entity** includes sensitive data (password hash). It's the database row.
- **DTO** is what the API accepts/returns. It excludes sensitive fields and adds validation.

**Example flow**:
```
SignupDto (request) → AuthService.signup() → User (entity, saved) → UserResponseDto (response without password)
```

### How TypeORM Auto-Creates Tables

**Process**:

1. **Metadata Reading**: TypeORM scans all `@Entity` decorated classes
2. **Connection**: Connects to PostgreSQL using `DATABASE_URL`
3. **Schema Comparison**: Queries PostgreSQL's `information_schema` to see current tables
4. **Diff Calculation**: Compares actual schema against expected schema from entities
5. **DDL Execution**: Executes `CREATE TABLE`, `ALTER TABLE`, etc.

**Example**:

Entity:
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;
}
```

Generated SQL (on first startup):
```sql
CREATE TABLE "users" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "email" character varying NOT NULL UNIQUE,
  CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
)
```

On subsequent startups, TypeORM sees the table exists and does nothing (unless you modify the entity).

---

## 7. JWT Authentication Flow

### Token Generation

When a user successfully signs up or logs in, a JWT is generated:

```typescript
async buildAuthResult(user: User): Promise<AuthResult> {
  const payload: JwtPayload = {
    sub: user.id,        // subject = unique identifier
    email: user.email,
  };

  const accessToken = this.jwtService.sign(payload);
  return { accessToken, user: { ...user, password: undefined } };
}
```

**JwtService.sign()** does:
1. Encodes the payload (object → Base64)
2. Creates a signature using `JWT_SECRET` and HS256 (HMAC SHA-256)
3. Returns: `header.payload.signature`

**Example token**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiI1ZmE2OWExMS1hM2NjLTQ1ZTctOTMyYS1hYmNkZWYwMTIzNDUiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE3MDMyODU2MDAsImV4cCI6MTcwMzI4OTIwMH0.
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

### Payload Structure

```typescript
export interface JwtPayload {
  sub: string;      // subject (user ID)
  email: string;    // user email
  iat?: number;     // issued at (Unix timestamp, auto-added by JwtService)
  exp?: number;     // expiration (Unix timestamp, auto-added by JwtService)
}
```

**Claims explained**:
- `sub` (Subject): Unique identifier for the token subject (the user). Used to authorize database queries ("give me THIS user's profile").
- `email`: User's email. Could be used for logging or non-sensitive operations.
- `iat` (Issued At): Unix timestamp when token was created. Prevents token reuse across time boundaries.
- `exp` (Expiration): Unix timestamp when token expires. After this time, the token is invalid.

**Why claims matter**: The JWT payload is **not encrypted**. Anyone can decode it (Base64). The signature ensures it hasn't been tampered with.

```typescript
// ANYONE can decode this:
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload); // { sub, email, iat, exp }

// But ONLY the server with JWT_SECRET can create a valid signature.
// If someone modifies sub or email, the signature becomes invalid.
```

### JWT Strategy

`JwtStrategy` is a Passport strategy that validates JWTs:

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

**What it does**:
1. **Extract**: Looks for `Authorization: Bearer <token>` header
2. **Verify**: Uses `JWT_SECRET` to validate the signature
3. **Check Expiration**: Rejects if `exp` is in the past
4. **Populate Request.user**: Calls `validate()` to transform the payload into `request.user`

**Why ignoreExpiration: false**: The service rejects expired tokens immediately. This prevents security risks (stolen tokens can be used indefinitely).

### Guards

A **guard** is a NestJS decorator that runs before a route handler.

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
profile(@CurrentUser() user: JwtPayload) {
  return user;
}
```

**JwtAuthGuard does**:
1. Run **before** the controller action
2. If authentication fails, throw `UnauthorizedException`
3. If authentication succeeds, call the controller

**Without the guard**, anyone could access `GET /profile` without a token. The guard enforces that only authenticated users can proceed.

### Bearer Authentication

Clients send tokens in the `Authorization` header:

```
GET /auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Flow**:
1. Client receives token from login endpoint
2. Client stores token (in memory, localStorage, etc.)
3. On every request, client adds `Authorization: Bearer <token>`
4. Server extracts the token, validates it, and processes the request

**Why Bearer?** It's the standard format (RFC 6750). Other alternatives: API keys, OAuth tokens, etc.

### Why JWT is Stateless

Traditional sessions:
```
Client sends username/password
→ Server creates session, stores in database/cache
→ Server returns session ID
→ Client sends session ID on every request
→ Server looks up session, identifies user
```

**Problem**: Session store must be checked for every request (database load).

JWT (stateless):
```
Client sends username/password
→ Server generates JWT (no storage)
→ Client sends JWT on every request
→ Server validates JWT signature (cryptographic check, no database lookup)
```

**Advantage**: No server-side session store. Token validation is cryptographic, not database-dependent. Massively scalable.

### Why JWT is Useful for Microservices

In a microservices architecture, multiple services must identify users:

```
API Gateway → Auth Service (issues JWT)
            → Grocery Service (needs to know user ID)
            → Recipe Service (needs to know user ID)
            → Nutrition Service (needs to know user ID)
```

With JWT:
1. Auth Service issues token
2. Other services validate token signature without contacting Auth Service
3. Token payload contains `sub` (user ID), so each service knows who the request is for

**Without JWT**, every service would need to call Auth Service to validate the session (network overhead, single point of failure).

---

## 8. Environment Variables

### DATABASE_URL

Connection string to Supabase PostgreSQL.

**Format**:
```
postgresql://postgres:PASSWORD@db.lezuqzqulysbruslnhrp.supabase.co:5432/postgres
```

**Components**:
- `postgresql://`: Protocol
- `postgres`: Default database user
- `PASSWORD`: Database password (URL-encoded if it contains `@`, `#`, etc.)
- `db.lezuqzqulysbruslnhrp.supabase.co`: Supabase host
- `5432`: PostgreSQL port
- `postgres`: Default database name

**Why secret**: Contains database credentials. If exposed, attackers can access all user data.

**Where it's used**: `TypeOrmModule.forRoot()` in `app.module.ts` passes this to the TypeORM data source.

### JWT_SECRET

The cryptographic secret used to sign and verify JWTs.

**Format**: Any string (but use a strong, random secret)
```
JWT_SECRET=mySuperSecretKey12345!@#$%^&*()
```

**Length**: At least 32 characters (256 bits) for HS256.

**Why secret**: Anyone with `JWT_SECRET` can forge tokens. Protect it like a password.

**Where it's used**:
- `JwtModule.registerAsync()` in `auth.module.ts`
- `JwtStrategy` constructor reads it via `ConfigService`

**Security principle**: Never commit to Git. Store in `.env` (which is gitignored). In production, use secret management tools (AWS Secrets Manager, Vault, etc.).

### PORT

HTTP port the service listens on.

**Format**:
```
PORT=3001
```

**Default**: If not set, NestJS defaults to 3000.

**Why variable**: Different environments use different ports. Dev might use 3001, production 8080, tests use random ports.

**Where it's used**: `main.ts` calls `app.listen(process.env.PORT)`

---

## 9. Swagger Documentation

### Why Swagger is Used

Swagger (OpenAPI) generates interactive API documentation from code decorators.

**Benefits**:
1. **Self-Documenting**: Code decorators are the source of truth. Changes to code automatically update documentation.
2. **Testable**: Interactive UI lets developers test endpoints directly without Postman.
3. **Client Generation**: OpenAPI schema can generate client libraries in any language.
4. **Standards**: OpenAPI is an industry standard, understood by tools and teams.

### How API-First Architecture Works

Traditional flow:
```
Code → Manual documentation → Documentation drifts → Confusion
```

API-First flow:
```
Code (with @Api decorators) → Swagger automatically generated → Always in sync
```

**Example**:

```typescript
@Post('login')
@ApiOperation({ summary: 'Authenticate an existing user' })
@ApiBody({ type: LoginDto })
@ApiResponse({ status: 200, description: 'Login successful' })
login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```

Swagger automatically:
- Shows the `/auth/login` endpoint
- Displays the request schema from `LoginDto`
- Documents the response status and type
- Provides a "Try it out" button for testing

### How Swagger Testing Works

1. Navigate to `http://localhost:3001/api/docs`
2. See all endpoints organized by tags (e.g., `auth`)
3. Click "Try it out" on an endpoint
4. Enter request body
5. Click "Execute"
6. See response status, headers, and body

**Example**:
```
POST /auth/signup
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

Response:
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "5fa69a11-a3cc-45e7-932a-abcdef012345",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### How Bearer Auth Works in Swagger

Protected endpoints use `@ApiBearerAuth()`:

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
@ApiBearerAuth()
@ApiOperation({ summary: 'Read the authenticated user payload' })
profile(@CurrentUser() user: JwtPayload) {
  return user;
}
```

In Swagger UI:
1. Click "Authorize" button (top right)
2. Paste the JWT token from a login response
3. Now all requests include `Authorization: Bearer <token>` automatically

---

## 10. Current API Endpoints

### POST /auth/signup

**Purpose**: Create a new user account.

**Authentication**: None (public endpoint).

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Validation**:
- `email`: Must be a valid email format
- `password`: Minimum 6 characters
- `name`: Required, non-empty string

**Response (201 Created)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "5fa69a11-a3cc-45e7-932a-abcdef012345",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid DTO (e.g., email format, password length)
- `409 Conflict`: Email already exists

---

### POST /auth/login

**Purpose**: Authenticate an existing user and issue a JWT.

**Authentication**: None (public endpoint).

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "5fa69a11-a3cc-45e7-932a-abcdef012345",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid DTO
- `401 Unauthorized`: Email not found or password incorrect

---

### GET /auth/profile

**Purpose**: Retrieve the authenticated user's profile.

**Authentication**: Required (Bearer JWT).

**Request Header**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```json
{
  "sub": "5fa69a11-a3cc-45e7-932a-abcdef012345",
  "email": "user@example.com"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Token expired

---

## 11. Security Practices

### Password Hashing with bcrypt

**Flow**:

**Signup**:
```
plaintext password: "password123"
↓
bcrypt.hash("password123", 10)
↓
hashed password: "$2b$10$abc...xyz" (60 characters)
↓
Store in PostgreSQL
```

**Login**:
```
User inputs: "password123"
Retrieved hash: "$2b$10$abc...xyz"
↓
bcrypt.compare("password123", "$2b$10$abc...xyz")
↓
Result: true (passwords match)
```

**Why bcrypt**:
1. **Irreversible**: The hash cannot be reversed to get the original password
2. **Salted**: Each hash includes a random salt, preventing rainbow table attacks
3. **Slow**: Deliberately takes ~0.1 seconds per hash. Prevents brute force (10 hashes per second instead of 1 billion)

**Work Factor**: `bcrypt.hash(password, 10)` means 2^10 = 1024 iterations. Increase this value for more security (but slower hashing).

### Why Passwords Are Never Stored Raw

**If database is breached**:

With raw passwords:
```
Attacker gets: user@example.com | password123
Attacker can: Login as user immediately
```

With bcrypt hashes:
```
Attacker gets: user@example.com | $2b$10$abc...xyz
Attacker can: Try brute force (1 million attempts ≈ 3 days)
Attacker likely: Gives up (too slow)
```

**Even if attacker cracks the hash**, it takes days/weeks, giving users time to reset passwords.

### JWT Expiration

JWTs include an `exp` (expiration) claim:

```typescript
JwtModule.register({
  signOptions: {
    expiresIn: '1d',  // Token expires after 1 day
  },
})
```

**Why expiration**:
1. **Limited Window**: Stolen tokens are useful only for 1 day, not forever
2. **Forced Re-Authentication**: Users must log in again after 1 day (security refresh)
3. **Revocation Support**: If you mark a user as compromised, you only wait 1 day for their token to expire

**Trade-off**: Shorter expiration (1 hour) = more secure but more logins. Longer (7 days) = fewer logins but wider window for token theft.

### Route Guards

`JwtAuthGuard` on protected routes:

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
profile(@CurrentUser() user: JwtPayload) {
  return user;
}
```

**What it prevents**:
```
GET /auth/profile

Without token:
→ JwtAuthGuard catches request
→ Throws UnauthorizedException
→ Controller never called

With valid token:
→ JwtAuthGuard validates token
→ Populates request.user
→ Controller called
```

**Without the guard**, any unauthenticated request could access `/profile`. Guards enforce access control.

### Validation Pipes

`ValidationPipe` validates incoming DTOs:

```typescript
@Post('signup')
signup(@Body() signupDto: SignupDto) { ... }
```

If request body is invalid:
```json
{
  "email": "not-an-email",
  "password": "123"
}
```

**Response (400 Bad Request)**:
```json
{
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ]
}
```

**Why it matters**: Prevents malformed data from reaching the service. Fails fast with clear error messages.

---

## 12. Important Learnings

### Controllers Should Stay Thin

**Bad**:
```typescript
@Post('signup')
async signup(@Body() dto: SignupDto) {
  // Business logic here (wrong!)
  const user = await this.userRepository.findOne({ email: dto.email });
  if (user) throw new ConflictException('Email exists');
  
  const hashed = await bcrypt.hash(dto.password, 10);
  const newUser = await this.userRepository.save({
    email: dto.email,
    password: hashed,
    name: dto.name,
  });
  
  const token = this.jwtService.sign({ sub: newUser.id });
  return { accessToken: token, user: newUser };
}
```

**Good**:
```typescript
@Post('signup')
signup(@Body() signupDto: SignupDto) {
  return this.authService.signup(signupDto);
}
```

**Why**: Controllers receive HTTP requests and delegate to services. Mixing HTTP concerns with business logic makes code hard to test and reuse.

### Services Contain Business Logic

`AuthService` encapsulates signup, login, validation:

```typescript
async signup(signupDto: SignupDto): Promise<AuthResult> {
  // Check if user exists
  const existingUser = await this.userRepository.findOneBy({
    email: signupDto.email,
  });

  if (existingUser) {
    throw new ConflictException('Email already exists');
  }

  // Hash password
  const hashedPassword = await hash(signupDto.password, 10);

  // Save user
  const user = this.userRepository.create({
    email: signupDto.email,
    password: hashedPassword,
    name: signupDto.name,
  });

  await this.userRepository.save(user);

  // Generate token and return
  return this.buildAuthResult(user);
}
```

**Why**: Services are:
- Reusable (can be called from controllers, scheduled jobs, other services)
- Testable (mock repository in unit tests)
- Isolated (business logic doesn't depend on HTTP)

### Entities Represent DB Tables

`User` entity maps to `users` table:

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

Generated SQL:
```sql
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" varchar(255) UNIQUE NOT NULL,
  "password" varchar(255) NOT NULL,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
)
```

**Why**: Entities are single source of truth for database schema. Changes to entity auto-update the schema (in development).

### DTOs Validate Requests

`SignupDto` validates signup requests:

```typescript
export class SignupDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsNotEmpty()
  name: string;
}
```

**Why**: DTOs:
- Define API contract (what fields are required, their types)
- Validate at HTTP boundary (fail fast)
- Prevent invalid data from reaching services
- Generate Swagger documentation automatically

### Guards Protect Routes

`JwtAuthGuard` on sensitive routes:

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
profile(@CurrentUser() user: JwtPayload) {
  return user;
}
```

**Why**: Guards:
- Enforce access control (only authenticated users)
- Prevent unauthorized access before controller is called
- Can be reused across multiple routes

### Strategies Validate Authentication

`JwtStrategy` validates JWT tokens:

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

**Why**: Strategies:
- Encapsulate authentication algorithm (JWT validation)
- Are pluggable (can add OAuth, local auth, etc.)
- Separate authentication logic from HTTP concerns

### Modules Wire Dependencies

`AuthModule` imports dependencies and exports services:

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
```

**Why**: Modules:
- Organize related components
- Declare dependencies (what this module needs)
- Export services (what other modules can use)
- Make architecture clear and maintainable

---

## 13. Next Steps

### Future Architecture Plans

**Grocery Service** (`backend/grocery-service/`)
- Manage recipes, ingredients, and meal planning
- Calls Auth Service to verify JWT tokens in request
- Stores grocery lists, preferences

**Nutrition Service** (`backend/nutrition-service/`)
- Track nutritional information for recipes
- Validate user JWT tokens
- Compute macros, calories, vitamins

**Recipe Service** (`backend/recipe-service/`)
- Manage recipes, cooking instructions
- Integrate with Nutrition Service
- Verify user authentication via Auth Service

**AI Planner Service** (`backend/ai-planner-service/`)
- Generate meal plans based on user preferences
- Call Nutrition and Recipe services
- Require JWT authentication

### Kafka Event Communication

Currently, services are tightly coupled (HTTP calls). Future evolution:

```
Auth Service → Kafka (user.created event)
            → Grocery Service subscribes, creates default grocery list
            → Nutrition Service subscribes, initializes user nutrition profile
```

**Benefits**:
- Decoupling: Services don't need to know about each other
- Async: Events are processed asynchronously
- Scalability: Multiple services can process the same event

### API Gateway

An API Gateway sits between clients and microservices:

```
Client → API Gateway → Auth Service
                    → Grocery Service
                    → Recipe Service
                    → Nutrition Service
                    → AI Planner Service
```

**API Gateway responsibilities**:
- Route requests to correct service
- Validate JWT tokens centrally
- Rate limiting
- Request logging, monitoring
- Response aggregation

### Dockerization

Each service becomes a Docker container:

```dockerfile
FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

CMD ["node", "dist/main.js"]
```

**Benefits**:
- Consistent environment (dev/prod)
- Easy deployment to Kubernetes
- Isolated dependencies

### Kubernetes

Orchestrate Docker containers:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: smart-kitchen/auth-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: database-url
```

**Benefits**:
- Auto-scaling (scale auth-service up during peak login times)
- Self-healing (restart failed containers)
- Load balancing
- Rolling updates

### CI/CD

Automated testing and deployment:

```
Developer pushes code
  ↓
GitHub Actions triggers
  ↓
Run unit tests
  ↓
Run integration tests
  ↓
Build Docker image
  ↓
Push to registry
  ↓
Deploy to Kubernetes (if tests pass)
```

**Benefits**:
- Catch bugs before production
- Automated deployments (no manual SSH)
- Quick feedback loop (developers see test results in minutes)

### Why Auth Service is the Foundation

1. **All services depend on Auth**: Every API request must be authenticated
2. **Security baseline**: Password hashing, JWT validation are centralized
3. **User identity**: All services identify users through tokens issued by Auth
4. **Access control**: Future features (role-based access, permissions) will be added to Auth and enforced by other services

The architecture looks like:

```
┌─────────────────────────────────────────────────────┐
│ Auth Service (JWT token issuer)                      │
│ - User registration                                  │
│ - Login & token generation                           │
│ - Token validation (used by other services)          │
└──────────────────────────────────────────────────────┘
           ↑              ↑              ↑               ↑
           │              │              │               │
    ┌──────▼────┐  ┌──────▼────┐  ┌──────▼────┐  ┌──────▼────┐
    │ Grocery   │  │  Recipe   │  │ Nutrition │  │    AI     │
    │ Service   │  │  Service  │  │  Service  │  │  Planner  │
    └───────────┘  └───────────┘  └───────────┘  └───────────┘
           │              │              │               │
           └──────────────┴──────────────┴───────────────┘
                      ↑ (validate JWT)

    API Gateway / Load Balancer
```

Every service:
- Receives JWT from client
- Validates JWT signature (using Auth Service's `JWT_SECRET`)
- Uses `sub` claim to identify user
- Processes domain logic
- Returns data

This architecture ensures security, scalability, and clean separation of concerns.

---

## Conclusion

The Auth Service represents production-grade backend engineering:

- **Clean Architecture**: Controllers, services, entities, DTOs separated cleanly
- **Security**: Passwords hashed, JWTs validated, secrets managed
- **Scalability**: Stateless JWT design, microservice-ready
- **Maintainability**: Modular NestJS structure, reusable components
- **Documentation**: Swagger integration, clear request flows

Understanding this service deeply prepares you for building the remaining microservices, which follow the same patterns: isolated domains, dependency injection, HTTP contracts, and authentication guards.

Next phase: Replicate this architecture in Grocery Service, Recipe Service, and Nutrition Service. Each service manages its own domain but validates user identity via tokens from Auth Service.
