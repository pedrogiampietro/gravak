const ConnectionError = function(message) {
  this.name = "ConnectionError";
  this.message = message;
}

ConnectionError.prototype = Error.prototype;

const AuthenticationError = function(message) {
  this.name = "AuthenticationError";
  this.message = message;
}

AuthenticationError.prototype = Error.prototype;

const ServerError = function(message) {
  this.name = "ServerError";
  this.message = message;
}

ServerError.prototype = Error.prototype;
