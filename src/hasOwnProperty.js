this.hasOwnProperty = (function() {

  var fn = {}.hasOwnProperty;
  return function(object, property) {

    return fn.call(object, property);
  };
}());

