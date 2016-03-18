this.ImmediateBlock = (function(hasOwnProperty,
  Queue,
  Error,
  extendClass,
  EventEmitter,
  ArrayIterator) {

  var _disconnect = function(pin) {

    // Disconnect from wire, if any
    if (hasOwnProperty(this._wires, pin)) {

      var wire = this._wires[pin];
      wire.unbind(this, pin);
      delete this._wires[pin];

      // Fire disconnect event
      this.fire('disconnect', {pin: pin, wire: wire});
    }
  };

  function ImmediateBlock(hash) {

    EventEmitter.call(this);

    this._pins = {};
    this._wires = {};
    this._updating = false;
    this._updateQueue = new Queue();

    for (var name in hash.pins) {

      this._pins[name] = hash.pins[name];
    }
  }

  var maxIterations = 100;
  ImmediateBlock.maxIterations = function(iterations) {

    if (arguments.length) {

      // We are setting max iterations
      maxIterations = iterations;
    }
    else {

      // We are getting max iterations
      return maxIterations;
    }
  };

  extendClass(EventEmitter, ImmediateBlock);
  var P = ImmediateBlock.prototype;
  P.error = function() {

    return this._lastError;
  };

  P.connect = function(pin, wire) {

    // Throw error if pin does not exist
    if (!hasOwnProperty(this._pins, pin)) {

      throw new Error('Pin "' + pin + '" not found');
    }

    // Do nothing if the pin is already connected to the wire
    if (this._wires[pin] === wire) {

      return;
    }

    // Disconnect from old wire, if any
    _disconnect.call(this, pin);

    // Record new wire
    this._wires[pin] = wire;

    // Bind pin to wire
    wire.bind(this, pin);

    // Fire connect event
    this.fire('connect', {pin: pin, wire: wire});

    // Process wire value
    this.update(pin);
  };

  P.disconnect = function(pin) {

    // Disconnect from wire, if any
    _disconnect.call(this, pin);

    // Process wire value
    this.update(pin);
  };

  P.update = function(pin) {

    try {

      // A connected wire value changed

      // Check updating flag
      if (this._updating) {

        // Add update to queue and return
        this._updateQueue.push(pin);
        return;
      }
      else {

        this._updating = true; // Set updating flag
      }

      // Main loop
      var iterations = 1;
      while (true) {

        // Check iteration count
        if (iterations++ > maxIterations) {

          throw new Error('Infinite loop detected: reached '
            + maxIterations + ' iterations');
        }

        // Construct hash of wires and wire values
        var wires = {};
        var wireValues = {};
        for (var name in this._wires) {

          wires[name] = this._wires[name];
          wireValues[name] = wires[name].value();
        }

        // Fire update event
        this.fire('update', {pin: pin, value: wireValues[pin]});

        // Execute pin function in a try block
        try {

          // Call pin function on wireValues and outputs hash
          var outputs = {};
          var fn = this._pins[pin];
          fn(wireValues, outputs);
          delete this._lastError;
          this.fire('success');

          // Send new wire values to wires
          for (var name in wires) {

            if (hasOwnProperty(outputs, name)) {

              wires[name].value(outputs[name]);
            }
          }
        }
        catch (e) {

          this._lastError = e;
          this.fire('error', e);
        }

        // Proces update queue
        if (this._updateQueue.isEmpty()) {

          // Unset updating flag and return
          this._updating = false;
          return;
        }
        else {

          pin = this._updateQueue.next(); // Get next updated pin from queue
        }

        // Restart loop
      }
    }
    catch (err) {

      // Unset updating flag
      this._updating = false;
      throw err;
    }
  };

  P.pins = function() {

    // Create array of pins
    var pins = [];
    for (var pin in this._pins) {

      pins.push({pin: pin, wire: this._wires[pin]});
    }

    return new ArrayIterator(pins);
  };

  return ImmediateBlock;
}(this.hasOwnProperty,
  this.Queue,
  host.Error,
  this.extendClass,
  this.EventEmitter,
  this.ArrayIterator));

