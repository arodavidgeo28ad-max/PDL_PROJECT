const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
  const key = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;
  console.log("Testing with Key:", key ? key.substring(0, 10) + "..." : "MISSING");
  
  if (!key) return;

  try {
    const genAI = new GoogleGenerativeAI(key);
    // Try models/gemini-1.5-flash which matches the models list precisely
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
    
    console.log("Sending test message...");
    const result = await model.generateContent("Hello, are you there?");
    const response = await result.response;
    console.log("Success! Response:", response.text());
  } catch (err) {
    console.error("DETAILED ERROR:");
    console.error("Message:", err.message);
    console.error("Status:", err.status);
    if (err.response) {
      console.error("Response Data:", JSON.stringify(err.response, null, 2));
    }
    console.error("Stack:", err.stack);
  }
}

test();
