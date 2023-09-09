import { Readable } from 'stream';
import { plumber } from '../../../streams/plumber';
import { transformer } from '../../../streams/transformer';
import { range, streamEnd } from '../../../helpers/helper-functions';
import { DEFAULT_ERROR_TEXT, filterOutOddsAsync, filterOutOddsSync, streamToArray } from '../../../helpers/test-helper';

describe('filter', () => {
    describe('sync', () => {
        it('should filter out correctly', async () => {
            const source = Readable.from(range(8, 1));
            const filterTransform = source.pipe(transformer.filter(filterOutOddsSync));

            const result = await streamToArray(filterTransform);
            expect(result).toEqual([2, 4, 6, 8]);
        });

        it('should filter out on crash when considerErrorAsFilterOut is true', async () => {
            const source = Readable.from(range(8, 1));
            const filterTransform = source.pipe(
                transformer.filter(filterOutOddsSync, { considerErrorAsFilterOut: true }),
            );
            const result = await streamToArray(filterTransform);
            expect(result).toEqual([2, 4, 6, 8]);
        });

        it('should crash on error when considerErrorAsFilterOut is false', async () => {
            const source = Readable.from(range(8, 1));
            const filterOutOdds = (n: number) => {
                if (n % 2 === 0) {
                    throw Error(DEFAULT_ERROR_TEXT);
                }
                return true;
            };
            const filterTransform = source.pipe(transformer.filter(filterOutOdds, { considerErrorAsFilterOut: false }));

            const result: number[] = [];
            filterTransform.on('data', (data: number) => result.push(data));

            const streamPromise = streamEnd(filterTransform);
            await expect(streamPromise).rejects.toThrow(DEFAULT_ERROR_TEXT);
            expect(result).toEqual([1]);
        });

        it('should pass error if given error stream', async () => {
            const source = transformer.fromIterable(range(8, 1));
            const errorStream = transformer.errorTransform<number>();
            const passThrough = transformer.passThrough<number>();
            const filterOutOdds = (n: number) => {
                if (n % 2 === 1) {
                    throw Error(DEFAULT_ERROR_TEXT);
                }
                return true;
            };

            const filterTransform = transformer.filter(filterOutOdds, { shouldPushErrorsForward: true });

            plumber.pipe({}, source, filterTransform);
            plumber.pipe({ errorStream }, filterTransform, passThrough);

            const errors: number[] = [];
            errorStream.on('data', (error) => errors.push(error.data));
            const result = (await Promise.all([streamToArray(passThrough), streamEnd(errorStream)]))[0];

            expect(result).toEqual([2, 4, 6, 8]);
            expect(errors).toEqual([1, 3, 5, 7]);
        });
    });

    describe('async', () => {
        it('should filter out correctly', async () => {
            const source = Readable.from(range(8, 1));
            const filterOutOdds = async (n: number) => n % 2 === 0;
            const filterTransform = source.pipe(transformer.async.filter(filterOutOdds));

            const result = await streamToArray(filterTransform);
            expect(result).toEqual([2, 4, 6, 8]);
        });

        it('should filter out on crash when considerErrorAsFilterOut is true', async () => {
            const source = Readable.from(range(8, 1));

            const filterTransform = source.pipe(
                transformer.async.filter(filterOutOddsAsync(), { considerErrorAsFilterOut: true }),
            );

            const result = await streamToArray(filterTransform);
            expect(result).toEqual([2, 4, 6, 8]);
        });

        it('should crash on error when considerErrorAsFilterOut is false', async () => {
            const source = Readable.from(range(8, 1));
            const filterOutOdds = async (n: number) => {
                if (n % 2 === 0) {
                    throw Error(DEFAULT_ERROR_TEXT);
                }
                return true;
            };
            const filterTransform = source.pipe(
                transformer.async.filter(filterOutOdds, { considerErrorAsFilterOut: false }),
            );

            const result: number[] = [];
            filterTransform.on('data', (data: number) => result.push(data));

            await expect(streamEnd(filterTransform)).rejects.toThrow(DEFAULT_ERROR_TEXT);
            expect(result).toEqual([1]);
        });

        it('should pass error if given error stream', async () => {
            const errorStream = transformer.errorTransform<number>();
            const source = transformer.fromIterable(range(8, 1));
            const passThrough = transformer.passThrough<number>();
            const filterOutOdds = async (n: number) => {
                if (n % 2 === 0) {
                    throw Error(DEFAULT_ERROR_TEXT);
                }
                return true;
            };

            const filterTransform = transformer.async.filter(filterOutOdds, { shouldPushErrorsForward: true });
            const errors: number[] = [];
            errorStream.on('data', (error) => {
                errors.push(error.data);
            });

            plumber.pipe({ errorStream }, source, filterTransform, passThrough);

            const result = (await Promise.all([streamToArray(passThrough), streamEnd(errorStream)]))[0];
            expect(errors).toEqual([2, 4, 6, 8]);
            expect(result).toEqual([1, 3, 5, 7]);
        });
    });
});
