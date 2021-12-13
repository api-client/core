/* eslint-disable @typescript-eslint/ban-ts-comment */
import _FormData from 'form-data';
import { IMultipartBody, PayloadSerializer } from '../../lib/transformers/PayloadSerializer.js';

let target: _FormData;

/**
 * Adds a part to the form.
 */
async function _append(part: IMultipartBody): Promise<void> {
  const { name, value, isFile, type, fileName, enabled } = part;
  if (enabled === false) {
    return;
  }

  let blob;
  if (isFile) {
    blob = PayloadSerializer.deserializeBlobBuffer(value);
    if (blob) {
      target.append(name, blob, {
        filename: fileName,
        knownLength: blob.length,
        contentType: type,
      });
    }
  } else if (type) {
    blob = PayloadSerializer.deserializeBlobBuffer(value);
    if (blob) {
      target.append(name, blob, 'blob');
    }
  } else {
    target.append(name, value);
  }
}

export interface FormDataResult {
  /**
   * The contents of the form data
   */
  buffer: Buffer;
  /**
   * Content type for the form data.
   */
  type: string;
}


function _getData(): Promise<FormDataResult> {
  return new Promise((resolve, reject) => {
    let result: Buffer;
    target.on('data', (data) => {
      if (!(data instanceof Buffer)) {
        data = Buffer.from(data);
      }
      if (!result) {
        result = data;
      } else {
        const sum = result.length + data.length;
        result = Buffer.concat([result, data], sum);
      }
    });
    target.on('error', (err) => reject(err));
    target.on('end', () => {
      const ct = target.getHeaders()['content-type'];
      resolve({
        buffer: result,
        type: ct,
      });
    });
    target.resume();
  });
}

/**
 * Processes the form data.
 */
export default async function (parts: IMultipartBody[]): Promise<FormDataResult> {
  target = new _FormData();
  const promises: Promise<void>[] = [];
  parts.forEach((part) => {
    promises.push(_append(part));
  });
  await Promise.all(promises);
  return _getData();
}
