import { Readable } from 'stream';
import { transformer } from '../../../streams/transformer';
import { range, streamToArray } from '../../helpers-for-tests';

describe('typedPassThrough', () => {
    it('should pass items correctly', async () => {
        const arr = range(8, 1);
        const source = Readable.from(arr);
        const typedPassThroughTransform = source.pipe(transformer.passThrough<number>());

        const result = await streamToArray(typedPassThroughTransform);
        expect(result).toEqual(arr);
    });
});
