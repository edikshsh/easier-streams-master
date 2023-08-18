import { Readable } from 'stream';
import { SimpleAsyncTransform } from '../../../streams/transforms/base/simple-async-transform';
import { SimpleTransform } from '../../../streams/transforms/base/simple-transform';
import { add, numberToStringAsync, sleep, streamToArray } from '../../helpers-for-tests';

describe('integration tests', () => {
    it('Able to mix different transforms in a single stream', async () => {
        const source = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);

        const filterOutEvens = async (n: number) => {
            await sleep(10);
            return n % 2 ? n : undefined;
        };

        const add1Transform = new SimpleTransform(add(1), { objectMode: true });
        const filterOutOddsTransform = new SimpleAsyncTransform(filterOutEvens, { objectMode: true });
        const numberToStringTransform = new SimpleAsyncTransform(numberToStringAsync, { objectMode: true });

        source.pipe(add1Transform).pipe(filterOutOddsTransform).pipe(numberToStringTransform);

        const result = await streamToArray(numberToStringTransform);

        expect(result).toEqual(['3', '5', '7', '9']);
    });
});
