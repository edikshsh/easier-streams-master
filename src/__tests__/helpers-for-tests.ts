import { Stream } from 'stream';

describe('asdf', () => {
    it('should run', () => {
        expect(1).toBeTruthy();
    });
});

export async function sleep(n: number) {
    return new Promise((res) => setTimeout(res, n));
}

export async function streamEnd(stream: Stream) {
    return new Promise((res) => stream.on('close', res));
}
