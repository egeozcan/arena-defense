import { initPhysics } from './engine';
import { SimHost, type HostRequest, type HostResponse } from './host';

// Runs the deterministic simulation off the main thread so slow ticks delay
// the next snapshot instead of the rendered frame.
const scope = self as unknown as {
  postMessage(message: HostResponse): void;
  onmessage: ((event: MessageEvent<HostRequest>) => void) | null;
};
const host = new SimHost();
const queued: HostRequest[] = [];
let ready = false;

function handle(request: HostRequest) {
  try {
    const response = host.handle(request);
    if (response) scope.postMessage(response);
  } catch (e) {
    scope.postMessage({ type: 'error', message: String(e) });
  }
}

scope.onmessage = (event) => {
  if (ready) handle(event.data);
  else queued.push(event.data);
};
initPhysics()
  .then(() => {
    ready = true;
    scope.postMessage({ type: 'ready' });
    for (const request of queued.splice(0)) handle(request);
  })
  .catch((e) => scope.postMessage({ type: 'error', message: String(e) }));
