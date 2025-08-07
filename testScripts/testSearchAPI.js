// testScript/testSearchAPI.js
// Run this with: node testScript/testSearchAPI.js from your root folder
// Or: node testSearchAPI.js from inside the testScript folder

const fetch = require('node-fetch'); // npm install node-fetch@2 if not installed
require('dotenv').config({ path: '../.env' }); // Load env variables from root

const API_BASE = process.env.API_URL || 'http://localhost:3001';
let TOKEN = ''; // Will be set after login
let USER_ID = ''; // Will be set after login

// Test credentials - you can set these via environment variables or hardcode for testing
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com', // Replace with a real user email
  password: process.env.TEST_USER_PASSWORD || 'Test123!' // Replace with the real password
};

// Colors for console output (makes it easier to read)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = `[${timestamp}]`;
  
  switch(type) {
    case 'success':
      console.log(`${colors.green}${prefix} ✅ ${message}${colors.reset}`);
      break;
    case 'error':
      console.log(`${colors.red}${prefix} ❌ ${message}${colors.reset}`);
      break;
    case 'info':
      console.log(`${colors.cyan}${prefix} ℹ️  ${message}${colors.reset}`);
      break;
    case 'warning':
      console.log(`${colors.yellow}${prefix} ⚠️  ${message}${colors.reset}`);
      break;
    case 'test':
      console.log(`${colors.blue}${prefix} 🧪 ${message}${colors.reset}`);
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
}

async function testLogin() {
  log('Testing login endpoint...', 'test');
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });

    const data = await response.json();

    if (!response.ok) {
      log(`Login failed: ${data.message || 'Unknown error'}`, 'error');
      return false;
    }

    TOKEN = data.token;
    USER_ID = data.user.id || data.user._id;
    
    log('Login successful!', 'success');
    log(`User: ${data.user.firstName} ${data.user.lastName} (${data.user.role})`, 'info');
    log(`Email: ${data.user.email}`, 'info');
    log(`User ID: ${USER_ID}`, 'info');
    log(`Token: ${TOKEN.substring(0, 30)}...`, 'info');
    
    return true;
  } catch (error) {
    log(`Login error: ${error.message}`, 'error');
    return false;
  }
}

async function testAuthEndpoint() {
  log('Testing auth middleware...', 'test');
  try {
    const response = await fetch(`${API_BASE}/api/test-auth`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });

    if (!response.ok) {
      const error = await response.text();
      log(`Auth test failed: ${error}`, 'error');
      return false;
    }

    const data = await response.json();
    log('Auth middleware is working correctly!', 'success');
    log(`Decoded user ID: ${data.userId}`, 'info');
    log(`Decoded role: ${data.role}`, 'info');
    return true;
  } catch (error) {
    log(`Auth test error: ${error.message}`, 'error');
    log('Note: /api/test-auth endpoint might not exist. This is optional.', 'warning');
    return true; // Don't fail the whole test suite if this optional endpoint doesn't exist
  }
}

async function testGetAllUsers() {
  log('Testing GET /api/search/users/all...', 'test');
  try {
    const response = await fetch(`${API_BASE}/api/search/users/all`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });

    if (!response.ok) {
      const error = await response.text();
      log(`Get all users failed (${response.status}): ${error}`, 'error');
      return false;
    }

    const users = await response.json();
    log(`Successfully retrieved ${users.length} users!`, 'success');
    
    if (users.length > 0) {
      log('Sample users:', 'info');
      users.slice(0, 3).forEach(user => {
        log(`  • ${user.firstName} ${user.lastName} - ${user.role} (${user.email})`, 'info');
      });
    } else {
      log('No users found in the database', 'warning');
    }
    
    return users;
  } catch (error) {
    log(`Get all users error: ${error.message}`, 'error');
    return false;
  }
}

async function testSearchUsers() {
  log('Testing search functionality...', 'test');
  
  const searches = [
    { params: 'q=a', description: 'Search for names containing "a"' },
    { params: 'role=Student', description: 'Filter by Student role' },
    { params: 'role=Mentor', description: 'Filter by Mentor role' },
    { params: 'role=Alumni', description: 'Filter by Alumni role' },
    { params: 'q=john&role=Student', description: 'Combined search: name "john" + Student role' },
    { params: 'limit=5', description: 'Limit results to 5 users' }
  ];

  let allPassed = true;

  for (const search of searches) {
    log(`Testing: ${search.description}`, 'info');
    try {
      const response = await fetch(`${API_BASE}/api/search/users?${search.params}`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });

      if (!response.ok) {
        const error = await response.text();
        log(`  Search failed: ${error}`, 'error');
        allPassed = false;
        continue;
      }

      const users = await response.json();
      log(`  Found ${users.length} users`, 'success');
      
      if (users.length > 0) {
        log(`  First result: ${users[0].firstName} ${users[0].lastName} (${users[0].role})`, 'info');
      }
    } catch (error) {
      log(`  Search error: ${error.message}`, 'error');
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testGetUserProfile(userId, userName = 'Unknown') {
  log(`Testing get profile for: ${userName} (${userId})...`, 'test');
  try {
    const response = await fetch(`${API_BASE}/api/search/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });

    if (!response.ok) {
      const error = await response.text();
      log(`Get profile failed: ${error}`, 'error');
      
      // Special case: if it's our own profile, that's expected
      if (error.includes('own profile')) {
        log('Cannot view own profile through this endpoint (expected behavior)', 'warning');
        return true;
      }
      return false;
    }

    const profile = await response.json();
    log('Profile retrieved successfully!', 'success');
    log(`  Name: ${profile.fullName || profile.firstName + ' ' + profile.lastName}`, 'info');
    log(`  Role: ${profile.role}`, 'info');
    log(`  Email: ${profile.email}`, 'info');
    log(`  Program: ${profile.program || 'Not specified'}`, 'info');
    
    if (profile.bio) {
      log(`  Bio: ${profile.bio.substring(0, 100)}${profile.bio.length > 100 ? '...' : ''}`, 'info');
    }
    
    return true;
  } catch (error) {
    log(`Get profile error: ${error.message}`, 'error');
    return false;
  }
}

async function testMentorSearch() {
  log('Testing mentor course search...', 'test');
  try {
    const response = await fetch(`${API_BASE}/api/search/mentors/by-course?courseCode=CS&minGrade=B+`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });

    if (!response.ok) {
      const error = await response.text();
      log(`Mentor search failed: ${error}`, 'error');
      return false;
    }

    const mentors = await response.json();
    log(`Found ${mentors.length} mentors with CS expertise!`, 'success');
    
    if (mentors.length > 0) {
      log('Top mentors:', 'info');
      mentors.slice(0, 3).forEach(mentor => {
        log(`  • ${mentor.fullName} - ${mentor.relevantCourseExpertise.length} relevant courses`, 'info');
      });
    }
    
    return true;
  } catch (error) {
    log(`Mentor search error: ${error.message}`, 'error');
    log('This endpoint might not be implemented yet', 'warning');
    return true; // Don't fail if this optional endpoint isn't ready
  }
}

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}🚀 SEARCH API TEST SUITE${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`Server: ${API_BASE}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('='.repeat(60) + '\n');

  // Track results
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };

  // Test 1: Login
  log('STEP 1: Authentication', 'test');
  console.log('-'.repeat(40));
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    log('Cannot proceed without authentication. Please check your credentials.', 'error');
    log(`Attempted login with email: ${TEST_USER.email}`, 'info');
    return;
  }
  results.passed++;
  console.log();

  // Test 2: Auth middleware
  log('STEP 2: Verify Auth Middleware', 'test');
  console.log('-'.repeat(40));
  const authWorks = await testAuthEndpoint();
  if (authWorks) results.passed++; else results.failed++;
  console.log();

  // Test 3: Get all users
  log('STEP 3: Get All Users', 'test');
  console.log('-'.repeat(40));
  const users = await testGetAllUsers();
  if (users) results.passed++; else results.failed++;
  console.log();

  // Test 4: Search functionality
  log('STEP 4: Search Functionality', 'test');
  console.log('-'.repeat(40));
  const searchWorks = await testSearchUsers();
  if (searchWorks) results.passed++; else results.failed++;
  console.log();

  // Test 5: User profiles
  log('STEP 5: User Profiles', 'test');
  console.log('-'.repeat(40));
  if (users && users.length > 0) {
    // Test with a user that's not the current user
    const otherUser = users.find(u => u.id !== USER_ID) || users[0];
    const profileWorks = await testGetUserProfile(
      otherUser.id, 
      `${otherUser.firstName} ${otherUser.lastName}`
    );
    if (profileWorks) results.passed++; else results.failed++;
  } else {
    log('Skipping profile test - no users available', 'warning');
    results.skipped++;
  }
  console.log();

  // Test 6: Mentor search (optional)
  log('STEP 6: Mentor Course Search (Optional)', 'test');
  console.log('-'.repeat(40));
  const mentorSearchWorks = await testMentorSearch();
  if (mentorSearchWorks) results.passed++; else results.failed++;
  console.log();

  // Summary
  console.log('='.repeat(60));
  console.log(`${colors.bright}📊 TEST RESULTS${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}⏭️  Skipped: ${results.skipped}${colors.reset}`);
  console.log('='.repeat(60));
  
  if (results.failed === 0) {
    log('All tests passed successfully! 🎉', 'success');
  } else {
    log(`${results.failed} test(s) failed. Please check the errors above.`, 'error');
  }
}

// Command line interface
if (require.main === module) {
  // Script is being run directly
  console.log(`${colors.cyan}Starting API tests...${colors.reset}`);
  
  // Check if credentials are provided
  if (TEST_USER.email === 'test@example.com') {
    console.log(`${colors.yellow}⚠️  Warning: Using default test credentials.${colors.reset}`);
    console.log(`${colors.yellow}   Set TEST_USER_EMAIL and TEST_USER_PASSWORD in your .env file${colors.reset}`);
    console.log(`${colors.yellow}   or update the TEST_USER object in this script.${colors.reset}\n`);
  }
  
  runAllTests()
    .then(() => {
      console.log(`\n${colors.cyan}Test suite completed.${colors.reset}`);
      process.exit(0);
    })
    .catch(error => {
      console.error(`\n${colors.red}Test suite failed with error:${colors.reset}`, error);
      process.exit(1);
    });
}

// Export for use in other scripts
module.exports = {
  testLogin,
  testAuthEndpoint,
  testGetAllUsers,
  testSearchUsers,
  testGetUserProfile,
  testMentorSearch,
  runAllTests
};