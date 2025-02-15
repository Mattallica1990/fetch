const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
    <form action="/fetch">
      <label for="url">Enter Main URL:</label>
      <input type="text" id="url" name="url" required>
      <button type="submit">Fetch Marketing Price Range</button>
    </form>
  `);
});

app.get('/fetch', async (req, res) => {
  const mainUrl = req.query.url;
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    let foundContent = 'Content not found';

    // Enable request interception
    await page.setRequestInterception(true);

    // Intercept network requests and responses
    page.on('request', request => {
      if (request.url().includes('collect.tealiumiq.com/vdata/i.gif')) {
        const urlObj = new URL(request.url());
        const marketingPriceRange = urlObj.searchParams.get('listing.marketing_price_range');
        if (marketingPriceRange) {
          foundContent = marketingPriceRange;
        }
      }
      request.continue();
    });

    // Navigate to the main page
    await page.goto(mainUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for a specific timeout to ensure all network requests are captured
    await new Promise(resolve => setTimeout(resolve, 15000)); // Adjust the timeout as needed

    await browser.close();

    // Send the extracted value as JSON
    res.json({ result: foundContent !== 'Content not found' ? foundContent : "Marketing Price Range not found." });
  } catch (error) {
    console.error("Error fetching the page:", error);
    res.status(500).json({ error: "Error fetching the page." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
