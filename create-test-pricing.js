const { MongoClient } = require('mongodb');

async function createTestPricing() {
  const client = new MongoClient('mongodb://localhost:27017');

  try {
    await client.connect();
    const db = client.db('LibreChat');
    const collection = db.collection('modelpricing');

    // Sample pricing data for common models
    const pricingData = [
      {
        modelId: 'gpt-4.1',
        inputPrice: 30.00,   // $30 per 1M tokens
        outputPrice: 60.00,  // $60 per 1M tokens
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        modelId: 'gpt-5',
        inputPrice: 5.00,    // $5 per 1M tokens
        outputPrice: 15.00,  // $15 per 1M tokens
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        modelId: 'gpt-5-mini',
        inputPrice: 0.15,    // $0.15 per 1M tokens
        outputPrice: 0.60,   // $0.60 per 1M tokens
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        modelId: 'gemini-2.5-flash',
        inputPrice: 0.075,   // $0.075 per 1M tokens
        outputPrice: 0.30,   // $0.30 per 1M tokens
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        modelId: 'gemini-2.5-pro',
        inputPrice: 3.50,    // $3.50 per 1M tokens
        outputPrice: 10.50,  // $10.50 per 1M tokens
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Clear existing data and insert new
    await collection.deleteMany({});
    const result = await collection.insertMany(pricingData);

    console.log(`Inserted ${result.insertedCount} pricing records`);
    console.log('Model pricing data created successfully!');

  } catch (error) {
    console.error('Error creating pricing data:', error);
  } finally {
    await client.close();
  }
}

createTestPricing();