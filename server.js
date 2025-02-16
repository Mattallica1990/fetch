const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/search', async (req, res) => {
  const mainUrl = req.query.url;
  const searchTerm = 'marketing_price_range';
  console.log(`Main URL: ${mainUrl}`); // Log the main URL

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Navigate to the main page
    await page.goto(mainUrl, { waitUntil: 'networkidle0', timeout: 60000 });

    // Wait for a specific time to ensure all content is loaded
    await new Promise(resolve => setTimeout(resolve, 15000)); // Wait for 15 seconds

    // Extract the full outer HTML content
    const pageSource = await page.evaluate(() => document.documentElement.outerHTML);

    // Save the HTML content to a file
    const filePath = path.join(__dirname, 'pageContent.html');
    fs.writeFileSync(filePath, pageSource);

    // Read the saved HTML file and search for the term
    const savedContent = fs.readFileSync(filePath, 'utf-8');
    const regex = new RegExp(`"${searchTerm}":"([^"]+)"`);
    const match = savedContent.match(regex);
    const foundContent = match ? match[1] : `Term "${searchTerm}" not found in the saved content.`;

    await browser.close();

    // Send the extracted value as JSON
    res.send(`Found content: ${foundContent}`);
  } catch (error) {
    console.error("Error fetching the URL:", error);
    res.status(500).send("Error fetching the URL.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
