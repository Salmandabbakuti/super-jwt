import { request, gql } from "graphql-request";
import jwt, { JwtPayload, SignOptions, Secret } from "jsonwebtoken";

export type Chain =
  | "goerli"
  | "mumbai"
  | "matic"
  | "mainnet"
  | "opgoerli"
  | "arbgoerli"
  | "fuji"
  | "xdai"
  | "optimism"
  | "avalanche"
  | "bsc"
  | "celo"
  | "base";

interface Stream {
  id: string;
}

interface StreamQueryResult {
  streams: Stream[];
}

export interface StreamPayload {
  chain: Chain;
  sender: string;
  receiver: string;
  token: string;
  [key: string]: any;
}

export interface AuthenticationResult {
  token: string;
  stream: StreamPayload | JwtPayload;
}

const defaultSubgraphUrls: Record<Chain, string> = {
  goerli:
    "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-goerli",
  mumbai:
    "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-mumbai",
  matic:
    "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-matic",
  mainnet:
    "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-eth-mainnet",
  opgoerli:
    "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-optimism-goerli",
  arbgoerli:
    "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-arbitrum-goerli",
  fuji: "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-avalanche-fuji",
  xdai: "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-xdai",
  optimism:
    "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-optimism-mainnet",
  avalanche:
    "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-avalanche-c",
  bsc: "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-bsc-mainnet",
  celo: "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-celo-mainnet",
  base: "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-base"
};

const STREAMS_QUERY = gql`
  query GetStreams($first: Int, $where: Stream_filter) {
    streams(first: $first, where: $where) {
      id
    }
  }
`;

// Retrieve streams using the Superfluid subgraph
async function getStreams({
  chain,
  ...streamWhereParams
}: StreamPayload): Promise<Stream[]> {
  const subgraphUrl = defaultSubgraphUrls[chain];
  if (!subgraphUrl)
    throw new Error(`super-jwt: Chain ${chain} is not supported`);
  try {
    const { streams }: StreamQueryResult = await request(
      subgraphUrl,
      STREAMS_QUERY,
      {
        first: 1,
        where: {
          ...streamWhereParams
        }
      }
    );
    return streams;
  } catch (err) {
    console.warn(`super-jwt: Failed to retrieve streams: ${err}`);
    return [];
  }
}

export async function authenticateWithStream(
  streamPayload: StreamPayload,
  secret: Secret,
  jwtOptions: SignOptions
): Promise<AuthenticationResult> {
  const requiredParams = ["chain", "sender", "receiver", "token"];

  if (!requiredParams.every((param) => param in streamPayload)) {
    throw new Error(
      "super-jwt: Missing required stream payload params: chain, sender, receiver, token"
    );
  }

  const streams = await getStreams(streamPayload);

  if (!streams || streams.length === 0) {
    throw new Error(
      "super-jwt: No stream found to authenticate between sender and receiver"
    );
  }

  const jwtToken = jwt.sign(streamPayload, secret, jwtOptions);
  return { token: jwtToken, stream: streamPayload };
}

export function verifyToken(jwtToken: string, secret: Secret): JwtPayload {
  try {
    const decoded = jwt.verify(jwtToken, secret) as JwtPayload;
    return decoded;
  } catch (err) {
    throw new Error(`super-jwt: failed to verify token: ${err}`);
  }
}
