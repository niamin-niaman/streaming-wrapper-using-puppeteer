// Standard Library
const puppeteer = require("puppeteer");
const dotenv = require("dotenv");
const express = require("express");

// Local Library
const sm = require("./streaming");
const { Streaming } = require(".");

// Credential
const env = dotenv.config().parsed;
const BROKER = env.BROKER;
const USER_NAME = env.USER_NAME;
const PASSWORD = env.PASSWORD;

// init express
const app = express();
const port = 3000;

async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  // CLASS PATTERN
  const steaming = await new Streaming(browser, BROKER, USER_NAME, PASSWORD);

  app.get("/qoute", async (req, res) => {
    const { price, bid_offer, detail } = await steaming.getQuote("BANPU");
    console.log("price : ", price);
    console.log("bid offer : ", bid_offer);
    console.log("detail : ", detail);
    res.send("ok");
  });
  app.get("/ticker", async (req, res) => {
    const ticker = await steaming.getTicker();
    console.log("ticker : ", ticker);
    res.send("ok");
  });
  // TRADDITIONAL PATTEN
  // const streaming_page = await sm.logIn(browser, BROKER, USER_NAME, PASSWORD)
  // const portfolio = await sm.getPortfolio(streaming_page, 0)
  // console.log(portfolio);
}

main();
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
