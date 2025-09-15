const mongoose = require('mongoose');
const Prompt = require('./src/models/Prompt');

async function testPrompts() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/LibreChat');
    console.log('Connected to MongoDB');

    // Test data
    const testPrompt = {
      name: 'Code Review Assistant',
      description: 'A comprehensive code review prompt with customizable parameters',
      category: 'coding',
      prompt: `Please review the following {{language}} code:

{{code}}

Focus on:
1. Code quality and best practices
2. Potential bugs or errors
3. Performance optimization opportunities
4. Security considerations
5. Suggestions for improvement`,
      variables: [
        {
          name: 'language',
          description: 'Programming language',
          defaultValue: 'JavaScript'
        },
        {
          name: 'code',
          description: 'Code to review',
          defaultValue: ''
        }
      ],
      isPublic: true,
      tags: ['code-review', 'development', 'quality'],
      createdBy: new mongoose.Types.ObjectId()
    };

    console.log('\n=== Test 1: Create Prompt ===');
    const created = await Prompt.create(testPrompt);
    console.log('Created prompt:', created._id);

    console.log('\n=== Test 2: Find All Prompts ===');
    const allPrompts = await Prompt.find();
    console.log('Total prompts:', allPrompts.length);

    console.log('\n=== Test 3: Find by Category ===');
    const codingPrompts = await Prompt.find({ category: 'coding' });
    console.log('Coding prompts:', codingPrompts.length);

    console.log('\n=== Test 4: Test Variable Substitution ===');
    const rendered = created.applyVariables({
      language: 'Python',
      code: 'def hello(): print("Hello")'
    });
    console.log('Rendered prompt:', rendered.substring(0, 100) + '...');

    console.log('\n=== Test 5: Increment Usage ===');
    await created.incrementUsage();
    console.log('Usage count:', created.usageCount);

    console.log('\n=== Test 6: Test hasAccess Method ===');
    const hasAccess = created.hasAccess(
      created.createdBy,
      null,
      []
    );
    console.log('Creator has access:', hasAccess);

    // Create more test data
    const categories = ['general', 'writing', 'analysis', 'creative', 'business'];
    console.log('\n=== Test 7: Create Multiple Prompts ===');
    
    for (let i = 0; i < 5; i++) {
      const prompt = await Prompt.create({
        name: `Test Prompt ${i + 1}`,
        description: `Test description for prompt ${i + 1}`,
        category: categories[i],
        prompt: `This is test prompt number {{number}}`,
        variables: [{
          name: 'number',
          description: 'Prompt number',
          defaultValue: String(i + 1)
        }],
        isPublic: i % 2 === 0,
        tags: [`test`, `category-${categories[i]}`],
        createdBy: new mongoose.Types.ObjectId(),
        usageCount: Math.floor(Math.random() * 100),
        rating: Math.floor(Math.random() * 5) + 1
      });
      console.log(`Created: ${prompt.name} (${prompt.category})`);
    }

    console.log('\n=== Test 8: Query with Filters ===');
    const publicPrompts = await Prompt.find({ isPublic: true });
    console.log('Public prompts:', publicPrompts.length);

    const highUsage = await Prompt.find({ usageCount: { $gt: 50 } });
    console.log('High usage prompts (>50):', highUsage.length);

    console.log('\n=== Test 9: Search by Tags ===');
    const testTags = await Prompt.find({ tags: 'test' });
    console.log('Prompts with "test" tag:', testTags.length);

    console.log('\n=== Test 10: Update Prompt ===');
    created.rating = 5;
    created.description = 'Updated description';
    await created.save();
    console.log('Updated rating to:', created.rating);

    console.log('\n=== All Tests Completed Successfully! ===');
    
    // Show summary
    const summary = await Prompt.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          totalUsage: { $sum: '$usageCount' }
        }
      }
    ]);
    
    console.log('\n=== Summary by Category ===');
    console.table(summary);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run tests
testPrompts();