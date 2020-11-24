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
/* global window document navigator */

const assert = require('assert');
const puppeteer = require('puppeteer');
const utils = require('./utils');

const testDomain = process.env.TEST_DOMAIN;
if (!testDomain) {
  throw new Error('Test domain missing, must be set by process.env.TEST_DOMAIN');
}
const urlPrefix = `https://theblog--adobe.${testDomain}`;
const url = `${urlPrefix}/en/publish/2020/03/19/introducing-public-beta.html`;

const injectSidekick = async (p) => {
  await p.evaluate(() => {
    window.hlxSidekickConfig = {
      project: 'Blog',
      host: 'blog.adobe.com',
      owner: 'adobe',
      repo: 'theblog',
    };
    document.head.appendChild(document.createElement('script'))
      .src = 'https://www.hlx.page/tools/sidekick/app.js';
  });
  return p.waitFor(5000);
};

const execPlugin = async (p, id) => p.evaluate((pluginId) => {
  const click = (el) => {
    const evt = window.document.createEvent('Events');
    evt.initEvent('click', true, false);
    el.dispatchEvent(evt);
  };
  click(window.document.querySelector(`.hlx-sk .${pluginId} button`));
}, id);

describe(`Test theblog sidekick for page ${url}`, () => {
  let browser;
  let page;

  beforeEach(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterEach(async () => {
    await browser.close();
    browser = null;
    page = null;
  });

  it('shows the expected number of  plugins', async () => {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await injectSidekick(page);
    // retrieve plugins
    const plugins = await page.evaluate(() => Array
      .from(document.querySelectorAll('.hlx-sk > div button'))
      .map((plugin) => plugin.textContent));
    browser.close();
    assert.strictEqual(plugins.length, 5, 'wrong number of plugins');
  }).timeout(utils.HTTP_REQUEST_TIMEOUT_MSEC);

  it('generates predicted url', async () => {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await injectSidekick(page);
    await execPlugin(page, 'predicted-url');
    assert.strictEqual(
      await page.evaluate(
        () => document.querySelector('.hlx-sk-overlay > div p:nth-of-type(2)').textContent,
      ),
      'https://blog.adobe.com/en/2020/03/19/introducing-public-beta.html',
      'predicted url not generated',
    );
  }).timeout(utils.HTTP_REQUEST_TIMEOUT_MSEC);

  it('shows card preview', async () => {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await injectSidekick(page);
    await execPlugin(page, 'card-preview');
    assert.strictEqual(
      await page.evaluate(
        () => document.querySelector('.hlx-sk-overlay .card h2 a').textContent,
      ),
      'Introducing Public Beta',
      'card preview not shown',
    );
  }).timeout(utils.HTTP_REQUEST_TIMEOUT_MSEC);

  it('copies article data to clipboard', async () => {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await injectSidekick(page);
    await execPlugin(page, 'article-data');
    assert.strictEqual(
      await page.evaluate(
        () => document.querySelector('.hlx-sk-overlay > div').textContent,
      ),
      'Article data copied to clipboard',
      'article data not copied',
    );
  }).timeout(utils.HTTP_REQUEST_TIMEOUT_MSEC);
});
