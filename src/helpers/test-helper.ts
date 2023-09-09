import { Transform } from 'stream';
import { BaseTransform } from '../streams/transforms/base/base-transform';
import { sleep } from './helper-functions';

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

export function add(n: number) {
    return (chunk: number) => chunk + n;
}

export function addAsync(n: number) {
    return async (chunk: number) => chunk + n;
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

export async function streamToArray<TSource, TDestination>(
    transform: BaseTransform<TSource, TDestination> | Transform,
) {
    const arr: TDestination[] = [];
    for await (const chunk of transform) {
        arr.push(chunk);
    }
    return arr;
}

export function numberToString(n: number) {
    return n.toString();
}

export async function numberToStringAsync(n: number) {
    return numberToString(n);
}

export const DEFAULT_ERROR_TEXT = 'asdf';
