const { chromium } = require('playwright');

(async () => {
  console.log('Starting browser to inspect login page...');
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
    console.log('Navigating to https://www.llmdash.com/admin/...');
    await page.goto('https://www.llmdash.com/admin/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Get all input fields
    const inputs = await page.$$eval('input', elements => 
      elements.map(el => ({
        type: el.type,
        name: el.name,
        placeholder: el.placeholder,
        id: el.id,
        className: el.className
      }))
    );
    
    console.log('\n=== Input Fields Found ===');
    inputs.forEach((input, i) => {
      console.log(`Input ${i + 1}:`);
      console.log(`  Type: ${input.type}`);
      console.log(`  Name: ${input.name}`);
      console.log(`  Placeholder: ${input.placeholder}`);
      console.log(`  ID: ${input.id}`);
      console.log(`  Class: ${input.className}`);
      console.log('---');
    });
    
    // Get all buttons
    const buttons = await page.$$eval('button', elements => 
      elements.map(el => ({
        text: el.textContent,
        type: el.type,
        className: el.className
      }))
    );
    
    console.log('\n=== Buttons Found ===');
    buttons.forEach((button, i) => {
      console.log(`Button ${i + 1}: "${button.text}" (type: ${button.type})`);
    });
    
    // Try to login with correct selectors
    console.log('\n=== Attempting Login ===');
    
    // Find the email input
    const emailInput = await page.$('input[name="email"], input#email, input:nth-of-type(1)');
    if (emailInput) {
      await emailInput.fill('admin@librechat.local');
      console.log('✓ Email filled');
    } else {
      console.log('✗ Email input not found');
    }
    
    // Find the password input  
    const passwordInput = await page.$('input[name="password"], input#password, input[type="password"]');
    if (passwordInput) {
      await passwordInput.fill('Admin123456');
      console.log('✓ Password filled');
    } else {
      console.log('✗ Password input not found');
    }
    
    // Click submit
    const submitButton = await page.$('button[type="submit"], button');
    if (submitButton) {
      await submitButton.click();
      console.log('✓ Submit clicked');
    }
    
    // Wait for navigation
    await page.waitForTimeout(5000);
    
    // Check if we're logged in
    const currentUrl = page.url();
    console.log('\nCurrent URL:', currentUrl);
    
    if (currentUrl.includes('/admin') && !currentUrl.includes('login')) {
      console.log('✅ Successfully logged in!');
      
      // Take screenshot of dashboard
      await page.screenshot({ path: '/tmp/dashboard-logged-in.png', fullPage: true });
      console.log('Dashboard screenshot saved to /tmp/dashboard-logged-in.png');
    } else {
      console.log('⚠️ Login may have failed');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }
})();