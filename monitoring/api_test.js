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

// $http -> https://github.com/request/request
$http.get({
  url: '$$$URL$$$',
  headers: {
    'X-Debug': $secure.FASTLY_ID_PAGES,
  },
},
// callback
(err, response) => {
  ['x-openwhisk-activation-id', 'x-request-id', 'x-version'].forEach((h) => {
    $util.insights.set(h, response.headers[h]);
  });
  if (err) {
    $util.insights.set('error', err);
    console.error(err);
  }
  // retrieve activation details via OpenWhisk REST API:
  // https://petstore.swagger.io/?url=https://raw.githubusercontent.com/openwhisk/openwhisk/master/core/controller/src/main/resources/apiv1swagger.json#/Activations/getActivationById
  const id = response.headers['x-openwhisk-activation-id'];
  if (id) {
    // $http -> https://github.com/request/request
    $http.get({
      url: `https://adobeioruntime.net/api/v1/namespaces/_/activations/${id}`,
      headers: {
        Authorization: `Basic ${Buffer.from($secure.WSK_AUTH_HELIX_PAGES).toString('base64')}`,
      },
      json: true,
    },
    // callback
    (e, resp, activationRecord) => {
      if (e) {
        console.log('Failed to retrieve activation record:', e);
        return;
      }
      if (resp.statusCode !== 200) {
        console.info(`Failed to retrieve activation record: statusCode: ${resp.statusCode},`, resp.body);
        return;
      }

      // since the REST API returned statusCode 200 we can assume that resp.body
      // (i.e. activationRecord) is a valid activation record payload:
      // https://github.com/apache/openwhisk/blob/master/docs/actions.md#understanding-the-activation-record

      // dump the full activation record in the script log
      console.info('Activation record:', JSON.stringify(activationRecord, null, 2));
      // store insights
      $util.insights.set('activation_status_code', activationRecord.statusCode);
      $util.insights.set('activation_duration', activationRecord.duration);
      activationRecord.annotations.filter((ann) => ann.key.toLowerCase().indexOf('time') >= 0).forEach((ann) => {
        $util.insights.set(`activation_${ann.key}`, ann.value);
      });
      // check action response
      const { statusCode: actionStatus } = activationRecord.response.result;
      assert.equal(actionStatus, 200, `Expected a 200 OK web action response, got: ${actionStatus}`);
    });
  }
  assert.equal(response.statusCode, 200, `Expected a 200 OK response, got ${response.statusCode}`);
});