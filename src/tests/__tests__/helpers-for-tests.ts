import { Stream } from 'stream';
import { SimpleAsyncTransform } from '../../streams/transforms/base/simple-async-transform';
import { SimpleTransform } from '../../streams/transforms/base/simple-transform';

describe('asdf', () => {
    it('should run', () => {
        expect(1).toBeTruthy();
    });
});

export async function sleep(n: number) {
    return new Promise((res) => setTimeout(res, n));
}

export async function streamEnd(stream: Stream) {
    return new Promise((res, rej) => {
        stream.on('close', res);
        stream.on('error', rej);
    });
}
export function getFailOnNumberFunction(input: number, errorText = DEFAULT_ERROR_TEXT) {
    return (num: number) => {
        if (num === input) {
            throw Error(errorText);
        }
        return num;
    };
}

export function getFailOnNumberAsyncFunction(input: number, delay?: number, errorText = DEFAULT_ERROR_TEXT) {
    const syncVersion = getFailOnNumberFunction(input, errorText);
    return async (num: number) => {
        const newNum = syncVersion(num);
        if (delay) {
            await sleep(delay);
        }
        return newNum;
    };
}

export function getFailOnNumberAsyncFunctionMult2(input: number, delay: number, errorText = DEFAULT_ERROR_TEXT) {
    const regularAsyncVersion = getFailOnNumberAsyncFunction(input, delay, errorText);
    return async (num: number) => (await regularAsyncVersion(num)) * 2;
}

export function delayer(delay: number) {
    return async (num: number) => {
        await sleep(delay);
        return num;
    };
}

export function delayerMult2(delay: number) {
    return async (num: number) => {
        await sleep(delay);
        return num * 2;
    };
}
export function failOnOddsSync(n: number) {
    if (n % 2 === 0) {
        throw Error(DEFAULT_ERROR_TEXT);
    }
    return n;
}

export function failOnEvensSync(n: number) {
    if (n % 2 === 1) {
        throw Error(DEFAULT_ERROR_TEXT);
    }
    return n;
}

export async function failOnOddsAsync(n: number) {
    return failOnOddsSync(n);
}

export async function failOnEvensAsync(n: number) {
    return !failOnOddsSync(n);
}

export function filterOutOddsSync(n: number) {
    return !(n % 2);
}

export function filterOutOddsAsync(delay?: number) {
    return async (n: number) => {
        if (delay) {
            await sleep(delay);
        }
        return !(n % 2);
    };
}

export function noop(...args: any[]) {
    return undefined;
}

export async function streamToArray<TSource, TDestination>(
    transform: SimpleTransform<TSource, TDestination> | SimpleAsyncTransform<TSource, TDestination>,
) {
    const arr: TDestination[] = [];
    for await (const chunk of transform) {
        arr.push(chunk);
    }
    return arr;
}

export const DEFAULT_ERROR_TEXT = 'asdf';
