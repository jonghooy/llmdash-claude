const { chromium } = require('playwright');

(async () => {
  console.log('Starting browser to check dashboard charts...');
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser Console Error:', msg.text());
    }
  });
  
  try {
    // Navigate to admin page
    console.log('Navigating to https://www.llmdash.com/admin/...');
    await page.goto('https://www.llmdash.com/admin/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Login
    console.log('Logging in...');
    await page.waitForSelector('input[placeholder*="Email"]', { timeout: 5000 });
    await page.fill('input[placeholder*="Email"]', 'admin@librechat.local');
    await page.fill('input[placeholder*="Password"]', 'Admin123456');
    await page.click('button:has-text("SIGN IN")');
    
    // Wait for dashboard to load
    console.log('Waiting for dashboard to fully load...');
    await page.waitForTimeout(7000); // Give more time for charts to render
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/dashboard-with-charts.png', fullPage: true });
    console.log('Screenshot saved to /tmp/dashboard-with-charts.png');
    
    console.log('\n=== Chart Component Detection ===');
    
    // Check for Dynamic Dashboard title
    const dashboardTitle = await page.$('text=Dynamic Dashboard');
    console.log(`✓ Dynamic Dashboard Title: ${dashboardTitle ? 'Found' : 'Not found'}`);
    
    // Check for real-time status indicators
    const liveIndicator = await page.$('text=Live');
    console.log(`✓ Live Status Indicator: ${liveIndicator ? 'Found' : 'Not found'}`);
    
    // Check for chart containers
    const chartTypes = [
      { selector: 'canvas', name: 'Canvas Charts' },
      { selector: 'svg.recharts-surface', name: 'Recharts SVG' },
      { selector: '[class*="recharts"]', name: 'Recharts Components' },
      { selector: '.MuiPaper-root canvas', name: 'MUI Paper with Canvas' },
      { selector: 'text=Messages/min', name: 'Real-time Metrics Bar' },
      { selector: 'text=System Load', name: 'System Load Indicator' },
      { selector: '[role="progressbar"]', name: 'Progress Bar' }
    ];
    
    for (const chart of chartTypes) {
      const elements = await page.$$(chart.selector);
      console.log(`✓ ${chart.name}: ${elements.length} found`);
    }
    
    // Check for specific chart titles
    const chartTitles = [
      'Real-time Activity',
      'Model Usage Distribution',
      'Activity Heatmap',
      'Cost Analysis',
      'System Performance',
      'Quick Summary'
    ];
    
    console.log('\n=== Chart Titles Detection ===');
    for (const title of chartTitles) {
      const element = await page.$(`text="${title}"`);
      console.log(`✓ ${title}: ${element ? 'Found' : 'Not found'}`);
    }
    
    // Check for animated stat cards
    const statCards = await page.$$('.MuiCard-root');
    console.log(`\n=== Statistics Cards ===`);
    console.log(`Total stat cards found: ${statCards.length}`);
    
    // Check for WebSocket connection
    const wsStatus = await page.evaluate(() => {
      return window.performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('ws://') || entry.name.includes('wss://'))
        .length > 0;
    });
    console.log(`WebSocket connection: ${wsStatus ? 'Active' : 'Not detected'}`);
    
    // Get page errors if any
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    if (errors.length > 0) {
      console.log('\n⚠️  Page Errors:');
      errors.forEach(err => console.log(`  - ${err}`));
    }
    
    // Check network requests for API calls
    const apiCalls = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    // Wait a bit to collect API calls
    await page.waitForTimeout(2000);
    
    if (apiCalls.length > 0) {
      console.log('\n=== API Calls ===');
      apiCalls.forEach(call => {
        console.log(`  ${call.status} - ${call.url}`);
      });
    }
    
    // Final summary
    console.log('\n=== Dashboard Enhancement Status ===');
    const hasCharts = (await page.$$('canvas')).length > 0 || (await page.$$('svg.recharts-surface')).length > 0;
    const hasDynamicTitle = dashboardTitle !== null;
    const hasRealTimeMetrics = liveIndicator !== null;
    
    if (hasCharts && hasDynamicTitle && hasRealTimeMetrics) {
      console.log('✅ SUCCESS: Dynamic dashboard with real-time charts is working!');
      console.log('✅ Charts are rendering properly');
      console.log('✅ Real-time features are active');
    } else {
      console.log('⚠️  ISSUE: Some features are not working:');
      if (!hasCharts) console.log('  - Charts are not rendering');
      if (!hasDynamicTitle) console.log('  - Dynamic Dashboard title not found');
      if (!hasRealTimeMetrics) console.log('  - Real-time metrics not active');
    }
    
  } catch (error) {
    console.error('Error during test:', error.message);
    await page.screenshot({ path: '/tmp/dashboard-error.png', fullPage: true });
    console.log('Error screenshot saved to /tmp/dashboard-error.png');
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }
})();