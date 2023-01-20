import {
    ArrayJoinTransform,
    ErrorTransform,
    transformer,
    plumber,
    SimpleAsyncTransform,
    SimpleTransform,
    StreamError,
    Transformer,
    TypedEventEmitter,
} from 'easier-streams-file';

async () => {
    const src = transformer.fromIterable([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const action = transformer.fromFunction(async (n: number) => n + 1);
    const dest = transformer.async.fromFunction((n: Promise<number>) => n);

    const pipe = plumber.pipe({}, src, action, dest);
    dest.on('data', (data) => {
        console.log(data);
    });
    await dest.promisifyEvents('end');
    console.log('done');
};

async () => {
    type MyEventEmitterEvents<Data> = {
        data: (data: Data) => void;
        muchData: (data: Data[]) => void;
        end: () => void;
        error: (error: Error) => void;
    };

    const myEventEmitter = new TypedEventEmitter<MyEventEmitterEvents<number>>();

    // myEventEmitter.on('end',(someVar)=>undefined) //❌
    // myEventEmitter.on('end',()=>undefined)// ✅
    // myEventEmitter.on('data',(someVar)=>undefined)// ✅
    // myEventEmitter.on('muchData',(someVar)=>undefined)// ✅
    // myEventEmitter.on('muchData',(someVar: number)=>undefined)// ❌
    // myEventEmitter.on('maybeData',(someVar)=>undefined)// ❌
    // myEventEmitter.emit('maybeData',12)// ❌
    // myEventEmitter.emit('end')// ✅
    // myEventEmitter.emit('end', 123)// ❌
    // myEventEmitter.emit('error', 123)// ❌
    // myEventEmitter.emit('error', new Error())// ✅

    myEventEmitter.promisifyEvents('data'); // resolve on data event, dont reject
    myEventEmitter.promisifyEvents('data', ['end', 'error']); // resolve on data event, reject on end or error events
    myEventEmitter.promisifyEvents(['data', 'muchData'], ['end', 'error']); // resolve on data and muchData events, reject on end or error events
    myEventEmitter.promisifyEvents([], ['error']); // do not resolve, reject on error event
    // myEventEmitter.promisifyEvents(['maybeData'], ['end']);// ❌
};

(async () => {
    const source = transformer.fromIterable([1, 2, 3, 4, 5, 6, 7, 8]);
    const errorStream = transformer.errorTransform<number>();

    const add1 = async (n: number) => n + 1;
    const create3ElementsFrom1 = (n: number) => [n + 1, n + 2, n + 3];
    const errorOnNumber4 = (n: number) => {
        if (n === 4) {
            throw Error('Number is 4');
        }
        return n;
    };
    const filterOutOdds = (n: number) => !(n % 2);
    const numberToString = (n: number) => n.toString();

    const add1Transform = transformer.async.fromFunction(add1);
    const create3ElementsFrom1Transform = transformer.fromFunction(create3ElementsFrom1);
    const takeOnlyFirstElementOfArrayTransform = transformer.pickElementFromArray(0);
    const errorOnNumber4Transform = transformer.fromFunction(errorOnNumber4, { errorStream });
    const filterOutOddsTranform = transformer.filter(filterOutOdds);
    const numberToStringTrasnform = new SimpleTransform(numberToString, { objectMode: true });

    plumber.pipe(
        { errorStream },
        source,
        add1Transform,
        create3ElementsFrom1Transform,
        takeOnlyFirstElementOfArrayTransform,
        errorOnNumber4Transform,
        filterOutOddsTranform,
        numberToStringTrasnform,
    );

    const result: string[] = [];
    const errorResults: StreamError<number>[] = [];

    numberToStringTrasnform.on('data', (data: string) => result.push(data));
    errorStream.on('data', (error) => errorResults.push(error));

    await numberToStringTrasnform.promisifyEvents('end');

    console.log(result); // ['6','8','10']
    console.log(errorResults); // StreamError {error: Error('Number is 4'), data: 4}
    console.log('done');
})();
