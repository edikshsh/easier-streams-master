import { FullTransformOptions } from "../transforms/types/full-transform-options.type";

// try formatting the chunk, on fail return the original
export function getFormattedChunk<TSource>(chunk: TSource, options?: FullTransformOptions<TSource>){
    const chunkFormatter = options?.chunkFormatter
    if(!chunkFormatter){
        return chunk;
    }
    try{
        return chunkFormatter(chunk)
    } catch {
        return chunk;
    }
}