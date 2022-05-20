import { ApiParseResult, AmfServiceProcessingOptions } from "../../amf/Parsing.js";
import { ContextEvent } from "../BaseEvents.js";
import { AmfEventTypes } from './AmfEventTypes.js'

export class AmfEvents {
  /**
   * Downloads the file and processes it as a zipped API project.
   *
   * @param url API remote location.
   * @param mainFile API main file. If not set the program will try to find the best match.
   * @param md5 When set it will test data integrity with the MD5 hash
   * @param packaging Default to `zip`.
   * @returns Promise resolved to the AMF json-ld model.
   */
  static async processApiLink(url: string, mainFile?: string, md5?: string, packaging?: string, target: EventTarget = window): Promise<ApiParseResult> {
    const e = new ContextEvent(AmfEventTypes.processApiLink, {
      url, mainFile, md5, packaging,
    });
    target.dispatchEvent(e);
    return (e.detail.result as unknown) as Promise<ApiParseResult>;
  }

  /**
   * Parses API data to AMF model.
   * @param buffer Buffer created from API file.
   * @param opts Processing options
   * @returns Promise resolved to the AMF json-ld model
   */
  static async processBuffer(buffer: Buffer, opts?: AmfServiceProcessingOptions, target: EventTarget = window): Promise<ApiParseResult> {
    const e = new ContextEvent(AmfEventTypes.processBuffer, {
      buffer, opts,
    });
    target.dispatchEvent(e);
    return (e.detail.result as unknown) as Promise<ApiParseResult>;
  }

  /**
   * Processes file data.
   * If the blob is a type of `application/zip` it processes the file as a
   * zip file. Otherwise it processes it as a file.
   *
   * @param file File to process.
   * @returns Promise resolved to the AMF json-ld model
   */
  static async processApiFile(file: File | Blob, target: EventTarget = window): Promise<ApiParseResult> {
    const e = new ContextEvent(AmfEventTypes.processApiFile, {
      file,
    });
    target.dispatchEvent(e);
    return (e.detail.result as unknown) as Promise<ApiParseResult>;
  }

  /**
   * Informs the UI to select a single file from the list of API entry point candidates.
   */
  static async selectApiMainFile(candidates: string[], target: EventTarget = window): Promise<string | undefined> {
    const e = new ContextEvent(AmfEventTypes.selectApiMainFile, {
      candidates,
    });
    target.dispatchEvent(e);
    return e.detail.result as Promise<string | undefined>;
  }
}
