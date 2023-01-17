import { Readable } from 'stream';
import { pipeHelper } from '../streams/pipe-helper';
import { objectTransformsHelper } from '../streams/transforms-helper';
import { streamEnd } from './helpers-for-tests';

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
                const sideEffectsTransform = objectTransformsHelper.callOnDataSync(increaseBy10);
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
                const sideEffectsTransform = objectTransformsHelper.callOnDataSync(increaseBy10);
                const pt = objectTransformsHelper.passThrough<{ a: number }>();
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
                const sideEffectsTransform = objectTransformsHelper.async.callOnData(increaseBy10);
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
                const sideEffectsTransform = objectTransformsHelper.async.callOnData(increaseBy10);
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
                const sideEffectsTransform = objectTransformsHelper.async.callOnData(increaseBy10);
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
            const b = a.pipe(objectTransformsHelper.filter(filterOutOdds));

            const result: number[] = [];
            b.on('data', (data: number) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([2, 4, 6, 8]);
        });

        it('should filter out on crash when considerErrorAsFilterOut is true', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const filterOutOdds = (n: number) => {
                if (n % 2 === 1) {
                    throw Error('asdf');
                }
                return true;
            };
            const b = a.pipe(objectTransformsHelper.filter(filterOutOdds, {considerErrorAsFilterOut: true}));

            const result: number[] = [];
            b.on('data', (data: number) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([2, 4, 6, 8]);
        });

        it('should crash on error when considerErrorAsFilterOut is false', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const filterOutOdds = (n: number) => {
                if (n % 2 === 0) {
                    throw Error('asdf');
                }
                return true;
            };
            const b = a.pipe(objectTransformsHelper.filter(filterOutOdds, {considerErrorAsFilterOut: false}));

            const result: number[] = [];
            b.on('data', (data: number) => result.push(data));

            const streamPromise = streamEnd(b);
            await expect(streamPromise).rejects.toThrow('asdf')
            expect(result).toEqual([1]);
        });

        it('should pass error if given error stream', async () => {
            const a = objectTransformsHelper.fromIterable([1, 2, 3, 4, 5, 6, 7, 8]);
            const errorStream = objectTransformsHelper.errorTransform<number>();
            const passThrough = objectTransformsHelper.passThrough<number>();
            const filterOutOdds = (n: number) => {
                if (n % 2 === 1) {
                    throw Error('asdf');
                }
                return true;
            };

            const b = objectTransformsHelper.filter(filterOutOdds, { errorStream });

            pipeHelper.pipe({}, a, b);
            pipeHelper.pipe({ errorStream }, b, passThrough);
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
            const a = objectTransformsHelper.fromIterable([1, 2, 3, 4, 5, 6, 7, 8]);
            const filterOutOdds = (n: number) => n % 2 === 0;
            const { filterFalseTransform, filterTrueTransform } = objectTransformsHelper.fork(filterOutOdds);
            pipeHelper.pipe({}, a, [filterFalseTransform, filterTrueTransform]);

            filterTrueTransform.on('data', (evenNumber) => keptValues.push(evenNumber));
            filterFalseTransform.on('data', (oddNumber) => filteredValues.push(oddNumber));

            await Promise.all([streamEnd(filterTrueTransform), streamEnd(filterFalseTransform)]);

            expect(keptValues).toEqual([2,4,6,8]);
            expect(filteredValues).toEqual([1,3,5,7]);
        });
    });

    // function isNumber(n: unknown): n is number{
    //     return typeof n === 'number'
    // }

    describe('filterType', () => {
        it('should filter out by type correctly', async () => {
            const a = Readable.from([1, '2', 3, '4', 5, '6', 7, '8']);
            function isNumber(n: unknown): n is number {
                return typeof n === 'number';
            }
            const b = a.pipe(objectTransformsHelper.typeFilter(isNumber));

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
            const b = a.pipe(objectTransformsHelper.async.filter(filterOutOdds));

            const result: number[] = [];
            b.on('data', (data: number) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([2, 4, 6, 8]);
        });

        it('should filter out on crash when considerErrorAsFilterOut is true', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const filterOutOdds = async (n: number) => {
                if (n % 2 === 1) {
                    throw Error('asdf');
                }
                return true;
            };
            const b = a.pipe(objectTransformsHelper.async.filter(filterOutOdds, {considerErrorAsFilterOut: true}));

            const result: number[] = [];
            b.on('data', (data: number) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([2, 4, 6, 8]);
        });

        
        it('should crash on error when considerErrorAsFilterOut is false', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const filterOutOdds = async (n: number) => {
                if (n % 2 === 0) {
                    throw Error('asdf');
                }
                return true;
            };
            const b = a.pipe(objectTransformsHelper.async.filter(filterOutOdds, {considerErrorAsFilterOut: false}));

            const result: number[] = [];
            b.on('data', (data: number) => result.push(data));

            const streamPromise = streamEnd(b);
            await expect(streamPromise).rejects.toThrow('asdf')
            expect(result).toEqual([1]);
        });

        it('should pass error if given error stream', async () => {
            const errorStream = objectTransformsHelper.errorTransform<number>();
            const a = objectTransformsHelper.fromIterable([1, 2, 3, 4, 5, 6, 7, 8]);
            const passThrough = objectTransformsHelper.passThrough<number>();
            const filterOutOdds = async (n: number) => {
                if (n % 2 === 1) {
                    throw Error('asdf');
                }
                return true;
            };

            const b = objectTransformsHelper.async.filter(filterOutOdds, { errorStream });
            const result: number[] = [];
            const errors: number[] = [];
            passThrough.on('data', (data: number) => result.push(data));
            errorStream.on('data', (error) => {
                errors.push(error.data);
            });

            pipeHelper.pipe({ errorStream }, a, b, passThrough);

            await Promise.all([streamEnd(passThrough), streamEnd(errorStream)]);
            expect(result).toEqual([2, 4, 6, 8]);
            expect(errors).toEqual([1, 3, 5, 7]);
        });
    });

    describe('asyncFork', () => {
        it('should pass kept values to one stream, and discard values to another', async () => {
            const keptValues: number[] = [];
            const filteredValues: number[] = [];
            const a = objectTransformsHelper.fromIterable([1, 2, 3, 4, 5, 6, 7, 8]);
            const filterOutOdds = async (n: number) => n % 2 === 0;
            const { filterFalseTransform, filterTrueTransform } = objectTransformsHelper.async.fork(filterOutOdds);
            pipeHelper.pipe({}, a, [filterFalseTransform, filterTrueTransform]);

            filterTrueTransform.on('data', (evenNumber) => keptValues.push(evenNumber));
            filterFalseTransform.on('data', (oddNumber) => filteredValues.push(oddNumber));

            await Promise.all([streamEnd(filterTrueTransform), streamEnd(filterFalseTransform)]);

            expect(keptValues).toEqual([2,4,6,8]);
            expect(filteredValues).toEqual([1,3,5,7]);
        });
    });

    describe('void', () => {
        it('should throw away all data', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const b = a.pipe(objectTransformsHelper.void());

            const result: void[] = [];
            b.on('data', (data) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([]);
        });
    });

    describe('arrayJoin', () => {
        it('should join input into arrays of correct length', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6]);
            const b = a.pipe(objectTransformsHelper.arrayJoin<number>(3, { objectMode: true }));

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
            const b = a.pipe(objectTransformsHelper.arrayJoin<number>(3, { objectMode: true }));

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
            const b = a.pipe(objectTransformsHelper.arraySplit<number>({ objectMode: true }));

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
            const add1Transform = objectTransformsHelper.fromFunction(add1, { objectMode: true });

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

            const add1Transform = objectTransformsHelper.fromFunction(add1);
            const filterOutOddsTranform = objectTransformsHelper.fromFunction(filterOutOdds);
            const numberToStringTrasnform = objectTransformsHelper.fromFunction(numberToString);

            a.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);

            const result: string[] = [];
            numberToStringTrasnform.on('data', (data) => result.push(data));

            await streamEnd(numberToStringTrasnform);
            expect(result).toEqual(['3', '5', '7', '9']);
        });

        it('passes errors to error stream instead of closing if given an error stream', async () => {
            const a = objectTransformsHelper.fromIterable([1, 2, 3, 4, 5, 6, 7, 8]);
            const errorStream = objectTransformsHelper.errorTransform<number>();
            const add1WithError = (n: number) => {
                if (n % 2 === 0) {
                    throw Error('asdf');
                }
                return n + 1;
            };
            const add1Transform = objectTransformsHelper.fromFunction(add1WithError, { errorStream });

            pipeHelper.pipeOneToOne(a, add1Transform);
            const passThrough = objectTransformsHelper.passThrough<number>();
            pipeHelper.pipeOneToOne(add1Transform, passThrough, { errorStream });
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
            const a = objectTransformsHelper.fromIterable([1, 2, 3, 4, 5, 6, 7, 8]);
            const errorStream = objectTransformsHelper.errorTransform<number>();
            const add1 = (n: number) => n + 1;
            const add1Transform = objectTransformsHelper.fromFunction(add1, { errorStream });

            pipeHelper.pipeOneToOne(a, add1Transform, { errorStream });
            pipeHelper.pipeOneToOne(add1Transform, objectTransformsHelper.void(), { errorStream });

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
                const b = a.pipe(objectTransformsHelper.passThrough<number>());

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
            const add1Transform = objectTransformsHelper.async.fromFunction(add1, { objectMode: true });

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

            const add1Transform = objectTransformsHelper.async.fromFunction(add1);
            const filterOutOddsTranform = objectTransformsHelper.async.fromFunction(filterOutOdds);
            const numberToStringTrasnform = objectTransformsHelper.async.fromFunction(numberToString);

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

            const add1Transform = objectTransformsHelper.async.fromFunction(add1);
            const filterOutOddsTranform = objectTransformsHelper.async.fromFunction(filterOutOdds);
            const numberToStringTrasnform = objectTransformsHelper.async.fromFunction(numberToString);

            a.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);

            const result: string[] = [];
            numberToStringTrasnform.on('data', (data) => result.push(data));

            await streamEnd(numberToStringTrasnform);
            expect(result).toEqual(['3', '5', '7', '9']);
        });

        it('passes errors to error stream instead of closing if given an error stream', async () => {
            const a = objectTransformsHelper.fromIterable([1, 2, 3, 4, 5, 6, 7, 8]);
            const errorStream = objectTransformsHelper.errorTransform<number>();
            const add1WithError = async (n: number) => {
                if (n % 2 === 0) {
                    throw Error('asdf');
                }
                return n + 1;
            };
            const add1Transform = objectTransformsHelper.async.fromFunction(add1WithError, { errorStream });

            pipeHelper.pipeOneToOne(a, add1Transform);
            const passThrough = objectTransformsHelper.passThrough<number>();
            pipeHelper.pipeOneToOne(add1Transform, passThrough, { errorStream });
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
            const a = objectTransformsHelper.fromIterable([1, 2, 3, 4, 5, 6, 7, 8]);
            const errorStream = objectTransformsHelper.errorTransform<number>();
            const add1 = async (n: number) => n + 1;
            const add1Transform = objectTransformsHelper.async.fromFunction(add1, { errorStream });

            pipeHelper.pipeOneToOne(a, add1Transform, { errorStream });
            pipeHelper.pipeOneToOne(add1Transform, objectTransformsHelper.void(), { errorStream });

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
            const b = a.pipe(objectTransformsHelper.void({ objectMode: true }));

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
            const b = a.pipe(objectTransformsHelper.pickElementFromArray<number>(0));

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

            const { input, output } = objectTransformsHelper.async.fromFunctionConcurrent(action, concurrency);

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
            const action = async (n: number) => {
                await new Promise((res) => setTimeout(res, delay));
                return n * 2;
            };
            const concurrency = 5;

            const { input, output } = objectTransformsHelper.async.fromFunctionConcurrent(action, concurrency);

            Readable.from(arr).pipe(input);

            output.on('data', (data) => {
                outArr.push(data);
            });
            await output.promisifyEvents(['end'], ['error']);
            expect(estimatedRunTimeSequential).toBeGreaterThan(Date.now() - startTime);
        });
        it('should fail send error to output if one of the concurrent actions fails', async () => {
            const delay = 20;
            const inputLength = 100;
            const errorOnIndex = 20;
            const arr = [...Array(inputLength).keys()];
            const outArr: number[] = [];
            const action = async (n: number) => {
                if (n === errorOnIndex) {
                    throw new Error('asdf');
                }
                await new Promise((res) => setTimeout(res, delay));
                return n * 2;
            };
            const concurrency = 5;

            const { input, output } = objectTransformsHelper.async.fromFunctionConcurrent(action, concurrency);

            Readable.from(arr).pipe(input);

            output.on('data', (data) => {
                outArr.push(data);
            });
            try {
                await output.promisifyEvents(['end'], ['error']);
            } catch (error) {
                expect(error).toEqual(new Error('asdf'));
                expect(outArr.length).toBeLessThan(errorOnIndex);
            } finally {
                expect.assertions(2);
            }
        });

        it('doesnt break backpressure', async () => {
            const delay = 20;
            const inputLength = 100;
            const arr = [...Array(inputLength).keys()];
            const outArr: number[] = [];
            let chunksPassedInInput = 0;
            const action = async (n: number) => {
                await new Promise((res) => setTimeout(res, delay));
                return n * 2;
            };
            const concurrency = 2;

            const { input, output } = objectTransformsHelper.async.fromFunctionConcurrent(action, concurrency);

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
    });

    describe('fromFunctionConcurrent2', () => {
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

            const concurrentTransform = objectTransformsHelper.async.fromFunctionConcurrent2(action, concurrency);

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
            const action = async (n: number) => {
                await new Promise((res) => setTimeout(res, delay));
                return n * 2;
            };
            const concurrency = 5;

            const concurrentTransform = objectTransformsHelper.async.fromFunctionConcurrent2(action, concurrency);

            Readable.from(arr).pipe(concurrentTransform);

            concurrentTransform.on('data', (data) => {
                outArr.push(data);
            });
            await concurrentTransform.promisifyEvents(['end'], ['error']);
            expect(estimatedRunTimeSequential).toBeGreaterThan(Date.now() - startTime);
        });
        it('should fail send error to output if one of the concurrent actions fails', async () => {
            const delay = 20;
            const inputLength = 100;
            const errorOnIndex = 20;
            const arr = [...Array(inputLength).keys()];
            const outArr: number[] = [];
            const action = async (n: number) => {
                if (n === errorOnIndex) {
                    throw new Error('asdf');
                }
                await new Promise((res) => setTimeout(res, delay));
                return n * 2;
            };
            const concurrency = 5;

            const concurrentTransform = objectTransformsHelper.async.fromFunctionConcurrent2(action, concurrency);

            Readable.from(arr).pipe(concurrentTransform);

            concurrentTransform.on('data', (data) => {
                outArr.push(data);
            });
            try {
                await concurrentTransform.promisifyEvents(['end'], ['error']);
            } catch (error) {
                expect(error).toEqual(new Error('asdf'));
                expect(outArr.length).toBeLessThan(errorOnIndex);
            } finally {
                expect.assertions(2);
            }
        });

        it('doesnt break backpressure', async () => {
            const delay = 10;
            const inputLength = 300;
            const arr = [...Array(inputLength).keys()];
            const outArr: number[] = [];
            let chunksPassedInInput = 0;
            const action = async (n: number) => {
                await new Promise((res) => setTimeout(res, delay));
                return n * 2;
            };
            const concurrency = 2;

            const concurrentTransform = objectTransformsHelper.async.fromFunctionConcurrent2(action, concurrency);

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
            const b = objectTransformsHelper.fromIterable(arr);

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
            const b = objectTransformsHelper.fromIterable(asyncGenerator());

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

        const add1Transform = objectTransformsHelper.fromFunction(add1, { objectMode: true });
        const filterOutOddsTranform = objectTransformsHelper.async.fromFunction(filterOutOdds, { objectMode: true });
        const numberToStringTrasnform = objectTransformsHelper.async.fromFunction(numberToString, { objectMode: true });

        a.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);

        const result: string[] = [];
        numberToStringTrasnform.on('data', (data) => result.push(data));

        await streamEnd(numberToStringTrasnform);
        expect(result).toEqual(['3', '5', '7', '9']);
    });
});
