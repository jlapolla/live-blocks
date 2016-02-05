this.BlackBox = (function(EventEmitter, extendClass, hasOwnProperty, Queue, getUndefined){
  var errorListener = function(e){

    if (!hasOwnProperty(this, "_lastError"))
      this._lastError = e;
  };
  var init = function(pins){

    var wires = [], blocks = [];
    for (var name in pins){

      // TODO Finish this function
    }
  };
  function BlackBox(hash){

    EventEmitter.call(this);

    this._updating = false;
    this._internalWires = {};
    this._externalWires = {};
    this._errorListener = errorListener.bind(this);

    if (typeof hash !== "undefined"){

      // Add pins if supplied
      if (hasOwnProperty(hash, "pins"))
        init.call(this, hash.pins);

      // Add queue if supplied
      if (hasOwnProperty(hash, "queue"))
        this._updateQueue = hash.queue;
    }

    // Set defaults
    if (!hasOwnProperty(this, "_updateQueue"))
      this._updateQueue = new Queue();
  }
  extendClass(EventEmitter, BlackBox);
  var P = BlackBox.prototype;
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

      // Defensive copy external wires
      // Internal wires should never change
      var internalWires = this._internalWires, externalWires = {};
      for (var name in internalWires){

        if (this._externalWires[name])
          externalWires[name] = this._externalWires[name];
      }

      // Get updated pin value
      var value;
      if(externalWires[pin])
        value = externalWires[pin].value();
      else
        value = getUndefined();

      // Fire update event
      this.fire("update", {pin: pin, value: value});

      // Clear last error, if any
      delete this._lastError;

      // Copy values from external wires to internal wires
      for (var name in internalWires){

        if (externalWires[name])
          internalWires[name].value(externalWires[name].value());
        else
          internalWires[name].value(getUndefined());
      }

      // Handle successful run
      if (!hasOwnProperty(this, "_lastError")){

        // Fire event
        this.fire("success");

        // Copy values from internal wires to external wires
        for (var name in internalWires){

          if (externalWires[name])
            externalWires[name].value(internalWires[name].value());
        }
      }
      else
        this.fire("error", this._lastError); // Fire event

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
  return BlackBox;
}(this.EventEmitter, this.extendClass, this.hasOwnProperty, this.Queue, this.getUndefined));

