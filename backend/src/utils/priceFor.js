export default function priceFor(track, license) {
  const key = (license || 'mp3').toLowerCase();
  if (track?.pricing && typeof track.pricing === 'object') {
    const v = track.pricing[key];
    if (Number.isFinite(v) && v > 0) return Math.trunc(v);
  }
  if (key === 'wav') return 2999;
  if (key === 'stems' || key === 'premium_wav_stems' || key === 'unlimited_stems') return 4999;
  if (key === 'unlimited') return 3999;
  return 1999; // mp3 default
}
