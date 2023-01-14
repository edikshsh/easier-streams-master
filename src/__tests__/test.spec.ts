import { Readable } from 'stream';
import { SimpleAsyncTransform } from '../streams/transforms/base/simple-async-transform';
import { SimpleTransform } from '../streams/transforms/base/simple-transform';
import { ArrayJoinTransform } from '../streams/transforms/utility/array-join-transform';
import { ArraySplitTransform } from '../streams/transforms/utility/array-split-transform';
import { streamEnd } from './helpers-for-tests';

describe('Test transforms', () => {
    describe('ArrayJoinTransform', () => {
        it('should join input into arrays of correct length', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6]);
            const b = a.pipe(new ArrayJoinTransform<number>(3, { objectMode: true }));

            const result: number[][] = [];
            b.on('data', (data: number[]) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([
                [1, 2, 3],
                [4, 5, 6],
            ]);
        });
        it('should flush remaining data even if array is not full', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7]);
            const b = a.pipe(new ArrayJoinTransform<number>(3, { objectMode: true }));

            const result: number[][] = [];
            b.on('data', (data: number[]) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
        });
    });

    describe('ArraySplitTransform', () => {
        it('should split array correctly', async () => {
            const a = Readable.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8],
            ]);
            const b = a.pipe(new ArraySplitTransform<number[]>({ objectMode: true }));

            const result: number[] = [];
            b.on('data', (data: number) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
        });
    });

    describe('SimpleTransform', () => {
        it('creates a typed transform from function', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const add1 = (n: number) => n + 1;
            const add1Transform = new SimpleTransform(add1, { objectMode: true });

            a.pipe(add1Transform);

            const result: number[] = [];
            add1Transform.on('data', (data) => result.push(data));

            await streamEnd(add1Transform);
            expect(result).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
        });

        it('pipes created transforms correctly', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const add1 = (n: number) => n + 1;
            const filterOutOdds = (n: number) => (n % 2 ? n : undefined);
            const numberToString = (n: number) => n.toString();

            const add1Transform = new SimpleTransform(add1, { objectMode: true });
            const filterOutOddsTranform = new SimpleTransform(filterOutOdds, { objectMode: true });
            const numberToStringTrasnform = new SimpleTransform(numberToString, { objectMode: true });

            a.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);

            const result: string[] = [];
            numberToStringTrasnform.on('data', (data) => result.push(data));

            await streamEnd(numberToStringTrasnform);
            expect(result).toEqual(['3', '5', '7', '9']);
        });
    });
    describe('SimpleAsyncTransform', () => {
        it('creates a typed transform from function', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const add1 = async (n: number) => n + 1;
            const add1Transform = new SimpleAsyncTransform(add1, { objectMode: true });

            a.pipe(add1Transform);

            const result: number[] = [];
            add1Transform.on('data', (data) => result.push(data));

            await streamEnd(add1Transform);
            expect(result).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
        });

        it('pipes created transforms correctly', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const add1 = async (n: number) => n + 1;
            const filterOutOdds = async (n: number) => (n % 2 ? n : undefined);
            const numberToString = async (n: number) => n.toString();

            const add1Transform = new SimpleAsyncTransform(add1, { objectMode: true });
            const filterOutOddsTranform = new SimpleAsyncTransform(filterOutOdds, { objectMode: true });
            const numberToStringTrasnform = new SimpleAsyncTransform(numberToString, { objectMode: true });

            a.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);

            const result: string[] = [];
            numberToStringTrasnform.on('data', (data) => result.push(data));

            await streamEnd(numberToStringTrasnform);
            expect(result).toEqual(['3', '5', '7', '9']);
        });

        it('handles non immediate async functions', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const add1 = async (n: number) => n + 1;
            const filterOutOdds = async (n: number) => {
                await new Promise((res) => setTimeout(res, 100));
                return n % 2 ? n : undefined;
            };
            const numberToString = async (n: number) => n.toString();

            const add1Transform = new SimpleAsyncTransform(add1, { objectMode: true });
            const filterOutOddsTranform = new SimpleAsyncTransform(filterOutOdds, { objectMode: true });
            const numberToStringTrasnform = new SimpleAsyncTransform(numberToString, { objectMode: true });

            a.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);

            const result: string[] = [];
            numberToStringTrasnform.on('data', (data) => result.push(data));

            await streamEnd(numberToStringTrasnform);
            expect(result).toEqual(['3', '5', '7', '9']);
        });
    });

    it('Able to mix different transforms in a single stream', async () => {
        const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
        const add1 = (n: number) => n + 1;
        const filterOutOdds = async (n: number) => {
            await new Promise((res) => setTimeout(res, 100));
            return n % 2 ? n : undefined;
        };
        const numberToString = async (n: number) => n.toString();

        const add1Transform = new SimpleTransform(add1, { objectMode: true });
        const filterOutOddsTranform = new SimpleAsyncTransform(filterOutOdds, { objectMode: true });
        const numberToStringTrasnform = new SimpleAsyncTransform(numberToString, { objectMode: true });

        a.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);

        const result: string[] = [];
        numberToStringTrasnform.on('data', (data) => result.push(data));

        await streamEnd(numberToStringTrasnform);
        expect(result).toEqual(['3', '5', '7', '9']);
    });
});
