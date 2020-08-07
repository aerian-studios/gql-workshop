const Apollo = require("apollo-server");
const glob = require("glob");
const fs = require("fs");

const concatFiles = (files) => {
  let result = "";
  glob.sync(files).forEach((file) => {
    result += fs.readFileSync(file, "utf-8");
  });

  return result;
};

//
const typeDefs = concatFiles(`${__dirname}/*.graphql`);
// The root provides a resolver function for each API endpoint
const resolvers = {
  Query: {
    // people: () => people
  },
};

const server = new Apollo.ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    return { headers: req.headers };
  },
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
