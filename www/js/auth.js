angular.module('auth', [])


// CONSTANTS
.constant('AUTH_EVENTS', {
  loginSuccess: 'auth-login-success',
  loginFailed: 'auth-login-failed',
  logoutSuccess: 'auth-logout-success',
  sessionTimeout: 'auth-session-timeout',
  notAuthenticated: 'auth-not-authenticated',
  notAuthorized: 'auth-not-authorized'
})

.constant('USER_ROLES', {
  all: '*',
  user: 'user'
})

.constant('DB', {
  url: 'https://myauthstarter.firebaseio.com'
})

// SERVICES
.factory('AuthService', function ($http, Session, DB, $q) {
  var authService = {}
 
  authService.loginEmail = function (credentials) {
    return $q(function (resolve, reject) {
      var ref = new Firebase(DB.url);
      ref.authWithPassword({
        email    : credentials.username,
        password : credentials.password
      }, function (error, authData) {
        if (error) {
          console.log("Login Failed!", error);
        } else {
          Session.create(authData);
          resolve(authData);
        }
      });
    });
  }
  authService.registerEmail = function (credentials) {
    return $q(function (resolve, reject) {
      var ref = new Firebase(DB.url);
      ref.createUser({
        email    : credentials.username,
        password : credentials.password
      }, function (error, userData) {

        if (error) {
          switch (error.code) {
            case "EMAIL_TAKEN":
              console.log("The new user account cannot be created because the email is already in use.");
              break;
            case "INVALID_EMAIL":
              console.log("The specified email is not a valid email.");
              break;
            default:
              console.log("Error creating user:", error);
          }
        } else {
          console.log("Successfully created user account with uid:", userData.uid);
          ref.authWithPassword({
            email    : credentials.username,
            password : credentials.password
          }, function (error, authData) {
            if (error) {
              console.log("Login Failed!", error);
            } else {
              Session.create(authData);
              resolve(authData);
            }
          });
        }
      });
    });
  }

  authService.loginFacebook = function (credentials) {
    return $http
      .post('/login', credentials)
      .then(function (res) {
        Session.create(res.data.id, res.data.user.id,
                       res.data.user.role);
        return res.data.user;
      });
  };

  authService.isAuthenticated = function () {
    return !!Session.userId;
  };
 
  authService.isAuthorized = function (authorizedRoles) {
    if (!angular.isArray(authorizedRoles)) {
      authorizedRoles = [authorizedRoles];
    }
    return (authService.isAuthenticated() &&
      authorizedRoles.indexOf(Session.userRole) !== -1);
  };
 
  return authService;
})

.service('Session', function () {
  this.create = function (authData) {
    this.user = authData
  };
  this.destroy = function () {
    this.user = null;
  };
})

// CONTROLLERS
.controller('EmailCtrl', function ($scope, $rootScope, AUTH_EVENTS, Session, AuthService) {
  $scope.credentials = {
    username: '',
    password: ''
  }
  $scope.registerCredentials = {
    username: '',
    password: '',
    repassword: ''
  }

  $scope.wrongconfirm = false;
  $scope.emptyemail = false;

  $scope.login = function (credentials) {
    AuthService.loginEmail(credentials).then(function (user) {
      $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
      $scope.credentials = {
        username: '',
        password: ''
      }
      $scope.closeLogin()
    }, function () {
      $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
    });
  }

  $scope.register = function (registerCredentials) {
    // Email
    if (registerCredentials.username=='') {
      $scope.emptyemail = true;
    } else {
      $scope.emptyemail = false;
    }

    //Password confirmation 
    if (registerCredentials.password==registerCredentials.repassword) {
      $scope.wrongconfirm = false;
    } else {
      $scope.wrongconfirm = true;
    }

    if (!$scope.wrongconfirm && !$scope.emptyemail) {
      AuthService.registerEmail(registerCredentials).then(function (user) {
        $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
        $scope.closeLogin()
      }, function () {
        $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
      }); 
    }

  }
});