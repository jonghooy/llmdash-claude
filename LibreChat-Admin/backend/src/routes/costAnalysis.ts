import express from 'express';
import mongoose from 'mongoose';
import ModelPricing from '../models/ModelPricing';

const router = express.Router();

// Helper function to calculate cost based on tokens and pricing
async function calculateCost(model: string, inputTokens: number, outputTokens: number) {
  try {
    // Find pricing for the model
    const pricing = await ModelPricing.findOne({ modelId: model });
    if (!pricing) {
      // Try to find by provider prefix
      const provider = model.startsWith('gpt') ? 'openai' : 
                      model.startsWith('claude') ? 'anthropic' : 
                      model.startsWith('gemini') ? 'google' : null;
      
      if (provider) {
        const defaultPricing = await ModelPricing.findOne({ 
          provider, 
          modelId: { $regex: new RegExp(model.split('-')[0], 'i') } 
        });
        if (defaultPricing) {
          return {
            inputCost: (inputTokens / 1000000) * defaultPricing.inputPrice,
            outputCost: (outputTokens / 1000000) * defaultPricing.outputPrice,
            totalCost: ((inputTokens / 1000000) * defaultPricing.inputPrice) + 
                      ((outputTokens / 1000000) * defaultPricing.outputPrice)
          };
        }
      }
      
      // Default pricing if model not found
      return {
        inputCost: (inputTokens / 1000000) * 5, // $5 per million tokens default
        outputCost: (outputTokens / 1000000) * 15, // $15 per million tokens default
        totalCost: ((inputTokens / 1000000) * 5) + ((outputTokens / 1000000) * 15)
      };
    }
    
    return {
      inputCost: (inputTokens / 1000000) * pricing.inputPrice,
      outputCost: (outputTokens / 1000000) * pricing.outputPrice,
      totalCost: ((inputTokens / 1000000) * pricing.inputPrice) + 
                ((outputTokens / 1000000) * pricing.outputPrice)
    };
  } catch (error) {
    console.error('Error calculating cost:', error);
    return { inputCost: 0, outputCost: 0, totalCost: 0 };
  }
}

// GET /api/cost-analysis/overview
router.get('/overview', async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    // Get database connection
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const transactionsCollection = db.collection('transactions');
    const usersCollection = db.collection('users');
    
    // Build query
    const query: any = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }
    if (userId) query.user = new mongoose.Types.ObjectId(userId as string);
    
    // Get all transactions
    const transactions = await transactionsCollection.find(query).toArray();
    
    // Get user information
    const userIds = [...new Set(transactions.map(t => t.user?.toString()).filter(Boolean))];
    const users = await usersCollection.find({ 
      _id: { $in: userIds.map(id => new mongoose.Types.ObjectId(id)) } 
    }).toArray();
    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user.name || user.email || 'Unknown';
      return acc;
    }, {} as Record<string, string>);
    
    // Calculate costs
    const modelCosts: Record<string, any> = {};
    const userCosts: Record<string, any> = {};
    const dailyCosts: Record<string, any> = {};
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;
    
    for (const transaction of transactions) {
      const tokens = Math.abs(transaction.rawAmount || 0);
      const isInput = transaction.tokenType === 'prompt';
      
      if (isInput) {
        totalInputTokens += tokens;
      } else {
        totalOutputTokens += tokens;
      }
      
      // Calculate cost for this transaction
      const cost = await calculateCost(
        transaction.model,
        isInput ? tokens : 0,
        isInput ? 0 : tokens
      );
      
      const transactionCost = isInput ? cost.inputCost : cost.outputCost;
      totalCost += transactionCost;
      
      // Aggregate by model
      if (!modelCosts[transaction.model]) {
        modelCosts[transaction.model] = {
          model: transaction.model,
          inputTokens: 0,
          outputTokens: 0,
          totalCost: 0,
          transactions: 0
        };
      }
      
      if (isInput) {
        modelCosts[transaction.model].inputTokens += tokens;
      } else {
        modelCosts[transaction.model].outputTokens += tokens;
      }
      modelCosts[transaction.model].totalCost += transactionCost;
      modelCosts[transaction.model].transactions += 1;
      
      // Aggregate by user
      const userKey = transaction.user?.toString() || 'unknown';
      const userName = userMap[userKey] || 'Unknown User';
      
      if (!userCosts[userKey]) {
        userCosts[userKey] = {
          userId: userKey,
          userName: userName,
          inputTokens: 0,
          outputTokens: 0,
          totalCost: 0,
          transactions: 0
        };
      }
      
      if (isInput) {
        userCosts[userKey].inputTokens += tokens;
      } else {
        userCosts[userKey].outputTokens += tokens;
      }
      userCosts[userKey].totalCost += transactionCost;
      userCosts[userKey].transactions += 1;
      
      // Aggregate by day
      const day = new Date(transaction.createdAt).toISOString().split('T')[0];
      if (!dailyCosts[day]) {
        dailyCosts[day] = {
          date: day,
          inputTokens: 0,
          outputTokens: 0,
          totalCost: 0,
          transactions: 0
        };
      }
      
      if (isInput) {
        dailyCosts[day].inputTokens += tokens;
      } else {
        dailyCosts[day].outputTokens += tokens;
      }
      dailyCosts[day].totalCost += transactionCost;
      dailyCosts[day].transactions += 1;
    }
    
    // Sort and prepare response
    const sortedModelCosts = Object.values(modelCosts)
      .sort((a: any, b: any) => b.totalCost - a.totalCost)
      .slice(0, 10);
    
    const sortedUserCosts = Object.values(userCosts)
      .sort((a: any, b: any) => b.totalCost - a.totalCost)
      .slice(0, 10);
    
    const sortedDailyCosts = Object.values(dailyCosts)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days
    
    res.json({
      summary: {
        totalCost: totalCost.toFixed(4),
        totalInputTokens,
        totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        totalTransactions: transactions.length,
        averageCostPerTransaction: transactions.length > 0 ? 
          (totalCost / transactions.length).toFixed(4) : '0'
      },
      byModel: sortedModelCosts,
      byUser: sortedUserCosts,
      byDay: sortedDailyCosts
    });
  } catch (error) {
    console.error('Error in cost analysis overview:', error);
    res.status(500).json({ error: 'Failed to fetch cost analysis data' });
  }
});

// GET /api/cost-analysis/detailed
router.get('/detailed', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      userId, 
      model, 
      page = 1, 
      limit = 50 
    } = req.query;
    
    // Get database connection
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const transactionsCollection = db.collection('transactions');
    const usersCollection = db.collection('users');
    
    // Build query
    const query: any = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }
    if (userId) query.user = new mongoose.Types.ObjectId(userId as string);
    if (model) query.model = model;
    
    // Get paginated transactions
    const skip = (Number(page) - 1) * Number(limit);
    const transactions = await transactionsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .toArray();
    
    const total = await transactionsCollection.countDocuments(query);
    
    // Get user information
    const userIds = [...new Set(transactions.map(t => t.user?.toString()).filter(Boolean))];
    const users = await usersCollection.find({ 
      _id: { $in: userIds.map(id => new mongoose.Types.ObjectId(id)) } 
    }).toArray();
    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user.name || user.email || 'Unknown';
      return acc;
    }, {} as Record<string, string>);
    
    // Calculate cost for each transaction
    const detailedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const tokens = Math.abs(transaction.rawAmount || 0);
        const isInput = transaction.tokenType === 'prompt';
        
        const cost = await calculateCost(
          transaction.model,
          isInput ? tokens : 0,
          isInput ? 0 : tokens
        );
        
        return {
          id: transaction._id,
          date: transaction.createdAt,
          user: userMap[transaction.user?.toString()] || 'Unknown',
          userId: transaction.user,
          model: transaction.model,
          conversationId: transaction.conversationId,
          tokenType: transaction.tokenType,
          tokens: tokens,
          cost: (isInput ? cost.inputCost : cost.outputCost).toFixed(6),
          context: transaction.context
        };
      })
    );
    
    res.json({
      transactions: detailedTransactions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error in detailed cost analysis:', error);
    res.status(500).json({ error: 'Failed to fetch detailed transactions' });
  }
});

// GET /api/cost-analysis/models-usage
router.get('/models-usage', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get database connection
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const transactionsCollection = db.collection('transactions');
    
    // Build query
    const query: any = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }
    
    // Aggregate by model
    const modelUsage = await transactionsCollection.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$model',
          totalTokens: { $sum: { $abs: '$rawAmount' } },
          promptTokens: {
            $sum: {
              $cond: [
                { $eq: ['$tokenType', 'prompt'] },
                { $abs: '$rawAmount' },
                0
              ]
            }
          },
          completionTokens: {
            $sum: {
              $cond: [
                { $eq: ['$tokenType', 'completion'] },
                { $abs: '$rawAmount' },
                0
              ]
            }
          },
          transactions: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' },
          firstUsed: { $min: '$createdAt' },
          lastUsed: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          model: '$_id',
          totalTokens: 1,
          promptTokens: 1,
          completionTokens: 1,
          transactions: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          firstUsed: 1,
          lastUsed: 1
        }
      },
      { $sort: { totalTokens: -1 } }
    ]).toArray();
    
    // Add pricing information and calculate costs
    const modelUsageWithCosts = await Promise.all(
      modelUsage.map(async (usage: any) => {
        const cost = await calculateCost(
          usage.model,
          usage.promptTokens,
          usage.completionTokens
        );
        
        const pricing = await ModelPricing.findOne({ modelId: usage.model });
        
        return {
          ...usage,
          inputPrice: pricing?.inputPrice || 5,
          outputPrice: pricing?.outputPrice || 15,
          totalCost: cost.totalCost.toFixed(4),
          averageTokensPerTransaction: Math.round(usage.totalTokens / usage.transactions),
          provider: usage.model.startsWith('gpt') ? 'OpenAI' :
                   usage.model.startsWith('claude') ? 'Anthropic' :
                   usage.model.startsWith('gemini') ? 'Google' : 'Unknown'
        };
      })
    );
    
    res.json(modelUsageWithCosts);
  } catch (error) {
    console.error('Error in models usage:', error);
    res.status(500).json({ error: 'Failed to fetch models usage data' });
  }
});

// GET /api/cost-analysis/export
router.get('/export', async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    // Get database connection
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const transactionsCollection = db.collection('transactions');
    const usersCollection = db.collection('users');
    
    // Build query
    const query: any = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }
    
    // Get all transactions
    const transactions = await transactionsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    // Get user information
    const userIds = [...new Set(transactions.map(t => t.user?.toString()).filter(Boolean))];
    const users = await usersCollection.find({ 
      _id: { $in: userIds.map(id => new mongoose.Types.ObjectId(id)) } 
    }).toArray();
    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user.name || user.email || 'Unknown';
      return acc;
    }, {} as Record<string, string>);
    
    // Process transactions
    const exportData = await Promise.all(
      transactions.map(async (transaction) => {
        const tokens = Math.abs(transaction.rawAmount || 0);
        const isInput = transaction.tokenType === 'prompt';
        
        const cost = await calculateCost(
          transaction.model,
          isInput ? tokens : 0,
          isInput ? 0 : tokens
        );
        
        return {
          date: transaction.createdAt.toISOString(),
          user: userMap[transaction.user?.toString()] || 'Unknown',
          model: transaction.model,
          tokenType: transaction.tokenType,
          tokens: tokens,
          cost: (isInput ? cost.inputCost : cost.outputCost).toFixed(6),
          conversationId: transaction.conversationId
        };
      })
    );
    
    if (format === 'csv') {
      // Convert to CSV
      const csvHeader = 'Date,User,Model,Token Type,Tokens,Cost,Conversation ID\n';
      const csvRows = exportData.map(row => 
        `${row.date},${row.user},${row.model},${row.tokenType},${row.tokens},${row.cost},${row.conversationId}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=cost-analysis-${Date.now()}.csv`);
      res.send(csvHeader + csvRows);
    } else {
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting cost analysis:', error);
    res.status(500).json({ error: 'Failed to export cost analysis data' });
  }
});

export default router;