this.WireConstraint = (function(hasOwnProperty, Queue, Error, extendClass, EventEmitter){
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

    EventEmitter.call(this);

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
  extendClass(EventEmitter, WireConstraint);
  var P = WireConstraint.prototype;
  P.duplicate = function(){

    return new WireConstraint({functions: this._functions, queue: this._updateQueue.duplicate()});
  };
  P.error = function(){

    return this._lastError;
  };
  P.connect = function(pin, wire){

    // Throw error if pin does not exist
    if (!hasOwnProperty(this._functions, pin))
      throw new Error("Pin \"" + pin + "\" not found");

    // Disconnect from old wire, if any
    this.disconnect(pin);

    // Record new wire
    this._wires[pin] = wire;

    // Bind pin to wire
    wire.bind(this, pin);

    // Process wire value
    this.update(pin);
  };
  P.disconnect = function(pin){

    // Disconnect from wire, if any
    if (hasOwnProperty(this._wires, pin)){

      this._wires[pin].unbind(this, pin);
      delete this._wires[pin];
    }
  };
  P.update = function(pin){

    // A connected wire value changed

    // Check updating flag
    if (this._updating){

      // Add update to queue and return
      this._updateQueue.push(pin);
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

      // Fire update event
      this.fire("update", {pin: pin, value: wireValues[pin]});

      // Execute function in a try block
      try {

        // Call function on wire values hash
        this._functions[pin].call(wireValues);
        delete this._lastError;
        this.fire("success");
      }
      catch (e){

        this._lastError = e;
        this.fire("error", e);
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
        pin = this._updateQueue.next(); // Get next updated pin from queue

      // Restart loop
    }
  };
  P.pins = function(){

    return new WireConstraintPinIterator(this);
  };
  return WireConstraint;
}(this.hasOwnProperty, this.Queue, host.Error, this.extendClass, this.EventEmitter));

