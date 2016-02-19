"use strict";

describe("ArrayIterator class", function(){

  var LiveBlocks = window.LiveBlocks;

  it("iterates over an array", function(){

    // Make an array iterator
    var it = new LiveBlocks.ArrayIterator(["a", undefined, "c"]);

    // Test output
    expect(it.peek()).toEqual({value: "a", done: false});
    expect(it.next()).toEqual({value: "a", done: false});

    // Test output
    expect(it.peek()).toEqual({value: undefined, done: false});
    expect(it.next()).toEqual({value: undefined, done: false});

    // Test output
    expect(it.peek()).toEqual({value: "c", done: false});
    expect(it.next()).toEqual({value: "c", done: false});

    // Test output
    expect(it.peek()).toEqual({done: true});
    expect(it.next()).toEqual({done: true});
    expect(it.peek()).toEqual({done: true});
    expect(it.next()).toEqual({done: true});

    // Reset the iterator
    it.reset();

    // Test output
    expect(it.peek()).toEqual({value: "a", done: false});
    expect(it.next()).toEqual({value: "a", done: false});

    // Test output
    expect(it.peek()).toEqual({value: undefined, done: false});
    expect(it.next()).toEqual({value: undefined, done: false});

    // Test output
    expect(it.peek()).toEqual({value: "c", done: false});
    expect(it.next()).toEqual({value: "c", done: false});

    // Test output
    expect(it.peek()).toEqual({done: true});
    expect(it.next()).toEqual({done: true});
    expect(it.peek()).toEqual({done: true});
    expect(it.next()).toEqual({done: true});
  });
});

