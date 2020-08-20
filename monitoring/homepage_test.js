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
/* global $browser $driver */
/*
 * Scripted Browser API Documentation:
 * https://docs.newrelic.com/docs/synthetics/new-relic-synthetics/scripting-monitors/writing-scripted-browsers
 */
const assert = require('assert');

function detectFails(sitePage) {
  return (err, response, body) => {
    let count = 0;
    if (response.statuscode !== 200) {
      console.log(`${sitePage} === ${response.statusCode}`);
      count += 1;
    }
    if (count > 0) {
      assert.fail(`${count} page(s) are not delivering 200 status code`);
    }
  };
}

function checkSites(err, response, body) {
  assert.equal(response.statusCode, 200, 'Expected a 200 OK response');
  const arr = JSON.parse(body);
  arr.forEach((site) => {
    const { path } = site;
    const sitePage = `https://blog.adobe.com/${path}`;
    $http.get(sitePage, detectFails(sitePage));
  });
}

function checkFeatured(err, response, body) {
  const rgx = new RegExp('(?<=[\[\<])https://blog.adobe.com/en/(publish)?[0-9]{4}/[0-9]{2}/[0-9]{2}/.*?.html', 'g');
  let match;
  while ((match = rgx.exec(body)) !== null) {
    $http.get(match[0], detectFails(match[0]));
  }
}

$http.get('https://blog.adobe.com/en/query-index.json?limit=64&offset=0', checkSites);
$http.get('https://blog.adobe.com/index.md', checkFeatured);
