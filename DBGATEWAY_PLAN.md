# Database Gateway (dbGateway) Implementation Plan

## Overview
This document outlines the plan to create a database abstraction layer (dbGateway) for LibreChat, decoupling the application from direct MongoDB dependency and enabling future database flexibility.

## Current Architecture Analysis

### Existing Database Integration
- **Direct MongoDB Coupling**: Application tightly coupled with MongoDB through Mongoose
  - Connection managed in `/api/db/connect.js`
  - Models defined in `/packages/data-schemas/src/models/`
  - Methods in `/packages/data-schemas/src/methods/`
  - Direct Mongoose usage throughout controllers and services

### Model Structure
- Models created through factory functions in `@librechat/data-schemas` package
- Each model has dedicated file (user.ts, message.ts, conversation.ts, etc.)
- Direct model access via imports: `const { User } = require('~/db/models')`

### Database Operations
- Direct model methods: `User.find()`, `Message.save()`, etc.
- Custom methods in `/api/models/` files
- Transaction support using MongoDB sessions
- Direct mongoose queries throughout codebase

## Implementation Plan

### Phase 1: Create Database Gateway Structure

#### Directory Structure
```
/packages/db-gateway/
├── src/
│   ├── interfaces/
│   │   ├── IDbGateway.ts
│   │   ├── IUserRepository.ts
│   │   ├── IMessageRepository.ts
│   │   ├── IConversationRepository.ts
│   │   ├── IFileRepository.ts
│   │   ├── ITransactionRepository.ts
│   │   ├── IAgentRepository.ts
│   │   ├── IPromptRepository.ts
│   │   └── ... (other repositories)
│   ├── adapters/
│   │   ├── mongodb/
│   │   │   ├── MongoDbAdapter.ts
│   │   │   ├── MongoTransactionManager.ts
│   │   │   ├── repositories/
│   │   │   │   ├── MongoUserRepository.ts
│   │   │   │   ├── MongoMessageRepository.ts
│   │   │   │   ├── MongoConversationRepository.ts
│   │   │   │   └── ... (other repositories)
│   │   └── future/
│   │       ├── postgresql/
│   │       └── redis/
│   ├── common/
│   │   ├── QueryBuilder.ts
│   │   ├── PaginationHelper.ts
│   │   └── TransactionManager.ts
│   ├── DbGateway.ts (main entry point)
│   ├── DbGatewayFactory.ts
│   └── index.ts
├── tests/
├── package.json
└── tsconfig.json
```

### Phase 2: Implement MongoDB Adapter

#### Core Components

1. **DbGateway Interface**
```typescript
interface IDbGateway {
  connect(config: DbConfig): Promise<void>;
  disconnect(): Promise<void>;
  getRepository<T>(entityName: string): IRepository<T>;
  transaction<T>(callback: (session: ITransaction) => Promise<T>): Promise<T>;
  healthCheck(): Promise<boolean>;
}
```

2. **Repository Pattern Interface**
```typescript
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findOne(query: QueryFilter): Promise<T | null>;
  find(query: QueryFilter, options?: QueryOptions): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(query: QueryFilter): Promise<number>;
  aggregate(pipeline: any[]): Promise<any[]>;
}
```

3. **Example User Repository Interface**
```typescript
interface IUserRepository extends IRepository<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findByUsername(username: string): Promise<IUser | null>;
  updateLastLogin(userId: string): Promise<void>;
  findWithRoles(userId: string): Promise<IUser | null>;
  bulkCreate(users: CreateUserDto[]): Promise<IUser[]>;
}
```

### Phase 3: Gradual Migration Strategy

#### Migration Priorities
1. **Low-Risk Entities** (Start Here)
   - Banner
   - Categories
   - AuditLog

2. **Medium-Risk Entities**
   - Files
   - Presets
   - Assistants
   - Agents

3. **High-Risk Core Entities**
   - User
   - Message
   - Conversation
   - Transaction

#### Migration Steps for Each Module
1. Create repository interface
2. Implement MongoDB repository
3. Add unit tests
4. Update service layer to use repository
5. Update controller to use new service
6. Run parallel testing
7. Remove old direct model usage

### Phase 4: Update Application Layer

#### Connection Management
```typescript
// /api/db/gateway.js
const { DbGatewayFactory } = require('@librechat/db-gateway');

let dbGateway;

async function initDbGateway() {
  dbGateway = DbGatewayFactory.create('mongodb', {
    uri: process.env.MONGO_URI,
    options: {
      maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE),
      // ... other options
    }
  });

  await dbGateway.connect();
  return dbGateway;
}

module.exports = { initDbGateway, getDbGateway: () => dbGateway };
```

#### Service Layer Update Example
```typescript
// Before
const { User } = require('~/db/models');
const user = await User.findById(userId);

// After
const { getDbGateway } = require('~/db/gateway');
const userRepo = getDbGateway().getRepository('User');
const user = await userRepo.findById(userId);
```

### Phase 5: Testing & Validation

#### Testing Strategy
1. **Unit Tests**
   - Mock repositories for business logic testing
   - Test each repository method independently

2. **Integration Tests**
   - Test with actual MongoDB instance
   - Verify transaction handling
   - Test complex queries

3. **Performance Testing**
   - Benchmark before/after migration
   - Monitor query performance
   - Check connection pool efficiency

4. **Parallel Testing**
   - Run old and new implementations side by side
   - Compare results for consistency
   - Gradual traffic migration

### Phase 6: Future Database Support

#### PostgreSQL Adapter Preparation
```typescript
interface IPostgreSQLAdapter extends IDbGateway {
  // PostgreSQL-specific methods
  executeRawQuery(sql: string, params: any[]): Promise<any>;
  createSchema(name: string): Promise<void>;
}
```

#### Redis Cache Layer
```typescript
interface ICacheLayer {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
}
```

## Implementation Schedule

### Week 1: Foundation
- [ ] Create db-gateway package structure
- [ ] Define all interfaces
- [ ] Implement base DbGateway class
- [ ] Create MongoDB adapter skeleton

### Week 2: MongoDB Adapter
- [ ] Implement MongoDbAdapter
- [ ] Create first 3 repositories (Banner, Categories, AuditLog)
- [ ] Add transaction support
- [ ] Write unit tests

### Week 3-4: Migration Phase 1
- [ ] Migrate low-risk entities
- [ ] Update corresponding services
- [ ] Integration testing
- [ ] Performance benchmarking

### Week 5-6: Migration Phase 2
- [ ] Migrate medium-risk entities
- [ ] Implement complex query patterns
- [ ] Add caching preparation
- [ ] Documentation

### Week 7-8: Core Entity Migration
- [ ] Migrate User, Message, Conversation
- [ ] Extensive testing
- [ ] Performance optimization
- [ ] Rollback procedures

## Benefits

1. **Database Independence**: Switch databases without changing business logic
2. **Improved Testability**: Easy mocking of database operations
3. **Better Maintainability**: Centralized database logic
4. **Enhanced Scalability**: Easy to add caching, sharding, read replicas
5. **Type Safety**: Strong typing throughout the application
6. **Transaction Abstraction**: Database-agnostic transaction handling

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing functionality | High | Gradual migration, extensive testing, feature flags |
| Performance degradation | Medium | Benchmark critical paths, optimize queries |
| Increased complexity | Medium | Clear documentation, consistent patterns |
| Migration errors | High | Rollback procedures, data validation |
| Team learning curve | Low | Training sessions, pair programming |

## Success Metrics

- Zero downtime during migration
- No performance degradation (< 5% latency increase)
- 100% test coverage for repository layer
- Successful parallel testing for 1 week
- All existing features working correctly

## Future Enhancements

1. **Multi-database Support**
   - PostgreSQL for relational data
   - Redis for caching
   - Elasticsearch for search

2. **Advanced Features**
   - Read/write splitting
   - Automatic sharding
   - Query optimization hints
   - Database migration tools

3. **Monitoring & Observability**
   - Query performance tracking
   - Connection pool monitoring
   - Slow query logging
   - Database health metrics

## Conclusion

The dbGateway implementation will provide LibreChat with a robust, scalable, and maintainable database abstraction layer. This architecture will enable future database flexibility while maintaining current functionality and performance.