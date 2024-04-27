const puppeteer = require("puppeteer");
const express = require("express");
const app = express();
const axios = require("axios");
const cheerio = require("cheerio");

app.get("/mangas", async (req, res) => {
  try {
    // استدعاء صفحة الويب المطلوبة باستخدام axios
    const response = await axios.get("https://mangatak.com/manga/?page=8");

    // تحليل الصفحة باستخدام cheerio
    const $ = cheerio.load(response.data);
    const dataList = [];

    // استخراج البيانات من الصفحة
    $(".listupd .bs").each((index, element) => {
      const title = $(element)
        .find(".tt")
        .text()
        .substring(5)
        .replace("\t\t\t", "");

      const image = $(element).find(".ts-post-image").attr("src");
      const link = $(element)
        .find("a")
        .attr("href")
        .substring(27)
        .replace("/", "");
      const chapter = $(element).find(".epxs").text();

      dataList.push({ title, image, chapter, link });
    });

    // إرسال البيانات كاستجابة
    res.json(dataList);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/details/:link", async (req, res) => {
  try {
    const link = req.params.link;
    const url = `https://mangatak.com/manga/${link}/`;

    // جلب محتوى صفحة التفاصيل
    const response = await axios.get(url);
    const html = response.data;

    // استخراج المعلومات باستخدام Cheerio
    const $ = cheerio.load(html);

    const mangaDetails = {};

    // استخراج العنوان
    // Get title
    const titleElement = $(".entry-title");
    mangaDetails.title = titleElement.text().trim();

    // Get alternative titles
    const altTitlesElement = $(".titlemove .alternative");
    mangaDetails.alternativeTitles = altTitlesElement.text().trim();

    // Get type of work
    const typeOfWorkElement = $(".imptdt:nth-of-type(2) a");
    mangaDetails.typeOfWork = typeOfWorkElement.text().trim();

    // Get status
    const statusElement = $(".imptdt:nth-of-type(1) i");
    mangaDetails.status = statusElement.text().trim();

    // Get release year
    const releaseYearElement = $(".imptdt:nth-of-type(3) i");
    mangaDetails.releaseYear = releaseYearElement.text().trim();

    // Get publisher
    const publisherElement = $(".imptdt:nth-of-type(5) i");
    mangaDetails.publisher = publisherElement.text().trim();

    // Get genres
    mangaDetails.genres = [];
    $(".wd-full .mgen a").each((index, element) => {
      mangaDetails.genres.push($(element).text().trim());
    });

    // Get summary
    const summaryElement = $(".wd-full .entry-content p");
    mangaDetails.summary = summaryElement.text().trim();

    // Get publishing date
    const publishingDateElement = $(".imptdt:nth-of-type(7) time");
    mangaDetails.publishingDate = publishingDateElement.text().trim();

    // Get last update date
    const lastUpdateElement = $(".imptdt:nth-of-type(8) time");
    mangaDetails.lastUpdateDate = lastUpdateElement.text().trim();

    res.json(mangaDetails);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/chapters/:link", async (req, res) => {
  try {
    const link = req.params.link;
    const url = `https://mangatak.com/manga/${link}/`;

    // جلب محتوى صفحة الفصول
    const response = await axios.get(url);
    const html = response.data;

    // استخراج المعلومات باستخدام Cheerio
    const $ = cheerio.load(html);

    const chaptersList = [];

    // العثور على عناصر الفصول واستخراج المعلومات
    $(".eplister ul li").each((index, element) => {
      const chapterNum = $(element)
        .find(".chapternum")
        .text()
        .trim()
        .replace("الفصل\t\t\t\t\t\t\t", "");

      const chapterLink = $(element)
        .find("a")
        .attr("href")
        .substring(21)
        .replace("/", "");
      const chapterDate = $(element).find(".chapterdate").text().trim();

      chaptersList.push({
        chapterNum,
        chapterDate,
        chapterLink,
      });
    });

    res.json(chaptersList);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
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
    await page.waitForSelector("#readerarea img");

    // استخراج عناصر img داخل div readerarea
    const imageUrls = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll("#readerarea img"));
      return images
        .map((img) => {
          const src = img.getAttribute("src");
          if (src.startsWith("https://mangatak.com/wp-content/")) {
            // إذا كانت الصورة من الموقع الهدف، فأضفها إلى القائمة
            return src;
          }
        })
        .filter(Boolean);
    });

    await browser.close();

    // إرسال الروابط كاستجابة
    res.json(imageUrls);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error", error);
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running....");
});
