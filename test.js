const superJWT = require("super-jwt");

console.log(superJWT);
const secret = "supersecret";
async function main() {
  const { token: jwtToken } = await superJWT.authenticateWithStream(
    {
      chain: "goerli",
      sender: "0xc7203561ef179333005a9b81215092413ab86ae9",
      receiver: "0x7348943c8d263ea253c0541656c36b88becd77b9",
      token: "0xf2d68898557ccb2cf4c10c3ef2b034b2a69dad00"
    },
    secret,
    {
      expiresIn: "1h"
    }
  );
  console.log(jwtToken);

  const decoded = superJWT.verifyToken(jwtToken, secret);
  console.log(decoded);
}

main();
