const express = require("express");
const { chromium } = require("playwright");
const axios = require("axios");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");

const app = express();

app.get("/mangas", async (req, res) => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto("https://mangatak.com/manga/page/2");

    const data = await page.evaluate(() => {
      const dataList = [];
      const items = document.querySelectorAll(".listupd .bs");

      items.forEach((item) => {
        const title = item.querySelector(".tt").innerText;
        const image = item.querySelector(".ts-post-image").getAttribute("src");
        const link = item
          .querySelector("a")
          .getAttribute("href")
          .substring(31)
          .replace("/", "");
        // const linkParts = link.split("/");
        // const rating = item.querySelector(".numscore").innerText;
        // const status = item.querySelector(".status i").innerText;
        // const linkText = linkParts[linkParts.length - 1];

        dataList.push({ title, image, link });
      });

      return dataList;
    });

    await browser.close();

    res.json(data);
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
    mangaDetails.title = $(".entry-title").text().trim();

    // استخراج العنوان البديل
    mangaDetails.alternativeTitles = $(".alternative .desktop-titles")
      .text()
      .trim();

    // استخراج التقييم
    mangaDetails.rating = $(".numscore").text().trim();

    // استخراج حالة العمل
    mangaDetails.status = $(".imptdt .status i").text().trim();

    // استخراج الأنواع
    mangaDetails.genres = [];
    $(".genres-container .mgen a").each((index, element) => {
      mangaDetails.genres.push($(element).text().trim());
    });

    // استخراج الملخص
    mangaDetails.summary = $(".summary .entry-content p").text().trim();

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
        .substring(25)
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

app.get("/images/:link", async (req, res) => {
  try {
    const link = req.params.link;
    const url = `https://thunderscans.com/${link}/`;

    // إنشاء متصفح جديد باستخدام Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // انتقل إلى الصفحة المستهدفة
    await page.goto(url);

    // انتظر حتى تظهر الصور على الصفحة
    await page.waitForSelector(".ts-main-image");

    // استخراج روابط الصور
    const imageLinks = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll(".ts-main-image"));
      return images.map((img) => img.src);
    });

    // أغلق المتصفح بمجرد الانتهاء
    await browser.close();

    res.json({ imageLinks });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
