'use strict';

describe('Map class', function() {
  var LiveBlocks = window.LiveBlocks;

  // Skip test if Map is not exposed
  if (!LiveBlocks.Map) {
    return;
  }

  it('works with any kind of key', function() {
    // Make a map
    var map = new LiveBlocks.Map();

    // Make NaN
    var nan = 1 / (function() {}());

    expect(nan === nan).toBe(false); // Make sure we have an actual NaN value

    // Make some keys
    var keys = {
      a: nan,
      b: {},
      c: function() {},

      d: 'x',
      e: undefined,
      f: null,
    };

    // Make some values
    var values = {
      a: {},
      b: {},
      c: {},
      d: {},
      e: {},
      f: {},
    };

    // Put values in the map
    for (var name in keys) {
      map.put(keys[name], values[name]);
    }

    // Positive tests for key existence
    for (var name in keys) {
      expect(map.has(keys[name])).toBe(true);
    }

    // Negative tests for key existence
    expect(map.has({})).toBe(false);
    expect(map.has(function() {})).toBe(false);

    // Retrieve values
    for (var name in keys) {
      expect(map.get(keys[name])).toBe(values[name]);
    }

    // Retrieve value from non-existent key
    expect(map.get({})).toBeUndefined();

    // Remove some keys
    var removedKeys = {
      a: keys.a,
      b: keys.b,
    };
    var removedValues = {
      a: values.a,
      b: values.b,
    };
    delete keys.a;
    delete keys.b;
    delete values.a;
    delete values.b;
    for (var name in removedKeys) {
      map.remove(removedKeys[name]);
    }

    // Positive test for remaining keys
    for (var name in keys) {
      expect(map.has(keys[name])).toBe(true);
      expect(map.get(keys[name])).toBe(values[name]);
    }

    // Negative test for removed keys
    for (var name in removedKeys) {
      expect(map.has(removedKeys[name])).toBe(false);
      expect(map.get(removedKeys[name])).toBeUndefined();
    }
  });

  it('does not record duplicate keys', function() {
    // Make a map
    var map = new LiveBlocks.Map();

    // Add some values
    map.put('a', 1);
    map.put('b', 2);
    map.put('c', 3);
    expect(map.get('b')).toBe(2);

    // Add value at duplicate key
    map.put('b', 4);
    expect(map.get('b')).toBe(4);
    expect(map._array.length).toBe(3);
  });

  it('keys() function returns an iterator over Map keys', function() {
    // Make a map
    var map = new LiveBlocks.Map();

    // Make some keys
    var keys = {
      a: {},
      b: {},
      c: {},
    };

    // Make some values
    var values = {
      a: {},
      b: {},
      c: {},
    };

    // Put keys and values in the map
    for (var name in keys) {
      map.put(keys[name], values[name]);
    }

    // Get keys iterator
    var it = map.keys();

    // Add some other mapping to the map (shouldn't be reflected in our iterator)
    map.put({}, {});

    // Run through iterator
    expect(it.peek().value).toBe(keys.a);
    expect(it.next().value).toBe(keys.a);
    expect(it.peek().value).toBe(keys.b);
    expect(it.next().value).toBe(keys.b);
    expect(it.peek().value).toBe(keys.c);
    expect(it.next().value).toBe(keys.c);
    expect(it.peek().done).toBe(true);
    expect(it.next().done).toBe(true);

    // Reset the iterator
    it.reset();

    // Run through iterator
    expect(it.peek().value).toBe(keys.a);
    expect(it.next().value).toBe(keys.a);
    expect(it.peek().value).toBe(keys.b);
    expect(it.next().value).toBe(keys.b);
    expect(it.peek().value).toBe(keys.c);
    expect(it.next().value).toBe(keys.c);
    expect(it.peek().done).toBe(true);
    expect(it.next().done).toBe(true);
  });
});

