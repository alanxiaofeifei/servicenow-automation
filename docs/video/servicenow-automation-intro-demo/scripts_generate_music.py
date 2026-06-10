#!/usr/bin/env python3
"""Generate an original background music bed for the SNA intro video.
No samples, no third-party audio: synthesized sine/square/noise layers only.
"""
from __future__ import annotations

import math
import random
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT_WAV = ROOT / "assets" / "sna-bg-music.wav"
SR = 44100
DURATION = 66.0
random.seed(20260608)

# A minor / C major friendly progression, calm but forward-moving.
CHORDS = [
    (55.00, 65.41, 82.41, 110.00),   # A minor color
    (43.65, 65.41, 87.31, 130.81),   # F / suspended
    (48.99, 73.42, 98.00, 146.83),   # G-ish lift
    (41.20, 61.74, 82.41, 123.47),   # E tension
]


def env(t: float, start: float, dur: float, attack=0.04, release=0.18) -> float:
    x = t - start
    if x < 0 or x > dur:
        return 0.0
    if x < attack:
        return x / max(attack, 1e-6)
    if x > dur - release:
        return max(0.0, (dur - x) / max(release, 1e-6))
    return 1.0


def sine(freq: float, t: float, phase=0.0) -> float:
    return math.sin(2 * math.pi * freq * t + phase)


def soft_square(freq: float, t: float) -> float:
    return math.tanh(1.7 * sine(freq, t))


def lowpass_noise(i: int) -> float:
    # Deterministic pseudo-noise, smoothed by summing nearby values.
    random.seed(i // 10 + 991)
    return (random.random() * 2 - 1) * 0.55


def sample(t: float, i: int) -> float:
    bar = 4.0
    chord = CHORDS[int(t // bar) % len(CHORDS)]
    local = t % bar
    # Section energy grows after the opening.
    energy = 0.55 + 0.25 * min(1.0, t / 28.0) + (0.08 if 42 < t < 58 else 0.0)

    # Warm pad with slow phasing.
    pad = 0.0
    for idx, f in enumerate(chord):
        pad += 0.14 * sine(f * 2, t, phase=idx * 0.71 + 0.15 * sine(0.04, t))
        pad += 0.06 * sine(f * 4, t, phase=idx * 0.37)
    pad *= 0.42 + 0.10 * sine(0.03, t)

    # Soft arpeggio, eighth notes.
    step = int((t * 2) % 8)
    arp_freq = chord[step % len(chord)] * (4 if step in (2, 5, 7) else 2)
    arp_env = env(t, math.floor(t * 2) / 2, 0.42, attack=0.015, release=0.16)
    arp = 0.13 * arp_env * sine(arp_freq, t) + 0.035 * arp_env * soft_square(arp_freq * 2, t)

    # Bass pulse every beat, restrained.
    beat_start = math.floor(t) * 1.0
    bass_env = env(t, beat_start, 0.52, attack=0.01, release=0.38)
    bass = 0.28 * bass_env * sine(chord[0], t) + 0.05 * bass_env * sine(chord[0] * 2, t)

    # Kick/sub transient on beats 1 and 3.
    beat_pos = t % 2.0
    kick_env = math.exp(-10 * beat_pos) if beat_pos < 0.45 else 0.0
    kick = 0.24 * kick_env * sine(52 + 28 * kick_env, t)

    # High hat / tick, light and airy.
    eighth_start = math.floor(t * 2) / 2
    hat_env = env(t, eighth_start, 0.08, attack=0.003, release=0.065)
    hat = 0.035 * hat_env * lowpass_noise(i)

    # Occasional reverse-like shimmer before scene changes.
    shimmer = 0.0
    for cue in [7, 15, 25, 34, 43, 52, 61]:
        d = cue - t
        if 0 < d < 1.2:
            shimmer += (1.2 - d) / 1.2 * 0.06 * sine(880 + 120 * d, t)

    fade_in = min(1.0, t / 2.0)
    fade_out = min(1.0, max(0.0, (DURATION - t) / 3.0))
    return (pad + arp + bass + kick + hat + shimmer) * energy * fade_in * fade_out


def main() -> None:
    OUT_WAV.parent.mkdir(parents=True, exist_ok=True)
    frames = int(DURATION * SR)
    with wave.open(str(OUT_WAV), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        for i in range(frames):
            t = i / SR
            mono = sample(t, i)
            # Slight stereo width by phase-offset air layer.
            left = mono + 0.025 * sine(1760, t, 0.3) * (0.5 + 0.5 * sine(0.07, t))
            right = mono + 0.025 * sine(1660, t, 1.1) * (0.5 + 0.5 * sine(0.05, t))
            peak = 0.82
            l = max(-peak, min(peak, left))
            r = max(-peak, min(peak, right))
            w.writeframesraw(int(l * 32767).to_bytes(2, "little", signed=True))
            w.writeframesraw(int(r * 32767).to_bytes(2, "little", signed=True))
    print(OUT_WAV)


if __name__ == "__main__":
    main()
