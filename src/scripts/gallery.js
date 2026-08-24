document.addEventListener('DOMContentLoaded', async () => {
  const gallery = document.querySelector('[data-gallery]');
  if (!gallery) return;
  try {
    const response = await fetch('/api/gallery');
    const { items } = await response.json();
    if (!response.ok || !items.length) return;
    gallery.replaceChildren(...items.map((item) => {
      const card = document.createElement('article');
      const image = document.createElement('img');
      const caption = document.createElement('div');
      card.className = 'gallery-item';
      image.src = item.src;
      image.alt = item.alt;
      image.loading = 'lazy';
      caption.className = 'gallery-caption';
      caption.textContent = item.caption;
      card.append(image, caption);
      return card;
    }));
  } catch { /* Keep the built-in gallery available when the server is offline. */ }
});
