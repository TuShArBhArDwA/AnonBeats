
# AnonBeats 🎧  
**Your personal, ad-free music player.**

[![Node](https://img.shields.io/badge/Node-%3E%3D18-green?logo=node.js)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-blue?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com)

---

## Overview
AnonBeats is an elegant personal web app to **upload, organize, and play your own songs** — completely ad-free and beautifully designed.  
Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Aceternity UI components**, it provides a premium feel for your private music collection.  

> ⚠️ **Note:** For personal use only. Upload only legally acquired audio files.

---

## Features
- 🎵 Upload your audio directly to **Cloudinary** (browser → Cloudinary with signed params)
- 🪩 Beautiful, glassy UI using **Aceternity components** (Spotlight, ShinyButton, BentoGrid)
- 🎧 Library grid to browse tracks and playlists  
- 📁 Playlist management (Bento-style layout)  
- 📻 Sticky mini player bar *(coming soon)*  
- 🔀 Shuffle, repeat, crossfade *(planned)*  
- 📱 PWA & offline playback for playlists *(planned)*

---

## Tech Stack
- **Next.js 14 (App Router) + TypeScript**
- **Tailwind CSS** + **Framer Motion** + **Lucide React**
- **Aceternity UI Components**
- **Cloudinary** (audio storage & streaming via `resource_type=video`)
- **Vercel** (deployment)

---

## Architecture

```mermaid
flowchart TD
    A[Browser] -->|UI Interaction| B[Next.js App (App Router)]
    B -->|Sign Request| C[Next.js API /api/cloudinary/sign]
    C -->|Signature| D[Cloudinary]
    A -->|Direct Upload| D
    D -->|Stream Audio| A
