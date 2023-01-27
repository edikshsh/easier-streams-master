import { ErrorTransform } from '../errors/error-transform';


export type PlumberOptions<TSource> = {
    usePipeline?: boolean;
    errorStream?: ErrorTransform<TSource>;
};
