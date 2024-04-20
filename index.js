const puppeteer = require("puppeteer");
const express = require("express");
const app = express();

app.get("/", async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    
    // تحميل الصفحة المطلوبة
    await page.goto("https://mangatak.com/6392673069-the-lords-coins-arent-decreasing-chapter-112/");
    
    // انتظار حتى يتم تحميل الصفحة بشكل كامل
    await page.waitForSelector('#readerarea img');
    
    // استخراج عناصر img داخل div readerarea
    const imageUrls = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('#readerarea img'));
      return images.map(img => img.getAttribute('src')).filter(src => !src.includes('i.ibb.co/hfgDCBF/image.webp'));
    });
    
    await browser.close();
    
    // إرسال الروابط كاستجابة
    res.json(imageUrls);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running....");
});
