import { transformer } from '../../../streams/transformer';
import { streamToArray } from '../../../helpers/test-helper';
import { range } from '../../../helpers/helper-functions';

describe('fromIterable', () => {
    it('output all data from iterable', async () => {
        const arr = range(8, 1);
        const fromIterableTransform = transformer.fromIterable(arr);

        const result = await streamToArray(fromIterableTransform);
        expect(result).toEqual(arr);
    });

    it('output all data from async generator', async () => {
        function* asyncGenerator() {
            let i = 1;
            while (true) {
                yield i++;
                if (i === 9) break;
            }
        }
        const fromIterableTransform = transformer.fromIterable(asyncGenerator());

        const result = await streamToArray(fromIterableTransform);
        expect(result).toEqual(range(8, 1));
    });
});
