#!/usr/bin/env node

/**
 * Test automatic memory update from chat message
 */

const { detectMemoryUpdateCommand, processMemoryUpdate } = require('./LibreChat/api/server/services/OrgMemory');

async function testAutoUpdate() {
  console.log('Testing automatic memory update detection and processing...\n');

  // Test cases
  const testMessages = [
    '추가정보 (런칭예상일 2025년 11월 3일)',
    'LLMDash 추가정보: 베타 테스트 참가자 100명 모집 중',
    '업데이트 정보: 새로운 Claude 3.5 Sonnet 모델 추가',
    '메모리 업데이트: 월간 활성 사용자 1,000명 돌파',
    '기록: 첫 번째 유료 고객 획득 (Enterprise Plan)',
  ];

  for (const message of testMessages) {
    console.log(`\nTesting message: "${message}"`);
    console.log('-'.repeat(50));

    // Detect update command
    const updateInfo = detectMemoryUpdateCommand(message);

    if (updateInfo) {
      console.log('✅ Update command detected!');
      console.log('  Command:', updateInfo.command);
      console.log('  Target:', updateInfo.target);
      console.log('  Content:', updateInfo.content);

      // Process the update
      const success = await processMemoryUpdate(updateInfo);
      if (success) {
        console.log('✅ Memory file updated successfully!');
      } else {
        console.log('❌ Failed to update memory file');
      }
    } else {
      console.log('❌ No update command detected');
    }
  }

  // Check the final content
  console.log('\n' + '='.repeat(60));
  console.log('Checking updated memory file...\n');

  const fs = require('fs').promises;
  const content = await fs.readFile('/home/jonghooy/work/llmdash-claude/memory-storage/entities/llmdash.md', 'utf-8');

  // Show last 500 characters to see the updates
  const lastPart = content.slice(-1000);
  console.log('Last 1000 characters of llmdash.md:');
  console.log(lastPart);
}

testAutoUpdate().catch(console.error);