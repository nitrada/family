import { kv } from '@vercel/kv';

// Default email content
const defaultEmail = {
  subject: "Welcome to Family Display",
  textContent: "Send an email to family@stoll.studio to see it appear here!",
  sender: "System",
  timestamp: new Date().toISOString(),
  id: "default-1"
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const action = req.query.action;
    
    try {
      // Get email history from KV
      let emailHistory = await kv.get('email-history') || [];
      let currentIndex = await kv.get('current-index') || 0;
      
      // If no history exists, create default
      if (emailHistory.length === 0) {
        emailHistory = [defaultEmail];
        currentIndex = 0;
        await kv.set('email-history', emailHistory);
        await kv.set('current-index', currentIndex);
      }
      
      // Handle cycling actions
      if (action === 'next') {
        if (emailHistory.length > 1) {
          currentIndex = (currentIndex + 1) % emailHistory.length;
          await kv.set('current-index', currentIndex);
        }
      } else if (action === 'previous') {
        if (emailHistory.length > 1) {
          currentIndex = (currentIndex - 1 + emailHistory.length) % emailHistory.length;
          await kv.set('current-index', currentIndex);
        }
      }
      
      // Return current email with metadata
      const currentEmail = emailHistory[currentIndex] || emailHistory[0];
      res.status(200).json({
        ...currentEmail,
        meta: {
          currentIndex: currentIndex + 1,
          totalEmails: emailHistory.length,
          hasMultiple: emailHistory.length > 1
        }
      });
    } catch (error) {
      console.error('Error in GET:', error);
      res.status(200).json(defaultEmail);
    }
  } 
  else if (req.method === 'POST') {
    try {
      // Update email from n8n
      const { subject, textContent, sender, timestamp } = req.body;
      
      const newEmail = {
        subject: subject || 'No Subject',
        textContent: textContent || 'No content',
        sender: sender || 'Unknown sender',
        timestamp: timestamp || new Date().toISOString(),
        id: `email-${Date.now()}` // Unique ID für jede Email
      };
      
      // Get existing history
      let emailHistory = await kv.get('email-history') || [];
      
      // Add new email at the beginning (newest first)
      emailHistory.unshift(newEmail);
      
      // Keep only last 5 emails
      if (emailHistory.length > 5) {
        emailHistory = emailHistory.slice(0, 5);
      }
      
      // Save back to KV
      await kv.set('email-history', emailHistory);
      await kv.set('current-index', 0); // Reset to newest email
      await kv.set('last-update', Date.now()); // For SSE notifications
      
      res.status(200).json({ 
        success: true, 
        message: 'Email added to history',
        totalEmails: emailHistory.length 
      });
    } catch (error) {
      console.error('Error in POST:', error);
      res.status(500).json({ error: 'Failed to update email' });
    }
  } 
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}