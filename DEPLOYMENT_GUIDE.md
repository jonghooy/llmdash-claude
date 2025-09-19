# LLMDash Platform Deployment Guide

## 📋 Overview

This guide covers the deployment and configuration of the integrated LLMDash platform with Supabase authentication, multi-tenant organization management, and ACL-based resource permissions.

## 🏗️ Architecture Components

### 1. **Supabase Backend**
- PostgreSQL Database with RLS
- Authentication & JWT Management
- Edge Functions for business logic
- Real-time subscriptions

### 2. **LibreChat**
- Main chat interface
- Supabase auth integration
- Organization context awareness

### 3. **Admin Dashboard**
- Organization management UI
- User invitation system
- ACL permissions management
- Resource administration

### 4. **Memory Agent**
- FastAPI backend
- LlamaIndex RAG pipeline
- JWT-secured API endpoints
- Organization-scoped search

## 🚀 Deployment Steps

### Phase 1: Supabase Setup

#### 1.1 Create Supabase Project
```bash
# Visit https://app.supabase.com
# Create new project with:
# - Project Name: llmdash-platform
# - Database Password: [secure password]
# - Region: [nearest region]
```

#### 1.2 Run Database Migrations
```sql
-- Execute in Supabase SQL Editor
-- Run migrations in order:
1. /supabase/migrations/001_initial_schema.sql
2. /supabase/migrations/002_rls_policies.sql
```

#### 1.3 Deploy Edge Functions
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Deploy invitation function
supabase functions deploy invitation-system \
  --project-ref qctdaaezghvqnbpghinr
```

#### 1.4 Configure Authentication Providers
1. Go to Authentication > Providers in Supabase Dashboard
2. Enable:
   - Email/Password
   - Google OAuth
   - GitHub OAuth (optional)
   - Microsoft Azure AD (optional)

3. Configure OAuth redirect URLs:
```
https://www.llmdash.com/chat/auth/callback
https://www.llmdash.com/admin/auth/callback
```

### Phase 2: Environment Configuration

#### 2.1 Create Environment Files

**`.env.production`**
```bash
# Supabase Configuration
SUPABASE_URL=https://qctdaaezghvqnbpghinr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-dashboard

# LibreChat Configuration
REACT_APP_SUPABASE_URL=${SUPABASE_URL}
REACT_APP_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

# Memory Agent Configuration
FASTAPI_SUPABASE_URL=${SUPABASE_URL}
FASTAPI_SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# Application URLs
INVITATION_BASE_URL=https://www.llmdash.com
FRONTEND_URL=https://www.llmdash.com
API_URL=https://api.llmdash.com
```

### Phase 3: Application Deployment

#### 3.1 Build Frontend Applications

**LibreChat Frontend**
```bash
cd LibreChat
npm ci
npm run build:client
```

**Admin Dashboard Frontend**
```bash
cd LibreChat-Admin/frontend
npm ci
npm run build
```

#### 3.2 Deploy Backend Services

**LibreChat Backend**
```bash
cd LibreChat
npm run build:api
pm2 start ecosystem.config.js --only librechat-backend --env production
```

**Admin Backend**
```bash
cd LibreChat-Admin/backend
npm run build
pm2 start ecosystem.config.js --only admin-backend --env production
```

**Memory Agent (FastAPI)**
```bash
cd memory-agent
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### 3.3 Configure Nginx

**`/etc/nginx/sites-available/llmdash`**
```nginx
server {
    listen 443 ssl http2;
    server_name www.llmdash.com;

    ssl_certificate /etc/ssl/certs/llmdash.crt;
    ssl_certificate_key /etc/ssl/private/llmdash.key;

    # LibreChat
    location /chat {
        proxy_pass http://localhost:3080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Admin Dashboard
    location /admin {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Memory Agent API
    location /api/v1/memory {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Supabase Auth Callback
    location /auth/callback {
        proxy_pass http://localhost:3080/chat/auth/callback;
    }
}
```

### Phase 4: Initial Setup

#### 4.1 Create Super Admin
```sql
-- Run in Supabase SQL Editor
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (
    gen_random_uuid(),
    'admin@llmdash.com',
    crypt('SecurePassword123!', gen_salt('bf')),
    now()
);

-- Get the user ID from above query result
INSERT INTO profiles (id, email, role, username, full_name)
VALUES (
    '[user-id-from-above]',
    'admin@llmdash.com',
    'super_admin',
    'admin',
    'System Administrator'
);
```

#### 4.2 Create First Organization
```sql
INSERT INTO organizations (name, slug, subscription_tier, max_users, max_storage_gb)
VALUES (
    'Demo Company',
    'demo-company',
    'enterprise',
    100,
    500
);

-- Link super admin to organization
UPDATE profiles
SET organization_id = (SELECT id FROM organizations WHERE slug = 'demo-company')
WHERE email = 'admin@llmdash.com';
```

#### 4.3 Test Invitation System
1. Login to Admin Dashboard as super admin
2. Navigate to Organization Management > Invitations
3. Send test invitation
4. Verify email delivery
5. Test invitation acceptance flow

### Phase 5: Production Checks

#### 5.1 Security Checklist
- [ ] All environment variables set correctly
- [ ] Service role keys not exposed to frontend
- [ ] SSL certificates configured
- [ ] CORS settings properly configured
- [ ] Rate limiting enabled
- [ ] RLS policies tested

#### 5.2 Monitoring Setup
```bash
# PM2 Monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 7

# Application monitoring
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### 5.3 Backup Configuration
```bash
# Automated database backup (daily)
0 2 * * * pg_dump $DATABASE_URL > /backups/llmdash_$(date +\%Y\%m\%d).sql

# File backup (weekly)
0 3 * * 0 tar -czf /backups/files_$(date +\%Y\%m\%d).tar.gz /var/lib/llmdash/files
```

## 🧪 Testing Procedures

### 1. Authentication Flow
```bash
# Test login
curl -X POST https://api.llmdash.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Verify JWT
curl -H "Authorization: Bearer [token]" \
  https://api.llmdash.com/api/v1/me
```

### 2. Organization Management
- Create organization
- Add departments/teams
- Invite users
- Verify email delivery
- Accept invitation
- Check user appears in organization

### 3. ACL Permissions
- Create resource (memory)
- Share with user
- Share with department
- Test access as different users
- Verify permission inheritance

### 4. Memory Agent
- Create memory with auth
- Search within organization
- Test ACL filtering
- Verify cross-tenant isolation

## 📊 Monitoring & Maintenance

### Log Locations
```bash
# PM2 logs
pm2 logs

# Nginx logs
/var/log/nginx/access.log
/var/log/nginx/error.log

# Application logs
/var/log/llmdash/app.log
```

### Health Checks
```bash
# Service status
pm2 status

# Database connection
psql $DATABASE_URL -c "SELECT 1"

# API endpoints
curl https://api.llmdash.com/health
```

### Performance Tuning
```bash
# Database indexes
CREATE INDEX idx_memories_org ON memories(organization_id);
CREATE INDEX idx_permissions_resource ON resource_permissions(resource_id, resource_type);

# PM2 cluster mode
pm2 start app.js -i max
```

## 🆘 Troubleshooting

### Common Issues

#### 1. JWT Verification Failures
```bash
# Check Supabase JWT secret
echo $SUPABASE_JWT_SECRET

# Verify token manually
jwt decode [token] --secret=$SUPABASE_JWT_SECRET
```

#### 2. CORS Errors
```javascript
// Add to backend
app.use(cors({
  origin: ['https://www.llmdash.com'],
  credentials: true
}));
```

#### 3. RLS Policy Violations
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Test as specific user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO '[user-id]';
SELECT * FROM profiles;
```

## 📝 Maintenance Tasks

### Daily
- Monitor error logs
- Check disk usage
- Verify backup completion

### Weekly
- Review audit logs
- Update dependencies
- Performance analysis

### Monthly
- Security patches
- Database optimization
- User access review

## 🔗 Important Links

- **Supabase Dashboard**: https://app.supabase.com/project/qctdaaezghvqnbpghinr
- **Production URL**: https://www.llmdash.com
- **Admin Dashboard**: https://www.llmdash.com/admin
- **API Documentation**: https://api.llmdash.com/docs
- **Support**: support@llmdash.com

## 📞 Support Contacts

- **Technical Lead**: tech@llmdash.com
- **DevOps**: devops@llmdash.com
- **Security**: security@llmdash.com
- **24/7 Support**: +1-xxx-xxx-xxxx