const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const token = jwt.sign({ adminId: 'test', email: 'test@example.com' }, JWT_SECRET, { expiresIn: '1h' });

async function testAdmin() {
  try {
    console.log("Fetching admin registrations...");
    const res = await fetch("http://localhost:3000/api/admin/registrations", {
      headers: { Cookie: `admin_token=${token}` }
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log(data);
  } catch(e) { console.error(e); }
}
testAdmin();
