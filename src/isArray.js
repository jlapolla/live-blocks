this.isArray = (function() {

  // See:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray#Polyfill
  var fn = {}.toString;
  return function(object) {

    return fn.call(object) === '[object Array]';
  };
}());

