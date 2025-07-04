import { parse } from 'fast-csv';

export default class CsvParserStore {
  /**
   * @param stream {ReadStream}
   * @param opts {import('fast-csv').ParserOptionsArgs}
   * @param transform {import('fast-csv').RowTransformFunction}
   * @return Promise<object[]>
   */
  parseFromStream(stream, opts, transform) {
    const rows = [];
    return new Promise((resolve, reject) => {
      stream
        .pipe(parse(opts).transform(transform))
        .on('error', (error) => reject(error))
        .on('data', (row) => rows.push(row))
        .on('end', () => resolve(rows));
    });
  }
}
