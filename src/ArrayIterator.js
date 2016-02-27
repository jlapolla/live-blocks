this.ArrayIterator = (function() {
  function ArrayIterator(arr) {
    this._array = arr;
    this._index = 0;
  }

  ArrayIterator.prototype = {};
  var P = ArrayIterator.prototype;
  P.reset = function() {
    // Reset iterator index
    this._index = 0;
  };

  P.next = function() {
    // Check if we are at the end of the iterator
    if (this._index < this._array.length) {
      // Return current value and increment index
      return {done: false, value: this._array[this._index++]};
    }
    else {
      return {done: true};
    }
  };

  P.peek = function() {
    // Check if we are at the end of the iterator
    if (this._index < this._array.length) {
      return {done: false, value: this._array[this._index]}; // Return current value
    }
    else {
      return {done: true};
    }
  };

  return ArrayIterator;
}());

