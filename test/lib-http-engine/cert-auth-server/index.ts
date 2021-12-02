/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-sync */
import fs from 'fs';
import https from 'https';
import path from 'path';
import net from 'net';
import http from 'http';
import tls from 'tls';

const options = {
  key: fs.readFileSync(path.join('test', 'lib-http-engine', 'cert-auth-server', 'server_key.pem')),
  cert: fs.readFileSync(path.join('test', 'lib-http-engine', 'cert-auth-server', 'server_cert.pem')),
  requestCert: true,
  rejectUnauthorized: false,
  ca: [fs.readFileSync('./test/lib-http-engine/cert-auth-server/server_cert.pem')],
};

/** @typedef {import('http').IncomingMessage} IncomingMessage */
/** @typedef {import('http').ServerResponse} ServerResponse */
/** @typedef {import('net').Socket} Socket */
/** @typedef {import('tls').TLSSocket} TLSSocket */

let runningServer: https.Server;

let lastSocketKey = 0;
const socketMap: Record<string, net.Socket> = {};

function handleConnection(socket: net.Socket): void {
  const socketKey = String(++lastSocketKey);
  socketMap[socketKey] = socket;
  socket.on('close', () => {
    delete socketMap[socketKey];
  });
}

/**
 * Callback for client connection.
 *
 * @param {IncomingMessage} req Node's request object
 * @param {ServerResponse} res Node's response object
 */
function connectedCallback(req: http.IncomingMessage, res: http.ServerResponse): void {
  const socket: tls.TLSSocket = req.socket as tls.TLSSocket;
  const cert = socket.getPeerCertificate();
  let status: number;
  let message: any;
  if (socket.authorized) {
    status = 200;
    message = {
      authenticated: true,
      name: cert.subject.CN,
      issuer: cert.issuer.CN,
    };
  } else if (cert.subject) {
    status = 403;
    message = {
      authenticated: false,
      name: cert.subject.CN,
      issuer: cert.issuer.CN,
    };
  } else {
    status = 401;
    message = {
      authenticated: false,
    };
  }
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=UTF-8',
  });
  res.end(JSON.stringify(message));
}


function startHttpServer(httpPort: number): Promise<void> {
  return new Promise((resolve) => {
    runningServer = https.createServer(options, connectedCallback);
    runningServer.listen(httpPort, () => {
      // console.log(`Server is ready on port ${httpPort}`);
      resolve();
    });
    runningServer.on('connection', handleConnection);
  });
}

export async function startServer(port: number): Promise<void> {
  await startHttpServer(port);
};

export async function stopServer(): Promise<void> {
  const keys = Object.keys(socketMap) as string[];
  keys.forEach((socketKey) => {
    if (socketMap[socketKey].destroyed) {
      return;
    }
    socketMap[socketKey].destroy();
  });
  return new Promise((resolve) => {
    runningServer.close(() => resolve());
  });
};
