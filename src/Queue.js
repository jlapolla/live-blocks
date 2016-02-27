this.Queue = (function(getUndefined) {

  function Queue() {

    this._queueTip = getUndefined();
    this._queueCurrent = getUndefined();
  }

  Queue.prototype = {};
  var P = Queue.prototype;
  P.push = function(item) {

    // Push item onto queue
    var next = {item: item};
    if (this._queueCurrent) {

      // Update tip if something is in the queue
      this._queueTip.next = next;
      this._queueTip = next;
      return;
    }
    else {

      // Create items if nothing is in the queue
      this._queueCurrent = next;
      this._queueTip = next;
      return;
    }
  };

  P.next = function() {

    if (this._queueCurrent) {

      // Get current item
      var item = this._queueCurrent.item;

      if (this._queueCurrent === this._queueTip) {

        // We reached the end of the queue
        this._queueCurrent = getUndefined();
        this._queueTip = getUndefined();
      }
      else {

        this._queueCurrent = this._queueCurrent.next; // Increment queue pointer
      }

      // Return item
      return item;
    }
    else {

      return; // Return undefined
    }
  };

  P.peek = function() {

    // Get next item without incrementing
    if (this._queueCurrent) {

      return this._queueCurrent.item; // We are not at the end of the queue
    }
    else {

      return; // We are at the end of the queue
    }
  };

  P.isEmpty = function() {

    return !this._queueCurrent;
  };

  return Queue;
}(this.getUndefined));

