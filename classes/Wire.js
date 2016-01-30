this.Wire = (function(getUndefined, hasOwnProperty, Queue, Error){
  function Wire(hash){

    this._bindings = [];
    this._updating = false;

    // Process argument
    if (typeof hash !== "undefined"){

      // Add equalTo function if supplied
      if (typeof hash.equalTo !== "undefined")
        this.equalTo = hash.equalTo;

      // Add queue if supplied
      if (typeof hash.queue !== "undefined")
        this._valueQueue = hash.queue;
    }

    // Set defaults
    if (!hasOwnProperty(this, "_valueQueue"))
      this._valueQueue = new Queue();
  }
  var maxIterations = 1000;
  Wire.setMaxIterations = function(iterations){

    maxIterations = iterations;
  };
  Wire.prototype = {};
  var P = Wire.prototype;
  P.duplicate = function(){

    var hash = {
      _valueQueue: this._valueQueue.duplicate()
    };

    if (hasOwnProperty(this, equalTo))
      hash.equalTo = this.equalTo;

    return new Wire(hash);
  };
  P.equalTo = function(value){

    // Compare with ===, but let NaN === NaN be true
    return value !== value ? this._value !== this._value : value === this._value;
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
      if (bindings[i].block !== block || bindings[i].prop !== prop)
        newBindings.push(bindings[i]);
    }

    // Replace existing bindings
    this._bindings = newBindings;
  };
  P.notify = function(){

    // Get bindings list
    var bindings = this._bindings;

    // Update each bound block
    for (var i = 0; i < bindings.length; i++)
      bindings[i].block.update(bindings[i].prop);
  };
  P.value = function(newValue){

    if (typeof newValue === "undefined")
      return this._value; // We are getting the value
    else {

      // We are setting a new value

      // Check updating flag
      if (this._updating){

        // Add new value to queue and return
        this._valueQueue.push(newValue);
        return;
      }
      else
        this._updating = true;

      // Main loop
      var iterations = 1;
      while (true){

        // Check iteration count
        if (iterations++ > maxIterations){

          this._updating = false;
          throw new Error("Infinite loop detected: reached " + maxIterations + " iterations");
        }

        // Compare new value to current value
        if (!this.equalTo(newValue)){

          // Set new value
          this._value = newValue;

          // Notify bound blocks
          this.notify();
        }

        // Process value queue
        if (this._valueQueue.isEmpty()){

          // Unset updating flag and return
          this._updating = false;
          return;
        }
        else
          newValue = this._valueQueue.next(); // Get next value from queue

        // Restart loop
      }
    }
  };
  return Wire;
}(this.getUndefined, this.hasOwnProperty, this.Queue, host.Error));

