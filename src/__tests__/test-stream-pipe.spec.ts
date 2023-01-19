import { Readable } from 'stream';
import { SimpleAsyncTransform } from '../streams/transforms/base/simple-async-transform';
import { SimpleTransform } from '../streams/transforms/base/simple-transform';
import { getStreamPipe } from '../streams/stream-pipe';
import { sleep, streamEnd } from './helpers-for-tests';
import { TypedPassThrough } from '../streams/transforms/utility/typed-pass-through';
import { transformer } from '../streams/transforms-helper';

describe('Stream pipe', () => {
    it('should pipe transforms', async () => {
        const source = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]).pipe(new TypedPassThrough<number>({ objectMode: true }));
        const add1 = async (n: number) => n + 1;
        const create3ElementsFrom1 = (n: number) => [n + 1, n + 2, n + 3];
        const takeOnlyFirstElementOfArray = (arr: unknown[]) => arr[0];
        const filterOutOdds = (n: number) => (n % 2 ? undefined : n);
        const numberToString = (n: number) => n.toString();

        const add1Transform = new SimpleAsyncTransform(add1, { objectMode: true });
        const create3ElementsFrom1Transform = new SimpleTransform(create3ElementsFrom1, { objectMode: true });
        const takeOnlyFirstElementOfArrayTransform = new SimpleTransform(takeOnlyFirstElementOfArray, {
            objectMode: true,
        });
        const filterOutOddsTranform = new SimpleTransform(filterOutOdds, { objectMode: true });
        const numberToStringTrasnform = new SimpleTransform(numberToString, { objectMode: true });

        const streamPipe = getStreamPipe(
            source,
            add1Transform,
            create3ElementsFrom1Transform,
            takeOnlyFirstElementOfArrayTransform,
            filterOutOddsTranform,
            numberToStringTrasnform,
        );

        const result: number[] = [];
        streamPipe.destination.on('data', (data: number) => result.push(data));

        await streamEnd(streamPipe.destination);
        expect(result).toEqual(['4', '6', '8', '10']);
    });

    it('should pipe async transforms', async () => {
        const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]).pipe(new TypedPassThrough<number>({ objectMode: true }));

        const add1 = async (n: number) => n + 1;
        const create3ElementsFrom1 = async (n: number) => {
            await sleep(100);
            return [n + 1, n + 2, n + 3];
        };
        const takeOnlyFirstElementOfArray = (arr: unknown[]) => arr[0];
        const filterOutOdds = (n: number) => (n % 2 ? undefined : n);
        const numberToString = (n: number) => n.toString();

        const add1Transform = new SimpleAsyncTransform(add1, { objectMode: true });
        const create3ElementsFrom1Transform = new SimpleAsyncTransform(create3ElementsFrom1, { objectMode: true });
        const takeOnlyFirstElementOfArrayTransform = new SimpleTransform(takeOnlyFirstElementOfArray, {
            objectMode: true,
        });
        const filterOutOddsTranform = new SimpleTransform(filterOutOdds, { objectMode: true });
        const numberToStringTrasnform = new SimpleTransform(numberToString, { objectMode: true });

        const streamPipe = getStreamPipe(
            a,
            add1Transform,
            create3ElementsFrom1Transform,
            takeOnlyFirstElementOfArrayTransform,
            filterOutOddsTranform,
            numberToStringTrasnform,
        );

        const result: string[] = [];
        streamPipe.on('data', (data) => result.push(data));
        await streamEnd(streamPipe.destination);
        expect(result).toEqual(['4', '6', '8', '10']);
    });

    it('should promisify the end of stream correctly', async () => {
        const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]).pipe(
            new SimpleTransform((n: number) => n, { objectMode: true }),
        );
        const add1 = async (n: number) => n + 1;
        const create3ElementsFrom1 = async (n: number) => {
            await sleep(100);
            return [n + 1, n + 2, n + 3];
        };
        const takeOnlyFirstElementOfArray = (arr: unknown[]) => arr[0];
        const filterOutOdds = (n: number) => (n % 2 ? undefined : n);
        const numberToString = (n: number) => n.toString();

        const add1Transform = new SimpleAsyncTransform(add1, { objectMode: true });
        const create3ElementsFrom1Transform = new SimpleAsyncTransform(create3ElementsFrom1, { objectMode: true });
        const takeOnlyFirstElementOfArrayTransform = new SimpleTransform(takeOnlyFirstElementOfArray, {
            objectMode: true,
        });
        const filterOutOddsTranform = new SimpleTransform(filterOutOdds, { objectMode: true });
        const numberToStringTrasnform = new SimpleTransform(numberToString, { objectMode: true });

        const streamPipe = getStreamPipe(
            a,
            add1Transform,
            create3ElementsFrom1Transform,
            takeOnlyFirstElementOfArrayTransform,
            filterOutOddsTranform,
            numberToStringTrasnform,
        );

        const result: string[] = [];
        streamPipe.on('data', (data) => result.push(data));
        await streamPipe.promisifyEvents(['end']);
        expect(result).toEqual(['4', '6', '8', '10']);
    });

    it('should work', async () => {
        const source = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]).pipe(new TypedPassThrough<number>({ objectMode: true }));
        const add1 = async (n: number) => n + 1;
        const create3ElementsFrom1 = (n: number) => [n + 1, n + 2, n + 3];
        const takeOnlyFirstElementOfArray = async (arr: unknown[]) => arr[0];
        const filterOutOdds = (n: number) => !(n % 2);
        const numberToString = (n: number) => n.toString();

        const add1Transform = transformer.async.fromFunction(add1);
        const create3ElementsFrom1Transform = new SimpleTransform(create3ElementsFrom1, { objectMode: true });
        const takeOnlyFirstElementOfArrayTransform = new SimpleAsyncTransform(takeOnlyFirstElementOfArray, {
            objectMode: true,
        });
        const filterOutOddsTranform = transformer.filter(filterOutOdds);
        const numberToStringTrasnform = new SimpleTransform(numberToString, { objectMode: true });

        const streamPipe = getStreamPipe(
            source,
            add1Transform,
            create3ElementsFrom1Transform,
            takeOnlyFirstElementOfArrayTransform,
            filterOutOddsTranform,
            numberToStringTrasnform,
        );

        const result: number[] = [];
        streamPipe.destination.on('data', (data: number) => result.push(data));

        await streamEnd(streamPipe.destination);

        expect(result).toEqual(['4', '6', '8', '10']);
    });
});
