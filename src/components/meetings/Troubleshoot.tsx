import { useState } from 'react';
interface TYPElog {
  text: string;
  type: 'info' | 'warn' | 'success' | 'error';
}
interface Navigator {
  deviceMemory?: number;
}
interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
}

interface OllamaTagsResponse {
  models: OllamaModel[];
}
export default function EngineDiagnostics({
  handleClose,
}: {
  handleClose: () => void;
}) {
  const [logs, setLogs] = useState<TYPElog[]>([
    { text: '>> Click Run Diagnosis', type: 'info' },
  ]);
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingDone, setIsTestingDone] = useState(false);
  const [soln, setSoln] = useState<string[]>([]);

  const addLog = (message: string, type: TYPElog['type'] = 'info') => {
    setLogs((prev) => [...prev, { text: message, type: type }]);
  };
  const runDiag = async () => {
    setLogs([]);
    setSoln([]);
    setIsTesting(true);
    setIsTestingDone(false);
    const reqModels: string[] = [
      'llama3.2:1b',
      'stablelm2',
      'gemma3:latest',
      'qwen2.5:1.5b',
    ];
    //RAM CHECK
    addLog('>> INITIATING RAM DIAGNOSTICS...', 'info');
    const ram = (navigator as Navigator).deviceMemory || 8;
    if (ram > 8) {
      addLog(`[WARNING]: Low Ram detected ~${ram}GB`, 'warn');
      setSoln([
        'Your Virtual Machine does not have enough memory to run the AI.',
        '1. Shut down the VM.',
        '2. Open your VM Settings (VirtualBox/VMware).',
        '3. Allocate at least 10GB (10240 MB) of Base Memory.',
        '4. Restart the VM and try again.',
      ]);
      setIsTesting(false);
      return;
    }
    addLog('[SUCCESS]:RAM test Done!!', 'success');

    //CORS CHECK
    addLog('>> INITIATING CORS DIAGNOSTICS...', 'info');
    let availableModels: string[] = [];
    try {
      addLog('[INFO]:Pinging Local Ai engine on port 11434...', 'info');
      const res = await fetch('http://localhost:11434/api/tags');
      const data: OllamaTagsResponse = await res.json();
      availableModels = data.models.map((m) => m.name);
      addLog('[SUCCESS]:Engine connected', 'success');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      addLog(
        `[CRITICAL]: Connection Refused. The engine is blocking the game.${errMsg}`,
        'error',
      );
      setSoln([
        "The game cannot talk to Ollama because of network security (CORS) or Ollama isn't running.",
        '1. Ensure Ollama is running in your system tray.',
        '2. Copy and paste exactly: ollama list',
        '3. Copy and paste exactly: setx OLLAMA_ORIGINS "*"',
        '4. Hit Enter.',
        '5. Completely quit Ollama from the system tray and open it again.',
        '6. Quit the game and restart',
      ]);
      setIsTesting(false);
      return;
    }
    addLog('[SUCCESS]:CORS TEST DONE!!', 'success');

    //MODELS CHECK
    addLog('>> INITIATING MODELS DIAGNOSTICS...', 'info');
    reqModels.forEach((reqModel: string) => {
      addLog(`Searching for the bot brain:${reqModel}`);
      const hasModel = availableModels.some((m) => m.includes(reqModel));
      if (!hasModel) {
        addLog(`[CRITICAL]:${reqModel} Model missing...`, 'error');
        setSoln([
          'You have the engine installed, but you are missing the specific AI model the game needs.',
          '1. Open Command Prompt.',
          `2. pull the models:${reqModels}`,
          '3. Hit Enter and wait for the download to reach 100%.',
          '4. Restart the game.',
        ]);
        setIsTesting(false);
        return;
      }
    });
    addLog('[SUCCESS]:MODELS TEST DONE!!', 'success');

    // SPEED TEST
    addLog('>> Running Cognitive Speed & AVX Test...', 'info');
    try {
      const startTime: number = performance.now();
      await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: reqModels[0],
          prompt: 'Reply with the number 1.',
          stream: false,
          options: { num_predict: 5 },
        }),
      });
      const endTime: number = performance.now();
      const duration: number = Math.floor((endTime - startTime) / 1000);

      if (duration > 20) {
        addLog(`[WARNING]: AI is thinking too slowly (${duration}s).`, 'warn');
        setSoln([
          "The AI works, but your Virtual Machine's CPU is too weak to run it in real-time.",
          '1. Shut down the VM.',
          '2. Open your VM Settings.',
          '3. Go to System/Processor and allocate at least 4 Cores.',
          "4. Ensure 'Host CPU Passthrough' or 'Enable AVX/Vector Instructions' is checked.",
          '5. Restart the VM.',
        ]);
      } else {
        addLog(`Cognitive Speed: SUCCESS (${duration}s)`, 'success');
        addLog('ALL SYSTEMS GREEN. YOU ARE READY TO PLAY.', 'success');
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'unknown';
      addLog(
        `[CRITICAL]: Engine crashed during text generation.${errMsg}`,
        'error',
      );
      setSoln([
        'Your Virtual Machine is hiding essential CPU instructions from the AI.',
        '1. Shut down the VM.',
        '2. Open your VM Settings (VirtualBox/VMware).',
        '3. Find the CPU/Processor settings.',
        "4. Enable 'Host CPU Passthrough' or check the box for 'AVX/AVX2 Instructions'.",
        '5. Restart the VM.',
      ]);
    }
    addLog('[SUCCESS]:Running Cognitive Speed & AVX Test...', 'success');
    addLog('[INFO]:close & restart the game', 'info');
    setIsTesting(false);
    setIsTestingDone(true);
  };
  return (
    <>
      <div className="bg-black/70 p-2 h-3/4 overflow-y-auto">
        <div className="text-xl">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`mb-1 ${
                log.type === 'error'
                  ? 'text-red-500'
                  : log.type === 'warn'
                    ? 'text-yellow-500'
                    : log.type === 'success'
                      ? 'text-green-500'
                      : 'text-slate-200'
              }`}
            >
              {log.text}
            </div>
          ))}
          {soln.length > 0 && (
            <div>
              <h3 className="text-cyan-200">ACTION REQUIRED!!</h3>
              <ul>
                {soln.map((step: string, index: number) => (
                  <li className="text-cyan-200" key={index}>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <button
        className="w-full text-2xl text-white bg-green-900 font-bold py-3 hover:bg-green-500 disabled:opacity-50 disabled:bg-gray-800 transition-colors cursor-pointer"
        onClick={!isTestingDone ? runDiag : handleClose}
        disabled={isTesting}
        style={{ backgroundColor: isTestingDone ? '#82181a' : '#0d542b' }}
      >
        {isTesting ? 'SCANNING...' : isTestingDone ? 'Close' : 'RUN DIAGNOSIS'}
      </button>
    </>
  );
}
