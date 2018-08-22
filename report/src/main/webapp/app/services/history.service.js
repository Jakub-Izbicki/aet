/*
  * AET
  *
  * Copyright (C) 2013 Cognifide Limited
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *      http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  */
define(['angularAMD', 'endpointConfiguration'], function (angularAMD) {
  'use strict';
  angularAMD.factory('historyService', historyService);

  /**
   * Service responsible for fetching suite's history
   */
  function historyService($rootScope, $http, endpointConfiguration) {
    var suiteHeaders;
    $rootScope.endpointUrl = endpointConfiguration.getEndpoint().getUrl;
    var service = {
      getNextVersion: getNextVersion,
      getPreviousVersion: getPreviousVersion,
      fetchHistory: fetchHistory,
    };

    return service;

    function fetchHistory(currentVersion, fetchCallback) {
      $rootScope.selectedVersion = currentVersion;
      getSuiteHistory(suiteHeaders, $rootScope, $http, function () {
        fetchCallback();
      });
    }

    function buildApiPath($allParametersList) {
      return $rootScope.endpointUrl + 'history' + '?' +
        $allParametersList[0] + '&' +
        $allParametersList[1] + '&' +
        $allParametersList[2];
    }

    function getPreviousVersion(currentVersion) {
      var prevVersion = null;
      $rootScope.suiteHeaders.forEach(function(suiteHeader, index) {
        if(suiteHeader.version === currentVersion) {
          if($rootScope.suiteHeaders[index + 1]) {
            prevVersion =  $rootScope.suiteHeaders[index + 1].version;
          }
        }
      });
      return prevVersion;
    }

    function getNextVersion(currentVersion) {
      var nextVersion = null;
      $rootScope.suiteHeaders.forEach(function(suiteHeader, index) {
        if(suiteHeader.version === currentVersion) {
          if($rootScope.suiteHeaders[index - 1]) {
            nextVersion =  $rootScope.suiteHeaders[index - 1].version;
          }
        }
      });
      return nextVersion;
    }

    function getSuiteHistory(suiteHeaders, $rootScope, $http, historyCallback) {
      $rootScope.data = 'test';
      var cUrl = new URL(window.location.href);
      var company = cUrl.searchParams.get('company');
      var project = cUrl.searchParams.get('project');
      var suite = cUrl.searchParams.get('suite');
      if (suite === null) {
        var correlationId = cUrl.searchParams.get('correlationId');
        suite = correlationId.split('-')[2];
      }
      var allParametersList = ['company=' + company, 'project=' + project, 'suite=' + suite];
      return $http({
        method: 'GET',
        url: buildApiPath(allParametersList),
        headers: {
          'Content-Type': 'text/plain'
        }
      }).then(function (response) {
        $rootScope.data = response.data;
        suiteHeaders = response.data;
        for (var i = 0; i < suiteHeaders.length; i++) {
          var version = suiteHeaders[i].version;
          var company = suiteHeaders[i].correlationId.split('-')[0];
          var project = suiteHeaders[i].correlationId.split('-')[1];
          var suite = suiteHeaders[i].correlationId.split('-')[2];
          var correlationId = suiteHeaders[i].correlationId.split('-')[3];
          suiteHeaders[i] = {
            company: company,
            project: project,
            suite: suite,
            version: version,
            correlationId: correlationId,
            selectedVersion: null,
            isRebased: false,
          };
          if (typeof suiteHeaders[i - 1] !== 'undefined') {
            if (suiteHeaders[i].correlationId === suiteHeaders[i - 1].correlationId) {
              suiteHeaders[i - 1].isRebased = true;
            }
          }
        }
        $rootScope.suiteHeaders = suiteHeaders;
        var reportPath = window.location.href;
        var reportUrl = new URL(reportPath);
        var currentVersion = reportUrl.searchParams.get('version');
        if (currentVersion === null) {
          $rootScope.reportPath = location.protocol + '//' + location.host + location.pathname + window.location.search;
        } else {
          reportPath = window.location.search.split('&');
          reportPath = reportPath[0] + '&' + reportPath[1] + '&' + reportPath[2];
          $rootScope.reportPath = location.protocol + '//' + location.host + location.pathname + reportPath;
        }
        if(reportUrl.searchParams.get("correlationId")) {
          reportPath = '?' + allParametersList[0] + '&' + allParametersList[1] + '&' + allParametersList[2];
          $rootScope.reportPath = location.protocol + '//' + location.host + location.pathname + reportPath;
        }
        historyCallback();
      }, function errorCallback(response) {
        $rootScope.fullSuiteName = response.data.message;
      });
    }
  }
});