# GraphQL, describing data

## What is it

GraphQL is a specification for a "query Language" designed to query (and mutate) "graphs" of data... Unpacking that...

A "specification" is a description of something (like the WC3 specification for HTML or CSS), whereas there may be a number of implementations of a specification (like the various browser implementations of HTML/CSS).

A "graph" of data is fundamentally a set of data that has **a defined relationship**; graphs are a Computer Science term for a data structure made up of "nodes" (or "points" or "vertices") and the connections between them, "links" (or "edges" or "lines" or "arrows"). This means that the data connections (relationships) are part of the data and not inferred through things like foreign keys, etc.

**So, GraphQL is a language specification for querying data with and from their relationships.**

In practice it is a bit more than that. On the one hand it is a query language, for querying and mutating graphs of data. On the other it is a language for describing those graphs (GraphQL schema). And on the third hand, it is a programming pattern to allow the schema to remain absolutely agnostic to the origin and shape of the original data (the resolver pattern).

These 3 things make up the "pieces" of GraphQL and we will look at each in turn and what each means.

First up Schema.

## Schema

The "Schema" in a GraphQL API is intended to be an "expressive shared language" between all parts of your stack and as such,
the GraphQL Schema language has been specifically designed to expressively describe data - specifically, graphs of data. It has a really small but flexible syntax, with only a few very simple data types - called Scalar types.

1. **Int**: A signed 32‐bit integer, e.g. `10`, `1000`, `26`, etc
2. **Float**: A signed double-precision floating-point value, e.g. `3.14159`
3. **String**: A UTF‐8 character sequence, e.g. `hello`, `world`
4. **Boolean**: true or false.
5. **ID**: The ID scalar type represents a unique identifier. It is similar to an string, but intended to be unique.

and 2 main structural types:

1. **list** and
1. **object**

Combined, these allow us to describe most structures of data. For the few situations where these are insufficient (e.g. Dates), it is usually possible to declare custom data types. There _are_ some other scalars and structural types (some of which we'll cover below) but these ones do the bulk of the work.

To see what this looks like, let's make a `Person` in GraphQL schema.

```gql
type Person {
  id: ID!
  name: String
  age: Int
  hobbies: [String]
}
```

Firstly we declare a `type` and name it `Person`. The most basic components of a schema are **object** types, which describe an object you can fetch from your API, and what fields it has. Our `Person` is an object with a `name`, `age` and some `hobbies`... The `name` is a string, as you might expect, and age is a number (`Int`) as you might expect. For `hobbies`, we wanted to allow our `Person` to be passionate about more than one thing, so we allow them to name more than one by using the **list** structure and setting the hobby name to be a string.

In Schema language everything is optional unless we specifically say it is required and so far we have not required the people of our system to have names, hobbies or even an age, but because we want to be able to uniquely identify them, we use the built in `ID` type to describe a unique identifier, and we indicate that this is required with a `!`.

So you can see that it is relatively easy to understand and describe these types. So far this is not much different from a `Person` table in a database... but as the people in our system tend to be very outgoing, they make a lot of friends from different neighbourhoods.

```gql
type Person {
  id: ID!
  name: String
  age: Int
  hobbies: [String]
  friends: [Person]
}
```

Now we can see the power of graphs, because that list of `Person` types doesn't just reference a `Person.id` as a foreign key, but a "link" to the actual `Person` data nodes.

Even more, if we add an `Address` type, we can see how we can quickly describe quite complex data and their relationships:

```gql
type Person {
  id: ID!
  name: String
  age: Int
  hobbies: [String]
  friends: [Person]
  address: [Address]
}

scalar AddressUnit
type Address {
  id: ID!
  unitNameOrNumber: AddressUnit
  streetName: String
  city: String
  neighbourhood: Neighbourhood!
  location: LatLong!
  country: Country
}

type Neighbourhood {
  id: ID!
  name: String
  boundary: GeoShape!
}

type GeoShape {
  id: ID!
  points: [LatLong!]!
}

type LatLong {
  id: ID!
  lat: Float!
  long: Float!
}

enum Country {
  NEVERLAND
  OZ
  ETERNIA
}
```

There are a few of interesting things to note in these new descriptions of our data relationships. We have a described some complex relationships and also introduced a couple of new types.

The first new type is the `Address` type's `unitNameOrNumber` field; the `AddressUnit` is a new `scalar` because it needs to be either a `String` or an `Int`. GraphQL doesn't [currently support scalar union types](https://github.com/facebook/graphql/issues/215), but with custom scalars, essentially it is up to the implementation how this is validated.

Another way to allow different values for a field, but limit it to a limited set of values is to use the `enum` (enumeration) type, like the `Country` enum type. Enums allow you to:

1. Validate any arguments of this type
2. Communicate that a field will always be one of these values and nothing else

The final thing of interest to note is the type declaration for the `points` field in the `GeoShape` type, `[LatLong!]!`. The `!` tells us that the value is required or cannot be `null`, but here we are saying that the field must always have a list, which can be empty but none of the values in the list can be `null`.

That is pretty much it for describing data shapes and relationships; there is one more utility that can help reduce code which is ubiquitous in strongly typed languages - the `interface`.

## Implementation details

Interfaces are a way of describing the shape of something without describing the thing itself - like describing a car by saying "it has 4 wheels, an engine, no more than 6 seats and some windows', we can make look at a Tesla and agree that fits that description, and a Ferrari fits that description but we haven't described the actual, "concrete" cars themselves.

Interfaces are called "abstract" because they are not used directly, rather we use them to make sure that "concrete" types fit the description, or interface described like a contract. When this happens, we say that the concrete type "implements" the interface. As an example, let's say that we have a number of different peoples of our lands. Let's convert our `Person` type into an `interface` and make some more specific people.

```gql
interface Person {
  id: ID!
  age: Int
  name: String
  hobbies: [String]
  friends: [Person]
  address: [Address]
}

type Human implements Person {
  eyeColour: String
  friends: [Person]
  id: ID!
  age: Int
  name: String
  hobbies: [String]
  address: [Address]
}

type Tree implements Person {
  evergreen: Boolean
  id: ID!
  age: Int
  name: String
  hobbies: [String]
  friends: [Person]
  address: [Address]
}

type Jellyfish implements Person {
  symbiotes: [Person!]
  id: ID!
  age: Int
  name: String
  hobbies: [String]
  friends: [Person]
  address: [Address]
}
```

With the above code, we can ensure all the fields in the `Person` interface are in our "concrete" type's declaration by telling the Schema that the type `implements Person`; anything that we do add to the type declaration is additional to the fields in `Person` - e.g. the `Human` type also has a `eyeColour` field.

There are other benefits to using `interfaces` that we'll cover in Part 2.

## Describing data summary

The Schema language gives us a powerful way to both describe data and to describe the relationships in the data. This was an overview of the most commonly useful parts of the language, but it was by no means exhaustive.

As an interesting exercise to embed some of these concepts, you could try making some types for the people and characters of the Lord of the Rings universe, or the Marvel

Next up, GraphQl schema [Part 2] - describing what you can do with the data.
