import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export class UploadDpeToObjectStorage {
  /** @type {import('@aws-sdk/client-s3').S3Client} **/
  #s3client;

  constructor() {
    this.#s3client = new S3Client({
      region: 'fr-par',
      endpoint: 'https://s3.fr-par.scw.cloud',
      forcePathStyle: true,
      credentials: {
        accessKeyId: 'SCWK0Y8MBDQ9EQ2Y3FXB',
        secretAccessKey: 'f3e2f5c3-be27-4741-8f35-eafdf4ca148d'
      }
    });
  }

  /**
   * @param dpeCode {string}
   * @return {Promise<object>}
   */
  getFile(dpeCode) {
    return fetch(`https://dpe.s3.fr-par.scw.cloud/${dpeCode}/${dpeCode}.json`)
      .then((response) => response.json())
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
