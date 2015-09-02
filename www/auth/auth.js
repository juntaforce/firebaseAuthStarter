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
.factory('AuthService', function ($http, Session, DB, $q, $ionicModal) {
  var authService = {}
 
  // PUBLIC METHOD
  authService.showLoginPopup = function (credentials) {
    return $q(function (resolve, reject) {
      $ionicModal.fromTemplateUrl('auth/login.html').then(function(modal) {
        authService.modal = modal;
        authService.modal.show();
      });
    });
  }

  // PUBLIC METHOD
  authService.hideLoginPopup = function (credentials) {
    return $q(function (resolve, reject) {
      authService.modal.hide();
    });
  }

  authService.logout = function () {
    return $q(function (resolve, reject) {
      var ref = new Firebase(DB.url);
      ref.unauth();
      Session.destroy();
      resolve({ 
        success : true,
        data : "Successfully logged out" 
      });
    });
  }

  authService.loginEmail = function (credentials) {
    return $q(function (resolve, reject) {
      var ref = new Firebase(DB.url);
      ref.authWithPassword({
        email    : credentials.email,
        password : credentials.password
      }, function (error, authData) {
        if (error) {
          resolve({ 
            success : false,
            data : error.message 
          });
        } else {
          Session.create(authData);
          resolve({ 
            success : true,
            data : authData 
          });
        }
      });
    });
  }

  authService.resetPassword = function (credentials) {
    return $q(function (resolve, reject) {
      var ref = new Firebase(DB.url);
      ref.resetPassword({
        email: credentials.email
      }, function(error) {
        if (error) {
          switch (error.code) {
            case "INVALID_USER":
              resolve({
                success: false,
                data: "User account for entered email does not exist."
              });
              break;
            default:
              resolve({
                success: false,
                data: error.message
              });
          }
        } else {
          resolve({
            success: true,
            data: "Password reset email sent successfully!"
          });
        }
      });
    });
  }

  authService.registerEmail = function (credentials) {
    return $q(function (resolve, reject) {
      var ref = new Firebase(DB.url);
      ref.createUser({
        email    : credentials.email,
        password : credentials.password
      }, function (error, userData) {

        if (error) {
          switch (error.code) {
            case "EMAIL_TAKEN":
              resolve({
                success: false,
                data: "The new user account cannot be created because the email is already in use."
              });
              break;
            case "INVALID_EMAIL":
              resolve({
                success: false,
                data: "The specified email is not a valid email."
              });
              break;
            default:
              resolve({
                success: false,
                data: error.message
              });
          }
        } else {
          ref.authWithPassword({
            email    : credentials.email,
            password : credentials.password
          }, function (error, authData) {
            if (error) {
              resolve({
                success: false,
                data: "Error while loggin in."
              });
            } else {
              Session.create(authData);
              resolve({
                success: true,
                data: authData
              });
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
    return !!Session.user;
  };
 
  // authService.isAuthorized = function (authorizedRoles) {
  //   if (!angular.isArray(authorizedRoles)) {
  //     authorizedRoles = [authorizedRoles];
  //   }
  //   return (authService.isAuthenticated() &&
  //     authorizedRoles.indexOf(Session.userRole) !== -1);
  // };
 
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
.controller('EmailCtrl', function ($scope, $rootScope, AUTH_EVENTS, Session, AuthService, $timeout) {
  $scope.credentials = {
    email: '',
    password: ''
  }
  $scope.registerCredentials = {
    email: '',
    password: '',
    repassword: ''
  }

  $scope.wrongconfirm = false;
  $scope.emptyemail = false;

  $scope.login = function (credentials) {
    AuthService.loginEmail(credentials).then(function (result) {
      if (result.success) {
        $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
        $scope.credentials = {
          email: '',
          password: ''
        }
        AuthService.hideLoginPopup()
        console.log(Session.user)
      } else {
        $scope.message = result.data;
        $timeout(function() {
          $scope.message = null;
        }, 3000);
        $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
      }
    });
  }

  $scope.register = function (registerCredentials) {
    // Email
    if (registerCredentials.email=='') {
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
      AuthService.registerEmail(registerCredentials).then(function (result) {
        if (result.success) {
          $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
          $scope.registerCredentials = {
            email: '',
            password: '',
            repassword: ''
          }
          AuthService.hideLoginPopup()
          console.log(Session.user)
        } else {
          $scope.message = result.data;
          $timeout(function() {
            $scope.message = null;
          }, 3000);
        }
      }, function () {
        $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
      }); 
    }
  }

  $scope.restorePassword = function (credentials) {
    // Email
    if (credentials.email=='') {
      $scope.emptyemail = true;
    } else {
      $scope.emptyemail = false;
    }

    if (!$scope.emptyemail) {
      AuthService.resetPassword(credentials).then(function (result) {
        if (result.success) {
          $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
          $scope.credentials = {
            email: '',
            password: ''
          }
          $scope.message = result.data;
          $timeout(function() {
            $scope.message = null;
          }, 3000);
        } else {
          $scope.message = result.data;
          $timeout(function() {
            $scope.message = null;
          }, 3000);
          $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
        }
      });
    };

  }

  $scope.hideLoginPopup = function () {
    AuthService.hideLoginPopup()
  }
});