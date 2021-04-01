// Standard Library
const puppeteer = require("puppeteer");
const dotenv = require("dotenv");

// Credential
const env = dotenv.config().parsed;
const BROKER = env.BROKER;
const USER_NAME = env.USER_NAME;
const PASSWORD = env.PASSWORD;

class Streaming {
  constructor(browser, broker, user_name, password, streaming_page = null) {
    // https://stackoverflow.com/a/50885340/13080067
    return (async () => {
      this.browser = browser;
      this.broker = broker;
      this.user_name = user_name;
      this.password = password;
      this.streaming_page = [];
      if (streaming_page == null) {
        this.streaming_page[0] = await this.logIn(
          this.browser,
          this.broker,
          this.user_name,
          this.password
        );
      } else {
        this.streaming_page[0] = streaming_page;
      }
      // compute properties
      this.pageNumbers = this.streaming_page.length + 1;

      return this;
    })();
  }

  logIn = async (browser, broker, user_name, password) => {
    return new Promise(async (resolve) => {
      const page = await browser.newPage();

      const pages = await browser.pages();
      await pages[0].close();

      // login to streaming
      console.log("Opening streaming login form");

      let try_encounter = 0;
      while (true) {
        try {
          await page.goto(
            "https://streaming.settrade.com/realtime/streaming-login/login.jsp"
          );
          await page.waitForSelector("#loginFrm");
          break;
        } catch (error) {
          console.log("Error : ");
          console.log(error.message);
          try_encounter++;
          console.log("try encounter : ", try_encounter);
          if (try_encounter == 3) {
            await page.goto(
              "https://streaming.settrade.com/realtime/streaming-login/login.jsp"
            );
            try_encounter = 0;
          }
        }
      }

      // select ktbst broker option
      console.log("Select broker : ", broker);
      const broker_option_selector =
        "#txtLoginBrokerId > ng-select > div > div > div.ng-input > input[type=text]";
      await page.click(broker_option_selector);
      await page.type(broker_option_selector, broker);

      // const KTBST_option = await page.$x("//span[contains(., 'KTBST')]")
      // await KTBST_option[0].click()

      await (await page.$x("//span[contains(., '" + broker + "')]"))[0].click();

      // type user , password
      await page.type("#txtLogin", user_name);
      await page.type("#txtPassword", password);

      console.log("Loging in ...");
      await page.click("#submitBtn");
      // new popup

      // catch new windwo popup
      console.log("New popup streaming window catched");
      const newPagePromise = new Promise((x) =>
        browser.once("targetcreated", (target) => x(target.page()))
      );
      const streaming_page = await newPagePromise;

      await page.close();

      console.log("Bring to front");
      while (true) {
        try {
          const streaming_home_selector =
            "body > app-controller > div > ul > li.col-160.not-scroll.ng-scope.top-68.row-23 > order > div.component-seperator-top.equity > account-info > div.account-info-3";
          await streaming_page.waitForSelector(streaming_home_selector);
          break;
        } catch (error) {
          console.log("Error :");
          console.log(error.message);
        }
      }
      await streaming_page.bringToFront();

      return resolve(streaming_page);
    });
  };

  getQuote = async (symbol, n = 0) => {
    console.log("Select quote tab");
    const qoute_tab_selector = 'div[name="menu-item-2"]';
    const qoute_tab = await this.streaming_page[n].$(qoute_tab_selector);
    qoute_tab.click();

    console.log("Click qoute symbol input");
    const qoute_input_box_selecotr = "#quote-symbol > div";
    while (true) {
      try {
        await this.streaming_page[n].waitForSelector(qoute_input_box_selecotr);
        const qoute_input_box = await this.streaming_page[n].$(
          qoute_input_box_selecotr
        );
        await qoute_input_box.click();
        break;
      } catch (error) {
        await this.streaming_page[n].waitForTimeout(1000);
        console.log("Error : ");
        console.log(error.message);
      }
    }

    console.log('Type : "' + symbol + '"');
    const qoute_input_selector =
      '#quote-symbol > auto-complete > div > input[name="symbol"]';
    while (true) {
      try {
        await this.streaming_page[n].waitForSelector(qoute_input_selector);
        const qoute_input = await this.streaming_page[n].$(
          qoute_input_selector
        );
        await this.streaming_page[n].$eval(qoute_input_selector, (el) => {
          el.value = "";
        });
        await qoute_input.type(symbol, { delay: 100 });
        await qoute_input.press("Enter", { delay: 100 });
        // await this.streaming_page[n].waitForTimeout(3000);

        break;
      } catch (error) {
        await this.streaming_page[n].waitForTimeout(2000);
        console.log("Error : ");
        console.log(error);
      }
    }

    console.log("Get price");
    let price;
    let qoute_price_selector =
      "#page-2-container > li > quote > div > div > div.tab-pane.ng-scope.active > quote-intraday > quote-info > div.col-53.quote-overview-and-bids-offers.component-seperator-bottom > div > div > div.price.col-10.ng-binding";
    while (true) {
      try {
        await this.streaming_page[n].waitForSelector(qoute_price_selector);
        const qoute_price = await this.streaming_page[n].$(
          qoute_price_selector
        );
        price = await (await qoute_price.getProperty("innerText")).jsonValue();
        if (!price || 0 === price.length) throw new Error("price is null");
        // https://stackoverflow.com/a/41242263/13080067
        // https://stackoverflow.com/a/3261380/13080067
        break;
      } catch (error) {
        await this.streaming_page[n].waitForTimeout(500);
        console.log("Error : ", error.message);
      }
    }
    // console.log(price);

    console.log("Get bid offer");
    const bid_offer = await this.streaming_page[n].$$eval(
      "#page-2-container > li > quote > div > div > div.tab-pane.ng-scope.active > quote-intraday > quote-info > div.col-53.quote-overview-and-bids-offers.component-seperator-bottom > bid-offer",
      (rows) => {
        return Array.from(rows, (row) => {
          const columns = row.querySelectorAll("ul");
          // return Array.from(columns, column => column.innerText);
          return Array.from(columns, (cell) => {
            const cells = cell.querySelectorAll("li");
            return Array.from(cells, (cell) => cell.innerText);
          });
        });
      }
    );
    // console.log(bid_offer[0]);

    console.log("Get detail data");
    let detail_data = [];
    const detail_data_selector =
      "#page-2-container > li > quote > div > div > div.tab-pane.ng-scope.active > quote-intraday > quote-info > div.col-106.row-21.quote-detail.component-seperator-left > div.col-106.row-16.quote-detail-data > div > div > div";
    await this.streaming_page[n].waitForSelector(detail_data_selector);
    // console.log(detail_data_selector);
    detail_data = await this.streaming_page[n].$$eval(
      detail_data_selector,
      (rows) => {
        // console.log('rows ', rows);
        return Array.from(rows, (row) => {
          // console.log('row ', row);
          const columns = row.querySelectorAll("div");
          // return Array.from(columns, column => column.innerText);
          return Array.from(columns, (cell) => {
            const cells = cell.querySelectorAll("quote-detail-row");
            // return Array.from(cells, (cell) => cell.innerText);
            return Array.from(cells, (cell) => {
              const items = cell.querySelectorAll("li");
              return Array.from(items, (item) => item.innerText);
            });
          });
        });
      }
    );

    // console.log(detail_data[0]);

    // return [price, bid_offer[0]];
    return { price: price, bid_offer: bid_offer[0], detail: detail_data[0] };
    // https://www.javascripttutorial.net/javascript-return-multiple-values/
  };

  getTicker = async (n = 0) => {
    return new Promise(async (resolve, reject) => {
      // console.log('Select ticker tab');
      const ticker_tab_selector = 'div[name="menu-item-5"]';
      const ticker_tab = await this.streaming_page[n].$(ticker_tab_selector);
      ticker_tab.click();

      // console.log('Get ticker data');
      let ticker_data = [];
      let try_counter = 0;
      while (true) {
        try {
          const ticker_data_selector =
            "#page-5-container > li > market-ticker-page > div.body.ng-scope";
          await this.streaming_page[n].waitForSelector(ticker_data_selector);
          // console.log(ticker_data_selector);
          ticker_data = await this.streaming_page[n].$$eval(
            ticker_data_selector,
            (rows) => {
              // console.log('rows ', rows);
              return Array.from(rows, (row) => {
                // console.log('row ', row);
                const columns = row.querySelectorAll("market-ticker-page-row");
                // return Array.from(columns, column => column.innerText);
                return Array.from(columns, (cell) => {
                  const cells = cell.querySelectorAll("li");
                  return Array.from(cells, (cell) => cell.innerText);
                });
              });
            }
          );

          // console.log(ticker_data[0]);
          return resolve(ticker_data[0]);
        } catch (error) {
          await this.streaming_page[n].waitForTimeout(1000);
          try_counter += 1;
          console.log("Error : ", error.message);
          console.log("Counter : ", try_counter);
          if (try_counter == 3) break;
        }
      }

      return resolve(ticker_data);
    });
  };

  newPage = async () => {
    let url = await this.streaming_page[0].url();
    const page = await this.browser.newPage();
    await page.goto(url);
    console.log("Bring to front");
    while (true) {
      try {
        const streaming_home_selector =
          "body > app-controller > div > ul > li.col-160.not-scroll.ng-scope.top-68.row-23 > order > div.component-seperator-top.equity > account-info > div.account-info-3";
        await page.waitForSelector(streaming_home_selector);
        break;
      } catch (error) {
        console.log("Error :");
        console.log(error.message);
      }
    }
    await page.bringToFront();
    this.streaming_page.push(page);

    const new_streaming = new Streaming(null, null, null, null, page);
    return new_streaming;
  };
}

const main = async () => {
  const headless = false;
  const browser = await puppeteer.launch({
    headless: headless,
    defaultViewport: null,
  });

  let streaming = [];

  // const streaming = await new Streaming(browser, BROKER, USER_NAME, PASSWORD);
  streaming.push(await new Streaming(browser, BROKER, USER_NAME, PASSWORD));

  let { price, bid_offer, detail } = await streaming[0].getQuote("BANPU");

  console.log("price : ", price);
  console.log("bid offer : ", bid_offer);
  console.log("detail : ", detail);

  streaming.push(await streaming[0].newPage());

  price, bid_offer, (detail = await streaming[1].getQuote("AOT"));

  //   await streaming.newPage();

  //   let list = ["BANPU", "PTT", "AOT", "INET"];
  //   for (let index = 0; index < list.length; index++) {
  //     const element = list[index];
  //     await streaming.getQuote(element);
  //   }
  //   for (let index = 0; index < list.length; index++) {
  //     const element = list[index];
  //     await streaming.getQuote(element, 1);
  //   }

  //   console.log(streaming.pageNumbers);
};

const experiment = async () => {};

// https://stackoverflow.com/a/6090287/13080067
if (require.main === module) {
  // experiment()
  main();
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export
// https://javascript.info/import-export
module.exports = {
  Streaming: Streaming,
};
