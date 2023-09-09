import { Stream } from 'stream';

export async function sleep(n: number) {
    return new Promise((res) => setTimeout(res, n));
}

export async function streamEnd(stream: Stream) {
    return new Promise((res, rej) => {
        stream.on('close', res);
        stream.on('error', rej);
    });
}

export function noop(...args: any[]) {
    return undefined;
}

export function range(len: number, start = 0) {
    return [...new Array(len)].map(() => start++);
}
