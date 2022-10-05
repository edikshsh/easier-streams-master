export interface IPromisifiableEvents {
    promisifyEvents(resolveEvents: string[], rejectEvents: string[]): Promise<unknown>
}

