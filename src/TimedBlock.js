this.TimedBlock = (function(EventEmitter,
  extendClass,
  hasOwnProperty,
  Error,
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

  function TimedBlock(hash) {

    EventEmitter.call(this);

    this._pins = {};
    this._wires = {};
    this._do = hash.do;
    this._previousValues = {};

    // Record pins
    for (var i = 0; i < hash.pins.length; i++) {

      this._pins[hash.pins[i]] = this._pins;
    }
  }

  extendClass(EventEmitter, TimedBlock);
  var P = TimedBlock.prototype;
  P.duplicate = function() {

    var pinsArray = [];
    for (var name in this._pins) {

      pinsArray.push(name);
    }

    return new TimedBlock({
      do: this._do,
      pins: pinsArray,
    });
  };

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

  P.update = function() {

    this._timer.schedule(this);
  };

  P.pins = function() {

    // Create array of pins
    var pins = [];
    for (var pin in this._pins) {

      pins.push({pin: pin, wire: this._wires[pin]});
    }

    return new ArrayIterator(pins);
  };

  P.timer = function(timer) {

    if (!arguments.length) {

      return this._timer; // We are getting the timer
    }
    else {

      // We are setting a new timer

      // Do nothing if we are already using this timer
      if (this._timer === timer) {

        return;
      }

      // Unset old timer if any
      this.unsetTimer();

      // Record new timer
      this._timer = timer;
    }
  };

  P.unsetTimer = function() {

    delete this._timer;
  };

  P.tick = function() {

    // Indicates change since previous values
    var change;

    // Construct hash of wire values and scan for changes
    var input = {};
    for (var name in this._wires) {

      var value = this._wires[name].value();

      // Check for change
      if (hasOwnProperty(this._previousValues, name)
        && this._wires[name].equalTo(this._previousValues[name])) {

        // No change detected

        // Get the value directly from the previous values
        input[name] = this._previousValues[name];
      }
      else {

        // A new wire was connected or a wire value changed
        change = true;

        // Get value directly from the wire
        input[name] = value;
      }
    }

    // Check previous values for changes
    if (!(change || this._tickRequested)) {

      for (var name in this._previousValues) {

        if (!hasOwnProperty(input, name)) {

          // A wire was disconnected since we last ran
          change = true;
        }
      }
    }

    // Run tick event if change or tick was explicitly requested
    if (change || this._tickRequested || this._lastError) {

      // Fire tick event
      this.fire('tick');

      // Clear tick requested flag
      delete this._tickRequested;

      // Execute do function in a try block
      try {

        // Call do function on input, output, and previous values
        var fn = this._do;
        var output = {};
        this._tickRequested = !!fn(input, output, this._previousValues);
        delete this._lastError;
        this._nextValues = output;

        // N.b. input is probably untouched, so we need to overlay the output
        // on input to arrive at our new previous values.

        // input may have been changed if it contains mutable objects. But if
        // the "do" function changes input or previous, then there's nothing
        // we can do to stop that. If it changes a mutable object in input or
        // previous, it may have changed the mutable object held by the wire
        // itself, without the wire's knowledge. There is nothing we can do
        // about this. It's up to the circuit designer to ensure that nothing
        // in input or previuos is changed. This is part of the contract of the
        // "do" function.

        // Record previous values
        for (var name in output) {

          input[name] = output[name];
        }

        this._previousValues = input;

        // Schedule new tick if tick requested
        if (this._tickRequested) {

          this._timer.schedule(this);
        }
        else {

          // No need to keep the property around if it's falsey
          delete this._tickRequested;
        }
      }
      catch (e) {

        this._lastError = e;
        this.fire('error', e);
      }
    }
  };

  P.tock = function() {

    if (this._nextValues) {

      // Fire tock event
      this.fire('tock');

      // Defensive copy hash of wires
      var wires = {};
      for (var name in this._wires) {

        wires[name] = this._wires[name];
      }

      // Send new wire values to wires
      for (var name in this._nextValues) {

        if (hasOwnProperty(wires, name)) {

          wires[name].value(this._nextValues[name]);
        }
      }

      // Clear this._nextValues
      delete this._nextValues;
    }
  };

  return TimedBlock;
}(this.EventEmitter,
  this.extendClass,
  this.hasOwnProperty,
  host.Error,
  this.ArrayIterator));

