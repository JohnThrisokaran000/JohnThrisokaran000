<p align="center">
  <img src="assets/hero.svg" width="100%" alt="John Thrisokaran. Full stack developer from Mumbai. Builds web apps, mobile apps, and the tools underneath them. Interned at Miracle Solutions, studies at Fr. CRCE, Bandra.">
</p>

<p align="center">
  <a href="#fight"><img src="assets/btn-fight.svg" width="23%" alt="FIGHT: projects"></a>
  <a href="#act"><img src="assets/btn-act.svg" width="23%" alt="ACT: skills"></a>
  <a href="#item"><img src="assets/btn-item.svg" width="23%" alt="ITEM: experience"></a>
  <a href="#mercy"><img src="assets/btn-mercy.svg" width="23%" alt="MERCY: contact"></a>
</p>

<br>

<a name="fight"></a>
<img src="assets/h-fight.svg" width="100%" alt="FIGHT: projects I have built">

Select a project to open its repository.

<a href="https://github.com/JohnThrisokaran000/pptx-to-video"><img src="assets/card-pptx-to-video.svg" width="100%" alt="pptx-to-video: turns a PowerPoint into an animated MP4, plus a local deck AI"></a>

<a href="https://github.com/JohnThrisokaran000/hk"><img src="assets/card-hk.svg" width="100%" alt="hk: a local LLM runtime written from scratch in Zig"></a>

<a href="https://github.com/JohnThrisokaran000/Shotgun_college_round"><img src="assets/card-patchwork.svg" width="100%" alt="PatchWork: hotfixes live websites without a rebuild"></a>

<a href="https://github.com/JohnThrisokaran000/mentalhealthfinal"><img src="assets/card-sentinel.svg" width="100%" alt="Sentinel: a confidential wellbeing platform for armed forces personnel"></a>

<a href="https://github.com/JohnThrisokaran000/Cipher_Vault"><img src="assets/card-ciphervault.svg" width="100%" alt="CipherVault: encrypts text and images in the browser"></a>

<a href="https://github.com/JohnThrisokaran000/cep-registration"><img src="assets/card-volunteer.svg" width="100%" alt="Volunteer Check-in: tracks NGO volunteer hours with geotagged proof"></a>

<br>

<a name="act"></a>
<img src="assets/h-act.svg" width="100%" alt="ACT: what I work with">

<p align="center"><img src="assets/skills.svg" width="100%" alt="Frontend: React, Next.js, Vue, TypeScript. Backend: Node, FastAPI, Flask, Django, Spring. Data: Postgres, MongoDB, Redis, SQLite. Mobile: Flutter, Kotlin, Firebase. Systems: Rust, Zig, C++, CUDA. Tools: Git, Docker, AWS, ffmpeg."></p>

<br>

<a name="item"></a>
<img src="assets/h-item.svg" width="100%" alt="ITEM: where I have worked">

<p align="center"><img src="assets/experience.svg" width="100%" alt="Intern at Miracle Solutions for 3 months. Fr. Conceicao Rodrigues College of Engineering, Bandra. Now building pptx-to-video and Quoro AI."></p>

<br>

<img src="assets/h-run.svg" width="100%" alt="RUN: still building offline">

<p align="center"><img src="assets/dino.svg" width="100%" alt="A pixel dinosaur running and jumping over cacti, with a ticking score."></p>

<br>

<img src="assets/h-soul.svg" width="100%" alt="SOUL: ASCII art, rendered in C">

<p align="center"><img src="assets/soul.svg" width="100%" alt="A spinning, beating ASCII heart rendered by soul.c, a ray marcher written in C."></p>

<!-- soul:start -->
<details>
<summary>Read soul.c</summary>

```c
/*
 * soul.c - a beating, spinning ASCII heart (the SOUL), ray marched in plain C.
 *
 * The heart is the implicit surface
 *     (x^2 + 9/4 z^2 + y^2 - 1)^3 - x^2 y^3 - 9/80 z^2 y^3 = 0
 * For every character cell a ray is marched into the scene until it enters the
 * surface, the hit is refined by bisection, and the surface normal (taken from
 * the gradient) is lit and mapped onto a 12-step character ramp.
 *
 *   cc -O2 -o soul soul.c -lm
 *   ./soul             animate in the terminal (Ctrl+C to stop)
 *   ./soul --frames 48 print 48 frames separated by form feeds
 */
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define W 64
#define H 32
#define PI 3.14159265358979323846

static const char RAMP[] = ".,-~:;=!*#$@";

/* Negative inside the heart, positive outside (y is up, z points away from the viewer). */
static double heart(double x, double y, double z) {
    double a = x * x + 2.25 * z * z + y * y - 1.0;
    return a * a * a - x * x * y * y * y - 0.1125 * z * z * y * y * y;
}

/* The scene: the heart turned by `turn` around the vertical axis and scaled by `beat`. */
static double scene(double x, double y, double z, double turn, double beat) {
    double c = cos(turn), s = sin(turn);
    double ox = (x * c + z * s) / beat;
    double oz = (-x * s + z * c) / beat;
    return heart(ox, y / beat, oz);
}

static void frame(char out[H][W + 1], double t) {
    double turn = 2.0 * PI * t;
    double beat = 1.0 + 0.07 * pow(fabs(sin(2.0 * PI * t * 2.0)), 6.0); /* two beats per turn */
    double lx = -0.45, ly = 0.6, lz = -1.0;
    double ll = sqrt(lx * lx + ly * ly + lz * lz);
    lx /= ll; ly /= ll; lz /= ll;

    for (int j = 0; j < H; j++) {
        for (int i = 0; i < W; i++) {
            /* a character is about twice as tall as it is wide, so 64x32 cells map to a square */
            double x = ((i + 0.5) / W * 2.0 - 1.0) * 1.55;
            double y = -((j + 0.5) / H * 2.0 - 1.0) * 1.55 + 0.12;
            char ch = ' ';
            double prev = -2.0;
            for (double z = -2.0; z <= 2.0; z += 0.02) {
                if (scene(x, y, z, turn, beat) <= 0.0) {
                    double lo = prev, hi = z;          /* bisect onto the surface */
                    for (int k = 0; k < 12; k++) {
                        double mid = 0.5 * (lo + hi);
                        if (scene(x, y, mid, turn, beat) <= 0.0) hi = mid; else lo = mid;
                    }
                    double e = 1e-3, f = scene(x, y, hi, turn, beat);
                    double nx = scene(x + e, y, hi, turn, beat) - f;
                    double ny = scene(x, y + e, hi, turn, beat) - f;
                    double nz = scene(x, y, hi + e, turn, beat) - f;
                    double nl = sqrt(nx * nx + ny * ny + nz * nz);
                    double b = nl > 0 ? (nx * lx + ny * ly + nz * lz) / nl : 0.0;
                    if (b < 0) b = 0;
                    ch = RAMP[(int)(b * (sizeof RAMP - 2) + 0.5)];
                    break;
                }
                prev = z;
            }
            out[j][i] = ch;
        }
        out[j][W] = '\0';
    }
}

static void wait_ms(int ms) {
    clock_t end = clock() + (clock_t)ms * CLOCKS_PER_SEC / 1000;
    while (clock() < end) { }
}

int main(int argc, char **argv) {
    static char buf[H][W + 1];
    if (argc == 3 && strcmp(argv[1], "--frames") == 0) {
        int n = atoi(argv[2]);
        for (int f = 0; f < n; f++) {
            frame(buf, (double)f / n);
            for (int j = 0; j < H; j++) puts(buf[j]);
            if (f + 1 < n) puts("\f");
        }
        return 0;
    }
    for (int f = 0;; f = (f + 1) % 96) {
        frame(buf, f / 96.0);
        printf("\x1b[H\x1b[2J");
        for (int j = 0; j < H; j++) puts(buf[j]);
        fflush(stdout);
        wait_ms(40);
    }
}
```

</details>
<!-- soul:end -->

<br>

<a name="mercy"></a>
<img src="assets/h-mercy.svg" width="100%" alt="MERCY: get in touch">

<p align="center">
  <a href="https://www.linkedin.com/in/john-thrisokaran-31844027b/"><img src="assets/contact-linkedin.svg" width="20%" alt="LinkedIn"></a>
  <a href="https://x.com/thrisokaran"><img src="assets/contact-x.svg" width="20%" alt="X"></a>
  <a href="mailto:johnjobyt@gmail.com"><img src="assets/contact-email.svg" width="20%" alt="Email"></a>
  <a href="https://github.com/JohnThrisokaran000?tab=repositories"><img src="assets/contact-github.svg" width="20%" alt="All repositories"></a>
</p>

<p align="center"><img src="assets/save.svg" width="100%" alt="The sheer amount of code here fills you with determination. File saved."></p>
