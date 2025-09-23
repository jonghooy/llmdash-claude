# Database Gateway Migration Guide

This guide explains how to migrate existing code to use the new Database Gateway (dbGateway) abstraction layer.

## Quick Start

### 1. Install the Package

First, ensure the db-gateway package is built:

```bash
cd LibreChat/packages/db-gateway
npm install
npm run build
```

### 2. Update Your Imports

#### Old Way (Direct MongoDB/Mongoose)
```javascript
const { User } = require('~/db/models');
const mongoose = require('mongoose');
```

#### New Way (Database Gateway)
```javascript
const { getRepository } = require('~/db/gateway');
```

## Migration Examples

### User Operations

#### Finding a User by ID

**Before:**
```javascript
const { User } = require('~/db/models');

async function getUser(userId) {
  const user = await User.findById(userId);
  return user;
}
```

**After:**
```javascript
const { getRepository } = require('~/db/gateway');

async function getUser(userId) {
  const userRepo = getRepository('User');
  const user = await userRepo.findById(userId);
  return user;
}
```

#### Finding a User by Email

**Before:**
```javascript
const user = await User.findOne({ email: email.toLowerCase() });
```

**After:**
```javascript
const userRepo = getRepository('User');
const user = await userRepo.findByEmail(email);
```

#### Creating a User

**Before:**
```javascript
const user = new User({
  email,
  username,
  name,
  password: hashedPassword
});
await user.save();
```

**After:**
```javascript
const userRepo = getRepository('User');
const user = await userRepo.create({
  email,
  username,
  name,
  password: hashedPassword
});
```

### Message Operations

#### Finding Messages by Conversation

**Before:**
```javascript
const { Message } = require('~/db/models');

const messages = await Message.find({ conversationId })
  .sort({ createdAt: -1 })
  .limit(50)
  .lean();
```

**After:**
```javascript
const messageRepo = getRepository('Message');
const messages = await messageRepo.findByConversationId(conversationId, 50);
```

#### Saving a Message

**Before:**
```javascript
const message = await Message.findOneAndUpdate(
  { messageId },
  {
    text,
    conversationId,
    sender,
    isCreatedByUser,
    // ... other fields
  },
  { upsert: true, new: true }
);
```

**After:**
```javascript
const messageRepo = getRepository('Message');
let message = await messageRepo.findByMessageId(messageId);

if (message) {
  message = await messageRepo.update(message._id, {
    text,
    // ... other fields
  });
} else {
  message = await messageRepo.create({
    messageId,
    text,
    conversationId,
    sender,
    isCreatedByUser,
    // ... other fields
  });
}
```

### Conversation Operations

#### Getting User Conversations

**Before:**
```javascript
const { Conversation } = require('~/db/models');

const conversations = await Conversation.find({ user: userId })
  .sort({ updatedAt: -1 })
  .limit(100)
  .lean();
```

**After:**
```javascript
const conversationRepo = getRepository('Conversation');
const conversations = await conversationRepo.getUserConversations(userId, 100);
```

### Transaction Operations

#### Using Transactions

**Before:**
```javascript
const session = await mongoose.startSession();
await session.withTransaction(async () => {
  await User.findByIdAndUpdate(userId, updateData, { session });
  await Message.deleteMany({ user: userId }, { session });
});
await session.endSession();
```

**After:**
```javascript
const { executeTransaction } = require('~/db/gateway');

await executeTransaction(async (transaction) => {
  const userRepo = getRepository('User');
  const messageRepo = getRepository('Message');

  await userRepo.update(userId, updateData, transaction);
  await messageRepo.deleteMany({ user: userId }, transaction);
});
```

## Connection Management

### Application Startup

**Before (in server/index.js):**
```javascript
const { connectDb } = require('~/db');
await connectDb();
```

**After (in server/index.js):**
```javascript
const { initDbGateway } = require('~/db/gateway');
await initDbGateway();
```

### Health Checks

**Before:**
```javascript
const mongoose = require('mongoose');
const isHealthy = mongoose.connection.readyState === 1;
```

**After:**
```javascript
const { getDbGateway } = require('~/db/gateway');
const isHealthy = await getDbGateway().healthCheck();
```

## Service Layer Example

Here's how to update a service to use the repository pattern:

### UserService.js

**Before:**
```javascript
const { User } = require('~/db/models');

class UserService {
  async getUserById(userId) {
    return await User.findById(userId).select('-password');
  }

  async updateUser(userId, data) {
    return await User.findByIdAndUpdate(
      userId,
      data,
      { new: true }
    ).select('-password');
  }

  async searchUsers(query) {
    return await User.find({
      $or: [
        { username: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') },
        { name: new RegExp(query, 'i') }
      ]
    }).limit(10).select('-password');
  }
}
```

**After:**
```javascript
const { getRepository } = require('~/db/gateway');

class UserService {
  constructor() {
    this.userRepo = null;
  }

  getUserRepo() {
    if (!this.userRepo) {
      this.userRepo = getRepository('User');
    }
    return this.userRepo;
  }

  async getUserById(userId) {
    const user = await this.getUserRepo().findById(userId, {
      select: '-password'
    });
    return user;
  }

  async updateUser(userId, data) {
    const user = await this.getUserRepo().update(userId, data);
    if (user) {
      delete user.password;
    }
    return user;
  }

  async searchUsers(query) {
    return await this.getUserRepo().searchUsers(query, 10);
  }
}
```

## Testing with DbGateway

### Unit Testing with Mocked Repositories

```javascript
// userService.test.js
const { UserService } = require('./UserService');

describe('UserService', () => {
  let userService;
  let mockUserRepo;

  beforeEach(() => {
    // Create mock repository
    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    // Mock getRepository to return our mock
    jest.mock('~/db/gateway', () => ({
      getRepository: (name) => {
        if (name === 'User') return mockUserRepo;
      }
    }));

    userService = new UserService();
  });

  test('should get user by ID', async () => {
    const mockUser = { _id: '123', name: 'Test User' };
    mockUserRepo.findById.mockResolvedValue(mockUser);

    const user = await userService.getUserById('123');

    expect(mockUserRepo.findById).toHaveBeenCalledWith('123', {
      select: '-password'
    });
    expect(user).toEqual(mockUser);
  });
});
```

## Benefits of Migration

1. **Database Independence**: Your code no longer depends on MongoDB/Mongoose directly
2. **Easier Testing**: Mock repositories instead of database connections
3. **Consistent API**: All database operations follow the same pattern
4. **Type Safety**: With TypeScript support in the gateway
5. **Transaction Abstraction**: Database-agnostic transaction handling
6. **Future Flexibility**: Easy to switch to PostgreSQL or other databases

## Gradual Migration Strategy

You don't need to migrate everything at once. The dbGateway can coexist with existing Mongoose code:

1. **Phase 1**: Start using dbGateway for new features
2. **Phase 2**: Migrate read operations in existing code
3. **Phase 3**: Migrate write operations
4. **Phase 4**: Migrate transaction operations
5. **Phase 5**: Remove direct Mongoose dependencies

## Common Patterns

### Pagination
```javascript
const userRepo = getRepository('User');
const result = await userRepo.findWithPagination(
  { role: 'user' },
  { page: 1, limit: 20, sort: { createdAt: -1 } }
);
// Returns: { data: [...], total: 100, page: 1, limit: 20, pages: 5 }
```

### Bulk Operations
```javascript
const messageRepo = getRepository('Message');
await messageRepo.createMany([...messages]);
await messageRepo.updateMany({ conversationId }, { archived: true });
```

### Existence Checks
```javascript
const userRepo = getRepository('User');
const emailExists = await userRepo.emailExists('user@example.com');
const hasUsers = await userRepo.exists({ role: 'admin' });
```

## Troubleshooting

### Issue: "Repository for entity not found"
**Solution**: Ensure the entity name matches exactly (case-sensitive): 'User', 'Message', 'Conversation'

### Issue: "Database Gateway not initialized"
**Solution**: Make sure `initDbGateway()` is called before any repository operations

### Issue: Transaction not working
**Solution**: Use the transaction object passed to your callback, not a direct session

## Next Steps

1. Review the [DBGATEWAY_PLAN.md](./DBGATEWAY_PLAN.md) for the full implementation plan
2. Start with low-risk entities for migration
3. Update tests to use mock repositories
4. Gradually migrate services and controllers
5. Monitor performance and optimize as needed