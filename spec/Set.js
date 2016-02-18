"use strict";

describe("Set class", function(){

  var LiveBlocks = window.LiveBlocks;

  it("works with any kind of value", function(){

    // Make a set
    var set = new LiveBlocks.Set();

    // Make NaN
    var nan = 1/(function(){}());
    expect(nan === nan).toBe(false); // Make sure we have an actual NaN value

    // Make some values
    var values = {
      a: nan,
      b: {},
      c: function(){},
      d: "x",
      e: undefined,
      f: null
    };

    // Put values in the set
    for (var name in values)
      set.add(values[name]);

    // Add duplicate value
    set.add(values.b);

    // Positive tests for value existence
    for (var name in values)
      expect(set.has(values[name])).toBe(true);

    // Negative test for value existence
    expect(set.has({})).toBe(false);
    expect(set.has(function(){})).toBe(false);

    // Remove some values
    var removedValues = {
      a: values.a,
      b: values.b
    };
    delete values.a;
    delete values.b;
    for (var name in removedValues)
      set.remove(removedValues[name]);

    // Positive test for remaining values
    for (var name in values)
      expect(set.has(values[name])).toBe(true);

    // Negative test for removed values
    for (var name in removedValues)
      expect(set.has(removedValues[name])).toBe(false);
  });

  it("value() function returns an iterator which iterates over set values", function(){

    // Make a set
    var set = new LiveBlocks.Set();

    // Make some values
    var values = {
      a: {},
      b: {}
    };

    // Put values in the set
    for (var name in values)
      set.add(values[name]);

    // Get set iterator
    var it = set.values();
    expect(it.peek().done).toBe(false);
    expect(it.peek().value).toBe(values.a);

    // Move to next value
    var value = it.next().value;
    expect(value).toBe(values.a)
    expect(it.peek().done).toBe(false);
    expect(it.peek().value).toBe(values.b);

    // Move to next value
    var value = it.next().value;
    expect(value).toBe(values.b)
    expect(it.peek().done).toBe(true);
    expect(it.peek().value).toBeUndefined();

    // Add a new value to the set
    values.c = {};
    set.add(values.c);

    // Reset iterator
    it.reset();

    // Check iterator
    expect(it.next().value).toBe(values.a);
    expect(it.next().value).toBe(values.b);
    expect(it.peek().done).toBe(true);
    expect(it.peek().value).toBeUndefined();

    // Get new iterator
    it = set.values();

    // Check iterator
    expect(it.next().value).toBe(values.a);
    expect(it.next().value).toBe(values.b);
    expect(it.next().value).toBe(values.c);
    expect(it.peek().done).toBe(true);
    expect(it.peek().value).toBeUndefined();

    var value = it.next();
    expect(value).toEqual({done: true});
  });
});

