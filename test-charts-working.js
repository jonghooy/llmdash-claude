const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Testing Dashboard with Charts...\n');
  
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
    
    // Capture console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser Error:', msg.text());
      }
    });
    
    console.log('📍 Navigating to Admin Dashboard...');
    const timestamp = Date.now();
    await page.goto(`https://www.llmdash.com/admin/?t=${timestamp}`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Login
    console.log('🔐 Logging in...');
    await page.fill('input[name="email"]', 'admin@librechat.local');
    await page.fill('input[name="password"]', 'Admin123456');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    console.log('⏳ Waiting for dashboard and charts to load...');
    await page.waitForTimeout(8000);
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/dashboard-with-charts-final.png', fullPage: true });
    console.log('📸 Screenshot saved to /tmp/dashboard-with-charts-final.png\n');
    
    // Check for charts
    console.log('=== Chart Detection ===');
    
    // Check for canvas elements (line charts)
    const canvasElements = await page.$$('canvas');
    console.log(`✓ Canvas elements: ${canvasElements.length} found`);
    
    // Check for SVG charts (Recharts)
    const svgCharts = await page.$$('svg.recharts-surface');
    console.log(`✓ Recharts SVG elements: ${svgCharts.length} found`);
    
    // Check for chart containers
    const chartContainers = await page.$$('.recharts-wrapper');
    console.log(`✓ Recharts wrappers: ${chartContainers.length} found`);
    
    // Get page text
    const pageText = await page.textContent('body');
    
    // Check for key elements
    console.log('\n=== Dashboard Elements ===');
    const elements = [
      { text: 'Dynamic Dashboard', name: 'Dashboard Title' },
      { text: 'Messages/min', name: 'Messages per Minute' },
      { text: 'Real-time Activity', name: 'Line Chart Title' },
      { text: 'Model Usage Distribution', name: 'Pie Chart Title' },
      { text: 'Total Users', name: 'Users Card' },
      { text: 'Monthly Cost', name: 'Cost Card' },
      { text: 'Quick Summary', name: 'Summary Section' }
    ];
    
    let foundCount = 0;
    for (const element of elements) {
      const found = pageText.includes(element.text);
      if (found) foundCount++;
      console.log(`${found ? '✅' : '❌'} ${element.name}`);
    }
    
    // Check for actual data
    console.log('\n=== Data Verification ===');
    
    // Check if numbers are displayed
    const hasNumbers = /\d+/.test(pageText);
    console.log(`Numbers displayed: ${hasNumbers ? '✅ Yes' : '❌ No'}`);
    
    // Check for "Chart loading..." text
    const hasLoadingText = pageText.includes('Chart loading...');
    console.log(`Charts still loading: ${hasLoadingText ? '⚠️ Yes' : '✅ No'}`);
    
    // Final verdict
    console.log('\n=== RESULT ===');
    if (svgCharts.length > 0 || canvasElements.length > 0) {
      console.log('🎉 SUCCESS! Charts are rendering correctly!');
      console.log(`   - Found ${svgCharts.length} SVG charts`);
      console.log(`   - Found ${canvasElements.length} canvas elements`);
      console.log(`   - ${foundCount}/7 dashboard elements present`);
    } else if (hasLoadingText) {
      console.log('⚠️ PARTIAL: Dashboard loaded but charts still loading');
    } else {
      console.log('❌ ISSUE: Charts are not rendering');
      
      // Check for errors
      const errors = await page.evaluate(() => {
        return window.__errors || [];
      });
      if (errors.length > 0) {
        console.log('JavaScript errors detected:', errors);
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: '/tmp/dashboard-error-final.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n✨ Test complete!');
  }
})();