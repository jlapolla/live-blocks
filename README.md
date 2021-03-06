# LiveBlocks

LiveBlocks is a JavaScript library that helps you create smart models (the *M*
in *MVC*). The declarative nature of LiveBlocks lets you focus on *what* your
model should do, instead of worrying about *how* your model should do it.

## Overview

### Introduction

A LiveBlocks model is an interconnected network of **blocks** and **wires**.
Each block has **pins** that act as inputs and outputs to the block. Wires
connect the pins on different blocks to form a network. This is analogous to an
electric circuit, where wires connect the pins of circuit components to form a
mesh.

A block's job is to enforce a **constraint** between its pins. For example, we
could define an *uppercase-to-lowercase* block that has two pins: *upper* and
*lower*. When we change the value on the *upper* pin to "FOO", we expect the
value on the *lower* pin to be "foo". When we change the value on the *lower*
pin to "bar", we expect the value on the *upper* pin to be "BAR".

A wire's job is to connect pins, and store a value. Multiple pins can connect
to the same wire, and all of the pins connected to a wire share the same common
value. In contrast, a pin *cannot* be connected to multiple wires, because each
pin must get its value from one and only one wire. A pin that is not connected
to any wire is called a **floating** pin. Floating pins can cause unpredictable
results, so we recommend that you connect each pin to a wire, even if you don't
do anything else with that wire.

### Defining Blocks, Pins, and Constraints

The fundamental block type in LiveBlocks is the **WireConstraint**. Let's make
the *uppercase-to-lowercase* block we described above:

```javascript
// Compute "lower" pin from "upper" pin
var upperToLower = function() {

  if (typeof this.upper === 'string') {

    this.upper = this.upper.toUpperCase();
    this.lower = this.upper.toLowerCase();
  }
  else {

    throw new Error('Pin "upper" must be of type "string"');
  }
};

// Compute "upper" pin from "lower" pin
var lowerToUpper = function() {

  if (typeof this.lower === 'string') {

    this.lower = this.lower.toLowerCase();
    this.upper = this.lower.toUpperCase();
  }
  else {

    throw new Error('Pin "lower" must be of type "string"');
  }
};

// Map pins to update functions and create the WireConstraint
var upperToLowerBlock = new LiveBlocks.WireConstraint({
  pins: {
    upper: upperToLower,
    lower: lowerToUpper,
  },
});
```

To make our block, we defined two functions: *upperToLower* for computing the
*lower* pin based on the *upper* pin, and *lowerToUpper* for computing the
*upper* pin based on the *lower* pin. Then we pass the functions into the
WireConstraint constructor using the *pins* object. Each *key* in the pins
object is the name of a pin on the created block, and each *value* in the pins
object is the **update function** for that pin.

When the value on the *upper* pin changes, the block runs the *upperToLower*
function, and when the value on the *lower* pin changes, the block runs the
*lowerToUpper* function. This keeps the *upper* and *lower* pins synchronized:
when one pin changes, the other pin changes too.

### Connecting Pins to Wires

Now that we have our handy *upperToLowerBlock*, its time to hook it up to some
wires and test it out.

```javascript
// Create some wires
var upperWire = new LiveBlocks.Wire();
var lowerWire = new LiveBlocks.Wire();

// Connect pins to wires
upperToLowerBlock.connect("upper", upperWire);
upperToLowerBlock.connect("lower", lowerWire);

// Set upperWire value to "FOO"
upperWire.value("FOO");
console.log(upperWire.value()); // Logs "FOO"
console.log(lowerWire.value()); // Logs "foo"

// Set lowerWire value to "bar"
lowerWire.value("bar");
console.log(upperWire.value()); // Logs "BAR"
console.log(lowerWire.value()); // Logs "bar"
```

To hook up our block, we make two wires: *upperWire* and *lowerWire*. Then we
connect the *upper* and *lower* pins of our block to the wires. To test out our
block, we set a value on one wire, and check that the value on the other wire
has changed.

### Reusing Blocks

Now that we've defined our *upperToLowerBlock*, we'd like to use it in multiple
places in our code. To do this, we duplicate the *upperToLowerBlock*.

```javascript
// Duplicate upperToLowerBlock
var block2 = upperToLowerBlock.duplicate();
var block3 = upperToLowerBlock.duplicate();
```

To duplicate our block, we call `upperToLowerBlock.duplicate()`. This creates
and returns a new block that behaves just like our original
*upperToLowerBlock*.

### Black Boxing

After a while, we have a set of useful blocks that we reuse in our code: the
*upperToLowerBlock*, a *stringLengthBlock*, and a *trimSpacesBlock*. Now we
want to combine these blocks into a single block. We can do this with a
*BlackBox*.

```javascript
// Need to create a network to pass to the BlackBox constructor

// First create wires
var strLengthWire = new LiveBlocks.Wire();
var upperWire = new LiveBlocks.Wire();
var lowerWire = new LiveBlocks.Wire();
var spacesWire = new LiveBlocks.Wire();

// Connect pins to wires
stringLengthBlock.connect("length", strLengthWire);
stringLengthBlock.connect("string", upperWire);
upperToLowerBlock.connect("upper", upperWire);
upperToLowerBlock.connect("lower", lowerWire);
trimSpacesBlock.connect("trimmed", lowerWire);
trimSpacesBlock.connect("spaces", spacesWire);

// Map pins to wires and create the BlackBox
var superBlock = new LiveBlocks.BlackBox({
  pins: {
    formattedLength: strLengthWire,
    formattedString: upperWire,
    rawString: spacesWire,
  },
});

// Duplicate BlackBox as needed...
var block2 = superBlock.duplicate();
var block3 = superBlock.duplicate();

// Wire up BlackBox as needed...
block2.connect('rawString', new LiveBlocks.Wire());
block2.connect('formattedString', new LiveBlocks.Wire());
```

First we wire up our blocks to create the network we want to black box. Then we
pass the desired wires into the *BlackBox* constructor using the *pins* object.
Each *key* in the pins object is the name of a pin on the created black box,
and each *value* in the pins object is the wire that represents the pin
internally.

When the value on a pin changes, the black box copies the new value to the wire
that represents the pin internally. This causes all other internal wires in the
black box to update their values. Then the black box copies out new values from
the internal wires to the corresponding wires that are externally connected to
its pins.

After we create the black box, it behaves just like any other block: we can
duplicate it for reuse, wire it up to other blocks, or use it as a block within
a larger *BlackBox*.
