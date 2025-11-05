#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function checkService(port, name) {
  try {
    const { stdout } = await execPromise(`netstat -ano | findstr :${port}`);
    if (stdout.includes(`:${port}`)) {
      console.log(`✅ ${name} is running on port ${port}`);
      return true;
    } else {
      console.log(`❌ ${name} is not running on port ${port}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} is not running on port ${port}`);
    return false;
  }
}

async function checkDocker() {
  try {
    const { stdout } = await execPromise('docker info');
    if (stdout) {
      console.log('✅ Docker is running');
      return true;
    } else {
      console.log('❌ Docker is not running');
      return false;
    }
  } catch (error) {
    console.log('❌ Docker is not running or not installed');
    return false;
  }
}

async function checkSupabase() {
  try {
    const { stdout } = await execPromise('npx supabase status');
    if (stdout.includes('API URL')) {
      console.log('✅ Supabase is running');
      return true;
    } else {
      console.log('❌ Supabase is not running');
      return false;
    }
  } catch (error) {
    console.log('❌ Supabase is not running or not installed');
    return false;
  }
}

async function main() {
  console.log('NAMASTE-SYNC Service Status Check');
  console.log('=================================');
  
  const results = await Promise.all([
    checkDocker(),
    checkSupabase(),
    checkService(27017, 'MongoDB'),
    checkService(3001, 'Backend API'),
    checkService(8080, 'Frontend')
  ]);
  
  const allRunning = results.every(result => result === true);
  
  console.log('\nSummary:');
  if (allRunning) {
    console.log('✅ All services are running properly!');
    console.log('You can now access the application at: http://localhost:8080');
  } else {
    console.log('❌ Some services are not running. Please check the output above.');
    console.log('\nTo fix issues:');
    console.log('1. Make sure Docker Desktop is running');
    console.log('2. Start Supabase: npx supabase start');
    console.log('3. Start MongoDB service or run mongod');
    console.log('4. Start the application: npm run dev:full');
  }
}

main();