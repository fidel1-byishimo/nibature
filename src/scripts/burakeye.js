document.addEventListener('DOMContentLoaded', () => {
  let credentials = '';
  const message = document.querySelector('[data-gallery-message]');
  const tools = document.querySelector('[data-gallery-tools]');
  const list = document.querySelector('[data-admin-gallery-list]');

  async function request(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (credentials) headers.Authorization = `Basic ${credentials}`;
    const response = await fetch(url, { ...options, headers });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Something went wrong.');
    return result;
  }

  async function loadGallery() {
    const { items } = await request('/api/gallery');
    list.replaceChildren(...items.map((item) => {
      const card = document.createElement('article');
      const image = document.createElement('img');
      const details = document.createElement('div');
      const caption = document.createElement('strong');
      const button = document.createElement('button');
      card.className = 'admin-gallery-item';
      image.src = item.src;
      image.alt = item.alt;
      caption.textContent = item.caption;
      button.className = 'admin-delete';
      button.type = 'button';
      button.textContent = 'Delete photo';
      details.append(caption, button);
      card.append(image, details);
      return card;
    }));
    if (!items.length) list.innerHTML = '<p class="note">No uploaded photos yet.</p>';
    list.querySelectorAll('.admin-delete').forEach((button, index) => button.addEventListener('click', async () => {
      if (!window.confirm('Delete this photo from the gallery?')) return;
      try {
        await request(`/api/admin/gallery/${encodeURIComponent(items[index].id)}`, { method: 'DELETE' });
        message.textContent = 'Photo deleted.';
        loadGallery();
      } catch (error) { message.textContent = error.message; }
    }));
  }

  document.querySelector('[data-admin-login]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    credentials = btoa(`${form.username.value}:${form.password.value}`);
    message.textContent = 'Checking administrator access…';
    try {
      await request('/api/admin/gallery');
    } catch (error) {
      credentials = '';
      message.textContent = error.message;
      return;
    }
    form.hidden = true;
    tools.hidden = false;
    message.textContent = 'Gallery manager unlocked.';
    loadGallery();
  });

  document.querySelector('[data-gallery-upload]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const file = form.image.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      message.textContent = 'Uploading photo…';
      try {
        await request('/api/admin/gallery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: reader.result, caption: form.caption.value }) });
        form.reset();
        message.textContent = 'Photo uploaded.';
        loadGallery();
      } catch (error) { message.textContent = error.message; }
    };
    reader.readAsDataURL(file);
  });
});
