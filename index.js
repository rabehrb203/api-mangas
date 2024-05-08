const puppeteer = require("puppeteer");
const express = require("express");
const app = express();
const axios = require("axios");
const cheerio = require("cheerio");

app.get("/mangas", async (req, res) => {
  try {
    let dataList = [];
    let page = 1;
    const lastPage = 3; // تحديد الصفحة الأخيرة التي تريد جلب البيانات منها

    while (page <= lastPage) {
      const response = await axios.get(
        `https://rocks-manga.com/manga/page/${page}/`
      );
      const $ = cheerio.load(response.data);

      $(".page-content-listing .shido-manga ").each((index, element) => {
        const title = $(element).find(".s-manga-title").text();
        const image = $(element).find(".img-responsive").attr("src");
        const link = $(element).find("a").attr("href").split("/")[4];
        const chapter = $(element).find(".s-chapter span").eq(0).text();

        dataList.push({ title, image, chapter, link });
      });

      // Increment page number
      page++;
    }

    // Send the data as a response
    res.json(dataList);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/details/:link", async (req, res) => {
  try {
    const link = req.params.link;
    const url = `https://rocks-manga.com/manga/${link}/`;

    // جلب محتوى صفحة التفاصيل
    const response = await axios.get(url);
    const html = response.data;

    // استخراج المعلومات باستخدام Cheerio
    const $ = cheerio.load(html);

    const mangaDetails = {};

    // استخراج العنوان
    const titleElement = $(".section-2 .title");
    mangaDetails.title = titleElement.text().trim();

    // استخراج الأسماء البديلة
    const alternativeTitlesElement = $(".section-2 .other-name");
    mangaDetails.alternativeTitles = alternativeTitlesElement.text().trim();

    // استخراج حالة العمل
    const statusElement = $(".section-2 .status");
    mangaDetails.status = statusElement.text().trim();

    // استخراج القصة
    const storyElement = $(".section-2 .story p");
    mangaDetails.story = storyElement.text().trim();

    // استخراج النوع
    const typeElement = $(".section-3 .content a").first();
    mangaDetails.type = typeElement.text().trim();

    // استخراج المؤلف
    const authorElement = $(".section-3 .content a").eq(1);
    mangaDetails.author = authorElement.text().trim();

    // استخراج الرسام
    const artistElement = $(".section-3 .content a").eq(2);
    mangaDetails.artist = artistElement.text().trim();

    // استخراج التصنيف
    mangaDetails.genres = [];
    $(".section-3 .content a")
      .slice(3)
      .each((index, element) => {
        mangaDetails.genres.push($(element).text().trim());
      });

    // استخراج سنة الصدور
    const releaseYearElement = $(".section-3 .content").eq(4);
    mangaDetails.releaseYear = releaseYearElement.text().trim();


    mangaDetails.translationTeams = translationTeamsElement.text().trim();

    res.json(mangaDetails);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/chapters/:link", async (req, res) => {
  try {
    const link = req.params.link;
    const url = `https://rocks-manga.com/manga/${link}/`;

    // جلب محتوى صفحة الفصول
    const response = await axios.get(url);
    const html = response.data;

    // استخراج المعلومات باستخدام Cheerio
    const $ = cheerio.load(html);

    const chaptersList = [];

    // العثور على عناصر الفصول واستخراج المعلومات
    $(".tab-pane ul li").each((index, element) => {
      const chapterNum = $(element).find(".ch-num").text().trim();
      const chapterLink = $(element).find("a").attr("href").split("/")[4];
      const chapterDate = $(element).find(".ch-post-time i").text().trim();

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
app.get("/images/:link/:page", async (req, res) => {
  try {
    const link = req.params.link;
    const pg = req.params.page;

    const response = await axios.get(
      `https://rocks-manga.com/manga/${link}/${pg}`,
      {
        timeout: 60000,
      }
    );

    const $ = cheerio.load(response.data);
    const imageUrls = [];

    $(".reading-content img").each((index, element) => {
      const src = $(element).attr("src").trim(); // تنظيف الرابط
      imageUrls.push(src);
    });

    res.json(imageUrls);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error", error);
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running....");
});
