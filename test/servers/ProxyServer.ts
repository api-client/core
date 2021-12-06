/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import getPort, { portNumbers } from '../helpers/getPort.js';
import http from 'http';
import https from 'https';
import path from 'path';
import net from 'net';
import { readFile } from 'fs/promises';
import { URL } from 'url';

/** @typedef {import('net').Socket} Socket */

export class ProxyServer {
  httpPort?: number;
  httpsPort?: number;
  httpServer?: http.Server;
  httpsServer?: https.Server;
  socketMap: Record<string, net.Socket> = {};
  lastSocketKey = 0;
  debug = false;

  constructor() {
    this.requestCallback = this.requestCallback.bind(this);
    this.connectionCallback = this.connectionCallback.bind(this);
    this.connectCallback = this.connectCallback.bind(this);
  }

  /**
   * @param {...any} messages
   */
  log(...messages: any): void {
    if (!this.debug) {
      return;
    }
    const d = new Date();
    const hrs = d.getHours().toString().padStart(2, '0');
    const mns = d.getMinutes().toString().padStart(2, '0');
    const mss = d.getSeconds().toString().padStart(2, '0');
    const mls = d.getMilliseconds().toString().padStart(3, '0');
    const time = `${hrs}:${mns}:${mss}.${mls}`;
    messages.unshift('[PROXY]');
    messages.unshift('›');
    messages.unshift(time);
    // eslint-disable-next-line prefer-spread
    console.log.apply(console, messages);
  }

  async start(): Promise<void> {
    await this.startHttp();
    await this.startHttps();
  }

  async stop(): Promise<void> {
    this.disconnectAll();
    await this.stopHttp();
    await this.stopHttps();
  }

  async startHttp(): Promise<void> {
    const assignedPort = await getPort({port: portNumbers(8000, 8100)});
    this.httpPort = assignedPort
    const server = http.createServer();
    this.httpServer = server;
    server.on('connection', this.connectionCallback);
    server.on('connect', this.connectCallback); // -> this.#connectCallback
    server.on('request', this.requestCallback); // -> this.#requestCallback
    return new Promise((resolve) => {
      server.listen(assignedPort, () => resolve());
    });
  }

  async startHttps(): Promise<void> {
    const assignedPort = await getPort({port: portNumbers(8000, 8100)});
    this.httpsPort = assignedPort
    
    const key = await readFile(path.join('test', 'lib-http-engine', 'certs', 'privkey.pem'));
    const cert = await readFile(path.join('test', 'lib-http-engine', 'certs', 'fullchain.pem'));
    
    return new Promise((resolve) => {
      const options = {
        key,
        cert,
      };
      this.httpsServer = https.createServer(options);
      this.httpsServer.listen(assignedPort, () => resolve());
      this.httpsServer.on('connection', this.connectionCallback);
      this.httpsServer.on('connect', this.connectCallback);
      this.httpsServer.on('request', this.requestCallback);
    });
  }

  async stopHttp(): Promise<void> {
    return new Promise((resolve) => {
      if (this.httpServer) {
        this.httpServer.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  async stopHttps(): Promise<void> {
    return new Promise((resolve) => {
      if (this.httpsServer) {
        this.httpsServer.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  disconnectAll(): void {
    const { socketMap } = this;
    Object.keys(socketMap).forEach((socketKey) => {
      if (socketMap[socketKey].destroyed) {
        return;
      }
      socketMap[socketKey].destroy();
    });
  }

  /**
   * Callback for client connection.
   *
   * @param req Node's request object
   * @param res Node's response object
   */
  requestCallback(req: http.IncomingMessage, res: http.ServerResponse): void {
    if (req.method === 'CONNECT') {
      res.writeHead(500, {
        'Content-Type': 'application/json',
      });
      res.write(JSON.stringify({ error: 'should not handle this path.' }));
      res.end();
    } else {
      this.proxy(req, res);
    }
  }

  /**
   */
  connectCallback(request: http.IncomingMessage, clientSocket: net.Socket, head: Buffer): void {
    if (!this.isAuthorizedProxy(request)) {
      const messages = [
        'HTTP/1.1 401 Unauthorized',
        `Date: ${new Date().toUTCString()}`,
        `Proxy-Authenticate: Basic realm="This proxy requires authentication"`,
        'Content-Type: application/json',
      ];
      const bodyBuffer = Buffer.from(JSON.stringify({ error: 'the proxy credentials are invalid' }));
      messages.push(`content-length: ${bodyBuffer.length}`);
      messages.push('');
      messages.push('');
      const headersBuffer = Buffer.from(messages.join('\r\n'));
      const message = Buffer.concat([headersBuffer, bodyBuffer, Buffer.from('\r\n\r\n')]);
      // console.log(message.toString('utf8'));
      clientSocket.write(message);
      clientSocket.end();
      return;
    }

    this.log('Opening an SSL tunnel');
    clientSocket.setKeepAlive(true);
    const { port, hostname } = new URL(`https://${request.url}`);
    const targetPort = Number(port || 443);
    this.log('Tunneling to', hostname, targetPort);
    clientSocket.pause();
    
    const serverSocket = net.connect(targetPort, hostname);
    clientSocket.on('data', (data) => {
      this.log(`Tunneling Client -> Server: ${data.length} bytes`);
      // data.toString().split('\n').forEach((line) => this.log(line));
    });
    serverSocket.on('data', (data) => {
      this.log(`Tunneling Client <- Server: ${data.length} bytes`);
      // data.toString().split('\n').forEach((line) => this.log(line));
    });
    serverSocket.once('end', () => {
      this.log('Target socket ended.');
    });
    clientSocket.on('error', (err) => {
      this.log(`Client socket error when connecting to https://${request.url}`);
      this.log(err);
    });
    serverSocket.once('error', (err) => {
      this.log(`Server socket error when connecting to https://${request.url}`);
      this.log(err);
    });
    serverSocket.once('connect', () => {
      this.log('Connected to the target through a tunnel.');

      clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
        'Proxy-agent: Test-Server\r\n' +
        '\r\n');
      if (head.length) {
        serverSocket.write(head);
      }
      clientSocket.pipe(serverSocket);
      serverSocket.pipe(clientSocket);
      clientSocket.resume();
    });
    serverSocket.once('close', () => {
      this.log('Server socket close');
      clientSocket.destroy();
      serverSocket.destroy();
    });
    clientSocket.on('end', () => {
      this.log('Client socket ended.');
    });
    serverSocket.setKeepAlive(true);
  }

  /**
   * Caches sockets after connection.
   */
  connectionCallback(socket: net.Socket): void {
    const socketKey = String(++this.lastSocketKey);
    this.socketMap[socketKey] = socket;
    socket.on('close', () => {
      delete this.socketMap[socketKey];
    });
  }

  /**
   * Proxies streams.
   *
   * @param req Node's request object
   * @param res Node's response object
   */
  proxy(req: http.IncomingMessage, res: http.ServerResponse): void {
    if (!req.url) {
      res.writeHead(400, {
        'Content-Type': 'application/json',
      });
      res.write(JSON.stringify({ error: 'the destination URL is not set' }));
      res.end();
      return;
    }
    const isSsl = req.url.startsWith('https:');
    const isHttp = req.url.startsWith('http:');
    if (!isSsl && !isHttp) {
      res.writeHead(400, {
        'Content-Type': 'application/json',
      });
      res.write(JSON.stringify({ error: 'the destination URL has no scheme' }));
      res.end();
      return;
    }
    if (isSsl) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.write(JSON.stringify({ error: 'Invalid request. Use tunneling instead.' }));
      res.end();
    } else {
      this.proxyHttp(req, res);
    }
  }

  /**
   * @param {http.IncomingHttpHeaders} incoming
   * @return {http.OutgoingHttpHeaders}
   */
  prepareHeaders(incoming: http.IncomingHttpHeaders): http.OutgoingHttpHeaders {
    const result: http.OutgoingHttpHeaders = {};
    const keys = Object.keys(incoming);
    const ignored: (keyof http.IncomingHttpHeaders)[] = [
      'proxy-authorization',
      'connection',
      'upgrade',
    ];
    keys.forEach((key) => {
      const name = key.toLowerCase();
      if (ignored.includes(name)) {
        return;
      }
      result[key] = incoming[key];
    });
    result.via = '1.1 localhost';
    const proxyAuth = incoming['proxy-authorization'];
    if (proxyAuth) {
      result['x-proxy-authenticated'] = 'true';
    }
    return result;
  }

  /**
   * Proxies http streams.
   *
   * @param sourceRequest Node's request object
   * @param sourceResponse Node's response object
   */
  proxyHttp(sourceRequest: http.IncomingMessage, sourceResponse: http.ServerResponse): void {
    if (!this.isAuthorizedProxy(sourceRequest)) {
      sourceResponse.writeHead(401, {
        'Content-Type': 'application/json',
      });
      sourceResponse.write(JSON.stringify({ error: 'the proxy credentials are invalid' }));
      sourceResponse.end();
      return;
    }
    const urlInfo = new URL(sourceRequest.url!);
    const headers = this.prepareHeaders(sourceRequest.headers);
    const options: http.RequestOptions = {
      method: sourceRequest.method,
      host: urlInfo.host,
      hostname: urlInfo.hostname,
      path: `${urlInfo.pathname}${urlInfo.search || ''}`,
      port: urlInfo.port || 80,
      protocol: urlInfo.protocol,
      headers,
    };
    const proxy = http.request(options, (targetResponse) => {
      if (targetResponse.statusCode) {
        sourceResponse.statusCode = targetResponse.statusCode;
      }
      if (targetResponse.statusMessage) {
        sourceResponse.statusMessage = targetResponse.statusMessage;
      }
      for (let i = 0, len = targetResponse.rawHeaders.length; i < len; i+=2) {
        const name = targetResponse.rawHeaders[i];
        const value = targetResponse.rawHeaders[i + 1];
        sourceResponse.setHeader(name, value);
      }
      targetResponse.on('data', (data) => {
        sourceResponse.write(data);
      });
      targetResponse.on('end', () => {
        sourceResponse.end();
      });
    });
    sourceRequest.on('data', (data) => {
      proxy.write(data);
    });
    if (sourceRequest.readableEnded) {
      proxy.end();
    } else {
      sourceRequest.once('end', () => {
        proxy.end();
      });
    }
    proxy.on('error', (err) => {
      // @ts-ignore
      if (err.code === 'ENOTFOUND') {
        sourceResponse.writeHead(404);
        sourceResponse.end();
      } else {
        sourceResponse.writeHead(500);
        sourceResponse.end();
      }
    });
  }

  /**
   * If present, it reads proxy authorization and checks with preconfigured values.
   *
   * @param req Node's request object
   * @return false when invalid authorization.
   */
  isAuthorizedProxy(req: http.IncomingMessage): boolean {
    const { headers } = req;
    const info = headers['proxy-authorization'];
    if (!info || !info.toLowerCase().startsWith('basic')) {
      return true;
    }
    try {
      const buff = Buffer.from(info.substr(6), 'base64');
      const text = buff.toString('ascii');
      const parts = text.split(':');
      const [username, password] = parts;
      return username === 'proxy-name' && password === 'proxy-password';
    } catch (e) {
      return false;
    }
  }
}
