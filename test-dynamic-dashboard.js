const { chromium } = require('playwright');

async function testDynamicDashboard() {
  console.log('🚀 Testing Dynamic Dashboard Features...\n');
  
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
    
    console.log('📍 Navigating to Admin Dashboard...');
    await page.goto('https://www.llmdash.com/admin/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Check if login is required
    const loginExists = await page.$('input[name="email"]').catch(() => null);
    
    if (loginExists) {
      console.log('🔐 Logging in...');
      await page.fill('input[name="email"]', 'admin@librechat.local');
      await page.fill('input[name="password"]', 'Admin123456');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }
    
    // Navigate to Dashboard
    console.log('📊 Checking Dashboard Components...\n');
    
    // Wait for dashboard to load
    await page.waitForTimeout(5000);
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/dynamic-dashboard-full.png', fullPage: true });
    console.log('📸 Screenshot saved to /tmp/dynamic-dashboard-full.png\n');
    
    // Check page content
    const pageContent = await page.content();
    const pageText = await page.textContent('body');
    
    // Check for Dynamic Dashboard
    const hasDynamicTitle = pageText.includes('Dynamic Dashboard');
    console.log(`Dynamic Dashboard Title: ${hasDynamicTitle ? '✅ Found' : '❌ Not found'}`);
    
    // Check for enhanced components
    const components = [
      { text: 'Messages/min', name: 'Real-time Messages Metric' },
      { text: 'Active Now', name: 'Active Users Metric' },
      { text: 'System Load', name: 'System Load Indicator' },
      { text: 'Live', name: 'Live Status Indicator' },
      { text: 'Quick Summary', name: 'Quick Summary Section' }
    ];
    
    for (const component of components) {
      const exists = pageText.includes(component.text);
      console.log(`${component.name}: ${exists ? '✅ Found' : '❌ Not found'}`);
    }
    
    // Check for charts
    const canvasElements = await page.$$('canvas');
    const svgCharts = await page.$$('svg.recharts-surface');
    console.log(`\n📊 Chart Elements:`);
    console.log(`  Canvas elements: ${canvasElements.length}`);
    console.log(`  Recharts SVG: ${svgCharts.length}`);
    
    // Final diagnosis
    console.log('\n🔍 DIAGNOSIS:');
    if (hasDynamicTitle) {
      console.log('✅ Dynamic Dashboard is loaded!');
      if (canvasElements.length > 0 || svgCharts.length > 0) {
        console.log('✅ Charts are rendering correctly!');
      } else {
        console.log('⚠️  Charts are not rendering - checking why...');
        // Check for errors
        const errors = await page.evaluate(() => {
          return window.__errors || [];
        });
        if (errors.length > 0) {
          console.log('Errors found:', errors);
        }
      }
    } else {
      console.log('❌ Dynamic Dashboard is NOT loaded');
      console.log('The old Dashboard component is still being used');
      console.log('\nTroubleshooting steps:');
      console.log('1. Check if build includes latest changes');
      console.log('2. Clear browser cache');
      console.log('3. Verify Dashboard/index.tsx imports DynamicDashboard');
    }
    
    
    console.log('\n✨ Dynamic Dashboard Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testDynamicDashboard().then(() => {
  console.log('\n🎉 All tests completed!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});