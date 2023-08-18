import { Readable } from 'stream';
import { transformer } from '../../../streams/transformer';
import { streamEnd } from '../../helpers-for-tests';

describe('filterType', () => {
    it('should filter out by type correctly', async () => {
        const source = Readable.from([1, '2', 3, '4', 5, '6', 7, '8']);
        function isNumber(n: unknown): n is number {
            return typeof n === 'number';
        }
        const typeFilterTransform = source.pipe(transformer.typeFilter(isNumber));

        const result: number[] = [];
        typeFilterTransform.on('data', (data: number) => result.push(data));

        await streamEnd(typeFilterTransform);
        expect(result).toEqual([1, 3, 5, 7]);
    });
});
