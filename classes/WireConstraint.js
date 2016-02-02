this.WireConstraint = (function(hasOwnProperty, Queue, Error){
  var WireConstraintPinIterator = (function(){
    var refresh = function(){

      // Create new pin names array
      var pinNames = [];
      for (var pinName in this._wireConstraint._functions)
        pinNames.push(pinName);

      // Set _pinNames to new pin names array
      this._pinNames = pinNames;
    };
    function WireConstraintPinIterator(wireConstraint){

      this._wireConstraint = wireConstraint;
      this._index = 0;
      refresh.call(this);
    }
    WireConstraintPinIterator.prototype = {};
    var P = WireConstraintPinIterator.prototype;
    P.reset = function(){

      // Reset iterator index
      this._index = 0;
    };
    P.next = function(){

      // Check if we are at the last pin
      if (this._index < this._pinNames.length){

        // Get pin name at current index
        var pinName = this._pinNames[this._index];

        // Increment index and return pin name and connected wire
        this._index = this._index + 1;
        return {name: pinName, wire: this._wireConstraint._wires[pinName]};
      }
      else
        return; // Return undefined
    };
    P.peek = function(){

      // Check if we are at the last pin
      if (this._index < this._pinNames.length){

        // Get pin name at current index
        var pinName = this._pinNames[this._index];

        // Return pin name at current index and connected wire
        return {name: pinName, wire: this._wireConstraint._wires[pinName]};
      }
      else
        return; // Return undefined
    };
    P.has = function(pinName){

      return hasOwnProperty(this._wireConstraint._functions, pinName);
    };
    return WireConstraintPinIterator;
  }());
  function WireConstraint(hash){

    this._functions = {};
    this._wires = {};
    this._updating = false;

    if (typeof hash !== "undefined"){

      // Add constraint functions if supplied
      if (hasOwnProperty(hash, "functions")){

        for (var name in hash.functions)
          this._functions[name] = hash.functions[name];
      }

      // Add queue if supplied
      if (hasOwnProperty(hash, "queue"))
        this._updateQueue = hash.queue;
    }

    // Set defaults
    if (!hasOwnProperty(this, "_updateQueue"))
      this._updateQueue = new Queue();
  }
  WireConstraint.prototype = {};
  var P = WireConstraint.prototype;
  P.duplicate = function(){

    return new WireConstraint({functions: this._functions, queue: this._updateQueue.duplicate()});
  };
  P.error = function(){

    return this._lastError;
  };
  P.connect = function(prop, wire){

    // Throw error if pin does not exist
    if (!hasOwnProperty(this._functions, prop))
      throw new Error("Pin \"" + prop + "\" not found");

    // Disconnect from old wire, if any
    this.disconnect(prop);

    // Record new wire
    this._wires[prop] = wire;

    // Bind property to wire
    wire.bind(this, prop);

    // Process wire value
    this.update(prop);
  };
  P.disconnect = function(prop){

    // Disconnect from wire, if any
    if (hasOwnProperty(this._wires, prop)){

      this._wires[prop].unbind(this, prop);
      delete this._wires[prop];
    }
  };
  P.update = function(prop){

    // A connected wire value changed

    // Check updating flag
    if (this._updating){

      // Add update to queue and return
      this._updateQueue.push(prop);
      return;
    }
    else
      this._updating = true; // Set updating flag

    // Main loop
    while (true){

      // Construct hash of wires and wire values
      var wires = {}, wireValues = {};
      for (var name in this._wires){

        wires[name] = this._wires[name];
        wireValues[name] = wires[name].value();
      }

      // Execute function in a try block
      try {

        // Call function on wire values hash
        this._functions[prop].call(wireValues);
        delete this._lastError;
      }
      catch (e){

        this._lastError = e;
      }

      // Handle successful run
      if (!hasOwnProperty(this, "_lastError")){

        // Send new wire values to wires
        for (var name in wires)
          wires[name].value(wireValues[name]);
      }

      // Proces update queue
      if (this._updateQueue.isEmpty()){

        // Unset updating flag and return
        this._updating = false;
        return;
      }
      else
        prop = this._updateQueue.next(); // Get next updated property from queue

      // Restart loop
    }
  };
  P.pins = function(){

    return new WireConstraintPinIterator(this);
  };
  return WireConstraint;
}(this.hasOwnProperty, this.Queue, host.Error));

