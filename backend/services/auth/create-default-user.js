const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const USERS_FILE_PATH = process.env.USERS_FILE_PATH || path.join(__dirname, '../../..', 'data/users/users.json');
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'password';
const SALT_ROUNDS = 10;

// Create default user
async function createDefaultUser() {
  try {
    console.log(`Using users file path: ${USERS_FILE_PATH}`);
    
    // Ensure directory exists
    const dir = path.dirname(USERS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }

    // Check if users file exists and read it
    let usersData = { users: [], refreshTokens: {}, passwordResetTokens: {} };
    if (fs.existsSync(USERS_FILE_PATH)) {
      try {
        const fileContent = fs.readFileSync(USERS_FILE_PATH, 'utf8');
        const parsedData = JSON.parse(fileContent);
        
        // Validate the structure
        if (parsedData && typeof parsedData === 'object') {
          usersData = parsedData;
          
          // Ensure users array exists
          if (!Array.isArray(usersData.users)) {
            usersData.users = [];
          }
          
          console.log(`Found existing users file with ${usersData.users.length} users`);
          
          // Ensure refreshTokens and passwordResetTokens objects exist
          if (!usersData.refreshTokens) {
            usersData.refreshTokens = {};
          }
          if (!usersData.passwordResetTokens) {
            usersData.passwordResetTokens = {};
          }
        } else {
          console.log('Invalid users file format, creating new file');
        }
      } catch (parseError) {
        console.error(`Error parsing users file: ${parseError.message}`);
        console.log('Creating new users file');
      }
    } else {
      console.log('No existing users file found, will create new one');
    }

    // Check if admin user already exists
    const adminExists = Array.isArray(usersData.users) && 
                         usersData.users.some(user => user.username === DEFAULT_USERNAME);
    
    if (adminExists) {
      console.log(`User '${DEFAULT_USERNAME}' already exists, updating password...`);
      
      // Update existing admin user's password
      for (let i = 0; i < usersData.users.length; i++) {
        if (usersData.users[i].username === DEFAULT_USERNAME) {
          // Hash password with bcryptjs
          const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
          usersData.users[i].passwordHash = passwordHash;
          usersData.users[i].updatedAt = new Date().toISOString();
          break;
        }
      }
    } else {
      // Create new admin user
      
      // Hash password with bcryptjs
      const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
      
      // Create admin user
      const adminUser = {
        id: Date.now().toString(),
        username: DEFAULT_USERNAME,
        passwordHash: passwordHash,
        email: 'admin@mukkabootai.local',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to users array
      usersData.users.push(adminUser);
    }

    // Write to file
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(usersData, null, 2));
    
    console.log(`Successfully created/updated default user '${DEFAULT_USERNAME}' with password '${DEFAULT_PASSWORD}'`);
    console.log(`Users file saved at: ${USERS_FILE_PATH}`);
  } catch (error) {
    console.error('Error creating/updating default user:', error);
  }
}

// Run the function
createDefaultUser();
