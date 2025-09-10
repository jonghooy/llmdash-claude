const { chromium } = require('playwright');

(async () => {
  console.log('🔐 Testing Admin Login after Rate Limit Fix...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    // Monitor network responses
    page.on('response', response => {
      if (response.url().includes('/api/auth/login')) {
        console.log(`Login API Response: ${response.status()} - ${response.statusText()}`);
      }
    });
    
    // Navigate to admin page
    console.log('📍 Navigating to admin page...');
    await page.goto('https://www.llmdash.com/admin/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Check if login form is present
    const loginForm = await page.$('input[name="email"]');
    if (!loginForm) {
      console.log('❌ Login form not found');
      return;
    }
    
    console.log('✅ Login form found');
    
    // Fill login form
    console.log('\n🔑 Attempting login...');
    await page.fill('input[name="email"]', 'admin@librechat.local');
    await page.fill('input[name="password"]', 'Admin123456');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for response
    console.log('⏳ Waiting for login response...');
    
    try {
      // Wait for either successful navigation or error message
      await Promise.race([
        page.waitForURL('**/admin/**', { timeout: 10000 }),
        page.waitForSelector('.MuiAlert-root', { timeout: 10000 }),
        page.waitForSelector('text=Dashboard', { timeout: 10000 })
      ]);
    } catch (e) {
      // Continue to check result
    }
    
    // Check current state
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`\n📍 Current URL: ${currentUrl}`);
    
    // Check for error messages
    const errorAlert = await page.$('.MuiAlert-root');
    if (errorAlert) {
      const errorText = await errorAlert.textContent();
      console.log(`\n❌ Error: ${errorText}`);
      
      if (errorText.includes('Too many')) {
        console.log('\n⚠️  Rate limiting is still active!');
        console.log('Consider waiting a few minutes or clearing rate limit store');
      }
    }
    
    // Check if we're on dashboard
    const dashboardTitle = await page.$('text=Dashboard');
    const dynamicDashboard = await page.$('text=Dynamic Dashboard');
    
    if (dashboardTitle || dynamicDashboard) {
      console.log('\n✅ SUCCESS! Login successful!');
      console.log('Dashboard is accessible');
      
      // Take screenshot
      await page.screenshot({ path: '/tmp/admin-login-success.png', fullPage: true });
      console.log('📸 Screenshot saved to /tmp/admin-login-success.png');
    } else {
      console.log('\n❌ Login failed - Dashboard not accessible');
      
      // Take screenshot of current state
      await page.screenshot({ path: '/tmp/admin-login-failed.png', fullPage: true });
      console.log('📸 Error screenshot saved to /tmp/admin-login-failed.png');
    }
    
    // Test multiple login attempts
    console.log('\n📊 Testing rate limit threshold...');
    for (let i = 1; i <= 5; i++) {
      const testContext = await browser.newContext({
        ignoreHTTPSErrors: true
      });
      const testPage = await testContext.newPage();
      
      await testPage.goto('https://www.llmdash.com/admin/', { waitUntil: 'networkidle' });
      
      const response = await testPage.request.post('https://www.llmdash.com/admin/api/auth/login', {
        data: {
          email: `test${i}@example.com`,
          password: 'wrongpassword'
        }
      }).catch(err => ({ status: () => err.message }));
      
      console.log(`  Attempt ${i}: ${response.status()}`);
      await testContext.close();
      
      if (response.status() === 429) {
        console.log(`  Rate limit hit at attempt ${i}`);
        break;
      }
    }
    
    console.log('\n✅ Rate limit test complete');
    console.log('New limits: 20 attempts per 5 minutes for login');
    console.log('General API: 500 requests per 15 minutes');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✨ Test complete!');
  }
})();