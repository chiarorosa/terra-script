import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPixelatedPass } from 'three/examples/jsm/postprocessing/RenderPixelatedPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GameEngine } from '../engine/GameEngine';
import { CropType, GroundType, TileState } from '../types/game';
import { Info, Activity, Gauge, Eye, EyeOff, HardDrive, Target, ZoomIn, ZoomOut, Trash2, Sparkles, RotateCcw, Layers } from 'lucide-react';
import { GameLogo } from './GameLogo';

interface World3DCanvasProps {
  engine: GameEngine;
}

// Helper to create crisp 32x32 procedural pixel art textures for Three.js
function createPixelArtTexture(
  drawFn: (ctx: CanvasRenderingContext2D, size: number) => void,
  size = 32
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  drawFn(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

// ==========================================
// STATIC GEOMETRY & MATERIAL CACHE (POOLS)
// High-Detail Procedural Pixel Art & Voxel Assets
// ==========================================
class ThreeAssetCache {
  // Shared Geometries
  public static baseTileGeo = new THREE.BoxGeometry(1.1, 0.45, 1.1);
  public static tileEdgesGeo = new THREE.EdgesGeometry(ThreeAssetCache.baseTileGeo);
  
  // Crop Geometries
  public static voxelBlockGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  public static stalkStemGeo = new THREE.BoxGeometry(0.04, 0.45, 0.04);
  public static wheatHeadGeo = new THREE.BoxGeometry(0.12, 0.25, 0.12);
  public static leafBladeGeo = new THREE.BoxGeometry(0.06, 0.22, 0.02);
  public static wheatAwnGeo = new THREE.BoxGeometry(0.02, 0.12, 0.02);
  public static fruitAppleGeo = new THREE.SphereGeometry(0.08, 6, 6);
  public static fruitTomatoGeo = new THREE.SphereGeometry(0.09, 8, 8);
  public static fruitCalyxGeo = new THREE.BoxGeometry(0.08, 0.02, 0.08);
  public static woodPostGeo = new THREE.BoxGeometry(0.06, 0.6, 0.06);
  public static woodBarGeo = new THREE.BoxGeometry(0.5, 0.04, 0.04);
  public static rootMoundGeo = new THREE.CylinderGeometry(0.28, 0.38, 0.08, 8);
  public static beetRootGeo = new THREE.ConeGeometry(0.12, 0.3, 6);
  public static sunflowerDiscGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 10);
  public static sunflowerPetalGeo = new THREE.BoxGeometry(0.08, 0.03, 0.16);
  public static sporeBallGeo = new THREE.SphereGeometry(0.06, 6, 6);
  
  public static bushLeafBaseGeo = new THREE.BoxGeometry(0.55, 0.35, 0.55);
  public static bushLeafTopGeo = new THREE.BoxGeometry(0.4, 0.25, 0.4);
  public static bushTrunkGeo = new THREE.BoxGeometry(0.12, 0.25, 0.12);

  public static treeTrunkGeo = new THREE.BoxGeometry(0.18, 0.45, 0.18);
  public static treeLeafTier1Geo = new THREE.BoxGeometry(0.7, 0.3, 0.7);
  public static treeLeafTier2Geo = new THREE.BoxGeometry(0.5, 0.3, 0.5);
  public static treeLeafTier3Geo = new THREE.BoxGeometry(0.3, 0.25, 0.3);

  public static rootCanopyGeo = new THREE.BoxGeometry(0.4, 0.15, 0.4);
  public static rootCropGeo = new THREE.ConeGeometry(0.12, 0.35, 4);

  public static fruitBushGeo = new THREE.BoxGeometry(0.48, 0.4, 0.48);
  public static fruitBerryGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);

  public static energyCoreGeo = new THREE.OctahedronGeometry(0.2, 0);
  public static energyPetalGeo = new THREE.BoxGeometry(0.18, 0.08, 0.28);
  public static energyStemGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.35, 4);

  public static gradedHelixGeo = new THREE.BoxGeometry(0.2, 0.12, 0.2);
  public static prestigeOctaGeo = new THREE.OctahedronGeometry(0.32, 1);
  public static prestigeRingGeo = new THREE.TorusGeometry(0.45, 0.025, 8, 16);

  // 5-Pointed Super Mario 3D Star Shape & Geometry
  public static starShape = (() => {
    const shape = new THREE.Shape();
    const outerRadius = 0.32;
    const innerRadius = 0.13;
    const numPoints = 5;
    for (let i = 0; i < numPoints * 2; i++) {
      const angle = (i * Math.PI) / numPoints - Math.PI / 2;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  })();

  public static marioStarGeo = (() => {
    const geo = new THREE.ExtrudeGeometry(ThreeAssetCache.starShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.035,
      bevelThickness: 0.04,
    });
    geo.center();
    return geo;
  })();

  public static marioStarEyeGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.12, 12);

  // Agent Sci-Fi Harvester Flying Saucer (UFO) Geometries
  public static agentBodyGeo = new THREE.CylinderGeometry(0.48, 0.28, 0.12, 16);
  public static agentBottomSaucerGeo = new THREE.CylinderGeometry(0.28, 0.1, 0.08, 16);
  public static agentTopDomeGeo = new THREE.SphereGeometry(0.2, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
  public static agentThrusterGeo = new THREE.ConeGeometry(0.06, 0.18, 8);
  public static agentRingGeo = new THREE.TorusGeometry(0.5, 0.03, 8, 24);
  public static agentBeamGeo = new THREE.ConeGeometry(0.38, 0.5, 16, 1, true);

  public static selectionBoxGeo = new THREE.BoxGeometry(1.15, 0.48, 1.15);
  public static selectionEdgesGeo = new THREE.EdgesGeometry(ThreeAssetCache.selectionBoxGeo);

  // Combo Target Geometries
  public static comboRingGeo = new THREE.TorusGeometry(0.42, 0.035, 8, 20);
  public static comboStarGeo = new THREE.OctahedronGeometry(0.18, 0);
  public static comboBeaconGeo = new THREE.BoxGeometry(0.06, 0.16, 0.06);

  // Zero Soil Inactive [z] Geometries
  public static zeroSoilBoxGeo = new THREE.BoxGeometry(1.02, 0.015, 1.02);
  public static zeroSoilEdgesGeo = new THREE.EdgesGeometry(ThreeAssetCache.zeroSoilBoxGeo);
  public static zeroSoilStudGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);

  // Line Materials
  public static lineMat = new THREE.LineBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.6 });
  public static selectionLineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8 });

  // ----------------------------------------------------
  // PROCEDURAL CANVAS PIXEL ART TEXTURES (32x32 NearestFilter)
  // ----------------------------------------------------

  // 1. NATURAL Grass Top Pixel Texture (Rich Forest Green Base)
  public static texNaturalTop = createPixelArtTexture((ctx, size) => {
    ctx.fillStyle = '#14532d'; // Deep forest dark grass
    ctx.fillRect(0, 0, size, size);

    // Dark border/dither
    ctx.fillStyle = '#052e16';
    for (let i = 0; i < size; i += 2) {
      ctx.fillRect(i, 0, 1, 1);
      ctx.fillRect(0, i, 1, 1);
      ctx.fillRect(size - 1, i, 1, 1);
      ctx.fillRect(i, size - 1, 1, 1);
    }

    // Grass blades & tuft pixels
    const greens = ['#166534', '#15803d', '#14532d', '#0d3d20', '#16a34a'];
    for (let i = 0; i < 90; i++) {
      const rx = Math.floor(Math.random() * size);
      const ry = Math.floor(Math.random() * size);
      ctx.fillStyle = greens[Math.floor(Math.random() * greens.length)];
      ctx.fillRect(rx, ry, 1, 1);
    }

    // Flowers & pebbles
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#facc15' : '#f43f5e';
      ctx.fillRect(Math.floor(Math.random() * (size - 2)) + 1, Math.floor(Math.random() * (size - 2)) + 1, 1, 1);
    }
  });

  // 2. SOIL Earth Top Pixel Texture
  public static texSoilTop = createPixelArtTexture((ctx, size) => {
    ctx.fillStyle = '#78350f'; // Earthy brown
    ctx.fillRect(0, 0, size, size);

    // Dither soil grains & pebbles
    const browns = ['#92400e', '#b45309', '#451a03', '#d97706', '#581c87'];
    for (let i = 0; i < 110; i++) {
      const rx = Math.floor(Math.random() * size);
      const ry = Math.floor(Math.random() * size);
      ctx.fillStyle = browns[Math.floor(Math.random() * browns.length)];
      ctx.fillRect(rx, ry, 1, 1);
    }

    // Stone granules
    ctx.fillStyle = '#a1a1aa';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(Math.floor(Math.random() * size), Math.floor(Math.random() * size), 1, 1);
    }
  });

  // 3. TILLED Furrowed Soil Top Pixel Texture (Rich Earth Browns)
  public static texTilledTop = createPixelArtTexture((ctx, size) => {
    ctx.fillStyle = '#451a03'; // Deep rich earth brown
    ctx.fillRect(0, 0, size, size);

    // 4 Parallel furrow stripes across canvas
    for (let y = 0; y < size; y++) {
      const groove = y % 8;
      if (groove < 2) {
        ctx.fillStyle = '#290f02'; // Shadow furrow groove
      } else if (groove < 5) {
        ctx.fillStyle = '#78350f'; // Ridge
      } else if (groove < 7) {
        ctx.fillStyle = '#92400e'; // Ridge highlight
      } else {
        ctx.fillStyle = '#581c0c';
      }
      ctx.fillRect(0, y, size, 1);
    }

    // Soil clump noise over ridges
    ctx.fillStyle = '#1c0a00';
    for (let i = 0; i < 50; i++) {
      ctx.fillRect(Math.floor(Math.random() * size), Math.floor(Math.random() * size), 1, 1);
    }
  });

  // 4. IRRIGATED Hydrated Soil Top Pixel Texture
  public static texIrrigatedTop = createPixelArtTexture((ctx, size) => {
    ctx.fillStyle = '#0e7490'; // Moist cyan-teal earth
    ctx.fillRect(0, 0, size, size);

    // Dark damp soil noise
    ctx.fillStyle = '#155e75';
    for (let i = 0; i < 80; i++) {
      ctx.fillRect(Math.floor(Math.random() * size), Math.floor(Math.random() * size), 1, 1);
    }

    // Sparkling water droplet pixels
    const drops = ['#06b6d4', '#67e8f9', '#a5f3fc', '#e0f2fe'];
    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = drops[Math.floor(Math.random() * drops.length)];
      ctx.fillRect(Math.floor(Math.random() * size), Math.floor(Math.random() * size), 1, 1);
    }
  });

  // 5. SOAKED Flooded Pool Top Pixel Texture
  public static texSoakedTop = createPixelArtTexture((ctx, size) => {
    ctx.fillStyle = '#1e1b4b'; // Mud border rim
    ctx.fillRect(0, 0, size, size);

    // Flooded water pool inner area
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(3, 3, size - 6, size - 6);

    // Water ripple concentric square rings
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(6, 6, size - 12, size - 12);
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(9, 9, size - 18, size - 18);
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(12, 12, size - 24, size - 24);

    // Reflection specks
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 10, 2, 2);
    ctx.fillRect(18, 14, 2, 1);
  });

  // 6. PRESTIGE Cyber Gold Plate Top Pixel Texture
  public static texPrestigeTop = createPixelArtTexture((ctx, size) => {
    ctx.fillStyle = '#d97706'; // Metallic gold alloy
    ctx.fillRect(0, 0, size, size);

    // Bevel frame border
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 0, size, 2);
    ctx.fillRect(0, 0, 2, size);
    ctx.fillRect(0, size - 2, size, 2);
    ctx.fillRect(size - 2, 0, 2, size);

    // Circuit traces
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(4, 16, 24, 2);
    ctx.fillRect(16, 4, 2, 24);

    ctx.fillStyle = '#facc15';
    ctx.fillRect(8, 8, 4, 4);
    ctx.fillRect(20, 8, 4, 4);
    ctx.fillRect(8, 20, 4, 4);
    ctx.fillRect(20, 20, 4, 4);

    // Glowing LED corners
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(1, 1, 2, 2);
    ctx.fillRect(size - 3, 1, 2, 2);
    ctx.fillRect(1, size - 3, 2, 2);
    ctx.fillRect(size - 3, size - 3, 2, 2);
  });

  // 7. Side Wall Stratified Dirt Texture
  public static texSideDirt = createPixelArtTexture((ctx, size) => {
    // Top 25% Surface Transition
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, size, 8);

    // Dither teeth
    ctx.fillStyle = '#14532d';
    for (let x = 0; x < size; x += 2) {
      ctx.fillRect(x, 7, 1, 2);
    }

    // Mid 50% Soil Strata
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 8, size, 16);

    ctx.fillStyle = '#451a03';
    for (let i = 0; i < 40; i++) {
      ctx.fillRect(Math.floor(Math.random() * size), 8 + Math.floor(Math.random() * 16), 1, 1);
    }

    // Bottom 25% Bedrock Strata
    ctx.fillStyle = '#292524';
    ctx.fillRect(0, 24, size, 8);

    ctx.fillStyle = '#1c1917';
    for (let x = 0; x < size; x += 3) {
      ctx.fillRect(x, 24, 2, 8);
    }
  });

  // 8. Side Wall Prestige Gold Panel Texture
  public static texSidePrestige = createPixelArtTexture((ctx, size) => {
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, 2, size);
    ctx.fillRect(size - 2, 0, 2, size);

    ctx.fillStyle = '#eab308';
    ctx.fillRect(6, 0, 2, size);
    ctx.fillRect(24, 0, 2, size);

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(15, 4, 2, 24);
  });

  // Foliage / Crop Texture Canvas (High Contrast Electric Lime & Emerald)
  public static texFoliage = createPixelArtTexture((ctx, size) => {
    ctx.fillStyle = '#22c55e'; // Vibrant spring green
    ctx.fillRect(0, 0, size, size);

    const shades = ['#84cc16', '#a3e635', '#10b981', '#34d399', '#facc15', '#065f46'];
    for (let i = 0; i < 110; i++) {
      ctx.fillStyle = shades[Math.floor(Math.random() * shades.length)];
      ctx.fillRect(Math.floor(Math.random() * size), Math.floor(Math.random() * size), 1, 1);
    }
  });

  public static texBark = createPixelArtTexture((ctx, size) => {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#451a03';
    for (let x = 0; x < size; x += 4) {
      ctx.fillRect(x, 0, 2, size);
    }
  });

  // ----------------------------------------------------
  // SHARED MATERIALS (6-FACE GROUND BOX ARRAYS)
  // ----------------------------------------------------

  public static matSideDirt = new THREE.MeshStandardMaterial({ map: ThreeAssetCache.texSideDirt, roughness: 0.8 });
  public static matSidePrestige = new THREE.MeshStandardMaterial({ map: ThreeAssetCache.texSidePrestige, metalness: 0.8, roughness: 0.2 });
  public static matBedrock = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });

  public static matNaturalTop = new THREE.MeshStandardMaterial({ map: ThreeAssetCache.texNaturalTop, roughness: 0.7 });
  public static matSoilTop = new THREE.MeshStandardMaterial({ map: ThreeAssetCache.texSoilTop, roughness: 0.85 });
  public static matTilledTop = new THREE.MeshStandardMaterial({ map: ThreeAssetCache.texTilledTop, roughness: 0.85 });
  public static matIrrigatedTop = new THREE.MeshStandardMaterial({ map: ThreeAssetCache.texIrrigatedTop, roughness: 0.5, metalness: 0.1 });
  public static matSoakedTop = new THREE.MeshStandardMaterial({ map: ThreeAssetCache.texSoakedTop, roughness: 0.2, metalness: 0.3 });
  public static matPrestigeTop = new THREE.MeshStandardMaterial({ map: ThreeAssetCache.texPrestigeTop, metalness: 0.85, roughness: 0.15, emissive: 0xd97706, emissiveIntensity: 0.3 });

  // 6-Material Box Arrays for 3D Tile Voxels [px, nx, py, ny, pz, nz]
  public static groundBoxMaterials: Record<GroundType, THREE.Material[]> = {
    NATURAL: [ThreeAssetCache.matSideDirt, ThreeAssetCache.matSideDirt, ThreeAssetCache.matNaturalTop, ThreeAssetCache.matBedrock, ThreeAssetCache.matSideDirt, ThreeAssetCache.matSideDirt],
    SOIL: [ThreeAssetCache.matSideDirt, ThreeAssetCache.matSideDirt, ThreeAssetCache.matSoilTop, ThreeAssetCache.matBedrock, ThreeAssetCache.matSideDirt, ThreeAssetCache.matSideDirt],
    TILLED: [ThreeAssetCache.matSideDirt, ThreeAssetCache.matSideDirt, ThreeAssetCache.matTilledTop, ThreeAssetCache.matBedrock, ThreeAssetCache.matSideDirt, ThreeAssetCache.matSideDirt],
    IRRIGATED: [ThreeAssetCache.matSideDirt, ThreeAssetCache.matSideDirt, ThreeAssetCache.matIrrigatedTop, ThreeAssetCache.matBedrock, ThreeAssetCache.matSideDirt, ThreeAssetCache.matSideDirt],
    SOAKED: [ThreeAssetCache.matSideDirt, ThreeAssetCache.matSideDirt, ThreeAssetCache.matSoakedTop, ThreeAssetCache.matBedrock, ThreeAssetCache.matSideDirt, ThreeAssetCache.matSideDirt],
    PRESTIGE: [ThreeAssetCache.matSidePrestige, ThreeAssetCache.matSidePrestige, ThreeAssetCache.matPrestigeTop, ThreeAssetCache.matSidePrestige, ThreeAssetCache.matSidePrestige, ThreeAssetCache.matSidePrestige],
  };

  // Crop Materials (High Contrast & Hyper-Realistic Voxel Art)
  public static matFoliage = new THREE.MeshStandardMaterial({ map: ThreeAssetCache.texFoliage, roughness: 0.4, emissive: 0x10b981, emissiveIntensity: 0.35 });
  public static matDeepForest = new THREE.MeshStandardMaterial({ color: 0x052e16, roughness: 0.7 });
  public static matBrightLime = new THREE.MeshStandardMaterial({ color: 0xa3e635, emissive: 0x84cc16, emissiveIntensity: 0.5, roughness: 0.3 });
  public static matBark = new THREE.MeshStandardMaterial({ map: ThreeAssetCache.texBark, roughness: 0.8 });
  public static matWheatHead = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
  public static matStem = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.6 });
  public static matBerry = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xd97706, emissiveIntensity: 0.4, roughness: 0.3 });
  public static matTomatoRed = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.3, roughness: 0.2 });
  public static matAppleRed = new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0x991b1b, emissiveIntensity: 0.3, roughness: 0.2 });
  public static matWoodTrellis = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  public static matBlossomYellow = new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xeab308, emissiveIntensity: 0.6 });
  public static matBeetroot = new THREE.MeshStandardMaterial({ color: 0xa21caf, emissive: 0x701a75, emissiveIntensity: 0.4, roughness: 0.4 });
  public static matSporeTeal = new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x06b6d4, emissiveIntensity: 0.9, roughness: 0.1 });
  public static matSunflowerDisc = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
  public static matFruitCrystal = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.7, roughness: 0.2, metalness: 0.8 });
  public static matEnergyCore = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x22d3ee, emissiveIntensity: 0.9, roughness: 0.1, metalness: 0.9 });
  public static matEnergyPetal = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });
  public static matRootCrop = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
  public static matGradedHelix = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 0.7, roughness: 0.3 });
  public static matPrestigeCrystal = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xeab308, emissiveIntensity: 0.9, roughness: 0.1, metalness: 0.9 });
  public static matMarioStar = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xfacc15, emissiveIntensity: 0.85, metalness: 0.95, roughness: 0.08 });
  public static matMarioStarEye = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.2 });
  public static matGoldPedestal = new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0x78350f, emissiveIntensity: 0.35, metalness: 0.9, roughness: 0.15 });
  public static matGoldSparkle = new THREE.MeshStandardMaterial({ color: 0xfffbeb, emissive: 0xfacc15, emissiveIntensity: 1.0, roughness: 0.05, metalness: 0.95 });

  // Combo Target Materials
  public static matComboRing = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.9, roughness: 0.2 });
  public static matComboStar = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xeab308, emissiveIntensity: 1.0, roughness: 0.1 });
  public static matComboBeacon = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.8 });

  // Zero Soil Inactive [z] Materials
  public static matZeroSoilTop = new THREE.MeshStandardMaterial({ color: 0x221c19, roughness: 0.95, metalness: 0.05 });
  public static matZeroSoilEdges = new THREE.LineBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.85 });
  public static matZeroSoilStud = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.8 });

  // Agent Drone Ship Materials
  private static agentHullMatCache = new Map<string, THREE.MeshStandardMaterial>();
  public static getAgentHullMat(colorHex: string): THREE.MeshStandardMaterial {
    if (!this.agentHullMatCache.has(colorHex)) {
      this.agentHullMatCache.set(colorHex, new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.8, roughness: 0.2 }));
    }
    return this.agentHullMatCache.get(colorHex)!;
  }
  public static matAgentDome = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.8, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.85 });
  public static matAgentThruster = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xeab308, emissiveIntensity: 0.9 });
  public static matAgentBeam = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
}

// Safely disposes non-cached dynamic 3D objects
function dispose3DObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments || child instanceof THREE.Line) {
      // Only dispose if NOT in static asset cache
      const isSharedGeo = Object.values(ThreeAssetCache).includes(child.geometry as any);
      if (!isSharedGeo && child.geometry) {
        child.geometry.dispose();
      }
    }
  });
}

export const World3DCanvas: React.FC<World3DCanvasProps> = ({ engine }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inspectedCoords, setInspectedCoords] = useState<{ x: number; y: number } | null>({ x: 0, y: 0 });
  const [followAgent, setFollowAgent] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('terrascript_follow_agent');
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return true; // Padrão: Seguir ON
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('terrascript_follow_agent', String(followAgent));
    }
  }, [followAgent]);
  // Camera Offset from map center or followed agent
  const [povOffset, setPovOffset] = useState<{ x: number; z: number }>({ x: 0, z: 0 });

  const povOffsetRef = useRef({ x: 0, z: 0 });
  const zoomLevelRef = useRef(1.0);
  const followAgentRef = useRef(followAgent);

  useEffect(() => {
    povOffsetRef.current = povOffset;
  }, [povOffset]);

  useEffect(() => {
    followAgentRef.current = followAgent;
  }, [followAgent]);

  // Simple Arrow Navigation Controls
  const resetPOV = () => {
    povOffsetRef.current = { x: 0, z: 0 };
    setPovOffset({ x: 0, z: 0 });
    setZoomLevel(1.0);
    setFollowAgent(true);
  };

  const panPOV = (direction: 'up' | 'down' | 'left' | 'right', amount = 1.2) => {
    const yawRad = (15 * Math.PI) / 180;
    let dx = 0;
    let dz = 0;
    if (direction === 'up') dz = -amount;
    if (direction === 'down') dz = amount;
    if (direction === 'left') dx = -amount;
    if (direction === 'right') dx = amount;

    const worldDx = dx * Math.cos(yawRad) - dz * Math.sin(yawRad);
    const worldDz = dx * Math.sin(yawRad) + dz * Math.cos(yawRad);

    const next = {
      x: povOffsetRef.current.x + worldDx,
      z: povOffsetRef.current.z + worldDz,
    };
    povOffsetRef.current = next;
    setPovOffset(next);
  };

  const [pixelMode, setPixelMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('terrascript_pixel_mode');
      return saved ? saved === 'true' : true; // Default: v2.5.0 Pixelated 3D Pass ON
    }
    return true;
  });

  // Fixed 2p Pixelated 3D Postprocessing Pass
  const pixelSize = 2;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('terrascript_pixel_mode', String(pixelMode));
    }
  }, [pixelMode]);

  const primaryAgent = engine.getPrimaryAgent();
  const activeCoords = (followAgent && primaryAgent)
    ? { x: primaryAgent.x, y: primaryAgent.y }
    : inspectedCoords;

  // Permanent High-Performance Profile (Max Optimization Always Active)
  const isPerfMode = true;
  const [fps, setFps] = useState<number>(60);
  const [drawCalls, setDrawCalls] = useState<number>(0);
  const [ramMb, setRamMb] = useState<number>(35);
  const [showHud, setShowHud] = useState<boolean>(false);
  const [engineTick, setEngineTick] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = engine.subscribe(() => {
      setEngineTick(prev => prev + 1);
    });
    return () => unsubscribe();
  }, [engine]);

  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('terrascript_zoom_level');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return 1.0;
  });

  // Persist zoomLevel across tab switches & sessions and sync ref
  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
    if (typeof window !== 'undefined') {
      localStorage.setItem('terrascript_zoom_level', String(zoomLevel));
    }
  }, [zoomLevel]);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const pixelPassRef = useRef<RenderPixelatedPass | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);

  const tileMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const agentMeshesRef = useRef<Map<number, THREE.Group>>(new Map());
  const selectionMeshRef = useRef<THREE.LineSegments | null>(null);

  const pixelModeRef = useRef(pixelMode);
  useEffect(() => {
    pixelModeRef.current = pixelMode;
  }, [pixelMode]);

  // Central Camera Positioning Engine
  const updateCameraPosition = () => {
    if (!cameraRef.current || !containerRef.current) return;
    const camera = cameraRef.current;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    if (w === 0 || h === 0) return;

    const aspect = w / h;
    const width = engine.getGridWidth();
    const height = engine.getGridHeight();
    const maxDim = Math.max(width, height);
    const frustumSize = Math.max(10, maxDim * 2.2);

    camera.left = (-frustumSize * aspect) / 2;
    camera.right = (frustumSize * aspect) / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.zoom = zoomLevelRef.current;
    camera.updateProjectionMatrix();

    // Base target center
    let baseTargetX = (width - 1) * 0.6;
    let baseTargetZ = (height - 1) * 0.6;

    const primaryAgent = engine.getPrimaryAgent();
    if (followAgentRef.current && primaryAgent) {
      baseTargetX = primaryAgent.x * 1.2;
      baseTargetZ = primaryAgent.y * 1.2;
    }

    const targetX = baseTargetX + povOffsetRef.current.x;
    const targetZ = baseTargetZ + povOffsetRef.current.z;

    const pitchRad = (45 * Math.PI) / 180;
    const yawRad = (15 * Math.PI) / 180;
    const radius = maxDim * 2.2;

    const camX = targetX + radius * Math.cos(pitchRad) * Math.sin(yawRad);
    const camY = radius * Math.sin(pitchRad);
    const camZ = targetZ + radius * Math.cos(pitchRad) * Math.cos(yawRad);

    camera.position.set(camX, camY, camZ);
    camera.lookAt(targetX, 0, targetZ);
  };

  // Keyboard Arrow Navigation Listener (▲, ▼, ◄, ►)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
         target.tagName === 'TEXTAREA' ||
         target.isContentEditable ||
         !!target.closest('input, textarea, [contenteditable="true"], .cm-editor, .cm-content, .monaco-editor'))
      ) {
        return;
      }

      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
         activeEl.tagName === 'TEXTAREA' ||
         activeEl.isContentEditable ||
         !!activeEl.closest('input, textarea, [contenteditable="true"], .cm-editor, .cm-content, .monaco-editor'))
      ) {
        return;
      }

      if (e.code === 'ArrowUp') {
        e.preventDefault();
        panPOV('up', 1.0);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        panPOV('down', 1.0);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        panPOV('left', 1.0);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        panPOV('right', 1.0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Mouse wheel zoom listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoomLevel((prev) => Math.min(Math.max(parseFloat((prev + delta).toFixed(2)), 0.4), 2.5));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // FPS & Telemetry
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08090a); // Linear Dark Slate ambient
    sceneRef.current = scene;

    // 2. Orthographic Isometric Camera Setup
    const aspect = width / height;
    const frustumSize = 12;
    const camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    camera.position.set(15, 18, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer Setup (Optimized default)
    const renderer = new THREE.WebGLRenderer({ antialias: !isPerfMode, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isPerfMode ? 1.0 : Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = !isPerfMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3.5. Postprocessing Setup (v2.5.0 Pixelated 3D Pass)
    const composer = new EffectComposer(renderer);
    const pixelPass = new RenderPixelatedPass(pixelSize, scene, camera);
    pixelPass.normalEdgeStrength = 0.15;
    pixelPass.depthEdgeStrength = 0.45;
    composer.addPass(pixelPass);
    composer.addPass(new OutputPass());
    composerRef.current = composer;
    pixelPassRef.current = pixelPass;

    // 4. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.3);
    dirLight.position.set(20, 30, 15);
    dirLight.castShadow = !isPerfMode;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x059669, 0.4);
    scene.add(hemiLight);

    // 5. Animation Loop with FPS Limiter & Pixelated Postpass
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Telemetry
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastTimeRef.current >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current)));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
        if (rendererRef.current) {
          setDrawCalls(rendererRef.current.info.render.calls);
        }
        const mem = (performance as any).memory;
        if (mem && mem.usedJSHeapSize) {
          setRamMb(Math.round(mem.usedJSHeapSize / (1024 * 1024)));
        } else {
          // Stable low memory footprint baseline for optimized Three.js
          setRamMb(32 + Math.floor(Math.random() * 3));
        }
      }

      // Animate Alien Agent Ships (floating, bobbing & energy ring plasma spin)
      agentMeshesRef.current.forEach((mesh) => {
        mesh.position.y = 0.85 + Math.sin(elapsedTime * 2.5) * 0.12;
        mesh.rotation.y += 0.01;
        const ring = mesh.getObjectByName('energyRing');
        if (ring) {
          ring.rotation.z += 0.04;
        }
      });

      // Ambient Farm Field Wind Sway & Dynamic Voxel Animations
      tileMeshesRef.current.forEach((tileGroup) => {
        const cropGroup = tileGroup.getObjectByName('cropGroup');
        if (cropGroup) {
          const tileX = tileGroup.userData.tileX || 0;
          const tileY = tileGroup.userData.tileY || 0;
          // Organic wind wave passing across the farm field
          const windZ = Math.sin(elapsedTime * 2.2 + tileX * 0.4 + tileY * 0.4) * 0.035;
          const windX = Math.cos(elapsedTime * 1.8 + tileX * 0.3) * 0.02;
          cropGroup.rotation.z = windZ;
          cropGroup.rotation.x = windX;

          // Animate rotating components & floating spores inside crop
          cropGroup.traverse((child) => {
            if (child.userData) {
              const { animType, baseY = 0.50, angleOffset = 0 } = child.userData;
              if (animType === 'rotate') {
                child.rotation.y += 0.02;
              } else if (animType === 'marioStar') {
                child.rotation.y += 0.035; // Spinning Mario Golden Star
                child.position.y = baseY + Math.sin(elapsedTime * 3.5) * 0.06; // Bobbing up and down
              } else if (animType === 'starOrbit') {
                const curAngle = angleOffset + elapsedTime * 2.0;
                child.position.x = Math.cos(curAngle) * 0.38;
                child.position.z = Math.sin(curAngle) * 0.38;
                child.position.y = 0.50 + Math.sin(elapsedTime * 4.0 + angleOffset) * 0.05;
              } else if (animType === 'float') {
                child.position.y = baseY + Math.sin(elapsedTime * 3 + tileX) * 0.04;
              }
            }
          });
        }

        // Animate floating target diamond inside comboGroup
        const comboGroup = tileGroup.getObjectByName('comboGroup');
        if (comboGroup) {
          comboGroup.traverse((child) => {
            if (child.userData && child.userData.animType === 'comboTarget') {
              child.rotation.y += 0.04;
              child.position.y = 0.45 + Math.sin(elapsedTime * 4.0) * 0.08;
            }
          });
        }
      });

      updateCameraPosition();

      if (pixelModeRef.current && composerRef.current) {
        composerRef.current.render();
      } else if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // 6. Handle Container Resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      const asp = w / h;
      cameraRef.current.left = (-frustumSize * asp) / 2;
      cameraRef.current.right = (frustumSize * asp) / 2;
      cameraRef.current.top = frustumSize / 2;
      cameraRef.current.bottom = -frustumSize / 2;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
      if (composerRef.current) {
        composerRef.current.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Update Performance Mode settings dynamically
  useEffect(() => {
    if (!rendererRef.current || !dirLightRef.current) return;
    rendererRef.current.shadowMap.enabled = !isPerfMode;
    rendererRef.current.setPixelRatio(isPerfMode ? 1.0 : Math.min(window.devicePixelRatio, 1.5));
    dirLightRef.current.castShadow = !isPerfMode;
  }, [isPerfMode]);

  // Update 3D Grid & Drones whenever Engine State changes (In-Place & Memory Safe)
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    const width = engine.getGridWidth();
    const height = engine.getGridHeight();

    // Position camera using central camera positioning engine
    updateCameraPosition();

    // Safely remove tile meshes outside current bounds
    const existingKeys = new Set<string>();
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        existingKeys.add(`${c},${r}`);
      }
    }

    tileMeshesRef.current.forEach((group, key) => {
      if (!existingKeys.has(key)) {
        scene.remove(group);
        dispose3DObject(group);
        tileMeshesRef.current.delete(key);
      }
    });

    // Rebuild / Update Tiles 3D using Shared Pools
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const key = `${c},${r}`;
        const tileState = engine.getTile(c, r);

        let group = tileMeshesRef.current.get(key);
        if (!group) {
          group = create3DTileGroup(tileState, c, r);
          scene.add(group);
          tileMeshesRef.current.set(key, group);
        } else {
          update3DTileGroup(group, tileState);
        }
      }
    }

    // Rebuild / Update Alien Agent Ships 3D
    const currentAgents = engine.getAgents();
    currentAgents.forEach((ag) => {
      let agentMesh = agentMeshesRef.current.get(ag.id);
      if (!agentMesh) {
        agentMesh = createAgentShipMesh(ag.color);
        scene.add(agentMesh);
        agentMeshesRef.current.set(ag.id, agentMesh);
      }
      // Target position
      const targetX = ag.x * 1.2;
      const targetZ = ag.y * 1.2;
      agentMesh.position.x = targetX;
      agentMesh.position.z = targetZ;
    });

  }, [engine, engineTick, engine.getCurrentTick(), engine.getGridWidth(), engine.getGridHeight(), zoomLevel]);

  // Selection box overlay for inspected tile
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (selectionMeshRef.current) {
      scene.remove(selectionMeshRef.current);
      selectionMeshRef.current = null;
    }

    if (activeCoords) {
      const selectionMesh = new THREE.LineSegments(ThreeAssetCache.selectionEdgesGeo, ThreeAssetCache.selectionLineMat);
      selectionMesh.position.set(activeCoords.x * 1.2, -0.225, activeCoords.y * 1.2);
      scene.add(selectionMesh);
      selectionMeshRef.current = selectionMesh;
    }
  }, [activeCoords?.x, activeCoords?.y, engine.getGridWidth(), engine.getGridHeight()]);

  // Helper 3D Combo Target Visual Group (Prestígio Nível 25+)
  const createComboHighlightVisualGroup = (comboIdx: number): THREE.Group => {
    const group = new THREE.Group();

    // 1. Glowing Amber Ring on tile floor surface
    const ring = new THREE.Mesh(ThreeAssetCache.comboRingGeo, ThreeAssetCache.matComboRing);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.012;
    group.add(ring);

    // 2. 4 Glowing Amber Corner Beacons
    const beaconCoords = [
      [-0.48, -0.48],
      [0.48, -0.48],
      [-0.48, 0.48],
      [0.48, 0.48],
    ];
    beaconCoords.forEach(([px, pz]) => {
      const beacon = new THREE.Mesh(ThreeAssetCache.comboBeaconGeo, ThreeAssetCache.matComboBeacon);
      beacon.position.set(px, 0.08, pz);
      group.add(beacon);
    });

    // 3. Floating Golden Target Diamond / Star with animation
    const floatingStar = new THREE.Mesh(ThreeAssetCache.comboStarGeo, ThreeAssetCache.matComboStar);
    floatingStar.position.y = 0.45;
    floatingStar.userData = { animType: 'comboTarget' };
    group.add(floatingStar);

    return group;
  };

  // Helper 3D Zero Soil Inactive Visual Group (Prestígio Nível 50+)
  const createZeroSoilVisualGroup = (): THREE.Group => {
    const group = new THREE.Group();

    // 1. Dry Cracked Barren Overlay Box on top of tile
    const barrenMesh = new THREE.Mesh(ThreeAssetCache.zeroSoilBoxGeo, ThreeAssetCache.matZeroSoilTop);
    barrenMesh.position.y = 0.008;
    group.add(barrenMesh);

    // 2. Red Alert Wireframe Edges around tile
    const alertEdges = new THREE.LineSegments(ThreeAssetCache.zeroSoilEdgesGeo, ThreeAssetCache.matZeroSoilEdges);
    alertEdges.position.y = 0.008;
    group.add(alertEdges);

    // 3. 4 Red Corner Warning Studs
    const studCoords = [
      [-0.46, -0.46],
      [0.46, -0.46],
      [-0.46, 0.46],
      [0.46, 0.46],
    ];
    studCoords.forEach(([px, pz]) => {
      const stud = new THREE.Mesh(ThreeAssetCache.zeroSoilStudGeo, ThreeAssetCache.matZeroSoilStud);
      stud.position.set(px, 0.04, pz);
      group.add(stud);
    });

    return group;
  };

  // Helper 3D Voxel Tile Creator (Uses Multi-Material Array with Pixel Art Textures)
  const create3DTileGroup = (tile: TileState, x: number, y: number): THREE.Group => {
    const group = new THREE.Group();
    group.userData = { tileX: x, tileY: y, lastGround: tile.ground, lastCrop: tile.crop, lastGrowth: tile.growth };
    const posX = x * 1.2;
    const posZ = y * 1.2;
    group.position.set(posX, 0, posZ);

    // Ground Base Box (6 Multi-material Array with Stratified Side Walls - Height 0.45)
    const boxMats = ThreeAssetCache.groundBoxMaterials[tile.ground] || ThreeAssetCache.groundBoxMaterials.NATURAL;
    const baseMesh = new THREE.Mesh(ThreeAssetCache.baseTileGeo, boxMats);
    baseMesh.name = 'groundMesh';
    baseMesh.userData = { tileX: x, tileY: y };
    baseMesh.position.y = -0.225;
    group.add(baseMesh);

    // Grid border outline
    const line = new THREE.LineSegments(ThreeAssetCache.tileEdgesGeo, ThreeAssetCache.lineMat);
    line.position.y = -0.225;
    group.add(line);

    // Sub-tile Voxel Terrain Relevo Highlights
    const terrainDetailGroup = createTerrainSubDetails(tile.ground);
    terrainDetailGroup.name = 'terrainDetailGroup';
    group.add(terrainDetailGroup);

    // 3D Crop Voxel Assembly
    if (tile.crop !== 'NONE') {
      const cropGroup = create3DCropMesh(tile.crop, tile.growth);
      cropGroup.name = 'cropGroup';
      cropGroup.position.y = 0.01;
      group.add(cropGroup);
    }

    // Apply Overlays (Zero Soil & Combo)
    update3DTileGroup(group, tile);

    return group;
  };

  // Create Sub-tile Voxel Details (Relevo nos solos)
  const createTerrainSubDetails = (ground: GroundType): THREE.Group => {
    const detailGroup = new THREE.Group();

    if (ground === 'TILLED') {
      // 2 Raised Furrow Ridges across the soil tile
      const ridge1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.18), ThreeAssetCache.matTilledTop);
      ridge1.position.set(0, 0.02, -0.22);
      const ridge2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.18), ThreeAssetCache.matTilledTop);
      ridge2.position.set(0, 0.02, 0.22);
      detailGroup.add(ridge1, ridge2);
    } else if (ground === 'IRRIGATED') {
      // Translucent wet water sheen layer
      const waterLayer = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.8 })
      );
      waterLayer.rotation.x = -Math.PI / 2;
      waterLayer.position.y = 0.005;
      detailGroup.add(waterLayer);
    } else if (ground === 'SOAKED') {
      // Flooded water puddle plane
      const pool = new THREE.Mesh(
        new THREE.PlaneGeometry(1.0, 1.0),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, transparent: true, opacity: 0.6, roughness: 0.05, metalness: 0.9 })
      );
      pool.rotation.x = -Math.PI / 2;
      pool.position.y = 0.008;
      detailGroup.add(pool);
    } else if (ground === 'PRESTIGE') {
      // 4 Glowing Corner LED Posts
      const postGeo = new THREE.BoxGeometry(0.08, 0.12, 0.08);
      const postMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xeab308, emissiveIntensity: 0.9 });
      [
        [-0.45, -0.45],
        [0.45, -0.45],
        [-0.45, 0.45],
        [0.45, 0.45],
      ].forEach(([px, pz]) => {
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(px, 0.06, pz);
        detailGroup.add(post);
      });
    }

    return detailGroup;
  };

  // In-Place Tile Updater
  const update3DTileGroup = (group: THREE.Group, tile: TileState) => {
    const u = group.userData;
    
    // Update ground material & terrain details if ground type changed
    if (u.lastGround !== tile.ground) {
      const groundMesh = group.getObjectByName('groundMesh') as THREE.Mesh;
      if (groundMesh) {
        groundMesh.material = ThreeAssetCache.groundBoxMaterials[tile.ground] || ThreeAssetCache.groundBoxMaterials.NATURAL;
      }
      let oldDetailGroup = group.getObjectByName('terrainDetailGroup');
      if (oldDetailGroup) {
        group.remove(oldDetailGroup);
      }
      const newDetailGroup = createTerrainSubDetails(tile.ground);
      newDetailGroup.name = 'terrainDetailGroup';
      group.add(newDetailGroup);
      u.lastGround = tile.ground;
    }

    // Update Zero Soil Inactive Overlay (Prestígio Nível 50+)
    const isPrestige50 = engine.getPrestige().level >= 50;
    const soilQuality = typeof tile.soilQuality === 'number' ? tile.soilQuality : 0;
    const isZeroSoil = isPrestige50 && soilQuality === 0;

    if (u.lastZeroSoil !== isZeroSoil) {
      let oldZeroSoilGroup = group.getObjectByName('zeroSoilGroup');
      if (oldZeroSoilGroup) {
        group.remove(oldZeroSoilGroup);
        dispose3DObject(oldZeroSoilGroup);
      }
      if (isZeroSoil) {
        const zeroSoilGroup = createZeroSoilVisualGroup();
        zeroSoilGroup.name = 'zeroSoilGroup';
        group.add(zeroSoilGroup);
      }
      u.lastZeroSoil = isZeroSoil;
    }

    // Update Combo Target Visual Highlight (Prestígio Nível 25+)
    const isPrestige25 = engine.getPrestige().level >= 25;
    const comboIdx = isPrestige25 ? engine.getComboIndex(tile.x, tile.y) : false;
    // Highlight tiles with COMBO value different from None (false), EXCEPT 0,0
    const isComboTarget = comboIdx !== false && comboIdx !== 0;

    if (u.lastComboIdx !== comboIdx || (!isComboTarget && group.getObjectByName('comboGroup'))) {
      let oldComboGroup = group.getObjectByName('comboGroup');
      if (oldComboGroup) {
        group.remove(oldComboGroup);
        dispose3DObject(oldComboGroup);
      }
      if (isComboTarget) {
        const comboGroup = createComboHighlightVisualGroup(comboIdx as number);
        comboGroup.name = 'comboGroup';
        group.add(comboGroup);
      }
      u.lastComboIdx = comboIdx;
    }

    // Update crop mesh if changed or grown
    if (u.lastCrop !== tile.crop || Math.abs(u.lastGrowth - tile.growth) > 5) {
      let oldCropGroup = group.getObjectByName('cropGroup');
      if (oldCropGroup) {
        group.remove(oldCropGroup);
      }
      if (tile.crop !== 'NONE') {
        const cropGroup = create3DCropMesh(tile.crop, tile.growth);
        cropGroup.name = 'cropGroup';
        cropGroup.position.y = 0.01;
        group.add(cropGroup);
      }
      u.lastCrop = tile.crop;
      u.lastGrowth = tile.growth;
    }
  };

  // Helper 3D Crop Mesh Creator (Hyper-Realistic Pixel-Art Voxel Assemblies)
  const create3DCropMesh = (type: CropType, growth: number): THREE.Group => {
    const cropGroup = new THREE.Group();
    cropGroup.userData.isCrop = true;

    if (type === 'PRESTIGE') {
      // PRESTIGE: Golden Pedestal & Spinning Super Mario 3D Golden Star
      const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.06, 12), ThreeAssetCache.matGoldPedestal);
      pedestal.position.y = 0.04;
      cropGroup.add(pedestal);

      // Super Mario Star Container
      const starGroup = new THREE.Group();

      // Golden Star Mesh
      const starMesh = new THREE.Mesh(ThreeAssetCache.marioStarGeo, ThreeAssetCache.matMarioStar);
      starGroup.add(starMesh);

      // Iconic Vertical Black Eyes (front & back)
      const eyeFL = new THREE.Mesh(ThreeAssetCache.marioStarEyeGeo, ThreeAssetCache.matMarioStarEye);
      eyeFL.position.set(-0.065, -0.015, 0.046);
      const eyeFR = new THREE.Mesh(ThreeAssetCache.marioStarEyeGeo, ThreeAssetCache.matMarioStarEye);
      eyeFR.position.set(0.065, -0.015, 0.046);

      const eyeBL = new THREE.Mesh(ThreeAssetCache.marioStarEyeGeo, ThreeAssetCache.matMarioStarEye);
      eyeBL.position.set(-0.065, -0.015, -0.046);
      const eyeBR = new THREE.Mesh(ThreeAssetCache.marioStarEyeGeo, ThreeAssetCache.matMarioStarEye);
      eyeBR.position.set(0.065, -0.015, -0.046);

      starGroup.add(eyeFL, eyeFR, eyeBL, eyeBR);

      starGroup.position.y = 0.50;
      starGroup.userData = { animType: 'marioStar', baseY: 0.50 };
      cropGroup.add(starGroup);

      // Orbiting Golden Sparkle Orbs
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const sparkle = new THREE.Mesh(ThreeAssetCache.sporeBallGeo, ThreeAssetCache.matGoldSparkle);
        sparkle.position.set(Math.cos(angle) * 0.38, 0.50, Math.sin(angle) * 0.38);
        sparkle.scale.set(0.7, 0.7, 0.7);
        sparkle.userData = { animType: 'starOrbit', angleOffset: angle };
        cropGroup.add(sparkle);
      }

      return cropGroup;
    }

    // Growth progression scale & stage
    const growthStage = growth < 25 ? 'SPROUT' : growth < 60 ? 'YOUNG' : 'MATURE';
    const scale = 0.3 + (growth / 100) * 0.7;

    if (growthStage === 'SPROUT') {
      // Small sprouting shoots pushing out of tilled soil mound
      const mound = new THREE.Mesh(ThreeAssetCache.rootMoundGeo, ThreeAssetCache.matSoilTop);
      mound.position.y = 0.04;
      cropGroup.add(mound);

      for (let i = 0; i < 3; i++) {
        const shoot = new THREE.Mesh(ThreeAssetCache.leafBladeGeo, ThreeAssetCache.matBrightLime);
        const angle = (i * Math.PI * 2) / 3;
        shoot.position.set(Math.cos(angle) * 0.06, 0.12, Math.sin(angle) * 0.06);
        shoot.rotation.y = angle;
        shoot.rotation.z = 0.2;
        cropGroup.add(shoot);
      }
      return cropGroup;
    }

    if (type === 'WILD_FIBER') {
      // WILD_FIBER: Realistic Golden Wheat Field Tuft
      const mound = new THREE.Mesh(ThreeAssetCache.rootMoundGeo, ThreeAssetCache.matSoilTop);
      mound.position.y = 0.03;
      cropGroup.add(mound);

      const stalkCount = growthStage === 'YOUNG' ? 4 : 7;
      const offsets = [
        { x: 0, z: 0, rotZ: 0, scaleY: 1.0 },
        { x: 0.12, z: 0.08, rotZ: 0.08, scaleY: 0.9 },
        { x: -0.12, z: -0.06, rotZ: -0.1, scaleY: 0.95 },
        { x: 0.06, z: -0.12, rotZ: 0.05, scaleY: 0.85 },
        { x: -0.08, z: 0.12, rotZ: -0.07, scaleY: 0.92 },
        { x: 0.14, z: -0.08, rotZ: 0.12, scaleY: 0.88 },
        { x: -0.14, z: 0.06, rotZ: -0.12, scaleY: 0.94 },
      ];

      for (let i = 0; i < stalkCount; i++) {
        const off = offsets[i];
        const stalk = new THREE.Group();

        // Slender stem
        const stem = new THREE.Mesh(ThreeAssetCache.stalkStemGeo, growthStage === 'MATURE' ? ThreeAssetCache.matStem : ThreeAssetCache.matBrightLime);
        stem.position.y = 0.22 * off.scaleY * scale;
        stalk.add(stem);

        // Lower foliage leaf blades
        const leaf1 = new THREE.Mesh(ThreeAssetCache.leafBladeGeo, ThreeAssetCache.matFoliage);
        leaf1.position.set(0.04, 0.12 * scale, 0);
        leaf1.rotation.z = -0.4;
        stalk.add(leaf1);

        if (growthStage === 'MATURE') {
          // Detailed textured golden wheat head
          const head = new THREE.Mesh(ThreeAssetCache.wheatHeadGeo, ThreeAssetCache.matWheatHead);
          head.position.y = 0.42 * off.scaleY * scale;

          // Whisker awns at top of wheat ear
          for (let a = 0; a < 2; a++) {
            const awn = new THREE.Mesh(ThreeAssetCache.wheatAwnGeo, ThreeAssetCache.matWheatHead);
            awn.position.set(a === 0 ? 0.04 : -0.04, 0.54 * off.scaleY * scale, 0);
            awn.rotation.z = a === 0 ? -0.3 : 0.3;
            stalk.add(awn);
          }
          stalk.add(head);
        } else {
          // Green developing head
          const head = new THREE.Mesh(ThreeAssetCache.wheatHeadGeo, ThreeAssetCache.matBrightLime);
          head.position.y = 0.38 * off.scaleY * scale;
          stalk.add(head);
        }

        stalk.position.set(off.x, 0, off.z);
        stalk.rotation.z = off.rotZ;
        cropGroup.add(stalk);
      }
    } else if (type === 'WOODY_BUSH') {
      // WOODY_BUSH: Organic Multi-Tiered Berry Bush
      const trunk = new THREE.Mesh(ThreeAssetCache.bushTrunkGeo, ThreeAssetCache.matBark);
      trunk.position.y = 0.12;
      cropGroup.add(trunk);

      // Deep forest base foliage
      const leafBase = new THREE.Mesh(ThreeAssetCache.bushLeafBaseGeo, ThreeAssetCache.matDeepForest);
      leafBase.position.y = 0.25 * scale;
      leafBase.scale.set(scale, scale, scale);

      // Middle emerald canopy
      const leafMid = new THREE.Mesh(ThreeAssetCache.bushLeafBaseGeo, ThreeAssetCache.matFoliage);
      leafMid.position.set(0.04, 0.35 * scale, -0.03);
      leafMid.scale.set(scale * 0.9, scale * 0.9, scale * 0.9);

      // Bright lime sunlit top canopy
      const leafTop = new THREE.Mesh(ThreeAssetCache.bushLeafTopGeo, ThreeAssetCache.matBrightLime);
      leafTop.position.set(-0.02, 0.52 * scale, 0.02);
      leafTop.scale.set(scale * 0.85, scale * 0.85, scale * 0.85);

      cropGroup.add(leafBase, leafMid, leafTop);

      if (growthStage === 'MATURE') {
        // 8 Glossy 3D Ruby Red Berries nested around outer branches
        const berryPos = [
          { x: 0.22, y: 0.38, z: 0.2 },
          { x: -0.22, y: 0.42, z: -0.18 },
          { x: 0.18, y: 0.48, z: -0.22 },
          { x: -0.2, y: 0.34, z: 0.22 },
          { x: 0.26, y: 0.3, z: -0.05 },
          { x: -0.25, y: 0.46, z: 0.08 },
          { x: 0, y: 0.58, z: 0.18 },
          { x: 0.08, y: 0.55, z: -0.2 },
        ];
        berryPos.forEach((p) => {
          const berry = new THREE.Mesh(ThreeAssetCache.fruitBerryGeo, ThreeAssetCache.matBerry);
          berry.position.set(p.x * scale, p.y * scale, p.z * scale);
          cropGroup.add(berry);
        });
      }
    } else if (type === 'TREE') {
      // TREE: Magnificent Orchard Apple Tree
      // Heavy timber trunk with flared root feet
      const trunk = new THREE.Mesh(ThreeAssetCache.treeTrunkGeo, ThreeAssetCache.matBark);
      trunk.position.y = 0.25;
      cropGroup.add(trunk);

      // Root flares at soil level
      for (let i = 0; i < 4; i++) {
        const root = new THREE.Mesh(ThreeAssetCache.bushTrunkGeo, ThreeAssetCache.matBark);
        const angle = (i * Math.PI) / 2;
        root.position.set(Math.cos(angle) * 0.12, 0.06, Math.sin(angle) * 0.12);
        root.rotation.y = angle;
        root.rotation.z = 0.3;
        cropGroup.add(root);
      }

      // 3 Organic foliage cloud tiers
      const t1 = new THREE.Mesh(ThreeAssetCache.treeLeafTier1Geo, ThreeAssetCache.matDeepForest);
      t1.position.y = 0.48 * scale;
      t1.scale.set(scale, scale, scale);

      const t2 = new THREE.Mesh(ThreeAssetCache.treeLeafTier2Geo, ThreeAssetCache.matFoliage);
      t2.position.set(0.03, 0.72 * scale, -0.03);
      t2.scale.set(scale, scale, scale);

      const t3 = new THREE.Mesh(ThreeAssetCache.treeLeafTier3Geo, ThreeAssetCache.matBrightLime);
      t3.position.set(-0.02, 0.95 * scale, 0.02);
      t3.scale.set(scale, scale, scale);

      cropGroup.add(t1, t2, t3);

      if (growthStage === 'MATURE') {
        // 6 Shiny Red Apples hanging under foliage canopy
        const applePos = [
          { x: 0.28, y: 0.42, z: 0.22 },
          { x: -0.28, y: 0.45, z: -0.2 },
          { x: 0.22, y: 0.4, z: -0.28 },
          { x: -0.25, y: 0.38, z: 0.25 },
          { x: 0.32, y: 0.52, z: -0.05 },
          { x: -0.05, y: 0.36, z: 0.32 },
        ];
        applePos.forEach((p) => {
          const appleGroup = new THREE.Group();
          const apple = new THREE.Mesh(ThreeAssetCache.fruitAppleGeo, ThreeAssetCache.matAppleRed);
          const calyx = new THREE.Mesh(ThreeAssetCache.fruitCalyxGeo, ThreeAssetCache.matFoliage);
          calyx.position.y = 0.08;
          appleGroup.add(apple, calyx);
          appleGroup.position.set(p.x * scale, p.y * scale, p.z * scale);
          cropGroup.add(appleGroup);
        });
      }
    } else if (type === 'CULTIVATED_ROOT') {
      // CULTIVATED_ROOT: Real Root Crop (Carrot/Beetroot Cluster with Dirt Mound)
      const mound = new THREE.Mesh(ThreeAssetCache.rootMoundGeo, ThreeAssetCache.matSoilTop);
      mound.position.y = 0.04;
      cropGroup.add(mound);

      // 3 Root Crops Pushing Up Out of Ground
      const roots = [
        { x: 0, z: 0, scale: 1.0, isBeet: false },
        { x: 0.14, z: 0.08, scale: 0.75, isBeet: true },
        { x: -0.12, z: -0.1, scale: 0.8, isBeet: false },
      ];

      roots.forEach((r) => {
        const rootGroup = new THREE.Group();

        // Tapered root body
        const rootMat = r.isBeet ? ThreeAssetCache.matBeetroot : ThreeAssetCache.matRootCrop;
        const rootGeo = r.isBeet ? ThreeAssetCache.beetRootGeo : ThreeAssetCache.rootCropGeo;

        const body = new THREE.Mesh(rootGeo, rootMat);
        body.rotation.x = Math.PI;
        body.position.y = 0.14 * r.scale * scale;
        rootGroup.add(body);

        // Feathery Leaf Tops
        const canopyCount = 4;
        for (let i = 0; i < canopyCount; i++) {
          const leaf = new THREE.Mesh(ThreeAssetCache.leafBladeGeo, ThreeAssetCache.matBrightLime);
          const angle = (i * Math.PI * 2) / canopyCount;
          leaf.position.set(Math.cos(angle) * 0.06 * r.scale, (0.28 + Math.sin(i) * 0.04) * r.scale * scale, Math.sin(angle) * 0.06 * r.scale);
          leaf.rotation.y = angle;
          leaf.rotation.z = 0.35;
          rootGroup.add(leaf);
        }

        rootGroup.position.set(r.x, 0, r.z);
        cropGroup.add(rootGroup);
      });
    } else if (type === 'FRUIT_COLONY') {
      // FRUIT_COLONY: Trellised Tomato / Vine Crop
      // Wooden Trellis Frame
      const post1 = new THREE.Mesh(ThreeAssetCache.woodPostGeo, ThreeAssetCache.matWoodTrellis);
      post1.position.set(-0.2, 0.3 * scale, 0);
      const post2 = new THREE.Mesh(ThreeAssetCache.woodPostGeo, ThreeAssetCache.matWoodTrellis);
      post2.position.set(0.2, 0.3 * scale, 0);

      const bar1 = new THREE.Mesh(ThreeAssetCache.woodBarGeo, ThreeAssetCache.matWoodTrellis);
      bar1.position.set(0, 0.25 * scale, 0);
      const bar2 = new THREE.Mesh(ThreeAssetCache.woodBarGeo, ThreeAssetCache.matWoodTrellis);
      bar2.position.set(0, 0.48 * scale, 0);

      cropGroup.add(post1, post2, bar1, bar2);

      // Climbing Vine Foliage
      const bush = new THREE.Mesh(ThreeAssetCache.fruitBushGeo, ThreeAssetCache.matFoliage);
      bush.position.y = 0.3 * scale;
      bush.scale.set(scale * 0.9, scale * 0.9, scale * 0.9);
      cropGroup.add(bush);

      // Yellow Flower Blossoms
      for (let i = 0; i < 3; i++) {
        const blossom = new THREE.Mesh(ThreeAssetCache.fruitCalyxGeo, ThreeAssetCache.matBlossomYellow);
        blossom.position.set((i - 1) * 0.18 * scale, 0.45 * scale, 0.2 * scale);
        cropGroup.add(blossom);
      }

      if (growthStage === 'MATURE') {
        // 6 Shiny Red Tomatoes with Leaf Caps
        const tomatoPos = [
          { x: -0.22, y: 0.22, z: 0.18 },
          { x: 0.22, y: 0.28, z: 0.18 },
          { x: 0, y: 0.38, z: -0.18 },
          { x: -0.18, y: 0.44, z: 0.16 },
          { x: 0.18, y: 0.48, z: -0.15 },
          { x: 0, y: 0.18, z: 0.22 },
        ];
        tomatoPos.forEach((p) => {
          const tomGroup = new THREE.Group();
          const tom = new THREE.Mesh(ThreeAssetCache.fruitTomatoGeo, ThreeAssetCache.matTomatoRed);
          const calyx = new THREE.Mesh(ThreeAssetCache.fruitCalyxGeo, ThreeAssetCache.matBrightLime);
          calyx.position.y = 0.08;
          tomGroup.add(tom, calyx);
          tomGroup.position.set(p.x * scale, p.y * scale, p.z * scale);
          cropGroup.add(tomGroup);
        });
      }
    } else if (type === 'ENERGY_FLOWER') {
      // ENERGY_FLOWER: Giant Cyber Sunflower / Solar Blossom
      const stem = new THREE.Mesh(ThreeAssetCache.energyStemGeo, ThreeAssetCache.matStem);
      stem.position.y = 0.22 * scale;
      stem.scale.set(scale, scale, scale);
      cropGroup.add(stem);

      // Broad lower leaves
      for (let i = 0; i < 2; i++) {
        const leaf = new THREE.Mesh(ThreeAssetCache.leafBladeGeo, ThreeAssetCache.matFoliage);
        leaf.position.set(i === 0 ? 0.12 : -0.12, 0.18 * scale, 0);
        leaf.rotation.z = i === 0 ? -0.5 : 0.5;
        cropGroup.add(leaf);
      }

      // Sunflower Center Disc
      const disc = new THREE.Mesh(ThreeAssetCache.sunflowerDiscGeo, ThreeAssetCache.matSunflowerDisc);
      disc.position.y = 0.48 * scale;
      disc.rotation.x = Math.PI / 4;
      cropGroup.add(disc);

      // 12 Golden Petals around Disc
      for (let i = 0; i < 12; i++) {
        const petal = new THREE.Mesh(ThreeAssetCache.sunflowerPetalGeo, ThreeAssetCache.matWheatHead);
        const angle = (i * Math.PI * 2) / 12;
        petal.position.set(
          Math.cos(angle) * 0.22 * scale,
          0.48 * scale + Math.sin(angle) * 0.1 * scale,
          Math.sin(angle) * 0.22 * scale
        );
        petal.rotation.y = angle;
        petal.rotation.x = Math.PI / 4;
        cropGroup.add(petal);
      }

      // 4 Floating Luminescent Spore Particles
      for (let i = 0; i < 4; i++) {
        const spore = new THREE.Mesh(ThreeAssetCache.sporeBallGeo, ThreeAssetCache.matEnergyCore);
        const angle = (i * Math.PI) / 2;
        spore.position.set(Math.cos(angle) * 0.3 * scale, 0.62 * scale, Math.sin(angle) * 0.3 * scale);
        spore.userData = { animType: 'float', baseY: 0.62 * scale };
        cropGroup.add(spore);
      }
    } else if (type === 'GRADED_PLANT') {
      // GRADED_PLANT: Alien DNA Double-Helix Crop
      const stem = new THREE.Mesh(ThreeAssetCache.energyStemGeo, ThreeAssetCache.matBark);
      stem.position.y = 0.25 * scale;
      stem.scale.set(scale, scale, scale);
      cropGroup.add(stem);

      const helixBlocks = 6;
      for (let i = 0; i < helixBlocks; i++) {
        const angle1 = (i * Math.PI) / 3;
        const angle2 = angle1 + Math.PI;

        const block1 = new THREE.Mesh(ThreeAssetCache.gradedHelixGeo, ThreeAssetCache.matGradedHelix);
        block1.position.set(Math.cos(angle1) * 0.16 * scale, (0.12 + i * 0.08) * scale, Math.sin(angle1) * 0.16 * scale);
        block1.rotation.y = angle1;

        const block2 = new THREE.Mesh(ThreeAssetCache.gradedHelixGeo, ThreeAssetCache.matGradedHelix);
        block2.position.set(Math.cos(angle2) * 0.16 * scale, (0.12 + i * 0.08) * scale, Math.sin(angle2) * 0.16 * scale);
        block2.rotation.y = angle2;

        cropGroup.add(block1, block2);
      }

      // Top Floating Spore Orb
      const orb = new THREE.Mesh(ThreeAssetCache.sporeBallGeo, ThreeAssetCache.matSporeTeal);
      orb.position.y = 0.65 * scale;
      orb.scale.set(1.8, 1.8, 1.8);
      orb.userData = { animType: 'float', baseY: 0.65 * scale };
      cropGroup.add(orb);
    } else {
      const defaultCrop = new THREE.Mesh(ThreeAssetCache.bushLeafBaseGeo, ThreeAssetCache.matFoliage);
      defaultCrop.position.y = 0.2 * scale;
      defaultCrop.scale.set(scale, scale, scale);
      cropGroup.add(defaultCrop);
    }

    return cropGroup;
  };

  // Helper Alien Agent Sci-Fi Flying Saucer (UFO) Mesh Creator
  const createAgentShipMesh = (colorHex: string): THREE.Group => {
    const shipGroup = new THREE.Group();

    const hullMat = ThreeAssetCache.getAgentHullMat(colorHex);

    // 1. Main Metallic Flying Saucer Disc Body
    const body = new THREE.Mesh(ThreeAssetCache.agentBodyGeo, hullMat);
    body.position.y = 0.2;
    shipGroup.add(body);

    // 2. Lower Saucer Bottom Cone/Dish
    const bottomDish = new THREE.Mesh(ThreeAssetCache.agentBottomSaucerGeo, hullMat);
    bottomDish.position.y = 0.1;
    shipGroup.add(bottomDish);

    // 3. Glowing Glass Cockpit / Sensor Dome
    const dome = new THREE.Mesh(ThreeAssetCache.agentTopDomeGeo, ThreeAssetCache.matAgentDome);
    dome.position.set(0, 0.26, 0);
    shipGroup.add(dome);

    // 4. Levitating Outer Ring around Saucer Edge
    const ring = new THREE.Mesh(ThreeAssetCache.agentRingGeo, ThreeAssetCache.matAgentDome);
    ring.name = 'energyRing';
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.2;
    shipGroup.add(ring);

    // 5. Anti-Gravity Laser Beam underneath
    const beam = new THREE.Mesh(ThreeAssetCache.agentBeamGeo, ThreeAssetCache.matAgentBeam);
    beam.position.set(0, -0.1, 0);
    shipGroup.add(beam);

    return shipGroup;
  };

  // Click on Canvas to Inspect Tile via 3D Raycasting
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const mouse = new THREE.Vector2(
      (x / rect.width) * 2 - 1,
      -(y / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

    for (const hit of intersects) {
      let curr: THREE.Object3D | null = hit.object;
      while (curr) {
        if (curr.userData && typeof curr.userData.tileX === 'number' && typeof curr.userData.tileY === 'number') {
          setFollowAgent(false);
          setInspectedCoords({ x: curr.userData.tileX, y: curr.userData.tileY });
          return;
        }
        curr = curr.parent;
      }
    }
  };

  const inspectedTile = activeCoords 
    ? engine.getTile(activeCoords.x, activeCoords.y) 
    : null;

  return (
    <div className="flex-1 min-w-[280px] bg-[#08090a] flex flex-col h-full relative overflow-hidden font-sans select-none">
      {/* Canvas Header Bar */}
      <div className="h-9 bg-[#08090a] border-b border-[#23252a] flex items-center justify-between px-3 text-xs text-slate-300 font-mono z-10 gap-2 shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-semibold text-white">Visualizador 3D</span>
          <span className="text-[10px] bg-[#161718] border border-[#23252a] px-2 py-0.5 rounded text-slate-400 font-mono">
            {engine.getGridWidth()}x{engine.getGridHeight()}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-[10px] text-slate-400">
          <span className="hidden sm:inline font-mono">Setas (▲ ▼ ◄ ►) ou Scroll para Zoom</span>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div 
        ref={containerRef} 
        onClick={handleCanvasClick}
        className="flex-1 w-full h-full cursor-crosshair relative" 
      />

      {/* ALWAYS-VISIBLE FLOATING 3D VIEWPORT CONTROLS DOCK */}
      <div className="absolute top-12 right-3 z-30 flex flex-col items-end gap-2 font-mono text-xs select-none pointer-events-auto">
        <div className="bg-[#0f1011]/90 backdrop-blur-md border border-[#383b3f] rounded-lg p-1.5 flex flex-col gap-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.95)] min-w-[175px]">
          {/* Zoom Control Group */}
          <div className="flex items-center justify-between gap-1 bg-[#161718] border border-[#23252a] rounded p-1">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(parseFloat((prev - 0.15).toFixed(2)), 0.4))}
              className="p-1 hover:bg-[#23252a] text-slate-300 hover:text-white rounded transition-colors active:scale-95 cursor-pointer"
              title="Afastar Zoom (Scroll Down / -)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1.0)}
              className="px-2 py-0.5 text-[11px] font-bold text-cyan-300 hover:text-white hover:bg-[#23252a] rounded transition-colors cursor-pointer"
              title="Ajustar Zoom para 100%"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(parseFloat((prev + 0.15).toFixed(2)), 2.5))}
              className="p-1 hover:bg-[#23252a] text-slate-300 hover:text-white rounded transition-colors active:scale-95 cursor-pointer"
              title="Aproximar Zoom (Scroll Up / +)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Camera POV & Agent Tracking Group */}
          <div className="flex items-center gap-1">
            <button
              onClick={resetPOV}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-[#161718] hover:bg-[#23252a] border border-[#23252a] text-slate-200 hover:text-white rounded text-[10px] transition-colors active:scale-95 cursor-pointer"
              title="Resetar Posição da Câmera & Centralizar Agente (100%)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Resetar</span>
            </button>

            <button
              onClick={() => {
                const nextState = !followAgent;
                setFollowAgent(nextState);
                if (nextState && primaryAgent) {
                  setInspectedCoords({ x: primaryAgent.x, y: primaryAgent.y });
                }
              }}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-[10px] border transition-all active:scale-95 cursor-pointer ${
                followAgent
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                  : 'bg-[#161718] text-slate-400 border-[#23252a] hover:text-slate-200'
              }`}
              title={followAgent ? "Seguir Agente: ATIVADO (Clique para desativar)" : "Seguir Agente: DESATIVADO (Clique para ativar)"}
            >
              {followAgent ? <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              <span>Seguir {followAgent ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Render Mode & Plot Action Group */}
          <div className="flex items-center gap-1 border-t border-[#23252a] pt-1.5">
            <button
              onClick={() => setPixelMode(!pixelMode)}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] border transition-all cursor-pointer ${
                pixelMode
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 font-semibold'
                  : 'bg-[#161718] text-slate-400 border-[#23252a] hover:text-slate-200'
              }`}
              title={pixelMode ? "Modo 3D Pixel Art (2px) Ativado" : "Modo 3D Nativo Suave Ativado"}
            >
              <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>{pixelMode ? 'Pixel 3D' : '3D Smooth'}</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Limpar plantas e solos do terreno atual?\n\n(Pesquisas, tamanho do mundo e recursos em inventário serão MANTIDOS)')) {
                  engine.clearWorld();
                }
              }}
              className="flex items-center justify-center gap-1 px-2 py-1 bg-[#161718] hover:bg-[#23252a] border border-[#23252a] text-slate-400 hover:text-rose-400 rounded text-[10px] transition-colors cursor-pointer"
              title="Limpar plantas do lote atual"
            >
              <Trash2 className="w-3 h-3 shrink-0" />
              <span>Limpar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Instruction Badge */}
      <div className="absolute bottom-4 left-3 z-20 font-mono text-[10px] select-none">
        <div className="bg-[#0f1011]/85 backdrop-blur-md border border-[#23252a] px-2.5 py-1 rounded-md text-slate-300 shadow-md flex items-center gap-1.5">
          <span className="text-cyan-400 font-bold">Navegação:</span>
          <span>Setas (▲ ▼ ◄ ►)</span>
        </div>
      </div>

      {/* Floating Performance HUD (In-Canvas Overlay) */}
      <div className="absolute top-12 left-3 z-20 font-mono text-xs select-none">
        {showHud ? (
          <div className="bg-[#0f1011] border border-[#383b3f] rounded-lg p-3 text-slate-200 min-w-[175px] transition-all shadow-[0_12px_36px_rgba(0,0,0,0.95),0_0_1px_rgba(255,255,255,0.15)]">
            <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-[#383b3f]">
              <span className="flex items-center gap-1.5 font-bold text-emerald-400 text-[11px]">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Métricas
              </span>
              <button
                onClick={() => setShowHud(false)}
                className="p-1 hover:bg-[#161718] text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                title="Esconder métricas"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> Pass:
                </span>
                <span className="text-indigo-300 font-bold">
                  {pixelMode ? `Pixel 3D (${pixelSize}px)` : 'Native 3D'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-emerald-400" /> RAM:
                </span>
                <span className="text-emerald-300 font-bold">{ramMb} MB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-cyan-400" /> FPS:
                </span>
                <span className="text-cyan-300 font-bold">{fps} FPS</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-amber-400" /> Calls:
                </span>
                <span className="text-amber-300 font-semibold">{drawCalls}</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowHud(true)}
            className="flex items-center gap-2 bg-[#0f1011] hover:bg-[#161718] border border-[#383b3f] px-3 py-1.5 rounded-md text-[10px] text-slate-200 shadow-[0_8px_24px_rgba(0,0,0,0.95)] hover:text-white transition-all cursor-pointer"
            title="Mostrar Métricas"
          >
            <span className="text-emerald-400 font-bold">{ramMb} MB</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400 font-bold">{fps} FPS</span>
            <Eye className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>
        )}
      </div>

      {/* Tile Inspector Overlay Panel */}
      {inspectedTile && (
        <div className="absolute bottom-4 right-3 bg-[#0f1011]/95 backdrop-blur-md border border-[#383b3f] rounded-lg p-3 text-xs font-mono text-slate-200 shadow-[0_12px_36px_rgba(0,0,0,0.95)] w-68 z-20">
          <div className="flex items-center justify-between border-b border-[#383b3f] pb-2 mb-2 font-bold text-emerald-400">
            <span className="flex items-center gap-1.5 truncate text-xs">
              <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Bloco ({inspectedTile.x}, {inspectedTile.y})
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => {
                  setInspectedCoords(null);
                }}
                className="text-slate-400 hover:text-white text-sm font-bold px-1 py-0.5 leading-none hover:bg-[#161718] rounded cursor-pointer transition-colors"
                title="Fechar Inspecção de Bloco"
              >
                ×
              </button>
            </div>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Solo:</span>
              <span className={`font-semibold ${inspectedTile.ground === 'SOAKED' ? 'text-blue-400 font-bold' : 'text-amber-300'}`}>
                {inspectedTile.ground}{engine.prestige.level >= 50 ? ` [${inspectedTile.soilQuality ?? 0}]` : ''}
              </span>
            </div>
            {engine.prestige.level >= 50 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Qualidade do Solo:</span>
                <span className={`font-semibold ${(inspectedTile.soilQuality ?? 0) === 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                  {inspectedTile.soilQuality ?? 0}%
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Cultura:</span>
              <span className={`font-semibold ${
                inspectedTile.crop === 'WILD_FIBER' ? 'text-[#e4f222]' :
                inspectedTile.crop === 'CULTIVATED_ROOT' ? 'text-[#f97316]' :
                inspectedTile.crop === 'WOODY_BUSH' ? 'text-[#27a644]' :
                inspectedTile.crop === 'TREE' ? 'text-[#a16207]' :
                inspectedTile.crop === 'FRUIT_COLONY' ? 'text-[#eb5757]' :
                inspectedTile.crop === 'ENERGY_FLOWER' ? 'text-[#02b8cc]' :
                inspectedTile.crop === 'GRADED_PLANT' ? 'text-[#a855f7]' :
                'text-slate-300'
              }`}>{inspectedTile.crop}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Crescimento:</span>
              <span className="font-semibold text-cyan-300">{(Number(inspectedTile.growth) || 0).toFixed(3)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Umidade:</span>
              <span className={`font-semibold ${inspectedTile.moisture > 1.0 ? 'text-blue-400 font-bold animate-pulse' : 'text-blue-400'}`}>
                {((Number(inspectedTile.moisture) || 0) * 100).toFixed(3)}%
              </span>
            </div>
            {(inspectedTile.crop === 'ENERGY_FLOWER' || engine.isTechUnlocked('AGRO_6')) && inspectedTile.energyValue !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">Valor de Energia:</span>
                <span className="font-semibold text-purple-400">{inspectedTile.energyValue}</span>
              </div>
            )}
            {(inspectedTile.crop === 'GRADED_PLANT' || engine.isTechUnlocked('AGRO_7')) && inspectedTile.grade !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">Nota:</span>
                <span className="font-semibold text-rose-400">Nível {inspectedTile.grade}</span>
              </div>
            )}
            {engine.getPrestige().level >= 25 && (() => {
              const comboIdx = engine.getComboIndex(inspectedTile.x, inspectedTile.y);
              return (
                <div className="flex justify-between border-t border-[#23252a] pt-1 mt-1">
                  <span className="text-indigo-400 font-bold">Índice de Combo:</span>
                  <span className={`font-bold ${comboIdx !== false ? 'text-amber-300 animate-pulse' : 'text-slate-500'}`}>
                    {comboIdx !== false ? `#${comboIdx}` : 'Nenhum'}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
