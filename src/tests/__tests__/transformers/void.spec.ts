import { Readable } from 'stream';
import { transformer } from '../../../streams/transformer';
import { range, streamToArray } from '../../helpers-for-tests';

describe('void', () => {
    it('should throw away all data', async () => {
        const source = Readable.from(range(8, 1));
        const voidTransform = source.pipe(transformer.void());

        const result = await streamToArray(voidTransform);
        expect(result).toEqual([]);
    });
});
