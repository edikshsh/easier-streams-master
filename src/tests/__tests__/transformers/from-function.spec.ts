import { Readable } from 'stream';
import { StreamError } from '../../../streams/errors/stream-error';
import { plumber } from '../../../streams/plumber';
import { transformer } from '../../../streams/transformer';
import { add, addAsync, DEFAULT_ERROR_TEXT, streamToArray } from '../../../helpers/test-helper';
import { noop, range } from '../../../helpers/helper-functions';

describe('fromFunction', () => {
    describe('sync', () => {
        it('creates a typed transform from function', async () => {
            const source = Readable.from(range(8, 1));
            const add1Transform = transformer.fromFunction(add(1), { objectMode: true });

            source.pipe(add1Transform);

            const result = await streamToArray(add1Transform);
            expect(result).toEqual(range(8, 2));
        });

        it('pipes created transforms correctly', async () => {
            const source = Readable.from(range(8, 1));
            const filterOutOdds = (n: number) => (n % 2 ? n : undefined);
            const numberToString = (n: number) => n.toString();

            const add1Transform = transformer.fromFunction(add(1));
            const filterOutOddsTranform = transformer.fromFunction(filterOutOdds);
            const numberToStringTrasnform = transformer.fromFunction(numberToString);

            source.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);

            const result = await streamToArray(numberToStringTrasnform);
            expect(result).toEqual(['3', '5', '7', '9']);
        });

        it('passes errors to error stream instead of closing if given an error stream', async () => {
            const source = transformer.fromIterable(range(8, 1));
            const errorStream = transformer.errorTransform<number>();
            const add1WithError = (n: number) => {
                if (n % 2 === 0) {
                    throw Error(DEFAULT_ERROR_TEXT);
                }
                return n + 1;
            };
            const add1Transform = transformer.fromFunction(add1WithError, { shouldPushErrorsForward: true });

            plumber.pipeOneToOne(source, add1Transform);
            const passThrough = transformer.passThrough<number>();
            plumber.pipeOneToOne(add1Transform, passThrough, { errorStream });

            const [result, errorResults] = await Promise.all([streamToArray(passThrough), streamToArray(errorStream)]);
            const errorExtractedValues = errorResults.map((result) => (result as StreamError<number>).data);
            expect(errorExtractedValues).toEqual([2, 4, 6, 8]);
            expect(result).toEqual([2, 4, 6, 8]);
        });

        it('doesnt pass errors to error stream if given an error stream without errors', async () => {
            const source = transformer.fromIterable(range(8, 1));
            const errorStream = transformer.errorTransform<number>();
            const add1Transform = transformer.fromFunction(add(1), { shouldPushErrorsForward: true });
            const voidTransform = transformer.void();
            plumber.pipeOneToOne(source, add1Transform, { errorStream });
            plumber.pipeOneToOne(add1Transform, voidTransform, { errorStream });

            const [result, errorResults] = await Promise.all([
                streamToArray(add1Transform),
                streamToArray(errorStream),
            ]);
            const errorExtractedValues = errorResults.map((result) => (result as StreamError<number>).data);
            expect(result).toEqual(range(8, 2));
            expect(errorExtractedValues).toEqual([]);
        });
    });

    describe('async', () => {
        it('creates a typed transform from async function', async () => {
            const source = Readable.from(range(8, 1));
            const add1Transform = transformer.async.fromFunction(addAsync(1), { objectMode: true });

            source.pipe(add1Transform);

            const result = await streamToArray(add1Transform);
            expect(result).toEqual(range(8, 2));
        });

        it('pipes created transforms correctly', async () => {
            const source = Readable.from(range(8, 1));
            const filterOutOdds = async (n: number) => (n % 2 ? n : undefined);
            const numberToString = async (n: number) => n.toString();

            const add1Transform = transformer.async.fromFunction(addAsync(1));
            const filterOutOddsTransform = transformer.async.fromFunction(filterOutOdds);
            const numberToStringTransform = transformer.async.fromFunction(numberToString);

            source.pipe(add1Transform).pipe(filterOutOddsTransform).pipe(numberToStringTransform);

            const result = await streamToArray(numberToStringTransform);
            expect(result).toEqual(['3', '5', '7', '9']);
        });

        it('handles non immediate async functions', async () => {
            const source = Readable.from(range(8, 1));
            const filterOutOdds = async (n: number) => {
                await new Promise((res) => setTimeout(res, 20));
                return n % 2 ? n : undefined;
            };
            const numberToString = async (n: number) => n.toString();

            const add1Transform = transformer.async.fromFunction(addAsync(1));
            const filterOutOddsTranform = transformer.async.fromFunction(filterOutOdds);
            const numberToStringTrasnform = transformer.async.fromFunction(numberToString);

            source.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);

            const result = await streamToArray(numberToStringTrasnform);
            expect(result).toEqual(['3', '5', '7', '9']);
        });

        it('passes errors to error stream instead of closing if given an error stream', async () => {
            const source = transformer.fromIterable(range(8, 1));
            const errorStream = transformer.errorTransform<number>();
            const add1WithError = async (n: number) => {
                if (n % 2 === 0) {
                    throw Error(DEFAULT_ERROR_TEXT);
                }
                return n + 1;
            };
            const add1Transform = transformer.async.fromFunction(add1WithError, { shouldPushErrorsForward: true });

            plumber.pipeOneToOne(source, add1Transform);
            const passThrough = transformer.passThrough<number>();
            plumber.pipeOneToOne(add1Transform, passThrough, { errorStream });
            passThrough.on('data', noop);

            const [result, errorResult] = await Promise.all([streamToArray(passThrough), streamToArray(errorStream)]);
            const errorValues = errorResult.map((error) => (error as StreamError<number>).data);
            expect(result).toEqual([2, 4, 6, 8]);
            expect(errorValues).toEqual([2, 4, 6, 8]);
        });

        it('doesnt pass errors to error stream if given an error stream witohut errors', async () => {
            const source = transformer.fromIterable(range(8, 1));
            const errorStream = transformer.errorTransform<number>();
            const add1Transform = transformer.async.fromFunction(addAsync(1), { shouldPushErrorsForward: true });
            const voidTransform = transformer.void();

            plumber.pipeOneToOne(source, add1Transform, { errorStream });
            plumber.pipeOneToOne(add1Transform, voidTransform, { errorStream });

            const [result, errorResult] = await Promise.all([streamToArray(add1Transform), streamToArray(errorStream)]);

            const errorValues = errorResult.map((error) => (error as StreamError<number>).data);
            expect(result).toEqual(range(8, 2));
            expect(errorValues).toEqual([]);
        });
    });
});
