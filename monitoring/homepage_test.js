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
/* eslint-disable no-console */
/* global $http $util $secure */
/*
 * Synthetics API Test Documentation:
 * https://docs.newrelic.com/docs/synthetics/new-relic-synthetics/scripting-monitors/write-synthetics-api-tests
 */
const assert = require('assert');

function detectFails(sitePage) {
  return (response) => {
    if (response.statusCode !== 200) {
      console.log(response.headers)
      assert.fail(`${response.statusCode} detected at ${sitePage} with stausMessage: ${response.statusMessage}`);
    }
  };
}

function checkSites(err, response, body) {
  assert.equal(response.statusCode, 200, 'Expected a 200 OK response');
  const { data } = JSON.parse(body);
  data.forEach((url) => {
    let { path } = url;
    if (!path.startsWith('/')) {
      path = `/${path}`;
    }
    const sitePage = `https://blog.adobe.com${path}`;
    $http.get(sitePage).on('response', detectFails(sitePage));
  });
}

function checkFeatured(err, response, body) {
  const rgx = new RegExp('(?<=[\[\<])https://blog.adobe.com/en/(publish)?[0-9]{4}/[0-9]{2}/[0-9]{2}/.*?.html', 'g');
  let match;
  while ((match = rgx.exec(body)) !== null) {
    $http.get(match[0]).on('response', detectFails(match[0]));
  }
}

$http.get('https://blog.adobe.com/index.md', {
  headers: {
    'Cache-Control': 'no-store'
  }
}, checkFeatured);
$http.get('https://blog.adobe.com/en/query-index.json?limit=15&offset=0', {
  headers: {
    'Cache-Control': 'no-store'
  }
}, checkSites);
