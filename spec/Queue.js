"use strict";

describe("Queue class", function(){

  var LiveBlocks = window.LiveBlocks;

  it("is a forward queue", function(){

    // Create items
    var items = [{}, {}, {}];

    // Create new queue
    var queue = new LiveBlocks.Queue();

    // Try peek and next
    expect(queue.peek()).toBeUndefined();
    expect(queue.next()).toBeUndefined();

    // Try push
    queue.push(items[0]);

    // Try peek and next
    expect(queue.peek()).toBe(items[0]);
    expect(queue.peek()).toBe(items[0]);
    expect(queue.next()).toBe(items[0]);
    expect(queue.peek()).toBeUndefined();
    expect(queue.next()).toBeUndefined();

    // Try push, peek, and next
    queue.push(items[1]);
    queue.push(items[1]);
    expect(queue.peek()).toBe(items[1]);
    expect(queue.peek()).toBe(items[1]);
    expect(queue.next()).toBe(items[1]);
    queue.push(items[2]);
    expect(queue.peek()).toBe(items[1]);
    expect(queue.peek()).toBe(items[1]);
    expect(queue.next()).toBe(items[1]);
    expect(queue.peek()).toBe(items[2]);
    expect(queue.peek()).toBe(items[2]);
    expect(queue.next()).toBe(items[2]);
    expect(queue.peek()).toBeUndefined();
    expect(queue.next()).toBeUndefined();
  });
});

