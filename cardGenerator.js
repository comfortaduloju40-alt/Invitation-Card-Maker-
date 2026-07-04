const { createCanvas } = require('canvas');

// Theme colors for different event types
const THEMES = {
  wedding: {
    bg1: '#1a0a2e',
    bg2: '#2d1b4e',
    bg3: '#1a0a2e',
    accent1: '#d4af37',
    accent2: '#f0d060',
    title: '#f5e6c8',
    subtitle: '#d4af37',
    text: '#e8d5b0',
    label: '#a08060'
  },
  birthday: {
    bg1: '#0d1b2a',
    bg2: '#1b2d4e',
    bg3: '#0d1b2a',
    accent1: '#ff6b9d',
    accent2: '#ffd700',
    title: '#ffffff',
    subtitle: '#ff6b9d',
    text: '#e0e0ff',
    label: '#9090c0'
  },
  corporate: {
    bg1: '#0a1628',
    bg2: '#1a2640',
    bg3: '#0a1628',
    accent1: '#4a90d9',
    accent2: '#7ab8f5',
    title: '#ffffff',
    subtitle: '#4a90d9',
    text: '#d0dce8',
    label: '#7090a8'
  },
  party: {
    bg1: '#1a0d2e',
    bg2: '#2e1a4e',
    bg3: '#1a0d2e',
    accent1: '#9b59b6',
    accent2: '#e056d7',
    title: '#ffffff',
    subtitle: '#e056d7',
    text: '#e0d0f0',
    label: '#9070b0'
  },
  other: {
    bg1: '#0d2818',
    bg2: '#1a3d28',
    bg3: '#0d2818',
    accent1: '#27ae60',
    accent2: '#58d68d',
    title: '#ffffff',
    subtitle: '#27ae60',
    text: '#d0e8d8',
    label: '#70a880'
  }
};

// Draw decorative corner ornaments
function drawCorners(ctx, w, h, color) {
  const size = 40;
  const pad = 20;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(pad, pad + size);
  ctx.lineTo(pad, pad);
  ctx.lineTo(pad + size, pad);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(w - pad - size, pad);
  ctx.lineTo(w - pad, pad);
  ctx.lineTo(w - pad, pad + size);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(pad, h - pad - size);
  ctx.lineTo(pad, h - pad);
  ctx.lineTo(pad + size, h - pad);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(w - pad - size, h - pad);
  ctx.lineTo(w - pad, h - pad);
  ctx.lineTo(w - pad, h - pad - size);
  ctx.stroke();
}

// Draw decorative diamond dots along a horizontal line
function drawDiamondLine(ctx, x, y, width, color) {
  ctx.fillStyle = color;
  const step = 18;
  const count = Math.floor(width / step);
  const startX = x + (width - count * step) / 2;

  for (let i = 0; i <= count; i++) {
    const cx = startX + i * step;
    ctx.save();
    ctx.translate(cx, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();
  }
}

// Center text helper
function centerText(ctx, text, y, maxWidth) {
  ctx.fillText(text, maxWidth / 2, y);
}

// Wrap long text into multiple lines
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';

  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Main function — generates invitation card as PNG buffer
function generateInvitationCard(data) {
  const width = 900;
  const height = 620;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Pick theme
  const theme = THEMES[data.eventType] || THEMES.other;

  // ── Background gradient ─────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, theme.bg1);
  bg.addColorStop(0.5, theme.bg2);
  bg.addColorStop(1, theme.bg3);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // ── Outer border ────────────────────────────────────
  ctx.strokeStyle = theme.accent1;
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, width - 24, height - 24);

  // ── Inner border ────────────────────────────────────
  ctx.strokeStyle = theme.accent1 + '55';
  ctx.lineWidth = 1;
  ctx.strokeRect(22, 22, width - 44, height - 44);

  // ── Corner ornaments ────────────────────────────────
  drawCorners(ctx, width, height, theme.accent2);

  // ── Top ornament line ───────────────────────────────
  drawDiamondLine(ctx, 80, 72, width - 160, theme.accent1);

  // ── "You are Invited" label ─────────────────────────
  ctx.fillStyle = theme.accent1;
  ctx.font = 'italic 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('— You Are Cordially Invited —', width / 2, 110);

  // ── Event Name ──────────────────────────────────────
  ctx.fillStyle = theme.title;
  ctx.font = 'bold 58px sans-serif';
  const eventLines = wrapText(ctx, data.eventName || 'Our Special Event', width - 120);
  let nameY = 175;
  for (const line of eventLines) {
    centerText(ctx, line, nameY, width);
    nameY += 65;
  }

  // ── Hosted by ───────────────────────────────────────
  ctx.fillStyle = theme.subtitle;
  ctx.font = '24px sans-serif';
  ctx.fillText(`Hosted by ${data.hostName}`, width / 2, nameY + 10);

  // ── Middle diamond line ──────────────────────────────
  drawDiamondLine(ctx, 80, nameY + 40, width - 160, theme.accent1);

  // ── Guest name section ──────────────────────────────
  if (data.guestName) {
    ctx.fillStyle = theme.label;
    ctx.font = '20px sans-serif';
    ctx.fillText('Dear', width / 2, nameY + 80);

    ctx.fillStyle = theme.text;
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(data.guestName, width / 2, nameY + 118);

    drawDiamondLine(ctx, 80, nameY + 138, width - 160, theme.accent1 + '88');
  }

  // ── Event Details ────────────────────────────────────
  const detailY = nameY + (data.guestName ? 170 : 90);
  ctx.textAlign = 'left';

  const col1X = 100;
  const col2X = 480;
  const labelSize = '18px';
  const valueSize = 'bold 22px';

  // Date
  if (data.date) {
    ctx.fillStyle = theme.label;
    ctx.font = `${labelSize} sans-serif`;
    ctx.fillText('📅  DATE', col1X, detailY);
    ctx.fillStyle = theme.text;
    ctx.font = `${valueSize} sans-serif`;
    ctx.fillText(data.date, col1X, detailY + 28);
  }

  // Time
  if (data.time) {
    ctx.fillStyle = theme.label;
    ctx.font = `${labelSize} sans-serif`;
    ctx.fillText('🕐  TIME', col2X, detailY);
    ctx.fillStyle = theme.text;
    ctx.font = `${valueSize} sans-serif`;
    ctx.fillText(data.time, col2X, detailY + 28);
  }

  // Venue
  if (data.venue) {
    ctx.fillStyle = theme.label;
    ctx.font = `${labelSize} sans-serif`;
    ctx.fillText('📍  VENUE', col1X, detailY + 70);
    ctx.fillStyle = theme.text;
    ctx.font = `${valueSize} sans-serif`;
    const venueLines = wrapText(ctx, data.venue, 330);
    venueLines.slice(0, 2).forEach((line, i) => {
      ctx.fillText(line, col1X, detailY + 98 + i * 26);
    });
  }

  // Dress Code
  if (data.dresscode) {
    ctx.fillStyle = theme.label;
    ctx.font = `${labelSize} sans-serif`;
    ctx.fillText('👗  DRESS CODE', col2X, detailY + 70);
    ctx.fillStyle = theme.text;
    ctx.font = `${valueSize} sans-serif`;
    ctx.fillText(data.dresscode, col2X, detailY + 98);
  }

  // RSVP
  if (data.rsvp) {
    ctx.textAlign = 'center';
    ctx.fillStyle = theme.accent1;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`RSVP: ${data.rsvp}`, width / 2, detailY + 150);
  }

  // ── Bottom ornament line ─────────────────────────────
  drawDiamondLine(ctx, 80, height - 52, width - 160, theme.accent1);

  // ── Footer ───────────────────────────────────────────
  ctx.fillStyle = theme.accent1 + 'aa';
  ctx.font = 'italic 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('We look forward to celebrating with you!', width / 2, height - 30);

  return canvas.toBuffer('image/png');
}

// Plain text version for easy sharing
function generateTextCard(data) {
  const line = '✦ ' + '─'.repeat(34) + ' ✦';
  let card = '```\n';
  card += `${line}\n\n`;
  card += `     YOU ARE CORDIALLY INVITED\n\n`;
  card += `        ${data.eventName}\n\n`;
  card += `     Hosted by: ${data.hostName}\n`;
  if (data.guestName) card += `     Guest:      ${data.guestName}\n`;
  card += `\n${line}\n\n`;
  if (data.date)     card += `  Date      : ${data.date}\n`;
  if (data.time)     card += `  Time      : ${data.time}\n`;
  if (data.venue)    card += `  Venue     : ${data.venue}\n`;
  if (data.dresscode) card += `  Dress Code: ${data.dresscode}\n`;
  if (data.rsvp)     card += `  RSVP      : ${data.rsvp}\n`;
  card += `\n${line}\n`;
  card += '```';
  return card;
}

module.exports = { generateInvitationCard, generateTextCard };
