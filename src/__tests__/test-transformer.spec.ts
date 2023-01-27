import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { plumber } from '../streams/plumber';
import { transformer } from '../streams/transformer';
import {
    DEFAULT_ERROR_TEXT,
    delayer,
    delayerMult2,
    filterOutOddsAsync,
    filterOutOddsSync,
    getFailOnNumberAsyncFunctionMult2,
    getFailOnNumberFunction,
    streamEnd,
} from './helpers-for-tests';

describe('Test Utility transforms', () => {
    describe('callOnData', () => {
        describe('sync', () => {
            it('should not modify the original chunk', async () => {
                const arr = [1, 2, 3, 4, 5, 6, 7, 8].map((item) => {
                    return { a: item };
                });
                const expectedModifiedArr = [11, 12, 13, 14, 15, 16, 17, 18].map((item) => {
                    return { a: item };
                });
                const a = Readable.from(arr);
                const increaseBy10 = (item: { a: number }) => {
                    item.a += 10;
                    modified.push(item);
                };
                const sideEffectsTransform = transformer.callOnData(increaseBy10);
                const b = a.pipe(sideEffectsTransform);

                const result: { a: number }[] = [];
                const modified: { a: number }[] = [];
                b.on('data', (data: { a: number }) => result.push(data));

                await streamEnd(b);
                expect(result).toEqual(arr);
                expect(modified).toEqual(expectedModifiedArr);
            });

            it('handles errors from side effects', async () => {
                const arr = [1, 2, 3, 4, 5, 6, 7, 8].map((item) => {
                    return { a: item };
                });
                const a = Readable.from(arr);
                const increaseBy10 = (item: { a: number }) => {
                    if (item.a === 3) throw Error('aaaaa');
                    item.a += 10;
                    modified.push(item);
                };
                const sideEffectsTransform = transformer.callOnData(increaseBy10);
                const pt = transformer.passThrough<{ a: number }>();
                const b = a.pipe(sideEffectsTransform).pipe(pt);

                const result: { a: number }[] = [];
                const modified: { a: number }[] = [];
                b.on('data', (data: { a: number }) => result.push(data));
                await expect(sideEffectsTransform.promisifyEvents(['end', 'close'], ['error'])).rejects.toThrow(
                    Error('aaaaa'),
                );
            });
        });
        describe('async', () => {
            it('should not modify the original chunk', async () => {
                const arr = [1, 2, 3, 4, 5, 6, 7, 8].map((item) => {
                    return { a: item };
                });
                const expectedModifiedArr = [11, 12, 13, 14, 15, 16, 17, 18].map((item) => {
                    return { a: item };
                });
                const a = Readable.from(arr);
                const increaseBy10 = async (item: { a: number }) => {
                    item.a += 10;
                    modified.push(item);
                };
                const sideEffectsTransform = transformer.async.callOnData(increaseBy10);
                const b = a.pipe(sideEffectsTransform);

                const result: { a: number }[] = [];
                const modified: { a: number }[] = [];
                b.on('data', (data: { a: number }) => result.push(data));

                await streamEnd(b);
                expect(result).toEqual(arr);
                expect(modified).toEqual(expectedModifiedArr);
            });

            it('Should await call on data to finish before ending stream', async () => {
                const arr = [1, 2, 3, 4, 5, 6, 7, 8].map((item) => {
                    return { a: item };
                });
                const expectedModifiedArr = [11, 12, 13, 14, 15, 16, 17, 18].map((item) => {
                    return { a: item };
                });
                const a = Readable.from(arr);
                const increaseBy10 = async (item: { a: number }) => {
                    await new Promise((res) => setTimeout(res, 100));
                    item.a += 10;
                    modified.push(item);
                };
                const sideEffectsTransform = transformer.async.callOnData(increaseBy10);
                const b = a.pipe(sideEffectsTransform);

                const result: { a: number }[] = [];
                const modified: { a: number }[] = [];
                b.on('data', (data) => result.push(data));

                await streamEnd(b);
                expect(result).toEqual(arr);
                expect(modified).toEqual(expectedModifiedArr);
            });

            it('handles errors from side effects', async () => {
                const arr = [1, 2, 3, 4, 5, 6, 7, 8].map((item) => {
                    return { a: item };
                });
                const a = Readable.from(arr);
                const increaseBy10 = async (item: { a: number }) => {
                    if (item.a === 3) throw Error('aaaaa');
                    item.a += 10;
                    modified.push(item);
                };
                const sideEffectsTransform = transformer.async.callOnData(increaseBy10);
                const b = a.pipe(sideEffectsTransform);

                const result: { a: number }[] = [];
                const modified: { a: number }[] = [];
                b.on('data', (data: { a: number }) => result.push(data));
                b.on('error', () => undefined);

                await expect(b.promisifyEvents(['end', 'close'], ['error'])).rejects.toThrow(Error('aaaaa'));
            });
        });
    });

    describe('filter', () => {
        it('should filter out correctly', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const filterOutOdds = (n: number) => n % 2 === 0;
            const b = a.pipe(transformer.filter(filterOutOdds));

            const result: number[] = [];
            b.on('data', (data: number) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([2, 4, 6, 8]);
        });

        it('should filter out on crash when considerErrorAsFilterOut is true', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);

            const b = a.pipe(transformer.filter(filterOutOddsSync, { considerErrorAsFilterOut: true }));

            const result: number[] = [];
            b.on('data', (data: number) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([2, 4, 6, 8]);
        });

        it('should crash on error when considerErrorAsFilterOut is false', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const filterOutOdds = (n: number) => {
                if (n % 2 === 0) {
                    throw Error(DEFAULT_ERROR_TEXT);
                }
                return true;
            };
            const b = a.pipe(transformer.filter(filterOutOdds, { considerErrorAsFilterOut: false }));

            const result: number[] = [];
            b.on('data', (data: number) => result.push(data));

            const streamPromise = streamEnd(b);
            await expect(streamPromise).rejects.toThrow(DEFAULT_ERROR_TEXT);
            expect(result).toEqual([1]);
        });

        it('should pass error if given error stream', async () => {
            const a = transformer.fromIterable([1, 2, 3, 4, 5, 6, 7, 8]);
            const errorStream = transformer.errorTransform<number>();
            const passThrough = transformer.passThrough<number>();
            const filterOutOdds = (n: number) => {
                if (n % 2 === 1) {
                    throw Error(DEFAULT_ERROR_TEXT);
                }
                return true;
            };

            const b = transformer.filter(filterOutOdds, { shouldPushErrorsForward: true });

            plumber.pipe({}, a, b);
            plumber.pipe({ errorStream }, b, passThrough);
            passThrough.on('data', () => undefined);
            const result: number[] = [];
            const errors: number[] = [];
            passThrough.on('data', (data: number) => result.push(data));
            errorStream.on('data', (error) => errors.push(error.data));

            await Promise.all([streamEnd(b), streamEnd(errorStream)]);
            expect(result).toEqual([2, 4, 6, 8]);
            expect(errors).toEqual([1, 3, 5, 7]);
        });
    });

    describe('fork', () => {
        it('should pass kept values to one stream, and discard values to another', async () => {
            const keptValues: number[] = [];
            const filteredValues: number[] = [];
            const a = transformer.fromIterable([1, 2, 3, 4, 5, 6, 7, 8]);
            const { filterFalseTransform, filterTrueTransform } = transformer.fork(filterOutOddsSync);
            plumber.pipe({}, a, [filterFalseTransform, filterTrueTransform]);

            filterTrueTransform.on('data', (evenNumber) => keptValues.push(evenNumber));
            filterFalseTransform.on('data', (oddNumber) => filteredValues.push(oddNumber));

            await Promise.all([streamEnd(filterTrueTransform), streamEnd(filterFalseTransform)]);

            expect(keptValues).toEqual([2, 4, 6, 8]);
            expect(filteredValues).toEqual([1, 3, 5, 7]);
        });
    });

    describe('filterType', () => {
        it('should filter out by type correctly', async () => {
            const a = Readable.from([1, '2', 3, '4', 5, '6', 7, '8']);
            function isNumber(n: unknown): n is number {
                return typeof n === 'number';
            }
            const b = a.pipe(transformer.typeFilter(isNumber));

            const result: number[] = [];
            b.on('data', (data: number) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([1, 3, 5, 7]);
        });
    });

    describe('asyncFilter', () => {
        it('should filter out correctly', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const filterOutOdds = async (n: number) => n % 2 === 0;
            const b = a.pipe(transformer.async.filter(filterOutOdds));

            const result: number[] = [];
            b.on('data', (data: number) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([2, 4, 6, 8]);
        });

        it('should filter out on crash when considerErrorAsFilterOut is true', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);

            const b = a.pipe(transformer.async.filter(filterOutOddsAsync(), { considerErrorAsFilterOut: true }));

            const result: number[] = [];
            b.on('data', (data: number) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([2, 4, 6, 8]);
        });

        it('should crash on error when considerErrorAsFilterOut is false', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const filterOutOdds = async (n: number) => {
                if (n % 2 === 0) {
                    throw Error(DEFAULT_ERROR_TEXT);
                }
                return true;
            };
            const b = a.pipe(transformer.async.filter(filterOutOdds, { considerErrorAsFilterOut: false }));

            const result: number[] = [];
            b.on('data', (data: number) => result.push(data));

            const streamPromise = streamEnd(b);
            await expect(streamPromise).rejects.toThrow(DEFAULT_ERROR_TEXT);
            expect(result).toEqual([1]);
        });

        it('should pass error if given error stream', async () => {
            const errorStream = transformer.errorTransform<number>();
            const a = transformer.fromIterable([1, 2, 3, 4, 5, 6, 7, 8]);
            const passThrough = transformer.passThrough<number>();
            const filterOutOdds = async (n: number) => {
                if (n % 2 === 1) {
                    throw Error(DEFAULT_ERROR_TEXT);
                }
                return true;
            };

            const b = transformer.async.filter(filterOutOdds, { shouldPushErrorsForward: true });
            const result: number[] = [];
            const errors: number[] = [];
            passThrough.on('data', (data: number) => result.push(data));
            errorStream.on('data', (error) => {
                errors.push(error.data);
            });

            plumber.pipe({ errorStream }, a, b, passThrough);

            await Promise.all([streamEnd(passThrough), streamEnd(errorStream)]);
            expect(result).toEqual([2, 4, 6, 8]);
            expect(errors).toEqual([1, 3, 5, 7]);
        });
    });

    describe('asyncFork', () => {
        it('should pass kept values to one stream, and discard values to another', async () => {
            const keptValues: number[] = [];
            const filteredValues: number[] = [];
            const a = transformer.fromIterable([1, 2, 3, 4, 5, 6, 7, 8]);
            const filterOutOdds = async (n: number) => n % 2 === 0;
            const { filterFalseTransform, filterTrueTransform } = transformer.async.fork(filterOutOdds);
            plumber.pipe({}, a, [filterFalseTransform, filterTrueTransform]);

            filterTrueTransform.on('data', (evenNumber) => keptValues.push(evenNumber));
            filterFalseTransform.on('data', (oddNumber) => filteredValues.push(oddNumber));

            await Promise.all([streamEnd(filterTrueTransform), streamEnd(filterFalseTransform)]);

            expect(keptValues).toEqual([2, 4, 6, 8]);
            expect(filteredValues).toEqual([1, 3, 5, 7]);
        });
    });

    describe('void', () => {
        it('should throw away all data', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const b = a.pipe(transformer.void());

            const result: void[] = [];
            b.on('data', (data) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([]);
        });
    });

    describe('arrayJoin', () => {
        it('should join input into arrays of correct length', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6]);
            const b = a.pipe(transformer.arrayJoin<number>(3, { objectMode: true }));

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
            const b = a.pipe(transformer.arrayJoin<number>(3, { objectMode: true }));

            const result: number[][] = [];
            b.on('data', (data: number[]) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
        });
    });

    describe('arraySplit', () => {
        it('should split array correctly', async () => {
            const a = Readable.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8],
            ]);
            const b = a.pipe(transformer.arraySplit<number>({ objectMode: true }));

            const result: number[] = [];
            b.on('data', (data: number) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
        });
    });

    describe('fromFunction', () => {
        it('creates a typed transform from function', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const add1 = (n: number) => n + 1;
            const add1Transform = transformer.fromFunction(add1, { objectMode: true });

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

            const add1Transform = transformer.fromFunction(add1);
            const filterOutOddsTranform = transformer.fromFunction(filterOutOdds);
            const numberToStringTrasnform = transformer.fromFunction(numberToString);

            a.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);

            const result: string[] = [];
            numberToStringTrasnform.on('data', (data) => result.push(data));

            await streamEnd(numberToStringTrasnform);
            expect(result).toEqual(['3', '5', '7', '9']);
        });

        it('passes errors to error stream instead of closing if given an error stream', async () => {
            const a = transformer.fromIterable([1, 2, 3, 4, 5, 6, 7, 8]);
            const errorStream = transformer.errorTransform<number>();
            const add1WithError = (n: number) => {
                if (n % 2 === 0) {
                    throw Error(DEFAULT_ERROR_TEXT);
                }
                return n + 1;
            };
            const add1Transform = transformer.fromFunction(add1WithError, { shouldPushErrorsForward: true });

            plumber.pipeOneToOne(a, add1Transform);
            const passThrough = transformer.passThrough<number>();
            plumber.pipeOneToOne(add1Transform, passThrough, { errorStream });
            passThrough.on('data', () => undefined);

            const result: number[] = [];
            const errorResulst: number[] = [];
            passThrough.on('data', (data) => result.push(data));
            errorStream.on('data', (data) => errorResulst.push(data.data));

            await Promise.all([streamEnd(add1Transform), streamEnd(errorStream)]);
            expect(result).toEqual([2, 4, 6, 8]);
            expect(errorResulst).toEqual([2, 4, 6, 8]);
        });

        it('doesnt pass errors to error stream if given an error stream witohut errors', async () => {
            const a = transformer.fromIterable([1, 2, 3, 4, 5, 6, 7, 8]);
            const errorStream = transformer.errorTransform<number>();
            const add1 = (n: number) => n + 1;
            const add1Transform = transformer.fromFunction(add1, { shouldPushErrorsForward: true });

            plumber.pipeOneToOne(a, add1Transform, { errorStream });
            plumber.pipeOneToOne(add1Transform, transformer.void(), { errorStream });

            const result: number[] = [];
            const errorResulst: number[] = [];
            add1Transform.on('data', (data) => result.push(data));
            errorStream.on('data', (data) => errorResulst.push(data.data));

            await Promise.all([streamEnd(add1Transform), streamEnd(errorStream)]);
            expect(result).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
            expect(errorResulst).toEqual([]);
        });

        describe('typedPassThrough', () => {
            it('should pass items correctly', async () => {
                const arr = [1, 2, 3, 4, 5, 6, 7, 8];
                const a = Readable.from(arr);
                const b = a.pipe(transformer.passThrough<number>());

                const result: number[] = [];
                b.on('data', (data: number) => result.push(data));

                await streamEnd(b);
                expect(result).toEqual(arr);
            });
        });
    });

    describe('fromAsyncFunction', () => {
        it('creates a typed transform from async function', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const add1 = async (n: number) => n + 1;
            const add1Transform = transformer.async.fromFunction(add1, { objectMode: true });

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

            const add1Transform = transformer.async.fromFunction(add1);
            const filterOutOddsTranform = transformer.async.fromFunction(filterOutOdds);
            const numberToStringTrasnform = transformer.async.fromFunction(numberToString);

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
                await new Promise((res) => setTimeout(res, 20));
                return n % 2 ? n : undefined;
            };
            const numberToString = async (n: number) => n.toString();

            const add1Transform = transformer.async.fromFunction(add1);
            const filterOutOddsTranform = transformer.async.fromFunction(filterOutOdds);
            const numberToStringTrasnform = transformer.async.fromFunction(numberToString);

            a.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);

            const result: string[] = [];
            numberToStringTrasnform.on('data', (data) => result.push(data));

            await streamEnd(numberToStringTrasnform);
            expect(result).toEqual(['3', '5', '7', '9']);
        });

        it('passes errors to error stream instead of closing if given an error stream', async () => {
            const a = transformer.fromIterable([1, 2, 3, 4, 5, 6, 7, 8]);
            const errorStream = transformer.errorTransform<number>();
            const add1WithError = async (n: number) => {
                if (n % 2 === 0) {
                    throw Error(DEFAULT_ERROR_TEXT);
                }
                return n + 1;
            };
            const add1Transform = transformer.async.fromFunction(add1WithError, { shouldPushErrorsForward: true });

            plumber.pipeOneToOne(a, add1Transform);
            const passThrough = transformer.passThrough<number>();
            plumber.pipeOneToOne(add1Transform, passThrough, { errorStream });
            passThrough.on('data', () => undefined);

            const result: number[] = [];
            const errorResulst: number[] = [];
            passThrough.on('data', (data) => result.push(data));
            errorStream.on('data', (data) => errorResulst.push(data.data));

            await Promise.all([streamEnd(add1Transform), streamEnd(errorStream)]);
            expect(result).toEqual([2, 4, 6, 8]);
            expect(errorResulst).toEqual([2, 4, 6, 8]);
        });

        it('doesnt pass errors to error stream if given an error stream witohut errors', async () => {
            const a = transformer.fromIterable([1, 2, 3, 4, 5, 6, 7, 8]);
            const errorStream = transformer.errorTransform<number>();
            const add1 = async (n: number) => n + 1;
            const add1Transform = transformer.async.fromFunction(add1, { shouldPushErrorsForward: true });

            plumber.pipeOneToOne(a, add1Transform, { errorStream });
            plumber.pipeOneToOne(add1Transform, transformer.void(), { errorStream });

            const result: number[] = [];
            const errorResulst: number[] = [];
            add1Transform.on('data', (data) => result.push(data));
            errorStream.on('data', (data) => errorResulst.push(data.data));

            await Promise.all([streamEnd(add1Transform), streamEnd(errorStream)]);
            expect(result).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
            expect(errorResulst).toEqual([]);
        });
    });

    describe('void', () => {
        it('should ignore deleted data without blocking the stream', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const b = a.pipe(transformer.void({ objectMode: true }));

            const result: unknown[] = [];
            b.on('data', (data) => {
                result.push(data);
            });

            await streamEnd(b);
            expect(result).toEqual([]);
        });
    });

    describe('pickElementFromArray', () => {
        it('should pick the correct element', async () => {
            const a = Readable.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8],
            ]);
            const b = a.pipe(transformer.pickElementFromArray<number>(0));

            const result: number[] = [];
            b.on('data', (data) => {
                result.push(data);
            });

            await streamEnd(b);
            expect(result).toEqual([1, 4, 7]);
        });
    });

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
            const delay = 20;
            const inputLength = 100;
            const estimatedRunTimeSequential = delay * inputLength;
            const arr = [...Array(inputLength).keys()];
            const outArr: number[] = [];
            const startTime = Date.now();
            const concurrency = 5;

            const { input, output } = transformer.async.fromFunctionConcurrent(delayer(delay), concurrency);

            Readable.from(arr).pipe(input);

            output.on('data', (data) => {
                outArr.push(data);
            });
            await output.promisifyEvents(['end'], ['error']);
            expect(estimatedRunTimeSequential).toBeGreaterThan(Date.now() - startTime);
        });
        it('should send error to output if one of the concurrent actions fails', async () => {
            const delay = 20;
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
            const delay = 20;
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

            const erroringTranform = transformer.fromFunction(getFailOnNumberFunction(4));
            const { input, output } = transformer.async.fromFunctionConcurrent(delayer(delay), concurrency);

            const source = transformer.fromIterable(arr);
            pipeline(source, erroringTranform, input).catch(() => undefined);
            pipeline(output, transformer.void()).catch(() => undefined);

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

            const erroringTranform = transformer.fromFunction(getFailOnNumberFunction(4));
            const passThrough = transformer.passThrough<number>();
            const { input, output } = transformer.async.fromFunctionConcurrent(delayer(delay), concurrency, {});

            const source = Readable.from(arr);
            pipeline(source, input).catch(() => undefined);
            pipeline(output, erroringTranform, passThrough).catch(() => undefined);

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
            const outArr: number[] = [];
            const startTime = Date.now();

            const concurrency = 5;

            const concurrentTransform = transformer.async.fromFunctionConcurrent2(delayerMult2(delay), concurrency);

            Readable.from(arr).pipe(concurrentTransform);

            concurrentTransform.on('data', (data) => {
                outArr.push(data);
            });
            await concurrentTransform.promisifyEvents(['end'], ['error']);
            expect(estimatedRunTimeSequential).toBeGreaterThan(Date.now() - startTime);
        });
        it('should send error to output if one of the concurrent actions fails', async () => {
            const delay = 20;
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
            const erroringTranform = transformer.fromFunction(errorOn4);
            const concurrentTransform = transformer.async.fromFunctionConcurrent2(delayer(delay), concurrency);

            const source = transformer.fromIterable(arr);

            const p = concurrentTransform.promisifyEvents('close', 'error');
            pipeline(source, erroringTranform, concurrentTransform).catch(() => undefined);
            await expect(p).rejects.toThrow(DEFAULT_ERROR_TEXT);
        });

        it('should not break pipeline chain of error passing if error comes after concurrent', async () => {
            const delay = 10;
            const inputLength = 30;
            const arr = [...Array(inputLength).keys()];

            const concurrency = 5;
            const concurrentTransform = transformer.async.fromFunctionConcurrent2(delayer(delay), concurrency);
            const erroringTranform = transformer.fromFunction(errorOn4);
            const passThrough = transformer.passThrough();

            const source = transformer.fromIterable(arr);
            const p = passThrough.promisifyEvents('close', 'error');

            pipeline(source, concurrentTransform, erroringTranform, passThrough).catch(() => undefined);
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

            pipeline(source, concurrentTransform, passThrough).catch(() => undefined);
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
            await new Promise<void>((resolve, reject) => readable.on('close', resolve));
            expect(outArr.length).toBeGreaterThan(inputLength - 50);
            await concurrentTransform.promisifyEvents(['close'], ['error']);
            expect(outArr.length).toBe(300);
        });
    });

    describe('fromIterable', () => {
        it('output all data from iterable', async () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8];
            const b = transformer.fromIterable(arr);

            const result: number[] = [];
            b.on('data', (data) => {
                result.push(data);
            });

            await streamEnd(b);
            expect(result).toEqual(arr);
        });
        it('output all data from async generator', async () => {
            function* asyncGenerator() {
                let i = 1;
                while (true) {
                    yield i++;
                    if (i === 9) break;
                }
            }
            const b = transformer.fromIterable(asyncGenerator());

            const result: number[] = [];
            b.on('data', (data) => {
                result.push(data);
            });

            await streamEnd(b);
            expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
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

        const add1Transform = transformer.fromFunction(add1, { objectMode: true });
        const filterOutOddsTranform = transformer.async.fromFunction(filterOutOdds, { objectMode: true });
        const numberToStringTrasnform = transformer.async.fromFunction(numberToString, { objectMode: true });

        a.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);

        const result: string[] = [];
        numberToStringTrasnform.on('data', (data) => result.push(data));

        await streamEnd(numberToStringTrasnform);
        expect(result).toEqual(['3', '5', '7', '9']);
    });
});
