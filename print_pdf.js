const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const fileUrl = 'file://' + path.resolve('physical_menu.html');
  await page.goto(fileUrl, {waitUntil: 'networkidle0'});
  await page.pdf({ path: 'Rakha_Bhai_Cafe_Physical_Menu.pdf', format: 'A4', printBackground: true, margin: {top: 0, right: 0, bottom: 0, left: 0} });
  await browser.close();
})();
