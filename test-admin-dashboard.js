const { chromium } = require('playwright');

(async () => {
  console.log('Starting browser...');
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to admin page
    console.log('Navigating to https://www.llmdash.com/admin...');
    await page.goto('https://www.llmdash.com/admin', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Take screenshot of login page
    await page.screenshot({ path: '/tmp/admin-login.png', fullPage: true });
    console.log('Login page screenshot saved to /tmp/admin-login.png');
    
    // Wait for login form
    await page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="email" i]', { timeout: 5000 });
    
    // Fill in credentials
    console.log('Filling login credentials...');
    const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = await page.$('input[type="password"], input[name="password"], input[placeholder*="password" i]');
    
    if (emailInput) {
      await emailInput.fill('admin@librechat.local');
    }
    if (passwordInput) {
      await passwordInput.fill('Admin123456');
    }
    
    // Submit login
    console.log('Submitting login...');
    const loginButton = await page.$('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
    if (loginButton) {
      await loginButton.click();
    } else {
      // Try pressing Enter
      await page.keyboard.press('Enter');
    }
    
    // Wait for navigation after login
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Check if we're on dashboard
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    // Take screenshot of dashboard
    await page.screenshot({ path: '/tmp/admin-dashboard.png', fullPage: true });
    console.log('Dashboard screenshot saved to /tmp/admin-dashboard.png');
    
    // Check for dashboard elements
    console.log('\n=== Dashboard Status Check ===');
    
    // Check for key dashboard components
    const dashboardChecks = [
      { selector: '.dashboard-stats, [class*="stats"]', name: 'Statistics Section' },
      { selector: 'canvas, svg.recharts-surface, [class*="chart"]', name: 'Charts/Graphs' },
      { selector: '[class*="user"], [class*="User"]', name: 'User Management' },
      { selector: '[class*="activity"], [class*="Activity"]', name: 'Activity Section' },
      { selector: '[class*="cost"], [class*="Cost"]', name: 'Cost/Usage Section' },
      { selector: '[class*="model"], [class*="Model"]', name: 'Model Management' },
    ];
    
    for (const check of dashboardChecks) {
      const element = await page.$(check.selector);
      console.log(`✓ ${check.name}: ${element ? 'Found' : 'Not found'}`);
    }
    
    // Get page content for analysis
    const pageTitle = await page.title();
    console.log('\nPage Title:', pageTitle);
    
    // Check sidebar navigation
    const sidebarLinks = await page.$$eval('nav a, aside a, [class*="sidebar"] a', links => 
      links.map(link => ({ text: link.textContent?.trim(), href: link.href }))
    );
    
    if (sidebarLinks.length > 0) {
      console.log('\n=== Sidebar Navigation ===');
      sidebarLinks.forEach(link => {
        if (link.text) console.log(`- ${link.text}`);
      });
    }
    
    // Check for any error messages
    const errorElements = await page.$$('[class*="error"], [class*="Error"], .alert-danger');
    if (errorElements.length > 0) {
      console.log('\n⚠️ Error messages found on page');
    }
    
    // Get main content text
    const mainContent = await page.$eval('main, [role="main"], .main-content, #root', el => {
      return el.textContent?.substring(0, 500);
    }).catch(() => 'Could not extract main content');
    
    console.log('\n=== Main Content Preview ===');
    console.log(mainContent);
    
  } catch (error) {
    console.error('Error during automation:', error.message);
    
    // Take error screenshot
    await page.screenshot({ path: '/tmp/admin-error.png', fullPage: true });
    console.log('Error screenshot saved to /tmp/admin-error.png');
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }
})();