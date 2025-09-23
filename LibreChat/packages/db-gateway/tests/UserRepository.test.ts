import { IDbGateway } from '../src/interfaces/IDbGateway';
import { IUserRepository } from '../src/interfaces/IUserRepository';
import { setupTestDb, teardownTestDb, clearDatabase } from './setup';

describe('UserRepository Integration Tests', () => {
  let dbGateway: IDbGateway;
  let userRepo: IUserRepository;

  beforeAll(async () => {
    dbGateway = await setupTestDb();
    userRepo = dbGateway.getRepository<IUserRepository>('User');
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('CRUD Operations', () => {
    test('should create a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
      };

      const user = await userRepo.create(userData);

      expect(user).toBeDefined();
      expect(user._id).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
    });

    test('should find user by ID', async () => {
      const userData = {
        username: 'findbyid',
        email: 'findbyid@example.com',
        name: 'Find By ID',
      };

      const createdUser = await userRepo.create(userData);
      const foundUser = await userRepo.findById(createdUser._id);

      expect(foundUser).toBeDefined();
      expect(foundUser?._id).toBe(createdUser._id);
      expect(foundUser?.username).toBe('findbyid');
    });

    test('should update user', async () => {
      const user = await userRepo.create({
        username: 'updateme',
        email: 'update@example.com',
        name: 'Original Name',
      });

      const updated = await userRepo.update(user._id, {
        name: 'Updated Name',
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.username).toBe('updateme'); // Unchanged
    });

    test('should delete user', async () => {
      const user = await userRepo.create({
        username: 'deleteme',
        email: 'delete@example.com',
        name: 'Delete Me',
      });

      const deleted = await userRepo.delete(user._id);
      expect(deleted).toBe(true);

      const foundUser = await userRepo.findById(user._id);
      expect(foundUser).toBeNull();
    });
  });

  describe('User-specific Methods', () => {
    test('should find user by email', async () => {
      await userRepo.create({
        username: 'emailuser',
        email: 'findme@example.com',
        name: 'Email User',
      });

      const user = await userRepo.findByEmail('findme@example.com');
      expect(user).toBeDefined();
      expect(user?.email).toBe('findme@example.com');
    });

    test('should find user by username', async () => {
      await userRepo.create({
        username: 'uniqueusername',
        email: 'unique@example.com',
        name: 'Unique User',
      });

      const user = await userRepo.findByUsername('uniqueusername');
      expect(user).toBeDefined();
      expect(user?.username).toBe('uniqueusername');
    });

    test('should check if email exists', async () => {
      await userRepo.create({
        username: 'checkexist',
        email: 'exists@example.com',
        name: 'Exists User',
      });

      const exists = await userRepo.emailExists('exists@example.com');
      const notExists = await userRepo.emailExists('notexists@example.com');

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });

    test('should search users', async () => {
      await userRepo.create({
        username: 'john_doe',
        email: 'john@example.com',
        name: 'John Doe',
      });

      await userRepo.create({
        username: 'jane_doe',
        email: 'jane@example.com',
        name: 'Jane Doe',
      });

      await userRepo.create({
        username: 'bob_smith',
        email: 'bob@example.com',
        name: 'Bob Smith',
      });

      const searchResults = await userRepo.searchUsers('doe', 10);
      expect(searchResults).toHaveLength(2);
      expect(searchResults.every(u =>
        u.username?.includes('doe') ||
        u.name?.includes('Doe')
      )).toBe(true);
    });

    test('should bulk create users', async () => {
      const users = [
        {
          username: 'bulk1',
          email: 'bulk1@example.com',
          name: 'Bulk User 1',
        },
        {
          username: 'bulk2',
          email: 'bulk2@example.com',
          name: 'Bulk User 2',
        },
        {
          username: 'bulk3',
          email: 'bulk3@example.com',
          name: 'Bulk User 3',
        },
      ];

      const created = await userRepo.bulkCreate(users);
      expect(created).toHaveLength(3);
      expect(created[0].username).toBe('bulk1');
      expect(created[2].email).toBe('bulk3@example.com');
    });
  });

  describe('Pagination', () => {
    test('should paginate users', async () => {
      // Create 15 users
      for (let i = 1; i <= 15; i++) {
        await userRepo.create({
          username: `user${i}`,
          email: `user${i}@example.com`,
          name: `User ${i}`,
        });
      }

      // Get first page
      const page1 = await userRepo.findWithPagination(
        {},
        { page: 1, limit: 5 }
      );

      expect(page1.data).toHaveLength(5);
      expect(page1.total).toBe(15);
      expect(page1.pages).toBe(3);
      expect(page1.page).toBe(1);

      // Get second page
      const page2 = await userRepo.findWithPagination(
        {},
        { page: 2, limit: 5 }
      );

      expect(page2.data).toHaveLength(5);
      expect(page2.page).toBe(2);

      // Verify different users
      const page1Ids = page1.data.map(u => u._id);
      const page2Ids = page2.data.map(u => u._id);
      const intersection = page1Ids.filter(id => page2Ids.includes(id));
      expect(intersection).toHaveLength(0);
    });
  });

  describe('Transaction Support', () => {
    test('should rollback transaction on error', async () => {
      try {
        await dbGateway.transaction(async (session) => {
          await userRepo.create({
            username: 'transaction1',
            email: 'trans1@example.com',
            name: 'Transaction User 1',
          }, session);

          // This should cause the transaction to rollback
          throw new Error('Rollback test');
        });
      } catch (error) {
        // Expected error
      }

      // User should not exist due to rollback
      const user = await userRepo.findByEmail('trans1@example.com');
      expect(user).toBeNull();
    });

    test('should commit transaction on success', async () => {
      await dbGateway.transaction(async (session) => {
        await userRepo.create({
          username: 'transaction2',
          email: 'trans2@example.com',
          name: 'Transaction User 2',
        }, session);
      });

      // User should exist after successful transaction
      const user = await userRepo.findByEmail('trans2@example.com');
      expect(user).toBeDefined();
      expect(user?.username).toBe('transaction2');
    });
  });
});