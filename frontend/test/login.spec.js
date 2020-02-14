// Generated by Selenium IDE
const { Builder, By, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert')
const {waitForElementToBeReady , takeScreenshot, delay} = require('./helpers/selenium');

const BASE_URL = 'http://127.0.0.1:8080';
const configuration = { timeout:30000 };


describe('3drepo.io', function() {
  this.timeout(60000)
  let driver
  let vars
  beforeEach(async function() {
    const args = new chrome.Options().addArguments(['headless','disable-gpu', 'enable-logging']);
//    const args = new chrome.Options().addArguments(['enable-logging']);

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(args)
      .build();

    try {
        await driver.manage().window().setRect({
          width: 1025,
          height: 950
        });
      } catch (error) {
        console.log('Unable to resize window. Skipping.');
      };

    vars = {}
  })

  afterEach(async function() {
    await driver.quit();
  })

  it('Login', async function() {
    let element = null;

//    await driver.get((new URL(`/login`, BASE_URL)).href);
    await driver.get('https://www.bbc.co.uk/');

    try {
      await driver.manage().window().setRect({
        width: 1025,
        height: 950
      });
    } catch (error) {
      console.log('Unable to resize window. Skipping.');
    };


    takeScreenshot(driver);

    // (await waitForElementToBeReady(driver, By.name(`login`), configuration.timeout)).sendKeys(`teamSpace1`);

    // (await waitForElementToBeReady(driver, By.name(`password`), configuration.timeout)).sendKeys(`password`);

    // // Click login
    // (await waitForElementToBeReady(driver, By.css(`.MuiButton-contained-212 > .MuiButton-label-202`), configuration.timeout)).click();

    // //  Click user menu
    // (await waitForElementToBeReady(driver, By.xpath(`/html/body/div[3]/div/div[2]/button[2]`), configuration.timeout)).click();

    // //  Click logout
    // (await waitForElementToBeReady(driver, By.css(`.MuiButtonBase-root-7:nth-child(6) > .MuiListItemText-root-496`), configuration.timeout)).click();

  })
})

