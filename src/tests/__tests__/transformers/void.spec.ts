import { Readable } from 'stream';
import { transformer } from '../../../streams/transformer';
import { streamToArray } from '../../../helpers/test-helper';
import { range } from '../../../helpers/helper-functions';

describe('void', () => {
    it('should throw away all data', async () => {
        const source = Readable.from(range(8, 1));
        const voidTransform = source.pipe(transformer.void());

        const result = await streamToArray(voidTransform);
        expect(result).toEqual([]);
    });
});
