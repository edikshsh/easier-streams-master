import { Readable } from 'stream';
import { transformer } from '../../../streams/transformer';
import { range, sleep } from '../../../helpers/helper-functions';
import { DEFAULT_ERROR_TEXT, streamToArray } from '../../../helpers/test-helper';

describe('callOnData', () => {
    const numberToObject = (n: number) => ({
        a: n,
    });
    describe('sync', () => {
        it('should not modify the original chunk', async () => {
            const arr = range(8, 1).map(numberToObject);
            const expectedModifiedArr = [11, 12, 13, 14, 15, 16, 17, 18].map(numberToObject);

            const source = Readable.from(arr);
            const increaseBy10 = (item: { a: number }) => {
                item.a += 10;
                modified.push(item);
            };
            const sideEffectsTransform = transformer.callOnData(increaseBy10);
            source.pipe(sideEffectsTransform);

            const modified: { a: number }[] = [];
            const result = await streamToArray(sideEffectsTransform);

            expect(result).toEqual(arr);
            expect(modified).toEqual(expectedModifiedArr);
        });

        it('handles errors from side effects', async () => {
            const arr = range(8, 1).map(numberToObject);
            const source = Readable.from(arr);
            const increaseBy10 = (item: { a: number }) => {
                if (item.a === 3) throw Error(DEFAULT_ERROR_TEXT);
                item.a += 10;
            };
            const sideEffectsTransform = transformer.callOnData(increaseBy10);
            const destination = transformer.passThrough<{ a: number }>();
            source.pipe(sideEffectsTransform).pipe(destination);

            const result: { a: number }[] = [];
            destination.on('data', (data: { a: number }) => result.push(data));
            await expect(sideEffectsTransform.promisifyEvents(['end', 'close'], ['error'])).rejects.toThrow(
                Error(DEFAULT_ERROR_TEXT),
            );
        });
    });
    describe('async', () => {
        it('should not modify the original chunk', async () => {
            const arr = range(8, 1).map(numberToObject);
            const expectedModifiedArr = [11, 12, 13, 14, 15, 16, 17, 18].map(numberToObject);
            const source = Readable.from(arr);
            const modified: { a: number }[] = [];
            const increaseBy10 = async (item: { a: number }) => {
                item.a += 10;
                modified.push(item);
            };
            const sideEffectsTransform = transformer.async.callOnData(increaseBy10);
            source.pipe(sideEffectsTransform);

            const result = await streamToArray(sideEffectsTransform);

            expect(result).toEqual(arr);
            expect(modified).toEqual(expectedModifiedArr);
        });

        it('Should await call on data to finish before ending stream', async () => {
            const arr = range(8, 1).map(numberToObject);
            const expectedModifiedArr = [11, 12, 13, 14, 15, 16, 17, 18].map(numberToObject);
            const source = Readable.from(arr);
            const modified: { a: number }[] = [];
            const increaseBy10 = async (item: { a: number }) => {
                await sleep(10);
                item.a += 10;
                modified.push(item);
            };
            const sideEffectsTransform = transformer.async.callOnData(increaseBy10);
            source.pipe(sideEffectsTransform);

            const result = await streamToArray(sideEffectsTransform);

            expect(result).toEqual(arr);
            expect(modified).toEqual(expectedModifiedArr);
        });

        it('handles errors from side effects', async () => {
            const arr = range(8, 1).map(numberToObject);
            const source = Readable.from(arr);
            const increaseBy10 = async (item: { a: number }) => {
                if (item.a === 3) throw Error(DEFAULT_ERROR_TEXT);
                item.a += 10;
            };
            const sideEffectsTransform = transformer.async.callOnData(increaseBy10);
            source.pipe(sideEffectsTransform);

            await expect(streamToArray(sideEffectsTransform)).rejects.toThrow(Error(DEFAULT_ERROR_TEXT));
        });
    });
});
