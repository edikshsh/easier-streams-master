import { Readable, Stream } from "stream";
import { SimpleAsyncTransform } from "../classes/simple-async-transform";
import { SimpleTransform } from "../classes/simple-transform";
import { objectUtilityTransforms } from "../classes/utility-transforms";
import { ArrayJoinTransform } from "../classes/utility-transforms/array-join-transform";
import { ArraySplitTransform } from "../classes/utility-transforms/array-split-transform";
import { streamEnd } from "./helpers-for-tests";

describe('Test Utility transforms', () => {
    describe('callOnData', ()=> {
        it('should not modify the original chunk', async () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8].map(item => {return {a: item}});
            const expectedModifiedArr = [11, 12, 13, 14, 15, 16, 17, 18].map(item => {return {a: item}});
            const a = Readable.from(arr);
            const increaseBy10 = (item: {a: number}) => {
                item.a += 10;
                modified.push(item);
            }
            const sideEffectsTransform = objectUtilityTransforms.callOnData(increaseBy10);
            const b = a.pipe(sideEffectsTransform)
        
            const result: {a: number}[] = [];
            const modified: {a: number}[] = [];
            b.on('data', (data: {a: number}) => result.push(data));
        
            await streamEnd(b)
            expect(result).toEqual(arr);
            expect(modified).toEqual(expectedModifiedArr);
        })

        it('Should await if passed shouldBeAwaited true', async () => {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8].map(item => {return {a: item}});
            const expectedModifiedArr = [11, 12, 13, 14, 15, 16, 17, 18].map(item => {return {a: item}});
            const a = Readable.from(arr);
            const increaseBy10 = async (item: {a: number}) => {
                await new Promise(res => setTimeout(res, 100));
                item.a += 10;
                modified.push(item);
            }
            const sideEffectsTransform = objectUtilityTransforms.callOnData(increaseBy10, {functionOptions: {shouldBeAwaited: true}});
            const b = a.pipe(sideEffectsTransform)
        
            const result: {a: number}[] = [];
            const modified: {a: number}[] = [];
            b.on('data', (data: {a: number}) => result.push(data));
        
            await streamEnd(b)
            expect(result).toEqual(arr);
            expect(modified).toEqual(expectedModifiedArr);
        })
    })

    describe('filter', ()=> {
        it('should filter out correctly', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const filterOutOdds = (n: number)=> (n % 2) === 0;
            const b = a.pipe(objectUtilityTransforms.filter(filterOutOdds));
        
            const result: number[] = [];
            b.on('data', (data: number) => result.push(data));
        
            await streamEnd(b)
            expect(result).toEqual([2,4,6,8]);
        })
    })

    describe('void', ()=> {
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
            const b = a.pipe(objectUtilityTransforms.arrayJoin(3, { objectMode: true }));

            const result: number[][] = [];
            b.on('data', (data: number[]) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([[1, 2, 3], [4, 5, 6]]);
        });
        it('should flush remaining data even if array is not full', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7]);
            const b = a.pipe(objectUtilityTransforms.arrayJoin(3, { objectMode: true }));

            const result: number[][] = [];
            b.on('data', (data: number[]) => result.push(data));

            await streamEnd(b);
            expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
        });
    })

    describe('arraySplit', () => {
        it('should split array correctly', async () => {
            const a = Readable.from([[1, 2, 3], [4, 5, 6], [7, 8]]);
            const b = a.pipe(objectUtilityTransforms.arraySplit({ objectMode: true }));
        
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
            expect(result).toEqual([2,3,4,5,6,7,8,9])
        });

        it('pipes created transforms correctly', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const add1 = (n: number) => n + 1;
            const filterOutOdds = (n: number) => n % 2 ? n : undefined;
            const numberToString = (n: number) => n.toString();
        
            const add1Transform = (objectUtilityTransforms.fromFunction(add1));
            const filterOutOddsTranform = objectUtilityTransforms.fromFunction(filterOutOdds) ;
            const numberToStringTrasnform = objectUtilityTransforms.fromFunction(numberToString);
        
            a.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);
        
            const result: string[] = [];
            numberToStringTrasnform.on('data', (data) => result.push(data));
        
            await streamEnd(numberToStringTrasnform)
            expect(result).toEqual(['3','5','7','9'])
        });
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
            expect(result).toEqual([2,3,4,5,6,7,8,9])
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
            expect(result).toEqual(['3','5','7','9'])
        });

        it('handles non immediate async functions', async () => {
            const a = Readable.from([1, 2, 3, 4, 5, 6, 7, 8]);
            const add1 = async (n: number) => n + 1;
            const filterOutOdds = async (n: number) => {
                await new Promise(res => setTimeout(res, 100));
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
            expect(result).toEqual(['3','5','7','9'])
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
        const numberToStringTrasnform =objectUtilityTransforms.fromAsyncFunction(numberToString, { objectMode: true });
    
        a.pipe(add1Transform).pipe(filterOutOddsTranform).pipe(numberToStringTrasnform);
    
        const result: string[] = [];
        numberToStringTrasnform.on('data', (data) => result.push(data));
    
        await streamEnd(numberToStringTrasnform)
        expect(result).toEqual(['3','5','7','9'])
    })

});