import { SerializablePayload } from "../models/SerializablePayload.js";

export abstract class DataReader extends SerializablePayload {
  /**
   * Reads the value for the given path.
   * 
   * @param path The path to the data.
   * @returns the data under the path.
   */
  abstract getValue(path: string): Promise<unknown>;
}
