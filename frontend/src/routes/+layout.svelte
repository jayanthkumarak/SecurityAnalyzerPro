<script>
  import '../app.css';
</script>

<div class="app-container">
  <aside class="sidebar">
    <h1 class="text-2xl font-bold mb-8 text-gray-800">ForensicAnalyzerPro</h1>
    <nav class="flex flex-col gap-4">
      <a href="/" class="font-semibold text-blue-700 hover:text-blue-900">Analysis</a>
      <a href="/reports" class="font-semibold text-blue-700 hover:text-blue-900">Reports</a>
      <a href="/database" class="font-semibold text-blue-700 hover:text-blue-900">Database</a>
      <a href="/settings" class="font-semibold text-blue-700 hover:text-blue-900">Settings</a>
    </nav>
  </aside>
  <main class="main-content">
    <slot />
  </main>
</div>

<style>
  .app-container {
    display: flex;
    height: 100%;
  }

  .sidebar {
    width: 250px;
    padding: 20px;
    background-color: #1f2937;
    color: #f3f4f6;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-right: 1px solid #374151;
  }

  .sidebar h1 {
    margin-bottom: 20px;
    color: #f3f4f6;
  }

  .sidebar nav a {
    color: #9ca3af;
    text-decoration: none;
    transition: color 0.2s ease-in-out;
  }

  .sidebar nav a:hover {
    color: #60a5fa;
  }

  .main-content {
    flex-grow: 1;
    padding: 20px;
    background-color: #111827;
    color: #f3f4f6;
  }

  /* Ensure layout doesn't cause extra space */
  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #111827;
    color: #f3f4f6;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }

  :global(html) {
    height: 100%;
  }
</style> 