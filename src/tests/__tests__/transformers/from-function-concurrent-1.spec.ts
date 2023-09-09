import { noop } from 'lodash';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { transformer } from '../../../streams/transformer';
import { range, sleep, streamEnd } from '../../../helpers/helper-functions';
import {
    DEFAULT_ERROR_TEXT,
    delayer,
    delayerMult2,
    getFailOnNumberAsyncFunctionMult2,
    getFailOnNumberFunction,
    streamToArray,
} from '../../../helpers/test-helper';

describe('fromFunctionConcurrent', () => {
    const DELAY = 10;
    const INPUT_LENGTH = 50;

    it('should return correct but unordered output', async () => {
        const arr = range(200, 1);
        const expectedOutput = arr.map((n) => n * 2);
        const action = async (n: number) => {
            await sleep(DELAY);
            return n * 2;
        };
        const concurrency = 5;

        const { input, output } = transformer.async.fromFunctionConcurrent(action, concurrency);

        Readable.from(arr).pipe(input);
        const outArr = await streamToArray(output);

        outArr.sort((a, b) => a - b);
        expect(outArr).toEqual(expectedOutput);
    });

    it('should take less time then running sequentially', async () => {
        const estimatedRunTimeSequential = DELAY * INPUT_LENGTH;
        const arr = [...Array(INPUT_LENGTH).keys()];
        const startTime = Date.now();
        const concurrency = 5;

        const { input, output } = transformer.async.fromFunctionConcurrent(delayer(DELAY), concurrency);

        Readable.from(arr).pipe(input);
        await streamToArray(output);

        expect(estimatedRunTimeSequential).toBeGreaterThan(Date.now() - startTime);
    });

    it('should send error to output if one of the concurrent actions fails', async () => {
        const errorOnIndex = 20;
        const arr = [...Array(INPUT_LENGTH).keys()];
        const outArr: number[] = [];

        const concurrency = 5;

        const { input, output } = transformer.async.fromFunctionConcurrent(
            getFailOnNumberAsyncFunctionMult2(errorOnIndex, DELAY),
            concurrency,
        );

        Readable.from(arr).pipe(input);

        output.on('data', (data) => {
            outArr.push(data);
        });
        await expect(streamEnd(output)).rejects.toThrow(DEFAULT_ERROR_TEXT);
        expect(outArr.length).toBeLessThan(errorOnIndex);
    });

    it('should not break pipeline chain of error passing if error comes before concurrent', async () => {
        const errorOnIndex = 10;
        const arr = [...Array(INPUT_LENGTH).keys()];
        const outArr: number[] = [];

        const concurrency = 5;

        const erroringTransform = transformer.fromFunction(getFailOnNumberFunction(4));
        const { input, output } = transformer.async.fromFunctionConcurrent(delayer(DELAY), concurrency);

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
        const errorOnIndex = 10;
        const arr = [...Array(INPUT_LENGTH).keys()];
        const outArr: number[] = [];

        const concurrency = 5;

        const erroringTransform = transformer.fromFunction(getFailOnNumberFunction(4));
        const passThrough = transformer.passThrough<number>();
        const { input, output } = transformer.async.fromFunctionConcurrent(delayer(DELAY), concurrency, {});

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
        const errorOnIndex = 10;
        const arr = [...Array(INPUT_LENGTH).keys()];
        const outArr: number[] = [];
        const concurrency = 5;

        const passThrough = transformer.passThrough<number>();
        const { input, output } = transformer.async.fromFunctionConcurrent(
            getFailOnNumberAsyncFunctionMult2(errorOnIndex, DELAY),
            concurrency,
            {},
        );

        const source = Readable.from(arr);
        pipeline(source, input).catch(noop);
        pipeline(output, passThrough).catch(noop);

        passThrough.on('data', (data) => {
            outArr.push(data);
        });

        await expect(passThrough.promisifyEvents('end', 'error')).rejects.toThrow(DEFAULT_ERROR_TEXT);
        expect(outArr.length).toBeLessThan(errorOnIndex);
    });

    it('should return correct data when using pipeline', async () => {
        const arr = [...Array(INPUT_LENGTH).keys()];
        const outArr: number[] = [];
        const expectedOutput = arr.map((n) => n * 2);

        const concurrency = 5;

        const { input, output } = transformer.async.fromFunctionConcurrent(delayerMult2(DELAY), concurrency, {});

        const source = Readable.from(arr);
        pipeline(source, input).catch(noop);

        output.on('data', (data) => {
            outArr.push(data);
        });

        await output.promisifyEvents('end', 'error');
        expect(outArr).toEqual(expectedOutput);
    });
});
