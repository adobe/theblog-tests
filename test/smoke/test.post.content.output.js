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
const url = `https://theblog-adobe.${testDomain}/en/publish/2020/03/19/introducing-public-beta.html`;

describe(`Test theblog post page content for page ${url}`, () => {
  let $;

  // "function" is needed for "this", to set timeout
  before(async function before() {
    this.timeout(utils.HTTP_REQUEST_TIMEOUT_MSEC);
    $ = await utils.getContentAs$(url);
  });

  it('contains the expected content', () => {
    assert.equal('Introducing Public Beta', $('title').text(), 'title');
    assert.equal(1, $('img[src="/hlx_20d6699b0815a3a7f4b124694d6a6ef556871cad.jpeg"]').length, 'hero banner');
    assert.equal(1, $('p:contains("by Nakiesha Koss")').length, 'author');
    assert.equal(1, $('p:contains("posted on 03-19-2020")').length, 'posted on date');
  });
});
