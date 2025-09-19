const accessPermissions = require('./accessPermissions');
const assistants = require('./assistants');
const categories = require('./categories');
const tokenizer = require('./tokenizer');
const endpoints = require('./endpoints');
const staticRoute = require('./static');
const messages = require('./messages');
const memories = require('./memories');
const memory = require('./memory'); // New memory API for MCP integration
const presets = require('./presets');
const prompts = require('./prompts');
const balance = require('./balance');
const plugins = require('./plugins');
const actions = require('./actions');
const banner = require('./banner');
const search = require('./search');
const models = require('./models');
const convos = require('./convos');
const config = require('./config');
const agents = require('./agents');
const roles = require('./roles');
const oauth = require('./oauth');
const files = require('./files');
const share = require('./share');
const tags = require('./tags');
const auth = require('./auth');
const edit = require('./edit');
const keys = require('./keys');
const user = require('./user');
const mcp = require('./mcp');
const organizationAuth = require('./organizationAuth');
const adminPrompts = require('./adminPrompts');
const adminAgents = require('./adminAgents');

module.exports = {
  mcp,
  organizationAuth,
  adminPrompts,
  adminAgents,
  edit,
  auth,
  keys,
  user,
  tags,
  roles,
  oauth,
  files,
  share,
  banner,
  agents,
  convos,
  search,
  config,
  models,
  prompts,
  plugins,
  actions,
  presets,
  balance,
  messages,
  memories,
  memory, // New memory API for MCP integration
  endpoints,
  tokenizer,
  assistants,
  categories,
  staticRoute,
  accessPermissions,
};
