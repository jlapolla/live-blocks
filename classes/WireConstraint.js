this.WireConstraint = (function(hasOwnProperty, Queue, Error, extendClass, EventEmitter){
  var WireConstraintPinIterator = (function(){
    var refresh = function(){

      // Create new pin names array
      var pins = [];
      for (var pin in this._wireConstraint._functions)
        pins.push({pin: pin, wire: this._wireConstraint._wires[pin]});

      // Set _pins to new pin names array
      this._pins = pins;
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
      if (this._index < this._pins.length){

        // Get pin name at current index
        var pin = this._pins[this._index];

        // Increment index and return pin name and connected wire
        this._index = this._index + 1;
        return {
          done: false,
          value: {pin: pin.pin, wire: pin.wire}
        };
      }
      else
        return {done: true};
    };
    P.peek = function(){

      // Check if we are at the last pin
      if (this._index < this._pins.length){

        // Get pin name at current index
        var pin = this._pins[this._index];

        // Return pin name at current index and connected wire
        return {
          done: false,
          value: {pin: pin.pin, wire: pin.wire}
        };
      }
      else
        return {done: true};
    };
    P.has = function(pin){

      // Search through pins
      for (var i = 0; i < this._pins.length; i++){

        if (this._pins[i].pin === pin)
          return true;
      }

      // Match not found
      return false;
    };
    return WireConstraintPinIterator;
  }());
  var _disconnect = function(pin){

    // Disconnect from wire, if any
    if (hasOwnProperty(this._wires, pin)){

      var wire = this._wires[pin];
      wire.unbind(this, pin);
      delete this._wires[pin];

      // Fire disconnect event
      this.fire("disconnect", {pin: pin, wire: wire});
    }
  };
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

    // Do nothing if the pin is already connectd to the wire
    if (this._wires[pin] === wire)
      return;

    // Disconnect from old wire, if any
    _disconnect.call(this, pin);

    // Record new wire
    this._wires[pin] = wire;

    // Bind pin to wire
    wire.bind(this, pin);

    // Fire connect event
    this.fire("connect", {pin: pin, wire: wire});

    // Process wire value
    this.update(pin);
  };
  P.disconnect = function(pin){

    // Disconnect from wire, if any
    _disconnect.call(this, pin);

    // Process wire value
    this.update(pin);
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

