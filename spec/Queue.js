'use strict';

describe('Queue class', function() {
  var LiveBlocks = window.LiveBlocks;

  // Skip test if Queue is not exposed
  if (!LiveBlocks.Queue)
    return;

  it('duplicates itself', function() {
    // Create original queue
    var original = new LiveBlocks.Queue();
    original.push({});

    // Create duplicate queue
    var duplicate = original.duplicate();
    expect(original.peek()).not.toBeUndefined();
    expect(duplicate.peek()).toBeUndefined();
    expect(duplicate instanceof LiveBlocks.Queue).toBe(true);
  });

  it('is a forward queue', function() {
    // Create items
    var items = [{}, {}, {}];

    // Create new queue
    var queue = new LiveBlocks.Queue();

    // Try peek and next
    expect(queue.isEmpty()).toBe(true);
    expect(queue.peek()).toBeUndefined();
    expect(queue.next()).toBeUndefined();

    // Try push
    queue.push(items[0]);

    // Try peek and next
    expect(queue.isEmpty()).toBe(false);
    expect(queue.peek()).toBe(items[0]);
    expect(queue.peek()).toBe(items[0]);
    expect(queue.next()).toBe(items[0]);
    expect(queue.isEmpty()).toBe(true);
    expect(queue.peek()).toBeUndefined();
    expect(queue.next()).toBeUndefined();

    // Try push, peek, and next
    queue.push(items[1]);
    queue.push(items[1]);
    expect(queue.isEmpty()).toBe(false);
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
    expect(queue.isEmpty()).toBe(true);
    expect(queue.peek()).toBeUndefined();
    expect(queue.next()).toBeUndefined();
  });

  it('handles "undefined" items', function() {
    // Make a queue
    var queue = new LiveBlocks.Queue();

    // Make an item
    var item = {};

    // Add items and undefined to queue
    queue.push();
    queue.push(item);
    queue.push();
    expect(queue.isEmpty()).toBe(false);
    expect(queue.next()).toBeUndefined();
    expect(queue.isEmpty()).toBe(false);
    expect(queue.next()).toBe(item);
    expect(queue.isEmpty()).toBe(false);
    expect(queue.next()).toBeUndefined();
    expect(queue.isEmpty()).toBe(true);
  });
});

