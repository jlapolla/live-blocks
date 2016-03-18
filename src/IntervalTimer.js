this.IntervalTimer = (function(Set,
  hasOwnProperty,
  setTimeout,
  clearTimeout,
  extendClass,
  EventEmitter) {

  var _tick = function() {

    // Get iterator over scheduled items
    var it = this._set.values();

    if (it.peek().done) {

      // There are no blocks scheduled

      // Remove old _timeoutId
      delete this._timeoutId;
    }
    else {

      // There are blocks scheduled

      // Start a new timeout
      this._timeoutId = setTimeout(this._tick, this._interval);

      // Get a new set
      this._set = new Set();

      // Call tick() on all blocks
      while (!it.peek().done) {

        it.next().value.tick();
      }

      // Call tock() on all blocks
      it.reset();
      while (!it.peek().done) {

        it.next().value.tock();
      }

      // Fire event
      this.fire('tick');
    }
  };

  function IntervalTimer() {

    EventEmitter.call(this);

    this._set = new Set();
    this._tick = _tick.bind(this);
    this._enabled = true;
    this._interval = 40;
  }

  extendClass(EventEmitter, IntervalTimer);
  var P = IntervalTimer.prototype;
  P.schedule = function(block) {

    this._set.add(block);

    // Set timeout, if no timeout exists
    if (this._enabled && !hasOwnProperty(this, '_timeoutId')) {

      this._timeoutId = setTimeout(this._tick, this._interval);
    }
  };

  P.cancel = function(block) {

    if (arguments.length) {

      // We are cancelling a single block
      this._set.remove(block);
    }
    else {

      // We are cancelling all blocks
      this._set = new Set();
    }

    // Clear timeout if we have no scheduled blocks
    if (hasOwnProperty(this, '_timeoutId')
      && this._set.values().peek().done) {

      clearTimeout(this._timeoutId);
      delete this._timeoutId;
    }
  };

  P.enabled = function(newValue) {

    if (arguments.length) {

      // We are setting the value
      if (newValue) {

        // We are enabling the timer

        // Set enabled flag
        this._enabled = true;

        // Set timeout if no timeout exists and we have scheduled blocks
        if (!(hasOwnProperty(this, '_timeoutId')
          || this._set.values().peek().done)) {

          this._timeoutId = setTimeout(this._tick, this._interval);
        }
      }
      else {

        // We are disabling the timer

        // Reset enabled flag
        this._enabled = false;

        // Clear any existing timeout
        if (hasOwnProperty(this, '_timeoutId')) {

          clearTimeout(this._timeoutId);
          delete this._timeoutId;
        }
      }
    }
    else {

      // We are getting the value
      return this._enabled;
    }
  };

  P.interval = function(newValue) {

    if (arguments.length) {

      // We are setting the value
      this._interval = newValue;
    }
    else {

      // We are getting the value
      return this._interval;
    }
  };

  return IntervalTimer;
}(this.Set,
  this.hasOwnProperty,
  host.setTimeout,
  host.clearTimeout,
  this.extendClass,
  this.EventEmitter));

