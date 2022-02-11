export class DataTestHelper {
  static async getFile(file: string): Promise<string> {
    const response = await fetch(`/test/postman-transformers/data/${file}`);
    if (!response.ok) {
      throw new Error(`File ${file} is unavailable`);
    }
    return response.text();
  }
}
