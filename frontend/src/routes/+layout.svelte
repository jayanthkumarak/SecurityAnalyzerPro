<script>
  import '../app.css';
  import { onMount } from 'svelte';

  /**
   * @typedef {Object} Particle
   * @property {number} id
   * @property {number} x
   * @property {number} y
   * @property {number} size
   * @property {number} speed
   * @property {number} opacity
   */

  /** @type {Particle[]} */
  let particles = [];

  onMount(() => {
    // Create floating particles
    for (let i = 0; i < 15; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.3 + 0.1
      });
    }

    // Animate particles
    const animate = () => {
      particles = particles.map(p => ({
        ...p,
        y: (p.y - p.speed) % 100,
        opacity: Math.sin(Date.now() * 0.001 + p.id) * 0.2 + 0.1
      }));
      requestAnimationFrame(animate);
    };
    animate();
  });
</script>

<div class="lcars-rib"></div>

<!-- Floating particles -->
{#each particles as particle (particle.id)}
  <div 
    class="particle"
    style="
      left: {particle.x}%;
      top: {particle.y}%;
      width: {particle.size}px;
      height: {particle.size}px;
      opacity: {particle.opacity};
    "
  ></div>
{/each}

<!-- Dynamic grid overlay -->
<div class="grid-overlay"></div>

<slot />

<style>
  .particle {
    position: fixed;
    background: radial-gradient(circle, rgba(153, 204, 255, 0.6) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 1;
    animation: float 8s infinite linear;
  }

  @keyframes float {
    0% { transform: translateY(0px) rotate(0deg); }
    100% { transform: translateY(-20px) rotate(360deg); }
  }

  .grid-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      linear-gradient(rgba(153, 204, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(153, 204, 255, 0.03) 1px, transparent 1px);
    background-size: 50px 50px;
    pointer-events: none;
    z-index: 0;
    animation: grid-move 20s infinite linear;
  }

  @keyframes grid-move {
    0% { transform: translate(0, 0); }
    100% { transform: translate(50px, 50px); }
  }

  /* Ensure layout doesn't cause extra space */
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