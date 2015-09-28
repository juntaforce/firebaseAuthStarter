angular.module('starter.controllers', ['auth'])

.controller('AppCtrl', function($scope, $rootScope, $ionicModal, $timeout, AuthService, Session, INFO, $ionicPlatform) {
  // since I can connect from multiple devices or browser tabs, we store each connection instance separately
  // any time that connectionsRef's value is null (i.e. has no children) I am offline
  var myConnectionsRef = new Firebase(INFO.firebaseURL+'/users/joe/connections');
  // stores the timestamp of my last disconnect (the last time I was seen online)
  var lastOnlineRef = new Firebase(INFO.firebaseURL+'/users/joe/lastOnline');
  var connectedRef = new Firebase(INFO.firebaseURL+'/.info/connected');
  connectedRef.on('value', function(snap) {
    if (snap.val() === true) {
      // alert("connected")
      // We're connected (or reconnected)! Do anything here that should happen only if online (or on reconnect)
      // add this device to my connections list
      // this value could contain info about the device or a timestamp too
      var con = myConnectionsRef.push(true);
      // when I disconnect, remove this device
      con.onDisconnect().remove();
      // when I disconnect, update the last time I was seen online
      lastOnlineRef.onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
    } else {
      // alert("disconnect")
    }
  });

  if (window.localStorage.getItem(INFO.applicationNAME+"User") != null) {
      Session.create(JSON.parse(window.localStorage.getItem(INFO.applicationNAME+"User")));
      $scope.user = Session.user;
  } else {
    console.log("No user found in cookies")
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
