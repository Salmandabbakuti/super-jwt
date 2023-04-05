const { request, gql } = require("graphql-request");
const jwt = require("jsonwebtoken");

const defaultSubgraphUrls = {
  goerli:
    "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-goerli",
  mumbai:
    "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-mumbai",
  matic:
    "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-matic"
};

// Check if the request body has all the required parameters
const isRequestBodyValid = (body) =>
  ["chain", "sender", "receiver", "token"].every((param) => body.hasOwnProperty(param));

const getStreams = async ({ chain, sender, receiver, token }) => {
  const STREAMS_QUERY = gql`
    query GetStreams($first: Int, $where: Stream_filter) {
      streams(first: $first, where: $where) {
        id
      }
    }
  `;
  const subgraphUrl =
    defaultSubgraphUrls[chain] || defaultSubgraphUrls["goerli"];
  const { streams } = await request(subgraphUrl, STREAMS_QUERY, {
    first: 1,
    where: {
      sender,
      receiver,
      token,
      currentFlowRate_gt: 0
    }
  });
  return streams;
};

// Generate a JWT token with an expiration time of 1 hour
function generateJwtToken(streamOptions, jwtOptions) {
  return jwt.sign(streamOptions, secret, jwtOptions);
}

async function authenticateWithStream(streamOptions, jwtOptions) {
  const { streams } = await getStreams(streamOptions);
  if (!streams || streams.length === 0) throw new Error("No stream found to authenticate");
  const jwtToken = generateJwtToken(streamOptions, jwtOptions);
  return { token: jwtToken, stream: streamOptions };
}

function verifyToken(jwtToken, secret) {
  try {
    const decoded = jwt.verify(jwtToken, secret);
    return decoded;
  } catch (err) {
    throw new Error("failed to verify token", err);
  }

}
