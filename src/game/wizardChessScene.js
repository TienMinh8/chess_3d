import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { soundManager } from './soundEffects.js';
import { CutePiecesBuilder } from './cutePiecesBuilder.js';
import {
  createInitialBoard,
  getLegalMoves,
  isKingInCheck,
  isCheckmate,
  isStalemate,
  getBestMoveAI
} from './chessEngine.js';

export const SQUARE_SIZE = 0.34;
export const ALTAR_HEIGHT = 0.775;

// Attack animation timings per piece type
const ATTACK_PARAMS = {
  pawn:   { timeScale: 1.15, swingStartClip: 0.36, contactClip: 0.60, blowClip: 0.78, maxLunge: 0.095 },
  king:   { timeScale: 1.10, swingStartClip: 0.34, contactClip: 0.56, blowClip: 0.75, maxLunge: 0.080 },
  queen:  { timeScale: 1.08, swingStartClip: 0.35, contactClip: 0.58, blowClip: 0.77, maxLunge: 0.065 },
  rook:   { timeScale: 1.06, swingStartClip: 0.35, contactClip: 0.58, blowClip: 0.77, maxLunge: 0.055 },
  knight: { timeScale: 1.08, swingStartClip: 0.35, contactClip: 0.58, blowClip: 0.77, maxLunge: 0.060 },
  bishop: { timeScale: 1.08, swingStartClip: 0.35, contactClip: 0.58, blowClip: 0.77, maxLunge: 0.065 }
};

export function gridToWorld(r, c) {
  return new THREE.Vector3((c - 3.5) * SQUARE_SIZE, ALTAR_HEIGHT, (r - 3.5) * SQUARE_SIZE);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class WizardChessScene {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;

    this.board = createInitialBoard();
    this.pieceEntities = Array.from({ length: 8 }, () => Array(8).fill(null));
    this.modelsCache = {};
    this.activeMixers = [];
    this.debrisParticles = [];
    this.kickedPieces = [];
    this.hitSparks = [];
    this.cuteSoldiers = false; // Default to the original Gothic GLB statues
    this.clock = new THREE.Clock();
    this.isHomeMode = true;
    this.gameMode = 'ai'; // 'ai' or 'pass-play'
    this.aiDifficulty = 'medium'; // 'easy' (depth 1), 'medium' (depth 2), 'hard' (depth 3)

    this.currentTurn = 'w';
    this.playerColor = 'w';
    this.selectedSquare = null;
    this.validMoves = [];
    this.isBusy = false;
    this.gameOver = false;
    this.capturedWhite = 0;
    this.capturedBlack = 0;

    this.activeCamTween = null;
    this.cameraShake = 0;
    this.flameUniforms = [];

    // End Game Cinematic Effects State
    this.victoryEffectActive = false;
    this.defeatEffectActive = false;
    this.victoryBacklight = null;
    this.victoryRimLight = null;
    this.victorySigil = null;
    this.victoryParticles = [];
    this.shatteredFragments = [];
    this.dustParticles = [];
    this.defeatPiecesShaking = [];
    this.originalLighting = { ambient: 0.9, key: 2.2 };

    this.initThree();
    this.initShadersAndEnvironment();
    this.initBoardVisuals();
    this.initEventHandlers();
  }

  initThree() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090e);
    this.scene.fog = new THREE.FogExp2(0x080b14, 0.015);

    // Camera
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.2, 70);
    this.camera.position.set(0, 2.22, 2.72);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;
    this.controls.maxPolarAngle = Math.PI * 0.88;
    this.controls.minPolarAngle = 0.05;
    this.controls.minDistance = 0.95;
    this.controls.maxDistance = 35;
    this.controls.target.set(0, 0.85, -0.15);

    // Lights
    this.ambientLight = new THREE.AmbientLight(0x3a4b68, 0.9);
    this.scene.add(this.ambientLight);

    // Altar main spotlight
    this.keyLight = new THREE.DirectionalLight(0xfff1d6, 2.2);
    this.keyLight.position.set(2.5, 6.5, 3.2);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 15;
    this.keyLight.shadow.bias = -0.0002;
    this.keyLight.shadow.radius = 2.5;
    this.scene.add(this.keyLight);

    // Cathedral aisle lanterns
    this.aisleLanterns = [];
    for (const z of [-8.8, 8.2]) {
      for (const side of [-1, 1]) {
        const lantern = new THREE.PointLight(0x90beff, 3.5, 16, 1.3);
        lantern.position.set(side * 5.3, 4.1, z);
        this.scene.add(lantern);
        this.aisleLanterns.push(lantern);
      }
    }

    // High North Rose stained glass window light
    const roseLight = new THREE.PointLight(0x9bc8ff, 6.0, 22, 1.2);
    roseLight.position.set(0, 5.5, -18.0);
    this.scene.add(roseLight);

    // South Narthex amber light
    const narthexLight = new THREE.PointLight(0xffa844, 5.5, 22, 1.2);
    narthexLight.position.set(0, 5.5, 18.0);
    this.scene.add(narthexLight);

    // Flash light on melee impact
    this.impactFlash = new THREE.PointLight(0xffaa44, 0, 6, 1.5);
    this.scene.add(this.impactFlash);

    // Groups
    this.boardGroup = new THREE.Group();
    this.indicatorsGroup = new THREE.Group();
    this.piecesGroup = new THREE.Group();
    this.scene.add(this.boardGroup);
    this.scene.add(this.indicatorsGroup);
    this.scene.add(this.piecesGroup);

    // Materials
    this.whiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xe6dfd0,
      roughness: 0.34,
      metalness: 0.06
    });
    this.blackMaterial = new THREE.MeshStandardMaterial({
      color: 0x222733,
      roughness: 0.28,
      metalness: 0.24
    });
    this.goldTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4ad37,
      roughness: 0.26,
      metalness: 0.86
    });
    this.steelMaterial = new THREE.MeshStandardMaterial({
      color: 0xdce8ee,
      roughness: 0.20,
      metalness: 0.88,
      emissive: 0x222832,
      emissiveIntensity: 0.25
    });

    this.cuteBuilder = new CutePiecesBuilder(this.goldTrimMaterial, this.steelMaterial);
  }

  initShadersAndEnvironment() {
    // Generate baked PMREM environment map simulating cathedral interior
    const pmremGen = new THREE.PMREMGenerator(this.renderer);
    pmremGen.compileEquirectangularShader();

    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x161a26);
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);

    const addEnvPanel = (color, intensity, pos, scale) => {
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(intensity)
      });
      const mesh = new THREE.Mesh(boxGeo, mat);
      mesh.position.fromArray(pos);
      mesh.scale.fromArray(scale);
      envScene.add(mesh);
    };

    addEnvPanel(0xdcd5c7, 2.4, [0, 9.5, -12], [10, 2, 1.5]);
    addEnvPanel(0xffdf8d, 2.2, [0, 9.5, 12], [10, 2, 1.5]);
    addEnvPanel(0xd4ddf6, 1.8, [-9, 6.5, 0], [1.2, 4.5, 16]);
    addEnvPanel(0xd4ddf6, 1.8, [9, 6.5, 0], [1.2, 4.5, 16]);
    addEnvPanel(0xff9428, 3.2, [-4.5, 1.6, 0], [2.2, 2.2, 4]);
    addEnvPanel(0xff9428, 3.2, [4.5, 1.6, 0], [2.2, 2.2, 4]);

    const envTexture = pmremGen.fromScene(envScene, 0.04).texture;
    this.scene.environment = envTexture;
    boxGeo.dispose();
    pmremGen.dispose();
  }

  initBoardVisuals() {
    const squareHeight = 0.036;
    const boxGeo = new THREE.BoxGeometry(SQUARE_SIZE * 0.985, squareHeight, SQUARE_SIZE * 0.985);
    const whiteSquareMat = new THREE.MeshStandardMaterial({
      color: 0xdcd6c2,
      roughness: 0.38,
      metalness: 0.06
    });
    const blackSquareMat = new THREE.MeshStandardMaterial({
      color: 0x14171f,
      roughness: 0.28,
      metalness: 0.18
    });

    this.boardSquares = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const isWhite = (r + c) % 2 === 0;
        const mesh = new THREE.Mesh(boxGeo, isWhite ? whiteSquareMat : blackSquareMat);
        const wPos = gridToWorld(r, c);
        mesh.position.set(wPos.x, ALTAR_HEIGHT - squareHeight * 0.5, wPos.z);
        mesh.receiveShadow = true;
        mesh.userData = { r, c, isSquare: true };
        this.boardGroup.add(mesh);
        this.boardSquares.push(mesh);
      }
    }

    // Golden altar border trims
    const trimH = 0.042;
    const trimW = 0.06;
    const borderLongGeo = new THREE.BoxGeometry(SQUARE_SIZE * 8 + trimW * 2, trimH, trimW);
    const borderShortGeo = new THREE.BoxGeometry(trimW, trimH, SQUARE_SIZE * 8);

    for (const sign of [-1, 1]) {
      const bZ = new THREE.Mesh(borderLongGeo, this.goldTrimMaterial);
      bZ.position.set(0, ALTAR_HEIGHT - trimH * 0.45, sign * (SQUARE_SIZE * 4 + trimW * 0.5));
      bZ.receiveShadow = true;
      this.boardGroup.add(bZ);

      const bX = new THREE.Mesh(borderShortGeo, this.goldTrimMaterial);
      bX.position.set(sign * (SQUARE_SIZE * 4 + trimW * 0.5), ALTAR_HEIGHT - trimH * 0.45, 0);
      bX.receiveShadow = true;
      this.boardGroup.add(bX);
    }
  }

  async loadAssets(onProgress) {
    const loader = new GLTFLoader();
    const modelNames = [
      'option8_cathedral',
      'pawn_white',
      'rook_white',
      'knight_white',
      'bishop_white',
      'queen_white',
      'king_white'
    ];

    const modelDescriptions = {
      'option8_cathedral': 'Kiến thiết Thánh đường Cổ kính Gothic Sanctum...',
      'pawn_white': 'Triệu hồi Binh đoàn Tiên phong (Pawn)...',
      'rook_white': 'Dựng Tháp canh Thành trì Bất khả Xâm phạm (Rook)...',
      'knight_white': 'Triệu tập Thiết kỵ Thánh điện Uy dũng (Knight)...',
      'bishop_white': 'Khai mở Quyền năng Pháp sư Cổ đại (Bishop)...',
      'queen_white': 'Hội tụ Ma pháp Hậu quân Tối thượng (Queen)...',
      'king_white': 'Đăng quang Quân vương Quyền năng (King)...'
    };

    let loadedCount = 0;
    const total = modelNames.length;

    for (const name of modelNames) {
      if (onProgress) {
        const desc = modelDescriptions[name] || `Triệu hồi ${name}...`;
        onProgress(Math.round((loadedCount / total) * 100), desc);
      }

      await new Promise((resolve) => {
        loader.load(
          `/assets/glb/${name}.glb`,
          (gltf) => {
            if (name === 'option8_cathedral') {
              this.setupCathedral(gltf.scene);
            } else {
              const baseName = name.replace('_white', '');
              // Filter icospheres/helper meshes
              gltf.scene.traverse((child) => {
                const cName = child.name || '';
                if (cName.includes('Icosphere') || cName.includes('glTF_not_exported')) {
                  child.visible = false;
                }
              });
              this.modelsCache[baseName] = {
                scene: gltf.scene,
                animations: gltf.animations || []
              };
            }
            loadedCount++;
            resolve();
          },
          undefined,
          (err) => {
            console.warn(`Warning loading ${name}.glb:`, err);
            loadedCount++;
            resolve();
          }
        );
      });
    }

    if (onProgress) {
      onProgress(100, 'Nghi thức hoàn tất. Thánh đường đã sẵn sàng.');
    }

    // Spawn pieces
    this.spawnAllPieces();
    this.startRenderLoop();
  }

  setupCathedral(cathedralScene) {
    cathedralScene.position.set(0, 0, -0.65);
    cathedralScene.traverse((child) => {
      if (child.isMesh) {
        child.receiveShadow = true;
        const matName = child.material?.name || '';
        const nodeName = child.name || '';

        // Glass and stained windows glowing
        if (matName.includes('Amber') || nodeName.includes('Amber')) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0xffe688,
            emissive: 0xffa033,
            emissiveIntensity: 2.4,
            roughness: 0.15,
            metalness: 0,
            side: THREE.DoubleSide
          });
        } else if (matName.includes('Glass') || matName.includes('Rose') || nodeName.includes('Window')) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0xdbe8ff,
            emissive: 0x68aaff,
            emissiveIntensity: 2.6,
            roughness: 0.15,
            metalness: 0,
            side: THREE.DoubleSide
          });
        } else if (nodeName.includes('GodRay')) {
          child.visible = false;
        }
      }
    });

    this.scene.add(cathedralScene);
  }

  spawnHitImpactSpark(pos) {
    // 1. Expanding golden shockwave ring
    const ringGeo = new THREE.RingGeometry(0.04, 0.14, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(pos.x, pos.y + 0.12, pos.z);
    this.scene.add(ringMesh);

    this.hitSparks.push({
      type: 'ring',
      mesh: ringMesh,
      mat: ringMat,
      scale: 1.0,
      maxScale: 3.5,
      life: 0.28,
      maxLife: 0.28
    });

    // 2. Comic star sparks radiating outward
    const sparkGeo = new THREE.BoxGeometry(0.035, 0.035, 0.035);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.position.set(pos.x, pos.y + 0.14, pos.z);
      this.scene.add(spark);

      this.hitSparks.push({
        type: 'spark',
        mesh: spark,
        vel: new THREE.Vector3(
          Math.cos(angle) * (1.8 + Math.random() * 1.2),
          1.2 + Math.random() * 1.0,
          Math.sin(angle) * (1.8 + Math.random() * 1.2)
        ),
        life: 0.22,
        maxLife: 0.22
      });
    }
  }

  createPieceEntity(type, color, r, c) {
    let mesh;
    let mixer = null;
    const actions = {};
    const useCute = this.cuteSoldiers;

    if (useCute && this.cuteBuilder) {
      mesh = this.cuteBuilder.buildCutePiece(type, color);
    } else {
      const cache = this.modelsCache[type];
      if (cache && cache.scene) {
        mesh = SkeletonUtils.clone(cache.scene);
        const pieceMat = color === 'w' ? this.whiteMaterial : this.blackMaterial;

        mesh.traverse((child) => {
          const n = child.name || '';
          if (n.includes('Icosphere') || n.includes('glTF_not_exported')) {
            child.visible = false;
          } else if (child.isMesh) {
            const matName = child.material?.name || '';
            if (matName.includes('Gold') || matName.includes('Trim') || matName.includes('Glow')) {
              child.material = this.goldTrimMaterial;
            } else if (matName.includes('Steel') || matName.includes('Silver')) {
              child.material = this.steelMaterial;
            } else {
              child.material = pieceMat;
            }
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        mixer = new THREE.AnimationMixer(mesh);
        for (const clip of cache.animations) {
          actions[clip.name] = mixer.clipAction(clip);
        }
        this.activeMixers.push(mixer);
      } else {
        const geo = new THREE.CylinderGeometry(0.1, 0.14, 0.42, 16);
        mesh = new THREE.Mesh(geo, color === 'w' ? this.whiteMaterial : this.blackMaterial);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    }

    const PIECE_SCALES = useCute
      ? { pawn: 0.28, rook: 0.30, knight: 0.30, bishop: 0.30, queen: 0.32, king: 0.34 }
      : { pawn: 0.26, rook: 0.28, knight: 0.28, bishop: 0.28, queen: 0.30, king: 0.31 };

    const worldPos = gridToWorld(r, c);
    mesh.position.copy(worldPos);
    mesh.rotation.y = color === 'w' ? Math.PI : 0;
    const pieceScale = PIECE_SCALES[type] || SQUARE_SIZE;
    mesh.scale.set(pieceScale, pieceScale, pieceScale);
    this.piecesGroup.add(mesh);

    const entity = {
      type,
      color,
      r,
      c,
      mesh,
      mixer,
      actions,
      currentAction: null,
      isCute: useCute,
      idleSeed: (r * 7 + c * 5) % 10
    };

    mesh.traverse((child) => {
      child.userData = { pieceEntity: entity };
    });

    if (!useCute) {
      this.playPieceAnimation(entity, 'Idle', true, 0.2);
    }

    return entity;
  }

  playPieceAnimation(entity, animName, loop = true, fade = 0.15) {
    if (!entity || !entity.actions) return;
    const key = Object.keys(entity.actions).find((k) =>
      k.toLowerCase().includes(animName.toLowerCase())
    );
    if (!key) return;

    const action = entity.actions[key];
    const isIdle = animName.toLowerCase().includes('idle');
    const isAttack = animName.toLowerCase().includes('attack');

    if (entity.currentAction && entity.currentAction !== action) {
      entity.currentAction.fadeOut(fade);
    }

    action.reset();
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    action.clampWhenFinished = !loop;

    const params = ATTACK_PARAMS[entity.type] || ATTACK_PARAMS.queen;
    action.timeScale = isAttack ? params.timeScale : 0.85;

    // Stagger idle starts so statues don't breathe in lockstep
    if (isIdle) {
      action.time = ((entity.r * 5 + entity.c * 3) % 16) * 0.12;
    }

    action.fadeIn(fade).play();
    entity.currentAction = action;
  }

  spawnAllPieces() {
    this.clearAllPieces();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const pieceData = this.board[r][c];
        if (pieceData) {
          this.pieceEntities[r][c] = this.createPieceEntity(
            pieceData.type,
            pieceData.color,
            r,
            c
          );
        }
      }
    }
  }

  clearAllPieces() {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const entity = this.pieceEntities[r][c];
        if (entity && entity.mesh) {
          this.piecesGroup.remove(entity.mesh);
        }
        this.pieceEntities[r][c] = null;
      }
    }
    // Remove all knocked-out pieces from cathedral floor
    for (const kp of this.kickedPieces) {
      if (kp.mesh) {
        if (kp.mesh.parent) kp.mesh.parent.remove(kp.mesh);
        this.piecesGroup.remove(kp.mesh);
        this.scene.remove(kp.mesh);
      }
    }
    this.kickedPieces = [];

    // Remove any active hit impact spark meshes
    for (const s of this.hitSparks) {
      if (s.mesh) this.scene.remove(s.mesh);
    }
    this.hitSparks = [];
    this.activeMixers = [];
  }

  setCuteSoldiers(enabled) {
    this.cuteSoldiers = enabled;
    this.spawnAllPieces();
  }

  setHomeMenuMode(enabled) {
    this.isHomeMode = enabled;
    this.controls.autoRotate = false;
    this.clearEndGameEffects();
    if (enabled) {
      this.clearSelection();
      this.setCameraView('home');
    } else {
      this.setCameraView('player');
    }
  }

  initEventHandlers() {
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.onPointerDown = (e) => {
      if (this.isBusy || this.gameOver || this.isHomeMode) return;

      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);

      for (const hit of intersects) {
        // Did we hit a piece?
        let obj = hit.object;
        let entity = null;
        while (obj && !entity) {
          if (obj.userData?.pieceEntity) {
            entity = obj.userData.pieceEntity;
            break;
          }
          obj = obj.parent;
        }

        if (entity && entity.color === this.currentTurn && entity.color === this.playerColor) {
          this.selectSquare(entity.r, entity.c);
          return;
        }

        // Did we click a square on the board or indicator?
        if (hit.object.userData?.isSquare || hit.object.userData?.isIndicator) {
          const { r, c } = hit.object.userData;
          if (this.selectedSquare) {
            const isMove = this.validMoves.some((m) => m.r === r && m.c === c);
            if (isMove) {
              this.executeMove(this.selectedSquare.r, this.selectedSquare.c, r, c);
              return;
            }
          }
        }
      }

      // Clicked elsewhere on board or scene
      this.clearSelection();
    };

    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);

    this.onWindowResize = () => {
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    window.addEventListener('resize', this.onWindowResize);
  }

  selectSquare(r, c) {
    this.selectedSquare = { r, c };
    this.validMoves = getLegalMoves(r, c, this.board);
    this.renderMoveIndicators(r, c, this.validMoves);
  }

  clearSelection() {
    this.selectedSquare = null;
    this.validMoves = [];
    while (this.indicatorsGroup.children.length > 0) {
      this.indicatorsGroup.remove(this.indicatorsGroup.children[0]);
    }
  }

  renderMoveIndicators(selR, selC, moves) {
    while (this.indicatorsGroup.children.length > 0) {
      this.indicatorsGroup.remove(this.indicatorsGroup.children[0]);
    }

    // Selected square gold ring
    const selPos = gridToWorld(selR, selC);
    const selRingGeo = new THREE.RingGeometry(0.115, 0.155, 32);
    selRingGeo.rotateX(-Math.PI / 2);
    const selMat = new THREE.MeshBasicMaterial({ color: 0xf5d76e, side: THREE.DoubleSide });
    const selMesh = new THREE.Mesh(selRingGeo, selMat);
    selMesh.position.set(selPos.x, ALTAR_HEIGHT + 0.005, selPos.z);
    this.indicatorsGroup.add(selMesh);

    // Target squares
    for (const m of moves) {
      const destPos = gridToWorld(m.r, m.c);
      if (m.capture) {
        // Red danger ring
        const capGeo = new THREE.RingGeometry(0.12, 0.16, 32);
        capGeo.rotateX(-Math.PI / 2);
        const capMat = new THREE.MeshBasicMaterial({ color: 0xe63946, side: THREE.DoubleSide });
        const capMesh = new THREE.Mesh(capGeo, capMat);
        capMesh.position.set(destPos.x, ALTAR_HEIGHT + 0.006, destPos.z);
        capMesh.userData = { r: m.r, c: m.c, isIndicator: true };
        this.indicatorsGroup.add(capMesh);
      } else {
        // Teal emerald dot
        const dotGeo = new THREE.CircleGeometry(0.06, 24);
        dotGeo.rotateX(-Math.PI / 2);
        const dotMat = new THREE.MeshBasicMaterial({
          color: 0x4eb0de,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide
        });
        const dotMesh = new THREE.Mesh(dotGeo, dotMat);
        dotMesh.position.set(destPos.x, ALTAR_HEIGHT + 0.005, destPos.z);
        dotMesh.userData = { r: m.r, c: m.c, isIndicator: true };
        this.indicatorsGroup.add(dotMesh);
      }
    }
  }

  async executeMove(fromR, fromC, toR, toC) {
    if (this.isBusy || this.gameOver) return;
    this.isBusy = true;
    this.clearSelection();

    const movingPiece = this.board[fromR][fromC];
    const targetPiece = this.board[toR][toC];
    const movingEntity = this.pieceEntities[fromR][fromC];
    const targetEntity = this.pieceEntities[toR][toC];

    const isCapture = !!targetPiece;

    // Check castling
    const isCastling =
      movingPiece.type === 'king' && Math.abs(toC - fromC) === 2;
    let castlingRookEntity = null;
    let rookToC = -1;

    if (isCastling) {
      const rookFromC = toC > fromC ? 7 : 0;
      rookToC = toC > fromC ? 5 : 3;
      castlingRookEntity = this.pieceEntities[fromR][rookFromC];
    }

    // Play move/attack sound
    if (isCapture) {
      soundManager.playAttackMelee();
    } else {
      soundManager.playMoveSound();
    }

    // Face movement direction
    const startWorld = gridToWorld(fromR, fromC);
    const endWorld = gridToWorld(toR, toC);
    const dx = endWorld.x - startWorld.x;
    const dz = endWorld.z - startWorld.z;
    const angle = Math.atan2(dx, dz);

    if (movingEntity && movingEntity.mesh) {
      movingEntity.mesh.rotation.y = angle;
      this.playPieceAnimation(movingEntity, 'Move', true, 0.1);
    }

    if (isCapture && targetEntity && targetEntity.mesh) {
      targetEntity.mesh.rotation.y = Math.atan2(-dx, -dz);
    }

    // Animate movement & melee combat sequence
    await this.animateMoveSequence(movingEntity, targetEntity, startWorld, endWorld, isCapture);

    // Update board state
    this.board[toR][toC] = { ...movingPiece, hasMoved: true };
    this.board[fromR][fromC] = null;
    this.pieceEntities[toR][toC] = movingEntity;
    this.pieceEntities[fromR][fromC] = null;

    if (movingEntity) {
      movingEntity.r = toR;
      movingEntity.c = toC;
      this.playPieceAnimation(movingEntity, 'Idle', true, 0.2);
    }

    // Castling rook move
    if (isCastling && castlingRookEntity) {
      const rookFromC = toC > fromC ? 7 : 0;
      const rStart = gridToWorld(fromR, rookFromC);
      const rEnd = gridToWorld(fromR, rookToC);
      this.board[fromR][rookToC] = { ...this.board[fromR][rookFromC], hasMoved: true };
      this.board[fromR][rookFromC] = null;
      this.pieceEntities[fromR][rookToC] = castlingRookEntity;
      this.pieceEntities[fromR][rookFromC] = null;
      castlingRookEntity.c = rookToC;
      castlingRookEntity.mesh.position.copy(rEnd);
    }

    // Pawn Promotion (auto Queen)
    if (movingPiece.type === 'pawn' && (toR === 0 || toR === 7)) {
      this.board[toR][toC].type = 'queen';
      // Replace mesh with Queen
      if (movingEntity && movingEntity.mesh) {
        this.piecesGroup.remove(movingEntity.mesh);
      }
      this.pieceEntities[toR][toC] = this.createPieceEntity('queen', movingPiece.color, toR, toC);
    }

    // Captured counter
    if (isCapture) {
      if (movingPiece.color === 'w') {
        this.capturedWhite++;
      } else {
        this.capturedBlack++;
      }
    }

    // Switch turn
    this.currentTurn = this.currentTurn === 'w' ? 'b' : 'w';

    // Check game condition
    const inCheck = isKingInCheck(this.currentTurn, this.board);
    const checkmated = isCheckmate(this.currentTurn, this.board);
    const stalemated = isStalemate(this.currentTurn, this.board);

    if (inCheck && !checkmated) {
      soundManager.playCheckAlert();
    }

    if (checkmated) {
      this.gameOver = true;
      const winnerColor = this.currentTurn === 'w' ? 'b' : 'w';
      const loserColor = this.currentTurn;
      const winner = winnerColor === 'w' ? 'White' : 'Black';

      const isAI = this.gameMode === 'ai';
      const isPlayerWin = isAI ? (this.playerColor === winnerColor) : false;
      const isPlayerLoss = isAI ? (this.playerColor === loserColor) : false;

      if (isAI) {
        if (isPlayerWin) {
          this.triggerVictoryEffect(this.playerColor);
          soundManager.playVictoryFanfare();
        } else {
          this.triggerDefeatEffect(this.playerColor);
          soundManager.playDefeatCrumble();
        }
      } else {
        // Local 2-Player mode: winning side receives glorious victory aura, losing side crumbles
        this.triggerVictoryEffect(winnerColor);
        this.triggerDefeatEffect(loserColor);
        soundManager.playVictoryFanfare();
      }

      if (this.callbacks.onGameOver) {
        setTimeout(() => {
          this.callbacks.onGameOver({
            type: 'checkmate',
            winner,
            winnerColor,
            loserColor,
            isPlayerWin,
            isPlayerLoss,
            isTwoPlayer: !isAI,
            reason: 'checkmate'
          });
        }, 1200);
      }
    } else if (stalemated) {
      this.gameOver = true;
      soundManager.playFloorBounce();
      if (this.callbacks.onGameOver) {
        setTimeout(() => {
          this.callbacks.onGameOver({
            type: 'stalemate',
            winner: 'Draw',
            winnerColor: null,
            isPlayerWin: false,
            isPlayerLoss: false,
            isTwoPlayer: this.gameMode !== 'ai',
            reason: 'stalemate'
          });
        }, 800);
      }
    }

    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange({
        currentTurn: this.currentTurn,
        inCheck,
        capturedWhite: this.capturedWhite,
        capturedBlack: this.capturedBlack
      });
    }

    this.isBusy = false;

    // AI Turn trigger
    if (!this.gameOver && this.gameMode === 'ai' && this.currentTurn !== this.playerColor) {
      setTimeout(() => this.triggerAIMove(), 600);
    }
  }

  animateMoveSequence(movingEntity, targetEntity, startPos, endPos, isCapture) {
    return new Promise((resolve) => {
      // If regular move without capture, hop directly to destination square
      if (!isCapture || !targetEntity || !targetEntity.mesh) {
        const distance = startPos.distanceTo(endPos);
        const moveDuration = Math.max(0.42, distance * 0.40);
        const startTime = performance.now();

        const updateFrame = () => {
          const now = performance.now();
          const progress = Math.min(1, (now - startTime) / (moveDuration * 1000));
          const ease = easeInOutCubic(progress);

          if (movingEntity && movingEntity.mesh) {
            movingEntity.mesh.position.lerpVectors(startPos, endPos, ease);
            movingEntity.mesh.position.y = ALTAR_HEIGHT + Math.sin(progress * Math.PI) * 0.10;
          }

          if (progress < 1) {
            requestAnimationFrame(updateFrame);
          } else {
            if (movingEntity && movingEntity.mesh) {
              movingEntity.mesh.position.copy(endPos);
            }
            resolve();
          }
        };

        requestAnimationFrame(updateFrame);
        return;
      }

      // ================= THREE-PHASE COMBAT CHOREOGRAPHY =================
      // Phase 1: Attacker moves and stops at the square right adjacent to the victim
      // Phase 2: Attacker delivers physical kick strike with shockwave spark; victim flies just outside board
      // Phase 3: Attacker smoothly steps in to claim the target's square!

      const dir = endPos.clone().sub(startPos).normalize();
      const attackStanceDist = SQUARE_SIZE * 0.78;
      const adjacentPos = endPos.clone().sub(dir.clone().multiplyScalar(attackStanceDist));
      adjacentPos.y = ALTAR_HEIGHT;

      const distanceToStance = startPos.distanceTo(adjacentPos);
      const approachDuration = Math.max(0.38, distanceToStance * 0.38);

      // Camera combat zoom
      let prevCamPos = this.camera.position.clone();
      let prevCamTarget = this.controls.target.clone();
      const combatCamTarget = endPos.clone().add(new THREE.Vector3(0, 0.35, 0));
      const combatCamPos = endPos.clone().add(new THREE.Vector3(0.85, 1.0, 1.1));

      this.activeCamTween = {
        startPos: this.camera.position.clone(),
        endPos: combatCamPos,
        startTarget: this.controls.target.clone(),
        endTarget: combatCamTarget,
        elapsed: 0,
        duration: 0.45
      };

      const startTime = performance.now();

      // Step 1: Slide to adjacent stance
      const updateApproach = () => {
        const now = performance.now();
        const progress = Math.min(1, (now - startTime) / (approachDuration * 1000));
        const ease = easeInOutCubic(progress);

        if (movingEntity && movingEntity.mesh) {
          movingEntity.mesh.position.lerpVectors(startPos, adjacentPos, ease);
          movingEntity.mesh.position.y = ALTAR_HEIGHT + Math.sin(progress * Math.PI) * 0.08;
        }

        if (progress < 1) {
          requestAnimationFrame(updateApproach);
        } else {
          if (movingEntity && movingEntity.mesh) {
            movingEntity.mesh.position.copy(adjacentPos);
          }

          // Step 2: Deliver physical kick strike!
          this.executePhysicalKick(movingEntity, targetEntity, adjacentPos, endPos, dir, () => {
            // Step 3: Step in to claim the conquered square
            const stepInStartTime = performance.now();
            const stepInDuration = 0.26;

            const updateStepIn = () => {
              const now2 = performance.now();
              const progress2 = Math.min(1, (now2 - stepInStartTime) / (stepInDuration * 1000));
              const ease2 = easeInOutCubic(progress2);

              if (movingEntity && movingEntity.mesh) {
                movingEntity.mesh.position.lerpVectors(adjacentPos, endPos, ease2);
                movingEntity.mesh.position.y = ALTAR_HEIGHT + Math.sin(progress2 * Math.PI) * 0.06;
              }

              if (progress2 < 1) {
                requestAnimationFrame(updateStepIn);
              } else {
                if (movingEntity && movingEntity.mesh) {
                  movingEntity.mesh.position.copy(endPos);
                  movingEntity.mesh.rotation.x = 0;
                  movingEntity.mesh.rotation.z = 0;
                }

                // Restore camera
                if (prevCamPos && prevCamTarget) {
                  setTimeout(() => {
                    this.activeCamTween = {
                      startPos: this.camera.position.clone(),
                      endPos: prevCamPos,
                      startTarget: this.controls.target.clone(),
                      endTarget: prevCamTarget,
                      elapsed: 0,
                      duration: 0.75
                    };
                  }, 250);
                }

                resolve();
              }
            };

            requestAnimationFrame(updateStepIn);
          });
        }
      };

      requestAnimationFrame(updateApproach);
    });
  }

  executePhysicalKick(attacker, victim, stancePos, victimPos, dir, onKickDone) {
    if (!attacker || !attacker.mesh) {
      if (onKickDone) onKickDone();
      return;
    }

    const mesh = attacker.mesh;
    const windupPos = stancePos.clone().sub(dir.clone().multiplyScalar(0.04));
    const lungePos = stancePos.clone().add(dir.clone().multiplyScalar(0.12));

    // Trigger animated attack clip for realistic statues if available
    if (!attacker.isCute) {
      this.playPieceAnimation(attacker, 'Attack', false, 0.08);
    }

    // Phase 2a: Windup (pulls back slightly)
    const t0 = performance.now();
    const windupDuration = 110;

    const doWindup = () => {
      const now = performance.now();
      const p = Math.min(1, (now - t0) / windupDuration);
      mesh.position.lerpVectors(stancePos, windupPos, p);
      mesh.rotation.x = -0.18; // Leans back for kick power

      if (p < 1) {
        requestAnimationFrame(doWindup);
      } else {
        // Phase 2b: Snap Lunge Kick Forward!
        const t1 = performance.now();
        const strikeDuration = 80;

        const doStrike = () => {
          const now2 = performance.now();
          const p2 = Math.min(1, (now2 - t1) / strikeDuration);
          mesh.position.lerpVectors(windupPos, lungePos, p2);
          mesh.rotation.x = 0.28; // Snaps forward into kick

          if (p2 < 1) {
            requestAnimationFrame(doStrike);
          } else {
            // EXACT MOMENT OF IMPACT!
            const contactPos = stancePos.clone().lerp(victimPos, 0.65);
            this.spawnHitImpactSpark(contactPos);
            soundManager.playKickKnockout();
            this.cameraShake = 0.085;

            this.impactFlash.position.set(contactPos.x, ALTAR_HEIGHT + 0.35, contactPos.z);
            this.impactFlash.intensity = 9.0;

            // KICK victim flying just outside the board!
            this.kickPieceOffBoard(victim, stancePos, victimPos);

            // Phase 2c: Recoil back to stance
            setTimeout(() => {
              const t2 = performance.now();
              const recoverDuration = 120;

              const doRecover = () => {
                const now3 = performance.now();
                const p3 = Math.min(1, (now3 - t2) / recoverDuration);
                mesh.position.lerpVectors(lungePos, stancePos, p3);
                mesh.rotation.x = 0.28 * (1 - p3);

                if (p3 < 1) {
                  requestAnimationFrame(doRecover);
                } else {
                  mesh.position.copy(stancePos);
                  mesh.rotation.x = 0;
                  if (onKickDone) onKickDone();
                }
              };

              requestAnimationFrame(doRecover);
            }, 100);
          }
        };

        requestAnimationFrame(doStrike);
      }
    };

    requestAnimationFrame(doWindup);
  }

  kickPieceOffBoard(targetEntity, attackerPos, targetPos) {
    if (!targetEntity || !targetEntity.mesh) return;
    const mesh = targetEntity.mesh;

    // Stop skeletal mixer actions if any
    if (targetEntity.mixer) {
      targetEntity.mixer.stopAllAction();
    }

    // Direction from attacker to victim
    let dirX = targetPos.x - attackerPos.x;
    let dirZ = targetPos.z - attackerPos.z;
    const dirLen = Math.hypot(dirX, dirZ) || 0.001;
    dirX /= dirLen;
    dirZ /= dirLen;

    // Outward bias from board center
    const centerDist = Math.hypot(targetPos.x, targetPos.z) || 0.001;
    const outX = targetPos.x / centerDist;
    const outZ = targetPos.z / centerDist;

    let kickX = dirX * 0.55 + outX * 0.65 + (Math.random() - 0.5) * 0.2;
    let kickZ = dirZ * 0.55 + outZ * 0.65 + (Math.random() - 0.5) * 0.2;
    const kickLen = Math.hypot(kickX, kickZ) || 1;
    kickX /= kickLen;
    kickZ /= kickLen;

    // Board boundary: 8 squares * 0.34m = 2.72m (half-size = 1.36m).
    // Target landing is JUST OUTSIDE the board border: distance ~1.62m to 1.82m from center
    const currentDist = Math.hypot(targetPos.x, targetPos.z);
    const neededFlightDist = Math.max(0.55, Math.min(1.05, 1.70 - currentDist));

    const targetLandingX = targetPos.x + kickX * neededFlightDist;
    const targetLandingZ = targetPos.z + kickZ * neededFlightDist;
    const targetLandingY = 0.05; // Cathedral flagstone level

    // Controlled parabolic flight: T = 0.60 seconds
    const T = 0.60;
    const gravity = 12.0;

    const vx = (targetLandingX - targetPos.x) / T;
    const vz = (targetLandingZ - targetPos.z) / T;
    const vy = (targetLandingY - targetPos.y + 0.5 * gravity * T * T) / T;

    const rotVel = new THREE.Vector3(
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 12
    );

    this.kickedPieces.push({
      mesh,
      vel: new THREE.Vector3(vx, vy, vz),
      rotVel,
      bounces: 0,
      isResting: false
    });
  }

  createRuneSigilTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 512, 512);
    const cx = 256;
    const cy = 256;

    // Outer ring
    ctx.strokeStyle = '#ffd76a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 240, 0, Math.PI * 2);
    ctx.stroke();

    // Dotted celestial orbit
    ctx.setLineDash([6, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 224, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Middle circle with 24 radial rune ticks
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 185, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 24; i++) {
      const angle = (i * Math.PI * 2) / 24;
      const x1 = cx + Math.cos(angle) * 185;
      const y1 = cy + Math.sin(angle) * 185;
      const len = i % 3 === 0 ? 30 : 16;
      const x2 = cx + Math.cos(angle) * (185 + len);
      const y2 = cy + Math.sin(angle) * (185 + len);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Double inner octagram / 8-point faceted compass star
    ctx.lineWidth = 2.5;
    for (let s = 0; s < 2; s++) {
      const offset = (s * Math.PI) / 4;
      ctx.beginPath();
      for (let i = 0; i <= 4; i++) {
        const a = offset + (i * Math.PI * 2) / 4;
        const x = cx + Math.cos(a) * 140;
        const y = cy + Math.sin(a) * 140;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Inner core circle and crystal star
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 75, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#fff0ba';
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  triggerVictoryEffect(winningColor) {
    this.clearEndGameEffects();
    this.victoryEffectActive = true;

    const sign = winningColor === 'w' ? -1 : 1;

    // 1. Gently dim surrounding environment lights to accentuate golden radiance
    if (this.ambientLight) this.ambientLight.intensity = 0.45;
    if (this.keyLight) this.keyLight.intensity = 1.1;

    // 2. Powerful golden backlight behind the victorious army producing dramatic rim lighting
    this.victoryBacklight = new THREE.SpotLight(0xffdf78, 0.2, 18, Math.PI / 3.0, 0.45, 1.2);
    this.victoryBacklight.position.set(0, 3.5, sign * 3.6);
    this.victoryBacklight.target.position.set(0, ALTAR_HEIGHT + 0.35, sign * 1.1);
    this.scene.add(this.victoryBacklight);
    this.scene.add(this.victoryBacklight.target);

    // Warm golden rim-light filling the army silhouettes
    this.victoryRimLight = new THREE.PointLight(0xffea9f, 0.5, 7.5, 1.2);
    this.victoryRimLight.position.set(0, ALTAR_HEIGHT + 0.65, sign * 2.1);
    this.scene.add(this.victoryRimLight);

    // 3. Circular Magical Rune Sigil beneath the victorious army
    const sigilTex = this.createRuneSigilTexture();
    const sigilGeo = new THREE.PlaneGeometry(2.4, 2.4);
    sigilGeo.rotateX(-Math.PI / 2);
    const sigilMat = new THREE.MeshBasicMaterial({
      map: sigilTex,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.victorySigil = new THREE.Mesh(sigilGeo, sigilMat);
    this.victorySigil.position.set(0, ALTAR_HEIGHT + 0.005, sign * 0.95);
    this.scene.add(this.victorySigil);

    // 4. Subtle Rising Golden Particles around the pieces
    const pGeo = new THREE.OctahedronGeometry(0.024, 0);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0xffe277,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.victoryParticles = [];
    for (let i = 0; i < 45; i++) {
      const mesh = new THREE.Mesh(pGeo, pMat.clone());
      const x = (Math.random() - 0.5) * 2.2;
      const z = sign * 0.95 + (Math.random() - 0.5) * 1.8;
      const y = ALTAR_HEIGHT + Math.random() * 1.6;
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      this.victoryParticles.push({
        mesh,
        baseX: x,
        baseZ: z,
        velY: 0.22 + Math.random() * 0.38,
        swaySpeed: 1.8 + Math.random() * 2.2,
        swayAmp: 0.012 + Math.random() * 0.018,
        seed: Math.random() * 50,
        minY: ALTAR_HEIGHT + 0.02,
        maxY: ALTAR_HEIGHT + 2.2
      });
    }

    // 5. Stabilize camera framing on the victorious army
    const camZ = sign * 2.45;
    const targetLookZ = sign * 0.35;
    this.activeCamTween = {
      startPos: this.camera.position.clone(),
      endPos: new THREE.Vector3(0, 1.85, camZ),
      startTarget: this.controls.target.clone(),
      endTarget: new THREE.Vector3(0, 0.92, targetLookZ),
      elapsed: 0,
      duration: 1.2
    };
  }

  triggerDefeatEffect(losingColor) {
    this.defeatEffectActive = true;

    // 1. Dim surrounding environment and cast somber shadows
    if (this.ambientLight) this.ambientLight.intensity = 0.35;
    if (this.keyLight) this.keyLight.intensity = 0.85;

    // 2. Identify all surviving pieces of losingColor
    const piecesToCrumble = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const entity = this.pieceEntities[r][c];
        if (entity && entity.color === losingColor && entity.mesh && entity.mesh.visible) {
          piecesToCrumble.push(entity);
        }
      }
    }

    // 3. Schedule micro-tremor followed by fragmentation
    const startTime = this.clock.getElapsedTime();
    this.defeatPiecesShaking = piecesToCrumble.map((entity) => ({
      entity,
      origX: entity.mesh.position.x,
      origZ: entity.mesh.position.z,
      startTime
    }));

    // After 0.35s tremor, crumble pieces into fragments
    setTimeout(() => {
      this.defeatPiecesShaking = [];
      for (const entity of piecesToCrumble) {
        if (!entity.mesh) continue;
        entity.mesh.visible = false;
        this.spawnPieceCrumbleFragments(entity);
      }
    }, 350);

    // Camera gently stabilizes
    const sign = losingColor === 'w' ? -1 : 1;
    this.activeCamTween = {
      startPos: this.camera.position.clone(),
      endPos: new THREE.Vector3(0, 2.05, sign * 2.5),
      startTarget: this.controls.target.clone(),
      endTarget: new THREE.Vector3(0, 0.85, sign * 0.4),
      elapsed: 0,
      duration: 1.2
    };
  }

  spawnPieceCrumbleFragments(entity) {
    const isWhite = entity.color === 'w';
    const basePos = entity.mesh.position;

    // Materials: antique ivory limestone for white, dark chipped iron/obsidian for black
    const mat = isWhite
      ? new THREE.MeshStandardMaterial({
          color: 0xd4cdc0,
          roughness: 0.85,
          metalness: 0.05
        })
      : new THREE.MeshStandardMaterial({
          color: 0x1c1e24,
          roughness: 0.78,
          metalness: 0.32
        });

    const fragmentCount = 12 + Math.floor(Math.random() * 5); // 12 - 16 realistic 3D fragments
    const shardGeos = [
      new THREE.ConeGeometry(0.045, 0.08, 4),
      new THREE.BoxGeometry(0.05, 0.045, 0.05),
      new THREE.TetrahedronGeometry(0.042),
      new THREE.BoxGeometry(0.035, 0.065, 0.035)
    ];

    for (let i = 0; i < fragmentCount; i++) {
      const geo = shardGeos[i % shardGeos.length];
      const mesh = new THREE.Mesh(geo, mat);

      const spawnY = ALTAR_HEIGHT + 0.04 + (i / fragmentCount) * 0.28;
      const spawnX = basePos.x + (Math.random() - 0.5) * 0.08;
      const spawnZ = basePos.z + (Math.random() - 0.5) * 0.08;
      mesh.position.set(spawnX, spawnY, spawnZ);

      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      this.scene.add(mesh);

      // Natural fragmentation physics
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.35 + Math.random() * 0.85;
      this.shatteredFragments.push({
        mesh,
        vel: new THREE.Vector3(
          Math.cos(angle) * speed,
          0.6 + Math.random() * 1.4, // Initial upward hop
          Math.sin(angle) * speed
        ),
        rotVel: new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12
        ),
        bounces: 0,
        isResting: false
      });
    }

    // 4 soft stone dust puffs
    const dustGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const dustMat = new THREE.MeshBasicMaterial({
      color: isWhite ? 0xb5ad9e : 0x5a554c,
      transparent: true,
      opacity: 0.4
    });

    for (let d = 0; d < 4; d++) {
      const dustMesh = new THREE.Mesh(dustGeo, dustMat.clone());
      dustMesh.position.set(
        basePos.x + (Math.random() - 0.5) * 0.1,
        ALTAR_HEIGHT + 0.05,
        basePos.z + (Math.random() - 0.5) * 0.1
      );
      this.scene.add(dustMesh);
      this.dustParticles.push({
        mesh: dustMesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          0.12 + Math.random() * 0.15,
          (Math.random() - 0.5) * 0.2
        ),
        life: 1.2,
        maxLife: 1.2
      });
    }
  }

  clearEndGameEffects() {
    this.victoryEffectActive = false;
    this.defeatEffectActive = false;
    this.defeatPiecesShaking = [];

    // Restore lights
    if (this.ambientLight) this.ambientLight.intensity = this.originalLighting.ambient;
    if (this.keyLight) this.keyLight.intensity = this.originalLighting.key;

    // Remove victory backlight & rimlight
    if (this.victoryBacklight) {
      if (this.victoryBacklight.target) this.scene.remove(this.victoryBacklight.target);
      this.scene.remove(this.victoryBacklight);
      this.victoryBacklight = null;
    }
    if (this.victoryRimLight) {
      this.scene.remove(this.victoryRimLight);
      this.victoryRimLight = null;
    }

    // Remove victory sigil
    if (this.victorySigil) {
      if (this.victorySigil.material?.map) this.victorySigil.material.map.dispose();
      this.victorySigil.material?.dispose();
      this.victorySigil.geometry?.dispose();
      this.scene.remove(this.victorySigil);
      this.victorySigil = null;
    }

    // Remove victory particles
    for (const p of this.victoryParticles) {
      if (p.mesh) {
        p.mesh.geometry?.dispose();
        p.mesh.material?.dispose();
        this.scene.remove(p.mesh);
      }
    }
    this.victoryParticles = [];

    // Remove shattered fragments
    for (const f of this.shatteredFragments) {
      if (f.mesh) {
        f.mesh.geometry?.dispose();
        f.mesh.material?.dispose();
        this.scene.remove(f.mesh);
      }
    }
    this.shatteredFragments = [];

    // Remove dust particles
    for (const d of this.dustParticles) {
      if (d.mesh) {
        d.mesh.geometry?.dispose();
        d.mesh.material?.dispose();
        this.scene.remove(d.mesh);
      }
    }
    this.dustParticles = [];

    // Restore all piece mesh visibilities
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const entity = this.pieceEntities[r][c];
        if (entity && entity.mesh) {
          entity.mesh.visible = true;
        }
      }
    }
  }

  setCameraView(type) {
    let targetPos, targetLookAt;
    const isBlack = this.playerColor === 'b';
    const sideSign = isBlack ? -1 : 1;

    switch (type) {
      case 'player':
        targetPos = new THREE.Vector3(0, 2.22, sideSign * 2.72);
        targetLookAt = new THREE.Vector3(0, 0.85, sideSign * -0.15);
        break;
      case 'top':
        targetPos = new THREE.Vector3(0, 6.85, sideSign * 3.65);
        targetLookAt = new THREE.Vector3(0, 0.78, 0);
        break;
      case 'side':
        targetPos = new THREE.Vector3(2.85, 1.85, 0);
        targetLookAt = new THREE.Vector3(0, 0.84, 0);
        break;
      case 'wide':
        targetPos = new THREE.Vector3(0, 2.55, sideSign * 6.65);
        targetLookAt = new THREE.Vector3(0, 1.95, sideSign * -2.5);
        break;
      case 'home':
        // Dramatic diagonal angle matching reference image concept art
        targetPos = new THREE.Vector3(-1.85, 1.72, 2.12);
        targetLookAt = new THREE.Vector3(0.28, 0.88, -0.15);
        break;
      default:
        return;
    }

    this.activeCamTween = {
      startPos: this.camera.position.clone(),
      endPos: targetPos,
      startTarget: this.controls.target.clone(),
      endTarget: targetLookAt,
      elapsed: 0,
      duration: 0.85
    };
  }

  setGameMode(mode) {
    this.gameMode = mode;
  }

  setAiDifficulty(diff) {
    this.aiDifficulty = diff;
  }

  triggerAIMove(difficulty = this.aiDifficulty) {
    if (this.isBusy || this.gameOver || this.isHomeMode) return;
    const depth = difficulty === 'hard' ? 3 : difficulty === 'easy' ? 1 : 2;
    const bestMove = getBestMoveAI(this.board, this.currentTurn, depth);
    if (bestMove) {
      this.executeMove(bestMove.fromR, bestMove.fromC, bestMove.toR, bestMove.toC);
    }
  }

  resetGame() {
    this.clearEndGameEffects();
    this.board = createInitialBoard();
    this.currentTurn = 'w';
    this.selectedSquare = null;
    this.validMoves = [];
    this.isBusy = false;
    this.gameOver = false;
    this.capturedWhite = 0;
    this.capturedBlack = 0;

    this.clearSelection();
    this.spawnAllPieces();
    this.setCameraView('player');

    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange({
        currentTurn: 'w',
        inCheck: false,
        capturedWhite: 0,
        capturedBlack: 0
      });
    }

    if (this.playerColor === 'b') {
      setTimeout(() => this.triggerAIMove(), 600);
    }
  }

  setPlayerColor(color) {
    this.playerColor = color;
    this.setCameraView('player');
    if (this.currentTurn !== this.playerColor && !this.gameOver) {
      setTimeout(() => this.triggerAIMove(), 600);
    }
  }

  startRenderLoop() {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      const delta = this.clock.getDelta();

      // Update animation mixers
      for (const mixer of this.activeMixers) {
        mixer.update(delta);
      }

      // Kicked pieces physics: flying off board, tumbling, floor bounces
      const FLOOR_Y = 0.05;
      for (let i = 0; i < this.kickedPieces.length; i++) {
        const kp = this.kickedPieces[i];
        if (kp.isResting) continue;

        kp.vel.y -= 11.5 * delta; // Gravity
        kp.mesh.position.addScaledVector(kp.vel, delta);
        kp.mesh.rotation.x += kp.rotVel.x * delta;
        kp.mesh.rotation.y += kp.rotVel.y * delta;
        kp.mesh.rotation.z += kp.rotVel.z * delta;

        // Ground bounce on cathedral stone floor
        if (kp.mesh.position.y <= FLOOR_Y) {
          kp.mesh.position.y = FLOOR_Y;

          if (Math.abs(kp.vel.y) > 0.6 && kp.bounces < 3) {
            kp.bounces++;
            kp.vel.y = -kp.vel.y * 0.42;
            kp.vel.x *= 0.65;
            kp.vel.z *= 0.65;
            kp.rotVel.multiplyScalar(0.6);
            soundManager.playFloorBounce();
          } else {
            kp.vel.set(0, 0, 0);
            kp.rotVel.set(0, 0, 0);
            kp.isResting = true;
            kp.mesh.position.y = FLOOR_Y + 0.04;
          }
        }
      }

      // Cute pieces gentle breathing bounce & playful idle sway
      const elapsed = this.clock.getElapsedTime();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const entity = this.pieceEntities[r][c];
          if (entity && entity.isCute && entity.mesh && !this.isBusy) {
            const seed = entity.idleSeed || 0;
            const bounce = Math.sin(elapsed * 3.2 + seed) * 0.006;
            entity.mesh.position.y = ALTAR_HEIGHT + bounce;
            entity.mesh.rotation.z = Math.sin(elapsed * 2.0 + seed) * 0.035;
          }
        }
      }

      // Kicked pieces flight & settling physics outside the board
      for (let i = this.kickedPieces.length - 1; i >= 0; i--) {
        const kp = this.kickedPieces[i];
        if (!kp.isResting && kp.mesh) {
          kp.vel.y -= 12.0 * delta; // Gravity
          kp.mesh.position.addScaledVector(kp.vel, delta);
          kp.mesh.rotation.x += kp.rotVel.x * delta;
          kp.mesh.rotation.y += kp.rotVel.y * delta;
          kp.mesh.rotation.z += kp.rotVel.z * delta;

          // Cathedral floor level Y = 0.05 (just outside the chessboard)
          if (kp.mesh.position.y <= 0.05) {
            kp.mesh.position.y = 0.05;
            if (kp.bounces === 0 && Math.abs(kp.vel.y) > 0.6) {
              kp.bounces++;
              kp.vel.y = -kp.vel.y * 0.28;
              kp.vel.x *= 0.45;
              kp.vel.z *= 0.45;
              kp.rotVel.multiplyScalar(0.4);
              soundManager.playFloorBounce();
            } else {
              kp.isResting = true;
              kp.vel.set(0, 0, 0);
              kp.rotVel.set(0, 0, 0);
              kp.mesh.rotation.x = Math.PI * 0.42; // Resting pose
            }
          }
        }
      }

      // Hit impact sparks & expanding shockwave ring
      for (let i = this.hitSparks.length - 1; i >= 0; i--) {
        const s = this.hitSparks[i];
        s.life -= delta;
        if (s.type === 'ring') {
          const p = 1 - Math.max(0, s.life / s.maxLife);
          const curScale = 1.0 + (s.maxScale - 1.0) * p;
          s.mesh.scale.set(curScale, curScale, curScale);
          if (s.mat) s.mat.opacity = Math.max(0, 0.95 * (1 - p));
        } else if (s.type === 'spark') {
          s.vel.y -= 9.8 * delta;
          s.mesh.position.addScaledVector(s.vel, delta);
          s.mesh.scale.multiplyScalar(0.92);
        }

        if (s.life <= 0) {
          this.scene.remove(s.mesh);
          this.hitSparks.splice(i, 1);
        }
      }

      // Debris particle physics (if any)
      for (let i = this.debrisParticles.length - 1; i >= 0; i--) {
        const p = this.debrisParticles[i];
        p.life -= delta;
        p.vel.y -= 9.8 * delta; // Gravity
        p.mesh.position.addScaledVector(p.vel, delta);
        p.mesh.rotation.x += p.rotVel.x * delta;
        p.mesh.rotation.y += p.rotVel.y * delta;

        // Ground bounce on altar
        if (p.mesh.position.y < ALTAR_HEIGHT && p.vel.y < 0) {
          p.vel.y = -p.vel.y * 0.45;
          p.vel.x *= 0.65;
          p.vel.z *= 0.65;
        }

        if (p.life <= 0) {
          this.scene.remove(p.mesh);
          this.debrisParticles.splice(i, 1);
        }
      }

      // Victory effect active updates
      if (this.victoryEffectActive) {
        if (this.victoryBacklight) {
          if (this.victoryBacklight.intensity < 4.2) {
            this.victoryBacklight.intensity = THREE.MathUtils.lerp(this.victoryBacklight.intensity, 4.5, delta * 2.2);
          } else {
            this.victoryBacklight.intensity = 4.2 + Math.sin(elapsed * 2.5) * 0.45;
          }
        }
        if (this.victoryRimLight) {
          if (this.victoryRimLight.intensity < 2.5) {
            this.victoryRimLight.intensity = THREE.MathUtils.lerp(this.victoryRimLight.intensity, 2.8, delta * 2.5);
          }
        }
        if (this.victorySigil) {
          this.victorySigil.rotation.z += 0.005;
          if (this.victorySigil.material && this.victorySigil.material.opacity < 0.85) {
            this.victorySigil.material.opacity = Math.min(0.85, this.victorySigil.material.opacity + delta * 0.65);
          }
        }
        for (const p of this.victoryParticles) {
          p.mesh.position.y += p.velY * delta;
          const sway = Math.sin(elapsed * p.swaySpeed + p.seed) * p.swayAmp;
          p.mesh.position.x = p.baseX + sway;
          p.mesh.position.z = p.baseZ + Math.cos(elapsed * p.swaySpeed + p.seed) * p.swayAmp;
          p.mesh.rotation.y += 1.5 * delta;
          p.mesh.rotation.x += 1.0 * delta;

          if (p.mesh.position.y > p.maxY) {
            p.mesh.position.y = p.minY;
          }
        }
      }

      // Defeat shudder phase
      if (this.defeatPiecesShaking && this.defeatPiecesShaking.length > 0) {
        for (const s of this.defeatPiecesShaking) {
          if (s.entity && s.entity.mesh && s.entity.mesh.visible) {
            const shake = Math.sin((elapsed - s.startTime) * 75) * 0.007;
            s.entity.mesh.position.x = s.origX + shake;
          }
        }
      }

      // Shattered fragments physics
      for (let i = 0; i < this.shatteredFragments.length; i++) {
        const f = this.shatteredFragments[i];
        if (f.isResting) continue;

        f.vel.y -= 9.8 * delta; // Gravity
        f.mesh.position.addScaledVector(f.vel, delta);
        f.mesh.rotation.x += f.rotVel.x * delta;
        f.mesh.rotation.y += f.rotVel.y * delta;
        f.mesh.rotation.z += f.rotVel.z * delta;

        // Bounce on altar floor
        if (f.mesh.position.y <= ALTAR_HEIGHT + 0.015) {
          f.mesh.position.y = ALTAR_HEIGHT + 0.015;
          if (Math.abs(f.vel.y) > 0.35 && f.bounces < 2) {
            f.bounces++;
            f.vel.y = -f.vel.y * 0.32;
            f.vel.x *= 0.6;
            f.vel.z *= 0.6;
            f.rotVel.multiplyScalar(0.5);
          } else {
            f.isResting = true;
            f.vel.set(0, 0, 0);
            f.rotVel.set(0, 0, 0);
          }
        }
      }

      // Dust puffs
      for (let i = this.dustParticles.length - 1; i >= 0; i--) {
        const d = this.dustParticles[i];
        d.life -= delta;
        d.mesh.position.addScaledVector(d.vel, delta);
        d.mesh.scale.multiplyScalar(1.0 + delta * 1.8);
        if (d.mesh.material) {
          d.mesh.material.opacity = Math.max(0, 0.4 * (d.life / d.maxLife));
        }
        if (d.life <= 0) {
          this.scene.remove(d.mesh);
          this.dustParticles.splice(i, 1);
        }
      }

      // Flash light decay
      if (this.impactFlash.intensity > 0) {
        this.impactFlash.intensity = Math.max(0, this.impactFlash.intensity - delta * 20);
      }

      // Camera tween
      if (this.activeCamTween) {
        const tween = this.activeCamTween;
        tween.elapsed += delta;
        const progress = Math.min(1, tween.elapsed / tween.duration);
        const ease = easeInOutCubic(progress);

        this.camera.position.lerpVectors(tween.startPos, tween.endPos, ease);
        this.controls.target.lerpVectors(tween.startTarget, tween.endTarget, ease);

        if (progress >= 1) {
          this.activeCamTween = null;
        }
      }

      // Home screen cinematic gentle breathing camera drift
      if (this.isHomeMode && !this.activeCamTween) {
        const driftX = Math.sin(elapsed * 0.35) * 0.08;
        const driftY = Math.sin(elapsed * 0.48) * 0.04;
        const driftZ = Math.cos(elapsed * 0.28) * 0.06;
        this.camera.position.set(-1.85 + driftX, 1.72 + driftY, 2.12 + driftZ);
        this.controls.target.set(0.28, 0.88 + driftY * 0.35, -0.15);
      }

      // Camera shake
      if (this.cameraShake > 0) {
        this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
        this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
        this.cameraShake = Math.max(0, this.cameraShake - delta * 0.15);
      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  destroy() {
    this.clearEndGameEffects();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
