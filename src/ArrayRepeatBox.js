this.ArrayRepeatBox = (function(EventEmitter,
  extendClass,
  Queue,
  isArray,
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

            var arr = [];
            for (var i = 0; i < this._internalWires.length; i++) {

              arr.push(this._internalWires[i][pin].value());
            }

            externalWires[pin].value(arr);
          }
        }

        // Fire event
        this.fire('success');
      }
      else {

        this.fire('error', this.error()); // Fire event
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

  function ArrayRepeatBox(hash) {

    EventEmitter.call(this);

    this._factory = hash.factory;
    this._externalWires = {};
    this._internalWires = [];
    this._internalBlocks = [];
    this._updateQueue = new Queue();

    init.call(this);
  };

  var maxIterations = 100;
  ArrayRepeatBox.maxIterations = function(iterations) {

    if (arguments.length) {

      // We are setting max iterations
      maxIterations = iterations;
    }
    else {

      // We are getting max iterations
      return maxIterations;
    }
  };

  extendClass(EventEmitter, ArrayRepeatBox);
  var P = ArrayRepeatBox.prototype;
  P.error = function() {

    if (hasOwnProperty(this, '_lastError')) {

      return this._lastError;
    }
    else {

      // Iterate through blocks and check for errors
      for (var i = 0; i < this._internalBlocks.length; i++) {

        // Check block for error
        if (this._internalBlocks[i].error()) {

          return this._internalBlocks[i].error();
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
        if (externalWires[pin]) {

          value = externalWires[pin].value();
        }
        else {

          value = getUndefined();
        }

        // Fire update event
        this.fire('update', {pin: pin, value: value});

        // Fire error if value is not an array
        if (isArray(value)) {

          // Clear last error
          delete this._lastError;

          // Copy each element of new pin value to an internal wire
          var i = 0;
          var newInternalWires = [];
          var newInternalBlocks = [];
          for (; i < value.length; i++) {

            // Add elements to newInternalWires and newInternalBlocks
            if (i < this._internalBlocks.length) {

              // Recycle existing block
              newInternalWires.push(this._internalWires[i]);
              newInternalBlocks.push(this._internalBlocks[i]);
            }
            else {

              // Create new circuit
              var pins = this._factory();

              // Add _internalUpdateListener to newly created pins
              for (var name in pins) {

                pins[name].on('value', this._internalUpdateListener);
              }

              // Create block
              var block = new BlackBox({pins: pins});

              // Add _internalErrorListener to newly created block
              block.on('error', this._internalErrorListener);

              // Add new wires and block
              newInternalWires.push(pins);
              newInternalBlocks.push(block);
            }

            // Copy value to appropriate internal wire
            newInternalWires[i][pin].value(value[i]);
          }

          // Delete extra blocks and wires
          for (; i < this._internalBlocks.length; i++) {

            var pins = this._internalWires[i];
            var block = this._internalBlocks[i];

            for (var name in pins) {

              // Remove _internalUpdateListener from pins
              pins[name].off('value', this._internalUpdateListener);

              // Remove _internalErrorListener from block
              block.off('error', this._internalErrorListener);

              // Disconnect wires from block
              block.disconnect(name);
            }
          }

          this._internalWires = newInternalWires;
          this._internalBlocks = newInternalBlocks;

          // Handle successful run
          if (!this.error()) {

            // Copy values from internal wires to external wires
            for (var name in this._pinNames) {

              if (hasOwnProperty(externalWires, name)) {

                var arr = [];
                for (var i = 0; i < newInternalWires.length; i++) {

                  arr.push(newInternalWires[i][name].value());
                }

                externalWires[name].value(arr);
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

          this._lastError = new Error('Pin ' + pin + ' must be an array');
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

    // Return array iterator
    return new ArrayIterator(this._internalBlocks);
  };

  P.block = function(index) {

    // Return block
    return this._internalBlocks[index];
  };

  return ArrayRepeatBox;
}(this.EventEmitter,
  this.extendClass,
  this.Queue,
  this.isArray,
  this.BlackBox,
  this.getUndefined,
  this.hasOwnProperty,
  this.ArrayIterator));

