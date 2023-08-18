import { Readable } from 'stream';
import { StreamError } from '../../../streams/errors/stream-error';
import { SimpleAsyncTransform } from '../../../streams/transforms/base/simple-async-transform';
import { addAsync, DEFAULT_ERROR_TEXT, getFailOnNumberAsyncFunction, streamToArray } from '../../helpers-for-tests';

describe('SimpleAsyncTransform', () => {
    it('creates a typed transform from function', async () => {
        const source = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
        const add1Transform = new SimpleAsyncTransform(addAsync(1), { objectMode: true });

        source.pipe(add1Transform);

        const result = await streamToArray(add1Transform);
        expect(result).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('pipes created transforms correctly', async () => {
        const source = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
        const filterOutOdds = async (n: number) => (n % 2 ? n : undefined);
        const numberToString = async (n: number) => n.toString();

        const add1Transform = new SimpleAsyncTransform(addAsync(1), { objectMode: true });
        const filterOutOddsTranform = new SimpleAsyncTransform(filterOutOdds, { objectMode: true });
        const numberToStringTrasnform = new SimpleAsyncTransform(numberToString, { objectMode: true });

        source.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);

        const result = await streamToArray(numberToStringTrasnform);

        expect(result).toEqual(['3', '5', '7', '9']);
    });

    it('handles non immediate async functions', async () => {
        const source = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
        const filterOutOdds = async (n: number) => {
            await new Promise((res) => setTimeout(res, 10));
            return n % 2 ? n : undefined;
        };
        const numberToString = async (n: number) => n.toString();

        const add1Transform = new SimpleAsyncTransform(addAsync(1), { objectMode: true });
        const filterOutOddsTranform = new SimpleAsyncTransform(filterOutOdds, { objectMode: true });
        const numberToStringTrasnform = new SimpleAsyncTransform(numberToString, { objectMode: true });

        source.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);

        const result = await streamToArray(numberToStringTrasnform);

        expect(result).toEqual(['3', '5', '7', '9']);
    });

    it('formats chunk on errors', async () => {
        const source = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
        const chunkFormatter = (chunk: number) => ({ num: chunk });

        const throwingTransform = new SimpleAsyncTransform(getFailOnNumberAsyncFunction(4), {
            objectMode: true,
            shouldPushErrorsForward: true,
            chunkFormatter,
        });

        source.pipe(throwingTransform);

        const result = await streamToArray(throwingTransform);

        expect(result).toStrictEqual([1, 2, 3, new StreamError(Error(DEFAULT_ERROR_TEXT), { num: 4 }), 5, 6, 7, 8]);
    });
    it('Ignores errors given ignoreErrors true', async () => {
        const source = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);

        const throwingTransform = new SimpleAsyncTransform(getFailOnNumberAsyncFunction(4), {
            objectMode: true,
            ignoreErrors: true,
        });

        source.pipe(throwingTransform);
        const result = await streamToArray(throwingTransform);
        expect(result).toStrictEqual([1, 2, 3, 5, 6, 7, 8]);
    });

    it('Ignores errors given ignoreErrors true even when passing error stream', async () => {
        const source = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);

        const throwingTransform = new SimpleAsyncTransform(getFailOnNumberAsyncFunction(4), {
            objectMode: true,
            ignoreErrors: true,
            shouldPushErrorsForward: true,
        });

        source.pipe(throwingTransform);

        const result = await streamToArray(throwingTransform);

        expect(result).toStrictEqual([1, 2, 3, 5, 6, 7, 8]);
    });
});
