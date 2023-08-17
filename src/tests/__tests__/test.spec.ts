import { Readable } from 'stream';
import { StreamError } from '../../streams/errors/stream-error';
import { SimpleAsyncTransform } from '../../streams/transforms/base/simple-async-transform';
import { SimpleTransform } from '../../streams/transforms/base/simple-transform';
import { arrayJoinTransform } from '../../streams/transforms/utility/array-join-transform';
import { arraySplitTransform } from '../../streams/transforms/utility/array-split-transform';
import {
    add, addAsync,
    DEFAULT_ERROR_TEXT,
    getFailOnNumberAsyncFunction,
    getFailOnNumberFunction, numberToString, numberToStringAsync,
    sleep,
    streamToArray,
} from '../helpers-for-tests';

describe('Test transforms', () => {
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

    describe('ArraySplitTransform', () => {
        it('should split array correctly', async () => {
            const source = Readable.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8],
            ]);
            const arraySplitter = source.pipe(arraySplitTransform<number[]>({ objectMode: true }));

            const result = await streamToArray(arraySplitter);

            expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
        });
    });

    describe('SimpleTransform', () => {
        it('creates a typed transform from function', async () => {
            const source = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const add1Transform = new SimpleTransform(add(1), { objectMode: true });

            source.pipe(add1Transform);

            const result = await streamToArray(add1Transform);

            expect(result).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
        });

        it('pipes created transforms correctly', async () => {
            const source = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const filterOutOdds = (n: number) => (n % 2 ? n : undefined);

            const add1Transform = new SimpleTransform(add(1), { objectMode: true });
            const filterOutOddsTransform = new SimpleTransform(filterOutOdds, { objectMode: true });
            const numberToStringTransform = new SimpleTransform(numberToString, { objectMode: true });

            source.pipe(add1Transform).pipe(filterOutOddsTransform).pipe(numberToStringTransform);

            const result = await streamToArray(numberToStringTransform);

            expect(result).toEqual(['3', '5', '7', '9']);
        });
        it('formats chunk on errors', async () => {
            const source = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const chunkFormatter = (chunk: number) => ({ num: chunk });

            const throwingTransform = new SimpleTransform(getFailOnNumberFunction(4), {
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

            const throwingTransform = new SimpleTransform(getFailOnNumberFunction(4), {
                objectMode: true,
                ignoreErrors: true,
            });

            source.pipe(throwingTransform);

            const result = await streamToArray(throwingTransform);

            expect(result).toStrictEqual([1, 2, 3, 5, 6, 7, 8]);
        });

        it('Ignores errors given ignoreErrors true even when passing error stream', async () => {
            const source = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);

            const throwingTransform = new SimpleTransform(getFailOnNumberFunction(4), {
                objectMode: true,
                ignoreErrors: true,
                shouldPushErrorsForward: true,
            });

            source.pipe(throwingTransform);

            const result = await streamToArray(throwingTransform);

            expect(result).toStrictEqual([1, 2, 3, 5, 6, 7, 8]);
        });
    });
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
