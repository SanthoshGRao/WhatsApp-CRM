async function testRegistration() {
  console.log("Testing POST /api/register...");
  const payload = {
    name: "Automated Test User",
    club: "Rotary Club of Mangalore",
    zone: "Mangalore Region",
    mobile: "9449363577",
    pax: 2,
    adults: 1,
    children: 1,
    vegCount: 1,
    nvegCount: 1,
    amount: 2300,
    guestDetails: "Guest 1: Adult / Veg | Guest 2: Child / Non-Veg",
    paymentId: "111122223333"
  };

  try {
    const res = await fetch("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testRegistration();
