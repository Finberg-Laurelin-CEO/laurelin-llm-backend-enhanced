const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main page
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laurelin Chat - Coming Soon</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            text-align: center;
            max-width: 600px;
            padding: 2rem;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            font-weight: 300;
        }
        .subtitle {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .status {
            background: rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 10px;
            margin: 2rem 0;
        }
        .checklist {
            text-align: left;
            margin: 1rem 0;
        }
        .checklist li {
            margin: 0.5rem 0;
            list-style: none;
        }
        .checklist li::before {
            content: "✅ ";
            margin-right: 0.5rem;
        }
        .pending::before {
            content: "⏳ ";
        }
        .error::before {
            content: "❌ ";
        }
        .api-test {
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 5px;
        }
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1rem;
            margin: 0.5rem;
        }
        button:hover {
            background: #45a049;
        }
        .result {
            margin-top: 1rem;
            padding: 1rem;
            border-radius: 5px;
            font-family: monospace;
        }
        .success {
            background: rgba(76, 175, 80, 0.2);
            border: 1px solid #4CAF50;
        }
        .error {
            background: rgba(244, 67, 54, 0.2);
            border: 1px solid #f44336;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Laurelin Chat</h1>
        <p class="subtitle">AI-Powered Chatbot for Laurelin Inc</p>
        
        <div class="status">
            <h3>Deployment Status</h3>
            <ul class="checklist">
                <li>DNS Configuration (chat.laurelin-inc.com)</li>
                <li>GCS Bucket Created</li>
                <li>Frontend Server Running</li>
                <li class="pending">Angular Frontend Build</li>
                <li class="pending">Backend API Functions</li>
                <li class="pending">OSS120 Model Integration</li>
                <li class="pending">Authentication Setup</li>
            </ul>
        </div>

        <div class="api-test">
            <h3>Backend API Test</h3>
            <button onclick="testHealthCheck()">Test Health Check</button>
            <button onclick="testLoginAPI()">Test Login API</button>
            <div id="api-result" class="result" style="display: none;"></div>
        </div>

        <p style="margin-top: 2rem; opacity: 0.8;">
            The Laurelin Chat system is being deployed. This page will be replaced with the full Angular application once deployment is complete.
        </p>
    </div>

    <script>
        const API_BASE = 'https://laurelin-backend-975218893454.us-central1.run.app';
        
        function showResult(message, isSuccess = true) {
            const resultDiv = document.getElementById('api-result');
            resultDiv.style.display = 'block';
            resultDiv.className = \`result \${isSuccess ? 'success' : 'error'}\`;
            resultDiv.textContent = message;
        }

        async function testHealthCheck() {
            try {
                const response = await fetch(\`\${API_BASE}/health\`);
                const data = await response.json();
                showResult(\`Health Check: \${JSON.stringify(data, null, 2)}\`, response.ok);
            } catch (error) {
                showResult(\`Health Check Error: \${error.message}\`, false);
            }
        }

        async function testLoginAPI() {
            try {
                const response = await fetch(\`\${API_BASE}/login\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ idToken: 'test-token' })
                });
                const data = await response.json();
                showResult(\`Login API: \${JSON.stringify(data, null, 2)}\`, response.ok);
            } catch (error) {
                showResult(\`Login API Error: \${error.message}\`, false);
            }
        }
    </script>
</body>
</html>
    `);
});

app.listen(PORT, () => {
    console.log(`Frontend server running on port ${PORT}`);
});
