this.isObject = (function(isArray) {

  return function(object) {

    return typeof object === 'object' && !isArray(object);
  };
}(this.isArray));

