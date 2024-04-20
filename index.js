const puppeteer = require("puppeteer");
const express = require("express");
const app = express();

// عرض الصور باستخدام المسار /images/link
app.get("/images/:link", async (req, res) => {
  try {
    const link = req.params.link;
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    
    // تحميل الصفحة المطلوبة باستخدام المسار المُحدد
    await page.goto(`https://mangatak.com/${link}`);
    
    // انتظار حتى يتم تحميل الصفحة بشكل كامل
    await page.waitForSelector('#readerarea img');
    
    // استخراج عناصر img داخل div readerarea
    const imageUrls = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('#readerarea img'));
      return images.map(img => {
        const src = img.getAttribute('src');
        if (!src.includes('i.ibb.co/hfgDCBF/image.webp')) {
          return src;
        }
      }).filter(Boolean);
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
