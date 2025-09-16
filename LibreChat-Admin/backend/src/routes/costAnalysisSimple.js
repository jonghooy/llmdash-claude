const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Define simple schemas for the collections we need
const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  model: String,
  promptTokens: Number,
  completionTokens: Number,
  createdAt: Date,
  tokenType: String,
  rate: Number
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  username: String
});

// Get or create models
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema, 'transactions');
const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');

// Helper function to generate mock data when no real data exists
function generateMockData(startDate, endDate) {
  const models = [
    'gpt-4.1', 'gpt-5', 'claude-opus-4-1-20250805',
    'claude-sonnet-4-20250514', 'gemini-2.5-flash', 'gemini-2.5-pro'
  ];

  const providers = {
    'gpt-4.1': 'openai',
    'gpt-5': 'openai',
    'claude-opus-4-1-20250805': 'anthropic',
    'claude-sonnet-4-20250514': 'anthropic',
    'gemini-2.5-flash': 'google',
    'gemini-2.5-pro': 'google'
  };

  const pricing = {
    'gpt-4.1': { input: 3.70, output: 11.10 },
    'gpt-5': { input: 1.25, output: 10.00 },
    'claude-opus-4-1-20250805': { input: 15.00, output: 75.00 },
    'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
    'gemini-2.5-flash': { input: 0.15, output: 0.60 },
    'gemini-2.5-pro': { input: 1.25, output: 5.00 }
  };

  const totalCost = Math.random() * 100 + 50;
  const totalTokens = Math.floor(Math.random() * 1000000 + 500000);
  const totalConversations = Math.floor(Math.random() * 1000 + 100);

  const modelUsage = models.map(model => ({
    model,
    provider: providers[model],
    inputTokens: Math.floor(Math.random() * 100000 + 10000),
    outputTokens: Math.floor(Math.random() * 50000 + 5000),
    cost: Math.random() * 20 + 5,
    conversationCount: Math.floor(Math.random() * 100 + 10)
  }));

  const dailyUsage = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dailyUsage.push({
      date: new Date(current).toISOString().split('T')[0],
      cost: Math.random() * 10 + 2,
      tokens: Math.floor(Math.random() * 100000 + 10000),
      conversations: Math.floor(Math.random() * 50 + 5)
    });
    current.setDate(current.getDate() + 1);
  }

  const topUsers = [
    { userId: '1', name: 'John Doe', email: 'john@example.com', totalCost: Math.random() * 30 + 10, totalTokens: Math.floor(Math.random() * 200000 + 50000) },
    { userId: '2', name: 'Jane Smith', email: 'jane@example.com', totalCost: Math.random() * 25 + 8, totalTokens: Math.floor(Math.random() * 150000 + 40000) },
    { userId: '3', name: 'Bob Johnson', email: 'bob@example.com', totalCost: Math.random() * 20 + 5, totalTokens: Math.floor(Math.random() * 100000 + 30000) }
  ];

  return {
    totalCost,
    totalTokens,
    totalConversations,
    modelUsage,
    dailyUsage,
    topUsers,
    averageCostPerConversation: totalCost / totalConversations,
    mostUsedModel: modelUsage[0].model,
    costTrend: 'increasing'
  };
}

// Get cost analysis overview
router.get('/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Try to fetch real data first
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const transactions = await Transaction.find({
        createdAt: { $gte: start, $lte: end }
      }).populate('user', 'name email username').lean();

      if (transactions && transactions.length > 0) {
        // Process real data
        const overview = {
          totalCost: 0,
          totalTokens: 0,
          totalConversations: transactions.length,
          modelUsage: {},
          dailyUsage: {},
          topUsers: {}
        };

        // Process transactions
        transactions.forEach(transaction => {
          // Use actual field names from MongoDB
          const tokens = Math.abs(transaction.rawAmount || 0);
          const rate = transaction.rate || 0; // Price per million tokens
          // Calculate cost: (tokens / 1,000,000) * rate
          const cost = (tokens / 1000000) * rate;
          const isPrompt = transaction.tokenType === 'prompt';

          overview.totalCost += cost;
          overview.totalTokens += tokens;

          // Model usage
          if (!overview.modelUsage[transaction.model]) {
            overview.modelUsage[transaction.model] = {
              model: transaction.model,
              inputTokens: 0,
              outputTokens: 0,
              cost: 0,
              conversationCount: 0
            };
          }
          // Split tokens between input and output based on tokenType
          if (isPrompt) {
            overview.modelUsage[transaction.model].inputTokens += tokens;
          } else {
            overview.modelUsage[transaction.model].outputTokens += tokens;
          }
          overview.modelUsage[transaction.model].cost += cost;
          overview.modelUsage[transaction.model].conversationCount++;

          // Daily usage
          const dateKey = new Date(transaction.createdAt).toISOString().split('T')[0];
          if (!overview.dailyUsage[dateKey]) {
            overview.dailyUsage[dateKey] = {
              date: dateKey,
              cost: 0,
              tokens: 0,
              conversations: 0
            };
          }
          overview.dailyUsage[dateKey].cost += cost;
          overview.dailyUsage[dateKey].tokens += tokens;
          overview.dailyUsage[dateKey].conversations++;

          // Top users
          if (transaction.user) {
            const userId = transaction.user._id || transaction.user;
            if (!overview.topUsers[userId]) {
              overview.topUsers[userId] = {
                userId,
                name: transaction.user.name || transaction.user.username || 'Unknown',
                email: transaction.user.email || 'N/A',
                totalCost: 0,
                totalTokens: 0
              };
            }
            overview.topUsers[userId].totalCost += cost;
            overview.topUsers[userId].totalTokens += tokens;
          }
        });

        // Convert objects to arrays
        overview.modelUsage = Object.values(overview.modelUsage);
        overview.dailyUsage = Object.values(overview.dailyUsage);
        overview.topUsers = Object.values(overview.topUsers)
          .sort((a, b) => b.totalCost - a.totalCost)
          .slice(0, 10);

        overview.averageCostPerConversation = overview.totalCost / overview.totalConversations;
        overview.mostUsedModel = overview.modelUsage.reduce((max, model) =>
          model.conversationCount > (max?.conversationCount || 0) ? model : max, null)?.model;
        overview.costTrend = 'stable';

        return res.json(overview);
      }
    } catch (dbError) {
      console.log('Database query failed, using mock data:', dbError.message);
    }

    // Return mock data if no real data or database error
    const mockData = generateMockData(startDate, endDate);
    res.json(mockData);

  } catch (error) {
    console.error('Error in cost analysis overview:', error);
    res.status(500).json({ error: 'Failed to fetch cost analysis data' });
  }
});

// Get detailed usage by model
router.get('/by-model', async (req, res) => {
  try {
    const { startDate, endDate, model } = req.query;

    // Return mock data
    const models = model ? [model] : ['gpt-4.1', 'gpt-5', 'claude-opus-4-1-20250805'];
    const data = models.map(m => ({
      model: m,
      totalInputTokens: Math.floor(Math.random() * 1000000 + 100000),
      totalOutputTokens: Math.floor(Math.random() * 500000 + 50000),
      totalCost: Math.random() * 100 + 20,
      conversationCount: Math.floor(Math.random() * 1000 + 100),
      averageInputTokens: Math.floor(Math.random() * 1000 + 100),
      averageOutputTokens: Math.floor(Math.random() * 500 + 50)
    }));

    res.json(data);
  } catch (error) {
    console.error('Error fetching model usage:', error);
    res.status(500).json({ error: 'Failed to fetch model usage data' });
  }
});

// Get usage by user
router.get('/by-user', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    // Return mock data
    const users = [
      { userId: '1', name: 'John Doe', email: 'john@example.com' },
      { userId: '2', name: 'Jane Smith', email: 'jane@example.com' },
      { userId: '3', name: 'Bob Johnson', email: 'bob@example.com' }
    ];

    const data = users.map(user => ({
      ...user,
      totalCost: Math.random() * 50 + 10,
      totalTokens: Math.floor(Math.random() * 500000 + 50000),
      conversationCount: Math.floor(Math.random() * 500 + 50),
      models: ['gpt-4.1', 'claude-opus-4-1-20250805'],
      lastActive: new Date().toISOString()
    }));

    res.json(userId ? data.filter(u => u.userId === userId) : data);
  } catch (error) {
    console.error('Error fetching user usage:', error);
    res.status(500).json({ error: 'Failed to fetch user usage data' });
  }
});

// Get detailed transactions
router.get('/detailed', async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Try to fetch real data from MongoDB
    const query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('user', 'name email username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments(query)
    ]);

    // Transform transactions to match frontend expectations
    const formattedTransactions = transactions.map(tx => ({
      id: tx._id.toString(),
      date: tx.createdAt?.toISOString() || new Date().toISOString(),
      user: tx.user?.name || tx.user?.username || tx.user?.email || 'Unknown',
      userId: tx.user?._id?.toString() || tx.user || 'unknown',
      model: tx.model || 'unknown',
      conversationId: tx.conversationId || '',
      tokenType: tx.tokenType || 'unknown',
      tokens: Math.abs(tx.rawAmount || 0),
      // Calculate cost: (tokens / 1,000,000) * rate
      cost: ((Math.abs(tx.rawAmount || 0) / 1000000) * (tx.rate || 0)).toFixed(6),
      context: tx.context || ''
    }));

    res.json({
      transactions: formattedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching detailed transactions:', error);
    res.status(500).json({ error: 'Failed to fetch detailed transactions' });
  }
});

// Get model usage statistics
router.get('/models-usage', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Generate mock model usage data
    const models = [
      { name: 'gpt-4.1', provider: 'openai', color: '#10B981' },
      { name: 'gpt-5', provider: 'openai', color: '#3B82F6' },
      { name: 'claude-opus-4-1-20250805', provider: 'anthropic', color: '#8B5CF6' },
      { name: 'claude-sonnet-4-20250514', provider: 'anthropic', color: '#EC4899' },
      { name: 'gemini-2.5-flash', provider: 'google', color: '#F59E0B' },
      { name: 'gemini-2.5-pro', provider: 'google', color: '#EF4444' }
    ];

    const modelUsage = models.map(model => ({
      model: model.name,
      provider: model.provider,
      color: model.color,
      totalRequests: Math.floor(Math.random() * 1000 + 100),
      totalTokens: Math.floor(Math.random() * 1000000 + 100000),
      totalCost: Math.random() * 100 + 10,
      averageTokensPerRequest: Math.floor(Math.random() * 1000 + 100),
      percentage: Math.random() * 30 + 5,
      dailyUsage: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requests: Math.floor(Math.random() * 50 + 5),
        tokens: Math.floor(Math.random() * 50000 + 5000),
        cost: Math.random() * 5 + 0.5
      }))
    }));

    res.json(modelUsage);
  } catch (error) {
    console.error('Error fetching model usage:', error);
    res.status(500).json({ error: 'Failed to fetch model usage' });
  }
});

// Export cost report
router.get('/export', async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    const data = generateMockData(startDate, endDate);

    if (format === 'csv') {
      // Simple CSV generation
      let csv = 'Date,Cost,Tokens,Conversations\n';
      data.dailyUsage.forEach(day => {
        csv += `${day.date},${day.cost},${day.tokens},${day.conversations}\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=cost-report.csv');
      res.send(csv);
    } else {
      res.json(data);
    }
  } catch (error) {
    console.error('Error exporting cost report:', error);
    res.status(500).json({ error: 'Failed to export cost report' });
  }
});

module.exports = router;