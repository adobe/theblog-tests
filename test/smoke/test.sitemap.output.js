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

const assert = require('assert');
const utils = require('./utils');

const testDomain = process.env.TEST_DOMAIN;
if (!testDomain) {
  throw new Error('Test domain missing, must be set by process.env.TEST_DOMAIN');
}
const testURLs = [
  `https://theblog-adobe.${testDomain}/sitemap.xml`,
];

testURLs.forEach((url) => {
  describe(`Test sitemap output of ${url}`, () => {
    let $;

    // "function" is needed for "this", to set timeout
    before(async function before() {
      this.timeout(utils.HTTP_REQUEST_TIMEOUT_MSEC);
      $ = await utils.getContentAs$(url, 'text/xml');
    });

    it.skip('contains the expected structure', () => {
      assert.equal($('urlset').length, 1, 'has urlset tag');
      assert.ok($('urlset > url').length > 0, 'has 1+ url tags');
      assert.equal(new URL($('urlset > url > loc')[0].textContent.trim()).hostname, `theblog-adobe.${testDomain}`, 'uses correct host name');
    });
  });
});
