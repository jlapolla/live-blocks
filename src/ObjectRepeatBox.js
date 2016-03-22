this.ObjectRepeatBox = (function(EventEmitter,
  extendClass,
  Queue,
  isObject,
  BlackBox,
  getUndefined,
  hasOwnProperty,
  ArrayIterator) {

  var internalErrorListener = function(arg) {

    if (!this._updating) {

      this.fire('error', arg);
    }
  };

  var internalUpdateListener = function() {

    if (!this._updating) {

      // Defensive copy external wires
      var externalWires = {};
      for (var pin in this._pinNames) {

        // Copy external wire, if exists
        if (hasOwnProperty(this._externalWires, pin)) {

          externalWires[pin] = this._externalWires[pin];
        }
      }

      // Handle successful run
      if (!this.error()) {

        // Copy values from internal wires to external wires
        for (var pin in this._pinNames) {

          if (hasOwnProperty(externalWires, pin)) {

            var obj = {};
            for (var name in this._internalWires) {

              obj[name] = this._internalWires[name][pin].value();
            }

            externalWires[pin].value(obj);
          }
        }
      }
    }
  };

  var disconnect = function(pin) {

    // Disconnect from wire, if any
    if (hasOwnProperty(this._externalWires, pin)) {

      var wire = this._externalWires[pin];
      wire.unbind(this, pin);
      delete this._externalWires[pin];

      // Fire disconnect event
      this.fire('disconnect', {pin: pin, wire: wire});
    }
  };

  var init = function() {

    // Collect valid pin names in a hash
    this._pinNames = {};
    var pins = this._factory();
    for (var pin in pins) {

      this._pinNames[pin] = this._pinNames;
    }

    // Create internal update listener
    this._internalUpdateListener = internalUpdateListener.bind(this);

    // Create internal error listener
    this._internalErrorListener = internalErrorListener.bind(this);
  };

  function ObjectRepeatBox(hash) {

    EventEmitter.call(this);

    this._factory = hash.factory;
    this._externalWires = {};
    this._internalWires = {};
    this._internalBlocks = {};
    this._updateQueue = new Queue();

    init.call(this);
  };

  var maxIterations = 100;
  ObjectRepeatBox.maxIterations = function(iterations) {

    if (arguments.length) {

      // We are setting max iterations
      maxIterations = iterations;
    }
    else {

      // We are getting max iterations
      return maxIterations;
    }
  };

  extendClass(EventEmitter, ObjectRepeatBox);
  var P = ObjectRepeatBox.prototype;
  P.error = function() {

    if (hasOwnProperty(this, '_lastError')) {

      return this._lastError;
    }
    else {

      // Iterate through blocks and check for errors
      for (var name in this._internalBlocks) {

        // Check block for error
        if (this._internalBlocks[name].error()) {

          return this._internalBlocks[name].error();
        }
      }
    }
  };

  P.connect = function(pin, wire) {

    // Throw error if pin does not exist
    if (!hasOwnProperty(this._pinNames, pin)) {

      throw new Error('Pin "' + pin + '" not found');
    }

    // Do nothing if the pin is already connected to the wire
    if (this._externalWires[pin] !== wire) {

      // Disconnect from old wire, if any
      disconnect.call(this, pin);

      // Record new wire
      this._externalWires[pin] = wire;

      // Bind pin to wire
      wire.bind(this, pin);

      // Fire connect event
      this.fire('connect', {pin: pin, wire: wire});

      // Process wire value
      this.update(pin);
    }
  };

  P.disconnect = function(pin) {

    // Disconnect from wire, if any
    if (hasOwnProperty(this._externalWires, pin)) {

      var wire = this._externalWires[pin];
      wire.unbind(this, pin);
      delete this._externalWires[pin];

      // Process wire value
      this.update(pin);

      // Fire disconnect event
      this.fire('disconnect', {pin: pin, wire: wire});
    }
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

        // Defensive copy external wires
        var externalWires = {};
        for (var name in this._pinNames) {

          // Copy external wire, if exists
          if (hasOwnProperty(this._externalWires, name)) {

            externalWires[name] = this._externalWires[name];
          }
        }

        // Get updated pin value
        var value;
        if (hasOwnProperty(externalWires, pin)) {

          value = externalWires[pin].value();
        }
        else {

          value = getUndefined();
        }

        // Fire update event
        this.fire('update', {pin: pin, value: value});

        // Fire error if value is not an object
        if (isObject(value)) {

          // Clear last error
          delete this._lastError;

          // Copy each property of new pin value to an internal wire
          var newInternalWires = {};
          var newInternalBlocks = {};
          for (var name in value) {

            // Add properties to newInternalWires and newInternalBlocks
            if (hasOwnProperty(this._internalBlocks, name)) {

              // Recycle existing block
              newInternalWires[name] = this._internalWires[name];
              newInternalBlocks[name] = this._internalBlocks[name];
            }
            else {

              // Create new circuit
              var pins = this._factory();

              // Add _internalUpdateListener to newly created pins
              for (var pinName in pins) {

                pins[pinName].on('value', this._internalUpdateListener);
              }

              // Create block
              var block = new BlackBox({pins: pins});

              // Add _internalErrorListener to newly created block
              block.on('error', this._internalErrorListener);

              // Add new wires and block
              newInternalWires[name] = pins;
              newInternalBlocks[name] = block;
            }

            // Copy value to appropriate internal wire
            newInternalWires[name][pin].value(value[name]);
          }

          // Delete extra blocks and wires
          for (var name in this._internalBlocks) {

            if (!hasOwnProperty(value, name)) {

              var pins = this._internalWires[name];
              var block = this._internalBlocks[name];

              // Remove _internalErrorListener from block
              block.off('error', this._internalErrorListener);

              for (var pinName in pins) {

                // Remove _internalUpdateListener from pins
                pins[pinName].off('value', this._internalUpdateListener);

                // Disconnect wires from block
                block.disconnect(pinName);
              }
            }
          }

          this._internalWires = newInternalWires;
          this._internalBlocks = newInternalBlocks;

          // Handle successful run
          if (!this.error()) {

            // Copy values from internal wires to external wires
            for (var pinName in this._pinNames) {

              if (hasOwnProperty(externalWires, pinName)) {

                var obj = {};
                for (var name in newInternalWires) {

                  obj[name] = newInternalWires[name][pinName].value();
                }

                externalWires[pinName].value(obj);
              }
            }

            // Fire event
            this.fire('success');
          }
          else {

            this.fire('error', this.error()); // Fire event
          }
        }
        else {

          this._lastError = new Error('Pin ' + pin + ' must be an object');
          this.fire('error', this.error()); // Fire event
        }

        // Process update queue
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
  }

  P.pins = function() {

    // Collect pins in an array
    var arr = [];
    for (var pin in this._pinNames) {

      arr.push({pin: pin, wire: this._externalWires[pin]});
    }

    // Return array iterator
    return new ArrayIterator(arr);
  };

  P.blocks = function() {

    // Collect blocks into an array
    var arr = [];
    for (var name in this._internalBlocks) {

      arr.push(this._internalBlocks[name]);
    }

    // Return array iterator
    return new ArrayIterator(arr);
  };

  P.block = function(prop) {

    // Return block
    return this._internalBlocks[prop];
  };

  return ObjectRepeatBox;
}(this.EventEmitter,
  this.extendClass,
  this.Queue,
  this.isObject,
  this.BlackBox,
  this.getUndefined,
  this.hasOwnProperty,
  this.ArrayIterator));

