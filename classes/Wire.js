this.Wire = (function(getUndefined, hasOwnProperty, Queue, Error){
  var WireConnectionIterator = (function(){
    var refresh = function(){

      this._connections = this._wire._bindings;
    };
    function WireConnectionIterator(wire){

      this._wire = wire;
      this._index = 0;
      refresh.call(this);
    }
    WireConnectionIterator.prototype = {};
    var P = WireConnectionIterator.prototype;
    P.reset = function(){

      // Reset iterator index
      this._index = 0;
    };
    P.next = function(){

      // Check if we are at the last connection
      if (this._index < this._connections.length){

        // Get current connection
        var connection = this._connections[this._index];

        // Increment index and return connection
        this._index = this._index + 1;
        return {block: connection.block, pin: connection.pin};
      }
      else
        return; // Return undefined
    };
    P.peek = function(){

      // Check if we are at the last connection
      if (this._index < this._connections.length){

        // Get current connection
        var connection = this._connections[this._index];

        // Return connection
        return {block: connection.block, pin: connection.pin};
      }
      else
        return; // Return undefined
    };
    P.has = function(connection){

      // Run through iterator and check for equivalent connection
      for (var i = 0; i < this._connections.length; i++){

        var con = this._connections[i];
        if (con.block === connection.block && con.pin === connection.pin)
          return true;
      }

      // Match not found
      return false;
    };
    return WireConnectionIterator;
  }());
  function Wire(hash){

    this._bindings = [];
    this._updating = false;

    // Process argument
    if (typeof hash !== "undefined"){

      // Add equalTo function if supplied
      if (hasOwnProperty(hash, "equalTo"))
        this.equalTo = hash.equalTo;

      // Add queue if supplied
      if (hasOwnProperty(hash, "queue"))
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
      queue: this._valueQueue.duplicate()
    };

    if (hasOwnProperty(this, "equalTo"))
      hash.equalTo = this.equalTo;

    return new Wire(hash);
  };
  P.equalTo = function(value){

    // Compare with ===, but let NaN === NaN be true
    return value !== value ? this._value !== this._value : value === this._value;
  };
  P.bind = function(block, pin){

    // Get bindings list
    var bindings = this._bindings;

    // Iterate over bindings and copy to new bindings
    var newBindings = [], bindingExists;
    for (var i = 0; i < bindings.length; i++){
      newBindings.push(bindings[i]);
      if (bindings[i].block === block && bindings[i].pin === pin)
        bindingExists = true;
    }

    // Add new binding if not exists
    if (!bindingExists)
      newBindings.push({block: block, pin: pin});

    // Replace existing bindings
    this._bindings = newBindings;
  };
  P.unbind = function(block, pin){

    // Get bindings list
    var bindings = this._bindings;

    // Iterate over bindings and copy to new bindings
    var newBindings = [];
    for (var i = 0; i < bindings.length; i++){
      if (bindings[i].block !== block || bindings[i].pin !== pin)
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
      bindings[i].block.update(bindings[i].pin);
  };
  P.value = function(newValue){

    if (!arguments.length)
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
        this._updating = true; // Set updating flag

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
  P.connections = function(){

    return new WireConnectionIterator(this);
  };
  return Wire;
}(this.getUndefined, this.hasOwnProperty, this.Queue, host.Error));

