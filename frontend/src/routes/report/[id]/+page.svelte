<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  // Get analysis ID from URL params
  $: analysisId = $page.params.id;
  
  // State management
  let loading = true;
  let error = '';
  let analysisResults: any = null;
  let richMediaReport: any = null;
  let executiveSummary = '';
  
  // Stardate calculation
  let stardate = '';

  function getDayOfYear(date: Date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / 86_400_000);
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
    
    if (!analysisId) {
      error = 'Invalid analysis ID';
      loading = false;
      return () => clearInterval(interval);
    }
    
    // Fetch results asynchronously
    fetchAnalysisResults();
    
    return () => clearInterval(interval);
  });
  
  async function fetchAnalysisResults() {
    try {
      // Fetch main analysis results
      const resultsResponse = await fetch(`http://localhost:4000/analysis/${analysisId}/results`);
      if (!resultsResponse.ok) {
        throw new Error('Failed to fetch analysis results');
      }
      analysisResults = await resultsResponse.json();
      
      // Fetch rich media report
      const richMediaResponse = await fetch(`http://localhost:4000/analysis/${analysisId}/rich-results`);
      if (richMediaResponse.ok) {
        richMediaReport = await richMediaResponse.json();
      }
      
      // Generate executive summary from highest quality model
      generateExecutiveSummary();
      
    } catch (err) {
      console.error('Failed to fetch analysis results:', err);
      
      // Provide user-friendly error messages
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        error = 'Unable to connect to the analysis server. Please check your internet connection and try again.';
      } else if (err instanceof Error) {
        if (err.message.includes('404')) {
          error = 'Analysis report not found. It may have been deleted or the link is invalid.';
        } else if (err.message.includes('403')) {
          error = 'You do not have permission to view this analysis report.';
        } else {
          error = `Failed to load analysis report: ${err.message}`;
        }
      } else {
        error = 'An unexpected error occurred while loading the analysis report. Please try again.';
      }
    } finally {
      loading = false;
    }
  }
  
  function generateExecutiveSummary() {
    if (!analysisResults?.synthesis) return;
    
    const { synthesis } = analysisResults;
    const criticalFindings = synthesis.consensusFindings?.filter((f: any) => f.severity === 'critical').length || 0;
    const highFindings = synthesis.consensusFindings?.filter((f: any) => f.severity === 'high').length || 0;
    const totalFindings = synthesis.consensusFindings?.length || 0;
    
    executiveSummary = `Forensic analysis completed with ${synthesis.confidenceScore.toFixed(1)}% confidence. ` +
      `${totalFindings} consensus findings identified across multiple AI models. ` +
      `${criticalFindings} critical and ${highFindings} high-priority issues require immediate attention. ` +
      `Analysis conducted using ${analysisResults.artifacts?.length || 0} AI models for comprehensive coverage.`;
  }
  
  async function downloadReport(format: 'markdown' | 'json') {
    try {
      const response = await fetch(`http://localhost:4000/analysis/${analysisId}/report?format=${format}`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
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
      
      // Show success feedback (could be a toast notification in a real app)
      console.log(`Report downloaded successfully as ${format.toUpperCase()}`);
      
    } catch (err) {
      console.error('Download failed:', err);
      
      // Show user-friendly error message (in a real app, this would be a toast or modal)
      const errorMessage = err instanceof Error 
        ? `Failed to download report: ${err.message}` 
        : 'An unexpected error occurred while downloading the report';
      
      alert(errorMessage); // In production, replace with proper error notification
    }
  }
  
  function getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  }
  
  function getSeverityTextColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'text-red-700';
      case 'high': return 'text-orange-700';
      case 'medium': return 'text-yellow-700';
      case 'low': return 'text-green-700';
      default: return 'text-gray-700';
    }
  }
</script>

<svelte:head>
  <title>Forensic Analysis Report - {analysisId}</title>
</svelte:head>

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

  <!-- Navigation -->
  <nav class="lcars-nav flex mb-8 gap-4" role="navigation" aria-label="Report navigation">
    <button
      on:click={() => goto('/')}
      class="lcars-nav-item px-5 py-3 bg-white rounded-sm font-lcars font-bold cursor-pointer transition-all duration-200 shadow hover:bg-lcars-cyan hover:-translate-y-0.5"
      aria-label="Return to analysis page"
    >
      ← Back to Analysis
    </button>
    <div 
      class="lcars-nav-item px-5 py-3 bg-lcars-cyan rounded-sm font-lcars font-bold -translate-y-0.5"
      role="heading"
      aria-level="2"
    >
      Analysis Report
    </div>
  </nav>

  <main class="lcars-main">
    {#if loading}
      <!-- Loading State -->
      <div class="flex items-center justify-center min-h-96">
        <div class="text-center">
          <div class="animate-spin h-12 w-12 border-4 border-lcars-cyan border-t-transparent rounded-full mx-auto mb-4"></div>
          <div class="text-xl font-lcars text-lcars-cyan">Loading Analysis Report...</div>
        </div>
      </div>
    {:else if error}
      <!-- Error State -->
      <div class="lcars-card bg-white rounded-lg overflow-hidden shadow">
        <div class="lcars-card-header h-4 bg-red-500"></div>
        <div class="lcars-card-body p-6">
          <h2 class="lcars-card-title font-lcars font-bold text-xl mb-4 text-red-600">Error Loading Report</h2>
          <p class="text-gray-700">{error}</p>
          <button
            on:click={() => goto('/')}
            class="mt-4 lcars-button px-4 py-2 bg-lcars-cyan text-white rounded-sm hover:bg-lcars-purple"
          >
            Return to Analysis
          </button>
        </div>
      </div>
    {:else}
      <!-- Report Content -->
      <div class="space-y-6">
        <!-- Report Header -->
        <div class="lcars-card bg-white rounded-lg overflow-hidden shadow">
          <div class="lcars-card-header h-4 bg-lcars-cyan"></div>
          <div class="lcars-card-body p-6">
            <div class="flex items-center justify-between mb-4">
              <h1 class="text-3xl font-lcars font-bold text-gray-800">Forensic Analysis Report</h1>
              <div class="flex gap-2" role="group" aria-label="Report download options">
                <button
                  on:click={() => downloadReport('markdown')}
                  class="lcars-button px-4 py-2 bg-lcars-cyan text-white rounded-sm text-sm hover:bg-lcars-purple"
                  aria-label="Download report as Markdown file"
                >
                  Download MD
                </button>
                <button
                  on:click={() => downloadReport('json')}
                  class="lcars-button px-4 py-2 bg-lcars-cyan text-white rounded-sm text-sm hover:bg-lcars-purple"
                  aria-label="Download report as JSON file"
                >
                  Download JSON
                </button>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-gray-600">Case ID:</span>
                <span class="font-mono text-gray-800 ml-2">{analysisId}</span>
              </div>
              <div>
                <span class="text-gray-600">Generated:</span>
                <span class="text-gray-800 ml-2">{new Date(analysisResults?.completedAt || Date.now()).toLocaleString()}</span>
              </div>
              <div>
                <span class="text-gray-600">Stardate:</span>
                <span class="text-gray-800 ml-2">{stardate}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Executive Summary -->
        {#if executiveSummary}
          <div class="lcars-card bg-gradient-to-r from-lcars-cyan to-lcars-purple text-white rounded-lg overflow-hidden shadow-lg">
            <div class="p-6">
              <h2 class="text-2xl font-lcars font-bold mb-4">EXECUTIVE SUMMARY</h2>
              <p class="text-lg leading-relaxed">{executiveSummary}</p>
            </div>
          </div>
        {/if}
        
        <!-- Analysis Overview -->
        {#if richMediaReport?.summary}
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="lcars-card bg-white rounded-lg overflow-hidden shadow">
              <div class="lcars-card-header h-4 bg-lcars-pink"></div>
              <div class="lcars-card-body p-4 text-center">
                <div class="text-2xl font-lcars font-bold text-gray-800">{richMediaReport.summary.totalModels}</div>
                <div class="text-sm text-gray-600">Models Used</div>
              </div>
            </div>
            
            <div class="lcars-card bg-white rounded-lg overflow-hidden shadow">
              <div class="lcars-card-header h-4 bg-lcars-cyan"></div>
              <div class="lcars-card-body p-4 text-center">
                <div class="text-2xl font-lcars font-bold text-gray-800">{richMediaReport.summary.averageConfidence.toFixed(1)}%</div>
                <div class="text-sm text-gray-600">Avg Confidence</div>
              </div>
            </div>
            
            <div class="lcars-card bg-white rounded-lg overflow-hidden shadow">
              <div class="lcars-card-header h-4 bg-lcars-purple"></div>
              <div class="lcars-card-body p-4 text-center">
                <div class="text-2xl font-lcars font-bold text-gray-800">{richMediaReport.summary.totalFindings}</div>
                <div class="text-sm text-gray-600">Total Findings</div>
              </div>
            </div>
            
            <div class="lcars-card bg-white rounded-lg overflow-hidden shadow">
              <div class="lcars-card-header h-4 bg-lcars-yellow"></div>
              <div class="lcars-card-body p-4 text-center">
                <div class="text-2xl font-lcars font-bold text-gray-800 uppercase">{richMediaReport.summary.highestSeverity}</div>
                <div class="text-sm text-gray-600">Highest Severity</div>
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Consensus Findings -->
        {#if analysisResults?.synthesis?.consensusFindings?.length > 0}
          <div class="lcars-card bg-white rounded-lg overflow-hidden shadow">
            <div class="lcars-card-header h-4 bg-lcars-pink"></div>
            <div class="lcars-card-body p-6">
              <h2 class="text-2xl font-lcars font-bold mb-6 text-gray-800">CONSENSUS FINDINGS</h2>
              <div class="space-y-4">
                {#each analysisResults.synthesis.consensusFindings as finding}
                  <div class="border-l-4 {getSeverityColor(finding.severity)} border rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                      <h3 class="text-lg font-semibold text-gray-800">{finding.category}</h3>
                      <span class="px-3 py-1 text-xs font-bold rounded-full uppercase {getSeverityTextColor(finding.severity)} bg-white border">
                        {finding.severity}
                      </span>
                    </div>
                    <p class="text-gray-700 mb-3">{finding.description}</p>
                    
                    {#if finding.evidence?.length > 0}
                      <div class="mb-3">
                        <h4 class="text-sm font-semibold text-gray-600 mb-1">Evidence:</h4>
                        <ul class="text-sm text-gray-600 list-disc list-inside space-y-1">
                          {#each finding.evidence as evidence}
                            <li>{evidence}</li>
                          {/each}
                        </ul>
                      </div>
                    {/if}
                    
                    {#if finding.recommendations?.length > 0}
                      <div>
                        <h4 class="text-sm font-semibold text-gray-600 mb-1">Recommendations:</h4>
                        <ul class="text-sm text-gray-600 list-disc list-inside space-y-1">
                          {#each finding.recommendations as recommendation}
                            <li>{recommendation}</li>
                          {/each}
                        </ul>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Model Analysis Breakdown -->
        {#if analysisResults?.artifacts?.length > 0}
          <div class="lcars-card bg-white rounded-lg overflow-hidden shadow">
            <div class="lcars-card-header h-4 bg-lcars-purple"></div>
            <div class="lcars-card-body p-6">
              <h2 class="text-2xl font-lcars font-bold mb-6 text-gray-800">MODEL ANALYSIS BREAKDOWN</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each analysisResults.artifacts as artifact}
                  <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-3">
                      <h3 class="text-lg font-semibold text-gray-800">{artifact.modelName}</h3>
                      <span class="text-sm text-gray-600">{artifact.confidence}% confidence</span>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-2 text-sm">
                      <div class="text-center">
                        <div class="font-bold text-gray-800">{artifact.findings.length}</div>
                        <div class="text-gray-600">Findings</div>
                      </div>
                      <div class="text-center">
                        <div class="font-bold text-gray-800">{artifact.processingTime}ms</div>
                        <div class="text-gray-600">Time</div>
                      </div>
                      <div class="text-center">
                        <div class="font-bold text-gray-800">{artifact.tokenUsage}</div>
                        <div class="text-gray-600">Tokens</div>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Rich Media Charts -->
        {#if richMediaReport?.charts?.length > 0}
          <div class="lcars-card bg-white rounded-lg overflow-hidden shadow">
            <div class="lcars-card-header h-4 bg-lcars-yellow"></div>
            <div class="lcars-card-body p-6">
              <h2 class="text-2xl font-lcars font-bold mb-6 text-gray-800">ANALYSIS CHARTS</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {#each richMediaReport.charts as chart}
                  <div class="bg-gray-50 rounded-lg p-4">
                    <h3 class="text-lg font-semibold mb-3 text-gray-800">{chart.title}</h3>
                    <div class="text-sm text-gray-600">
                      Chart Type: {chart.type}
                    </div>
                    <!-- Note: In a real implementation, you'd render actual charts here -->
                    <div class="mt-3 p-4 bg-white rounded border text-xs">
                      <pre>{JSON.stringify(chart.data, null, 2)}</pre>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </main>

  <div class="lcars-status flex items-center justify-center font-lcars text-sm mt-8">
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