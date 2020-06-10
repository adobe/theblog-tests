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
/* eslint-disable no-undef */
const { HtmlDiffer } = require('html-differ');
const { fetch } = require('@adobe/helix-fetch');
const assert = require('assert');

const testDomain = process.env.TEST_DOMAIN;

describe('html tests', () => {
  let bases = [];
  let changes = [];
  const options = {
    ignoreAttributes: [],
    compareAttributesAsJSON: [],
    ignoreWhitespaces: true,
    ignoreComments: true,
    ignoreEndTags: false,
    ignoreDuplicateAttributes: false,
  };

  before(async () => {
    const json = {
      limit: 5,
      threshold: 100,
    };
    const method = 'post';
    const res = await fetch('https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@v2/most-visited', { method, json });
    if (!res.ok) {
      assert.fail('test setup failed to gather test urls');
    }
    const { results } = await res.json();
    // construct array of promises from fetch
    changes = results.map((obj) => {
      const headers = {
        'Cache-Control': 'no-store',
      };
      // eslint-disable-next-line camelcase
      const { req_url } = obj;
      const { pathname } = new URL(req_url);
      const thirdLvl = req_url.split('.')[0];
      const changed = [thirdLvl, testDomain].join('.') + pathname;

      // fetch html of old page and new page published by CI
      bases.push(fetch(req_url, { headers }).then((data) => data.text()));
      return fetch(changed, { headers }).then((data) => data.text());
    });
    bases = await Promise.all(bases);
    changes = await Promise.all(changes);
  });

  it('diff pages', async () => {
    const htmlDiffer = new HtmlDiffer(options);
    const res = bases.filter((base, idx) => !htmlDiffer.isEqual(base, changes[idx]))
      .map((base, idx) => htmlDiffer.diffHtml(base, changes[idx]));
    assert.equal(res.length, 0);
  });
});
