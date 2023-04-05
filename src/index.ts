import { request, gql } from "graphql-request";
import jwt from "jsonwebtoken";

type Chain = "goerli" | "mumbai" | "matic";

interface Stream {
  id: string;
}

interface StreamFilter {
  sender: string;
  receiver: string;
  token: string;
  currentFlowRate_gt: number;
}

interface StreamQueryResult {
  streams: Stream[];
}

interface AuthorizeStreamOptions {
  chain?: Chain;
  sender: string;
  receiver: string;
  token: string;
}

interface GenerateTokenOptions {
  chain: Chain;
  sender: string;
  receiver: string;
  token: string;
  secret: string;
  expiresIn?: string | number;
}

interface AuthorizeStreamResponse {
  token: string;
  redirectUrl: string;
}

interface AuthorizeStreamError {
  code: string;
  message: string;
}

type AuthorizeStreamResult = AuthorizeStreamResponse | AuthorizeStreamError;

const defaultSubgraphUrls: Record<Chain, string> = {
  goerli:
    "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-goerli",
  mumbai:
    "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-mumbai",
  matic:
    "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-matic"
};

// Check if the API key is authorized
// const isApiKeyAuthorized = (apiKey: string) => whitelistedApiKeys.includes(apiKey);

// Check if the request body has all the required parameters
const isRequestBodyValid = (body: Record<string, unknown>) =>
  ["sender", "receiver", "token"].every((param) => body.hasOwnProperty(param));

// Retrieve streams using the Superfluid subgraph
const getStreams = async ({
  chain = "goerli",
  sender,
  receiver,
  token
}: AuthorizeStreamOptions): Promise<Stream[]> => {
  const STREAMS_QUERY = gql`
    query GetStreams($first: Int, $where: Stream_filter) {
      streams(first: $first, where: $where) {
        id
      }
    }
  `;
  const subgraphUrl =
    defaultSubgraphUrls[chain] || defaultSubgraphUrls["goerli"];
  const { streams }: StreamQueryResult = await request(
    subgraphUrl,
    STREAMS_QUERY,
    {
      first: 1,
      where: {
        sender,
        receiver,
        token,
        currentFlowRate_gt: 0
      }
    }
  );
  return streams;
};

// Generate a JWT token with an expiration time of 1 hour
function generateJwtToken({
  chain,
  sender,
  receiver,
  token,
  secret,
  expiresIn
}: GenerateTokenOptions): string {
  return jwt.sign({ chain, sender, receiver, token }, secret, {
    expiresIn: expiresIn || "1h"
  });
}

function authorizeWithStream(streamOptions, jwtOptions) {

}

function verifyToken() { }
