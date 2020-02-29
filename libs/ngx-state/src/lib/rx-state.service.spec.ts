import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { RxStateService } from './rx-state.service';

describe('NgxRxStateService', () => {
  let spectator: SpectatorService<RxStateService>;
  const createService = createServiceFactory(RxStateService);

  beforeEach(() => spectator = createService());

  it('should...', () => {
    expect(spectator.service).toBeTruthy();
  });
});
