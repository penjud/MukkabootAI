/**
 * Test script for debugging login issues
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const USERS_FILE_PATH = process.env.USERS_FILE_PATH || path.join(__dirname, '../../..', 'data/users/users.json');
const TEST_USERNAME = 'admin';
const TEST_PASSWORD = 'password';

// Load users file
function loadUsers() {
  try {
    console.log(`Loading users from: ${USERS_FILE_PATH}`);
    if (!fs.existsSync(USERS_FILE_PATH)) {
      console.error(`Users file does not exist: ${USERS_FILE_PATH}`);
      return null;
    }
    
    const data = fs.readFileSync(USERS_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading users file: ${error.message}`);
    return null;
  }
}

// Test login logic
async function testLogin(username, password) {
  const usersData = loadUsers();
  if (!usersData) {
    console.error('Failed to load users data');
    return false;
  }
  
  // Find user
  const user = usersData.users.find(u => u.username === username);
  if (!user) {
    console.error(`User not found: ${username}`);
    return false;
  }
  
  console.log(`Found user: ${username}, ID: ${user.id}, Role: ${user.role}`);
  
  // Check if passwordHash exists
  if (!user.passwordHash) {
    console.error(`User ${username} has no password hash`);
    return false;
  }
  
  console.log(`Password hash: ${user.passwordHash}`);
  
  // Test password
  try {
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log(`Password match: ${isMatch}`);
    
    // Generate a new hash for comparison
    const newHash = await bcrypt.hash(password, 10);
    console.log(`New hash for the same password: ${newHash}`);
    console.log(`bcrypt library version: ${bcrypt.version || 'unknown'}`);
    
    return isMatch;
  } catch (error) {
    console.error(`Error comparing passwords: ${error.message}`);
    console.error(`Error details:`, error);
    return false;
  }
}

// Run the test
console.log(`=== Authentication Test ===`);
console.log(`Testing login for user: ${TEST_USERNAME} with password: ${TEST_PASSWORD}`);

testLogin(TEST_USERNAME, TEST_PASSWORD)
  .then(result => {
    console.log(`\n=== Test Result ===`);
    console.log(`Login ${result ? 'SUCCESS' : 'FAILED'}`);
    
    if (!result) {
      console.log(`\n=== Troubleshooting ===`);
      console.log(`1. Check if the password hash in users.json is correctly formatted`);
      console.log(`2. Ensure bcryptjs is properly installed and functioning`);
      console.log(`3. Verify the auth service has correct permissions to read the users file`);
    }
  })
  .catch(error => {
    console.error(`Test failed with error: ${error.message}`);
  });
