this.Wire = (function(getUndefined,
  hasOwnProperty,
  Queue,
  Error,
  EventEmitter,
  extendClass,
  ArrayIterator) {

  var _notify = function() {

    // Get bindings list
    var bindings = this._bindings;

    // Update each bound block
    for (var i = 0; i < bindings.length; i++) {

      bindings[i].block.update(bindings[i].pin);
    }
  };

  function Wire() {

    EventEmitter.call(this);

    this._bindings = [];
    this._updating = false;
    this._valueQueue = new Queue();
  }

  var maxIterations = 100;
  Wire.maxIterations = function(iterations) {

    if (arguments.length) {

      // We are setting max iterations
      maxIterations = iterations;
    }
    else {

      // We are getting max iterations
      return maxIterations;
    }
  };

  extendClass(EventEmitter, Wire);
  var P = Wire.prototype;
  P.equalTo = function(value) {

    // Compare with ===, but let NaN === NaN be true
    if (value !== value) {

      return this._value !== this._value;
    }
    else {

      return value === this._value;
    }
  };

  P.bind = function(block, pin) {

    // Get bindings list
    var bindings = this._bindings;

    // Iterate over bindings and copy to new bindings
    var newBindings = [];
    var bindingExists;
    for (var i = 0; i < bindings.length; i++) {

      newBindings.push(bindings[i]);
      if (bindings[i].block === block && bindings[i].pin === pin) {

        bindingExists = true;
      }
    }

    // Add new binding if not exists
    if (!bindingExists) {

      // Add binding
      newBindings.push({block: block, pin: pin});
    }

    // Replace existing bindings
    this._bindings = newBindings;

    if (!bindingExists) {

      // Fire event
      this.fire('connect', {block: block, pin: pin});
    }
  };

  P.unbind = function(block, pin) {

    // Get bindings list
    var bindings = this._bindings;

    // Iterate over bindings and copy to new bindings
    var newBindings = [];
    for (var i = 0; i < bindings.length; i++) {

      if (bindings[i].block !== block || bindings[i].pin !== pin) {

        newBindings.push(bindings[i]);
      }
    }

    // Replace existing bindings
    this._bindings = newBindings;

    if (bindings.length !== newBindings.length) {

      // Fire event
      this.fire('disconnect', {block: block, pin: pin});
    }
  };

  P.value = function(newValue) {

    try {

      if (arguments.length) {

        // We are setting a new value

        // Check updating flag
        if (this._updating) {

          // Add new value to queue and return

          // Don't add the same value to the queue
          if (!this.equalTo(newValue)) {

            this._valueQueue.push(newValue);
          }

          // Return
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

          // Compare new value to current value
          if (!this.equalTo(newValue)) {

            // Set new value
            this._value = newValue;

            // Notify bound blocks
            _notify.call(this);

            // Fire event
            this.fire('value', newValue);
          }

          // Process value queue
          if (this._valueQueue.isEmpty()) {

            // Unset updating flag and return
            this._updating = false;
            return;
          }
          else {

            newValue = this._valueQueue.next(); // Get next value from queue
          }

          // Restart loop
        }
      }
      else {

        return this._value; // We are getting the value
      }
    }
    catch (err) {

      // Unset updating flag
      this._updating = false;
      throw err;
    }
  };

  P.connections = function() {

    // Collect bindings in an array
    var arr = [];
    var bindings = this._bindings;
    for (var i = 0; i < bindings.length; i++) {

      arr.push({block: bindings[i].block, pin: bindings[i].pin});
    }

    return new ArrayIterator(arr);
  };

  return Wire;
}(this.getUndefined,
  this.hasOwnProperty,
  this.Queue,
  host.Error,
  this.EventEmitter,
  this.extendClass,
  this.ArrayIterator));

