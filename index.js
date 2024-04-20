const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
app.set("port", process.env.PORT || 5000);

const browserP = puppeteer.launch({
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

app.get("/", (req, res) => {
  // FIXME move to a worker task; see https://devcenter.heroku.com/articles/node-redis-workers
  let page;
  (async () => {
    page = await (await browserP).newPage();
    await page.setContent(`<p>web running at ${Date()}</p>`);
    res.send(await page.content());
  })()
    .catch(err => res.sendStatus(500))
    .finally(() => page.close())
  ;
});

app.listen(app.get("port"), () => 
  console.log("app running on port", app.get("port"))
);
