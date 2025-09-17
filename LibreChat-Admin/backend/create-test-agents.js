const mongoose = require('mongoose');
const Agent = require('./src/models/Agent');
require('dotenv').config();

async function createTestAgents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing test agents
    await Agent.deleteMany({ name: { $regex: '^Test' } });

    const testAgents = [
      {
        name: 'Test Coding Assistant',
        description: 'Expert in programming, debugging, and code optimization',
        type: 'specialist',
        category: 'coding',
        systemPrompt: 'You are an expert coding assistant. Help users with programming questions, debugging, and code optimization.',
        model: 'gpt-4',
        temperature: 0.3,
        isPublic: true,
        isActive: true,
        capabilities: {
          codeExecution: true,
          fileAccess: true,
          webSearch: false
        },
        tags: ['programming', 'debugging', 'optimization']
      },
      {
        name: 'Test Research Analyst',
        description: 'Specialized in research, data analysis, and information synthesis',
        type: 'specialist',
        category: 'research',
        systemPrompt: 'You are a research analyst. Help users gather, analyze, and synthesize information from various sources.',
        model: 'gpt-4',
        temperature: 0.7,
        isPublic: true,
        isActive: true,
        capabilities: {
          codeExecution: false,
          fileAccess: true,
          webSearch: true
        },
        tags: ['research', 'analysis', 'data']
      },
      {
        name: 'Test Creative Writer',
        description: 'Creative writing assistant for stories, articles, and content',
        type: 'assistant',
        category: 'creative',
        systemPrompt: 'You are a creative writing assistant. Help users craft compelling stories, articles, and creative content.',
        model: 'claude-3-opus',
        temperature: 0.9,
        isPublic: true,
        isActive: true,
        capabilities: {
          codeExecution: false,
          fileAccess: false,
          webSearch: false
        },
        tags: ['writing', 'creative', 'storytelling']
      },
      {
        name: 'Test Data Analyst',
        description: 'Expert in data analysis, visualization, and insights',
        type: 'specialist',
        category: 'analysis',
        systemPrompt: 'You are a data analysis expert. Help users analyze data, create visualizations, and extract meaningful insights.',
        model: 'gpt-4',
        temperature: 0.5,
        isPublic: true,
        isActive: true,
        capabilities: {
          codeExecution: true,
          fileAccess: true,
          webSearch: false,
          dataAnalysis: true
        },
        tags: ['data', 'analysis', 'visualization']
      },
      {
        name: 'Test Support Agent',
        description: 'Customer support and assistance specialist',
        type: 'assistant',
        category: 'support',
        systemPrompt: 'You are a helpful support agent. Assist users with their questions and provide clear, friendly guidance.',
        model: 'gpt-3.5-turbo',
        temperature: 0.6,
        isPublic: true,
        isActive: true,
        capabilities: {
          codeExecution: false,
          fileAccess: false,
          webSearch: false
        },
        tags: ['support', 'help', 'assistance']
      }
    ];

    // Create agents
    for (const agentData of testAgents) {
      const agent = new Agent(agentData);
      await agent.save();
      console.log(`Created agent: ${agent.name}`);
    }

    console.log(`\nSuccessfully created ${testAgents.length} test agents!`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating test agents:', error);
    process.exit(1);
  }
}

createTestAgents();