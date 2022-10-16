import { pipeHelper } from "../classes/pipe-helper";
import { TypedPassThrough } from "../classes/TypedPassThrough";
import { objectUtilityTransforms } from "../classes/utility-transforms"

describe('pipeHelper', () => {
    let sourceTransform: TypedPassThrough<number>;
    let sourceTransforms: TypedPassThrough<number>[];
    let destinationTransform: TypedPassThrough<number>;
    let destinationTransforms: TypedPassThrough<number>[];
    let sourceData: number[];
    const errorOnEvenFunc = (n: number) => {
        if (n % 2 === 0) {
            throw Error('asdf');
        }
        return n;
    }

    beforeEach(() => {
        sourceData = [1, 2, 3, 4, 5, 6, 7, 8]
        sourceTransform = objectUtilityTransforms.fromIterable(sourceData);
        sourceTransforms = [0, 0].map((_, index) => objectUtilityTransforms.fromIterable([0, 1, 2, 3].map(a => a + (index * 4) + 1)))
        destinationTransform = objectUtilityTransforms.passThrough<number>();
        destinationTransforms = [0, 0].map(() => objectUtilityTransforms.passThrough<number>());
    })

    describe('pipeOneToOne', () => {
        it('should pass data', async () => {

            pipeHelper.pipeOneToOne(sourceTransform, destinationTransform);

            const result: number[] = [];
            destinationTransform.on('data', (data) => result.push(data));

            await destinationTransform.promisifyEvents(['end']);
            expect(result).toEqual(sourceData);
        });

        it('should pass error data', async () => {

            const errorStream = objectUtilityTransforms.errorTransform<number>();
            const source = sourceTransform.pipe(objectUtilityTransforms.fromFunction(errorOnEvenFunc, { errorStream }));
            pipeHelper.pipeOneToOne(source, destinationTransform, { errorStream });

            const result: number[] = [];
            const errors: number[] = [];
            destinationTransform.on('data', (data) => result.push(data));
            errorStream.on('data', (error) => errors.push(error.data));

            await Promise.all([destinationTransform.promisifyEvents(['end']), errorStream.promisifyEvents(['end'])]);
            expect(result).toEqual([1, 3, 5, 7]);
            expect(errors).toEqual([2, 4, 6, 8]);
        });

        it('should error correctly when not piped to error stream', async () => {

            const source = sourceTransform.pipe(objectUtilityTransforms.fromFunction(errorOnEvenFunc));
            pipeHelper.pipeOneToOne(source, destinationTransform);

            const promise = Promise.all([destinationTransform.promisifyEvents(['end'], ['error']), source.promisifyEvents([], ['error'])]);

            await expect(promise).rejects.toThrow(new Error('asdf'));
        });
    });

    describe('pipeOneToMany', () => {
        it('should pass data', async () => {

            pipeHelper.pipeOneToMany(sourceTransform, destinationTransforms);

            const result: number[] = [];
            destinationTransforms.forEach(dest => dest.on('data', (data) => result.push(data)));

            await Promise.all(destinationTransforms.map(dest => dest.promisifyEvents(['end'])));
            const expectedResults = [...sourceData, ...sourceData].sort((a, b) => a - b);
            expect(result).toEqual(expectedResults);
        });

        it('should pass error data', async () => {

            const errorStream = objectUtilityTransforms.errorTransform<number>();
            const source = sourceTransform.pipe(objectUtilityTransforms.fromFunction(errorOnEvenFunc, { errorStream }));
            pipeHelper.pipeOneToMany(source, destinationTransforms, { errorStream });

            const result: number[] = [];
            const errors: number[] = [];
            destinationTransforms.forEach(dest => dest.on('data', (data) => result.push(data)));
            errorStream.on('data', (error) => errors.push(error.data));

            await Promise.all([...destinationTransforms.map(dest => dest.promisifyEvents(['end'])), errorStream.promisifyEvents(['end'])]);

            const expectedResult = [1, 1, 3, 3, 5, 5, 7, 7]
            expect(result).toEqual(expectedResult);
            expect(errors).toEqual([2, 4, 6, 8]);
        });


    });

    describe('pipeManyToOne', () => {
        it('should pass data', async () => {

            pipeHelper.pipeManyToOne(sourceTransforms, destinationTransform);

            const result: number[] = [];
            destinationTransform.on('data', (data) => result.push(data));

            await destinationTransform.promisifyEvents(['end']);
            const sortedResult = result.sort((a, b) => a - b)
            expect(sortedResult).toEqual(sourceData);
        });

        it('should pass error data', async () => {

            const errorStream = objectUtilityTransforms.errorTransform<number>();
            const sources = sourceTransforms.map((sourceTransform) => sourceTransform.pipe(objectUtilityTransforms.fromFunction(errorOnEvenFunc, { errorStream })));
            pipeHelper.pipeManyToOne(sources, destinationTransform, { errorStream });

            const result: number[] = [];
            const errors: number[] = [];
            destinationTransform.on('data', (data) => result.push(data))
            errorStream.on('data', (error) => errors.push(error.data));

            await Promise.all([sources.map(source => source.promisifyEvents(['end'])), errorStream.promisifyEvents(['end'])]);

            expect(result).toEqual([1, 3, 5, 7]);
            expect(errors).toEqual([2, 4, 6, 8]);
        });

        it('should error correctly when not piped to error stream', async () => {

            const sources = sourceTransforms.map((sourceTransform) => sourceTransform.pipe(objectUtilityTransforms.fromFunction(errorOnEvenFunc)));
            pipeHelper.pipeManyToOne(sources, destinationTransform);
            destinationTransform.on('data', () => undefined);

            const promise = Promise.all([destinationTransform.promisifyEvents(['end']), ...sources.map(source => source.promisifyEvents([], ['error']))]);
            await expect(promise).rejects.toThrow(new Error('asdf'));
        });
    });

    describe('pipeManyToMany', () => {
        it('should pass data', async () => {

            pipeHelper.pipeManyToMany(sourceTransforms, destinationTransforms);

            const result: number[] = [];
            destinationTransforms.forEach(dest => dest.on('data', (data) => result.push(data)));

            await Promise.all(destinationTransforms.map(dest => dest.promisifyEvents(['end'])));
            const sortedResult = result.sort((a, b) => a - b)
            expect(sortedResult).toEqual(sourceData);
        });

        it('should pass error data', async () => {

            const errorStream = objectUtilityTransforms.errorTransform<number>();
            const sources = sourceTransforms.map((sourceTransform) => sourceTransform.pipe(objectUtilityTransforms.fromFunction(errorOnEvenFunc, { errorStream })));
            pipeHelper.pipeManyToMany(sources, destinationTransforms, { errorStream });

            const result: number[] = [];
            const errors: number[] = [];
            destinationTransforms.forEach(destinationTransform => destinationTransform.on('data', (data) => result.push(data)))
            errorStream.on('data', (error) => errors.push(error.data));

            await Promise.all([sources.map(source => source.promisifyEvents(['end'])), errorStream.promisifyEvents(['end'])]);
            expect(result).toEqual([1, 3, 5, 7]);
            expect(errors).toEqual([2, 4, 6, 8]);
        });
    });

    describe('pipe ', () => {
        it('should pass data', async () => {

            const layer1 = objectUtilityTransforms.passThrough<number>()
            const layer2 = [0, 1].map(() => objectUtilityTransforms.passThrough<number>())
            const layer3 = [0, 1].map(() => objectUtilityTransforms.passThrough<number>())
            const layer4 = objectUtilityTransforms.passThrough<number>()
            pipeHelper.pipe({}, sourceTransform, layer1, layer2, layer3, layer4)

            const result: number[] = [];
            layer4.on('data', (data) => result.push(data))

            await layer4.promisifyEvents(['end']);
            const sortedResult = result.sort((a, b) => a - b);
            const expectedResult = [...sourceData, ...sourceData].sort((a, b) => a - b);
            expect(sortedResult).toEqual(expectedResult);
        });

        it('should pass error data', async () => {

            const errorOnInput = (input: number) => (n: number) => {
                if (input === n) {
                    throw new Error('asdf');
                }
                return n;
            }

            const errorStream = objectUtilityTransforms.errorTransform<number>();

            const layer1 = objectUtilityTransforms.fromFunction(errorOnInput(1), { errorStream })
            const layer2 = [0, 1].map(() => objectUtilityTransforms.fromFunction(errorOnInput(2), { errorStream }))
            const layer3 = [0, 1].map(() => objectUtilityTransforms.fromFunction(errorOnInput(3), { errorStream }))
            const layer4 = objectUtilityTransforms.fromFunction(errorOnInput(4), { errorStream })
            const layer5 = objectUtilityTransforms.passThrough<number>();
            pipeHelper.pipe({ errorStream }, sourceTransform, layer1, layer2, layer3, layer4, layer5)

            const result: number[] = [];
            const errors: number[] = [];
            layer5.on('data', (data) => result.push(data))
            errorStream.on('data', (error) => errors.push(error.data));
            await Promise.all([layer5.promisifyEvents(['end']), errorStream.promisifyEvents(['end'])]);
            expect(result).toEqual([5, 5, 6, 6, 7, 7, 8, 8]);
            expect(errors).toEqual([1, 2, 2, 3, 3, 4, 4]);
        });
    });

    it('should be able to mix passing errors and failing', async () => {

        const errorOnInput = (input: number, error = 'asdf') => (n: number) => {
            if (input === n) {
                throw new Error(error);
            }
            return n;
        }

        const errorStream = objectUtilityTransforms.errorTransform<number>();

        const layer1 = objectUtilityTransforms.fromFunction(errorOnInput(1), { errorStream })
        const layer2 = [0, 1].map(() => objectUtilityTransforms.fromFunction(errorOnInput(2), { errorStream }))
        const layer3_failing = [0, 1].map(() => objectUtilityTransforms.fromFunction(errorOnInput(5, 'layer3')))
        const layer4 = objectUtilityTransforms.fromFunction(errorOnInput(3), { errorStream })
        const layer5 = objectUtilityTransforms.passThrough<number>();

        pipeHelper.pipe({ errorStream }, sourceTransform, layer1, layer2, layer3_failing)
        pipeHelper.pipe({}, layer3_failing, layer4)
        pipeHelper.pipe({ errorStream }, layer4, layer5)

        const result: number[] = [];
        const errors: number[] = [];
        layer5.on('data', (data) => result.push(data))
        errorStream.on('data', (error) => errors.push(error.data));

        const promise = Promise.all([layer5.promisifyEvents(['end']), errorStream.promisifyEvents(['end']), ...layer3_failing.map(transform => transform.promisifyEvents(['end'], ['error']))]);
        await expect(promise).rejects.toThrow(Error('layer3'));
        expect(result).toEqual([4,4]);
        expect(errors).toEqual([1,2,2,3,3]);
    });
})