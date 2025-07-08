<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  let chartRefs: HTMLCanvasElement[] = [];
  let chartInstances: any[] = [];
  
  // Get analysis ID from URL params
  $: analysisId = $page.params.id;
  
  // Reactive statement to render HTML content when it changes
  $: if (richHTMLContent && richHTMLContainer) {
    richHTMLContainer.innerHTML = richHTMLContent;
  }
  
  // State management
  let loading = true;
  let error = '';
  let analysisResults: any = null;
  let richMediaReport: any = null;
  let executiveNarrative = '';
  let analysisStatus = 'checking';
  let richHTMLContent = '';
  let richHTMLContainer: HTMLElement;
  
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
      // First check if analysis is completed
      const statusResponse = await fetch(`http://localhost:4000/analysis/${analysisId}/status`);
      if (!statusResponse.ok) {
        throw new Error('Failed to fetch analysis status');
      }
      
      const status = await statusResponse.json();
      
      if (status.status !== 'completed') {
        // Analysis still in progress, poll again in 5 seconds
        analysisStatus = status.status;
        setTimeout(fetchAnalysisResults, 5000);
        return;
      }
      
      // Analysis completed, fetch all results
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
      
      // Fetch executive narrative
      const executiveResponse = await fetch(`http://localhost:4000/analysis/${analysisId}/executive-report`);
      if (executiveResponse.ok) {
        const executiveData = await executiveResponse.json();
        executiveNarrative = executiveData.executiveNarrative;
      }
      
      // Set rich HTML content if available
      if (analysisResults?.synthesis?.finalReport) {
        richHTMLContent = analysisResults.synthesis.finalReport;
        // Render HTML content after the next tick
        setTimeout(() => {
          if (richHTMLContainer) {
            richHTMLContainer.innerHTML = richHTMLContent;
          }
        }, 0);
      }
      
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
  
  async function downloadPDF() {
    try {
      // First check if analysis is completed
      const statusResponse = await fetch(`http://localhost:4000/analysis/${analysisId}/status`);
      if (!statusResponse.ok) {
        throw new Error('Failed to check analysis status');
      }
      
      const status = await statusResponse.json();
      if (status.status !== 'completed') {
        alert('Analysis is still in progress. Please wait for completion before downloading the PDF.');
        return;
      }
      
      const response = await fetch(`http://localhost:4000/analysis/${analysisId}/report.pdf`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `forensic-report-${analysisId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      // Show success feedback
      console.log('PDF report downloaded successfully');
      
    } catch (err) {
      console.error('Download failed:', err);
      
      const errorMessage = err instanceof Error 
        ? `Failed to download PDF: ${err.message}` 
        : 'An unexpected error occurred while downloading the PDF';
      
      alert(errorMessage);
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

  function setChartRef(idx: number, el: HTMLCanvasElement) {
    chartRefs[idx] = el;
  }

  afterUpdate(() => {
    if (richMediaReport?.charts?.length > 0) {
      richMediaReport.charts.forEach((chart: any, idx: number) => {
        if (chartRefs[idx] && typeof chartRefs[idx].getContext === 'function') {
          if (chartInstances[idx]) {
            chartInstances[idx].destroy();
          }
          if ((window as any).Chart) {
            if (chart.type === 'bar') {
              chartInstances[idx] = new (window as any).Chart(chartRefs[idx].getContext('2d'), {
                type: 'bar',
                data: {
                  labels: chart.data.map((d: any) => d.model),
                  datasets: [{
                    label: 'Confidence',
                    data: chart.data.map((d: any) => d.confidence),
                    backgroundColor: '#2563EB',
                  }]
                },
                options: { responsive: true, plugins: { legend: { display: false } } }
              });
            } else if (chart.type === 'pie') {
              chartInstances[idx] = new (window as any).Chart(chartRefs[idx].getContext('2d'), {
                type: 'pie',
                data: {
                  labels: Object.keys(chart.data),
                  datasets: [{
                    data: Object.values(chart.data),
                    backgroundColor: ['#10B981', '#F59E0B', '#F97316', '#EF4444'],
                  }]
                },
                options: { responsive: true }
              });
            }
          }
        }
      });
    }
  });
</script>

<svelte:head>
  <title>Forensic Analysis Report - {analysisId}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</svelte:head>

<div class="card">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-3xl font-bold text-gray-800">Forensic Analysis Report</h1>
    <button
      on:click={downloadPDF}
      class="button"
    >
      Download PDF
    </button>
  </div>
  
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
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

{#if loading}
  <div class="card">
    <div class="text-center">
      <div class="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
      <div class="text-xl font-semibold text-gray-800">
        {analysisStatus === 'checking' ? 'Loading Analysis Report...' : 
         analysisStatus === 'processing' ? 'Analysis in Progress...' :
         analysisStatus === 'started' ? 'Analysis Starting...' :
         'Loading Analysis Report...'}
      </div>
      {#if analysisStatus !== 'checking'}
        <div class="text-sm text-gray-600 mt-2">This may take 2-5 minutes. Please wait...</div>
      {/if}
    </div>
  </div>
{:else if error}
  <div class="card">
    <h2 class="text-xl font-bold mb-4 text-red-600">Error Loading Report</h2>
    <p class="text-gray-700">{error}</p>
    <button
      on:click={() => goto('/')}
      class="button mt-4"
    >
      Return to Analysis
    </button>
  </div>
{:else}
  <!-- Executive Narrative -->
  {#if executiveNarrative}
    <div class="card bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <h2 class="text-2xl font-bold mb-4">EXECUTIVE NARRATIVE</h2>
      <div class="text-lg leading-relaxed whitespace-pre-wrap">{executiveNarrative}</div>
    </div>
  {/if}
  
  <!-- Analysis Overview -->
  {#if richMediaReport?.summary}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="card">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-800">{richMediaReport.summary.totalModels}</div>
          <div class="text-sm text-gray-600">Models Used</div>
        </div>
      </div>
      
      <div class="card">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-800">{richMediaReport.summary.averageConfidence.toFixed(1)}%</div>
          <div class="text-sm text-gray-600">Avg Confidence</div>
        </div>
      </div>
      
      <div class="card">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-800">{richMediaReport.summary.totalFindings}</div>
          <div class="text-sm text-gray-600">Total Findings</div>
        </div>
      </div>
      
      <div class="card">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-800 uppercase">{richMediaReport.summary.highestSeverity}</div>
          <div class="text-sm text-gray-600">Highest Severity</div>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Rich HTML Report Content -->
  {#if richHTMLContent}
    <div class="card">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">COMPREHENSIVE ANALYSIS REPORT</h2>
      <div class="rich-html-content" bind:this={richHTMLContainer}></div>
    </div>
  {/if}
  
  <!-- Consensus Findings -->
  {#if analysisResults?.synthesis?.consensusFindings?.length > 0}
    <div class="card">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">CONSENSUS FINDINGS</h2>
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
  {/if}
  
  <!-- Model Analysis Breakdown -->
  {#if analysisResults?.artifacts?.length > 0}
    <div class="card">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">INTELLIGENCE TEAM ANALYSIS</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each analysisResults.artifacts as artifact}
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="model-label">{getModelLabel(artifact.modelName)}</span>
                <span class="text-sm text-gray-600">{artifact.confidence}% confidence</span>
              </div>
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
  {/if}
  
  <!-- Rich Media Charts -->
  {#if richMediaReport?.charts?.length > 0}
    <div class="card">
      <h2 class="text-2xl font-bold mb-6 text-gray-800">ANALYSIS CHARTS</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#each richMediaReport.charts as chart, idx (idx)}
          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="text-lg font-semibold mb-3 text-gray-800">{chart.title}</h3>
            <canvas bind:this={chartRefs[idx]} width="400" height="300"></canvas>
          </div>
        {/each}
      </div>
    </div>
  {/if}
{/if}

<div class="text-sm text-gray-500 mt-8 text-center">System Online • Stardate {stardate}</div>

<style>
  .rich-html-content {
    max-width: 100%;
    overflow-x: auto;
  }
  
  .rich-html-content :global(.report-container) {
    max-width: none;
    box-shadow: none;
    border-radius: 0;
  }
  
  .rich-html-content :global(.report-header-main) {
    display: none;
  }
  
  .rich-html-content :global(.report-footer) {
    display: none;
  }
  
  .rich-html-content :global(.report-content) {
    padding: 0;
  }
</style> 