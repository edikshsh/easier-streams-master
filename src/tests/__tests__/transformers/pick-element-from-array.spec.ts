import { Readable } from 'stream';
import { transformer } from '../../../streams/transformer';
import { streamToArray } from '../../helpers-for-tests';

describe('pickElementFromArray', () => {
    it('should pick the correct element', async () => {
        const source = Readable.from([
            [1, 2, 3],
            [4, 5, 6],
            [7, 8],
        ]);
        const pickFromArrayTransform = source.pipe(transformer.pickElementFromArray<number>(0));

        const result = await streamToArray(pickFromArrayTransform);
        expect(result).toEqual([1, 4, 7]);
    });
});
