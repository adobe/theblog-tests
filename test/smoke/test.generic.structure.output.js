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
const utils = require('./utils');

const testDomain = process.env.TEST_DOMAIN;
if (!testDomain) {
  throw new Error('Test domain missing, must be set by process.env.TEST_DOMAIN');
}
const testURLs = [
  `https://theblog-adobe.${testDomain}/`,
  `https://theblog-adobe.${testDomain}/en/publish/2020/03/19/introducing-public-beta.html`,
];

testURLs.forEach((url) => {
  describe(`Test theblog output structure for page ${url}`, () => {
    let $;

    // "function" is needed for "this", to set timeout
    before(async function before() {
      this.timeout(utils.HTTP_REQUEST_TIMEOUT_MSEC);
      $ = await utils.getContentAs$(url);
    });

    it('contains the expected structure', () => {
      assert.equal(1, $('html').length, 'html tag');
      assert.equal(1, $('head').length, 'head tag');
      assert.equal(1, $('body').length, 'body tag');

      assert.equal(1, $('div#feds-header').length, 'header from esi include');
      assert.equal(1, $('div#feds-footer').length, 'footer from esi include');
    });

    it('contains specific head.html elements', () => {
      assert.equal(1, $('link[href="/style.css"]').length, 'style from head.html include');
      assert.equal(1, $('link[href="/hlx_fonts/pnv6nym.css"]').length, 'fonts from head.html include');
      assert.equal(1, $('script[src="/scripts.js"]').length, 'scripts from head.html include');
    });
  });
});
