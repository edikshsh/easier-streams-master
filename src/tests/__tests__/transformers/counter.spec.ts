import { Readable } from 'stream';
import { transformer } from '../../../streams/transformer';
import { range } from '../../../helpers/helper-functions';
import { filterOutOddsAsync, filterOutOddsSync, streamToArray } from '../../../helpers/test-helper';

describe('counter', () => {
    describe('sync', () => {
        it('should pass all data without change', async () => {
            const arr = range(8, 1);
            const source = Readable.from(arr);

            const { transform: counterTransform } = transformer.counter();
            source.pipe(counterTransform);

            const result = await streamToArray(counterTransform);

            expect(result).toEqual(arr);
        });

        it('should count the number of chunks passed correctly', async () => {
            const readable = Readable.from(range(8, 1));
            const { transform: counterTransform, getCounter } = transformer.counter();
            readable.pipe(counterTransform);

            await streamToArray(counterTransform);
            expect(getCounter()).toEqual(8);
        });

        it('should count the number of chunks passed correctly when given a non default counter function', async () => {
            const source = Readable.from(range(8, 1));
            const { transform: counterTransform, getCounter } = transformer.counter(filterOutOddsSync);
            source.pipe(counterTransform);

            await streamToArray(counterTransform);
            expect(getCounter()).toEqual(4);
        });

        it('should pass all data even when given a non default counter function', async () => {
            const arr = range(8, 1);
            const source = Readable.from(arr);
            const { transform: counterTransform } = transformer.counter(filterOutOddsSync);
            source.pipe(counterTransform);

            const result = await streamToArray(counterTransform);

            expect(result).toEqual(arr);
        });
    });

    describe('async', () => {
        it('should count the number of chunks passed correctly when given a non default counter function', async () => {
            const source = Readable.from(range(8, 1));
            const { transform: counterTransform, getCounter } = transformer.async.counter(filterOutOddsAsync(10));
            source.pipe(counterTransform);

            await streamToArray(counterTransform);
            expect(getCounter()).toEqual(4);
        });

        it('should pass all data even when given a non default counter function', async () => {
            const arr = range(8, 1);
            const source = Readable.from(arr);
            const { transform: counterTransform } = transformer.async.counter(filterOutOddsAsync(10));
            source.pipe(counterTransform);

            const result = await streamToArray(counterTransform);

            expect(result).toEqual(arr);
        });
    });
});
