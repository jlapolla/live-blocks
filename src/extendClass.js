this.extendClass = function(base, derived) {

  // See the following links
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create#Polyfill

  var Proto = function() {};

  Proto.prototype = base.prototype;
  derived.prototype = new Proto();
  derived.prototype.constructor = derived;
};

