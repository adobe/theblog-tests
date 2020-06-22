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
const rp = require('request-promise-native');
const jquery = require('jquery');
const { JSDOM } = require('jsdom');

const HTTP_REQUEST_TIMEOUT_MSEC = 40000;

async function getContentAs$(url, contentType = 'text/html') {
  try {
    const res = await rp({
      uri: url,
      headers: {
      // 'x-debug': '<use fastly service id here>',
      },
      resolveWithFullResponse: true,
    });
    assert.equal(res.statusCode, 200);
    return jquery(new JSDOM(res.body, { contentType }).window);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('response headers', e.response.headers);
    throw e;
  }
}

module.exports.HTTP_REQUEST_TIMEOUT_MSEC = HTTP_REQUEST_TIMEOUT_MSEC;
module.exports.getContentAs$ = getContentAs$;
