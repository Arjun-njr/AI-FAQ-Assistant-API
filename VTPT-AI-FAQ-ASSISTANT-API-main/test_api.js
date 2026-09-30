const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./src/app');
const User = require('./src/models/User');
const FAQ = require('./src/models/FAQ');

// Load environment variables
dotenv.config();

const runTests = async () => {
  console.log('=== Starting API Endpoint Integration Tests ===');

  // 1. Connect to database
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai_faq_assistant';
  console.log(`Connecting to MongoDB at: ${mongoUri}...`);
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected successfully.');

  // 2. Start server on a dynamic port
  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`Test server running on port ${port} (Base URL: ${baseUrl})`);

    let authToken = '';
    let testUserId = '';
    let testFaqId = '';

    const testEmail = `test_user_${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    const testName = 'Test User';

    try {
      // ---------------------------------------------------------
      // Test 1: Health check
      // ---------------------------------------------------------
      console.log('\n[Test 1] GET /');
      const healthRes = await fetch(`${baseUrl}/`);
      const healthData = await healthRes.json();
      console.log(`Status: ${healthRes.status}`);
      console.log('Response:', healthData);
      if (healthRes.status !== 200 || !healthData.success) {
        throw new Error('Health check failed');
      }

      // ---------------------------------------------------------
      // Test 2: User Registration
      // ---------------------------------------------------------
      console.log('\n[Test 2] POST /api/auth/register');
      const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testName,
          email: testEmail,
          password: testPassword,
        }),
      });
      const registerData = await registerRes.json();
      console.log(`Status: ${registerRes.status}`);
      console.log('Response:', registerData);
      if (registerRes.status !== 201 || !registerData.success) {
        throw new Error('Registration failed');
      }
      testUserId = registerData.data._id;

      // ---------------------------------------------------------
      // Test 3: Duplicate Registration Prevention
      // ---------------------------------------------------------
      console.log('\n[Test 3] POST /api/auth/register (Duplicate Email Check)');
      const dupRegisterRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testName,
          email: testEmail,
          password: testPassword,
        }),
      });
      const dupRegisterData = await dupRegisterRes.json();
      console.log(`Status: ${dupRegisterRes.status} (Expected: 400)`);
      console.log('Response:', dupRegisterData);
      if (dupRegisterRes.status !== 400 || dupRegisterData.success) {
        throw new Error('Duplicate registration should have failed but did not');
      }

      // ---------------------------------------------------------
      // Test 4: User Login
      // ---------------------------------------------------------
      console.log('\n[Test 4] POST /api/auth/login');
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });
      const loginData = await loginRes.json();
      console.log(`Status: ${loginRes.status}`);
      console.log('Response:', loginData);
      if (loginRes.status !== 200 || !loginData.success) {
        throw new Error('Login failed');
      }
      authToken = loginData.data.token;

      // ---------------------------------------------------------
      // Test 5: Get User Profile (Protected)
      // ---------------------------------------------------------
      console.log('\n[Test 5] GET /api/auth/profile');
      const profileRes = await fetch(`${baseUrl}/api/auth/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const profileData = await profileRes.json();
      console.log(`Status: ${profileRes.status}`);
      console.log('Response:', profileData);
      if (profileRes.status !== 200 || !profileData.success) {
        throw new Error('Get profile failed');
      }

      // ---------------------------------------------------------
      // Test 6: Create FAQ (Protected)
      // ---------------------------------------------------------
      console.log('\n[Test 6] POST /api/faqs');
      const createFaqRes = await fetch(`${baseUrl}/api/faqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          question: 'What is Express.js?',
          answer: 'Express is a minimal and flexible Node.js web application framework that provides a robust set of features.',
          category: 'Technology',
        }),
      });
      const createFaqData = await createFaqRes.json();
      console.log(`Status: ${createFaqRes.status}`);
      console.log('Response:', createFaqData);
      if (createFaqRes.status !== 201 || !createFaqData.success) {
        throw new Error('FAQ creation failed');
      }
      testFaqId = createFaqData.data._id;

      // ---------------------------------------------------------
      // Test 7: Get All FAQs (Public)
      // ---------------------------------------------------------
      console.log('\n[Test 7] GET /api/faqs');
      const getFaqsRes = await fetch(`${baseUrl}/api/faqs`);
      const getFaqsData = await getFaqsRes.json();
      console.log(`Status: ${getFaqsRes.status}`);
      console.log(`Count: ${getFaqsData.count}`);
      if (getFaqsRes.status !== 200 || !getFaqsData.success) {
        throw new Error('Get all FAQs failed');
      }

      // ---------------------------------------------------------
      // Test 8: Get FAQ by ID (Public)
      // ---------------------------------------------------------
      console.log('\n[Test 8] GET /api/faqs/:id');
      const getFaqByIdRes = await fetch(`${baseUrl}/api/faqs/${testFaqId}`);
      const getFaqByIdData = await getFaqByIdRes.json();
      console.log(`Status: ${getFaqByIdRes.status}`);
      console.log('Response:', getFaqByIdData);
      if (getFaqByIdRes.status !== 200 || !getFaqByIdData.success) {
        throw new Error('Get FAQ by ID failed');
      }

      // ---------------------------------------------------------
      // Test 8b: Get FAQ by Invalid ID Format (Public)
      // ---------------------------------------------------------
      console.log('\n[Test 8b] GET /api/faqs/invalid-id-format');
      const getFaqInvalidIdRes = await fetch(`${baseUrl}/api/faqs/invalid-id-format`);
      const getFaqInvalidIdData = await getFaqInvalidIdRes.json();
      console.log(`Status: ${getFaqInvalidIdRes.status} (Expected: 400)`);
      console.log('Response:', getFaqInvalidIdData);
      if (getFaqInvalidIdRes.status !== 400 || getFaqInvalidIdData.success) {
        throw new Error('Get FAQ by invalid ID format should have returned 400 but did not');
      }

      // ---------------------------------------------------------
      // Test 9: Search FAQs by Category/Keyword (Public)
      // ---------------------------------------------------------
      console.log('\n[Test 9] GET /api/faqs/search?q=Express');
      const searchRes = await fetch(`${baseUrl}/api/faqs/search?q=Express`);
      const searchData = await searchRes.json();
      console.log(`Status: ${searchRes.status}`);
      console.log(`Found: ${searchData.count}`);
      if (searchRes.status !== 200 || !searchData.success) {
        throw new Error('Search FAQs failed');
      }

      // ---------------------------------------------------------
      // Test 10: Update FAQ (Protected)
      // ---------------------------------------------------------
      console.log('\n[Test 10] PUT /api/faqs/:id');
      const updateRes = await fetch(`${baseUrl}/api/faqs/${testFaqId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          question: 'What is Express.js? (Updated)',
          answer: 'Express is the standard de-facto web framework for Node.js.',
        }),
      });
      const updateData = await updateRes.json();
      console.log(`Status: ${updateRes.status}`);
      console.log('Response:', updateData);
      if (updateRes.status !== 200 || !updateData.success) {
        throw new Error('Update FAQ failed');
      }

      // ---------------------------------------------------------
      // Test 11: AI Answer Endpoint - Key Handled Gracefully Check
      // ---------------------------------------------------------
      console.log('\n[Test 11] POST /api/ai/answer (API Key Graceful Error Check)');
      const aiAnswerRes = await fetch(`${baseUrl}/api/ai/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          question: 'What is AI?',
        }),
      });
      const aiAnswerData = await aiAnswerRes.json();
      console.log(`Status: ${aiAnswerRes.status}`);
      console.log('Response:', aiAnswerData);
      
      // If the user has configured their API key, it will be 200 success.
      // If not configured, it must be 400/500 with success: false.
      // In either case, the server must handle it gracefully and return JSON.
      if (aiAnswerRes.status === 200) {
        if (!aiAnswerData.success || !aiAnswerData.answer) {
          throw new Error('AI answer succeeded but returned invalid response body');
        }
        console.log('AI Answer Generation Succeeded (Gemini API Key is valid).');
      } else {
        if (aiAnswerData.success) {
          throw new Error('AI answer failed but returned success: true');
        }
        console.log('AI Answer Error caught and formatted gracefully by error middleware.');
      }

      // ---------------------------------------------------------
      // Test 12: AI FAQ Generator Endpoint - Key Handled Gracefully Check
      // ---------------------------------------------------------
      console.log('\n[Test 12] POST /api/ai/generate-faq (API Key Graceful Error Check)');
      const aiFaqRes = await fetch(`${baseUrl}/api/ai/generate-faq`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          topic: 'ExpressJS',
        }),
      });
      const aiFaqData = await aiFaqRes.json();
      console.log(`Status: ${aiFaqRes.status}`);
      console.log('Response:', aiFaqData);

      if (aiFaqRes.status === 200) {
        if (!aiFaqData.success || !aiFaqData.question || !aiFaqData.answer) {
          throw new Error('AI FAQ succeeded but returned invalid response body');
        }
        console.log('AI FAQ Generation Succeeded (Gemini API Key is valid).');
      } else {
        if (aiFaqData.success) {
          throw new Error('AI FAQ failed but returned success: true');
        }
        console.log('AI FAQ Error caught and formatted gracefully by error middleware.');
      }

      // ---------------------------------------------------------
      // Test 13: Delete FAQ (Protected)
      // ---------------------------------------------------------
      console.log('\n[Test 13] DELETE /api/faqs/:id');
      const deleteRes = await fetch(`${baseUrl}/api/faqs/${testFaqId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const deleteData = await deleteRes.json();
      console.log(`Status: ${deleteRes.status}`);
      console.log('Response:', deleteData);
      if (deleteRes.status !== 200 || !deleteData.success) {
        throw new Error('Delete FAQ failed');
      }

      console.log('\n=== All API Endpoint Tests Completed Successfully! ===');

    } catch (err) {
      console.error('\n!!! API Test Encountered an Error:', err.message);
    } finally {
      // Cleanup database records to leave it pristine
      console.log('\nCleaning up test records from database...');
      if (testUserId) {
        await User.deleteOne({ _id: testUserId });
        console.log(`Deleted test user: ${testUserId}`);
      }
      if (testFaqId) {
        await FAQ.deleteOne({ _id: testFaqId });
        console.log(`Deleted test FAQ: ${testFaqId}`);
      }

      // Close server and database connection
      console.log('Closing server and Mongoose connection...');
      server.close();
      await mongoose.connection.close();
      console.log('Done. Connections closed cleanly.');
    }
  });
};

runTests().catch(console.error);
