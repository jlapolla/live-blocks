this.AsyncTimer = (function(Set,
  hasOwnProperty,
  setTimeout,
  clearTimeout,
  extendClass,
  EventEmitter) {

  var _tickTock = function() {

    // Remove old _timeoutId
    delete this._timeoutId;

    // Get iterator over scheduled items
    var it = this._set.values();

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
  };

  function AsyncTimer() {

    EventEmitter.call(this);

    this._set = new Set();
    this._tickTock = _tickTock.bind(this);
    this._enabled = true;
  }

  extendClass(EventEmitter, AsyncTimer);
  var P = AsyncTimer.prototype;
  P.schedule = function(block) {

    this._set.add(block);

    // Set timeout, if no timeout exists
    if (this._enabled && !hasOwnProperty(this, '_timeoutId')) {

      this._timeoutId = setTimeout(this._tickTock);
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

          this._timeoutId = setTimeout(this._tickTock);
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

  return AsyncTimer;
}(this.Set,
  this.hasOwnProperty,
  host.setTimeout,
  host.clearTimeout,
  this.extendClass,
  this.EventEmitter));

