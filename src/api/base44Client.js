import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { isSimulatorMode } from '@/lib/simulator/runtime';
import { createSimulatorBase44 } from '@/lib/simulator/mock-base44';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const createRealClient = () => createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

export const base44 = isSimulatorMode ? createSimulatorBase44() : createRealClient();
