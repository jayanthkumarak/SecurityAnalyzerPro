<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  // State management
  let files: FileList | null = null;
  let context = '';
  let isAnalyzing = false;
  let analysisId = '';
  let analysisStatus = '';
  let streamingContent = '';
  let analysisResults: any = null;
  let error = '';
  let eventSource: EventSource | null = null;
  let selectedTier = 'pro'; // Default to pro tier
  
  // LCARS Navigation
  let activeNav = 0;
  const navItems = ["Analysis", "Reports", "Database", "Settings"];
  function setActiveNav(idx: number) {
    activeNav = idx;
  }

  // Stardate calculation
  let stardate = '';

  function getDayOfYear(date: Date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / 86_400_000); // ms in a day
  }

  function updateStardate() {
    const now = new Date();
    const year = now.getFullYear();
    const dayOfYear = String(getDayOfYear(now)).padStart(3, '0');
    const time = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    stardate = `${year}.${dayOfYear} • ${time}`;
  }

  onMount(() => {
    updateStardate();
    const interval = setInterval(updateStardate, 1000);
    return () => clearInterval(interval);
  });
  
  // File upload handling
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    files = target.files;
    error = '';
  }
  
  // Start analysis
  async function startAnalysis() {
    if (!files || files.length === 0) {
      error = 'Please select at least one file to analyze';
      return;
    }
    
    isAnalyzing = true;
    error = '';
    streamingContent = '';
    analysisResults = null;
    
    try {
      const formData = new FormData();
      
      // Add files
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      
      // Add context
      if (context) {
        formData.append('context', new Blob([context], { type: 'text/plain' }), 'context.txt');
      }
      
      // Start analysis
      const response = await fetch('http://localhost:4000/analyze', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      analysisId = result.analysisId;
      analysisStatus = result.status;
      
      // Start streaming
      startStreaming();
      
      // Poll for results
      pollForResults();
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Analysis failed';
      isAnalyzing = false;
    }
  }
  
  // Start streaming analysis
  function startStreaming() {
    if (!analysisId) return;
    
    eventSource = new EventSource(`http://localhost:4000/analysis/${analysisId}/stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.token) {
          streamingContent += data.token;
        }
      } catch (err) {
        console.error('Stream parse error:', err);
      }
    };
    
    eventSource.onerror = (err) => {
      console.error('Stream error:', err);
      eventSource?.close();
      eventSource = null;
    };
  }
  
  // Poll for analysis results
  async function pollForResults() {
    if (!analysisId) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:4000/analysis/${analysisId}/status`);
        const status = await response.json();
        
        analysisStatus = status.status;
        
        if (status.status === 'completed') {
          clearInterval(pollInterval);
          await fetchResults();
          isAnalyzing = false;
        } else if (status.status === 'failed') {
          clearInterval(pollInterval);
          error = 'Analysis failed';
          isAnalyzing = false;
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 2000);
  }
  
  // Fetch final results
  async function fetchResults() {
    if (!analysisId) return;
    
    try {
      const response = await fetch(`http://localhost:4000/analysis/${analysisId}/results`);
      analysisResults = await response.json();
    } catch (err) {
      error = 'Failed to fetch results';
    }
  }
  
  // Download report
  async function downloadReport(format: 'markdown' | 'json') {
    if (!analysisId) return;
    
    try {
      const response = await fetch(`http://localhost:4000/analysis/${analysisId}/report?format=${format}`);
      const content = format === 'json' ? await response.json() : await response.text();
      
      const blob = new Blob([format === 'json' ? JSON.stringify(content, null, 2) : content], {
        type: format === 'json' ? 'application/json' : 'text/markdown'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `forensic-report-${analysisId}.${format === 'json' ? 'json' : 'md'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      error = 'Failed to download report';
    }
  }
  
  onDestroy(() => {
    eventSource?.close();
  });
</script>

<div class="lcars-container font-sans bg-lcars-bg min-h-screen text-lcars-text">
  <header class="lcars-header flex mb-8 items-stretch h-20">
    <div class="lcars-title-block bg-lcars-cyan rounded-lg px-6 py-4 mr-4 flex items-center w-72">
      <span class="lcars-title font-lcars font-bold text-2xl tracking-wide">ForensicAnalyzerPro</span>
    </div>
    <div class="lcars-header-bar flex flex-grow gap-4">
      <div class="lcars-pill lcars-pill-lg bg-lcars-pink rounded-lg flex-grow"></div>
      <div class="lcars-pill lcars-pill-sm bg-lcars-cyan rounded-lg w-20"></div>
      <div class="lcars-pill lcars-pill-lg bg-lcars-purple rounded-lg flex-grow"></div>
      <div class="lcars-pill lcars-pill-sm bg-lcars-pink rounded-lg w-20"></div>
    </div>
  </header>

  <nav class="lcars-nav flex mb-8 gap-4">
    {#each navItems as item, idx}
      <div
        class="lcars-nav-item px-5 py-3 bg-white rounded-sm font-lcars font-bold cursor-pointer transition-all duration-200 shadow hover:bg-lcars-cyan hover:-translate-y-0.5 {activeNav === idx ? 'active bg-lcars-cyan -translate-y-0.5' : ''}"
        on:click={() => setActiveNav(idx)}
        tabindex="0"
        role="button"
        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveNav(idx)}
      >
        {item}
      </div>
    {/each}
  </nav>

  <main class="lcars-main">
    {#if activeNav === 0}
      <!-- Analysis Panel -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- Upload Section -->
        <div class="lg:col-span-2">
          <div class="lcars-card bg-white rounded-lg overflow-hidden shadow">
            <div class="lcars-card-header h-4 bg-lcars-cyan"></div>
            <div class="lcars-card-body p-6">
              <h2 class="lcars-card-title font-lcars font-bold text-xl mb-4 text-gray-800">Evidence Upload</h2>
              
              <div class="space-y-4">
                <!-- File Upload -->
                <div>
                  <label for="file-upload" class="block text-sm font-medium mb-2 text-gray-700">Evidence Files</label>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    on:change={handleFileSelect}
                    class="w-full p-3 bg-gray-50 rounded-lg border border-gray-300 focus:border-lcars-cyan focus:outline-none text-gray-800"
                    accept=".json,.xml,.csv,.log,.txt,.evtx"
                  />
                  <p class="text-xs text-gray-500 mt-1">Supported: M365 logs, audit trails, MSDE packages, event logs</p>
                </div>
                
                <!-- Context Input -->
                <div>
                  <label for="context" class="block text-sm font-medium mb-2 text-gray-700">Analysis Context</label>
                  <textarea
                    id="context"
                    bind:value={context}
                    placeholder="Provide additional context for the analysis..."
                    class="w-full p-3 bg-gray-50 rounded-lg border border-gray-300 focus:border-lcars-cyan focus:outline-none h-24 resize-none text-gray-800"
                  ></textarea>
                </div>
                
                <!-- Tier Selection -->
                <div>
                  <span class="block text-sm font-medium mb-2 text-gray-700">Analysis Tier</span>
                  <div class="flex gap-4">
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
                
                <!-- Analyze Button -->
                <button
                  on:click={startAnalysis}
                  disabled={isAnalyzing || !files}
                  class="lcars-button inline-block px-5 py-2 bg-lcars-cyan rounded-sm font-lcars font-bold cursor-pointer transition-all duration-200 border-0 text-lcars-text hover:bg-lcars-purple hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
                </button>
              </div>
              
              {#if error}
                <div class="mt-4 p-3 bg-red-100 border border-red-400 rounded-lg text-red-700">
                  {error}
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Status Panel -->
        <div class="lcars-card bg-white rounded-lg overflow-hidden shadow">
          <div class="lcars-card-header h-4 bg-lcars-purple"></div>
          <div class="lcars-card-body p-6">
            <h2 class="lcars-card-title font-lcars font-bold text-xl mb-4 text-gray-800">System Status</h2>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">API Status</span>
                <span class="text-green-600 font-medium">ONLINE</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Analysis Tier</span>
                <span class="text-lcars-cyan font-medium uppercase">{selectedTier}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Models Available</span>
                <span class="text-gray-800 font-medium">{selectedTier === 'pro' ? '5' : '1'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Analysis Progress/Results -->
      {#if isAnalyzing || analysisResults}
        <div class="lcars-card bg-white rounded-lg overflow-hidden shadow">
          <div class="lcars-card-header h-4 bg-lcars-pink"></div>
          <div class="lcars-card-body p-6">
            <h2 class="lcars-card-title font-lcars font-bold text-xl mb-4 text-gray-800">
              {isAnalyzing ? 'Analysis in Progress' : 'Analysis Complete'}
            </h2>
            
            {#if isAnalyzing}
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <div class="animate-spin h-5 w-5 border-2 border-lcars-cyan border-t-transparent rounded-full"></div>
                  <span class="text-gray-700">Status: {analysisStatus}</span>
                </div>
                
                {#if streamingContent}
                  <div class="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto border border-gray-200">
                    <h3 class="text-sm font-medium mb-2 text-gray-600">Live Stream (Gemini Flash)</h3>
                    <pre class="whitespace-pre-wrap text-sm text-gray-800 font-mono">{streamingContent}</pre>
                  </div>
                {/if}
              </div>
            {/if}
            
            {#if analysisResults}
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-medium text-gray-800">Analysis Complete</h3>
                  <div class="flex gap-2">
                    <button
                      on:click={() => downloadReport('markdown')}
                      class="lcars-button px-4 py-2 bg-lcars-cyan text-white rounded-sm text-sm hover:bg-lcars-purple"
                    >
                      Download MD
                    </button>
                    <button
                      on:click={() => downloadReport('json')}
                      class="lcars-button px-4 py-2 bg-lcars-cyan text-white rounded-sm text-sm hover:bg-lcars-purple"
                    >
                      Download JSON
                    </button>
                  </div>
                </div>
                
                <!-- Summary -->
                {#if analysisResults.synthesis}
                  <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 class="font-medium mb-2 text-gray-800">Summary</h4>
                    <p class="text-sm text-gray-700">{analysisResults.synthesis.summary}</p>
                    <div class="mt-2 text-sm text-gray-600">
                      Confidence Score: {analysisResults.synthesis.confidenceScore.toFixed(1)}%
                    </div>
                  </div>
                  
                  <!-- Consensus Findings -->
                  {#if analysisResults.synthesis.consensusFindings.length > 0}
                    <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 class="font-medium mb-3 text-gray-800">Consensus Findings</h4>
                      <div class="space-y-3">
                        {#each analysisResults.synthesis.consensusFindings as finding}
                          <div class="border-l-4 border-{finding.severity === 'critical' ? 'red' : finding.severity === 'high' ? 'orange' : finding.severity === 'medium' ? 'yellow' : 'green'}-500 pl-4">
                            <div class="flex items-center gap-2 mb-1">
                              <span class="text-sm font-medium text-gray-800">{finding.category}</span>
                              <span class="text-xs px-2 py-1 bg-gray-200 rounded-full text-gray-700">{finding.severity}</span>
                            </div>
                            <p class="text-sm text-gray-600">{finding.description}</p>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}
                {/if}
                
                <!-- Model Artifacts -->
                {#if analysisResults.artifacts}
                  <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 class="font-medium mb-3 text-gray-800">Model Analysis</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {#each analysisResults.artifacts as artifact}
                        <div class="bg-white rounded p-3 border border-gray-300">
                          <div class="text-sm font-medium mb-1 text-gray-800">{artifact.modelName}</div>
                          <div class="text-xs text-gray-600">
                            Findings: {artifact.findings.length} | 
                            Confidence: {artifact.confidence}% | 
                            Time: {artifact.processingTime}ms
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      {/if}
    {:else}
      <!-- Other nav sections -->
      <div class="lcars-card bg-white rounded-lg overflow-hidden shadow">
        <div class="lcars-card-header h-4 bg-lcars-yellow"></div>
        <div class="lcars-card-body p-6">
          <h2 class="lcars-card-title font-lcars font-bold text-xl mb-4 text-gray-800">{navItems[activeNav]}</h2>
          <p class="text-gray-600">This section is under construction.</p>
        </div>
      </div>
    {/if}
  </main>

  <div class="lcars-status flex items-center justify-center font-lcars text-sm mt-5">
    <div class="lcars-status-indicator w-2.5 h-2.5 bg-green-500 rounded-full mr-2 animate-pulse"></div>
    <span>System Online • Stardate {stardate}</span>
  </div>

  <footer class="lcars-footer flex mt-10 items-stretch h-16">
    <div class="lcars-header-bar flex flex-grow gap-4">
      <div class="lcars-pill lcars-pill-lg bg-lcars-pink rounded-lg flex-grow"></div>
      <div class="lcars-pill lcars-pill-sm bg-lcars-cyan rounded-lg w-20"></div>
      <div class="lcars-pill lcars-pill-lg bg-lcars-purple rounded-lg flex-grow"></div>
      <div class="lcars-pill lcars-pill-sm bg-lcars-pink rounded-lg w-20"></div>
    </div>
  </footer>
</div>

<style>
  .active {
    background-color: var(--accent-cyan) !important;
    transform: translateY(-2px) !important;
  }

  /* Fix layout issues */
  .lcars-container {
    min-height: 100vh;
    height: 100vh;
    overflow-y: auto;
    padding: 20px;
    box-sizing: border-box;
  }

  .lcars-main {
    flex: 1;
    min-height: 0;
  }

  /* Ensure the page doesn't extend beyond viewport */
  :global(body) {
    margin: 0;
    padding: 0;
    height: 100vh;
    overflow: hidden;
  }

  :global(html) {
    height: 100%;
  }

  /* Custom scrollbar for LCARS theme */
  :global(.overflow-y-auto::-webkit-scrollbar) {
    width: 8px;
  }
  
  :global(.overflow-y-auto::-webkit-scrollbar-track) {
    background: #e5e7eb;
    border-radius: 4px;
  }
  
  :global(.overflow-y-auto::-webkit-scrollbar-thumb) {
    background: #9ca3af;
    border-radius: 4px;
  }
  
  :global(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
    background: #6b7280;
  }
</style>
