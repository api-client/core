import { assert } from 'chai';
import fs from 'fs';
import getPort from '../helpers/getPort';
import { NodeEngine, IRequestCertificate, IArcResponse, ArcResponse } from '../../index';
import * as Server from './cert-auth-server/index';

describe('http-engine', () => {
  describe('NodeEngine', () => {
    let alicePem: IRequestCertificate;
    let aliceP12: IRequestCertificate;
    let alicePassword: IRequestCertificate;
    let bobP12: IRequestCertificate;
    beforeAll(async () => {
      alicePem = {
        cert: {
          data: fs.readFileSync('./test/lib-http-engine/cert-auth-server/alice_cert.pem', 'utf8'),
        },
        key: {
          data: fs.readFileSync('./test/lib-http-engine/cert-auth-server/alice_key.pem', 'utf8'),
        },
        type: 'pem',
      };
      aliceP12 = {
        cert: {
          data: fs.readFileSync('./test/lib-http-engine/cert-auth-server/alice.p12'),
          passphrase: '',
        },
        type: 'p12',
      };
      alicePassword = {
        cert: {
          data: fs.readFileSync('./test/lib-http-engine/cert-auth-server/alice-password.p12'),
          passphrase: 'test',
        },
        type: 'p12',
      };
      bobP12 = {
        cert: {
          data: fs.readFileSync('./test/lib-http-engine/cert-auth-server/bob.p12'),
          passphrase: 'test',
        },
        type: 'p12',
      };
    });

    describe('Client certificate', () => {
      let port: number;

      beforeAll(async () => {
        port = await getPort();
        await Server.startServer(port);
      });

      afterAll(async () => {
        await Server.stopServer();
      });

      it('makes connection without a certificate', async () => {
        const request = new NodeEngine({
          url: `https://localhost:${port}/`,
          method: 'GET',
          headers: 'host: localhost',
        }, {
          timeout: 10000,
        });

        const data = await request.send();
        assert.ok(data.response, 'has the response');
        const response = new ArcResponse(data.response as IArcResponse);
        const payload = await response.readPayload() as Buffer;
        
        const payloadString = payload.toString();
        const body = JSON.parse(payloadString);
        assert.isFalse(body.authenticated);
      });

      it('makes a connection with p12 client certificate', async () => {
        const request = new NodeEngine({
          url: `https://localhost:${port}/`,
          method: 'GET',
          headers: 'host: localhost',
        }, {
          clientCertificate: aliceP12,
        });

        const data = await request.send();
        assert.ok(data.response, 'has the response');
        const response = new ArcResponse(data.response as IArcResponse);
        const payload = await response.readPayload() as Buffer;

        const payloadString = payload.toString();
        const body = JSON.parse(payloadString);
        assert.isTrue(body.authenticated);
        assert.equal(body.name, 'Alice');
        assert.equal(body.issuer, 'localhost');
      });

      it('makes a connection with p12 client certificate and password', async () => {
        const request = new NodeEngine({
          url: `https://localhost:${port}/`,
          method: 'GET',
          headers: 'host: localhost',
        }, {
          clientCertificate: alicePassword,
        });
        
        const data = await request.send();
        const response = new ArcResponse(data.response as IArcResponse);
        const payload = await response.readPayload() as Buffer;

        const payloadString = payload.toString();
        const body = JSON.parse(payloadString);
        assert.isTrue(body.authenticated);
        assert.equal(body.name, 'Alice');
        assert.equal(body.issuer, 'localhost');
      });

      it('ignores untrusted valid certificates', async () => {
        const request = new NodeEngine({
          url: `https://localhost:${port}/`,
          method: 'GET',
          headers: 'host: localhost',
        }, {
          clientCertificate: bobP12,
        });

        const data = await request.send();
        
        const response = new ArcResponse(data.response as IArcResponse);
        const payload = await response.readPayload() as Buffer;

        const payloadString = payload.toString();
        const body = JSON.parse(payloadString);
        assert.isFalse(body.authenticated);
        assert.equal(body.name, 'Bob');
        // Bob has self-signed cert
        assert.equal(body.issuer, 'Bob');
      });

      it('makes a connection with pem client certificate', async () => {
        const request = new NodeEngine({
          url: `https://localhost:${port}/`,
          method: 'GET',
          headers: 'host: localhost',
        }, {
          clientCertificate: alicePem,
        });
        
        const data = await request.send();
        
        const response = new ArcResponse(data.response as IArcResponse);
        const payload = await response.readPayload() as Buffer;

        const payloadString = payload.toString();
        const body = JSON.parse(payloadString);
        assert.isTrue(body.authenticated);
        assert.equal(body.name, 'Alice');
        assert.equal(body.issuer, 'localhost');
      });
    });
  });
});
