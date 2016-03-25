# LiveBlocks

LiveBlocks is a new way to handle data relationships and data flow in
JavaScript. Use LiveBlocks to:

- Manage model updates in your MVC application.
- Create configurable, reusable processing pipelines that update their outputs
  whenever their inputs change.
- Create bi-directional processing pipelines that update their outputs whenever
  their inputs change, and vice versa.
- Create animations governed by equations (for example, animate particle motion
  with gravity effects and drag forces).
- Wire together equations in a block diagram to perform scientific simulations,
  including differential equations.
- Simulate digital logic circuits, including combinatorial and synchronous
  logic.
- Animate changes to data.
- Other uses that have not been added to this list.

## Introduction

The best way to introduce LiveBlocks is to compare it to a spreadsheet program
like Microsoft Excel.

Consider the following spreadsheet equations:

|     |  A  |     B     |
| ---:| --- | --------- |
|   1 | = 2 | = A1 + 1  |
|   2 |     | = A1 * B1 |

When cell A1 = 2, the values in each cell will be:

|     |  A  |     B     |
| ---:|:---:|:---------:|
|   1 |   2 |         3 |
|   2 |     |         6 |

If we set cell A1 = 3, the values in each cell will update to be:

|     |  A  |     B     |
| ---:|:---:|:---------:|
|   1 |   3 |         4 |
|   2 |     |        12 |

We can translate these spreadsheet equations into the following LiveBlocks circuit:

```
             Block A
         x┌───────────┐y
   ┌──□───┤ y = x + 1 ├───□──┐   
   │      └───────────┘      ├─B1      Block B
A1─┤                         │     s┌───────────┐
   │                         └──□───┤           │r
   │                               t│ r = t * s ├───□──B2
   └────────────────────────────□───┤           │
                                    └───────────┘
```

The cells in the spreadsheet are represented by **wires** in the LiveBlocks
circuit. In the diagram, we've labeled the wires with their corresponding cell
names: *A1*, *B1*, and *B2*.

The equations in the spreadsheet are represented by **blocks** in the
LiveBlocks circuit. In the diagram, we've arbitrarily labeled the blocks *Block
A* and *Block B*.

The blocks in the diagram have arbitrarily named **pins**. In this diagram,
*Block A* has two pins: *x* and *y*. *Block B* has three pins: *r*, *s*, and
*t*. The diagram shows the wires that are connected to each pin. For example:
pin *x* on *Block A* is connected to wire *A1*, and pin *y* on *Block A* is
connected to wire *B1*.

In JavaScript code, we would create this circuit as follows:

```javascript
// Create wires
var wireA1 = /* code to create wire */ ;
var wireB1 = /* code to create wire */ ;
var wireB2 = /* code to create wire */ ;

// Create blocks
var blockA = /* code to create block */ ;
var blockB = /* code to create block */ ;

// Connect blockA pins to wires
blockA.connect('x', wireA1); // Connect pin 'x' to 'wireA1'
blockA.connect('y', wireB1); // Connect pin 'y' to 'wireB1'

// Connect blockB pins to wires
blockB.connect('r', wireB2); // Connect pin 'r' to 'wireB2'
blockB.connect('s', wireB1); // Connect pin 's' to 'wireB1'
blockB.connect('t', wireA1); // Connect pin 't' to 'wireA1'
```

After we create the circuit, we can set *wireA1 = 2*, and check the values on
*wireB1* and *wireB2*:

```javascript
// Set 'wireA1 = 2'
wireA1.value(2);

// Observe values on 'wireB1' and 'wireB2'
console.log(wireB1.value()); // Logs '3'
console.log(wireB2.value()); // Logs '6'

// Let's try another value

// Set 'wireA1 = 3'
wireA1.value(3);

// Observe values on 'wireB1' and 'wireB2'
console.log(wireB1.value()); // Logs '4'
console.log(wireB2.value()); // Logs '12'
```

When we set a value on *wireA1*, *wireB1* and *wireB2* automatically update,
just like the cells in the spreadsheet.

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
