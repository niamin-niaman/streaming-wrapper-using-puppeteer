// Standard Library
const puppeteer = require("puppeteer");
const dotenv = require("dotenv");

// Local Library
const sm = require("./streaming");
const { Streaming } = require(".");

// Credential
const env = dotenv.config().parsed;
const BROKER = env.BROKER;
const USER_NAME = env.USER_NAME;
const PASSWORD = env.PASSWORD;

async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  // CLASS PATTERN
  const steaming = await new Streaming(browser, BROKER, USER_NAME, PASSWORD);

  const { price, bid_offer, detail } = await steaming.getQuote("BANPU");
  console.log("price : ", price);
  console.log("bid offer : ", bid_offer);
  console.log("detail : ", detail);

  const ticker = await steaming.getTicker();
  console.log("ticker : ", ticker);

  // TRADDITIONAL PATTEN
  // const streaming_page = await sm.logIn(browser, BROKER, USER_NAME, PASSWORD)
  // const portfolio = await sm.getPortfolio(streaming_page, 0)
  // console.log(portfolio);
}

main();
