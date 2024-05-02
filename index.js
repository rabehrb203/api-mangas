const puppeteer = require("puppeteer");
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

// إدارة المتصفح بشكل صحيح
const launchBrowser = async () => {
  return await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
};

// جلب البيانات من Mangatak
const fetchDataFromMangatak = async (url) => {
  const response = await axios.get(url);
  return cheerio.load(response.data);
};

// جلب البيانات لصفحة الصور
const getImageUrls = async (page) => {
  await page.waitForSelector("#readerarea img", { timeout: 60000 });
  return await page.$$eval("#readerarea img", (images) => {
    return images
      .map((img) => {
        const src = img.getAttribute("src");
        if (src.startsWith("https://mangatak.com/wp-content/")) {
          return src;
        }
      })
      .filter(Boolean);
  });
};

// تحسين إغلاق المتصفح
const closeBrowser = async (browser) => {
  if (browser) {
    await browser.close();
  }
};

app.get("/mangas", async (req, res) => {
  try {
    const $ = await fetchDataFromMangatak("https://mangatak.com/manga/?page=8");
    const dataList = [];

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
    const $ = await fetchDataFromMangatak(url);

    const mangaDetails = {};

    mangaDetails.title = $(".entry-title").text().trim();
    mangaDetails.alternativeTitles = $(".titlemove .alternative").text().trim();
    mangaDetails.typeOfWork = $(".imptdt:nth-of-type(2) a").text().trim();
    mangaDetails.status = $(".imptdt:nth-of-type(1) i").text().trim();
    mangaDetails.releaseYear = $(".imptdt:nth-of-type(3) i").text().trim();
    mangaDetails.publisher = $(".imptdt:nth-of-type(5) i").text().trim();
    mangaDetails.genres = [];
    $(".wd-full .mgen a").each((index, element) => {
      mangaDetails.genres.push($(element).text().trim());
    });
    mangaDetails.summary = $(".wd-full .entry-content p").text().trim();
    mangaDetails.publishingDate = $(".imptdt:nth-of-type(7) time").text().trim();
    mangaDetails.lastUpdateDate = $(".imptdt:nth-of-type(8) time").text().trim();

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
    const $ = await fetchDataFromMangatak(url);
    const chaptersList = [];

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

app.get("/images/:link", async (req, res) => {
  let browser;
  try {
    const link = req.params.link;
    browser = await launchBrowser();
    const page = await browser.newPage();

    await page.goto(`https://mangatak.com/${link}`, { timeout: 60000 });
    const imageUrls = await getImageUrls(page);

    res.json(imageUrls);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await closeBrowser(browser);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
