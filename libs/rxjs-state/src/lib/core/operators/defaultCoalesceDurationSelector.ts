import { first } from 'rxjs/operators';
import { animationFrames } from '../projections';

export const defaultCoalesceDurationSelector = <T>(value: T) => animationFrames().pipe(first());
