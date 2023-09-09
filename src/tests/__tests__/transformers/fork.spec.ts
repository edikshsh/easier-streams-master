import { plumber } from '../../../streams/plumber';
import { transformer } from '../../../streams/transformer';
import { range, streamEnd } from '../../../helpers/helper-functions';
import { filterOutOddsSync, streamToArray } from '../../../helpers/test-helper';

describe('fork', () => {
    describe('sync', () => {
        it('should pass kept values to one stream, and discard values to another', async () => {
            const keptValues: number[] = [];
            const filteredValues: number[] = [];
            const source = transformer.fromIterable(range(8, 1));
            const { filterFalseTransform, filterTrueTransform } = transformer.fork(filterOutOddsSync);
            plumber.pipe({}, source, [filterFalseTransform, filterTrueTransform]);

            filterTrueTransform.on('data', (evenNumber) => keptValues.push(evenNumber));
            filterFalseTransform.on('data', (oddNumber) => filteredValues.push(oddNumber));

            await Promise.all([streamEnd(filterTrueTransform), streamEnd(filterFalseTransform)]);

            expect(keptValues).toEqual([2, 4, 6, 8]);
            expect(filteredValues).toEqual([1, 3, 5, 7]);
        });
    });

    describe('asyncFork', () => {
        it('should pass kept values to one stream, and discard values to another', async () => {
            const source = transformer.fromIterable(range(8, 1));
            const filterOutOdds = async (n: number) => n % 2 === 0;
            const { filterFalseTransform, filterTrueTransform } = transformer.async.fork(filterOutOdds);
            plumber.pipe({}, source, [filterFalseTransform, filterTrueTransform]);

            const [keptValues, filteredValues] = await Promise.all([
                streamToArray(filterTrueTransform),
                streamToArray(filterFalseTransform),
            ]);

            expect(keptValues).toEqual([2, 4, 6, 8]);
            expect(filteredValues).toEqual([1, 3, 5, 7]);
        });
    });
});
