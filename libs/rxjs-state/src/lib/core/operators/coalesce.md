 Emits a value from the source Observable on the trailing edge of an interval, then ignores subsequent
 source values for a duration determined by another Observable (`durationSelector`), then repeats this process.

 The coalesce operator is based on the [throttle](https://rxjs-dev.firebaseapp.com/api/operators/throttle) operator.

 ![](coalesce.png)

 # Description
 Rendering, in most web applications, is by far the most performance crucial part.
 The _coalesce_ operator's general purpose is to buffer render relevant state changes together 
 to a single emission. By default changes will be emitted on the trailing end of an animationFrame 
 but this behavior is fully configurable.
 
 Furthermore the _coalesce_ operator provides the option to define a custom scope. If provided, 
 changes will only be emitted once per scope. This helps especially in component based 
 architectures.
 
 # API
 ## Signature
  ```typescript
  coalesce<T>(durationSelector: (value: T) => SubscribableOrPromise<any> = defaultCoalesceDurationSelector, config?: CoalesceConfig = defaultCoalesceConfig):
        MonoTypeOperatorFunction<T>
  
  defaultCoalesceDurationSelector = <T>(value: T) => generateFrames();
  
  defaultCoalesceConfig: CoalesceConfig = {
        context: {isCoalescing: false},
        leading: false,
        trailing: true
  };
```
 ## Parameters
  **durationSelector:**
  
  Optional. Default is `defaultCoalesceDurationSelector` (coalescing by animationFrame)
  A function that receives a value from the source Observable, for computing the silencing duration for each source value, returned as an Observable or a Promise.
  
   **config:**
   
   Optional. Default is `defaultCoalesceConfig` ({ leading: false, trailing: true }` & scoping per Subscriber aka no scoping)
   By default the coalescing operator emits on the trailing end of the defined durationSelector and per Subscriber. The context can be any object.

 # Usage
 ## Basic usage
   ```typescript
 import { coalesce } from 'rxjs-state';
import { range } from '@rxjs';
 
const source$ = range(1, 4); // stream of data
source$.pipe(
    coalesce()
).subscribe(coalescedVal => {
    console.log(coalescedVal);
});

// output: 4
  ```
 ## Scoping
 
 ```typescript
 import { coalesce, generateFrames } from 'rxjs-state';
 import { range } from '@rxjs';
  
 const source$ = range(1, 4); // stream of data
 const coalesceConfig = {
    context: {} // e.g. this.componentRef;
 };

 source$.pipe(
     coalesce(() => generateFrames(), coalesceConfig)
 ).subscribe(coalescedVal => {
     console.log(coalescedVal);
 });
 // output: 4
 source$.pipe(
     coalesce(() => generateFrames(), coalesceConfig)
 ).subscribe(coalescedVal => {
     console.log(coalescedVal);
 });
// no output, since the value will be emitted only once per scope
   ```
 
