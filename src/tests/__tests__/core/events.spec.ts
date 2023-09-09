import { TypedEventEmitter } from '../../../emitters/Emitter';
import { noop } from '../../../helpers/helper-functions';
import { DEFAULT_ERROR_TEXT } from '../../../helpers/test-helper';

type StreamPipeEvents<T> = {
    data: (chunk: T) => void;
    muchData: (data: T[]) => void;
    end: () => void;
    error: (error: Error) => void;
};

describe('TypedEventEmitter', () => {
    it('Should resolve correctly', async () => {
        const ee = new TypedEventEmitter<StreamPipeEvents<number>>();

        const promise = ee.promisifyEvents('data');

        ee.emit('data', 12);
        await expect(promise).resolves.toBe(12);
    });

    it('Should resolve correctly when sending event as array', async () => {
        const ee = new TypedEventEmitter<StreamPipeEvents<number>>();

        const promise = ee.promisifyEvents(['data']);

        ee.emit('data', 12);
        await expect(promise).resolves.toBe(12);
    });

    it('Should resolve correctly when emitting an array', async () => {
        const ee = new TypedEventEmitter<StreamPipeEvents<number>>();

        const promise = ee.promisifyEvents('muchData');

        ee.emit('muchData', [12, 24]);
        await expect(promise).resolves.toEqual([12, 24]);
    });

    it('Should reject correctly', async () => {
        const ee = new TypedEventEmitter<StreamPipeEvents<number>>();

        const promise = ee.promisifyEvents([], 'error');

        setTimeout(() => ee.emit('error', Error(DEFAULT_ERROR_TEXT)), 10);
        await expect(promise).rejects.toThrow(Error(DEFAULT_ERROR_TEXT));
    });

    it('Should reject correctly when sending event as array', async () => {
        const ee = new TypedEventEmitter<StreamPipeEvents<number>>();

        const promise = ee.promisifyEvents([], ['error']);

        setTimeout(() => ee.emit('error', Error(DEFAULT_ERROR_TEXT)), 10);
        await expect(promise).rejects.toThrow(Error(DEFAULT_ERROR_TEXT));
    });

    it('Should not throw if rejected after resolving', async () => {
        const ee = new TypedEventEmitter<StreamPipeEvents<number>>();

        const promise = ee.promisifyEvents('data', 'error');

        //Adding a dummy error handler because node passes all "error" events to process unless there is a listener.
        ee.on('error', noop);

        setTimeout(() => ee.emit('data', 12), 10);
        setTimeout(() => ee.emit('error', Error(DEFAULT_ERROR_TEXT)), 20);
        await expect(promise).resolves.toBe(12);
    });
});
