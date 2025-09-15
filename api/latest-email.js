// In-memory storage (for demo - use database for production)
let latestEmail = {
  subject: "Hello.",
  textContent: "Sende eine E-Mail an family@stoll.studio um sie hier zu sehen!",
  sender: "System",
  timestamp: new Date().toISOString()
};

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    // Return the latest email
    res.status(200).json(latestEmail);
  } 
  else if (req.method === 'POST') {
    // Update email from n8n
    const { subject, textContent, sender, timestamp } = req.body;
    
    latestEmail = {
      subject: subject || 'No Subject',
      textContent: textContent || 'No content',
      sender: sender || 'Unknown sender',
      timestamp: timestamp || new Date().toISOString()
    };
    
    res.status(200).json({ success: true, message: 'Email updated' });
  } 
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}