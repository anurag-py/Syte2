'use strict';

angular.module('clientApp')

  .controller('InstagramCtrl', ['$scope', '$rootScope', '$http', '$window', 'ModalService',
    function($scope, $rootScope, $http, $window, ModalService) {
      $scope.user = {};
      $scope.posts = [];

      var running = false;
      var fetching = false;

      function _getPosts(cb) {
        if (fetching) { 
          return;
        }

        fetching = true;
        $http.get('/instagram/recent').success(function(data, status) {
          if (status === 200 && data && data.length) {
            $scope.posts = $scope.posts.concat(data);
            fetching = false;
            running = false;
            cb();
          } 
        }).error(function(data) {
          console.log('Error', data);
          fetching = false;
          running = false;
          cb();
        });
      }

      function _getUser(cb) {
        $http.get('/instagram/user').success(function(data, status) {
          if (status === 200 && data) {
            $scope.user = data;
            _getPosts(cb);
          }
        }).error(function(data) {
          console.log('Error', data);
          cb();
        });
      }

      function _animateEnter(extraTime) {
        if (!$scope.animateEnter) {
          var time = $rootScope.firstEnter ? 500: 1000;
          time += extraTime <= 500 ? extraTime : 500;

          setTimeout(function() {
            $scope.animateEnter = true;
            $scope.visible = true;
            if (!$scope.$$phase) {
               $scope.$apply();
            }
            if (!$rootScope.firstEnter) {
              $rootScope.firstEnter = true;
            }
            setTimeout(function() {
              $scope.animateEnter = false;
              if (!$scope.$$phase) {
                $scope.$apply();
              }
            }, 1200);
          }, time);
        }
      }

      _getUser(function() {
        var start = new Date().getTime();
        var didLoadAnimateFirst = false;

        var loadTimeout = setTimeout(function() {
          if (!didLoadAnimateFirst) {
            didLoadAnimateFirst = true;
            _animateEnter(0);
          }
        }, 2000);

        $rootScope.$on('lazyImg:success', function() {
          if (!didLoadAnimateFirst) {
            clearTimeout(loadTimeout);
            var elapsed = new Date().getTime() - start;
            didLoadAnimateFirst = true;
            _animateEnter(elapsed);
            return;
          }
        });

        $rootScope.$on('lazyImg:error', function() {
          if (!didLoadAnimateFirst) {
            clearTimeout(loadTimeout);
            var elapsed = new Date().getTime() - start;
            didLoadAnimateFirst = true;
            _animateEnter(elapsed);
            return;
          }
        });

      });

      $scope.openPost = function(item) {
        ModalService.showModal({
          templateUrl: 'templates/instagram/details.html',
          controller: 'InstagramDetailsCtrl',
          inputs: {
            item: item
          }
        });
      };
    }
  ])

  .directive('instagramPost', ['$window', 'ModalService', function($window, ModalService) {
    return {
      restrict: 'E',
      scope: {
        item: '='
      },
      templateUrl: 'templates/instagram/post.html',
      link: function(scope) {
        scope.openPost = function(item) {
          ModalService.showModal({
            templateUrl: 'templates/instagram/details.html',
            controller: 'InstagramDetailsCtrl',
            inputs: {
              item: item
            }
          });
        };
      }
    };
  }])

  .controller('InstagramDetailsCtrl', ['$scope', 'close', 'item',
    function($scope, close, item) {
      $scope.close = close;
      $scope.item = item;
      $scope.playing = false;

      $scope.playVideo = function() {
        var video = angular.element(document.querySelector('#video'));
        if (video[0].paused === true) {
            video[0].play();
            $scope.playing = true;
        } else {
            video[0].pause();
            $scope.playing = false;
        }

        video[0].onended = function() {
          $scope.playing = false;
          if (!$scope.$$phase) {
            $scope.$apply();
          }
        };
      };
    }
  ]);
