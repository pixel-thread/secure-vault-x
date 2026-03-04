const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function test() {
  await prisma.user.updateMany({ data: { mfaEnabled: false } }); // Disable MFA for test
  
  try {
    const login = await axios.post('http://127.0.0.1:3000/api/auth/password/login', {
      email: 'jyrwaboys@gmail.com',
      password: '123Clashofclan@'
    });
    console.log("Login OK");
    const { accessToken, refreshToken } = login.data.data;
    
    try {
      const me = await axios.get('http://127.0.0.1:3000/api/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log("Me SUCCESS, user ID:", me.data.data.id);
    } catch (err) {
      console.log("Me failed:", err.response ? err.response.status : err.message);
    }
    
    try {
      const refresh = await axios.post('http://127.0.0.1:3000/api/auth/refresh', {
        refreshToken
      });
      console.log("Refresh SUCCESS, new access:", !!refresh.data.data.accessToken);
    } catch(err) {
        console.log("Refresh failed:", err.response ? err.response.status : err.message);
        if (err.response) console.log(err.response.data);
    }
  } catch (err) {
    if(err.response) console.error("Error Status:", err.response.status, "Body:", err.response.data);
    else console.error(err.message);
  }
}
test();
