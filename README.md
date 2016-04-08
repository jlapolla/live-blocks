<a id="liveblocks"></a>

# [LiveBlocks](#liveblocks)

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

<a id="contents"></a>

## [Contents](#contents)

- [Introduction](#introduction)
- [Basic Circuits](#basic-circuits)
  - [Operating Principles](#operating-principles)
    - [Example: Uppercase to Lowercase](#example-uppercase-to-lowercase)
  - [Input / Output Patterns](#input-output-patterns)
    - [Strict Output](#strict-output)
    - [Relaxed Output](#relaxed-output)
    - [Strict Input](#strict-input)
    - [Relaxed Input](#relaxed-input)
    - [Bi-directional Input / Output](#bi-directional-input-output)
    - [N-directional Input / Output](#n-directional-input-output)
  - [Wires](#wires)
    - [Default "equalTo" Function](#default-equalto-function)
    - [Custom "equalTo" Functions](#custom-equalto-functions)
  - [Reuse Patterns](#reuse-patterns)
    - [Reusing Blocks](#reusing-blocks)
    - [Reusing Wires](#reusing-wires)

<a id="introduction"></a>

## [Introduction](#introduction)

[Back to top](#contents)

The best way to introduce LiveBlocks is to compare it to a spreadsheet program
like Microsoft Excel.

Consider the following spreadsheet equations:

|     |  A  |     B     |
| ---:| --- | --------- |
|   1 | = 2 | = A1 + 1  |
|   2 |     | = A1 * B1 |

When cell *A1 = 2*, the values in each cell will be:

|     |  A  |     B     |
| ---:|:---:|:---------:|
|   1 |   2 |         3 |
|   2 |     |         6 |

If we set cell *A1 = 3*, the values in each cell will update to be:

|     |  A  |     B     |
| ---:|:---:|:---------:|
|   1 |   3 |         4 |
|   2 |     |        12 |

We can translate these spreadsheet equations into the following LiveBlocks
circuit:

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
*t*. The diagram shows wires connected to each pin. For example: pin *x* on
*Block A* is connected to wire *A1*, and pin *y* on *Block A* is connected to
wire *B1*.

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
blockA.connect('x', wireA1); // Connect pin 'x' to wireA1
blockA.connect('y', wireB1); // Connect pin 'y' to wireB1

// Connect blockB pins to wires
blockB.connect('r', wireB2); // Connect pin 'r' to wireB2
blockB.connect('s', wireB1); // Connect pin 's' to wireB1
blockB.connect('t', wireA1); // Connect pin 't' to wireA1
```

After we create the circuit, we can set *wireA1 = 2*, and check the values on
*wireB1* and *wireB2*:

```javascript
// Set wireA1 = 2
wireA1.value(2);

// wireB1 and wireB2 automatically update
wireB1.value(); // 3
wireB2.value(); // 6

// Let's try another value

// Set wireA1 = 3
wireA1.value(3);

// wireB1 and wireB2 automatically update
wireB1.value(); //  4
wireB2.value(); // 12
```

*wireB1* and *wireB2* automatically update when we set a value on *wireA1*,
just like the cells in the spreadsheet.

<a id="basic-circuits"></a>

## [Basic Circuits](#basic-circuits)

[Back to top](#contents)

While there is more than one type of block, we'll start by looking at the
ImmediateBlock since it is the simplest block type, and it is also the block
type you'll use most often.

<a id="operating-principles"></a>

### [Operating Principles](#operating-principles)

[Back to top](#contents)

In an ImmediateBlock each pin has an update function assigned to it. When the
value on a pin changes, the ImmediateBlock calls the associated update function
to compute updated pin values.

<a id="example-uppercase-to-lowercase"></a>

#### [Example: Uppercase to Lowercase](#example-uppercase-to-lowercase)

[Back to top](#contents)

Let's make a block that converts uppercase strings to lowercase strings:

```javascript
// Create uppercase to lowercase update function
var toLower = function(input, output) {

  output.lower = input.upper.toLowerCase();
};

// Create block
var upperToLowerBlock = new LiveBlocks.ImmediateBlock({
  pins: {
    upper: toLower,
    lower: toLower,
  },
});

/* We can't set a value on a pin directly. We can only set a value on a WIRE
that is connected to a pin. So, let's make some wires and connect them to our
upperToLowerBlock pins.*/

// Create wires
var wireUpper = new LiveBlocks.Wire();
var wireLower = new LiveBlocks.Wire();

// Connect pins to wires
upperToLowerBlock.connect('upper', wireUpper);
upperToLowerBlock.connect('lower', wireLower);

/* Now we can set a value on wireUpper, and wireLower will automatically
update. */

// Set wireUpper = 'FOO'
wireUpper.value('FOO');

// wireLower automatically updates
wireLower.value(); // 'foo'
```

Let's walk through this code.

First we create an update function called *toLower*. This is a plain old
JavaScript function. (We'll talk more about the update function signature
below.)

Next, we create an ImmediateBlock by calling the ImmediateBlock constructor
function. We pass an object to the ImmediateBlock constructor to tell it what
pins to create on the block, and what function to assign to each pin. In this
case, we create two pins: pin *upper* with the *toLower* function assigned to
it, and pin *lower* with the *toLower* function assigned to it.

After that, we hook up some wires to our block pins to create a circuit. Then
we test our circuit.

Notice that the update function, *toLower*, has the signature `function(input,
output) {...}`. All ImmediateBlock update functions must have this signature.

The update function's *input* argument is an object with keys that are pin
names, and values that are pin values (technically, pins do not have values,
and the 'pin value' is the value of the wire connected to the pin). Pins that
are not connected to any wire do not appear on the *input* argument at all,
since they effectively do not have a value. In our *toLower* function, we
access the value on the *upper* pin with `input.upper`.

The update function's *output* argument is an empty object. To output a value
on a pin, the update function creates a key on the *output* argument, with the
value equal to whatever value the update function wants to set on the pin
(technically, pins do not have values, and the value is not set on the pin, it
is set on the wire that is connected to the pin). In our *toLower* function, we
output a value on pin *lower* by assigning a value to `output.lower`.

When the value on pin *upper* changes, the block calls the associated update
function, *toLower*. *toLower* reads the value on pin *upper* by accessing
`input.upper`, and sets the value on pin *lower* by assigning to
`output.lower`. This is how automatic updates happen in LiveBlocks.

> **What happens when a pin isn't connected to a wire?**
>
> When a pin is not connected to any wire, that pin does not appear on the
> update function's *input* argument. Attempting to set the pin value on the
> update function's *output* argument has no effect.

<a id="input-output-patterns"></a>

### [Input / Output Patterns](#input-output-patterns)

[Back to top](#contents)

There are several ways to achieve update functionality in a block. This section
illustrates alternatives for the uppercase to lowercase block introduced in the
previous section. Each alternative introduces an important variation in block
behavior.

Throughout this section we'll consider the *upper* pin to be an input, and the
*lower* pin to be an output.

<a id="strict-output"></a>

#### [Strict Output](#strict-output)

[Back to top](#contents)

"Strict output" is when we prevent direct changes to an output pin. Only
changes on the input pin can affect the value on the output pin. Our uppercase
to lowercase block from the previous section exhibits strict output.

The following demonstration illustrates strict output:

```javascript
// Create uppercase to lowercase update function
var toLower = function(input, output) {

  output.lower = input.upper.toLowerCase(); // Set output (lower) pin
};

/* Create block. The same update function is used for both input and output
pins. Any time the output (lower) pin changes, the toLower function runs and
overwrites the value we just set on the output (lower) pin. */
var upperToLowerBlock = new LiveBlocks.ImmediateBlock({
  pins: {
    upper: toLower,
    lower: toLower,
  },
});

// Create wires (code omitted)

// Connect pins to wires (code omitted)

/* The output (lower) pin updates when we set a value on the input (upper)
pin. */
wireUpper.value('FOO'); // Set a value on the input pin (works as expected)
wireUpper.value(); // 'FOO' (input updates)
wireLower.value(); // 'foo' (output updates)

/* If we set a value on the output (lower) pin, the toLower function runs and
immediately overwrites the value we set. */
wireLower.value('bar'); // Set a value on the output pin (has no effect)
wireUpper.value(); // 'FOO' (no change)
wireLower.value(); // 'foo' (no change)

/* We can only change the value by setting the input (upper) pin. */
wireUpper.value('BAR'); // Set a value on the input pin (works as expected)
wireUpper.value(); // 'BAR' (input updates)
wireLower.value(); // 'bar' (output updates)
```

In most cases, you'll want to use strict output to ensure that your pins remain
synced. We'll see in the next section how pins can get out of sync when we do
not use strict output.

<a id="relaxed-output"></a>

#### [Relaxed Output](#relaxed-output)

[Back to top](#contents)

"Relaxed output" is when we allow direct changes on the output pin, and take no
action. Changes on the input pin still update the output pin.

The following demonstration illustrates relaxed output:

```javascript
// Create uppercase to lowercase update function
var toLower = function(input, output) {

  output.lower = input.upper.toLowerCase(); // Set output (lower) pin
};

// Create 'noop' function (does nothing)
var noop = function() {}; // Do nothing

/* Create block. We use the toLower function to update the output (lower) pin
when the input (upper) pin changes. When the output (lower) pin changes, we do
nothing (we run the noop function). Since we do not overwrite the new output
pin value, the new value set on the output pin remains. */
var upperToLowerBlock = new LiveBlocks.ImmediateBlock({
  pins: {
    upper: toLower,
    lower: noop,
  },
});

// Create wires (code omitted)

// Connect pins to wires (code omitted)

/* The output (lower) pin updates when we set a value on the input (upper) pin,
just like it did in the previous section. */
wireUpper.value('FOO'); // Set a value on the input pin (works as expected)
wireUpper.value(); // 'FOO' (input updates)
wireLower.value(); // 'foo' (output updates)

/* If we set a value on the output (lower) pin, the noop function runs, and
nothing happens. The value we set is not overwritten, and the input (upper) and
output (lower) pin are out of sync. */
wireLower.value('bar'); // Set a value on the output pin
wireUpper.value(); // 'FOO' (no change)
wireLower.value(); // 'bar' (output changes, and is now out of sync)

/* We can sync the pins again by setting the input (upper) pin. This runs the
toLower function and updates the output (lower) pin. */
wireUpper.value('BAZ'); // Set a value on the input pin (works as expected)
wireUpper.value(); // 'BAZ' (input updates)
wireLower.value(); // 'baz' (output updates, and is now in sync)
```

In most cases, relaxed output is undesirable, and strict output is preferred.
However, you may encounter circuits that require relaxed output for behavioral
logic reasons. Also, relaxed output will result in faster circuit update
speeds, and is a viable option when you are sure nothing is going to directly
set a value on the output, or when out-of-sync pins are acceptable.

<a id="strict-input"></a>

#### [Strict Input](#strict-input)

[Back to top](#contents)

"Strict input" is when we change or correct the value on the input pin in
response to a change on the input pin. In our uppercase to lowercase block,
this means that when we set "Foo" (not all caps) on the input (upper) pin, the
input (upper) pin is immediately overwritten to "FOO" (all caps). Changes on
the input pin still update the output pin.

The following demonstration illustrates strict input:

```javascript
// Create uppercase to lowercase update function with strict input
var toLower = function(input, output) {

  output.upper = input.upper.toUpperCase(); // Correct input (upper) pin
  output.lower = input.upper.toLowerCase(); // Set output (lower) pin
};

/* Create block. We use the toLower function for both input (upper) and output
(lower) pins. The block exhibits both strict input and strict output. */
var upperToLowerBlock = new LiveBlocks.ImmediateBlock({
  pins: {
    upper: toLower,
    lower: toLower,
  },
});

// Create wires (code omitted)

// Connect pins to wires (code omitted)

/* The output (lower) pin updates when we set a value on the input (upper) pin,
just like it did in the previous section. */
wireUpper.value('FOO'); // Set a value on the input pin (works as expected)
wireUpper.value(); // 'FOO' (input updates)
wireLower.value(); // 'foo' (output updates)

/* When we set a value on the input (upper) pin, the toLower function ensures
that the input (upper) pin is in uppercase. This is strict input. */
wireUpper.value('Bar'); // Set a value on the input pin (not all caps)
wireUpper.value(); // 'BAR' (changes to all caps)
wireLower.value(); // 'bar' (output updates)
```

In most cases, you'll want to use strict input to ensure that input values are
"clean".

<a id="relaxed-input"></a>

#### [Relaxed Input](#relaxed-input)

[Back to top](#contents)

"Relaxed input" is when we do not change or correct the value on the input pin.
In our uppercase to lowercase block, this means that when we set "Foo" (not all
caps) on the input (upper) pin, the input (upper) pin is **not** corrected to
"FOO" (all caps). Changes on the input pin still update the output pin.

The following demonstration illustrates relaxed input:

```javascript
// Create uppercase to lowercase update function with relaxed input
var toLower = function(input, output) {

  output.lower = input.upper.toLowerCase(); // Set output (lower) pin
};

/* Create block. We use the toLower function for both input (upper) and output
(lower) pins. The block exhibits relaxed input and strict output. */
var upperToLowerBlock = new LiveBlocks.ImmediateBlock({
  pins: {
    upper: toLower,
    lower: toLower,
  },
});

// Create wires (code omitted)

// Connect pins to wires (code omitted)

/* The output (lower) pin updates when we set a value on the input (upper) pin,
just like it did in the previous section. */
wireUpper.value('FOO'); // Set a value on the input pin (works as expected)
wireUpper.value(); // 'FOO' (input updates)
wireLower.value(); // 'foo' (output updates)

/* When we set a value that is not all caps on the input (upper) pin, the
output (lower) pin updates, but the input (upper) pin is not corrected to all
caps. */
wireUpper.value('Bar'); // Set a value on the input pin (not all caps)
wireUpper.value(); // 'Bar' (does not change to all caps)
wireLower.value(); // 'bar' (output updates)
```

In most cases, relaxed input is undesirable, and strict input is preferred.
However, you may encounter circuits that require relaxed input for behavioral
logic reasons.

<a id="bi-directional-input-output"></a>

#### [Bi-directional Input / Output](#bi-directional-input-output)

[Back to top](#contents)

"Bi-directional I/O" is when changes to the input pin update the output pin,
and vice versa. In this case, it's better to think of each pin as a combined
input / output (I/O) pin. In our uppercase to lowercase block, this means that
when we set "FOO" on the *upper* pin, the *lower* pin updates to "foo", and
when we set "bar" on the *lower* pin, the *upper* pin updates to "BAR".

The following demonstration illustrates bi-dirctional I/O:

```javascript
// Create uppercase to lowercase update function
var toLower = function(input, output) {

  output.lower = input.upper.toLowerCase(); // Set 'lower' pin
};

// Create lowercase to uppercase update function
var toUpper = function(input, output) {

  output.upper = input.lower.toUpperCase(); // Set 'upper' pin
}

/* Create block. We use different functions on each pin so that a change on one
pin updates the other pin. */
var upperLowerBlock = new LiveBlocks.ImmediateBlock({
  pins: {
    upper: toLower,
    lower: toUpper,
  },
});

// Create wires (code omitted)

// Connect pins to wires (code omitted)

/* When we set the 'upper' pin, the toLower function runs and updates the
'lower' pin. */
wireUpper.value('FOO'); // Set a value on the 'upper' pin
wireUpper.value(); // 'FOO' ('upper' pin updates)
wireLower.value(); // 'foo' ('lower' pin updates)

/* When we set the 'lower' pin, the toUpper function runs and updates the
'upper' pin. */
wireLower.value('bar'); // Set a value on the 'lower' pin
wireUpper.value(); // 'BAR' ('upper' pin updates)
wireLower.value(); // 'bar' ('lower' pin updates)
```

Bi-directional I/O is preferable in most circuits. However, one-directional I/O
is needed in some circuits for behavioral logic reasons. Ultimately, the choice
depends on how you want your circuit to behave.

<a id="n-directional-input-output"></a>

#### [N-directional Input / Output](#n-directional-input-output)

[Back to top](#contents)

So far, we've examined blocks that have only two pins. However, a block may
have any number of pins, with any number of pure inputs, pure outputs, and
I/O's.

The following demonstration illustrates a block with three I/O pins:

```javascript
// Create update function for pin 'a'
var fromA = function(input, output) {

  output.b = input.a + 1; // Set 'b' pin
  output.c = input.a + 2; // Set 'c' pin
};

// Create update function for pin 'b'
var fromB = function(input, output) {

  output.a = input.b - 1; // Set 'a' pin
  output.c = input.b + 1; // Set 'c' pin
}

// Create update function for pin 'c'
var fromC = function(input, output) {

  output.a = input.c - 2; // Set 'a' pin
  output.b = input.c - 1; // Set 'b' pin
}

/* Create block. We use different functions on each pin so that a change on one
pin updates the other two pins. */
var threePinsBlock = new LiveBlocks.ImmediateBlock({
  pins: {
    a: fromA,
    b: fromB,
    c: fromC,
  },
});

// Create wires (code omitted)

// Connect pins to wires (code omitted)

/* When we set the 'a' pin, the fromA function runs and updates the 'b' and 'c'
pins. */
wireA.value(1); // Set a value on the 'a' pin
wireA.value(); // 1 ('a' pin updates)
wireB.value(); // 2 ('b' pin updates)
wireC.value(); // 3 ('c' pin updates)

/* When we set the 'b' pin, the fromB function runs and updates the 'a' and 'c'
pins. */
wireB.value(5); // Set a value on the 'b' pin
wireA.value(); // 4 ('a' pin updates)
wireB.value(); // 5 ('b' pin updates)
wireC.value(); // 6 ('c' pin updates)

/* When we set the 'c' pin, the fromC function runs and updates the 'a' and 'b'
pins. */
wireC.value(9); // Set a value on the 'c' pin
wireA.value(); // 7 ('a' pin updates)
wireB.value(); // 8 ('b' pin updates)
wireC.value(); // 9 ('c' pin updates)
```

In applications using LiveBlocks, it is not uncommon to see blocks with five or
more pins, with some pins acting as pure inputs, some pins acting as pure
outputs, and some pins acting as I/O's.

<a id="wires"></a>

### [Wires](#wires)

[Back to top](#contents)

Wires play a critical role in a LiveBlocks circuit: they decide when a value
has changed, and update connected block pins. This brings up some important
questions:

- How does a wire decide when it's value has changed?
- How does a wire determine if two values are equal to each other?
- How can you customize this behavior to suite your needs?

The following sections answer these questions.

<a id="default-equalto-function">

#### [Default "equalTo" Function](#default-equalto-function)

[Back to top](#contents)

Every wire has an *equalTo* function. Internally, the wire uses it's equalTo
function to decide if it's value has changed. You can also directly call the
equalTo function to see if a wire considers itself to be equal to some value.

The following demonstration illustrates the equalTo function:

```javascript
// Create a wire using the default equalTo function
var wire = new LiveBlocks.Wire();

/* When you set a new value on a wire, it calls it's equalTo function to see if
it is already equal to the new value. If the wire is already equal to the new
value, the wire does not change it's value, and it does not update any
connected pins. */
wire.value('hello'); // Wire internally checks this.equalTo('hello')

/* We can also query the equalTo function directly. */
wire.equalTo('hello'); // true
wire.equalTo(32);      // false

/* Setting the same value on the wire does not update connected pins. Setting a
new value on the wire updates connected pins. */
wire.value('hello');     // Same value (does not update connected pins)
wire.value('new value'); // New value (updates connected pins)
```

The default equalTo function compares values with ===. The only exception is
NaN values, which are considered equal to each other (normally `NaN === NaN`
evaluates to false).

Because the default equalTo function compares values with ===, it does not work
with objects or arrays, it only works with primitives. Most LiveBlocks
applications require wires with objects and arrays as values. To use objects
and arrays as wire values, you must override the default equalTo function with
a custom equalTo function, as shown in the next section.

<a id="custom-equalto-functions"></a>

#### [Custom "equalTo" Functions](#custom-equalto-functions)

[Back to top](#contents)

To use a custom *equalTo* function, create a wire and overwrite the wire's
*equalTo* property with your custom *equalTo* function.

The following demonstration illustrates using a custom *equalTo* function:

```javascript
// Create a wire using the default equalTo function
var wire = new LiveBlocks.Wire();

// Set wire value to an empty object
wire.value({});

/* Since the default equalTo function compares with ===, the following
comparison returns false. */
wire.equalTo({}); // false ({} === {} evaluates to false)

// Now we'll create a custom equalTo function
var customEqualTo = function(value) {

  // We'll consider two objects equal if their 'name' properties match
  return this.value().name === value.name;
};

// Overwrite the default equalTo function with our custom equalTo function
wire.equalTo = customEqualTo;

/* Set a value on the wire. Notice that our value has a 'name' property. */
wire.value({name: 'Bob', age: 32});

/* Now the wire considers itself equal to any value with the same 'name'
property, even if other properties are different. */
wire.equalTo({name: 'Bob', age: 100}); // true
wire.equalTo({name: 'Jane', age: 32}); // false
```

Notice the signature of the custom *equalTo* function above: it takes a single
`value` as an argument, and compares it to `this.value()` using some comparison
criteria.

Most LiveBlocks applications require wires with a custom *equalTo* function
that performs deep object comparison. Typcially, you set up this custom
*equalTo* function once, and then reuse it throughout the application (wire
reuse is covered in the next section). Using the wrong *equalTo* function
results in unneeded block updates and reduced performance. It may also cause
infinite loops in the circuit.

<a id="reuse-patterns"></a>

### [Reuse Patterns](#reuse-patterns)

[Back to top](#contents)

After you define a block, you may want to reuse that block throughout your
code. In LiveBlocks, this is typically achieved by making a factory function
that configures and returns a new block. The same technique can be applied to
wires with custom *equalTo* functions. Once you've configured your factory
functions, we recommend making them available to your application through a
dependency injection framework.

The following sections give examples of block reuse and wire reuse.

<a id="reusing-blocks"></a>

#### [Reusing Blocks](#reusing-blocks)

[Back to top](#contents)

The following demonstration illustrates a factory function for creating
uppercase to lowercase blocks:

```javascript
/* Create uppercase to lowercase update function. All blocks created by the
factory function will share a single instance of this function. */
var toLower = function(input, output) {

  output.lower = input.upper.toLowerCase(); // Set 'lower' pin
};

// Create uppercase to lowercase block factory function
var blockFactory = function() {

  // Create and return a new uppercase to lowercase block
  return new LiveBlocks.ImmediateBlock({
    pins: {
      upper: toLower,
      lower: toLower,
    },
  });
};

/* Call the factory function to create some uppercase to lowercase block
instances. */
var upperToLowerBlock1 = blockFactory();
var upperToLowerBlock2 = blockFactory();
```

<a id="reusing-wires"></a>

#### [Reusing Wires](#reusing-wires)

[Back to top](#contents)

The following demonstration illustrates a factory function for creating wires.
In this case, we're creating wires that compare numbers, and consider them
equal if they are within a certain tolerance.

```javascript
// Define tolerance for our custom equalTo function
var tolerance = 0.001;

/* Create custom equalTo function. Numbers that are within the tolerance are
considered equal. */
var toleranceEqualTo = function(value) {

  // Check that values are within the tolerance
  return Math.abs(this.value() - value) < tolerance;
};

// Create wire factory function which uses our custom equalTo function
var wireFactory = function() {

  // Create a new wire
  var wire = new LiveBlocks.Wire();

  // Overwrite default equalTo function with custom equalTo function
  wire.equalTo = toleranceEqualTo;

  // Return the configured wire
  return wire;
};

// Call the factory function to create some wire instances
var tolWire1 = wireFactory();
var tolWire2 = wireFactory();
```

### Error Handling

#### Errors Thrown in Update Functions

#### Infinite Loops

### Memory Management

### Caveats

#### Do not Mutate Update Function's *input* Argument

#### Do not Mutate Wire Values

