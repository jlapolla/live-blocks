"use strict";

describe("Block class", function(){

  var LiveBlocks = window.LiveBlocks;

  it("can chain and produce results synchronously", function(){

    // Create some inverter blocks
    var blocks = [];
    var run = function(){
      this.prop("output", !this.prop("input"));
    };
    for (var i = 0; i < 3; i++){
      var block = new LiveBlocks.Block();
      block.run = run;
      blocks.push(block);
    }

    // Connect inverter blocks
    blocks[1].prop("input", blocks[0], "output");
    blocks[2].prop("input", blocks[1], "output");

    // Test stimulus
    blocks[0].prop("input", true);
    expect(blocks[0].prop("input")).toEqual(true);
    expect(blocks[0].prop("output")).toEqual(false);
    expect(blocks[1].prop("input")).toEqual(false);
    expect(blocks[1].prop("output")).toEqual(true);
    expect(blocks[2].prop("input")).toEqual(true);
    expect(blocks[2].prop("output")).toEqual(false);

    // Switch test stimulus
    blocks[0].prop("input", false);
    expect(blocks[0].prop("input")).toEqual(false);
    expect(blocks[0].prop("output")).toEqual(true);
    expect(blocks[1].prop("input")).toEqual(true);
    expect(blocks[1].prop("output")).toEqual(false);
    expect(blocks[2].prop("input")).toEqual(false);
    expect(blocks[2].prop("output")).toEqual(true);
  });

  it("can delete properties", function(){});

  it("does not hang when .run() is undefined", function(){});
});
