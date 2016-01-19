this.getUndefined = (function(){
  var object = {};
  return function(){
    return object.a;
  };
}());

