import { PayloadSerializer, Payload, DeserializedPayload, hasBuffer } from '../lib/transformers/PayloadSerializer.js';

export class SerializablePayload {
  /**
   * The serialized payload message.
   */
  payload?: Payload;
  /**
   * The payload in its original format.
   * May not be populated when the `getPayload()` was not yet read.
   */
  protected _sourcePayload: unknown;

  /**
   * Sets the payload on the request.
   * This transforms the source `message` to its serialized form using the `PayloadSerializer`.
   */
  async writePayload(message: unknown): Promise<void> {
    this._sourcePayload = message;
    this.payload = await PayloadSerializer.serialize(message as DeserializedPayload);
  }

  /**
   * Reads the payload as its original format.
   * It uses the `PayloadSerializer` to process the data.
   */
  async readPayload(): Promise<DeserializedPayload> {
    if (!this._sourcePayload) {
      this._sourcePayload = await PayloadSerializer.deserialize(this.payload);
    }
    return this._sourcePayload as DeserializedPayload;
  }

  /**
   * Reads the payload as string, when it is possible.
   * This method assumes that the payload is a string regardless on the format of the data
   * (Buffer, ArrayBuffer, ...) and returns a string representation of the payload.
   * 
   * @returns The string value of the payload of undefined if unable to process.
   */
  async readPayloadAsString(): Promise<string | undefined> {
    const { payload } = this;
    if (!payload) {
      return undefined;
    }
    if (typeof payload === 'string') {
      return payload;
    }
    if (payload.type === 'string') {
      return payload.data as string;
    }
    if (['blob', 'file', 'formdata'].includes(payload.type)) {
      // should this return a string from the blob?
      return undefined;
    }
    const body = await this.readPayload();
    if (hasBuffer && body instanceof Buffer) {
      return body.toString();
    }
    const dataView = new DataView(body as ArrayBuffer);
    const decoder = new TextDecoder();
    return decoder.decode(dataView);
  }
}
