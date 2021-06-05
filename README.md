# Dummy Data Project

The gist of the idea for this is to be able to generate fake data of people, the background is to be able to demonstrate de-duplicating data from multiple sources.

```
So, what we need is sets of people who are customers to a business unit, some aspect of them or their purchase history and some selection criteria to use
```

Requirements:

To be able to generate a list of X people (likely around 1000) that have (at minimum) the following data:
- First Name
- Last Name
- Gender
- DoB

There is some desire to be able to easily add fields to the data set and also to export the data.

As there's an excellent public (MIT License) API ( https://randomuser.me/ ) to generate fake person data, the only real challenge left is the notion of `purchase history` for which a notion has been provided as follows:

```
Let’s sat say we decided on the selection criteria they would all be VIP customers we could tag that too.

Finally, they have all come from one of 3 source business units Mobile, TV and E-commerce. Let’s say mobile has twice as many customers as TV and six times as many as E-commerce. 

I would then use the range 1-10 randomly. 

If you got allocated a number 1-6 you are assigned Mobile.
If 7-9 you are assigned TV.
If 10 you are assigned E-Commerce. 

For all those in Mobile we could give a non-repeatable 8 digit random source ID. The same can be done for TV say using 6 digits and for E-Commerce using 5 digits
```