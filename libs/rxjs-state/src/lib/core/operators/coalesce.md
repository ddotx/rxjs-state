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
```
 ## Defaults
```typescript
  defaultCoalesceDurationSelector = <T>(value: T) => generateFrames();
      
  defaultCoalesceConfig: CoalesceConfig = {
        context: {isCoalescing: false},
        leading: false,
        trailing: true
  };
```
 ## Configuration
  **durationSelector:**
  
  Optional. Default is `defaultCoalesceDurationSelector` (coalescing by animationFrame)
  A function that receives a value from the source Observable, for computing the silencing duration for each source value, returned as an Observable or a Promise.
  
   **config:**
   
   Optional. Default is `defaultCoalesceConfig` ({ leading: false, trailing: true }` & scoping per Subscriber aka no scoping)
   By default the coalescing operator emits on the trailing end of the defined durationSelector and per Subscriber. The context can be any object.

 # Usage
 ## Basic usage
 By default the coalesce operator helps you to throttle changes of incoming sources to the trailing edge of an animationFrame.
 This example demonstrates how the render method is only called once thus having four changes of the source stream.
```typescript
import { coalesce } from 'rxjs-state';
import { range } from '@rxjs';
 
const source$ = range(1, 4); // stream of data
source$.pipe(
    coalesce()
).subscribe(stateChanges => {
    render(); // render method will be called once for the value 4 of the stream
});

  ```
 ## Scoping
 If two subscriber share the same scope object, changes will only be emitted to one of the subscriber. This simple 
 example shows how it is possible to coalesce multiple subscribers to one shared scope object. This will result in 
 only one rendering call thus having multiple subscribers to the incoming stream.
 
 ```typescript
 import { coalesce, generateFrames } from 'rxjs-state';
 import { range } from '@rxjs';
  
 const source$ = range(1, 4); // stream of data
 const coalesceConfig = {
    context: {} // e.g. this.componentRef;
 };

 source$.pipe(
     coalesce(() => generateFrames(), coalesceConfig)
 ).subscribe(stateChanges => {
     render(); // render method will be called once for the value 4 of the stream
 });

 source$.pipe(
     coalesce(() => generateFrames(), coalesceConfig)
 ).subscribe(stateChanges => {
    render();
});
// view doesn't get rendered, since the value will be emitted only once per scope
   ```
 
