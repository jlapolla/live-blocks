this.Set = (function(ArrayIterator) {
  var same = function(a, b) {
    return a !== a ? b !== b : a === b;
  };

  function Set() {
    this._array = [];
  }

  Set.prototype = {};
  var P = Set.prototype;
  P.add = function(value) {
    // Copy entries to new array, except entry with same value
    var array = this._array;
    var newArray = [];
    for (var i = 0; i < array.length; i++) {
      if (!same(array[i], value)) {
        newArray.push(array[i]);
      }
    }

    // Add new entry to new array
    newArray.push(value);

    // Set private array to new array
    this._array = newArray;
  };

  P.remove = function(value) {
    // Copy entries to new array, except entry with same value
    var array = this._array;
    var newArray = [];
    for (var i = 0; i < array.length; i++) {
      if (!same(array[i], value)) {
        newArray.push(array[i]);
      }
    }

    // Set private array to new array
    this._array = newArray;
  };

  P.has = function(value) {
    // Search for same value
    var array = this._array;
    for (var i = 0; i < array.length; i++) {
      if (same(array[i], value)) {
        return true;
      }
    }

    // Match not found
    return false;
  };

  P.values = function() {
    return new ArrayIterator(this._array);
  };

  return Set;
}(this.ArrayIterator));

