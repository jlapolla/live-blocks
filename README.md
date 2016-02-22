# LiveBlocks

LiveBlocks is a JavaScript library that makes it easy to create complex models
(the *M* in *MVC*). The declarative nature of LiveBlocks lets you focus on
*what* the model should do, instead of worry about *how* the model should do
it.

## Core Concepts

A LiveBlocks model consists of **blocks** and **wires**.

A block's job is to enforce some **constraint** between its **pins**. For
example, we could define an *uppercase-to-lowercase* block with two pins:
`upper` and `lower`. When we change the value on the `upper` pin to "FOO", we
expect the value on the `lower` pin to be "foo". When we change the value on
the `lower` pin to "bar", we expect the value on the `upper` pin to be "BAR".
