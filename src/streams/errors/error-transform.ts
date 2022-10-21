import { EventEmitter, TransformOptions } from "stream";
import { BaseTransform } from "../transforms/base/base-transform";
import { TypedTransform } from "../transforms/typed-transform/typed-transform.interface";
import { TypedTransformCallback } from "../transforms/types/typed-transform-callback";
import { StreamGroupControllerEventCounter } from "../utility/stream-group-output-controller-event-counter.type";
import { isStreamError } from "./is-stream-error";
import { StreamError } from "./stream-error";


export class ErrorTransform<TSource> extends BaseTransform<StreamError<TSource>, StreamError<TSource>> {
    streamGroupControllerEventCounter : StreamGroupControllerEventCounter = {
        close: 0,
        end: 0,
        finish: 0
    }
    totalInputs = 0;
    constructor(options?: TransformOptions) {
        super(options);
    }

    _transform(chunk: StreamError<TSource>, encoding: BufferEncoding, callback: TypedTransformCallback<StreamError<TSource>>) {
        if(isStreamError(chunk)){
            return callback(null, chunk);
        }
        return callback();
    }

    pipeErrorSource(transforms: TypedTransform<TSource, unknown>[]){
        this.streamsManyToOneController(transforms, this)
    }

    streamsManyToOneController(inputLayer: EventEmitter[], output: EventEmitter) {
        this.totalInputs += inputLayer.length;
        for (const event in this.streamGroupControllerEventCounter) {
            inputLayer.forEach((input) => {
                input.once(event, () => {
                    const inputsCalledCurrentEvent = (++this.streamGroupControllerEventCounter[event as keyof StreamGroupControllerEventCounter]);
                    if (inputsCalledCurrentEvent === this.totalInputs) {
                        output.emit(event)
                    }
                })
            })
        }
    }
}
