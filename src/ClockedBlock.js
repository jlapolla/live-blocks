this.ClockedBlock = (function(EventEmitter,
  extendClass,
  hasOwnProperty,
  getUndefined,
  ArrayIterator) {

  function ClockedBlock(hash) {

    EventEmitter.call(this);

    this._pins = {};
    this._wires = {};
    this._do = hash.do;

    // Record pins
    for (var i = 0; i < hash.pins.length; i++) {

      this._pins[hash.pins[i]] = this._pins;
    }
  }

  extendClass(EventEmitter, ClockedBlock);
  var P = ClockedBlock.prototype;
  P.duplicate = function() {

    var pinsArray = [];
    for (var name in this._pins) {

      pinsArray.push(name);
    }

    return new ClockedBlock({
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
    this.disconnect(pin);

    // Record new wire
    this._wires[pin] = wire;

    // Bind pin to wire
    wire.bind(this, pin);

    // Fire connect event
    this.fire('connect', {pin: pin, wire: wire});
  };

  P.disconnect = function(pin) {

    // Disconnect from wire, if any
    if (hasOwnProperty(this._wires, pin)) {

      var wire = this._wires[pin];
      wire.unbind(this, pin);
      delete this._wires[pin];

      // Fire disconnect event
      this.fire('disconnect', {pin: pin, wire: wire});
    }
  };

  P.update = getUndefined; // noop

  P.pins = function() {

    // Create array of pins
    var pins = [];
    for (var pin in this._pins) {

      pins.push({pin: pin, wire: this._wires[pin]});
    }

    return new ArrayIterator(pins);
  };

  P.clock = function(clock) {

    if (arguments.length) {

      // We are setting a new clock

      // Do nothing if we are already using this clock
      if (this._clock === clock) {

        return;
      }

      // Unset old clock if any
      this.unsetClock();

      // Record new clock
      this._clock = clock;

      // Bind to clock
      clock.bind(this);
    }
    else {

      return this._clock; // We are getting the clock
    }
  };

  P.unsetClock = function() {

    // Unbind from old clock if any
    if (hasOwnProperty(this, '_clock')) {

      var clock = this._clock;
      clock.unbind(this);
      delete this._clock;
    }
  };

  P.tick = function() {

    // Construct hash of wire values
    var wireValues = {};
    for (var name in this._wires) {

      wireValues[name] = this._wires[name].value();
    }

    // Fire tick event
    this.fire('tick');

    // Execute do function in a try block
    try {

      // Call do function on wire values and outputs hash
      var fn = this._do;
      var outputs = {};
      fn(wireValues, outputs);
      delete this._lastError;
      this._nextValues = outputs;
    }
    catch (e) {

      this._lastError = e;
      this.fire('error', e);
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

  return ClockedBlock;
}(this.EventEmitter,
  this.extendClass,
  this.hasOwnProperty,
  this.getUndefined,
  this.ArrayIterator));

