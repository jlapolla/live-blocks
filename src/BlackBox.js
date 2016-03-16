this.BlackBox = (function(EventEmitter,
  extendClass,
  hasOwnProperty,
  Queue,
  getUndefined,
  Map,
  Set,
  Error,
  ArrayIterator) {

    var _internalErrorListener = function(arg) {

      if (!this._updating) {

        this.fire('error', arg);
      }
    };

    var _internalUpdateListener = function() {

      if (!this._updating) {

        // Defensive copy internal and external wires
        var internalWires = {};
        var externalWires = {};
        for (var name in this._internalWires) {

          // Copy internal wire
          internalWires[name] = this._internalWires[name];

          // Copy external wire, if exists
          if (this._externalWires[name]) {

            externalWires[name] = this._externalWires[name];
          }
        }

        // Handle successful run
        if (!this.error()) {

          // Copy values from internal wires to external wires
          for (var name in internalWires) {

            if (externalWires[name]) {

              externalWires[name].value(internalWires[name].value());
            }
          }
        }
        else {

          this.fire('error', this.error()); // Fire event
        }
      }
    };

  var _disconnect = function(pin) {

    // Disconnect from wire, if any
    if (hasOwnProperty(this._externalWires, pin)) {

      var wire = this._externalWires[pin];
      wire.unbind(this, pin);
      delete this._externalWires[pin];

      // Fire disconnect event
      this.fire('disconnect', {pin: pin, wire: wire});
    }
  };

  var init = (function() {

    var processWire;
    var processBlock;

    processWire = function(wire, wireSet, blockSet) {

      // Check if this wire has already been processed
      if (!wireSet.has(wire)) {

        // Wire has not been processed
        // Add wire to wire set
        wireSet.add(wire);

        // Process all blocks connected to the wire
        var it = wire.connections();
        while (!it.peek().done) {

          processBlock.call(this, it.next().value.block, wireSet, blockSet);
        }
      }
    };

    processBlock = function(block, wireSet, blockSet) {

      // Check if this block has already been processed
      if (!blockSet.has(block)) {

        // Block has not been processed
        // Add block to block set
        blockSet.add(block);

        // Attach internal error listener
        block.on('error', this._internalErrorListener);

        // Process all wires connected to the block
        var it = block.pins();
        while (!it.peek().done) {

          processWire.call(this, it.next().value.wire, wireSet, blockSet);
        }
      }
    };

    return function(pins) {

      // Create internal update listener
      this._internalUpdateListener = _internalUpdateListener.bind(this);

      // Create internal error listener
      this._internalErrorListener = _internalErrorListener.bind(this);

      // Create wire set and block set
      // These collect all wires and blocks in the network
      var wireSet = new Set();
      var blockSet = new Set();

      // Process pins hash
      for (var pin in pins) {

        // Add pin to internal wire hash
        this._internalWires[pin] = pins[pin];

        // Listen for value changes on the internal wire
        pins[pin].on('value', this._internalUpdateListener);

        // Process the wire and all connected blocks
        processWire.call(this, pins[pin], wireSet, blockSet);
      }

      // All blocks are in the block set now
      // Store the block set
      this._innerBlockSet = blockSet;
    };
  }());

  function BlackBox(hash) {

    EventEmitter.call(this);

    this._updating = false;
    this._internalWires = {};
    this._externalWires = {};
    this._updateQueue = new Queue();

    init.call(this, hash.pins);
  }

  var maxIterations = 1000;
  BlackBox.maxIterations = function(iterations) {

    if (arguments.length) {

      // We are setting max iterations
      maxIterations = iterations;
    }
    else {

      // We are getting max iterations
      return maxIterations;
    }
  };

  extendClass(EventEmitter, BlackBox);
  var P = BlackBox.prototype;
  P.error = function() {

    // Iterate through blocks and check for errors
    var it = this._innerBlockSet.values();
    while (!it.peek().done) {

      // Get the block
      var block = it.peek().value;

      // Check block for error
      if (block.error()) {

        return block.error();
      }

      // Move to next block
      it.next();
    }
  };

  P.connect = function(pin, wire) {

    // Throw error if pin does not exist
    if (!hasOwnProperty(this._internalWires, pin)) {

      throw new Error('Pin "' + pin + '" not found');
    }

    // Do nothing if the pin is already connected to the wire
    if (this._externalWires[pin] !== wire) {

      // Disconnect from old wire, if any
      _disconnect.call(this, pin);

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
    _disconnect.call(this, pin);

    // Process wire value
    this.update(pin);
  };

  P.update = function(pin) {

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

        this._updating = false;
        throw new Error('Infinite loop detected: reached '
          + maxIterations + ' iterations');
      }

      // Defensive copy internal and external wires
      var internalWires = {};
      var externalWires = {};
      for (var name in this._internalWires) {

        // Copy internal wire
        internalWires[name] = this._internalWires[name];

        // Copy external wire, if exists
        if (this._externalWires[name]) {

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

      // Copy updated pin value to internal wire
      if (externalWires[pin]) {

        internalWires[pin].value(externalWires[pin].value());
      }
      else {

        internalWires[pin].value(getUndefined());
      }

      // Handle successful run
      if (!this.error()) {

        // Fire event
        this.fire('success');

        // Copy values from internal wires to external wires
        for (var name in internalWires) {

          if (externalWires[name]) {

            externalWires[name].value(internalWires[name].value());
          }
        }
      }
      else {

        this.fire('error', this.error()); // Fire event
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
  };

  P.pins = function() {

    // Collect pins in an array
    var arr = [];
    for (var pin in this._internalWires) {

      arr.push({pin: pin, wire: this._externalWires[pin]});
    }

    // Return array iterator
    return new ArrayIterator(arr);
  };

  return BlackBox;
}(this.EventEmitter,
  this.extendClass,
  this.hasOwnProperty,
  this.Queue,
  this.getUndefined,
  this.Map,
  this.Set,
  host.Error,
  this.ArrayIterator));

