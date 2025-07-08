<script lang="ts">
  import { onMount } from 'svelte';
  let files: FileList | null = null;
  let context = '';
  let isAnalyzing = false;
  let error = '';
  let selectedTier = 'pro';
  let apiStatus = 'checking';
  let analysisId = '';
  let analysisStatus = '';
  let modelProgress: { [key: string]: 'pending' | 'processing' | 'completed' | 'failed' } = {};
  let progressInterval: ReturnType<typeof setInterval> | null = null;
  let stardate = '';
  let loadingProgress = 0;
  
  function updateStardate() {
    const now = new Date();
    const year = now.getFullYear();
    const dayOfYear = Math.floor((now.getTime() - new Date(year, 0, 0).getTime()) / 86400000);
    const time = now.toLocaleTimeString([], { hour12: false });
    stardate = `${year}.${String(dayOfYear).padStart(3, '0')} • ${time}`;
  }
  
  onMount(() => {
    updateStardate();
    const interval = setInterval(updateStardate, 1000);
    return () => clearInterval(interval);
  });
  
  async function checkApiStatus() {
    try {
      const response = await fetch('http://localhost:4000/health');
      apiStatus = response.ok ? 'online' : 'error';
    } catch (err) {
      apiStatus = 'offline';
      console.error('API status check failed:', err);
    }
  }
  
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    files = target.files;
    error = '';
  }
  
  checkApiStatus();
  
  function getModelLabel(modelName: string): string {
    const modelMap: { [key: string]: string } = {
      'google/gemini-2.5-flash': 'Model A',
      'google/gemini-2.5-pro': 'Model B', 
      'openai/gpt-4.1': 'Model C',
      'anthropic/claude-sonnet-4': 'Model D',
      'deepseek/deepseek-chat': 'Model E'
    };
    return modelMap[modelName] || modelName;
  }
  
  function getModelDescription(modelName: string): string {
    const descriptions: { [key: string]: string } = {
      'google/gemini-2.5-flash': 'Rapid Analysis',
      'google/gemini-2.5-pro': 'Deep Dive Analysis',
      'openai/gpt-4.1': 'Pattern Recognition',
      'anthropic/claude-sonnet-4': 'Executive Synthesis',
      'deepseek/deepseek-chat': 'Technical Assessment'
    };
    return descriptions[modelName] || 'Analysis';
  }
  
  function initializeModelProgress() {
    const proModels = [
      'google/gemini-2.5-flash',
      'google/gemini-2.5-pro', 
      'openai/gpt-4.1',
      'anthropic/claude-sonnet-4',
      'deepseek/deepseek-chat'
    ];
    const freeModels = ['google/gemini-2.5-flash'];
    const models = selectedTier === 'pro' ? proModels : freeModels;
    
    modelProgress = {};
    models.forEach(model => {
      modelProgress[model] = 'pending';
    });
  }
  
  async function pollAnalysisProgress() {
    if (!analysisId) return;
    
    try {
      const response = await fetch(`http://localhost:4000/analysis/${analysisId}/status`);
      if (response.ok) {
        const status = await response.json();
        
        if (status.status === 'completed') {
          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
          
          Object.keys(modelProgress).forEach(model => {
            modelProgress[model] = 'completed';
          });
          
          loadingProgress = 100;
          analysisStatus = 'Analysis completed! Redirecting to report...';
          
          setTimeout(() => {
            window.location.href = `/report/${analysisId}`;
          }, 2000);
          
          return;
        }
        
        if (status.artifacts > 0) {
          const completedCount = status.artifacts;
          const totalModels = Object.keys(modelProgress).length;
          
          const modelNames = Object.keys(modelProgress);
          for (let i = 0; i < modelNames.length; i++) {
            if (i < completedCount) {
              modelProgress[modelNames[i]] = 'completed';
            } else if (i === completedCount) {
              modelProgress[modelNames[i]] = 'processing';
            } else {
              modelProgress[modelNames[i]] = 'pending';
            }
          }
          
          // Update loading progress
          loadingProgress = Math.min((completedCount / totalModels) * 100, 95);
        }
      }
    } catch (err) {
      console.error('Progress polling error:', err);
    }
  }
  
  async function startAnalysis() {
    if (!files || files.length === 0) {
      error = 'Please select at least one file to analyze';
      return;
    }
    
    isAnalyzing = true;
    error = '';
    analysisStatus = 'Initializing analysis...';
    loadingProgress = 0;
    
    initializeModelProgress();
    
    try {
      const formData = new FormData();
      
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      
      if (context) {
        formData.append('context', new Blob([context], { type: 'text/plain' }), 'context.txt');
      }
      
      const response = await fetch('http://localhost:4000/analyze', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Analysis failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      analysisId = result.analysisId;
      analysisStatus = `Analysis started! Processing with ${selectedTier === 'pro' ? '5' : '1'} intelligence models...`;
      loadingProgress = 10;
      
      progressInterval = setInterval(pollAnalysisProgress, 2000);
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Analysis failed';
      isAnalyzing = false;
      loadingProgress = 0;
    }
  }
</script>

<div class="card">
  <h2 class="text-xl font-bold mb-4 text-gray-800">Evidence Upload</h2>
  <div class="mb-4">
    <label for="file-upload" class="text-gray-700 font-medium">Evidence Files</label>
    <input id="file-upload" type="file" multiple on:change={handleFileSelect} accept=".json,.xml,.csv,.log,.txt,.evtx" />
    <p class="text-xs text-gray-600 mt-1">Supported: JSON, XML, CSV, LOG, TXT, EVTX</p>
  </div>
  <div class="mb-4">
    <label for="context" class="text-gray-700 font-medium">Analysis Context</label>
    <textarea id="context" bind:value={context} placeholder="Provide additional context for the analysis..."></textarea>
  </div>
  <div class="mb-4">
    <span class="text-gray-700 font-medium">Analysis Tier</span>
    <div class="flex gap-4 mt-2">
      <label class="flex items-center text-gray-700">
        <input type="radio" bind:group={selectedTier} value="free" class="mr-2" />
        <span>Free (1 model)</span>
      </label>
      <label class="flex items-center text-gray-700">
        <input type="radio" bind:group={selectedTier} value="pro" class="mr-2" />
        <span>Pro (5 models)</span>
      </label>
    </div>
  </div>
  <button on:click={startAnalysis} disabled={!files || isAnalyzing} class="button">
    {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
  </button>
  
  {#if error}
    <div class="mt-4 p-3 bg-red-100 border border-red-400 rounded text-red-700">{error}</div>
  {/if}
  
  {#if analysisStatus}
    <div class="mt-4 p-3 bg-green-100 border border-green-400 rounded text-green-700">{analysisStatus}</div>
  {/if}
  
  {#if isAnalyzing}
    <div class="mt-4">
      <div class="loading-bar">
        <div class="loading-bar-fill" style="width: {loadingProgress}%"></div>
      </div>
      <div class="text-sm text-gray-600 text-center mt-2">Progress: {Math.round(loadingProgress)}%</div>
    </div>
  {/if}
  
  {#if isAnalyzing && Object.keys(modelProgress).length > 0}
    <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
      <h3 class="font-bold text-blue-800 mb-3">Intelligence Team Analysis</h3>
      <div class="space-y-2">
        {#each Object.entries(modelProgress) as [model, status]}
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="model-label">{getModelLabel(model)}</span>
              <span class="text-sm text-gray-600">({getModelDescription(model)})</span>
            </div>
            <div class="flex items-center">
              {#if status === 'pending'}
                <div class="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
                <span class="text-xs text-gray-500">Standby</span>
              {:else if status === 'processing'}
                <div class="w-3 h-3 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                <span class="text-xs text-yellow-600">Active</span>
              {:else if status === 'completed'}
                <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span class="text-xs text-green-600">Complete</span>
              {:else if status === 'failed'}
                <div class="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span class="text-xs text-red-600">Failed</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<div class="card">
  <h2 class="text-xl font-bold mb-4 text-gray-800">System Status</h2>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <span class="text-gray-600">API Status</span>
      <span class="font-medium {apiStatus === 'online' ? 'text-green-600' : apiStatus === 'offline' ? 'text-red-600' : 'text-yellow-600'}">
        {apiStatus.toUpperCase()}
      </span>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-gray-600">Analysis Tier</span>
      <span class="text-blue-700 font-medium uppercase">{selectedTier}</span>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-gray-600">Models Available</span>
      <span class="font-medium text-gray-800">{selectedTier === 'pro' ? '5' : '1'}</span>
    </div>
    <div class="flex items-center justify-between">
      <span class="text-gray-600">Files Selected</span>
      <span class="font-medium text-gray-800">{files ? files.length : 0}</span>
    </div>
    {#if analysisId}
      <div class="flex items-center justify-between">
        <span class="text-gray-600">Analysis ID</span>
        <span class="font-medium text-gray-800 text-xs">{analysisId}</span>
      </div>
    {/if}
  </div>
</div>

<div class="text-sm text-gray-500 mt-8 text-center">System Online • Stardate {stardate}</div>
