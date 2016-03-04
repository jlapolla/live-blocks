this.ManualTimer = (function(Set) {

  function ManualTimer() {

    this._set = new Set();
  };

  ManualTimer.prototype = {};
  var P = ManualTimer.prototype;
  P.duplicate = function() {

    return new ManualTimer();
  };

  P.tickTock = function() {

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
  };

  P.schedule = function(block) {

    this._set.add(block);
  };

  return ManualTimer;
}(this.Set));

