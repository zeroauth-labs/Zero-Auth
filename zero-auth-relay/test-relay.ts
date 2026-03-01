import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/v1';

async function testSessionCreation() {
  console.log('\n--- Test 2: Session Creation with use_case ---');
  try {
    const res = await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verifier_name: 'Test Setup',
        use_case: 'LOGIN',
        credential_type: 'Test Credential'
      })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
    return data;
  } catch (e) {
    console.error('Error:', e);
  }
}

async function testRateLimit() {
  console.log('\n--- Test 3: Session Creation Rate Limit (10 per minute) ---');
  let lastStatus = 0;
  let lastResponse = null;
  // We already made 1 request above, need to make >10 to hit limit
  for(let i=0; i < 11; i++) {
    const res = await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verifier_name: 'Spam' })
    });
    lastStatus = res.status;
    lastResponse = await res.json();
    process.stdout.write('.');
  }
  console.log('\nFinal Request Status (Should be 429):', lastStatus);
  console.log('Final Response:', lastResponse);
}

async function testProofValidation() {
  console.log('\n--- Test 5: Proof Submission Validation (Zod) ---');
  const fakeSessionId = "11111111-1111-1111-1111-111111111111";
  
  const res = await fetch(`${API_URL}/sessions/${fakeSessionId}/proof`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      proof: {
        pi_a: ["1", "2"],
        pi_c: ["1", "2"]
      }
    })
  });
  const data = await res.json();
  console.log('Status (Should be 400 Bad Request):', res.status);
  console.log('Validation Error:', JSON.stringify(data.details, null, 2));
}

async function runTests() {
  console.log('Waiting for server to start...');
  await new Promise(r => setTimeout(r, 2000));
  
  const createdSession = await testSessionCreation();
  
  if (createdSession && createdSession.session_id) {
    console.log('\n--- Test 4 & 7: SSE Stream & Worker Validation ---');
    console.log(`Connecting to SSE stream for session ${createdSession.session_id}...`);
    
    try {
      const { spawn } = require('child_process');
      const curl = spawn('curl', ['-N', '-s', `${API_URL}/sessions/${createdSession.session_id}/stream`]);
      curl.stdout.on('data', (data: any) => {
        console.log('[SSE EVENT]:', data.toString().trim());
      });
      
      await new Promise(r => setTimeout(r, 1000));
      
      console.log('Submitting properly formed proof to trigger worker...');
      const req = await fetch(`${API_URL}/sessions/${createdSession.session_id}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof: {
             pi_a: ["1", "2"],
             pi_b: [["1", "2"], ["3", "4"]],
             pi_c: ["1", "2"]
          }
        })
      });
      const proofRes = await req.json();
      console.log('Proof submission status:', req.status);
      console.log('Proof response (worker handles crypto validation):', proofRes);
      
      await new Promise(r => setTimeout(r, 1000));
      curl.kill();
    } catch(e) {
      console.error(e)
    }
  }
  
  await testProofValidation();
  await testRateLimit();
  
  process.exit(0);
}

runTests();
