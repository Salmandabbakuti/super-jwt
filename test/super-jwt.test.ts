import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
// import jwt from 'jsonwebtoken';
import { authenticateWithStream, verifyToken } from "../src/index.ts";
chai.use(chaiAsPromised);
const { expect } = chai;

const streamPayload = {
  chain: 'goerli',
  sender: '0xc7203561ef179333005a9b81215092413ab86ae9',
  receiver: '0x7348943c8d263ea253c0541656c36b88becd77b9',
  token: '0xf2d68898557ccb2cf4c10c3ef2b034b2a69dad00'
};
const testSecret = 'supersecret';
const testJwtOptions = { expiresIn: '1h' };

describe('authenticateWithStream', () => {
  it('should throw an error if required stream payload fields are missing', async () => {
    const invalidStreamPayload = { chain: 'goerli', sender: '0xc7203561ef179333005a9b81215092413ab86ae9' } as typeof streamPayload;
    await expect(authenticateWithStream(invalidStreamPayload, testSecret, testJwtOptions)).to.be.rejectedWith(Error, 'super-jwt: Missing required stream payload');
  });

  it('should throw an error if no streams are found', async () => {
    const emptyStreamPayload = { ...streamPayload, sender: '0x00000000000000000a5000000000000000000009' };
    await expect(authenticateWithStream(emptyStreamPayload, testSecret, testJwtOptions)).to.be.rejectedWith(Error, 'super-jwt: No stream found to authenticate');
  });

  it('should return a token and stream payload', async () => {
    const result = await authenticateWithStream(streamPayload, testSecret, testJwtOptions);
    expect(result).to.have.property('token');
    expect(result).to.have.property('stream').deep.equal(streamPayload);
  });
});

describe('verifyToken', () => {
  it('should throw an error if token is invalid', () => {
    const invalidToken = 'invalidtoken';
    expect(() => verifyToken(invalidToken, testSecret)).to.throw(Error, 'super-jwt: failed to verify token');
  });

  it('should throw an error if wrong secret used', () => {
    const invalidToken = 'invalidtoken';
    expect(() => verifyToken(invalidToken, "somewrongsecret")).to.throw(Error, 'super-jwt: failed to verify token');
  });

  it('should throw an error if token is expired', () => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOiIxNTE2MjM5MDk5In0.YQDJ1bYgNrI7oLqPSTPv95-CSryj9Fv0TadONH5aukY';
    expect(() => verifyToken(expiredToken, testSecret)).to.throw(Error, 'super-jwt: failed to verify token');
  });

  it('should return the decoded token payload', async () => {
    const { token: jwtToken } = await authenticateWithStream(streamPayload, testSecret, testJwtOptions);
    const { chain, sender, receiver, token } = verifyToken(jwtToken, testSecret);
    const payload = {
      chain,
      sender,
      receiver,
      token
    };
    expect(payload).to.deep.equal(streamPayload);
  });
});
