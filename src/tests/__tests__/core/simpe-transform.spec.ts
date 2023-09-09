import { Readable } from 'stream';
import { range } from '../../../helpers/helper-functions';
import {
    add,
    DEFAULT_ERROR_TEXT,
    getFailOnNumberFunction,
    numberToString,
    streamToArray,
} from '../../../helpers/test-helper';
import { StreamError } from '../../../streams/errors/stream-error';
import { SimpleTransform } from '../../../streams/transforms/base/simple-transform';

describe('SimpleTransform', () => {
    it('creates a typed transform from function', async () => {
        const source = Readable.from(range(8, 1));
        const add1Transform = new SimpleTransform(add(1), { objectMode: true });

        source.pipe(add1Transform);

        const result = await streamToArray(add1Transform);

        expect(result).toEqual(range(8, 2));
    });

    it('pipes created transforms correctly', async () => {
        const source = Readable.from(range(8, 1));
        const filterOutOdds = (n: number) => (n % 2 ? n : undefined);

        const add1Transform = new SimpleTransform(add(1), { objectMode: true });
        const filterOutOddsTransform = new SimpleTransform(filterOutOdds, { objectMode: true });
        const numberToStringTransform = new SimpleTransform(numberToString, { objectMode: true });

        source.pipe(add1Transform).pipe(filterOutOddsTransform).pipe(numberToStringTransform);

        const result = await streamToArray(numberToStringTransform);

        expect(result).toEqual(['3', '5', '7', '9']);
    });

    it('formats chunk on errors', async () => {
        const source = Readable.from(range(8, 1));
        const chunkFormatter = (chunk: number) => ({ num: chunk });

        const throwingTransform = new SimpleTransform(getFailOnNumberFunction(4), {
            objectMode: true,
            shouldPushErrorsForward: true,
            chunkFormatter,
        });

        source.pipe(throwingTransform);
        const result = await streamToArray(throwingTransform);

        expect(result).toStrictEqual([1, 2, 3, new StreamError(Error(DEFAULT_ERROR_TEXT), { num: 4 }), 5, 6, 7, 8]);
    });

    it('Ignores errors given ignoreErrors true', async () => {
        const source = Readable.from(range(8, 1));

        const throwingTransform = new SimpleTransform(getFailOnNumberFunction(4), {
            objectMode: true,
            ignoreErrors: true,
        });

        source.pipe(throwingTransform);

        const result = await streamToArray(throwingTransform);

        expect(result).toStrictEqual([1, 2, 3, 5, 6, 7, 8]);
    });

    it('Ignores errors given ignoreErrors true even when passing error stream', async () => {
        const source = Readable.from(range(8, 1));

        const throwingTransform = new SimpleTransform(getFailOnNumberFunction(4), {
            objectMode: true,
            ignoreErrors: true,
            shouldPushErrorsForward: true,
        });

        source.pipe(throwingTransform);

        const result = await streamToArray(throwingTransform);

        expect(result).toStrictEqual([1, 2, 3, 5, 6, 7, 8]);
    });
});
