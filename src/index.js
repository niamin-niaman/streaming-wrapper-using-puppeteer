// Standard Library
const puppeteer = require('puppeteer');
const dotenv = require('dotenv');

// Local Library
const sm = require('./streaming');

// Credential
const env = dotenv.config().parsed
const BROKER = env.BROKER
const USER_NAME = env.USER_NAME
const PASSWORD = env.PASSWORD



async function main() {

    const browser = await puppeteer.launch({ headless: false, defaultViewport: null });

    const streaming_page = await sm.logIn(browser, BROKER, USER_NAME, PASSWORD)

    const portfolio = await sm.getPortfolio(streaming_page, 0)
    console.log(portfolio);

}

main()