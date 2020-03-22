import {
  CoalesceConfig,
  getCoalesceWorkConfig,
} from "./coalesce-work";
import {getGlobalThis} from "./get-global-this";

let id = 0;
function MockRequestAnimationFrame(cb: Function) {
  cb && cb();
  return ++id;
}
getGlobalThis().requestAnimationFrame = MockRequestAnimationFrame;

const defaultCoalesceWorkConfig: CoalesceConfig = {
  context: getGlobalThis(),
  executionContextRef: getGlobalThis().requestAnimationFrame.bind(getGlobalThis()),
};

fdescribe('getCoalesceWorkConfig', () => {
  it('should return default config object if no overrides are passed', () => {
    const cfg = getCoalesceWorkConfig();
    expect(cfg.context).toBe(defaultCoalesceWorkConfig.context);
    expect(cfg.executionContextRef).toBe(defaultCoalesceWorkConfig.executionContextRef);
  });
  it('should return default config object if an empty override is passed', () => {
    const cfg = getCoalesceWorkConfig({} as any);
    expect(cfg.context).toBe(defaultCoalesceWorkConfig.context);
    expect(cfg.executionContextRef).toBe(defaultCoalesceWorkConfig.executionContextRef);
  });
  it('should return default config with passed context if context was passed', () => {
    const cfg = getCoalesceWorkConfig({context: {executionContextId: 42}});
    expect((cfg.context as any).executionContextId).toBe(42);
    expect(cfg.executionContextRef).toBe(defaultCoalesceWorkConfig.executionContextRef);
  });
  it('should return default config with passed executionContextRef if executionContextRef was passed', () => {
    const executionContextRef = (): number => 42;
    const cfg = getCoalesceWorkConfig({executionContextRef});
    expect((cfg.context as any).executionContextId).toBe((defaultCoalesceWorkConfig.context as any).executionContextId);
    expect((cfg as any).executionContextRef()).toBe(42);
  });
  it('should return new config with passed context and executionContextRef if they where passed', () => {
    const executionContextRef = (): number => 42;
    const context = {executionContextId: 21};
    const cfg = getCoalesceWorkConfig({context, executionContextRef});
    expect((cfg.context as any).executionContextId).toBe(42);
    expect((cfg as any).executionContextRef()).toBe(21);
  });
});
