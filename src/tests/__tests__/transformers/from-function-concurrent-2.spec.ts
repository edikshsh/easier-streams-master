import { noop } from 'lodash';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { transformer } from '../../../streams/transformer';
import { DEFAULT_ERROR_TEXT, delayer, delayerMult2, getFailOnNumberAsyncFunctionMult2 } from '../../helpers-for-tests';

describe('fromFunctionConcurrent2', () => {
    const errorOn4 = (n: number) => {
        if (n === 4) {
            throw Error(DEFAULT_ERROR_TEXT);
        }
        return n;
    };
    it('should return correct but unordered output', async () => {
        const delay = 20;
        const inputLength = 200;
        const arr = [...Array(inputLength).keys()].map((i) => i + 1);
        const expectedOutput = arr.map((n) => n * 2);
        const outArr: number[] = [];

        const concurrency = 5;

        const concurrentTransform = transformer.async.fromFunctionConcurrent2(delayerMult2(delay), concurrency);

        Readable.from(arr).pipe(concurrentTransform);

        concurrentTransform.on('data', (data) => {
            outArr.push(data);
        });
        await concurrentTransform.promisifyEvents(['end'], ['error']);
        outArr.sort((a, b) => a - b);
        expect(outArr).toEqual(expectedOutput);
    });
    it('should take less time then running sequentially', async () => {
        const delay = 20;
        const inputLength = 100;
        const estimatedRunTimeSequential = delay * inputLength;
        const arr = [...Array(inputLength).keys()];
        const startTime = Date.now();

        const concurrency = 5;

        const concurrentTransform = transformer.async.fromFunctionConcurrent2(delayerMult2(delay), concurrency);

        Readable.from(arr).pipe(concurrentTransform);

        concurrentTransform.on('data', noop);
        await concurrentTransform.promisifyEvents(['end'], ['error']);
        expect(estimatedRunTimeSequential).toBeGreaterThan(Date.now() - startTime);
    });
    it('should send error to output if one of the concurrent actions fails', async () => {
        const delay = 10;
        const inputLength = 100;
        const errorOnIndex = 20;
        const arr = [...Array(inputLength).keys()];
        const outArr: number[] = [];
        const concurrency = 5;

        const concurrentTransform = transformer.async.fromFunctionConcurrent2(
            getFailOnNumberAsyncFunctionMult2(errorOnIndex, delay),
            concurrency,
        );

        Readable.from(arr).pipe(concurrentTransform);

        concurrentTransform.on('data', (data) => {
            outArr.push(data);
        });
        await expect(concurrentTransform.promisifyEvents(['end'], ['error'])).rejects.toThrow(DEFAULT_ERROR_TEXT);
        expect(outArr.length).toBeLessThan(errorOnIndex);
    });

    it('should not break pipeline chain of error passing if error comes before concurrent', async () => {
        const delay = 10;
        const inputLength = 30;
        const arr = [...Array(inputLength).keys()];

        const concurrency = 5;
        const erroringTransform = transformer.fromFunction(errorOn4);
        const concurrentTransform = transformer.async.fromFunctionConcurrent2(delayer(delay), concurrency);

        const source = transformer.fromIterable(arr);

        const streamDonePromise = concurrentTransform.promisifyEvents('close', 'error');
        pipeline(source as Transform, erroringTransform, concurrentTransform).catch(noop);
        await expect(streamDonePromise).rejects.toThrow(DEFAULT_ERROR_TEXT);
    });

    it('should not break pipeline chain of error passing if error comes after concurrent', async () => {
        const delay = 10;
        const inputLength = 30;
        const arr = [...Array(inputLength).keys()];

        const concurrency = 5;
        const concurrentTransform = transformer.async.fromFunctionConcurrent2(delayer(delay), concurrency);
        const erroringTransform = transformer.fromFunction(errorOn4);
        const passThrough = transformer.passThrough();

        const source = transformer.fromIterable(arr);
        const p = passThrough.promisifyEvents('close', 'error');

        pipeline(source as Transform, concurrentTransform, erroringTransform, passThrough).catch(noop);
        await expect(p).rejects.toThrow(DEFAULT_ERROR_TEXT);
    });

    it('should not break pipeline chain of error passing if concurrent errors', async () => {
        const delay = 10;
        const inputLength = 30;
        const errorOnIndex = 10;
        const arr = [...Array(inputLength).keys()];

        const concurrency = 5;
        const concurrentTransform = transformer.async.fromFunctionConcurrent2(
            getFailOnNumberAsyncFunctionMult2(errorOnIndex, delay),
            concurrency,
        );
        const passThrough = transformer.passThrough();

        const source = transformer.fromIterable(arr);
        const p = passThrough.promisifyEvents('close', 'error');

        pipeline(source as Transform, concurrentTransform, passThrough).catch(noop);
        await expect(p).rejects.toThrow(DEFAULT_ERROR_TEXT);
    });

    it('doesnt break backpressure', async () => {
        const delay = 10;
        const inputLength = 300;
        const arr = [...Array(inputLength).keys()];
        const outArr: number[] = [];
        let chunksPassedInInput = 0;
        const concurrency = 2;

        const concurrentTransform = transformer.async.fromFunctionConcurrent2(delayer(delay), concurrency);

        const readable = Readable.from(arr);
        readable.pipe(concurrentTransform);
        readable.on('data', () => chunksPassedInInput++);

        concurrentTransform.on('data', (data) => {
            outArr.push(data);
        });
        await new Promise<void>((resolve) => readable.on('close', resolve));
        expect(outArr.length).toBeGreaterThan(inputLength - 50);
        await concurrentTransform.promisifyEvents(['close'], ['error']);
        expect(outArr.length).toBe(300);
    });
});
