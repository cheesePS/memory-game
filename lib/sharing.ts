import { ShareData } from './types';

function buildShareText(data: ShareData): string {
  const appTag = '- Scripture Memory Game';
  switch (data.type) {
    case 'deck_complete':
      return `I just completed the "${data.title}" deck! 📖\n${data.verse ? `"${data.verse}"` : ''}\nScore: ${data.score} ${appTag}`;
    case 'high_score':
      return `New high score: ${data.score}! 🏆\n${data.title} ${appTag}`;
    case 'streak':
      return `${data.streak}-day memorization streak! 🔥\n${data.title} ${appTag}`;
    case 'badge':
      return `I just earned the "${data.badgeName}" badge! 🎖️\n${data.title} ${appTag}`;
    default:
      return `${data.title} ${appTag}`;
  }
}

export function shareToFacebook(data: ShareData): void {
  const text = encodeURIComponent(buildShareText(data));
  window.open(`https://www.facebook.com/sharer/sharer.php?quote=${text}`, '_blank', 'width=600,height=400');
}

export function shareToTwitter(data: ShareData): void {
  const text = encodeURIComponent(buildShareText(data));
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'width=600,height=400');
}

export function shareToWhatsApp(data: ShareData): void {
  const text = encodeURIComponent(buildShareText(data));
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

export async function shareNative(data: ShareData): Promise<void> {
  const text = buildShareText(data);
  if (navigator.share) {
    try {
      await navigator.share({ title: data.title, text });
    } catch {
      // User cancelled or share failed
    }
  } else {
    await navigator.clipboard.writeText(text);
  }
}

export function copyToClipboard(data: ShareData): void {
  const text = buildShareText(data);
  navigator.clipboard.writeText(text);
}
