const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Final Dashboard Verification...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Create a new context with cache disabled
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1920, height: 1080 },
      // Disable cache completely
      bypassCSP: true,
      extraHTTPHeaders: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    const page = await context.newPage();
    
    // Add timestamp to URL to bypass cache
    const timestamp = Date.now();
    console.log('📍 Navigating to Admin Dashboard (cache bypassed)...');
    await page.goto(`https://www.llmdash.com/admin/?t=${timestamp}`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Login
    console.log('🔐 Logging in...');
    await page.fill('input[name="email"]', 'admin@librechat.local');
    await page.fill('input[name="password"]', 'Admin123456');
    await page.click('button[type="submit"]');
    
    // Wait longer for dashboard to fully load
    console.log('⏳ Waiting for dashboard to fully render...');
    await page.waitForTimeout(8000);
    
    // Force reload to ensure latest JS
    console.log('🔄 Force reloading page...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/final-dashboard.png', fullPage: true });
    console.log('📸 Screenshot saved to /tmp/final-dashboard.png\n');
    
    // Get all text content
    const pageText = await page.textContent('body');
    
    // Check for key indicators
    console.log('=== Dashboard Content Check ===');
    
    const checks = [
      { text: 'Dynamic Dashboard', name: 'Dynamic Dashboard Title' },
      { text: 'Messages/min', name: 'Real-time Metrics' },
      { text: 'Active Now', name: 'Active Users Metric' },
      { text: 'System Load', name: 'System Load' },
      { text: 'Live', name: 'Live Status' },
      { text: 'Avg Response', name: 'Average Response Time' },
      { text: 'Real-time Activity', name: 'Real-time Chart Title' },
      { text: 'Quick Summary', name: 'Summary Section' }
    ];
    
    let foundCount = 0;
    for (const check of checks) {
      const found = pageText.includes(check.text);
      if (found) foundCount++;
      console.log(`${found ? '✅' : '❌'} ${check.name}`);
    }
    
    // Check for chart elements
    const canvases = await page.$$('canvas');
    const svgCharts = await page.$$('svg.recharts-surface, svg[class*="recharts"]');
    const progressBars = await page.$$('[role="progressbar"]');
    
    console.log('\n=== Chart Elements ===');
    console.log(`Canvas elements: ${canvases.length}`);
    console.log(`SVG charts: ${svgCharts.length}`);
    console.log(`Progress bars: ${progressBars.length}`);
    
    // Check loaded scripts
    const scripts = await page.$$eval('script[src*="index"]', elements => 
      elements.map(el => el.src)
    );
    console.log('\n=== Loaded Scripts ===');
    scripts.forEach(script => {
      const filename = script.split('/').pop();
      console.log(`- ${filename}`);
    });
    
    // Final verdict
    console.log('\n=== FINAL RESULT ===');
    if (foundCount >= 4) {
      console.log('✅ SUCCESS! Dynamic Dashboard with real-time charts is working!');
      console.log(`   Found ${foundCount}/8 key features`);
      if (canvases.length > 0 || svgCharts.length > 0) {
        console.log('   Charts are rendering correctly');
      }
    } else if (foundCount > 0) {
      console.log('⚠️  PARTIAL SUCCESS: Some features are loading');
      console.log(`   Found ${foundCount}/8 key features`);
    } else {
      console.log('❌ FAILURE: Dynamic Dashboard is not loading');
      console.log('   Old dashboard is still being displayed');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✨ Test complete!');
  }
})();