angular.module('starter.controllers', ['auth'])

.controller('AppCtrl', function($scope, $rootScope, $ionicModal, $timeout, AuthService, Session) {

  if (window.localStorage.getItem("ionicUser") != "undefined") {
      Session.create(JSON.parse(window.localStorage.getItem("ionicUser")));
      $scope.user = Session.user;
  } else {
    AuthService.showLoginPopup();
  }

  $rootScope.$on('auth-login-success', function () {
    $scope.user = Session.user;
  });
  $rootScope.$on('auth-logout-success', function () {
    $scope.user = null;
  });

  $scope.showProfilePopup = function () {
    AuthService.showProfilePopup();
  }
  $scope.showLoginPopup = function () {
    AuthService.showLoginPopup();
  }
  $scope.logout = function () {
    AuthService.logout();
  }

})

.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})

.controller('PlaylistCtrl', function($scope, $stateParams) {
});
