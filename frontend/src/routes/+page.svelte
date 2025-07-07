<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  
  // State management
  let files: FileList | null = null;
  let context = '';
  let isAnalyzing = false;
  let analysisId = '';
  let analysisStatus = 'pending';
  let analysisProgress = 0;
  let analysisSummary = '';
  let modelStatuses: Record<string, string> = {};
  let error = '';
  let eventSource: EventSource | null = null;
  let selectedTier = 'pro'; // Default to pro tier
  let estimatedTime = '';
  
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
    const selectedFiles = target.files;
    error = '';
    
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }
    
    // Validate file types and sizes
    const allowedTypes = ['.json', '.xml', '.csv', '.log', '.txt', '.evtx'];
    const maxFileSize = 100 * 1024 * 1024; // 100MB
    const invalidFiles: string[] = [];
    const oversizedFiles: string[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        invalidFiles.push(file.name);
      }
      
      if (file.size > maxFileSize) {
        oversizedFiles.push(file.name);
      }
    }
    
    if (invalidFiles.length > 0) {
      error = `Unsupported file types: ${invalidFiles.join(', ')}. Please upload only: ${allowedTypes.join(', ')} files.`;
      target.value = ''; // Clear the input
      return;
    }
    
    if (oversizedFiles.length > 0) {
      error = `Files too large (max 100MB): ${oversizedFiles.join(', ')}. Please reduce file size or split into smaller files.`;
      target.value = ''; // Clear the input
      return;
    }
    
    files = selectedFiles;
  }
  
  // Start analysis
  async function startAnalysis() {
    if (!files || files.length === 0) {
      error = 'Please select at least one file to analyze';
      return;
    }
    
    isAnalyzing = true;
    error = '';
    analysisProgress = 0;
    analysisSummary = '';
    modelStatuses = {};
    
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
      estimatedTime = result.estimatedTime || '5-10 minutes';
      
      // Initialize model statuses
      if (result.models) {
        result.models.forEach((model: string) => {
          modelStatuses[model] = 'pending';
        });
      }
      
      // Start streaming
      startStreaming();
      
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
        
        // Update progress, summary, and status only
        if (data.progress !== undefined) {
          analysisProgress = data.progress;
        }
        
        if (data.summary) {
          analysisSummary = data.summary;
        }
        
        if (data.status) {
          analysisStatus = data.status;
          
          // If completed, auto-route to report page
          if (data.status === 'completed') {
            setTimeout(() => {
              goto(`/report/${analysisId}`);
            }, 1000); // Small delay to show completion
          }
        }
        
        // Update model statuses if provided
        if (data.modelStatuses) {
          modelStatuses = { ...modelStatuses, ...data.modelStatuses };
        }
        
      } catch (err) {
        console.error('Stream parse error:', err);
      }
    };
    
    eventSource.onerror = (err) => {
      console.error('Stream error:', err);
      eventSource?.close();
      eventSource = null;
      
      if (analysisStatus !== 'completed') {
        // Provide user-friendly error messages
        if (err.type === 'error') {
          error = 'Connection to analysis server lost. Please check your internet connection and try again.';
        } else {
          error = 'An unexpected error occurred during analysis. Please try again.';
        }
        isAnalyzing = false;
      }
    };
  }
  
  onDestroy(() => {
    eventSource?.close();
  });

  // Get status badge color
  function getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-lcars-cyan';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  }

  // Get model name for display
  function getModelDisplayName(modelName: string): string {
    const displayNames: Record<string, string> = {
      'google/gemini-2.5-flash': 'Gemini Flash',
      'google/gemini-2.5-pro': 'Gemini Pro',
      'openai/gpt-4.1': 'GPT-4.1',
      'anthropic/claude-sonnet-4': 'Claude Sonnet',
      'deepseek/deepseek-chat': 'DeepSeek'
    };
    return displayNames[modelName] || modelName;
  }
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

  <nav class="lcars-nav flex mb-8 gap-4" role="navigation" aria-label="Main navigation">
    {#each navItems as item, idx}
      <div
        class="lcars-nav-item px-5 py-3 bg-white rounded-sm font-lcars font-bold cursor-pointer transition-all duration-200 shadow hover:bg-lcars-cyan hover:-translate-y-0.5 {activeNav === idx ? 'active bg-lcars-cyan -translate-y-0.5' : ''}"
        on:click={() => setActiveNav(idx)}
        tabindex="0"
        role="button"
        aria-pressed={activeNav === idx}
        aria-label={`Navigate to ${item}`}
        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveNav(idx)}
      >
        {item}
      </div>
    {/each}
  </nav>

  <main class="lcars-main">
    {#if activeNav === 0}
      {#if isAnalyzing}
        <!-- Full-Screen Progress Interface -->
        <div class="fixed inset-0 bg-lcars-bg z-50 flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 bg-black/20">
            <h1 class="text-3xl font-lcars font-bold text-lcars-cyan">FORENSIC ANALYSIS IN PROGRESS</h1>
            <div class="text-lg font-lcars">Stardate {stardate}</div>
          </div>
          
          <!-- Main Progress Area -->
          <div class="flex-1 flex flex-col justify-center items-center px-6">
                      <!-- Progress Bar -->
          <div class="w-full max-w-4xl mb-8" role="region" aria-label="Analysis progress">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xl font-lcars text-lcars-cyan">ANALYSIS PROGRESS</span>
              <span class="text-xl font-lcars text-lcars-cyan">{Math.round(analysisProgress)}%</span>
            </div>
            
            <!-- LCARS Progress Bar -->
            <div 
              class="relative h-8 bg-gray-700 rounded-full overflow-hidden border-2 border-lcars-cyan"
              role="progressbar"
              aria-valuenow={Math.round(analysisProgress)}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Analysis completion progress"
            >
              <div 
                class="absolute top-0 left-0 h-full bg-gradient-to-r from-lcars-cyan to-lcars-purple transition-all duration-500 ease-out rounded-full"
                style="width: {analysisProgress}%"
              ></div>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-sm font-lcars font-bold text-white drop-shadow">
                  {Math.round(analysisProgress)}% COMPLETE
                </div>
              </div>
            </div>
              
              <!-- Status Information -->
              <div class="flex items-center justify-between mt-4 text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-lcars-cyan animate-pulse"></div>
                  <span class="font-lcars uppercase">{analysisStatus}</span>
                </div>
                <span class="text-gray-400">Est. Time: {estimatedTime}</span>
              </div>
            </div>
            
            <!-- Live Summary Card -->
            {#if analysisSummary}
              <div class="w-full max-w-4xl mb-8">
                <div class="lcars-card bg-black/40 rounded-lg overflow-hidden border border-lcars-cyan">
                  <div class="lcars-card-header h-4 bg-lcars-cyan"></div>
                  <div class="lcars-card-body p-6">
                    <h3 class="text-xl font-lcars font-bold mb-4 text-lcars-cyan">ANALYSIS SUMMARY</h3>
                    <p class="text-lg leading-relaxed text-white">{analysisSummary}</p>
                  </div>
                </div>
              </div>
            {/if}
            
            <!-- Model Status Indicators -->
            {#if Object.keys(modelStatuses).length > 0}
              <div class="w-full max-w-4xl" role="region" aria-label="AI Model status indicators">
                <h3 class="text-xl font-lcars font-bold mb-4 text-lcars-cyan">MODEL STATUS</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
                  {#each Object.entries(modelStatuses) as [modelName, status]}
                    <div 
                      class="flex items-center gap-3 p-4 bg-black/40 rounded-lg border border-gray-600"
                      role="listitem"
                      aria-label={`${getModelDisplayName(modelName)} status: ${status}`}
                    >
                      <div 
                        class="w-4 h-4 rounded-full {getStatusColor(status)} {status === 'processing' ? 'animate-pulse' : ''}"
                        aria-hidden="true"
                      ></div>
                      <div class="flex-1">
                        <div class="font-lcars font-bold text-white">{getModelDisplayName(modelName)}</div>
                        <div class="text-sm text-gray-400 uppercase" aria-label="Status">{status}</div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
          
          <!-- Footer -->
          <div class="p-6 bg-black/20 text-center">
            <div class="text-sm text-gray-400">
              Multi-LLM Analysis Engine • {selectedTier.toUpperCase()} Tier • Case ID: {analysisId}
            </div>
          </div>
        </div>
      {:else}
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
                    disabled={!files}
                    class="lcars-button inline-block px-5 py-2 bg-lcars-cyan rounded-sm font-lcars font-bold cursor-pointer transition-all duration-200 border-0 text-lcars-text hover:bg-lcars-purple hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start Analysis
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
