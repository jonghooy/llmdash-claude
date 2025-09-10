const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 Navigating to admin dashboard...');
    await page.goto('https://www.llmdash.com/admin');
    await page.waitForLoadState('networkidle');

    console.log('🔑 Logging in...');
    await page.fill('input[name="email"]', 'admin@librechat.local');
    await page.fill('input[name="password"]', 'Admin123456');
    await page.click('button[type="submit"]');
    
    console.log('⏳ Waiting for dashboard to load...');
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    console.log('📊 Checking dashboard statistics...');
    
    // Check for main metrics
    const totalUsers = await page.textContent('text=/Total Users/i >> .. >> text=/\\d+/');
    const activeUsers = await page.textContent('text=/Active Users/i >> .. >> text=/\\d+/');
    const messagesText = await page.locator('text=/Messages Today/i >> .. >> text=/\\d+/').first().textContent();
    
    console.log(`✅ Total Users: ${totalUsers}`);
    console.log(`✅ Active Users: ${activeUsers}`);
    console.log(`✅ Messages Today: ${messagesText}`);

    // Wait for charts to potentially load
    await page.waitForTimeout(3000);

    // Check for Real-time Activity chart
    const chartTitle = await page.textContent('text=/Real-time Activity/i');
    console.log(`📈 Chart title found: ${chartTitle}`);

    // Check if chart is rendered (look for SVG element)
    const chartSvgCount = await page.locator('svg.recharts-surface').count();
    console.log(`📊 Number of chart SVGs found: ${chartSvgCount}`);

    // Check for any error messages
    const errorElements = await page.locator('text=/Error loading data/i').count();
    if (errorElements > 0) {
      console.log('❌ Error message found in chart!');
      const errorText = await page.locator('text=/Error loading data/i').first().textContent();
      console.log(`Error: ${errorText}`);
    } else {
      console.log('✅ No error messages in chart');
    }

    // Check for "No activity data" message
    const noDataElements = await page.locator('text=/No activity data/i').count();
    if (noDataElements > 0) {
      console.log('⚠️ No activity data message found - likely no recent activity in DB');
    }

    // Check network requests to see if API was called
    const apiCalls = [];
    page.on('response', response => {
      if (response.url().includes('/api/dashboard/activity-timeline')) {
        apiCalls.push({
          url: response.url(),
          status: response.status()
        });
      }
    });

    // Reload page to capture network calls
    console.log('🔄 Reloading page to check API calls...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    if (apiCalls.length > 0) {
      console.log('📡 API calls made to activity-timeline:');
      apiCalls.forEach(call => {
        console.log(`  - ${call.url} (status: ${call.status})`);
      });
    } else {
      console.log('⚠️ No API calls to activity-timeline detected');
    }

    // Take a screenshot
    await page.screenshot({ path: 'dashboard-fixed-chart.png', fullPage: true });
    console.log('📸 Screenshot saved as dashboard-fixed-chart.png');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('📸 Error screenshot saved');
  } finally {
    await browser.close();
    console.log('✅ Test completed');
  }
})();
