export class StreamError<T> {
    constructor(public error: Error, public data: T) {}
}
