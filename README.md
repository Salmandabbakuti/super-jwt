# SuperJWT

![npm version](https://img.shields.io/badge/npm-0.0.7-brightgreen)

Super-JWT is a Node.js package that helps authenticate users based on Superfluid streams using JSON Web Tokens (JWT).

#### Installation

To install Super-JWT, use npm:

```shell
npm install super-jwt
```

## Usage

### 1. Authenticating a User with Stream

To authenticate a user with a Superfluid stream, use the `authenticateWithStream` function. The function takes the following parameters:

`streamPayload`: an object containing the stream payload parameters, including `chain`, `sender`, `receiver`, `token`, and any other custom parameters.

`secret`: a string or buffer containing the secret key for signing the JWT.

`jwtOptions`: an optional object containing options for signing the JWT, such as `expiresIn` or `algorithm`.

#### StreamPayload

An object that represents the required parameters for authenticating a Superfluid stream. It has the following properties:

`chain`: A Chain value that represents the chain on which the Superfluid stream is created. See [supported chains](#supported-chains) for more information.

`sender`: A string that represents the ethereum address of the sender of the stream.

`receiver`: A string that represents the ethereum address of the receiver of the stream.

`token`: A string that represents the ethereum address of the SuperToken being used.

In addition to the required parameters mentioned earlier, you can also pass any of the `where` parameters of the Superfluid subgraph `streams` query. This allows you to filter streams based on other properties such as `currentFlowRate_gt`, which is the flow rate in the stream. For more information on the available query parameters, you can refer to the [Superfluid subgraph documentation](https://thegraph.com/hosted-service/subgraph/superfluid-finance/protocol-v1-goerli).

#### Example

```javascript
import { authenticateWithStream } from "super-jwt";

const streamPayload = {
  chain: "goerli",
  sender: "0x123456789",
  receiver: "0x987654321",
  token: "0x0123456789abcdef",
  currentFlowRate_gt: 1
};

const secret = "my_secret_key";
const jwtOptions = { expiresIn: "1h" };

const { token, stream } = await authenticateWithStream(
  streamPayload,
  secret,
  jwtOptions
);
console.log(token); // prints the signed JWT
console.log(stream); // prints the stream payload
```

### 2. Verifying a Token

To verify a Super-JWT token, use the `verifyToken` function. The function takes the following parameters:

`jwtToken`: the JWT token to verify.

`secret`: a string or buffer containing the secret key for signing the JWT.

#### Example

```javascript
import { verifyToken } from "super-jwt";

const jwtToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjaGFpbiI6ImdvZXJsaSIsInNlbmRlciI6IjB4MTIzNDU2Nzg5IiwicmVjZWl2ZXIiOiIweDk4NzY1NDMyMSIsInRva2VuIjoiMHgwMTIzNDU2Nzg5YWJjZGVmIiwiaWF0IjoxNTE2MjM5MDIyfQ.LCeBCiVpKZYtb-GwzGMCQ44hOy1iym_sWmYdOgH0bFs";

const secret = "my_secret_key";

const decoded = verifyToken(jwtToken, secret);
console.log(decoded);
// expected output: prints the decoded JWT Stream payload
// {
// chain: 'goerli',
// sender: '0xc7203561ef179333005a9b81215092413ab86ae9',
// receiver: '0x7348943c8d263ea253c0541656c36b88becd77b9',
// token: '0xf2d68898557ccb2cf4c10c3ef2b034b2a69dad00',
// iat: 1680752577,
// }
```

#### Supported Chains

Super-JWT supports the following chains:

```ts
type Chain =
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
```

### Publishing

To publish a new version of the package to npm, run the following command:

```shell
npm run publish
```

### Change Log

#### 0.0.7

- Added more chains to the supported chains list. see [supported chains](#supported-chains) for more information.
- Throw an error if the chain is not supported instead of using default chain.
- Better error handling.

### Safety

This is experimental software and subject to change over time.

This package is not audited and has not been tested for security. Use at your own risk.
I do not give any warranties and will not be liable for any loss incurred through any use of this codebase.

# License

This package is licensed under the MIT License.
