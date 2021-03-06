/**
 * (c) Copyright 2015 Hewlett-Packard Development Company, L.P.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function () {
  'use strict';

  angular
    .module('horizon.app.core.openstack-service-api')
    .factory('horizon.app.core.openstack-service-api.novaExtensions', NovaExtensionsAPI);

  NovaExtensionsAPI.$inject = [
    '$cacheFactory',
    '$q',
    'horizon.app.core.openstack-service-api.nova'
  ];

  /**
   * @ngdoc service
   * @name horizon.app.core.openstack-service-api.novaExtensions
   * @description
   * Provides cached access to Nova Extensions with utilities to help
   * with asynchronous data loading. The cache may be reset at any time
   * by accessing the cache and calling removeAll. The next call to any
   * function will retrieve fresh results.
   *
   * The enabled extensions do not change often, so using cached data will
   * speed up results. Even on a local devstack in informal testing,
   * this saved between 30 - 100 ms per request.
   */
  function NovaExtensionsAPI($cacheFactory, $q, novaAPI) {
    var service = {
      cache: $cacheFactory(
        'horizon.app.core.openstack-service-api.novaExtensions',
        {capacity: 1}
      ),
      get: get,
      ifNameEnabled: ifNameEnabled
    };

    return service;

    ///////////

    function get() {
      return novaAPI.getExtensions({cache: service.cache}).then(onGetExtensions);
    }

    function onGetExtensions(data) {
      return data.data.items;
    }

    function ifNameEnabled(desired) {
      var deferred = $q.defer();

      service.get().then(onDataLoaded, onDataFailure);

      function onDataLoaded(extensions) {
        if (enabled(extensions, 'name', desired)) {
          deferred.resolve();
        } else {
          deferred.reject(interpolate(
            gettext('Extension is not enabled: %(extension)s.'),
            {extension: desired},
            true));
        }
      }

      function onDataFailure() {
        deferred.reject(gettext('Cannot get the Nova extension list.'));
      }

      return deferred.promise;
    }

    function enabled(resources, key, desired) {
      if (resources) {
        return resources.some(function matchResource(resource) {
          return resource[key] === desired;
        });
      } else {
        return false;
      }
    }

  }
}());
