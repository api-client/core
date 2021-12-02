import { PayloadSerializer, Payload, DeserializedPayload } from '../lib/transformers/PayloadSerializer';

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
    if (typeof message === 'string') {
      this.payload = message;
    } else {
      this.payload = await PayloadSerializer.serialize(message as DeserializedPayload);
    }
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
}
