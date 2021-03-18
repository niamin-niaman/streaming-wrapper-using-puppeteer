const puppeteer = require('puppeteer');
const dotenv = require('dotenv');

const env = dotenv.config().parsed
const BROKER = env.BROKER
const USER_NAME = env.USER_NAME
const PASSWORD = env.PASSWORD


/**
 * 
 * @param {browser} browser browser instance
 * @returns {Promise<Page>} page streaming opened
 */
const logIn = async (browser, broker, user_name, password) => {

    return new Promise(async (resolve) => {

        const page = await browser.newPage();

        const pages = await browser.pages()
        await pages[0].close()

        // login to streaming
        console.log('Opening streaming login form');

        let try_encounter = 0
        while (true) {
            try {
                await page.goto('https://streaming.settrade.com/realtime/streaming-login/login.jsp')
                await page.waitForSelector('#loginFrm')
                break
            } catch (error) {
                console.log('Error : ');
                console.log(error.message);
                try_encounter++
                console.log('try encounter : ', try_encounter);
                if (try_encounter == 3) {
                    await page.goto('https://streaming.settrade.com/realtime/streaming-login/login.jsp')
                    try_encounter = 0
                }

            }
        }

        // select ktbst broker option
        console.log('Select broker : ', broker);
        const broker_option_selector = '#txtLoginBrokerId > ng-select > div > div > div.ng-input > input[type=text]'
        await page.click(broker_option_selector)
        await page.type(broker_option_selector, broker)

        // const KTBST_option = await page.$x("//span[contains(., 'KTBST')]")
        // await KTBST_option[0].click()

        await (await page.$x("//span[contains(., '" + broker + "')]"))[0].click()

        // type user , password
        // await page.type('#txtLogin', '29211')
        // await page.type('#txtPassword', 'Kkk333')
        await page.type('#txtLogin', user_name)
        await page.type('#txtPassword', password)

        console.log('Loging in ...');
        await page.click('#submitBtn')
        // new popup

        // catch new windwo popup
        console.log('New popup streaming window catched');
        const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page())));
        const streaming_page = await newPagePromise;

        await page.close()

        console.log('Bring to front');
        while (true) {
            try {
                const streaming_home_selector = 'body > app-controller > div > ul > li.col-160.not-scroll.ng-scope.top-68.row-23 > order > div.component-seperator-top.equity > account-info > div.account-info-3'
                await streaming_page.waitForSelector(streaming_home_selector)
                break
            } catch (error) {
                console.log('Error :');
                console.log(error.message);
            }
        }
        await streaming_page.bringToFront()

        return resolve(streaming_page)
    })

}

/**
 * 
 * @param {Page} streaming_page page with opened streaming page
 * @param {string} symbol stock symbol
 * @param {string} volume stock volume
 * @param {string} price stock price
 * @param {interger} account_order order of account portfolio
 */

const buy = async (streaming_page, symbol, volume, price, account_order) => {
    return new Promise(async (resolve, reject) => {

        // const Portfolio_tab = await streaming_page.$x("//div[contains(., 'Portfolio')]")
        // await Portfolio_tab[0].click()

        // select order account
        console.log('Select accout :', account_order);
        while (true) {
            try {
                const account_order_selector = '#account-dropdown-' + account_order
                // await streaming_page.waitForTimeout(1000)
                await (await streaming_page.$('body > app-controller > div > ul > li.col-160.not-scroll.ng-scope.top-68.row-23 > order > div.component-seperator-top.equity > account-info > div.col-21 > index-dropdown')).click()
                // await streaming_page.waitForTimeout(1000)
                await streaming_page.waitForSelector(account_order_selector)
                await (await streaming_page.$(account_order_selector)).click()
                break;
            } catch (error) {
                await streaming_page.waitForTimeout(1000)
                console.log('Error : ', error.message);
            }
        }

        // select buy button
        await streaming_page.click('#buy-btn')

        console.log('Type symbol : ', symbol);
        const symbol_input_xpath = "/html/body/app-controller/div/ul/li[3]/order/div[1]/place-order/div/div/symbol-input/auto-complete/div/input[2]"
        const symbol_input = await streaming_page.$x(symbol_input_xpath)
        await symbol_input[0].type(symbol)
        await symbol_input[0].press('Enter')

        console.log('Type volume : ', volume);
        const volume_input_xpath = "/html/body/app-controller/div/ul/li[3]/order/div[1]/place-order/div/div/div[3]/smart-volume-input/div/volume-input/input"
        const volume_input = await streaming_page.$x(volume_input_xpath)
        await volume_input[0].type(volume)
        await volume_input[0].press('Enter')

        console.log('Type price : ', price);
        const price_input_xpath = "/html/body/app-controller/div/ul/li[3]/order/div[1]/place-order/div/div/div[4]/smart-price-input/div/price-input/input"
        const price_input = await streaming_page.$x(price_input_xpath)
        await price_input[0].type(price)
        await price_input[0].press('Enter')

        console.log('Type PIN input');
        const pin_input_xpath = "/html/body/app-controller/div/ul/li[3]/order/div[1]/place-order/div/div/div[6]/pin-input/div/input"
        const pin_input = await streaming_page.$x(pin_input_xpath)
        await pin_input[0].type('147896')
        await pin_input[0].press('Enter')

        const buy_button_xpath = "/html/body/app-controller/div/ul/li[3]/order/div[1]/place-order/div/div/button[1]"
        const buy_button = await streaming_page.$x(buy_button_xpath)
        await buy_button[0].click()

        await streaming_page.waitForSelector('body > modal-layer > div > div > div > form > div.modal-body')

        console.log('Confirm buy');
        const confirm_buy_button_xpath = "/html/body/modal-layer/div/div/div/form/div[2]/div[1]/button"
        const confirm_buy_button = await streaming_page.$x(confirm_buy_button_xpath)
        await confirm_buy_button[0].click()

        await streaming_page.waitForTimeout(3000)

        if (await streaming_page.$('body > modal-layer > div > div > div > form')) {
            console.log('Error');
            await streaming_page.waitForSelector('body > modal-layer > div > div > div > form > div.modal-footer.row-5 > div > button')
            await (await streaming_page.$('body > modal-layer > div > div > div > form > div.modal-footer.row-5 > div > button')).click()
            // return resolve('Error')
            return reject(false)
        }
        else {
            return resolve(true)
        }
        // body > modal-layer > div > div > div > form


    })
}

/**
 * 
 * @param {Page} streaming_page page with opened streaming page
 * @param {string} symbol stock symbol
 * @param {string} volume stock volume
 * @param {string} price stock price
 * @param {interger} account_order order of account portfolio
 * 
 */
const sell = async (streaming_page, symbol, volume, price, account_order) => {
    return new Promise(async (resolve, reject) => {

        // select order account
        const account_order_selector = '#account-dropdown-' + account_order
        console.log('Select ', account_order_selector);
        while (true) {
            try {
                await streaming_page.waitForTimeout(1000)
                await (await streaming_page.$('body > app-controller > div > ul > li.col-160.not-scroll.ng-scope.top-68.row-23 > order > div.component-seperator-top.equity > account-info > div.col-21 > index-dropdown')).click()
                await streaming_page.waitForTimeout(1000)
                await streaming_page.waitForSelector(account_order_selector)
                await (await streaming_page.$(account_order_selector)).click()
                break;
            } catch (error) {
                await streaming_page.waitForTimeout(500)
                console.log('Error : ');
                console.log(error.message);
            }
        }


        // const Portfolio_tab = await streaming_page.$x("//div[contains(., 'Portfolio')]")
        // await Portfolio_tab[0].click()

        // select buy button
        await streaming_page.click('#sell-btn')

        console.log('Type symbol : ', symbol);
        const symbol_input_xpath = "/html/body/app-controller/div/ul/li[3]/order/div[1]/place-order/div/div/symbol-input/auto-complete/div/input[2]"
        const symbol_input = await streaming_page.$x(symbol_input_xpath)
        await symbol_input[0].type(symbol)
        await symbol_input[0].press('Enter')

        console.log('Type volume : ', volume);
        const volume_input_xpath = "/html/body/app-controller/div/ul/li[3]/order/div[1]/place-order/div/div/div[3]/smart-volume-input/div/volume-input/input"
        const volume_input = await streaming_page.$x(volume_input_xpath)
        await volume_input[0].type(volume)
        await volume_input[0].press('Enter')

        console.log('Type price : ', price);
        const price_input_xpath = "/html/body/app-controller/div/ul/li[3]/order/div[1]/place-order/div/div/div[4]/smart-price-input/div/price-input/input"
        const price_input = await streaming_page.$x(price_input_xpath)
        await price_input[0].type(price)
        await price_input[0].press('Enter')

        console.log('Type PIN input');
        const pin_input_xpath = "/html/body/app-controller/div/ul/li[3]/order/div[1]/place-order/div/div/div[6]/pin-input/div/input"
        const pin_input = await streaming_page.$x(pin_input_xpath)
        await pin_input[0].type('147896')
        await pin_input[0].press('Enter')

        const buy_button_xpath = "/html/body/app-controller/div/ul/li[3]/order/div[1]/place-order/div/div/button[1]"
        const buy_button = await streaming_page.$x(buy_button_xpath)
        await buy_button[0].click()

        await streaming_page.waitForSelector('body > modal-layer > div > div > div > form > div.modal-body')

        console.log('Confirm sell');
        const confirm_buy_button_xpath = "/html/body/modal-layer/div/div/div/form/div[2]/div[1]/button"
        const confirm_buy_button = await streaming_page.$x(confirm_buy_button_xpath)
        await confirm_buy_button[0].click()

        if (await streaming_page.$('body > modal-layer > div > div > div > form')) {
            console.log('Error');
            await streaming_page.waitForSelector('body > modal-layer > div > div > div > form > div.modal-footer.row-5 > div > button')
            await (await streaming_page.$('body > modal-layer > div > div > div > form > div.modal-footer.row-5 > div > button')).click()
            // return resolve('Error')
            return reject(false)
        }
        else {
            return resolve(true)
        }
    })
}

/**
 * 
 * @param {Page} streaming_page page with opened streaming page
 * @param {string} symbol stock symbol
 * 
 * @returns {Promise<[price,qoute]}
 */

const getQuote = async (streaming_page, symbol) => {

    console.log('Select quote tab');
    const qoute_tab_selector = 'div[name="menu-item-2"]'
    const qoute_tab = await streaming_page.$(qoute_tab_selector)
    qoute_tab.click()

    console.log('Click qoute symbol input');
    const qoute_input_box_selecotr = '#quote-symbol > div'
    while (true) {
        try {
            await streaming_page.waitForSelector(qoute_input_box_selecotr)
            const qoute_input_box = await streaming_page.$(qoute_input_box_selecotr)
            await qoute_input_box.click()
            break
        } catch (error) {
            await streaming_page.waitForTimeout(1000)
            console.log('Error : ');
            console.log(error.message);
        }

    }

    console.log('Type : "' + symbol + '"');
    const qoute_input_selector = '#quote-symbol > auto-complete > div > input[name="symbol"]'
    while (true) {
        try {
            await streaming_page.waitForSelector(qoute_input_selector)
            const qoute_input = await streaming_page.$(qoute_input_selector)
            await streaming_page.$eval(qoute_input_selector, el => {
                el.value = ""
            });
            await qoute_input.type(symbol, { delay: 100 })
            await qoute_input.press('Enter', { delay: 100 })
            await streaming_page.waitForTimeout(3000)

            break
        } catch (error) {
            await streaming_page.waitForTimeout(2000)
            console.log('Error : ');
            console.log(error);
        }

    }

    console.log('Get price');
    let price
    let qoute_price_selector = '#page-2-container > li > quote > div > div > div.tab-pane.ng-scope.active > quote-intraday > quote-info > div.col-53.quote-overview-and-bids-offers.component-seperator-bottom > div > div > div.price.col-10.ng-binding'
    while (true) {
        try {

            await streaming_page.waitForSelector(qoute_price_selector)
            const qoute_price = await streaming_page.$(qoute_price_selector)
            price = await (await qoute_price.getProperty('innerText')).jsonValue()
            if ((!price || 0 === price.length)) throw new Error("price is null")
            // https://stackoverflow.com/a/41242263/13080067
            // https://stackoverflow.com/a/3261380/13080067
            break
        } catch (error) {
            await streaming_page.waitForTimeout(500)
            console.log('Error : ', error.message);
        }

    }
    console.log(price);

    console.log('Get bid offer');
    const bid_offer = await streaming_page.$$eval('#page-2-container > li > quote > div > div > div.tab-pane.ng-scope.active > quote-intraday > quote-info > div.col-53.quote-overview-and-bids-offers.component-seperator-bottom > bid-offer', rows => {
        return Array.from(rows, row => {
            const columns = row.querySelectorAll('ul');
            // return Array.from(columns, column => column.innerText);
            return Array.from(columns, cell => {
                const cells = cell.querySelectorAll('li');
                return Array.from(cells, cell => cell.innerText);
            });
        });
    });
    console.log(bid_offer[0]);

    return [price, bid_offer[0]]
    // https://www.javascripttutorial.net/javascript-return-multiple-values/
}

const getPortfolio = async (streaming_page, account_order) => {
    // select tab
    console.log('Select portfolio tab');
    const qoute_tab = await streaming_page.$('div[name="menu-item-1"]')
    await qoute_tab.click()

    // select order account
    console.log('Select accout :', account_order);
    while (true) {
        try {
            const account_order_selector = '#account-dropdown-' + account_order
            // await streaming_page.waitForTimeout(1000)
            await (await streaming_page.$('body > app-controller > div > ul > li.col-160.not-scroll.ng-scope.top-68.row-23 > order > div.component-seperator-top.equity > account-info > div.col-21 > index-dropdown')).click()
            // await streaming_page.waitForTimeout(1000)
            await streaming_page.waitForSelector(account_order_selector)
            await (await streaming_page.$(account_order_selector)).click()
            break;
        } catch (error) {
            await streaming_page.waitForTimeout(1000)
            console.log('Error : ', error.message);
        }
    }

    // await streaming_page.waitForTimeout(1000)

    console.log('Click portfolio summary tab');
    const portfolio_tab_selector = '#page-1-container > li > portfolio > div.row-36.ng-isolate-scope > ul > li:nth-child(1) > a'
    while (true) {
        try {
            await streaming_page.waitForSelector(portfolio_tab_selector)
            await (await streaming_page.$(portfolio_tab_selector)).click()
            break
        } catch (error) {
            await streaming_page.waitForTimeout(1000)
            console.log('Error : ', error.message);
        }
    }

    // receive data
    console.log('Get portfolio');
    let portfolio = []
    while (true) {
        try {
            const portfolio_selector = '#page-1-container > li > portfolio > div.row-36.ng-isolate-scope > div > div.tab-pane.ng-scope.active > portfolio-list > ul.ng-isolate-scope > ul'
            await streaming_page.waitForSelector(portfolio_selector)
            portfolio = await streaming_page.$$eval(portfolio_selector, rows => {
                return Array.from(rows, row => {
                    const columns = row.querySelectorAll('ul');
                    // return Array.from(columns, column => column.innerText);
                    return Array.from(columns, cell => {
                        const cells = cell.querySelectorAll('li');
                        return Array.from(cells, cell => cell.innerText);
                    });
                });
            });
            // console.log(portfolio[0]);
            if (portfolio[0] === undefined || portfolio[0].length == 0) throw new Error("portfolio is null")
            break;
        } catch (error) {
            await streaming_page.waitForTimeout(1000)
            console.log('Error : ', error.message);
        }
    }
    // await streaming_page.waitForTimeout(1000)

    console.log('Get total');
    let portfolio_total = []
    while (true) {
        try {
            const portfolio_total_selector = '#page-1-container > li > portfolio > div.row-36.ng-isolate-scope > div > div.tab-pane.ng-scope.active > portfolio-list > ul.total.bg-header'
            await streaming_page.waitForSelector(portfolio_total_selector)
            portfolio_total = await streaming_page.$$eval(portfolio_total_selector, rows => {
                return Array.from(rows, row => {
                    const columns = row.querySelectorAll('li');
                    return Array.from(columns, column => column.innerText);
                });
            });
            // console.log(portfolio_total[0]);
            if (portfolio_total[0] === undefined || portfolio_total[0].length == 0) throw new Error("portfolio_total is null")
            break;
        } catch (error) {
            await streaming_page.waitForTimeout(1000)
            console.log('Error : ', error.message);
        }
    }

    return [portfolio[0], portfolio_total[0]]

}

const getOrderStatus = async (streaming_page, account_order) => {

    // select order account
    console.log('Select accout :', account_order);
    while (true) {
        try {
            const account_order_selector = '#account-dropdown-' + account_order
            // await streaming_page.waitForTimeout(1000)
            await (await streaming_page.$('body > app-controller > div > ul > li.col-160.not-scroll.ng-scope.top-68.row-23 > order > div.component-seperator-top.equity > account-info > div.col-21 > index-dropdown')).click()
            // await streaming_page.waitForTimeout(1000)
            await streaming_page.waitForSelector(account_order_selector)
            await (await streaming_page.$(account_order_selector)).click()
            break;
        } catch (error) {
            await streaming_page.waitForTimeout(1000)
            console.log('Error : ', error.message);
        }
    }

    await streaming_page.waitForTimeout(500)

    console.log('Get order status');

    let order_status = []
    let try_counter = 0
    while (true) {
        try {

            const order_status_selector = 'body > app-controller > div > ul > li.col-160.not-scroll.ng-scope.top-68.row-23 > order > div:nth-child(2) > order-status > div > div > div > ul'
            order_status = await streaming_page.$$eval(order_status_selector, rows => {
                return Array.from(rows, row => {
                    const columns = row.querySelectorAll('ul');
                    // return Array.from(columns, column => column.innerText);
                    return Array.from(columns, cell => {
                        const cells = cell.querySelectorAll('li');
                        return Array.from(cells, cell => cell.innerText);
                    });
                });
            });
            // console.log(deal_summary[0]);
            if (order_status[0] === undefined || order_status[0].length == 0) throw new Error("order_status is null")
            break;
        } catch (error) {
            await streaming_page.waitForTimeout(500)
            try_counter += 1
            console.log('Error : ', error.message);
            if (try_counter == 2) break;
        }
    }
    // console.log(order_status[0]);

    return order_status[0]
}

const getDealSummary = async (streaming_page, account_order) => {

    return new Promise(async (resolve, reject) => {


        // select tab
        console.log('Select portfolio tab');
        const qoute_tab = await streaming_page.$('div[name="menu-item-1"]')
        await qoute_tab.click()

        // select order account
        console.log('Select accout :', account_order);
        while (true) {
            try {
                const account_order_selector = '#account-dropdown-' + account_order
                // await streaming_page.waitForTimeout(1000)
                await (await streaming_page.$('body > app-controller > div > ul > li.col-160.not-scroll.ng-scope.top-68.row-23 > order > div.component-seperator-top.equity > account-info > div.col-21 > index-dropdown')).click()
                // await streaming_page.waitForTimeout(1000)
                await streaming_page.waitForSelector(account_order_selector)
                await (await streaming_page.$(account_order_selector)).click()
                break;
            } catch (error) {
                await streaming_page.waitForTimeout(1000)
                console.log('Error : ', error.message);
            }
        }

        // await streaming_page.waitForTimeout(500)

        console.log('Click deal summary tab');
        const deal_summary_tab_selecot = '#page-1-container > li > portfolio > div.row-36.ng-isolate-scope > ul > li:nth-child(2) > a'
        while (true) {
            try {
                await streaming_page.waitForSelector(deal_summary_tab_selecot)
                await (await streaming_page.$(deal_summary_tab_selecot)).click()
                break
            } catch (error) {
                await streaming_page.waitForTimeout(1000)
                console.log('Error : ', error.message);
            }
        }

        // receive data
        console.log('Get deal summary');
        let deal_summary = []
        let try_counter = 0
        while (true) {
            try {
                const deal_summary_selector = '#page-1-container > li > portfolio > div.row-36.ng-isolate-scope > div > div.tab-pane.ng-scope.active > equity-deal-summary-list > ul.scroll-container.row-20.component-seperator-bottom.ng-scope'
                await streaming_page.waitForSelector(deal_summary_selector)
                deal_summary = await streaming_page.$$eval(deal_summary_selector, rows => {
                    return Array.from(rows, row => {
                        const columns = row.querySelectorAll('ul');
                        // return Array.from(columns, column => column.innerText);
                        return Array.from(columns, cell => {
                            const cells = cell.querySelectorAll('li');
                            return Array.from(cells, cell => cell.innerText);
                        });
                    });
                });
                // console.log(deal_summary[0]);
                if (deal_summary[0] === undefined || deal_summary[0].length == 0) throw new Error("deal_summary is null")
                break;
            } catch (error) {
                await streaming_page.waitForTimeout(1000)
                try_counter += 1
                console.log('Error : ', error.message);
                console.log('Counter : ', try_counter);
                if (try_counter == 2) break;
            }
        }
        // await streaming_page.waitForTimeout(1000)

        return resolve(deal_summary[0])
    });

}

const getLineAvailableCashBalance = async (streaming_page, account_order) => {

    return new Promise(async (resolve, reject) => {


        // select order account
        console.log('Select accout :', account_order);
        while (true) {
            try {
                const account_order_selector = '#account-dropdown-' + account_order
                // await streaming_page.waitForTimeout(1000)
                await (await streaming_page.$('body > app-controller > div > ul > li.col-160.not-scroll.ng-scope.top-68.row-23 > order > div.component-seperator-top.equity > account-info > div.col-21 > index-dropdown')).click()
                // await streaming_page.waitForTimeout(1000)
                await streaming_page.waitForSelector(account_order_selector)
                await (await streaming_page.$(account_order_selector)).click()
                break;
            } catch (error) {
                await streaming_page.waitForTimeout(1000)
                console.log('Error : ', error.message);
            }
        }

        await streaming_page.waitForTimeout(500)

        console.log('Get line available');
        const line_available_selector = 'body > app-controller > div > ul > li.col-160.not-scroll.ng-scope.top-68.row-23 > order > div.component-seperator-top.equity > account-info > div.account-info-2 > span'
        let line_available
        while (true) {
            try {

                await streaming_page.waitForSelector(line_available_selector)
                line_available = await (await (await streaming_page.$(line_available_selector)).getProperty('innerText')).jsonValue()
                if ((!line_available || 0 === line_available.length)) throw new Error("line_available is null")
                // https://stackoverflow.com/a/41242263/13080067
                // https://stackoverflow.com/a/3261380/13080067
                break
            } catch (error) {
                await streaming_page.waitForTimeout(500)
                console.log('Error : ', error.message);
            }

        }
        // console.log(line_available);

        const cash_balance_selector = 'body > app-controller > div > ul > li.col-160.not-scroll.ng-scope.top-68.row-23 > order > div.component-seperator-top.equity > account-info > div.account-info-3 > span'
        console.log('Get cash balance');
        let cash_balance
        while (true) {
            try {

                await streaming_page.waitForSelector(cash_balance_selector)
                cash_balance = await (await (await streaming_page.$(cash_balance_selector)).getProperty('innerText')).jsonValue()
                if ((!cash_balance || 0 === cash_balance.length)) throw new Error("cash_balance is null")
                // https://stackoverflow.com/a/41242263/13080067
                // https://stackoverflow.com/a/3261380/13080067
                break
            } catch (error) {
                await streaming_page.waitForTimeout(500)
                console.log('Error : ', error.message);
            }

        }
        // console.log(cash_balance);

        return resolve([line_available, cash_balance])

    });


}

const getSetStatus = async (streaming_page) => {
    return new Promise(async (resolve, reject) => {

        const set_status_col = '#market-set-status-value'
        console.log('Get market status');
        let set_status
        while (true) {
            try {

                await streaming_page.waitForSelector(set_status_col)
                set_status = await (await (await streaming_page.$(set_status_col)).getProperty('innerText')).jsonValue()
                if ((!set_status || 0 === set_status.length)) throw new Error("set_status is null")
                // https://stackoverflow.com/a/41242263/13080067
                // https://stackoverflow.com/a/3261380/13080067
                break
            } catch (error) {
                await streaming_page.waitForTimeout(500)
                console.log('Error : ', error.message);
            }

        }
        // console.log(set_status);
        return resolve(set_status)
    });
}

const getFavariteData = async (streaming_page, favorite_order = 1) => {

    return new Promise(async (resolve, reject) => {


        // Select market tab
        console.log('Select market tab');
        const qoute_tab = await streaming_page.$('div[name="menu-item-0"]')
        await qoute_tab.click()

        // Select favorite order tab , defaut 1
        const favorite_order_selector = '#favourite-dropdown-' + favorite_order
        while (true) {
            try {
                // await streaming_page.waitForTimeout(1000)
                await (await streaming_page.$('#page-0-container > li.left-1.col-124.top-10.row-34.visible > favourite > div > index-dropdown.col-18.favourite-dropdown.ng-isolate-scope')).click()
                // await streaming_page.waitForTimeout(1000)
                await streaming_page.waitForSelector(favorite_order_selector)
                await (await streaming_page.$(favorite_order_selector)).click()
                break;
            } catch (error) {
                await streaming_page.waitForTimeout(1000)
                console.log('Error : ', error.message);
            }
        }

        // Get data

        console.log('Get favorite data');
        let favorite_data = []
        let try_counter = 0
        while (true) {
            try {
                const favorite_data_selector = '#page-0-container > li.left-1.col-124.top-10.row-34.visible > favourite > favourite-list > div > div'
                await streaming_page.waitForSelector(favorite_data_selector)
                favorite_data = await streaming_page.$$eval(favorite_data_selector, rows => {
                    return Array.from(rows, row => {
                        const columns = row.querySelectorAll('ul');
                        // return Array.from(columns, column => column.innerText);
                        return Array.from(columns, cell => {
                            const cells = cell.querySelectorAll('li');
                            return Array.from(cells, cell => cell.innerText);
                        });
                    });
                });
                // console.log(favorite_data[0]);
                if (favorite_data[0] === undefined || favorite_data[0].length == 0) throw new Error("favorite_data is null")
                if (favorite_data[0][0][1] === "") throw new Error("favorite_data price is null")
                break;
            } catch (error) {
                await streaming_page.waitForTimeout(1000)
                try_counter += 1
                console.log('Error : ', error.message);
                console.log('Counter : ', try_counter);
                if (try_counter == 3) break;
            }
        }

        // console.log(favorite_data);
        // remove ADD row
        favorite_data[0].pop()
        return resolve(favorite_data[0])
    });
}

const addSymbolToFavorite = async (streaming_page, symbol, favorite_order = 1) => {

    return new Promise(async (resolve, reject) => {


        // select maket tab
        console.log('Select market tab');
        const qoute_tab = await streaming_page.$('div[name="menu-item-0"]')
        await qoute_tab.click()

        // click add button
        console.log('Click add button');
        const add_favorite_button_selector = '#favourite-add-symbol > button'
        let try_counter = 0
        while (true) {
            try {
                await (await streaming_page.$(add_favorite_button_selector)).click()
                break;
            } catch (error) {
                await streaming_page.waitForTimeout(500)
                try_counter += 1
                console.log('Error : ', error.message);
                console.log('Counter : ', try_counter);
                if (try_counter == 2) break;
            }
        }

        await streaming_page.waitForTimeout(2000)

        console.log('Type symbol');
        // type symbol
        const input_favorite_symbol_xpath = '/html/body/app-controller/div/ul/streaming/div[1]/li[1]/favourite/favourite-list/div/div/favourite-row[*]/ul/li[1]/add-favourite-symbol-input/auto-complete/div/input[2]'
        try_counter = 0
        while (true) {
            try {
                // let input_favorite_symbol = await streaming_page.$(input_favorite_symbol_selector)
                let input_favorite_symbol = await streaming_page.$x(input_favorite_symbol_xpath)
                // console.log(input_favorite_symbol);
                console.log('Type ', symbol);
                await input_favorite_symbol[0].type(symbol)
                await input_favorite_symbol[0].press('Enter')
                break;
            } catch (error) {
                await streaming_page.waitForTimeout(1000)
                try_counter += 1
                console.log('Error : ', error.message);
                console.log('Counter : ', try_counter);
                if (try_counter == 4) break;
            }
        }

        if (await streaming_page.$('body > modal-layer > div > div > div > form')) {
            console.log('Error');
            await streaming_page.waitForSelector('body > modal-layer > div > div > div > form > div.modal-footer.row-5 > div > button')
            await (await streaming_page.$('body > modal-layer > div > div > div > form > div.modal-footer.row-5 > div > button')).click()
            // return resolve('Error')
            return reject(false)
        }
        else {
            return resolve(true)
        }
    });



}

const removeSymbolFromFavorite = async (streaming_page, symbol_order, favorite_order = 1) => {
    // select maket tab
    console.log('Select market tab');
    const qoute_tab = await streaming_page.$('div[name="menu-item-0"]')
    await qoute_tab.click()

    // click edit button
    console.log('Click edit button');
    await (await streaming_page.$('#page-0-container > li.left-1.col-124.top-10.row-34.visible > favourite > div > div.edit-mode-buttons > button')).click()

    // select row with match symbol
    console.log('Remove symbol');
    const delete_button_selector = '#page-0-container > li.left-1.col-124.top-10.row-34.visible > favourite > edit-favourite-list > div > ul.ng-pristine.ng-untouched.ng-valid.ng-isolate-scope.ui-sortable.ng-not-empty > li:nth-child(' + symbol_order + ') > button'
    await (await streaming_page.$(delete_button_selector)).click()

    // click done button
    console.log('Remove done');
    await (await streaming_page.$('#page-0-container > li.left-1.col-124.top-10.row-34.visible > favourite > div > div.edit-mode-buttons > button.done.nr-btn.nr-btn-medium.ng-scope')).click()
}


async function main() {


    const browser = await puppeteer.launch({ headless: false, defaultViewport: null });

    const streaming_page = await logIn(browser, BROKER, USER_NAME, PASSWORD)

    let favorite_data = await getFavariteData(streaming_page)
    console.log(favorite_data);

    // let i = _.findIndex(favorite_data, (el) => { return el.includes('BANPU') })
    // if (i > 0) {
    //     let n = i + 1
    //     await removeSymbolFromFavorite(streaming_page, n)
    // }

    // let isSucess = await addSymbolToFavorite(streaming_page, 'BANPU').catch((err) => err)

    // if (!isSucess) {
    //     console.log('Error');
    // }

    // let result = await buy(streaming_page,'TEST','1','1',1).catch((err)=> err)
    // https://stackoverflow.com/a/55019853/13080067
    // console.log(result);

    // let [line_available, cash_balance] = await getLineAvailableCashBalance(streaming_page, 1)
    // console.log(line_available);
    // console.log(cash_balance);



    // setInterval(async () => {


    // await buy(streaming_page,'BANPU','1','6.90')
    // await sell(streaming_page, 'WIIK', '10', '2.34', 1)

    // let orderStatus = await getOrderStatus(streaming_page, 1)

    // let i = _.findIndex(orderStatus, (el) => { return el.includes('WIIK') })
    // find index of 2d array
    // https://stackoverflow.com/a/49420913/13080067
    // console.log(i);

    // await streaming_page.close()
}

if (require.main === module) {

    main()
}

module.exports = {
    logIn: logIn,
    buy: buy,
    sell: sell,
    getQuote: getQuote,
    getPortfolio: getPortfolio,
    getOrderStatus: getOrderStatus,
    getDealSummary: getDealSummary,
    getLineAvailableCashBalance: getLineAvailableCashBalance,
    getSetStatus: getSetStatus,
    getFavariteData: getFavariteData,
    addSymbolToFavorite: addSymbolToFavorite,
    removeSymbolFromFavorite: removeSymbolFromFavorite
}