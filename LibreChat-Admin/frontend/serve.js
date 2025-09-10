#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const port = 3091;

console.log(`Serving ${distPath} on port ${port}...`);

const server = exec(`npx serve -s ${distPath} -l ${port}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(stdout);
});

server.stdout.on('data', (data) => {
  console.log(data);
});

server.stderr.on('data', (data) => {
  console.error(data);
});

// Keep the process running
process.stdin.resume();