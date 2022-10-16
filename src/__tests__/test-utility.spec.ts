import { Readable } from "stream";
import { pipeHelper } from "../classes/pipe-helper";
import { objectUtilityTransforms } from "../classes/utility-transforms";
import { streamEnd } from "./helpers-for-tests";

describe('Test Utility transforms', () => {
    describe('callOnData', () => {
        describe('sync', () => {
            it('should not modify the original chunk', async () => {
                const arr = [1, 2, 3, 4, 5, 6, 7, 8].map(item => { return { a: item } });
                const expectedModifiedArr = [11, 12, 13, 14, 15, 16, 17, 18].map(item => { return { a: item } });
                const a = Readable.from(arr);
                const increaseBy10 = (item: { a: number }) => {
                    item.a += 10;
                    modified.push(item);
                }
                const sideEffectsTransform = objectUtilityTransforms.callOnDataSync(increaseBy10);
                const b = a.pipe(sideEffectsTransform)

                const result: { a: number }[] = [];
                const modified: { a: number }[] = [];
                b.on('data', (data: { a: number }) => result.push(data));
                // b.on('data')

                await streamEnd(b)
                expect(result).toEqual(arr);
                expect(modified).toEqual(expectedModifiedArr);
            });

            it('handles errors from side effects', async () => {
                const arr = [1, 2, 3, 4, 5, 6, 7, 8].map(item => { return { a: item } });
                const a = Readable.from(arr);
                const increaseBy10 = (item: { a: number }) => {
                    if (item.a === 3)
                        throw Error('aaaaa')
                    item.a += 10;
                    modified.push(item);
                }
                const sideEffectsTransform = objectUtilityTransforms.callOnDataSync(increaseBy10);
                const pt = objectUtilityTransforms.passThrough<{a: number}>();
                const b = a.pipe(sideEffectsTransform).pipe(pt);

                const result: { a: number }[] = [];
                const modified: { a: number }[] = [];
                b.on('data', (data: { a: number }) => result.push(data));
                await expect(sideEffectsTransform.promisifyEvents(['end', 'close'], ['error'])).rejects.toThrow(Error('aaaaa'));
            })
        });
        describe('async', () => {
            it('should not modify the original chunk', async () => {
                const arr = [1, 2, 3, 4, 5, 6, 7, 8].map(item => { return { a: item } });
                const expectedModifiedArr = [11, 12, 13, 14, 15, 16, 17, 18].map(item => { return { a: item } });
                const a = Readable.from(arr);
                const increaseBy10 = async (item: { a: number }) => {
                    item.a += 10;
                    modified.push(item);
                }
                const sideEffectsTransform = objectUtilityTransforms.callOnDataAsync(increaseBy10);
                const b = a.pipe(sideEffectsTransform)

                const result: { a: number }[] = [];
                const modified: { a: number }[] = [];
                b.on('data', (data: { a: number }) => result.push(data));
                // b.on('data')

                await streamEnd(b)
                expect(result).toEqual(arr);
                expect(modified).toEqual(expectedModifiedArr);
            });

            it('Should await call on data to finish before ending stream', async () => {
                const arr = [1, 2, 3, 4, 5, 6, 7, 8].map(item => { return { a: item } });
                const expectedModifiedArr = [11, 12, 13, 14, 15, 16, 17, 18].map(item => { return { a: item } });
                const a = Readable.from(arr);
                const increaseBy10 = async (item: { a: number }) => {
                    await new Promise(res => setTimeout(res, 100));
                    item.a += 10;
                    modified.push(item);
                }
                const sideEffectsTransform = objectUtilityTransforms.callOnDataAsync(increaseBy10);
                const b = a.pipe(sideEffectsTransform)

                const result: { a: number }[] = [];
                const modified: { a: number }[] = [];
                b.on('data', (data) => result.push(data));

                await streamEnd(b)
                expect(result).toEqual(arr);
                expect(modified).toEqual(expectedModifiedArr);
            })

            it('handles errors from side effects', async () => {
                const arr = [1, 2, 3, 4, 5, 6, 7, 8].map(item => { return { a: item } });
                const a = Readable.from(arr);
                const increaseBy10 = async (item: { a: number }) => {
                    if (item.a === 3)
                        throw Error('aaaaa')
                    item.a += 10;
                    modified.push(item);
                }
                const sideEffectsTransform = objectUtilityTransforms.callOnDataAsync(increaseBy10);
                const b = a.pipe(sideEffectsTransform)

                const result: { a: number }[] = [];
                const modified: { a: number }[] = [];
                b.on('data', (data: { a: number }) => result.push(data));
                b.on('error', () => undefined)

                await expect(b.promisifyEvents(['end', 'close'], ['error'])).rejects.toThrow(Error('aaaaa'));
            })
        });
    })

    describe('filter', () => {
        it('should filter out correctly', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const filterOutOdds = (n: number) => (n % 2) === 0;
            const b = a.pipe(objectUtilityTransforms.filter(filterOutOdds));

            const result: number[] = [];
            b.on('data', (data: number) => result.push(data));

            await streamEnd(b)
            expect(result).toEqual([2, 4, 6, 8]);
        })

        it('should filter out on crash', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const filterOutOdds = (n: number) => {
                if ((n % 2) === 1) {
                    throw Error('asdf')
                }
                return true;
            };
            const b = a.pipe(objectUtilityTransforms.filter(filterOutOdds));

            const result: number[] = [];
            b.on('data', (data: number) => result.push(data));

            await streamEnd(b)
            expect(result).toEqual([2, 4, 6, 8]);
        })

        it('should pass error if given error stream', async () => {
            const a = objectUtilityTransforms.fromIterable([1, 2, 3, 4, 5, 6, 7, 8])
            const errorStream = objectUtilityTransforms.errorTransform<number>();
            const passThrough = objectUtilityTransforms.passThrough<number>();
            const filterOutOdds = (n: number) => {
                if ((n % 2) === 1) {
                    throw Error('asdf')
                }
                return true;
            };

            const b = objectUtilityTransforms.filter(filterOutOdds, { errorStream })

            pipeHelper.pipe({ errorStream }, a, b, passThrough);
            passThrough.on('data', () => undefined);
            const result: number[] = [];
            const errors: number[] = [];
            passThrough.on('data', (data: number) => result.push(data));
            errorStream.on('data', (error) => errors.push(error.data));

            await Promise.all([streamEnd(b), streamEnd(errorStream)]);
            expect(result).toEqual([2, 4, 6, 8]);
            expect(errors).toEqual([1, 3, 5, 7]);
        })
    })

    describe('void', () => {
        it('should throw away all data', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const b = a.pipe(objectUtilityTransforms.void());

            const result: void[] = [];
            b.on('data', (data) => result.push(data));

            await streamEnd(b)
            expect(result).toEqual([]);
        })
    })

    describe('arrayJoin', () => {
        it('should join input into arrays of correct length', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6]);
            const b = a.pipe(objectUtilityTransforms.arrayJoin<number>(3, { objectMode: true }));

            const result: number[][] = [];
            b.on('data', (data: number[]) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([[1, 2, 3], [4, 5, 6]]);
        });
        it('should flush remaining data even if array is not full', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7]);
            const b = a.pipe(objectUtilityTransforms.arrayJoin<number>(3, { objectMode: true }));

            const result: number[][] = [];
            b.on('data', (data: number[]) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
        });
    })

    describe('arraySplit', () => {
        it('should split array correctly', async () => {
            const a = Readable.from([[1, 2, 3], [4, 5, 6], [7, 8]]);
            const b = a.pipe(objectUtilityTransforms.arraySplit<number>({ objectMode: true }));

            const result: number[] = [];
            b.on('data', (data: number) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
        });
    })

    describe('fromFunction', () => {
        it('creates a typed transform from function', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const add1 = (n: number) => n + 1;
            const add1Transform = (objectUtilityTransforms.fromFunction(add1, { objectMode: true }));

            a.pipe(add1Transform);

            const result: number[] = [];
            add1Transform.on('data', (data) => result.push(data));

            await streamEnd(add1Transform)
            expect(result).toEqual([2, 3, 4, 5, 6, 7, 8, 9])
        });

        it('pipes created transforms correctly', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const add1 = (n: number) => n + 1;
            const filterOutOdds = (n: number) => n % 2 ? n : undefined;
            const numberToString = (n: number) => n.toString();

            const add1Transform = (objectUtilityTransforms.fromFunction(add1));
            const filterOutOddsTranform = objectUtilityTransforms.fromFunction(filterOutOdds);
            const numberToStringTrasnform = objectUtilityTransforms.fromFunction(numberToString);

            a.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);

            const result: string[] = [];
            numberToStringTrasnform.on('data', (data) => result.push(data));

            await streamEnd(numberToStringTrasnform)
            expect(result).toEqual(['3', '5', '7', '9'])
        });

        it('passes errors to error stream instead of closing if given an error stream', async () => {
            const a = objectUtilityTransforms.fromIterable([1, 2, 3, 4, 5, 6, 7, 8])
            const errorStream = objectUtilityTransforms.errorTransform<number>();
            const add1WithError = (n: number) => {
                if (n % 2 === 0) {
                    throw Error('asdf')
                }
                return n + 1
            };
            const add1Transform = (objectUtilityTransforms.fromFunction(add1WithError, { errorStream }));

            pipeHelper.pipeOneToOne(a, add1Transform)
            const passThrough = objectUtilityTransforms.passThrough<number>();
            pipeHelper.pipeOneToOne(add1Transform, passThrough, { errorStream })
            passThrough.on('data', () => undefined);

            const result: number[] = [];
            const errorResulst: number[] = [];
            passThrough.on('data', (data) => result.push(data));
            errorStream.on('data', (data) => errorResulst.push(data.data));

            await Promise.all([streamEnd(add1Transform), streamEnd(errorStream)]);
            expect(result).toEqual([2, 4, 6, 8])
            expect(errorResulst).toEqual([2, 4, 6, 8])
        });

        it('doesnt pass errors to error stream if given an error stream witohut errors', async () => {
            const a = objectUtilityTransforms.fromIterable([1, 2, 3, 4, 5, 6, 7, 8])
            const errorStream = objectUtilityTransforms.errorTransform<number>();
            const add1 = (n: number) => n + 1;
            const add1Transform = (objectUtilityTransforms.fromFunction(add1, { errorStream }));

            pipeHelper.pipeOneToOne(a, add1Transform, { errorStream })
            pipeHelper.pipeOneToOne(add1Transform, objectUtilityTransforms.void(), { errorStream })

            const result: number[] = [];
            const errorResulst: number[] = [];
            add1Transform.on('data', (data) => result.push(data));
            errorStream.on('data', (data) => errorResulst.push(data.data));

            await Promise.all([streamEnd(add1Transform), streamEnd(errorStream)])
            expect(result).toEqual([2, 3, 4, 5, 6, 7, 8, 9])
            expect(errorResulst).toEqual([])
        });

        describe('typedPassThrough', () => {
            it('should pass items correctly', async () => {
                const arr = [1, 2, 3, 4, 5, 6, 7, 8];
                const a = Readable.from(arr);
                const b = a.pipe(objectUtilityTransforms.passThrough<number>());

                const result: number[] = [];
                b.on('data', (data: number) => result.push(data));

                await streamEnd(b);
                expect(result).toEqual(arr);
            });
        })
    })
    describe('fromAsyncFunction', () => {

        it('creates a typed transform from async function', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const add1 = async (n: number) => n + 1;
            const add1Transform = (objectUtilityTransforms.fromAsyncFunction(add1, { objectMode: true }));

            a.pipe(add1Transform);

            const result: number[] = [];
            add1Transform.on('data', (data) => result.push(data));

            await streamEnd(add1Transform)
            expect(result).toEqual([2, 3, 4, 5, 6, 7, 8, 9])
        });

        it('pipes created transforms correctly', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const add1 = async (n: number) => n + 1;
            const filterOutOdds = async (n: number) => n % 2 ? n : undefined;
            const numberToString = async (n: number) => n.toString();

            const add1Transform = (objectUtilityTransforms.fromAsyncFunction(add1));
            const filterOutOddsTranform = objectUtilityTransforms.fromAsyncFunction(filterOutOdds);
            const numberToStringTrasnform = objectUtilityTransforms.fromAsyncFunction(numberToString);

            a.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);

            const result: string[] = [];
            numberToStringTrasnform.on('data', (data) => result.push(data));

            await streamEnd(numberToStringTrasnform)
            expect(result).toEqual(['3', '5', '7', '9'])
        });

        it('handles non immediate async functions', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const add1 = async (n: number) => n + 1;
            const filterOutOdds = async (n: number) => {
                await new Promise(res => setTimeout(res, 20));
                return n % 2 ? n : undefined;
            };
            const numberToString = async (n: number) => n.toString();

            const add1Transform = (objectUtilityTransforms.fromAsyncFunction(add1));
            const filterOutOddsTranform = objectUtilityTransforms.fromAsyncFunction(filterOutOdds);
            const numberToStringTrasnform = objectUtilityTransforms.fromAsyncFunction(numberToString);

            a.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);

            const result: string[] = [];
            numberToStringTrasnform.on('data', (data) => result.push(data));

            await streamEnd(numberToStringTrasnform)
            expect(result).toEqual(['3', '5', '7', '9'])
        });

        it('passes errors to error stream instead of closing if given an error stream', async () => {
            const a = objectUtilityTransforms.fromIterable([1, 2, 3, 4, 5, 6, 7, 8])
            const errorStream = objectUtilityTransforms.errorTransform<number>();
            const add1WithError = async (n: number) => {
                if (n % 2 === 0) {
                    throw Error('asdf')
                }
                return n + 1
            };
            const add1Transform = (objectUtilityTransforms.fromAsyncFunction(add1WithError, { errorStream }));

            pipeHelper.pipeOneToOne(a, add1Transform)
            const passThrough = objectUtilityTransforms.passThrough<number>();
            pipeHelper.pipeOneToOne(add1Transform, passThrough, { errorStream })
            passThrough.on('data', () => undefined);

            const result: number[] = [];
            const errorResulst: number[] = [];
            passThrough.on('data', (data) => result.push(data));
            errorStream.on('data', (data) => errorResulst.push(data.data));

            await Promise.all([streamEnd(add1Transform), streamEnd(errorStream)]);
            expect(result).toEqual([2, 4, 6, 8])
            expect(errorResulst).toEqual([2, 4, 6, 8])
        });

        it('doesnt pass errors to error stream if given an error stream witohut errors', async () => {
            const a = objectUtilityTransforms.fromIterable([1, 2, 3, 4, 5, 6, 7, 8])
            const errorStream = objectUtilityTransforms.errorTransform<number>();
            const add1 = async (n: number) => n + 1;
            const add1Transform = (objectUtilityTransforms.fromAsyncFunction(add1, { errorStream }));

            pipeHelper.pipeOneToOne(a, add1Transform, { errorStream })
            pipeHelper.pipeOneToOne(add1Transform, objectUtilityTransforms.void(), { errorStream })

            const result: number[] = [];
            const errorResulst: number[] = [];
            add1Transform.on('data', (data) => result.push(data));
            errorStream.on('data', (data) => errorResulst.push(data.data));

            await Promise.all([streamEnd(add1Transform), streamEnd(errorStream)])
            expect(result).toEqual([2, 3, 4, 5, 6, 7, 8, 9])
            expect(errorResulst).toEqual([])
        });
    })

    describe('void', () => {
        it('should ignore deleted data without blocking the stream', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const b = a.pipe(objectUtilityTransforms.void({ objectMode: true }));

            const result: unknown[] = [];
            b.on('data', (data) => {
                result.push(data)
            });

            await streamEnd(b);
            expect(result).toEqual([]);
        });
    })

    describe('pickElementFromArray', () => {
        it('should pick the correct element', async () => {
            const a = Readable.from([[1, 2, 3], [4, 5, 6], [7, 8]]);
            const b = a.pipe(objectUtilityTransforms.pickElementFromArray<number>(0));

            const result: number[] = [];
            b.on('data', (data) => {
                result.push(data)
            });

            await streamEnd(b);
            expect(result).toEqual([1, 4, 7]);
        });
    })

    describe('fromFunctionConcurrent', () => {
        it('should return correct but unordered output', async () => {
            const delay = 20;
            const inputLength = 100;
            const arr = [...Array(inputLength).keys()];
            const expectedOutput = arr.map(n => n * 2);
            const outArr: number[] = []
            const action = async (n: number) => {
                await new Promise(res => setTimeout(res, delay));
                return n * 2;
            }
            const concurrency = 5;

            const { input, output } = objectUtilityTransforms.fromFunctionConcurrent(action, concurrency);

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
            const outArr: number[] = []
            const startTime = Date.now();
            const action = async (n: number) => {
                await new Promise(res => setTimeout(res, delay));
                return n * 2;
            }
            const concurrency = 5;

            const { input, output } = objectUtilityTransforms.fromFunctionConcurrent(action, concurrency);

            Readable.from(arr).pipe(input);

            output.on('data', (data) => {
                outArr.push(data);
            });
            await output.promisifyEvents(['end'], ['error']);
            expect(estimatedRunTimeSequential).toBeGreaterThan(Date.now() - startTime)
        });
        it('should fail send error to output if one of the concurrent actions fails', async () => {
            const delay = 20;
            const inputLength = 100;
            const errorOnIndex = 20;
            const arr = [...Array(inputLength).keys()];
            const outArr: number[] = []
            const action = async (n: number) => {
                if (n === errorOnIndex) {
                    throw new Error('asdf')
                }
                await new Promise(res => setTimeout(res, delay));
                return n * 2;
            }
            const concurrency = 5;

            const { input, output } = objectUtilityTransforms.fromFunctionConcurrent(action, concurrency);

            Readable.from(arr).pipe(input);

            output.on('data', (data) => {
                outArr.push(data);
            });
            try {
                await output.promisifyEvents(['end'], ['error']);
            } catch (error) {
                expect(error).toEqual(new Error('asdf'))
                expect(outArr.length).toBeLessThan(errorOnIndex);
            } finally {
                expect.assertions(2);
            }
        });

        it('doesnt break backpressure', async () => {
            const delay = 20;
            const inputLength = 100;
            const arr = [...Array(inputLength).keys()];
            const outArr: number[] = []
            let chunksPassedInInput = 0;
            const action = async (n: number) => {
                await new Promise(res => setTimeout(res, delay));
                return n * 2;
            }
            const concurrency = 2;

            const { input, output } = objectUtilityTransforms.fromFunctionConcurrent(action, concurrency);

            Readable.from(arr).pipe(input);
            input.on('data', () => chunksPassedInInput++);

            output.on('data', (data) => {
                outArr.push(data);
            });
            await input.promisifyEvents(['end'], ['error']);
            expect(chunksPassedInInput).toEqual(inputLength)
            expect(outArr.length).toBe(0)
            await output.promisifyEvents(['end'], ['error']);
            expect(outArr.length).toBe(inputLength)
        });
    })

    describe('fromIterable', () => {
        it('output all data from iterable', async () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8];
            const b = objectUtilityTransforms.fromIterable(arr);

            const result: number[] = [];
            b.on('data', (data) => {
                result.push(data)
            });

            await streamEnd(b);
            expect(result).toEqual(arr);
        });
    })


    it('Able to mix different transforms in a single stream', async () => {
        const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
        const add1 = (n: number) => n + 1;
        const filterOutOdds = async (n: number) => {
            await new Promise(res => setTimeout(res, 100));
            return n % 2 ? n : undefined;
        };
        const numberToString = async (n: number) => n.toString();

        const add1Transform = (objectUtilityTransforms.fromFunction(add1, { objectMode: true }));
        const filterOutOddsTranform = objectUtilityTransforms.fromAsyncFunction(filterOutOdds, { objectMode: true });
        const numberToStringTrasnform = objectUtilityTransforms.fromAsyncFunction(numberToString, { objectMode: true });

        a.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);

        const result: string[] = [];
        numberToStringTrasnform.on('data', (data) => result.push(data));

        await streamEnd(numberToStringTrasnform)
        expect(result).toEqual(['3', '5', '7', '9'])
    })

});