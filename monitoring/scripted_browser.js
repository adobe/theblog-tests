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

$browser.get('$$$URL$$$')
  // Get articles
  .then(() => {
    console.log(`Page loaded. Waiting now for '.load-more' element...`);
    return $browser.waitForAndFindElement($driver.By.css('.load-more'), 60000);
  }).then(() => {
    console.log(`'.load-more' found. Retrieving the articles...`);
    return $browser.findElements($driver.By.css('.card'));
  }).then((articles) => {
    // Check if there are enough articles
    console.log(`Found ${articles.length} articles in the page.`);
    assert.ok(articles.length >= 13, `Expected at least 13 articles, got ${articles.length}`);
    // Check if first item is special
    return articles[0].getCssValue('flex-direction');
  }).then((value) => {
    console.log(`flex-direction of first article is ${value}.`);
    assert.equal(value, 'row', `Expected flex-direction of first article to be "row", got "${value}"" instead.`);
  });
