/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-env mocha */
/* global window document */

const assert = require('assert');
const puppeteer = require('puppeteer');
const { HTTP_REQUEST_TIMEOUT_MSEC } = require('./utils');

const debug = false;
const testDomain = process.env.TEST_DOMAIN;
if (!testDomain) {
  throw new Error('Test domain missing, must be set by process.env.TEST_DOMAIN');
}
const urlPrefix = `https://master--theblog--adobe.${testDomain}`;
const testPath = '/en/publish/2020/03/19/introducing-public-beta.html';
const url = `${urlPrefix}${testPath}`;

const injectSidekick = async (p) => {
  // dismiss update dialog
  p.on('dialog', (dialog) => dialog.dismiss());
  await p.evaluate((domain) => {
    const s = document.createElement('script');
    s.id = 'hlx-sk-app';
    s.src = `https://www.${domain}/tools/sidekick/app.js`;
    s.dataset.config = JSON.stringify({
      owner: 'adobe',
      repo: 'theblog',
      ref: 'master',
    });
    document.head.append(s);
  }, testDomain);
  return p.waitFor(5000);
};

const execPlugin = async (p, id) => p.evaluate((pluginId) => {
  const click = (el) => {
    const evt = window.document.createEvent('Events');
    evt.initEvent('click', true, false);
    el.dispatchEvent(evt);
  };
  click(window.hlx.sidekick.get(pluginId).querySelector('button'));
}, id);

describe(`Test theblog sidekick for page ${url}`, () => {
  let browser;
  let page;

  beforeEach(async function setup() {
    this.timeout(10000);
    browser = await puppeteer.launch({
      devtools: debug,
    });
    page = await browser.newPage();
  });

  afterEach(async function teardown() {
    this.timeout(10000);
    if (!debug) {
      await browser.close();
      browser = null;
      page = null;
    }
  });

  it('shows the expected number of plugins', async () => {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await injectSidekick(page);
    // retrieve plugins
    const plugins = await page.evaluate(() => Array
      .from(window.hlx.sidekick.shadowRoot.querySelectorAll('.hlx-sk > div button'))
      .map((plugin) => plugin.textContent));
    assert.strictEqual(plugins.length, 9, 'wrong number of plugins');
  }).timeout(HTTP_REQUEST_TIMEOUT_MSEC);

  it('generates predicted url', async () => {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await injectSidekick(page);
    await execPlugin(page, 'predicted-url');
    assert.strictEqual(
      await page.evaluate(
        () => window.hlx.sidekick
          .shadowRoot
          .querySelector('.hlx-sk-overlay > div p:nth-of-type(2)')
          .textContent,
      ),
      `https://blog.adobe.com${testPath}`,
      'predicted url not generated',
    );
  }).timeout(HTTP_REQUEST_TIMEOUT_MSEC);

  it('shows card preview', async () => {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await injectSidekick(page);
    await execPlugin(page, 'card-preview');
    await new Promise((resolve) => {
      page
        .waitForSelector('#hlx-sk-card-preview .card')
        .then((elem) => page.evaluate((card) => {
          try {
            return card.querySelector(':scope h2').textContent;
          } catch (e) {
            return undefined;
          }
        }, elem))
        .then((text) => {
          assert.strictEqual(
            text,
            'Introducing Public Beta',
            'card preview not shown',
          );
          resolve();
        });
    });
  }).timeout(HTTP_REQUEST_TIMEOUT_MSEC);

  it('copies article data to clipboard', async () => {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await injectSidekick(page);
    await execPlugin(page, 'article-data');
    assert.strictEqual(
      await page.evaluate(
        () => window.hlx.sidekick
          .shadowRoot
          .querySelector('.hlx-sk-overlay > div')
          .textContent,
      ),
      'Article data copied to clipboard',
      'article data not copied',
    );
  }).timeout(HTTP_REQUEST_TIMEOUT_MSEC);

  it('publishes article with and without /publish in path', async () => {
    const publishedUrls = await new Promise((resolve, reject) => {
      const urls = [];
      page.setRequestInterception(true);
      page.on('request', (req) => {
        if (req.method() === 'POST') {
          const purgePath = new URL(req.url()).pathname;
          if (purgePath === testPath || purgePath === testPath.replace('/publish/', '/')) {
            urls.push(purgePath);
          }
          req.respond({
            status: 200,
            body: JSON.stringify([{ status: 'ok', url }]),
          });
          if (urls.length === 2) {
            resolve(urls);
          }
        } else {
          req.continue();
        }
      });
      page
        .goto(url, { waitUntil: 'networkidle2' })
        .then(() => injectSidekick(page))
        .then(() => execPlugin(page, 'publish'));
      setTimeout(() => reject(new Error('timed out')), HTTP_REQUEST_TIMEOUT_MSEC - 2000);
    });
    assert.deepStrictEqual(
      publishedUrls,
      [new URL(url).pathname, new URL(url).pathname.replace('/publish/', '/')],
      'article not published with and without /publish',
    );
  }).timeout(HTTP_REQUEST_TIMEOUT_MSEC);
});
