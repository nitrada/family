// Memory + GitHub Fallback Solution
let emailHistory = [];
let currentIndex = 0;

// Load from GitHub as fallback when memory is empty
async function loadFromGitHub() {
  try {
    console.log('Loading fallback data from GitHub...');
    const response = await fetch('https://raw.githubusercontent.com/nitrada/family/main/data/latest-email.json');
    if (response.ok) {
      const data = await response.json();
      console.log('Successfully loaded from GitHub:', data.subject);
      return [data]; // Return as array for consistency
    }
  } catch (error) {
    console.error('GitHub fallback failed:', error);
  }
  
  // Ultimate fallback
  return [{
    subject: "Welcome to Family Display",
    textContent: "Send an email to family@stoll.studio to see it appear here!",
    sender: "System",
    timestamp: new Date().toISOString(),
    id: "default-1"
  }];
}

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
      // Initialize with GitHub data if memory is empty
      if (emailHistory.length === 0) {
        emailHistory = await loadFromGitHub();
        currentIndex = 0;
        console.log('Initialized email history from GitHub, total emails:', emailHistory.length);
      }
      
      // Handle cycling actions
      if (action === 'next') {
        if (emailHistory.length > 1) {
          currentIndex = (currentIndex + 1) % emailHistory.length;
          console.log('Cycled to next email, index:', currentIndex);
        }
      } else if (action === 'previous') {
        if (emailHistory.length > 1) {
          currentIndex = (currentIndex - 1 + emailHistory.length) % emailHistory.length;
          console.log('Cycled to previous email, index:', currentIndex);
        }
      }
      
      // Return current email with metadata
      const currentEmail = emailHistory[currentIndex] || emailHistory[0];
      res.status(200).json({
        ...currentEmail,
        meta: {
          currentIndex: currentIndex + 1,
          totalEmails: emailHistory.length,
          hasMultiple: emailHistory.length > 1,
          source: emailHistory.length === 1 && currentEmail.id === 'default-1' ? 'default' : 'data'
        }
      });
    } catch (error) {
      console.error('Error in GET:', error);
      res.status(200).json({
        subject: "Error Loading",
        textContent: "Unable to load email data",
        sender: "System",
        timestamp: new Date().toISOString(),
        id: "error-1"
      });
    }
  } 
  else if (req.method === 'POST') {
    try {
      // Process new email from n8n
      const { subject, textContent, sender, timestamp } = req.body;
      
      const newEmail = {
        subject: subject || 'No Subject',
        textContent: textContent || 'No content',
        sender: sender || 'Unknown sender',
        timestamp: timestamp || new Date().toISOString(),
        id: `email-${Date.now()}`
      };
      
      console.log('Received new email via POST:', newEmail.subject);
      
      // Add to beginning of history (newest first)
      emailHistory.unshift(newEmail);
      
      // Keep only last 5 emails
      if (emailHistory.length > 5) {
        emailHistory = emailHistory.slice(0, 5);
        console.log('Trimmed email history to 5 emails');
      }
      
      // Reset to newest email
      currentIndex = 0;
      
      console.log('Email added to history. Total emails:', emailHistory.length);
      
      res.status(200).json({ 
        success: true, 
        message: 'Email added to history',
        totalEmails: emailHistory.length,
        currentEmail: newEmail.subject
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