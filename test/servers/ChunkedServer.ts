/* eslint-disable import/no-named-as-default-member */
import http, { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';
import https from  'https';
import path from 'path';
import fs from 'fs-extra';
import { DataMock } from '@pawel-up/data-mock';
// @ts-ignore
import SslRootCas from 'ssl-root-cas';

interface IServers {
  srv: undefined | http.Server,
  ssl: undefined | https.Server,
}

const servers: IServers = {
  srv: undefined,
  ssl: undefined,
};

const rootCas = SslRootCas.create();
rootCas
  .addFile(path.join('test', 'runtime', 'http-engine', 'certs', 'ca.cert.pem'));

// @ts-ignore
https.globalAgent.options.ca = rootCas;

const mock = new DataMock();

/**
 * Writes a chunk of data to the response.
 *
 * @param res Node's response object
 */
function writeChunk(res: ServerResponse): void {
  const word = mock.lorem.word({ length: 128 });
  res.write(`${word}\n`);
}
/**
 * Writes chunk type response to the client.
 *
 * @param res Node's response object
 */
function writeChunkedResponse(res: ServerResponse): void {
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=UTF-8',
    'Transfer-Encoding': 'chunked',
  });
  writeChunk(res);
  let time = 0;
  for (let i = 0; i < 4; i++) {
    const timeout = mock.types.number({ min: 1, max: 10 });
    time += timeout;
    setTimeout(() => writeChunk(res), timeout);
  }
  time += 5;
  setTimeout(() => {
    res.end('END');
  }, time);
}

/**
 * Callback for client connection.
 *
 * @param req Node's request object
 * @param res Node's response object
 */
function connectedCallback(req: IncomingMessage, res: ServerResponse): void {
  writeChunkedResponse(res);
}

/**
 * Callback for client connection over SSL.
 *
 * @param req Node's request object
 * @param res Node's response object
 */
function connectedSslCallback(req: IncomingMessage, res: ServerResponse): void {
  writeChunkedResponse(res);
}

let lastSocketKey = 0;
const socketMap: Record<number, Socket> = {};

/**
 * Caches sockets after connection.
 */
function handleConnection(socket: Socket): void {
  const socketKey = ++lastSocketKey;
  socketMap[socketKey] = socket;
  socket.on('close', () => {
    delete socketMap[socketKey];
  });
}

/**
 * Launches the HTTP server
 */
function startHttpServer(httpPort: number): Promise<void> {
  return new Promise((resolve) => {
    const srv = http.createServer(connectedCallback);
    servers.srv = srv;
    srv.listen(httpPort, () => resolve());
    srv.on('connection', handleConnection);
  });
}

/**
 * Launches the HTTPS server
 */
async function startHttpsServer(sslPort: number): Promise<void> {
  const key = await fs.readFile(path.join('test', 'runtime', 'http-engine', 'certs', 'privkey.pem'));
  const cert = await fs.readFile(path.join('test', 'runtime', 'http-engine', 'certs', 'fullchain.pem'));
  return new Promise((resolve) => {
    const options = {
      key,
      cert,
    };
    const srv = https.createServer(options, connectedSslCallback);
    servers.ssl = srv;
    srv.listen(sslPort, () => resolve());
    srv.on('connection', handleConnection);
  });
}

export function startServer(httpPort: number, sslPort: number): Promise<void[]> {
  return Promise.all([startHttpServer(httpPort), startHttpsServer(sslPort)])
}

export function stopServer(): Promise<void[]> {
  Object.keys(socketMap).forEach((socketKey) => {
    const key = Number(socketKey);
    if (socketMap[key].destroyed) {
      return;
    }
    socketMap[key].destroy();
  });
  const p1 = new Promise<void>((resolve) => {
    if (servers.srv) {
      servers.srv.close(() => resolve());
    } else {
      resolve();
    }
  });
  const p2 = new Promise<void>((resolve) => {
    if (servers.ssl) {
      servers.ssl.close(() => resolve());
    } else {
      resolve();
    }
  });
  return Promise.all([p1, p2]);
}
