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

const assert = require('assert');
const { fetch } = require('@adobe/helix-fetch');
const { JSDOM } = require('jsdom');
const jquery = require('jquery');

const HTTP_REQUEST_TIMEOUT_MSEC = 120000;

async function getContentAs$(url, contentType = 'text/html') {
  const res = await fetch(url,
    {
      headers: {
        // 'x-debug': '<use fastly service id here>',
      },
    });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.ok, true);
  const body = await res.text();
  return jquery(new JSDOM(body, { contentType }).window);
}

const assertLater = async (delay = 3000) => new Promise((resolve) => {
  setTimeout(async () => {
    resolve(assert);
  }, delay);
});

module.exports = {
  HTTP_REQUEST_TIMEOUT_MSEC,
  getContentAs$,
  assertLater,
};
