import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export class UploadDpeToObjectStorage {
  /** @type {import('@aws-sdk/client-s3').S3Client} **/
  #s3client;

  constructor() {
    this.#s3client = new S3Client({
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.SCW_ACCESS_KEY,
        secretAccessKey: process.env.SCW_SECRET_KEY
      }
    });
  }

  /**
   * @param dpeCode {string}
   * @return {Promise<string>}
   */
  getFile(dpeCode) {
    return fetch(`https://dpe.s3.fr-par.scw.cloud/${dpeCode}/${dpeCode}.json`)
      .then((response) => response.text())
      .catch(() => null);
  }

  /**
   * @param dpeCode {string}
   * @param dpeFileContent {string}
   * @return {Promise<boolean>}
   */
  writeFile(dpeCode, dpeFileContent) {
    const command = new PutObjectCommand({
      Bucket: 'dpe',
      Key: `${dpeCode}/${dpeCode}.json`,
      Body: dpeFileContent
    });
    return this.#s3client
      .send(command)
      .then(() => true)
      .catch(() => false);
  }
}
