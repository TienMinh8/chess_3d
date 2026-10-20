import * as THREE from 'three';

/**
 * CutePiecesBuilder: Recreates the exact "Cute Chess: Small pieces, Big adventures"
 * design aesthetic shown in the concept art:
 * - White Team: Warm porcelain ivory with Royal Blue capes/scarves and Gold accents
 * - Black Team: Soft charcoal matte with Crimson Red capes/scarves and Gold accents
 *
 * Pieces:
 * - Pawn:   Cute Little Bunny with tall upright ears and tied neckerchief
 * - Rook:   Lovable Castle Tower friend with battlements and hanging fabric banner
 * - Knight: Sweet Little Pony with curved muzzle, styled mane, and chest harness
 * - Bishop: Wise Creature Scholar with tall pointed bishop miter, gold cross & crosier
 * - Queen:  Adorable Cat Queen with 4-point tiara, ruby gem, regal cape & scepter
 * - King:   Chubby Cat King with 5-point royal crown, royal mantle & cross scepter
 */
export class CutePiecesBuilder {
  constructor(goldTrimMat, steelMat) {
    this.goldMat = goldTrimMat || new THREE.MeshStandardMaterial({
      color: 0xf2ba36,
      roughness: 0.22,
      metalness: 0.78
    });

    this.steelMat = steelMat || new THREE.MeshStandardMaterial({
      color: 0xa8b2c4,
      roughness: 0.25,
      metalness: 0.85
    });

    // 1. Base porcelain colors
    this.whitePorcelainMat = new THREE.MeshStandardMaterial({
      color: 0xfbf8f2,
      roughness: 0.32,
      metalness: 0.04
    });

    this.blackPorcelainMat = new THREE.MeshStandardMaterial({
      color: 0x242225,
      roughness: 0.35,
      metalness: 0.08
    });

    // 2. Team fabric colors (from reference art)
    this.royalBlueMat = new THREE.MeshStandardMaterial({
      color: 0x2d5ec7,
      roughness: 0.38,
      metalness: 0.08
    });

    this.royalBlueDarkMat = new THREE.MeshStandardMaterial({
      color: 0x1f4699,
      roughness: 0.45
    });

    this.crimsonRedMat = new THREE.MeshStandardMaterial({
      color: 0xb82834,
      roughness: 0.38,
      metalness: 0.08
    });

    this.crimsonRedDarkMat = new THREE.MeshStandardMaterial({
      color: 0x871b24,
      roughness: 0.45
    });

    // 3. Mane & Accents
    this.whitePonyManeMat = new THREE.MeshStandardMaterial({
      color: 0x769ae6, // Soft periwinkle blue as in reference image
      roughness: 0.36
    });

    this.blackPonyManeMat = new THREE.MeshStandardMaterial({
      color: 0x181619,
      roughness: 0.35
    });

    // 4. Ears & Facial features
    this.pinkInnerEarMat = new THREE.MeshStandardMaterial({
      color: 0xff9ba7,
      roughness: 0.55
    });

    this.darkPinkInnerEarMat = new THREE.MeshStandardMaterial({
      color: 0xbe4a5c,
      roughness: 0.55
    });

    this.eyeMat = new THREE.MeshStandardMaterial({
      color: 0x111013,
      roughness: 0.06,
      metalness: 0.25
    });

    this.glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    this.blushMat = new THREE.MeshBasicMaterial({
      color: 0xff6b84,
      transparent: true,
      opacity: 0.52
    });

    this.rubyMat = new THREE.MeshStandardMaterial({
      color: 0xec1c38,
      emissive: 0x9e081e,
      emissiveIntensity: 0.55,
      roughness: 0.12,
      metalness: 0.2
    });

    this.woodTrimMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e1d,
      roughness: 0.7
    });
  }

  // Common round toy pedestal base disc (as in reference turnaround view)
  createPedestal(radius = 0.33, height = 0.055, color = 'w') {
    const group = new THREE.Group();
    const isWhite = color === 'w';
    const baseMat = isWhite ? this.whitePorcelainMat : this.blackPorcelainMat;

    // Chamfered disc
    const baseGeo = new THREE.CylinderGeometry(radius * 0.94, radius, height, 28);
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = height * 0.5;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    // Subtle gold trim ring around top rim
    const ringGeo = new THREE.TorusGeometry(radius * 0.91, 0.012, 10, 28);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, this.goldMat);
    ring.position.y = height;
    group.add(ring);

    return group;
  }

  // Universal Kawaii Facial Features (2 sparkling eyes + 2 blush cheeks + cute mouth)
  addCuteFace(root, headCenter, headRadius, isCat = false) {
    const eyeRadius = 0.038 * (headRadius / 0.24);
    const eyeGeo = new THREE.SphereGeometry(eyeRadius, 16, 16);
    eyeGeo.scale(0.85, 1.15, 0.4);

    const glintGeo1 = new THREE.SphereGeometry(eyeRadius * 0.38, 8, 8);
    const glintGeo2 = new THREE.SphereGeometry(eyeRadius * 0.20, 6, 6);
    const blushGeo = new THREE.CircleGeometry(eyeRadius * 1.05, 16);

    const eyeZ = headCenter.z + headRadius * 0.91;
    const eyeSpacing = headRadius * 0.36;
    const eyeY = headCenter.y + 0.01;

    for (const sign of [-1, 1]) {
      // 1. Glossy button eye
      const eye = new THREE.Mesh(eyeGeo, this.eyeMat);
      eye.position.set(headCenter.x + sign * eyeSpacing, eyeY, eyeZ);
      root.add(eye);

      // 2. Primary glint (top right)
      const glint1 = new THREE.Mesh(glintGeo1, this.glintMat);
      glint1.position.set(
        headCenter.x + sign * eyeSpacing + eyeRadius * 0.28,
        eyeY + eyeRadius * 0.32,
        eyeZ + 0.015
      );
      root.add(glint1);

      // 3. Secondary glint (bottom left)
      const glint2 = new THREE.Mesh(glintGeo2, this.glintMat);
      glint2.position.set(
        headCenter.x + sign * eyeSpacing - eyeRadius * 0.22,
        eyeY - eyeRadius * 0.28,
        eyeZ + 0.014
      );
      root.add(glint2);

      // 4. Soft pink blush cheek
      const blush = new THREE.Mesh(blushGeo, this.blushMat);
      blush.position.set(
        headCenter.x + sign * (eyeSpacing + eyeRadius * 1.3),
        eyeY - eyeRadius * 1.1,
        eyeZ - 0.01
      );
      blush.rotation.y = sign * 0.32;
      root.add(blush);
    }

    // Tiny cute nose dot
    const noseGeo = new THREE.SphereGeometry(eyeRadius * 0.32, 10, 10);
    noseGeo.scale(1.2, 0.85, 0.6);
    const nose = new THREE.Mesh(noseGeo, this.eyeMat);
    nose.position.set(headCenter.x, eyeY - eyeRadius * 0.6, headCenter.z + headRadius * 0.94);
    root.add(nose);

    // Mouth: cute cat mouth :3 or happy smile
    const mouthGeo = new THREE.TorusGeometry(eyeRadius * 0.45, 0.006, 8, 16, Math.PI * 0.85);
    mouthGeo.rotateZ(Math.PI * 0.08);
    const mouthMat = this.eyeMat;

    if (isCat) {
      // Left curl
      const mouthL = new THREE.Mesh(mouthGeo, mouthMat);
      mouthL.position.set(headCenter.x - eyeRadius * 0.35, eyeY - eyeRadius * 1.25, eyeZ + 0.005);
      mouthL.rotation.y = 0.25;
      root.add(mouthL);

      // Right curl
      const mouthR = new THREE.Mesh(mouthGeo, mouthMat);
      mouthR.position.set(headCenter.x + eyeRadius * 0.35, eyeY - eyeRadius * 1.25, eyeZ + 0.005);
      mouthR.rotation.y = -0.25;
      mouthR.rotation.z = Math.PI;
      mouthR.rotation.x = Math.PI;
      root.add(mouthR);
    } else {
      // Single warm gentle smile
      const smileGeo = new THREE.TorusGeometry(eyeRadius * 0.55, 0.006, 8, 16, Math.PI * 0.9);
      smileGeo.rotateX(Math.PI);
      const smile = new THREE.Mesh(smileGeo, mouthMat);
      smile.position.set(headCenter.x, eyeY - eyeRadius * 1.15, eyeZ + 0.005);
      root.add(smile);
    }
  }

  // Fabric Scarf/Bow tied in front (for Pawn and Bishop)
  createTiedScarf(radius, yPos, fabricMat) {
    const group = new THREE.Group();
    group.position.y = yPos;

    // Collar ring around neck
    const collarGeo = new THREE.TorusGeometry(radius, 0.038, 12, 28);
    collarGeo.rotateX(Math.PI / 2);
    const collar = new THREE.Mesh(collarGeo, fabricMat);
    collar.castShadow = true;
    group.add(collar);

    // Front center knot
    const knotGeo = new THREE.SphereGeometry(0.048, 14, 14);
    knotGeo.scale(1.1, 0.85, 1.2);
    const knot = new THREE.Mesh(knotGeo, fabricMat);
    knot.position.set(0, -0.015, radius + 0.02);
    knot.castShadow = true;
    group.add(knot);

    // Two hanging scarf ribbons
    const ribbonGeo = new THREE.CylinderGeometry(0.028, 0.045, 0.14, 12);
    ribbonGeo.scale(1.2, 1, 0.45);

    const ribbonL = new THREE.Mesh(ribbonGeo, fabricMat);
    ribbonL.position.set(-0.035, -0.075, radius + 0.025);
    ribbonL.rotation.z = 0.28;
    ribbonL.rotation.x = 0.15;
    ribbonL.castShadow = true;
    group.add(ribbonL);

    const ribbonR = new THREE.Mesh(ribbonGeo, fabricMat);
    ribbonR.position.set(0.035, -0.075, radius + 0.025);
    ribbonR.rotation.z = -0.28;
    ribbonR.rotation.x = 0.15;
    ribbonR.castShadow = true;
    group.add(ribbonR);

    return group;
  }

  // ================= 1. PAWN (Chú Thỏ Trắng / Đen - The Cute Bunny) =================
  buildPawn(color) {
    const isWhite = color === 'w';
    const bodyMat = isWhite ? this.whitePorcelainMat : this.blackPorcelainMat;
    const fabricMat = isWhite ? this.royalBlueMat : this.crimsonRedMat;
    const innerEarMat = isWhite ? this.pinkInnerEarMat : this.darkPinkInnerEarMat;

    const root = new THREE.Group();
    root.add(this.createPedestal(0.31, 0.055, color));

    // Pear-shaped chubby bunny body
    const bodyGeo = new THREE.SphereGeometry(0.25, 24, 20);
    bodyGeo.scale(0.92, 1.05, 0.88);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.24;
    body.castShadow = true;
    body.receiveShadow = true;
    root.add(body);

    // Cute fluffy round bunny tail at the back!
    const tailGeo = new THREE.SphereGeometry(0.075, 14, 14);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.set(0, 0.15, -0.22);
    tail.castShadow = true;
    root.add(tail);

    // Front little paws resting on belly
    const pawGeo = new THREE.SphereGeometry(0.055, 12, 10);
    pawGeo.scale(0.8, 0.7, 1.2);
    for (const sign of [-1, 1]) {
      const paw = new THREE.Mesh(pawGeo, bodyMat);
      paw.position.set(sign * 0.08, 0.18, 0.20);
      paw.rotation.y = -sign * 0.2;
      paw.castShadow = true;
      root.add(paw);
    }

    // Tied Blue / Red Scarf
    root.add(this.createTiedScarf(0.18, 0.38, fabricMat));

    // Round Cute Bunny Head
    const headRadius = 0.23;
    const headY = 0.54;
    const headGeo = new THREE.SphereGeometry(headRadius, 24, 20);
    headGeo.scale(1.02, 0.96, 0.98);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = headY;
    head.castShadow = true;
    root.add(head);

    // Face features (bunny smile)
    this.addCuteFace(root, new THREE.Vector3(0, headY, 0), headRadius, false);

    // Two Upright Long Bunny Ears (with pink inner layer)
    const earHeight = 0.28;
    const earGeo = new THREE.CylinderGeometry(0.045, 0.07, earHeight, 16);
    earGeo.scale(1, 1, 0.55);

    const innerEarGeo = new THREE.CylinderGeometry(0.028, 0.045, earHeight * 0.75, 12);
    innerEarGeo.scale(1, 1, 0.35);

    for (const sign of [-1, 1]) {
      const earGroup = new THREE.Group();
      earGroup.position.set(sign * 0.09, headY + headRadius * 0.78, 0.02);
      earGroup.rotation.z = -sign * 0.12; // Slight outward flare
      earGroup.rotation.x = -0.05; // Slightly swept back

      const earMesh = new THREE.Mesh(earGeo, bodyMat);
      earMesh.position.y = earHeight * 0.5;
      earMesh.castShadow = true;
      earGroup.add(earMesh);

      // Pink inner ear
      const innerMesh = new THREE.Mesh(innerEarGeo, innerEarMat);
      innerMesh.position.set(0, earHeight * 0.45, 0.022);
      earGroup.add(innerMesh);

      root.add(earGroup);
    }

    return root;
  }

  // ================= 2. ROOK (Tháp Thành - The Castle Tower Friend) =================
  buildRook(color) {
    const isWhite = color === 'w';
    const stoneMat = isWhite ? this.whitePorcelainMat : this.blackPorcelainMat;
    const fabricMat = isWhite ? this.royalBlueMat : this.crimsonRedMat;

    const root = new THREE.Group();
    root.add(this.createPedestal(0.33, 0.055, color));

    // Tapered cylindrical castle tower
    const towerH = 0.58;
    const towerGeo = new THREE.CylinderGeometry(0.24, 0.28, towerH, 24);
    const tower = new THREE.Mesh(towerGeo, stoneMat);
    tower.position.y = towerH * 0.5 + 0.05;
    tower.castShadow = true;
    tower.receiveShadow = true;
    root.add(tower);

    // Decorative middle gold band
    const bandGeo = new THREE.TorusGeometry(0.255, 0.012, 10, 24);
    bandGeo.rotateX(Math.PI / 2);
    const band = new THREE.Mesh(bandGeo, this.goldMat);
    band.position.y = 0.36;
    root.add(band);

    // Parapet / Battlements top ring
    const topPlateH = 0.06;
    const topPlateGeo = new THREE.CylinderGeometry(0.29, 0.25, topPlateH, 24);
    const topPlate = new THREE.Mesh(topPlateGeo, stoneMat);
    topPlate.position.y = towerH + 0.05 + topPlateH * 0.5;
    topPlate.castShadow = true;
    root.add(topPlate);

    // 4 Crenellation Teeth (Merlons) around the perimeter
    const toothW = 0.09;
    const toothH = 0.09;
    const toothD = 0.06;
    const toothGeo = new THREE.BoxGeometry(toothW, toothH, toothD);

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const tooth = new THREE.Mesh(toothGeo, stoneMat);
      tooth.position.set(Math.cos(angle) * 0.23, topPlate.position.y + topPlateH * 0.5 + toothH * 0.5, Math.sin(angle) * 0.23);
      tooth.rotation.y = -angle;
      tooth.castShadow = true;
      root.add(tooth);
    }

    // Fabric Banner hanging down the front!
    // Shape: rectangle with swallowtail notch at bottom
    const bannerShape = new THREE.Shape();
    bannerShape.moveTo(-0.09, 0.28);
    bannerShape.lineTo(0.09, 0.28);
    bannerShape.lineTo(0.09, -0.10);
    bannerShape.lineTo(0, -0.04); // Swallowtail inverted notch
    bannerShape.lineTo(-0.09, -0.10);
    bannerShape.closePath();

    const bannerGeo = new THREE.ShapeGeometry(bannerShape);
    const banner = new THREE.Mesh(bannerGeo, fabricMat);
    banner.position.set(0, 0.40, 0.245);
    banner.castShadow = true;
    root.add(banner);

    // Gold hanging pin on the banner
    const pinGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.21, 10);
    pinGeo.rotateZ(Math.PI / 2);
    const pin = new THREE.Mesh(pinGeo, this.goldMat);
    pin.position.set(0, 0.68, 0.25);
    root.add(pin);

    // Friendly little kawaii face on the tower!
    // Eyes peeking out from the tower side/front
    const eyeRadius = 0.032;
    const eyeGeo = new THREE.SphereGeometry(eyeRadius, 14, 14);
    eyeGeo.scale(0.85, 1.15, 0.4);
    const glintGeo = new THREE.SphereGeometry(eyeRadius * 0.35, 8, 8);
    const blushGeo = new THREE.CircleGeometry(eyeRadius * 0.95, 14);

    for (const sign of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, this.eyeMat);
      eye.position.set(sign * 0.075, 0.50, 0.248);
      root.add(eye);

      const glint = new THREE.Mesh(glintGeo, this.glintMat);
      glint.position.set(sign * 0.075 + 0.01, 0.51, 0.258);
      root.add(glint);

      const blush = new THREE.Mesh(blushGeo, this.blushMat);
      blush.position.set(sign * 0.12, 0.465, 0.245);
      root.add(blush);
    }

    // Little triangular pennant flag on top
    const poleGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.22, 8);
    const pole = new THREE.Mesh(poleGeo, this.goldMat);
    pole.position.set(0, topPlate.position.y + 0.16, 0);
    root.add(pole);

    const flagShape = new THREE.Shape();
    flagShape.moveTo(0, 0.08);
    flagShape.lineTo(0.12, 0.03);
    flagShape.lineTo(0, -0.02);
    flagShape.closePath();
    const flagGeo = new THREE.ShapeGeometry(flagShape);
    const flag = new THREE.Mesh(flagGeo, fabricMat);
    flag.position.set(0, pole.position.y + 0.02, 0);
    flag.rotation.y = Math.PI * 0.15;
    root.add(flag);

    return root;
  }

  // ================= 3. KNIGHT (Ngựa Con - The Cute Pony) =================
  buildKnight(color) {
    const isWhite = color === 'w';
    const bodyMat = isWhite ? this.whitePorcelainMat : this.blackPorcelainMat;
    const maneMat = isWhite ? this.whitePonyManeMat : this.blackPonyManeMat;
    const harnessMat = isWhite ? this.royalBlueMat : this.crimsonRedMat;

    const root = new THREE.Group();
    root.add(this.createPedestal(0.32, 0.055, color));

    // Arched pony chest & neck
    const chestGeo = new THREE.SphereGeometry(0.24, 20, 18);
    chestGeo.scale(0.88, 1.05, 1.0);
    const chest = new THREE.Mesh(chestGeo, bodyMat);
    chest.position.set(0, 0.24, -0.02);
    chest.castShadow = true;
    root.add(chest);

    // Cute curved pony neck
    const neckGeo = new THREE.CylinderGeometry(0.16, 0.21, 0.28, 20);
    neckGeo.scale(0.9, 1, 1.15);
    const neck = new THREE.Mesh(neckGeo, bodyMat);
    neck.position.set(0, 0.40, 0.03);
    neck.rotation.x = -0.22; // Leans gracefully forward
    neck.castShadow = true;
    root.add(neck);

    // Cute horse muzzle & head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.58, 0.07);

    // Main cranium
    const craniumGeo = new THREE.SphereGeometry(0.18, 20, 18);
    craniumGeo.scale(0.95, 1.0, 1.1);
    const cranium = new THREE.Mesh(craniumGeo, bodyMat);
    cranium.castShadow = true;
    headGroup.add(cranium);

    // Rounded soft muzzle / snout
    const muzzleGeo = new THREE.SphereGeometry(0.125, 18, 16);
    muzzleGeo.scale(0.92, 0.85, 1.35);
    const muzzle = new THREE.Mesh(muzzleGeo, bodyMat);
    muzzle.position.set(0, -0.05, 0.13);
    muzzle.castShadow = true;
    headGroup.add(muzzle);

    // Two cute nostrils
    const nostrilGeo = new THREE.SphereGeometry(0.015, 8, 8);
    for (const sign of [-1, 1]) {
      const nostril = new THREE.Mesh(nostrilGeo, this.eyeMat);
      nostril.position.set(sign * 0.045, -0.06, 0.26);
      headGroup.add(nostril);
    }

    // Perky pony ears
    const earGeo = new THREE.ConeGeometry(0.045, 0.12, 12);
    earGeo.scale(0.85, 1, 0.55);
    for (const sign of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, bodyMat);
      ear.position.set(sign * 0.085, 0.18, -0.03);
      ear.rotation.z = -sign * 0.28;
      ear.rotation.x = -0.15;
      ear.castShadow = true;
      headGroup.add(ear);
    }

    // Eyes with extra sweet pony expression
    const eyeRadius = 0.036;
    const eyeGeo = new THREE.SphereGeometry(eyeRadius, 14, 14);
    eyeGeo.scale(0.8, 1.15, 0.4);
    const glint1Geo = new THREE.SphereGeometry(eyeRadius * 0.38, 8, 8);
    const glint2Geo = new THREE.SphereGeometry(eyeRadius * 0.20, 6, 6);
    const blushGeo = new THREE.CircleGeometry(eyeRadius * 1.0, 14);

    for (const sign of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, this.eyeMat);
      eye.position.set(sign * 0.13, 0.01, 0.11);
      eye.rotation.y = sign * 0.35;
      headGroup.add(eye);

      const glint1 = new THREE.Mesh(glint1Geo, this.glintMat);
      glint1.position.set(sign * 0.138, 0.022, 0.125);
      headGroup.add(glint1);

      const glint2 = new THREE.Mesh(glint2Geo, this.glintMat);
      glint2.position.set(sign * 0.122, -0.008, 0.122);
      headGroup.add(glint2);

      const blush = new THREE.Mesh(blushGeo, this.blushMat);
      blush.position.set(sign * 0.155, -0.05, 0.09);
      blush.rotation.y = sign * 0.45;
      headGroup.add(blush);
    }

    root.add(headGroup);

    // Beautiful flowing stylized mane along the neck crest
    const maneGroup = new THREE.Group();
    const maneSegmentGeo = new THREE.SphereGeometry(0.08, 14, 12);
    maneSegmentGeo.scale(0.7, 1.3, 1.2);

    // 4 overlapping mane puffs from forehead to back of neck
    const manePositions = [
      [0, 0.74, 0.04, -0.2], // Forelock between ears
      [0, 0.66, -0.06, -0.35],
      [0, 0.54, -0.10, -0.45],
      [0, 0.42, -0.12, -0.55],
      [0, 0.30, -0.13, -0.65]
    ];

    for (const [x, y, z, rx] of manePositions) {
      const mane = new THREE.Mesh(maneSegmentGeo, maneMat);
      mane.position.set(x, y, z);
      mane.rotation.x = rx;
      mane.castShadow = true;
      maneGroup.add(mane);
    }
    root.add(maneGroup);

    // Blue / Red Harness chest collar with gold buckle
    const harnessGeo = new THREE.TorusGeometry(0.20, 0.024, 10, 24);
    harnessGeo.rotateX(Math.PI / 2 + 0.3);
    const harness = new THREE.Mesh(harnessGeo, harnessMat);
    harness.position.set(0, 0.30, 0.02);
    root.add(harness);

    const buckleGeo = new THREE.SphereGeometry(0.038, 12, 12);
    const buckle = new THREE.Mesh(buckleGeo, this.goldMat);
    buckle.position.set(0, 0.28, 0.20);
    root.add(buckle);

    return root;
  }

  // ================= 4. BISHOP (Giáo Hoàng Thần Thú - The Wise Creature Scholar) =================
  buildBishop(color) {
    const isWhite = color === 'w';
    const bodyMat = isWhite ? this.whitePorcelainMat : this.blackPorcelainMat;
    const fabricMat = isWhite ? this.royalBlueMat : this.crimsonRedMat;
    const innerEarMat = isWhite ? this.pinkInnerEarMat : this.darkPinkInnerEarMat;

    const root = new THREE.Group();
    root.add(this.createPedestal(0.32, 0.055, color));

    // Robed Body with bell shape
    const robeGeo = new THREE.CylinderGeometry(0.18, 0.28, 0.36, 24);
    const robe = new THREE.Mesh(robeGeo, fabricMat);
    robe.position.y = 0.24;
    robe.castShadow = true;
    robe.receiveShadow = true;
    root.add(robe);

    // Gold hem at bottom of robe
    const robeHemGeo = new THREE.TorusGeometry(0.278, 0.014, 10, 24);
    robeHemGeo.rotateX(Math.PI / 2);
    const robeHem = new THREE.Mesh(robeHemGeo, this.goldMat);
    robeHem.position.y = 0.07;
    root.add(robeHem);

    // Scarf / Cape collar around neck
    root.add(this.createTiedScarf(0.18, 0.43, fabricMat));

    // Cute Creature Head
    const headRadius = 0.22;
    const headY = 0.58;
    const headGeo = new THREE.SphereGeometry(headRadius, 24, 20);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = headY;
    head.castShadow = true;
    root.add(head);

    // Face features
    this.addCuteFace(root, new THREE.Vector3(0, headY, 0), headRadius, true);

    // Tall pointed Bishop Miter Hat
    const miterH = 0.26;
    const miterGeo = new THREE.ConeGeometry(0.17, miterH, 20);
    miterGeo.scale(0.92, 1, 0.85);
    const miter = new THREE.Mesh(miterGeo, fabricMat);
    miter.position.set(0, headY + headRadius * 0.72 + miterH * 0.5 - 0.03, -0.01);
    miter.castShadow = true;
    root.add(miter);

    // Gold circlet at base of miter
    const miterCircletGeo = new THREE.TorusGeometry(0.165, 0.014, 10, 24);
    miterCircletGeo.rotateX(Math.PI / 2);
    const miterCirclet = new THREE.Mesh(miterCircletGeo, this.goldMat);
    miterCirclet.position.y = headY + headRadius * 0.70;
    root.add(miterCirclet);

    // Gold Cross on the Miter
    const crossGroup = new THREE.Group();
    crossGroup.position.set(0, miter.position.y - 0.01, 0.155);

    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.08, 0.01), this.goldMat);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.022, 0.01), this.goldMat);
    crossH.position.y = 0.015;
    crossGroup.add(crossV);
    crossGroup.add(crossH);
    root.add(crossGroup);

    // Two long pointy animal ears framing the miter
    const earGeo = new THREE.ConeGeometry(0.045, 0.18, 12);
    earGeo.scale(0.85, 1, 0.55);
    for (const sign of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, bodyMat);
      ear.position.set(sign * 0.15, headY + 0.14, 0.01);
      ear.rotation.z = -sign * 0.38;
      ear.rotation.x = -0.12;
      ear.castShadow = true;
      root.add(ear);

      // Pink inner ear
      const innerEar = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.12, 10), innerEarMat);
      innerEar.position.set(sign * 0.145, headY + 0.13, 0.03);
      innerEar.rotation.z = -sign * 0.38;
      innerEar.rotation.x = -0.12;
      root.add(innerEar);
    }

    // Golden Bishop Staff / Crosier held in right hand
    const staffGroup = new THREE.Group();
    staffGroup.position.set(0.22, 0.05, 0.08);

    const staffPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.76, 12),
      this.goldMat
    );
    staffPole.position.y = 0.38;
    staffPole.castShadow = true;
    staffGroup.add(staffPole);

    // Curved ornate crosier spiral top
    const crosierGeo = new THREE.TorusGeometry(0.075, 0.016, 12, 24, Math.PI * 1.4);
    const crosier = new THREE.Mesh(crosierGeo, this.goldMat);
    crosier.position.set(0.02, 0.74, 0);
    crosier.rotation.z = Math.PI * 0.45;
    staffGroup.add(crosier);

    // Glowing ruby/gem inside crosier
    const staffGem = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 12), this.rubyMat);
    staffGem.position.set(0.02, 0.74, 0);
    staffGroup.add(staffGem);

    root.add(staffGroup);

    return root;
  }

  // ================= 5. QUEEN (Mèo Nữ Hoàng - The Cat Queen) =================
  buildQueen(color) {
    const isWhite = color === 'w';
    const bodyMat = isWhite ? this.whitePorcelainMat : this.blackPorcelainMat;
    const capeMat = isWhite ? this.royalBlueMat : this.crimsonRedMat;
    const innerEarMat = isWhite ? this.pinkInnerEarMat : this.darkPinkInnerEarMat;

    const root = new THREE.Group();
    root.add(this.createPedestal(0.33, 0.055, color));

    // Royal Gown & Cape Body
    const gownGeo = new THREE.CylinderGeometry(0.20, 0.28, 0.38, 24);
    const gown = new THREE.Mesh(gownGeo, bodyMat);
    gown.position.y = 0.24;
    gown.castShadow = true;
    gown.receiveShadow = true;
    root.add(gown);

    // Flowing Cape wrapped around shoulders
    const capeGeo = new THREE.CylinderGeometry(0.21, 0.29, 0.34, 24, 1, true, Math.PI * 0.25, Math.PI * 1.5);
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.y = 0.25;
    cape.castShadow = true;
    root.add(cape);

    // Gold trim around cape hem
    const capeHemGeo = new THREE.TorusGeometry(0.285, 0.014, 10, 24);
    capeHemGeo.rotateX(Math.PI / 2);
    const capeHem = new THREE.Mesh(capeHemGeo, this.goldMat);
    capeHem.position.y = 0.08;
    root.add(capeHem);

    // Golden Royal Brooch with Ruby clasp at chest
    const brooch = new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 14), this.goldMat);
    brooch.position.set(0, 0.40, 0.20);
    root.add(brooch);

    const ruby = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 10), this.rubyMat);
    ruby.position.set(0, 0.40, 0.23);
    root.add(ruby);

    // Cute paws resting together in front
    const pawGeo = new THREE.SphereGeometry(0.048, 12, 10);
    pawGeo.scale(0.85, 0.7, 1.15);
    for (const sign of [-1, 1]) {
      const paw = new THREE.Mesh(pawGeo, bodyMat);
      paw.position.set(sign * 0.065, 0.28, 0.20);
      paw.rotation.y = -sign * 0.15;
      root.add(paw);
    }

    // Chubby Cat Head
    const headRadius = 0.23;
    const headY = 0.58;
    const headGeo = new THREE.SphereGeometry(headRadius, 24, 20);
    headGeo.scale(1.04, 0.96, 0.98);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = headY;
    head.castShadow = true;
    root.add(head);

    // Face features (cat smile :3)
    this.addCuteFace(root, new THREE.Vector3(0, headY, 0), headRadius, true);

    // Two Cute Triangular Cat Ears (with pink inner layer)
    const earGeo = new THREE.ConeGeometry(0.065, 0.13, 14);
    earGeo.scale(0.9, 1, 0.55);
    for (const sign of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, bodyMat);
      ear.position.set(sign * 0.13, headY + 0.17, 0.02);
      ear.rotation.z = -sign * 0.35;
      ear.rotation.x = -0.10;
      ear.castShadow = true;
      root.add(ear);

      const innerEar = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 10), innerEarMat);
      innerEar.position.set(sign * 0.125, headY + 0.165, 0.04);
      innerEar.rotation.z = -sign * 0.35;
      innerEar.rotation.x = -0.10;
      root.add(innerEar);
    }

    // 4-Point Golden Queen Tiara with Ruby centerpiece
    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, headY + headRadius * 0.82, 0.03);

    // Crown base circlet
    const circlet = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.015, 10, 24), this.goldMat);
    circlet.rotation.x = Math.PI / 2;
    crownGroup.add(circlet);

    // 4 triangular crown points
    const pointGeo = new THREE.ConeGeometry(0.028, 0.09, 10);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const point = new THREE.Mesh(pointGeo, this.goldMat);
      point.position.set(Math.cos(angle) * 0.10, 0.045, Math.sin(angle) * 0.10);
      crownGroup.add(point);
    }

    // Centerpiece ruby jewel
    const crownRuby = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), this.rubyMat);
    crownRuby.position.set(0, 0.04, 0.11);
    crownGroup.add(crownRuby);

    root.add(crownGroup);

    // Royal Golden Scepter held in right paw
    const scepterGroup = new THREE.Group();
    scepterGroup.position.set(0.20, 0.18, 0.15);

    const scepterRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.44, 10),
      this.goldMat
    );
    scepterRod.position.y = 0.22;
    scepterRod.castShadow = true;
    scepterGroup.add(scepterRod);

    const scepterOrb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 14), this.goldMat);
    scepterOrb.position.y = 0.44;
    scepterGroup.add(scepterOrb);

    const scepterGem = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 10), this.rubyMat);
    scepterGem.position.y = 0.44;
    scepterGroup.add(scepterGem);

    root.add(scepterGroup);

    return root;
  }

  // ================= 6. KING (Mèo Vua - The Chubby Cat King) =================
  buildKing(color) {
    const isWhite = color === 'w';
    const bodyMat = isWhite ? this.whitePorcelainMat : this.blackPorcelainMat;
    const mantleMat = isWhite ? this.royalBlueMat : this.crimsonRedMat;
    const innerEarMat = isWhite ? this.pinkInnerEarMat : this.darkPinkInnerEarMat;

    const root = new THREE.Group();
    root.add(this.createPedestal(0.34, 0.055, color));

    // Regal Chubby Torso
    const bodyGeo = new THREE.CylinderGeometry(0.22, 0.30, 0.38, 24);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.24;
    body.castShadow = true;
    body.receiveShadow = true;
    root.add(body);

    // Royal Mantle / Cape draped over back and shoulders
    const mantleGeo = new THREE.CylinderGeometry(0.23, 0.31, 0.34, 24, 1, true, Math.PI * 0.25, Math.PI * 1.5);
    const mantle = new THREE.Mesh(mantleGeo, mantleMat);
    mantle.position.y = 0.25;
    mantle.castShadow = true;
    root.add(mantle);

    // Gold hem around bottom of mantle
    const mantleHemGeo = new THREE.TorusGeometry(0.305, 0.015, 10, 24);
    mantleHemGeo.rotateX(Math.PI / 2);
    const mantleHem = new THREE.Mesh(mantleHemGeo, this.goldMat);
    mantleHem.position.y = 0.08;
    root.add(mantleHem);

    // Regal Mantle Fur/Gold Collar around neck
    const collarGeo = new THREE.TorusGeometry(0.22, 0.045, 12, 28);
    collarGeo.rotateX(Math.PI / 2);
    const collar = new THREE.Mesh(collarGeo, this.goldMat);
    collar.position.y = 0.42;
    collar.castShadow = true;
    root.add(collar);

    // Gold medallion at chest
    const medallion = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 16), this.goldMat);
    medallion.rotation.x = Math.PI / 2;
    medallion.position.set(0, 0.38, 0.22);
    root.add(medallion);

    const rubyMedallion = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), this.rubyMat);
    rubyMedallion.position.set(0, 0.38, 0.24);
    root.add(rubyMedallion);

    // Cute paws resting royally in front
    const pawGeo = new THREE.SphereGeometry(0.052, 12, 10);
    pawGeo.scale(0.85, 0.7, 1.2);
    for (const sign of [-1, 1]) {
      const paw = new THREE.Mesh(pawGeo, bodyMat);
      paw.position.set(sign * 0.075, 0.26, 0.22);
      paw.rotation.y = -sign * 0.15;
      root.add(paw);
    }

    // Chubby Cat King Head
    const headRadius = 0.245;
    const headY = 0.60;
    const headGeo = new THREE.SphereGeometry(headRadius, 24, 20);
    headGeo.scale(1.04, 0.96, 0.98);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = headY;
    head.castShadow = true;
    root.add(head);

    // Face features (king's confident and charming cat smile)
    this.addCuteFace(root, new THREE.Vector3(0, headY, 0), headRadius, true);

    // Two Cat Ears
    const earGeo = new THREE.ConeGeometry(0.065, 0.13, 14);
    earGeo.scale(0.9, 1, 0.55);
    for (const sign of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, bodyMat);
      ear.position.set(sign * 0.14, headY + 0.18, 0.02);
      ear.rotation.z = -sign * 0.35;
      ear.rotation.x = -0.10;
      ear.castShadow = true;
      root.add(ear);

      const innerEar = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 10), innerEarMat);
      innerEar.position.set(sign * 0.135, headY + 0.175, 0.04);
      innerEar.rotation.z = -sign * 0.35;
      innerEar.rotation.x = -0.10;
      root.add(innerEar);
    }

    // 5-Point Royal Crown with Cross and Jewels
    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, headY + headRadius * 0.82, 0.03);

    // Crown base circlet
    const circlet = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.016, 10, 24), this.goldMat);
    circlet.rotation.x = Math.PI / 2;
    crownGroup.add(circlet);

    // Inner velvet dome (blue for White, red for Black)
    const domeMat = isWhite ? this.royalBlueDarkMat : this.crimsonRedDarkMat;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.10, 16, 12), domeMat);
    dome.position.y = 0.04;
    dome.scale.set(1, 0.8, 1);
    crownGroup.add(dome);

    // 5 golden crown arches/points
    const pointGeo = new THREE.ConeGeometry(0.032, 0.11, 10);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const point = new THREE.Mesh(pointGeo, this.goldMat);
      point.position.set(Math.cos(angle) * 0.11, 0.055, Math.sin(angle) * 0.11);
      crownGroup.add(point);
    }

    // Royal Cross on top of crown
    const crossGroup = new THREE.Group();
    crossGroup.position.set(0, 0.13, 0);

    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.075, 0.015), this.goldMat);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.024, 0.015), this.goldMat);
    crossH.position.y = 0.012;
    crossGroup.add(crossV);
    crossGroup.add(crossH);
    crownGroup.add(crossGroup);

    root.add(crownGroup);

    // Royal Sovereignty Staff held in right paw
    const staffGroup = new THREE.Group();
    staffGroup.position.set(0.22, 0.18, 0.14);

    const staffPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.52, 10),
      this.goldMat
    );
    staffPole.position.y = 0.26;
    staffPole.castShadow = true;
    staffGroup.add(staffPole);

    // Golden cross finial atop the royal staff
    const staffCrossV = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.07, 0.012), this.goldMat);
    const staffCrossH = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.022, 0.012), this.goldMat);
    staffCrossV.position.y = 0.54;
    staffCrossH.position.y = 0.55;
    staffGroup.add(staffCrossV);
    staffGroup.add(staffCrossH);

    root.add(staffGroup);

    return root;
  }

  // Master Factory Dispatcher
  buildCutePiece(type, color) {
    switch (type) {
      case 'pawn':
        return this.buildPawn(color);
      case 'knight':
        return this.buildKnight(color);
      case 'bishop':
        return this.buildBishop(color);
      case 'rook':
        return this.buildRook(color);
      case 'queen':
        return this.buildQueen(color);
      case 'king':
        return this.buildKing(color);
      default:
        return this.buildPawn(color);
    }
  }
}
