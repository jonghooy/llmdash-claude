# dbGateway Migration Status

## Overview
Migration from direct Mongoose models to dbGateway abstraction layer for improved database flexibility.

## Migration Status

### ✅ Completed Models
1. **Conversation** - Full dbGateway integration with `conversationOperations.js`
2. **File** - Full dbGateway integration with `fileOperations.js`
3. **Preset** - Full dbGateway integration with `presetOperations.js`
4. **Agent** - Repository exists in dbGateway
5. **Prompt** - Repository exists in dbGateway
6. **Transaction** - Repository exists in dbGateway
7. **User** - Repository exists in dbGateway

### ⚠️ Hybrid Approach (Special Case)
1. **Message** - Using Mongoose directly due to UUID/ObjectId conflict
   - `messageOperations.js` created but `isDbGatewayEnabled()` returns false
   - Requires schema modification to properly support UUID as primary key

### ❌ Not Yet Migrated
1. **Action** - Used in system
2. **Assistant** - Used in assistants feature
3. **AuditLog** - Logging functionality
4. **Banner** - UI banners
5. **Categories** - Category management
6. **ConversationTag** - Tag functionality
7. **Project** - Project management
8. **Role** - RBAC system
9. **ToolCall** - Tool/function calling
10. **UserMetrics** - User analytics

## Current Configuration
- `USE_DB_GATEWAY=true` in .env
- dbGateway is enabled globally
- Message model bypasses dbGateway due to technical constraints

## Next Steps for Full Migration
1. Fix Message model UUID/ObjectId conflict
2. Create repositories for remaining models:
   - Assistant (priority - actively used)
   - ConversationTag (priority - actively used)
   - Action, AuditLog, Banner, Categories, Project, Role, ToolCall, UserMetrics
3. Create abstraction layers (Operations files) for each model
4. Test each migration thoroughly
5. Remove Mongoose direct dependencies once all models migrated

## Technical Notes
- Repository pattern implemented in `/packages/db-gateway/src/adapters/mongodb/repositories/`
- Abstraction layers in `/api/models/*Operations.js`
- Each model needs:
  1. Interface definition (`IXxxRepository.ts`)
  2. MongoDB repository implementation (`MongoXxxRepository.ts`)
  3. Registration in `MongoDbAdapter.ts`
  4. Operations abstraction layer (`xxxOperations.js`)
  5. Update model exports to use operations layer

## Benefits of Migration
- Database agnostic code
- Easier testing with mock repositories
- Cleaner separation of concerns
- Future-proof for database changes
- Better transaction support