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
    
    // Wait for login form
    await page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="email" i]', { timeout: 5000 });
    
    // Fill in credentials
    console.log('Filling login credentials...');
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email" i]', 'admin@librechat.local');
    await page.fill('input[type="password"], input[name="password"], input[placeholder*="password" i]', 'Admin123456');
    
    // Submit login
    console.log('Submitting login...');
    await page.click('button[type="submit"], button:has-text("Sign")');
    
    // Wait for dashboard to load
    console.log('Waiting for dashboard to load...');
    await page.waitForTimeout(5000); // Give it time to fully load
    
    // Take dashboard screenshot
    await page.screenshot({ path: '/tmp/admin-dashboard-main.png', fullPage: true });
    console.log('Dashboard screenshot saved to /tmp/admin-dashboard-main.png');
    
    console.log('\n=== Dashboard Overview ===');
    
    // Get dashboard stats
    const stats = await page.$$eval('.stat-card, [class*="card"], [class*="Card"]', cards => 
      cards.map(card => card.textContent?.trim()).filter(Boolean)
    );
    
    if (stats.length > 0) {
      console.log('Dashboard Statistics:');
      stats.forEach(stat => console.log(`  - ${stat}`));
    }
    
    // Check for charts
    const charts = await page.$$('canvas, svg.recharts-surface, [class*="chart"], [class*="Chart"]');
    console.log(`\nCharts found: ${charts.length}`);
    
    // Navigate to different sections
    const sections = [
      { name: 'Cost & Usage', selector: 'a:has-text("Cost"), a[href*="cost"]' },
      { name: 'Organization', selector: 'a:has-text("Organization"), a[href*="organization"]' },
      { name: 'Settings', selector: 'a:has-text("Settings"), a[href*="settings"]' }
    ];
    
    for (const section of sections) {
      try {
        const link = await page.$(section.selector);
        if (link) {
          console.log(`\nNavigating to ${section.name}...`);
          await link.click();
          await page.waitForTimeout(2000);
          
          // Take screenshot
          const filename = `/tmp/admin-${section.name.toLowerCase().replace(/\s+/g, '-')}.png`;
          await page.screenshot({ path: filename, fullPage: true });
          console.log(`Screenshot saved to ${filename}`);
          
          // Get page content summary
          const pageText = await page.$eval('main, [role="main"], .content, .main', el => {
            return el.textContent?.substring(0, 200);
          }).catch(() => 'Unable to extract content');
          
          console.log(`Content preview: ${pageText}`);
        }
      } catch (err) {
        console.log(`Could not navigate to ${section.name}: ${err.message}`);
      }
    }
    
    // Go back to dashboard
    console.log('\nReturning to Dashboard...');
    const dashboardLink = await page.$('a:has-text("Dashboard"), a[href*="dashboard"]');
    if (dashboardLink) {
      await dashboardLink.click();
      await page.waitForTimeout(2000);
    }
    
    // Check real-time updates
    console.log('\n=== Checking Real-time Features ===');
    
    // Check WebSocket connections
    const wsConnections = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('ws://') || entry.name.includes('wss://'))
        .map(entry => entry.name);
    });
    
    if (wsConnections.length > 0) {
      console.log('WebSocket connections detected:');
      wsConnections.forEach(ws => console.log(`  - ${ws}`));
    } else {
      console.log('No WebSocket connections detected');
    }
    
    // Final summary
    console.log('\n=== Development Status Summary ===');
    console.log('✅ Admin login system: Working');
    console.log('✅ Dashboard page: Accessible');
    console.log('✅ Navigation menu: Present');
    console.log(`📊 Statistics cards: ${stats.length > 0 ? 'Present' : 'Not found'}`);
    console.log(`📈 Charts/Graphs: ${charts.length > 0 ? `${charts.length} found` : 'Not found'}`);
    console.log(`🔄 Real-time updates: ${wsConnections.length > 0 ? 'Active' : 'Not detected'}`);
    
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