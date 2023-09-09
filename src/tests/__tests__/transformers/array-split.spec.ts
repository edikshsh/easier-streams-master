import { Readable } from 'stream';
import { arraySplitTransform } from '../../../streams/transforms/utility/array-split-transform';
import { range } from '../../../helpers/helper-functions';
import { streamToArray } from '../../../helpers/test-helper';

describe('ArraySplitTransform', () => {
    it('should split array correctly', async () => {
        const source = Readable.from([
            [1, 2, 3],
            [4, 5, 6],
            [7, 8],
        ]);
        const arraySplitter = source.pipe(arraySplitTransform<number[]>({ objectMode: true }));

        const result = await streamToArray(arraySplitter);

        expect(result).toEqual(range(8, 1));
    });
});
