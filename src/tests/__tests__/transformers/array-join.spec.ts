import { Readable } from 'stream';
import { streamToArray } from '../../../helpers/test-helper';
import { arrayJoinTransform } from '../../../streams/transforms/utility/array-join-transform';

describe('ArrayJoinTransform', () => {
    it('should join input into arrays of correct length', async () => {
        const source = Readable.from([1, 2, 3, 4, 5, 6]);
        const arrayJoiner = source.pipe(arrayJoinTransform<number>(3, { objectMode: true }));

        const result = await streamToArray(arrayJoiner);
        expect(result).toEqual([
            [1, 2, 3],
            [4, 5, 6],
        ]);
    });

    it('should flush remaining data even if array is not full', async () => {
        const source = Readable.from([1, 2, 3, 4, 5, 6, 7]);
        const arrayJoiner = source.pipe(arrayJoinTransform<number>(3, { objectMode: true }));

        const result = await streamToArray(arrayJoiner);

        expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    });
});
