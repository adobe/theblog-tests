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
/* eslint-disable no-console */

const assert = require('assert');
const puppeteer = require('puppeteer');
const utils = require('./utils');

const testDomain = process.env.TEST_DOMAIN;
if (!testDomain) {
  throw new Error('Test domain missing, must be set by process.env.TEST_DOMAIN');
}
const urlPrefix = `https://theblog-adobe.${testDomain}`;
const url = `${urlPrefix}/en/publish/2020/03/19/introducing-public-beta.html`;

describe(`Test theblog post page content for page ${url}`, () => {
  it('contains the expected content', async () => {
    const $ = await utils.getContentAs$(url);
    console.log($('body'));
    assert.equal('Introducing Public Beta', $('title').text(), 'title');
    assert.equal(1, $('img[src="/hlx_20d6699b0815a3a7f4b124694d6a6ef556871cad"]').length, 'hero banner');
    assert.equal(1, $('p:contains("by Nakiesha Koss")').length, 'author');
    assert.equal(1, $('p:contains("posted on 03-19-2020")').length, 'posted on date');
  }).timeout(utils.HTTP_REQUEST_TIMEOUT_MSEC);

  it('makes the expected requests', async () => {
    let numReqs = 0;
    const failedReqs = [];
    const wrongImgs = [];
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('response', (resp) => {
      numReqs += 1;
      // test response of blog requests
      if (!resp.ok() && resp.url().startsWith(urlPrefix)) {
        failedReqs.push(`${resp.url()}: ${resp.status()}`);
      }
      // test content types of hlx images
      if (/.*\/hlx_.*(jpeg|jpg|png|gif|webp).*/.test(resp.url())
        && !resp.headers()['content-type'].startsWith('image/')) {
        wrongImgs.push(`${resp.url()}: ${resp.headers()['content-type']}`);
      }
    });
    await page.goto(url, { waitUntil: 'networkidle2' });
    browser.close();
    // test number of requests
    assert.ok(numReqs, 'browser made requests');
    // no failed requests
    assert.equal(0, failedReqs.length, `The following request(s) failed:\n${failedReqs.join('\n')}`);
    // no wrong image content types
    assert.equal(0, wrongImgs.length, `The following image(s) had an invalid content type:\n${wrongImgs.join('\n')}`);
  }).timeout(utils.HTTP_REQUEST_TIMEOUT_MSEC);
});
