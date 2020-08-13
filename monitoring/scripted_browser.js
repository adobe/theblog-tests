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

async function check() {
  await $browser.get('$$$URL$$$');
  // load-more is the last DOM element injected by the scripts - wait for it
  await $browser.waitForAndFindElement($driver.By.css('.load-more'), 60000);
  const articles = await $browser.findElements($driver.By.css('.card'));
  // Check if there are enough articles
  assert.ok(articles.length >= 13, `Expected at least 13 articles, got ${articles.length}`);
  // Check if first item is special
  const value = await articles[0].getCssValue('flex-direction');
  assert.equal(value, 'row', `Expected flex-direction of first article to be "row", got "${value}"" instead.`);
}
check();
