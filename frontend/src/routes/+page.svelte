<script lang="ts">
  let activeNav = 0;
  const navItems = ["Dashboard", "Projects", "Analytics", "Settings"];
  function setActiveNav(idx: number) {
    activeNav = idx;
  }

  // Stardate calculation
  import { onMount } from 'svelte';
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
</script>

<div class="lcars-container font-sans bg-lcars-bg min-h-screen text-lcars-text">
  <header class="lcars-header flex mb-8 items-stretch h-20">
    <div class="lcars-title-block bg-lcars-cyan rounded-lg px-6 py-4 mr-4 flex items-center">
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
        class="lcars-nav-item px-5 py-3 rounded-sm font-lcars font-bold cursor-pointer transition-all duration-200 shadow hover:bg-lcars-cyan hover:-translate-y-0.5 {activeNav === idx ? 'active bg-lcars-cyan -translate-y-0.5' : ''}"
        on:click={() => setActiveNav(idx)}
        tabindex="0"
        role="button"
        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveNav(idx)}
      >
        {item}
      </div>
    {/each}
  </nav>

  <main class="lcars-main grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
    <div class="lcars-card rounded-lg overflow-hidden shadow transition-transform duration-300 hover:-translate-y-1 bg-lcars-cyan">
      <div class="lcars-card-header h-4 bg-lcars-cyan"></div>
      <div class="lcars-card-body p-6">
        <h2 class="lcars-card-title font-lcars font-bold text-xl mb-4">System Status</h2>
        <p class="lcars-card-text mb-5">All systems operating within normal parameters.</p>
        <button class="lcars-button inline-block px-5 py-2 bg-lcars-cyan rounded-sm font-lcars font-bold cursor-pointer transition-all duration-200 border-0 hover:bg-lcars-purple hover:-translate-y-0.5">View Details</button>
      </div>
    </div>
  </main>

  <div class="lcars-status flex items-center justify-center font-lcars text-sm mt-5">
    <div class="lcars-status-indicator w-2.5 h-2.5 bg-green-500 rounded-full mr-2 animate-pulse"></div>
    <span>System Online • {stardate}</span>
  </div>
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
</style>
