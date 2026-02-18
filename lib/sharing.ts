import { ShareData } from './types';

const APP_PROMO = `\n\nCheck out this Scripture memory app to strengthen your knowledge of the Word: https://memory.raindropoju.education/\n\nThis app also includes exciting challenge features to test and grow your memory!`;

function buildShareText(data: ShareData): string {
  let text: string;
  switch (data.type) {
    case 'deck_complete':
      text = `I just completed the "${data.title}" deck! 📖\n${data.verse ? `"${data.verse}"` : ''}\nScore: ${data.score}`;
      break;
    case 'high_score':
      text = `New high score: ${data.score}! 🏆\n${data.title}`;
      break;
    case 'streak':
      text = `${data.streak}-day memorization streak! 🔥\n${data.title}`;
      break;
    case 'badge':
      text = `I just earned the "${data.badgeName}" badge! 🎖️\n${data.title}`;
      break;
    default:
      text = data.title;
  }
  return text + APP_PROMO;
}

export function shareToFacebook(data: ShareData): void {
  const text = encodeURIComponent(buildShareText(data));
  const url = encodeURIComponent('https://memory.raindropoju.education/');
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400');
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
