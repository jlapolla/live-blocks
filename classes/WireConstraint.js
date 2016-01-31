this.WireConstraint = (function(hasOwnProperty, Queue){
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

    return new WireConstraint({functions: this._functions});
  };
  P.connect = function(prop, wire){

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

      // Run function associated with updated property
      if (hasOwnProperty(this._functions, prop)){

        // Construct hash of wires and wire values
        var wires = {}, wireValues = {};
        for (var name in this._wires){

          wires[name] = this._wires[name];
          wireValues[name] = wires[name].value();
        }

        // Call function on wire values hash
        this._functions[prop].call(wireValues);

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
  return WireConstraint;
}(this.hasOwnProperty, this.Queue));

