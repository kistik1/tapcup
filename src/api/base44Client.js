import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { isSimulatorMode } from '@/lib/simulator/runtime';
import { createSimulatorBase44 } from '@/lib/simulator/mock-base44';

const { appId, token, functionsVersion, appBaseUrl } = appParams;
const apiKey = import.meta.env.VITE_BASE44_API_KEY;

const createRealClient = () => createClient({
  appId,
  token,
  functionsVersion,
  requiresAuth: false,
  appBaseUrl,
  ...(apiKey ? { headers: { api_key: apiKey } } : {}),
});

export const base44 = isSimulatorMode ? createSimulatorBase44() : createRealClient();
