// 自动强制跳转 HTTPS（兜底保障）
if (window.location.protocol === 'http:' && window.location.hostname === 'minecraft.luckymj.top') {
  window.location.href = window.location.href.replace('http:', 'https:');
}

// 移动端菜单切换
const menuBtn = document.querySelector('.menu');
const navLinks = document.querySelector('.navlinks');
if (menuBtn && navLinks) {
  menuBtn.onclick = () => navLinks.classList.toggle('open');
}

// 复制服务器地址
document.querySelectorAll('[data-copy]').forEach((btn) => {
  btn.onclick = async () => {
    const textToCopy = btn.dataset.copy || 'mc.luckymj.top';
    try {
      await navigator.clipboard.writeText(textToCopy);
      const originalText = btn.textContent;
      btn.textContent = '已复制 ✓';
      btn.style.background = 'var(--l)';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
      }, 1800);
    } catch {
      // 兼容不支持 clipboard API 的环境
      const input = document.createElement('input');
      input.value = textToCopy;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      btn.textContent = '已复制 ✓';
      setTimeout(() => {
        btn.textContent = '复制地址';
      }, 1800);
    }
  };
});

// 异步拉取 Minecraft 服务器实时状态
async function updateServerStatus() {
  const statusEl = document.querySelector('.server-status-badge');
  if (!statusEl) return;

  try {
    const res = await fetch('https://api.mcstatus.io/v2/status/java/mc.luckymj.top');
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();

    const dot = statusEl.querySelector('.status-dot') || document.createElement('span');
    dot.className = 'status-dot';

    const textSpan = statusEl.querySelector('.status-text') || statusEl;
    if (data.online) {
      const ver = data.version?.name_clean || 'Paper 26.1.2';
      const onlinePlayers = data.players?.online ?? 0;
      const maxPlayers = data.players?.max ?? 20;
      textSpan.textContent = `服务器在线 · ${ver} · ${onlinePlayers}/${maxPlayers} 冒险者`;
    } else {
      textSpan.textContent = '服务器维护中 · 请留意群公告';
      dot.style.background = '#ffaa00';
      dot.style.boxShadow = '0 0 10px #ffaa00';
    }
  } catch (err) {
    // 优雅降级，网络无法访问 API 时保持默认提示
    const textSpan = statusEl.querySelector('.status-text');
    if (textSpan) {
      textSpan.textContent = '服务器正常运行 · Paper 26.1.2 · 畅快连入';
    }
  }
}
updateServerStatus();

// 全局精美图片灯箱 (Lightbox)
const lightbox = document.createElement('div');
lightbox.className = 'lightbox-modal';
lightbox.innerHTML = `
  <button class="lightbox-close" title="关闭 (Esc)">×</button>
  <img class="lightbox-img" src="" alt="LuckyMC Showcase">
  <div class="lightbox-caption"></div>
`;
document.body.appendChild(lightbox);

const lbImg = lightbox.querySelector('.lightbox-img');
const lbCaption = lightbox.querySelector('.lightbox-caption');
const lbClose = lightbox.querySelector('.lightbox-close');

function openLightbox(src, caption) {
  lbImg.src = src;
  lbCaption.textContent = caption || '';
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

lbClose.onclick = closeLightbox;
lightbox.onclick = (e) => {
  if (e.target === lightbox) closeLightbox();
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && lightbox.classList.contains('active')) {
    closeLightbox();
  }
});

// 为所有画廊与海报绑定灯箱
document.querySelectorAll('.gallery-item, .poster-frame, [data-zoom]').forEach((item) => {
  item.onclick = () => {
    const img = item.querySelector('img') || item;
    const title = item.querySelector('h4')?.textContent || item.querySelector('.poster-tip')?.textContent || img.alt || '';
    if (img && img.src) {
      openLightbox(img.src, title);
    }
  };
});
