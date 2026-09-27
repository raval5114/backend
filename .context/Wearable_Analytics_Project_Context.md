# Wearable Analytics & Player Management Service

## Complete Project Context, Specifications, Architecture, Logic, RBAC and Development Guidelines

> **Document purpose:** This document is the single project-context
> reference for development, architecture decisions, AI coding
> assistance, onboarding, testing, and future feature development.

------------------------------------------------------------------------

# 1. Project Overview

## 1.1 Project Name

**Wearable Analytics & Player Management System**

## 1.2 Project Type

A backend service that manages:

-   User authentication and authorization
-   Role-Based Access Control (RBAC)
-   Player profiles
-   Player/workout/session data
-   Wearable-device integration
-   Sports analytics
-   Future health, performance, and skill analytics

The backend is designed to communicate with a **Wear OS wearable
application** and other client applications.

## 1.3 Primary Backend Stack

  Component          Technology
  ------------------ -----------------
  Runtime            Node.js
  Framework          Express.js
  Database           MongoDB
  ODM                Mongoose
  Authentication     JWT
  Authorization      RBAC
  Password hashing   bcrypt/bcryptjs
  API format         REST
  Wearable client    Wear OS
  Language           JavaScript
  Module system      CommonJS
  Configuration      dotenv
  CORS               cors

## 1.4 Architectural Goal

The system should separate:

1.  **Identity** --- who is the user?
2.  **Authentication** --- is the user authenticated?
3.  **Authorization** --- what can the user do?
4.  **Domain data** --- what player/business information belongs to the
    user?
5.  **Analytics** --- what wearable/workout/session information is
    generated?
6.  **Infrastructure** --- database, JWT, configuration, logging, etc.

------------------------------------------------------------------------

# 2. Core Project Concepts

The most important conceptual distinction is:

``` text
User
  |
  | authenticated identity
  v
Role
  |
  | collection of privileges
  v
Privilege
```

Separately:

``` text
User
  |
  | userId
  v
Player
  |
  v
Workout / Session / Wearable Data
```

## 2.1 User

A **User** represents an authenticated identity.

A user contains:

-   userId
-   username
-   email
-   mobileNo
-   password
-   roleId
-   refreshToken
-   isActive

The User model should not contain sport-specific player information.

## 2.2 Player

A **Player** is a business/domain entity.

A player contains information such as:

-   playerId
-   userId
-   sport
-   position
-   age
-   height
-   weight
-   dominantSide
-   isActive

The `userId` connects the player profile to its authenticated user.

## 2.3 Role

A **Role** groups privileges.

Examples:

``` text
ROLE_ADMIN
ROLE_PLAYER
ROLE_COACH
```

A role contains:

``` text
roleId
roleName
privilegesId[]
```

## 2.4 Privilege

A **Privilege** represents one specific operation.

Examples:

``` text
USER_READ
USER_ROLE_ASSIGN
USER_ROLE_REVOKE
ROLE_CREATE
ROLE_DELETE
PLAYER_READ
PLAYER_UPDATE
PLAYER_DELETE
```

------------------------------------------------------------------------

# 3. Functional Specifications

## 3.1 Authentication

The system must support:

-   User registration
-   User login
-   Password hashing
-   JWT access tokens
-   Refresh tokens
-   Access-token validation
-   User activation/deactivation
-   Logout/token invalidation
-   Current-user lookup

### Login

A user should be able to authenticate using a supported identifier such
as:

-   email
-   mobile number

The server verifies:

1.  User exists
2.  User is active
3.  Password is correct
4.  Credentials are valid

Then the server issues:

``` text
accessToken
refreshToken
```

## 3.2 Refresh Token

The required refresh-token duration is:

``` text
45 hours
```

The refresh token should be securely stored and validated.

Recommended design:

``` text
POST /api/auth/refresh
```

Flow:

``` text
Client
  |
  | refreshToken
  v
Server
  |
  | validate token
  v
User
  |
  | issue new access token
  v
Client
```

## 3.3 Registration

Registration should create a normal user.

The client must **not** be allowed to choose an arbitrary role during
public registration.

Default role:

``` text
ROLE_PLAYER
```

This prevents a malicious client from sending:

``` json
{
  "roleId": "ROLE_ADMIN"
}
```

during registration.

The server assigns the default role.

If the system requires every player to have a player profile,
registration can also create a corresponding `Player` document.

------------------------------------------------------------------------

# 4. Authorization Specifications

The system uses **RBAC --- Role-Based Access Control**.

The authorization hierarchy is:

``` text
User
 ↓
Role
 ↓
Privilege
 ↓
API operation
```

Example:

``` text
User: user_1001
Role: ROLE_COACH
Privileges:
    PLAYER_READ
    PLAYER_UPDATE
```

The coach can perform operations represented by those privileges.

------------------------------------------------------------------------

# 5. RBAC Rules

## 5.1 Admin Privileges

The system should have an admin role with broad administrative
privileges.

Example:

``` text
ROLE_ADMIN
```

Example privilege IDs:

``` text
[1,2,3,4,5,6,7,8,9,10,11,12,20,21,22]
```

The exact IDs should follow the project's final privilege registry.

An earlier requested example was:

``` text
admin
privilegesId: [2, 32, 12]
```

If those IDs are part of the final project specification, they must be
preserved consistently.

## 5.2 Important Authorization Rule

Do **not** rely only on:

``` js
if (role.roleName === "admin") {
    return next();
}
```

for the final permission model if permissions are intended to control
every action.

Instead, the admin role should receive its privileges through:

``` text
role.privilegesId
```

and the authorization middleware should verify the required privilege
normally.

This gives a consistent permission model.

## 5.3 Role Management

Only authorized administrators should be able to:

-   create roles
-   delete non-system roles
-   assign roles
-   revoke roles
-   grant privileges to roles
-   revoke privileges from roles

## 5.4 Privilege Management

Only authorized administrators should be able to:

-   create privileges
-   delete non-system privileges
-   inspect privileges

System privileges should not be casually deleted.

------------------------------------------------------------------------

# 6. Role Violation Behavior

When an authenticated user does not have the required privilege:

``` http
403 Forbidden
```

Example:

``` json
{
  "success": false,
  "error": "ROLE_VIOLATION",
  "message": "Your role does not have permission to perform this operation"
}
```

Authentication and authorization must remain separate:

``` text
401 = user is not authenticated / token invalid
403 = user is authenticated but not authorized
```

------------------------------------------------------------------------

# 7. Security Requirements

## 7.1 Password Security

Passwords must never be stored as plaintext.

Store:

``` text
bcrypt(password)
```

Never return password hashes through normal user APIs.

The Mongoose User model uses:

``` js
select: false
```

for the password.

## 7.2 JWT

JWT should contain only information needed for authentication.

Example payload:

``` json
{
  "userId": "USER_1001",
  "type": "access"
}
```

Do not make authorization depend exclusively on privileges embedded
inside the JWT because roles and privileges can change.

## 7.3 Current Authorization State

Authentication middleware should:

1.  Validate JWT
2.  Load the current user from MongoDB
3.  Verify that the account is active
4.  Attach the current user to `req.user`

Authorization middleware should then:

1.  Load the current role
2.  Resolve the required privilege
3.  Check the role's `privilegesId`
4.  Reject unauthorized requests

This means a revoked role/privilege can take effect without waiting for
an old access token to expire.

------------------------------------------------------------------------

# 8. Recommended Project Structure

``` text
player-management-service/
│
├── config/
│   └── db_config.js
│
├── middleware/
│   ├── authentication.middleware.js
│   └── authorization.middleware.js
│
├── models/
│   ├── user.model.js
│   ├── role.model.js
│   ├── privilege.model.js
│   └── player.data.js
│
├── routes/
│   ├── authentication.routes.js
│   ├── user.routes.js
│   ├── role.routes.js
│   ├── privilege.routes.js
│   └── player.routes.js
│
├── services/
│   ├── auth_service.js
│   ├── user_service.js
│   └── role_service.js
│
├── seed/
│   └── rbac.seed.js
│
├── utils/
│   └── token.util.js
│
├── .env
├── package.json
└── index.js
```

------------------------------------------------------------------------

# 9. Layered Architecture

The application follows a layered REST architecture.

``` text
                CLIENT
                  |
                  v
              REST ROUTES
                  |
                  v
             MIDDLEWARE
          /               \
 Authentication       Authorization
          \               /
                  |
                  v
              SERVICES
                  |
                  v
               MODELS
                  |
                  v
               MONGODB
```

## 9.1 Routes

Routes are responsible for:

-   URL mapping
-   HTTP method handling
-   request validation
-   calling services
-   returning HTTP responses

Routes should not contain large business rules.

## 9.2 Middleware

Middleware handles cross-cutting concerns.

### Authentication middleware

Responsible for:

-   reading Authorization header
-   validating Bearer token
-   verifying JWT
-   loading user
-   checking account status

### Authorization middleware

Responsible for:

-   resolving role
-   resolving privilege
-   checking permission
-   returning `403` on role violation

## 9.3 Services

Services contain business logic.

Examples:

``` text
AuthService
UserService
RoleService
PlayerService
```

## 9.4 Models

Models define MongoDB data structures.

------------------------------------------------------------------------

# 10. Data Models

## 10.1 User Model

``` js
{
    userId: String,
    username: String,
    email: String,
    mobileNo: String,
    password: String,
    roleId: String,
    refreshToken: String,
    isActive: Boolean,
    createdAt: Date,
    updatedAt: Date
}
```

Important constraints:

-   `userId` unique
-   `email` unique
-   `mobileNo` unique when provided
-   `password` excluded from normal queries
-   `roleId` required

## 10.2 Role Model

``` js
{
    roleId: String,
    roleName: String,
    privilegesId: Number[],
    isSystemRole: Boolean,
    createdAt: Date,
    updatedAt: Date
}
```

Example:

``` json
{
  "roleId": "ROLE_PLAYER",
  "roleName": "player",
  "privilegesId": [20, 21],
  "isSystemRole": true
}
```

## 10.3 Privilege Model

``` js
{
    privilegeId: Number,
    privilegeName: String,
    description: String,
    isSystemPrivilege: Boolean,
    createdAt: Date,
    updatedAt: Date
}
```

## 10.4 Player Model

``` js
{
    playerId: String,
    userId: String,
    sport: String,
    position: String,
    age: Number,
    height: Number,
    weight: Number,
    dominantSide: String,
    isActive: Boolean,
    createdAt: Date,
    updatedAt: Date
}
```

The relationship is:

``` text
User.userId
     |
     +---- Player.userId
```

A user can therefore be authenticated independently of player-specific
data.

------------------------------------------------------------------------

# 11. Example RBAC Registry

The initial privilege registry contains examples such as:

    ID Privilege               Purpose
  ---- ----------------------- ---------------------------
     1 USER_READ               View users
     2 USER_ROLE_ASSIGN        Assign roles
     3 USER_ROLE_REVOKE        Revoke roles
     4 USER_STATUS_UPDATE      Activate/deactivate users
     5 ROLE_READ               View roles
     6 ROLE_CREATE             Create roles
     7 ROLE_DELETE             Delete roles
     8 ROLE_PRIVILEGE_GRANT    Grant privileges
     9 ROLE_PRIVILEGE_REVOKE   Revoke privileges
    10 PRIVILEGE_READ          View privileges
    11 PRIVILEGE_CREATE        Create privileges
    12 PRIVILEGE_DELETE        Delete privileges
    20 PLAYER_READ             View players
    21 PLAYER_UPDATE           Update players
    22 PLAYER_DELETE           Delete players

The final registry should be maintained as one authoritative project
definition.

------------------------------------------------------------------------

# 12. Default Roles

## ROLE_ADMIN

Purpose:

``` text
System administration
```

Should receive the administrative privilege set.

## ROLE_PLAYER

Purpose:

``` text
Normal player account
```

Initial privileges:

``` text
PLAYER_READ
PLAYER_UPDATE
```

Resource ownership rules should additionally restrict a player to their
own profile/data.

## ROLE_COACH

Purpose:

``` text
Player/team management
```

Initial privileges may include:

``` text
PLAYER_READ
PLAYER_UPDATE
```

The exact coach permissions should be expanded as team-management
features are implemented.

------------------------------------------------------------------------

# 13. API Design

## 13.1 Authentication

Base path:

``` text
/api/auth
```

Planned endpoints:

``` text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

## 13.2 Users

Base path:

``` text
/api/users
```

Endpoints:

``` text
GET    /api/users
GET    /api/users/:userId
PUT    /api/users/:userId/role
DELETE /api/users/:userId/role
PATCH  /api/users/:userId/status
```

## 13.3 Roles

Base path:

``` text
/api/roles
```

Endpoints:

``` text
GET    /api/roles
GET    /api/roles/:roleId
POST   /api/roles
DELETE /api/roles/:roleId

POST   /api/roles/:roleId/privileges
DELETE /api/roles/:roleId/privileges/:privilegeId
```

## 13.4 Privileges

Base path:

``` text
/api/privileges
```

Endpoints:

``` text
GET    /api/privileges
POST   /api/privileges
DELETE /api/privileges/:privilegeId
```

## 13.5 Players

Base path:

``` text
/api/players
```

The player API should be protected by authentication and the relevant
player privileges.

------------------------------------------------------------------------

# 14. Request Processing Flow

## 14.1 Authenticated Request

``` text
Client
  |
  | Authorization: Bearer <JWT>
  v
Express
  |
  v
Authentication Middleware
  |
  +-- JWT invalid --> 401
  |
  +-- user missing --> 401
  |
  +-- inactive --> 403
  |
  v
req.user
  |
  v
Authorization Middleware
  |
  +-- role missing --> 403
  |
  +-- privilege missing --> 403
  |
  v
Controller/Route
  |
  v
Service
  |
  v
MongoDB
```

------------------------------------------------------------------------

# 15. Registration Logic

Recommended registration flow:

``` text
POST /api/auth/register
        |
        v
Validate request
        |
        v
Check email/mobile uniqueness
        |
        v
Hash password
        |
        v
Find ROLE_PLAYER
        |
        v
Create User
        |
        v
Create Player profile if required
        |
        v
Return sanitized user
```

The request must not be allowed to control:

``` text
roleId
isSystemRole
privilegesId
```

------------------------------------------------------------------------

# 16. Login Logic

``` text
POST /api/auth/login
        |
        v
Find user by email/mobile
        |
        v
Check user exists
        |
        v
Check isActive
        |
        v
Compare password hash
        |
        +---- fail --> 401
        |
        v
Generate access token
        |
        v
Generate refresh token
        |
        v
Store refresh token securely
        |
        v
Return tokens
```

------------------------------------------------------------------------

# 17. Refresh Token Logic

``` text
Client
  |
  | refreshToken
  v
/api/auth/refresh
  |
  v
Validate refresh token
  |
  v
Find user
  |
  v
Check user active
  |
  v
Compare stored refresh token
  |
  v
Issue new access token
  |
  v
Return access token
```

Required refresh lifetime:

``` text
45h
```

Recommended token typing:

``` json
{
  "userId": "USER_1001",
  "type": "refresh"
}
```

Access and refresh secrets should be separate.

------------------------------------------------------------------------

# 18. Logout Logic

Recommended flow:

``` text
POST /api/auth/logout
        |
        v
Authenticate user
        |
        v
Clear stored refresh token
        |
        v
Return success
```

This invalidates the stored refresh session.

------------------------------------------------------------------------

# 19. Current Authentication Middleware

The existing middleware follows this conceptual flow:

``` text
Authorization Header
       |
       v
Bearer token extraction
       |
       v
jwt.verify()
       |
       v
Find User by userId
       |
       v
Check isActive
       |
       v
req.user = user
```

This is the correct architectural direction because the current user
state is read from MongoDB.

------------------------------------------------------------------------

# 20. Authorization Middleware Logic

Required operation:

``` js
authorize("PLAYER_UPDATE")
```

Conceptual algorithm:

``` text
authorize(requiredPrivilege)
        |
        v
Check req.user
        |
        +---- missing --> 401
        |
        v
Find role using req.user.roleId
        |
        +---- missing --> 403
        |
        v
Find privilege by privilegeName
        |
        +---- missing --> 500 configuration error
        |
        v
Check privilegeId in role.privilegesId
        |
        +---- false --> 403 ROLE_VIOLATION
        |
        v
next()
```

------------------------------------------------------------------------

# 21. Resource Ownership

RBAC alone is not enough for player data.

Example:

``` text
PLAYER_UPDATE
```

means the player role can update player data, but it should not
automatically mean:

``` text
Player A can update Player B.
```

The system should eventually implement:

``` text
RBAC
+
Resource Ownership
```

Example:

``` text
Player userId = USER_101
Player A.userId = USER_101
```

Player A may update:

``` text
Player A
```

but not:

``` text
Player B
```

unless the user's role has broader authority, such as coach/admin
permissions.

------------------------------------------------------------------------

# 22. Player Authorization Logic

Example:

``` text
Request:
PUT /api/players/PLAYER_101
```

Logic:

``` text
Authenticate
      |
      v
Authorize PLAYER_UPDATE
      |
      v
Find player
      |
      v
Is request.user a privileged manager?
      |
   yes/no
      |
      +---- player --> verify player.userId === req.user.userId
      |
      +---- coach/admin --> broader access according to privilege
      |
      v
Update
```

This prevents horizontal privilege escalation.

------------------------------------------------------------------------

# 23. Wear OS Integration

The wearable application is expected to communicate with the backend.

High-level architecture:

``` text
+--------------------+
| Wear OS Application|
+---------+----------+
          |
          | HTTPS / WebSocket
          v
+--------------------+
| Node.js API        |
| Authentication     |
| Player Service     |
| Workout Service    |
| Session Service    |
+---------+----------+
          |
          v
+--------------------+
| MongoDB            |
+--------------------+
```

The wearable can collect data such as:

-   workout sessions
-   activity states
-   performance metrics
-   movement information
-   player session statistics

The exact sensor schema should be defined separately from the
authentication/user schema.

------------------------------------------------------------------------

# 24. Workout Session Domain

A planned domain entity is:

``` text
WorkoutSession
```

Possible conceptual structure:

``` text
sessionId
playerId
workoutId
startTime
endTime
status
metrics
states
createdAt
updatedAt
```

Possible states:

``` text
PLANNED
STARTED
PAUSED
COMPLETED
CANCELLED
```

The final schema should follow the project's workout/session
requirements rather than mixing wearable telemetry directly into the
User model.

------------------------------------------------------------------------

# 25. Player Analytics Architecture

The long-term data pipeline can be:

``` text
Wear OS
   |
   v
API Gateway / Node Service
   |
   v
Authentication
   |
   v
Player Validation
   |
   v
Workout / Session Service
   |
   v
Analytics Processing
   |
   +---------> MongoDB
   |
   +---------> Aggregation
   |
   +---------> Reports
   |
   +---------> ML/AI Analytics
```

Future analytics can include:

-   workload analysis
-   session comparison
-   performance trends
-   fitness metrics
-   movement analysis
-   skill/agility analysis
-   player benchmarking

------------------------------------------------------------------------

# 26. Future Microservice Direction

The current implementation can start as a modular Node.js service.

As the system grows, it can be separated into services such as:

``` text
API Gateway
     |
     +-- Auth Service
     |
     +-- User Service
     |
     +-- Player Service
     |
     +-- Workout Service
     |
     +-- Session Service
     |
     +-- Analytics Service
     |
     +-- Notification Service
```

Possible infrastructure:

``` text
Docker
Nginx
Redis
Message Broker
MongoDB
CI/CD
```

Do not split into microservices prematurely. First maintain clear module
boundaries inside the current Node.js application.

------------------------------------------------------------------------

# 27. Database Design Principles

## 27.1 Identity

User collection:

``` text
users
```

## 27.2 Authorization

Role collection:

``` text
roles
```

Privilege collection:

``` text
privileges
```

## 27.3 Player Domain

Player collection:

``` text
players
```

## 27.4 Analytics Domain

Potential collections:

``` text
workout_sessions
player_metrics
wearable_events
performance_reports
```

------------------------------------------------------------------------

# 28. Indexing Requirements

Recommended indexes:

### User

``` text
userId
email
mobileNo
roleId
```

### Role

``` text
roleId
roleName
```

### Privilege

``` text
privilegeId
privilegeName
```

### Player

``` text
playerId
userId
```

Frequently queried wearable/session identifiers should also be indexed
after their access patterns are established.

------------------------------------------------------------------------

# 29. Error Handling

Use consistent JSON responses.

## Success

``` json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

## Authentication Error

``` json
{
  "success": false,
  "error": "AUTHENTICATION_REQUIRED",
  "message": "Authorization header is required"
}
```

## Authorization Error

``` json
{
  "success": false,
  "error": "ROLE_VIOLATION",
  "message": "Your role does not have permission to perform this operation"
}
```

## Validation Error

``` http
400 Bad Request
```

## Not Found

``` http
404 Not Found
```

## Conflict

``` http
409 Conflict
```

## Server Error

``` http
500 Internal Server Error
```

------------------------------------------------------------------------

# 30. Environment Variables

Recommended `.env` structure:

``` env
PORT=3000

MONGO_URI=mongodb://localhost:27017/wearable_analytics

JWT_ACCESS_SECRET=replace_with_secure_secret
JWT_REFRESH_SECRET=replace_with_different_secure_secret

JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=45h
```

Secrets must not be committed to Git.

------------------------------------------------------------------------

# 31. Startup Flow

The current application startup should follow:

``` text
Load environment
       |
       v
Create Express application
       |
       v
Configure CORS
       |
       v
Configure JSON parser
       |
       v
Connect MongoDB
       |
       v
Seed RBAC
       |
       v
Register routes
       |
       v
Start HTTP server
```

RBAC seeding should be idempotent.

That means running the seed repeatedly should update/create the intended
system records without creating duplicates.

------------------------------------------------------------------------

# 32. RBAC Seeding

The seed should create:

``` text
Privileges
Roles
```

Example:

``` text
ROLE_ADMIN
ROLE_PLAYER
ROLE_COACH
```

The seed uses:

``` js
updateOne(
    { privilegeId: privilege.privilegeId },
    { $set: privilege },
    { upsert: true }
)
```

and equivalent role logic.

This makes startup initialization repeatable.

------------------------------------------------------------------------

# 33. System Roles and System Privileges

System records should be protected.

Example:

``` text
isSystemRole: true
isSystemPrivilege: true
```

System roles should not normally be deleted.

System privileges should not normally be deleted.

If the project later requires changing system permissions, that should
happen through a controlled administrative operation or migration.

------------------------------------------------------------------------

# 34. API Security Rules

Every protected API should follow:

``` text
Authentication
    ↓
Authorization
    ↓
Ownership / Scope
    ↓
Business validation
    ↓
Database operation
```

Never reverse this order in a way that exposes protected data before
authorization.

------------------------------------------------------------------------

# 35. Important Existing Code Corrections

The original authentication route contained two JavaScript/CommonJS
errors:

### Router initialization

Incorrect:

``` js
const authRouter = express.Router;
```

Correct:

``` js
const authRouter = express.Router();
```

### Module export

Incorrect:

``` js
modules.exports = authRouter;
```

Correct:

``` js
module.exports = authRouter;
```

These must remain corrected in the final implementation.

------------------------------------------------------------------------

# 36. Service Responsibilities

## AuthService

Responsible for:

-   register
-   login
-   password verification
-   access token generation
-   refresh token generation
-   refresh-token validation
-   logout
-   current-user retrieval

## UserService

Responsible for:

-   user retrieval
-   role assignment
-   role revocation
-   user activation/deactivation

## RoleService

Responsible for:

-   role retrieval
-   role creation
-   role deletion
-   privilege assignment
-   privilege removal

## PlayerService

Responsible for:

-   player creation
-   player retrieval
-   player update
-   player deletion
-   ownership validation

------------------------------------------------------------------------

# 37. Separation of Concerns

Avoid this:

``` text
Route
 ├── database query
 ├── password hashing
 ├── JWT generation
 ├── authorization logic
 ├── business rules
 └── response
```

Prefer:

``` text
Route
  |
  v
Middleware
  |
  v
Service
  |
  v
Model
  |
  v
MongoDB
```

------------------------------------------------------------------------

# 38. Testing Strategy

The project should eventually include:

## Unit Tests

Test:

-   password hashing
-   password comparison
-   token generation
-   token validation
-   role lookup
-   privilege checking
-   ownership validation

## Integration Tests

Test:

``` text
register → login → access API
```

``` text
login → refresh → new access token
```

``` text
admin → assign role → user permissions change
```

``` text
revoke role → protected endpoint returns 403
```

## Authorization Tests

At minimum:

``` text
No token                  → 401
Invalid token             → 401
Inactive user             → 403
Missing privilege         → 403
Valid privilege           → success
Player accesses own data → success
Player accesses other's data → 403
Admin operation           → success if admin has privilege
```

------------------------------------------------------------------------

# 39. Development Workflow

Recommended feature workflow:

``` text
1. Define specification
2. Define domain model
3. Define API contract
4. Implement model
5. Implement service
6. Implement middleware
7. Implement route
8. Write tests
9. Run tests
10. Review security
11. Commit
```

For major features:

``` text
Logic first
    ↓
Service/repository
    ↓
Middleware
    ↓
Mock/unit tests
    ↓
Routes
    ↓
Integration tests
    ↓
Client integration
```

------------------------------------------------------------------------

# 40. Git Commit Strategy

Prefer small feature-focused commits.

Examples:

``` text
feat(auth): implement user registration
feat(auth): implement jwt login
feat(auth): add refresh token flow
feat(rbac): add role and privilege models
feat(rbac): add authorization middleware
feat(player): add player ownership validation
test(auth): add authentication tests
test(rbac): add role violation tests
```

Avoid large commits containing unrelated features.

------------------------------------------------------------------------

# 41. API Naming Conventions

Use plural resources:

``` text
/users
/roles
/privileges
/players
```

Use actions only when the operation is not naturally represented by
CRUD.

Examples:

``` text
PUT /users/:userId/role
POST /roles/:roleId/privileges
POST /auth/refresh
```

------------------------------------------------------------------------

# 42. Coding Standards

Use CommonJS consistently:

``` js
const express = require("express");

module.exports = router;
```

Avoid mixing:

``` js
import ...
export default ...
```

with:

``` js
require(...)
module.exports
```

unless the entire project is intentionally migrated to ESM.

Use async/await for asynchronous operations.

Use meaningful error names.

Keep database operations inside services where practical.

------------------------------------------------------------------------

# 43. AI Coding Context Rules

Any AI coding assistant working on this project should preserve these
rules:

### Rule 1 --- CommonJS

Use:

``` js
require()
module.exports
```

### Rule 2 --- RBAC

Do not bypass authorization by checking only:

``` js
roleName === "admin"
```

The final authorization model should resolve privileges.

### Rule 3 --- Registration Security

Never allow public registration to choose arbitrary:

``` text
roleId
privilegesId
isSystemRole
```

### Rule 4 --- User vs Player

Do not merge all player fields into User.

Keep:

``` text
User = identity
Player = domain profile
```

### Rule 5 --- Ownership

A player should not automatically have access to every player's data.

### Rule 6 --- Current Permissions

Do not rely exclusively on JWT-embedded roles/privileges.

Resolve current authorization state from the database.

### Rule 7 --- Secrets

Never hardcode:

``` text
JWT secrets
MongoDB credentials
Passwords
API keys
```

### Rule 8 --- Backward Compatibility

Before changing existing models or routes, check current consumers and
API contracts.

------------------------------------------------------------------------

# 44. Current Architecture Summary

``` text
                         CLIENTS
                            |
              +-------------+-------------+
              |                           |
          Wear OS App                 Other Clients
              |                           |
              +-------------+-------------+
                            |
                            v
                       Express API
                            |
             +--------------+--------------+
             |                             |
       Authentication                 Authorization
             |                             |
             v                             v
          User DB                     Role + Privilege
             |                             |
             +--------------+--------------+
                            |
                            v
                         Services
                            |
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
      Users              Players            Sessions
                                                |
                                                v
                                             Analytics
                                                |
                                                v
                                             MongoDB
```

------------------------------------------------------------------------

# 45. Current Project Status

## Implemented / Defined

-   Node.js + Express architecture
-   MongoDB/Mongoose
-   User model
-   Role model
-   Privilege model
-   Player model linked to User
-   Authentication middleware design
-   Authorization middleware design
-   User service
-   Role service
-   User routes
-   Role routes
-   Privilege routes
-   RBAC seed
-   Database startup
-   CORS configuration
-   API route registration
-   Role violation response design
-   45-hour refresh-token requirement
-   Wear OS integration direction

## Next Required Implementation

The most important next implementation is the complete authentication
flow:

``` text
authentication.routes.js
auth_service.js
token utility
registration
login
refresh
logout
current user
```

It should integrate with:

``` text
User
Role
Player
JWT
RBAC
```

------------------------------------------------------------------------

# 46. Recommended Next Development Sequence

## Phase 1 --- Authentication

``` text
AuthService
   ↓
Register
   ↓
Login
   ↓
Access token
   ↓
Refresh token
   ↓
Logout
```

## Phase 2 --- Authorization Hardening

``` text
Privilege-based authorization
        +
Resource ownership
        +
Role administration
```

## Phase 3 --- Player Service

``` text
Player CRUD
   +
Ownership
   +
Coach/Admin access
```

## Phase 4 --- Workout Service

``` text
Workout
   ↓
Workout Session
   ↓
Session State
   ↓
Player Metrics
```

## Phase 5 --- Wear OS

``` text
Wear OS
   ↓
Authentication
   ↓
Player identification
   ↓
Session creation
   ↓
Live/session data
```

## Phase 6 --- Analytics

``` text
Raw wearable data
       ↓
Processing
       ↓
Aggregations
       ↓
Performance metrics
       ↓
Reports
```

## Phase 7 --- Scale

Only after the modular monolith has clear boundaries:

``` text
API Gateway
Auth Service
Player Service
Workout Service
Analytics Service
Notification Service
```

------------------------------------------------------------------------

# 47. Non-Functional Requirements

## Security

-   Password hashing
-   JWT validation
-   Refresh-token validation
-   RBAC
-   Resource ownership
-   Input validation
-   Secure secrets
-   No sensitive data in responses

## Performance

-   Database indexes
-   Efficient queries
-   Pagination for large collections
-   Avoid unnecessary population/joins
-   Consider caching only after measuring bottlenecks

## Reliability

-   Database connection failure handling
-   Consistent error handling
-   Token invalidation
-   Idempotent RBAC seed
-   Validation of referenced roles/privileges

## Maintainability

-   Layered architecture
-   Feature/domain separation
-   CommonJS consistency
-   Service-level business logic
-   Small commits
-   Tests for authorization-sensitive operations

------------------------------------------------------------------------

# 48. Example End-to-End Scenario

## Scenario

A new player registers.

``` text
1. POST /api/auth/register
2. Server validates email/mobile
3. Server hashes password
4. Server finds ROLE_PLAYER
5. Server creates User
6. Server creates Player
7. Server returns sanitized user information
```

The player logs in:

``` text
8. POST /api/auth/login
9. Server verifies password
10. Server generates access token
11. Server generates 45h refresh token
12. Server returns tokens
```

The player requests their profile:

``` text
13. GET /api/players/:playerId
14. JWT validated
15. User loaded
16. PLAYER_READ checked
17. Player loaded
18. Ownership checked
19. Data returned
```

An admin assigns a coach role:

``` text
20. PUT /api/users/:userId/role
21. JWT validated
22. USER_ROLE_ASSIGN checked
23. Role validated
24. User.roleId changed
25. Future authorization uses the new role
```

If the role is revoked:

``` text
26. DELETE /api/users/:userId/role
27. User role becomes ROLE_PLAYER
28. Current authorization immediately reflects the new role
```

------------------------------------------------------------------------

# 49. Final Architecture Principles

The project should follow these principles:

``` text
Identity ≠ Player Profile
Role ≠ Privilege
Authentication ≠ Authorization
RBAC ≠ Ownership
JWT ≠ Permanent Authorization State
Route ≠ Business Logic
Wearable Data ≠ User Identity
```

The core authorization equation is:

``` text
Authenticated User
+
Current Role
+
Required Privilege
+
Resource Scope
=
Authorized Operation
```

The long-term system should therefore evolve from:

``` text
Node.js + Express + MongoDB
```

into a modular analytics platform while keeping authentication,
authorization, player management, wearable sessions, and analytics
clearly separated.

------------------------------------------------------------------------

# 50. Single Source of Truth

This document should be treated as the project's **development
context**.

When adding a new feature, update the appropriate section:

``` text
Specifications
Architecture
Models
API
Authorization
Data flow
Testing
Security
```

Do not silently change an architectural decision in code without
updating the project context.

The project should remain:

``` text
Secure
Modular
Testable
Scalable
Wearable-ready
RBAC-driven
Ownership-aware
```
