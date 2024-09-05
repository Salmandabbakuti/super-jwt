import { request, gql } from "graphql-request";
import jwt, { JwtPayload, SignOptions, Secret } from "jsonwebtoken";

export type Chain =
  | "sepolia"
  | "opsepolia"
  | "fuji"
  | "bsepolia"
  | "scrsepolia"
  | "matic"
  | "mainnet"
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
  sepolia: "https://subgraph-endpoints.superfluid.dev/eth-sepolia/protocol-v1",
  opsepolia:
    "https://subgraph-endpoints.superfluid.dev/optimism-sepolia/protocol-v1",
  fuji: "https://subgraph-endpoints.superfluid.dev/avalanche-fuji/protocol-v1",
  bsepolia: "https://base-sepolia.subgraph.x.superfluid.dev/",
  scrsepolia:
    "https://subgraph-endpoints.superfluid.dev/scroll-sepolia/protocol-v1",
  matic:
    "https://subgraph-endpoints.superfluid.dev/polygon-mainnet/protocol-v1",
  mainnet: "https://subgraph-endpoints.superfluid.dev/eth-mainnet/protocol-v1",
  xdai: "https://subgraph-endpoints.superfluid.dev/xdai-mainnet/protocol-v1",
  optimism:
    "https://subgraph-endpoints.superfluid.dev/optimism-mainnet/protocol-v1",
  avalanche:
    "https://subgraph-endpoints.superfluid.dev/avalanche-c/protocol-v1",
  bsc: "https://subgraph-endpoints.superfluid.dev/bsc-mainnet/protocol-v1",
  celo: "https://subgraph-endpoints.superfluid.dev/celo-mainnet/protocol-v1",
  base: "https://subgraph-endpoints.superfluid.dev/base-mainnet/protocol-v1"
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

  if (!requiredParams.every((param) => streamPayload.hasOwnProperty(param))) {
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
