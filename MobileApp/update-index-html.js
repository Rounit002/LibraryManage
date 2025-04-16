const fs = require('fs');
const path = require('path');

const wwwIndexPath = path.join(__dirname, 'www', 'index.html');
let indexHtml = fs.readFileSync(wwwIndexPath, 'utf8');

// Add <base href="/"> if it doesn't exist
if (!indexHtml.includes('<base href="/">')) {
    indexHtml = indexHtml.replace(
        '</head>',
        '  <base href="/">\n</head>'
    );
}

// Add <script src="cordova.js"></script> if it doesn't exist
if (!indexHtml.includes('<script src="cordova.js"></script>')) {
    indexHtml = indexHtml.replace(
        '</body>',
        '  <script src="cordova.js"></script>\n</body>'
    );
}

// Remove the gptengineer.js script
indexHtml = indexHtml.replace(
    /<script src="https:\/\/cdn\.gpteng\.co\/gptengineer\.js" type="module"><\/script>/,
    '<!-- Removed gptengineer.js script -->'
);

fs.writeFileSync(wwwIndexPath, indexHtml, 'utf8');
console.log('Updated www/index.html for Cordova.');