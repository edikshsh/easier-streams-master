import { noop } from 'lodash';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { transformer } from '../../../streams/transformer';
import {
    DEFAULT_ERROR_TEXT,
    delayer,
    delayerMult2,
    getFailOnNumberAsyncFunctionMult2,
    getFailOnNumberFunction,
} from '../../helpers-for-tests';

describe('fromFunctionConcurrent', () => {
    it('should return correct but unordered output', async () => {
        const delay = 20;
        const inputLength = 200;
        const arr = [...Array(inputLength).keys()].map((i) => i + 1);
        const expectedOutput = arr.map((n) => n * 2);
        const outArr: number[] = [];
        const action = async (n: number) => {
            await new Promise((res) => setTimeout(res, delay));
            return n * 2;
        };
        const concurrency = 5;

        const { input, output } = transformer.async.fromFunctionConcurrent(action, concurrency);

        Readable.from(arr).pipe(input);

        output.on('data', (data) => {
            outArr.push(data);
        });
        await output.promisifyEvents(['end'], ['error']);
        outArr.sort((a, b) => a - b);
        expect(outArr).toEqual(expectedOutput);
    });
    it('should take less time then running sequentially', async () => {
        const delay = 10;
        const inputLength = 100;
        const estimatedRunTimeSequential = delay * inputLength;
        const arr = [...Array(inputLength).keys()];
        const startTime = Date.now();
        const concurrency = 5;

        const { input, output } = transformer.async.fromFunctionConcurrent(delayer(delay), concurrency);

        Readable.from(arr).pipe(input);

        output.on('data', noop);
        await output.promisifyEvents(['end'], ['error']);
        expect(estimatedRunTimeSequential).toBeGreaterThan(Date.now() - startTime);
    });
    it('should send error to output if one of the concurrent actions fails', async () => {
        const delay = 10;
        const inputLength = 100;
        const errorOnIndex = 20;
        const arr = [...Array(inputLength).keys()];
        const outArr: number[] = [];

        const concurrency = 5;

        const { input, output } = transformer.async.fromFunctionConcurrent(
            getFailOnNumberAsyncFunctionMult2(errorOnIndex, delay),
            concurrency,
        );

        Readable.from(arr).pipe(input);

        output.on('data', (data) => {
            outArr.push(data);
        });
        await expect(output.promisifyEvents(['end'], ['error'])).rejects.toThrow(DEFAULT_ERROR_TEXT);
        expect(outArr.length).toBeLessThan(errorOnIndex);
    });

    it('doesnt break backpressure', async () => {
        const delay = 10;
        const inputLength = 100;
        const arr = [...Array(inputLength).keys()];
        const outArr: number[] = [];
        let chunksPassedInInput = 0;

        const concurrency = 2;

        const { input, output } = transformer.async.fromFunctionConcurrent(delayer(delay), concurrency);

        Readable.from(arr).pipe(input);
        input.on('data', () => chunksPassedInInput++);

        output.on('data', (data) => {
            outArr.push(data);
        });
        await input.promisifyEvents(['end'], ['error']);
        expect(chunksPassedInInput).toEqual(inputLength);
        expect(outArr.length).toBe(0);
        await output.promisifyEvents(['end'], ['error']);
        expect(outArr.length).toBe(inputLength);
    });

    it('should not break pipeline chain of error passing if error comes before concurrent', async () => {
        const delay = 10;
        const inputLength = 30;
        const errorOnIndex = 10;
        const arr = [...Array(inputLength).keys()];
        const outArr: number[] = [];

        const concurrency = 5;

        const erroringTransform = transformer.fromFunction(getFailOnNumberFunction(4));
        const { input, output } = transformer.async.fromFunctionConcurrent(delayer(delay), concurrency);

        const source = transformer.fromIterable(arr);
        pipeline(source as Transform, erroringTransform, input).catch(noop);
        pipeline(output, transformer.void()).catch(noop);

        output.on('data', (data) => {
            outArr.push(data);
        });
        await expect(source.promisifyEvents('close', 'error')).rejects.toThrow(DEFAULT_ERROR_TEXT);
        expect(outArr.length).toBeLessThan(errorOnIndex);
    });

    it('should not break pipeline chain of error passing if error comes after concurrent', async () => {
        const delay = 10;
        const inputLength = 30;
        const errorOnIndex = 10;
        const arr = [...Array(inputLength).keys()];
        const outArr: number[] = [];

        const concurrency = 5;

        const erroringTransform = transformer.fromFunction(getFailOnNumberFunction(4));
        const passThrough = transformer.passThrough<number>();
        const { input, output } = transformer.async.fromFunctionConcurrent(delayer(delay), concurrency, {});

        const source = Readable.from(arr);
        pipeline(source, input).catch(noop);
        pipeline(output as Transform, erroringTransform, passThrough).catch(noop);

        passThrough.on('data', (data) => {
            outArr.push(data);
        });

        await expect(passThrough.promisifyEvents('end', 'error')).rejects.toThrow(DEFAULT_ERROR_TEXT);
        expect(outArr.length).toBeLessThan(errorOnIndex);
    });

    it('should not break pipeline chain of error passing if concurrent errors', async () => {
        const delay = 10;
        const inputLength = 30;
        const errorOnIndex = 10;
        const arr = [...Array(inputLength).keys()];
        const outArr: number[] = [];
        const concurrency = 5;

        const passThrough = transformer.passThrough<number>();
        const { input, output } = transformer.async.fromFunctionConcurrent(
            getFailOnNumberAsyncFunctionMult2(errorOnIndex, delay),
            concurrency,
            {},
        );

        const source = Readable.from(arr);
        pipeline(source, input).catch(() => undefined);
        pipeline(output, passThrough).catch(() => undefined);

        passThrough.on('data', (data) => {
            outArr.push(data);
        });

        await expect(passThrough.promisifyEvents('end', 'error')).rejects.toThrow(DEFAULT_ERROR_TEXT);
        expect(outArr.length).toBeLessThan(errorOnIndex);
    });

    it('should return correct data when using pipeline', async () => {
        const delay = 10;
        const inputLength = 30;
        const arr = [...Array(inputLength).keys()];
        const outArr: number[] = [];
        const expectedOutput = arr.map((n) => n * 2);

        const concurrency = 5;

        const passThrough = transformer.passThrough<number>();
        const { input, output } = transformer.async.fromFunctionConcurrent(delayerMult2(delay), concurrency, {});

        const source = Readable.from(arr);
        pipeline(source, input).catch(() => undefined);
        pipeline(output, passThrough).catch(() => undefined);

        output.on('data', (data) => {
            outArr.push(data);
        });
        await output.promisifyEvents('end', 'error');
        expect(outArr).toEqual(expectedOutput);
    });
});
