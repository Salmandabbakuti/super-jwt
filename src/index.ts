import { request, gql } from "graphql-request";
import jwt, { JwtPayload, SignOptions, Secret } from "jsonwebtoken";

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

interface StreamPayload {
  chain: Chain;
  sender: string;
  receiver: string;
  token: string;
  [key: string]: any;
}
interface AuthenticationResult {
  token: string;
  stream: StreamPayload | JwtPayload;
}

const defaultSubgraphUrls: Record<Chain, string> = {
  goerli:
    "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-goerli",
  mumbai:
    "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-mumbai",
  matic:
    "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-matic"
};

// Retrieve streams using the Superfluid subgraph
const getStreams = async ({
  chain = "goerli",
  sender,
  receiver,
  token
}: StreamPayload): Promise<Stream[]> => {
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

export async function authenticateWithStream(streamPayload: StreamPayload, secret: Secret, jwtOptions: SignOptions): Promise<AuthenticationResult> {
  if (!["chain", "sender", "receiver", "token"].every((param) => streamPayload.hasOwnProperty(param))) throw new Error("super-jwt: Missing required stream payload");
  const streams = await getStreams(streamPayload);
  if (!streams || streams.length === 0) throw new Error("super-jwt: No stream found to authenticate");
  const jwtToken = jwt.sign(streamPayload, secret, jwtOptions);
  return { token: jwtToken, stream: streamPayload };
}

export function verifyToken(jwtToken: string, secret: Secret): JwtPayload {
  try {
    const decoded = jwt.verify(jwtToken, secret) as JwtPayload;
    return decoded;
  } catch (err: unknown) {
    throw new Error(`super-jwt: failed to verify token: ${err}`);
  }
}
