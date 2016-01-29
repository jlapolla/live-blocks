this.Wire = (function(getUndefined){
  function Wire(_isEqual){

    this._bindings = [];
    this._updating = false;

    // Add _isEqual function if supplied
    if (typeof _isEqual !== "undefined")
      this._isEqual = _isEqual;
  }
  Wire.prototype = {};
  var P = Wire.prototype;
  P._isEqual = function(newValue, oldValue){

    // Compare with ===, but let NaN === NaN be true
    return newValue !== newValue ? oldValue !== oldValue : newValue === oldValue;
  };
  P.bind = function(block, prop){

    // Get bindings list
    var bindings = this._bindings;

    // Iterate over bindings and copy to new bindings
    var newBindings = [], bindingExists;
    for (var i = 0; i < bindings.length; i++){
      newBindings.push(bindings[i]);
      if (bindings[i].block === block && bindings[i].prop === prop)
        bindingExists = true;
    }

    // Add new binding if not exists
    if (!bindingExists)
      newBindings.push({block: block, prop: prop});

    // Replace existing bindings
    this._bindings = newBindings;
  };
  P.unbind = function(block, prop){

    // Get bindings list
    var bindings = this._bindings;

    // Iterate over bindings and copy to new bindings
    var newBindings = [];
    for (var i = 0; i < bindings.length; i++){
      if (bindings[i].block !== block && bindings[i].prop !== prop)
        newBindings.push(bindings[i]);
    }

    // Replace existing bindings
    this._bindings = newBindings;
  };
  P.value = function(newValue){

    if (typeof newValue === "undefined")
      return this._value; // We are getting the value
    else {

      // We are setting a new value

      // Check updating flag
      // TODO Finish this function
    }
  };
  return Wire;
}(this.getUndefined));

