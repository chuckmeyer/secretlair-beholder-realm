'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import styles from './Game.module.css'

// Define eye stalk positions but let angles be calculated
const EYE_STALKS = [
  { top: '32%', left: '28%', color: '#ff0000' },    // Red, upper left
  { top: '22%', left: '38%', color: '#00ff00' },    // Green, top left
  { top: '18%', left: '52%', color: '#0000ff' },    // Blue, top
  { top: '22%', left: '65%', color: '#ff00ff' },    // Magenta, top right
  { top: '32%', left: '75%', color: '#ffff00' },    // Yellow, right
  { top: '42%', left: '25%', color: '#00ffff' },    // Cyan, left
];

// Difficulty settings
const DIFFICULTY_LEVELS = [
  { beamDelay: { min: 2000, max: 10000 }, warningDuration: 200, floatSpeed: 6 },
  { beamDelay: { min: 1500, max: 8000 }, warningDuration: 150, floatSpeed: 5 },
  { beamDelay: { min: 1000, max: 6000 }, warningDuration: 100, floatSpeed: 4 },
  { beamDelay: { min: 800, max: 4000 }, warningDuration: 75, floatSpeed: 3 },
  { beamDelay: { min: 600, max: 3000 }, warningDuration: 50, floatSpeed: 2 },
];

// Add type definitions for Fullscreen API
interface FullscreenDocument extends Document {
  webkitFullscreenElement: Element | null;
  mozFullScreenElement: Element | null;
  msFullscreenElement: Element | null;
  webkitExitFullscreen: () => Promise<void>;
  mozCancelFullScreen: () => Promise<void>;
  msExitFullscreen: () => Promise<void>;
}

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen: () => Promise<void>;
  mozRequestFullScreen: () => Promise<void>;
  msRequestFullscreen: () => Promise<void>;
  webkitEnterFullscreen?: () => Promise<void>;
}

// Add iOS-specific types
interface WebKitFullscreenElement extends HTMLElement {
  webkitEnterFullscreen?: () => Promise<void>;
  webkitExitFullscreen?: () => Promise<void>;
  webkitDisplayingFullscreen?: boolean;
}

export default function Game() {
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const beholderRef = useRef<HTMLDivElement>(null)
  const [isWarningFlash, setIsWarningFlash] = useState<boolean>(false)
  const [activeEyeStalk, setActiveEyeStalk] = useState<typeof EYE_STALKS[0] | null>(null)
  const [isBeamActive, setIsBeamActive] = useState<boolean>(false)
  const [beamStyle, setBeamStyle] = useState<{ angle: number, length: number } | null>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const [canBlock, setCanBlock] = useState<boolean>(false)
  const [blockedCount, setBlockedCount] = useState<number>(0)
  const [isGameOver, setIsGameOver] = useState<boolean>(false)
  const [difficultyLevel, setDifficultyLevel] = useState<number>(0)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const gameCanvasRef = useRef<HTMLDivElement>(null)
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false)

  // Add refs for our timers
  const beamTimerRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const impactTimerRef = useRef<NodeJS.Timeout | null>(null)
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Add new state for tracking if player's shield is active
  const shieldTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Add new state for controlling restart availability
  const [canRestart, setCanRestart] = useState<boolean>(false)

  // Add state for tracking if the spacebar is being held down
  const [isSpacebarDown, setIsSpacebarDown] = useState<boolean>(false)

  // Add state to track animation key
  const [animationKey, setAnimationKey] = useState<number>(0)

  // Add a new state for the visual effect
  const [isShieldAnimating, setIsShieldAnimating] = useState<boolean>(false)

  // Add state for score animation
  const [scoreAnimationKey, setScoreAnimationKey] = useState<number>(0)
  const [isScoreAnimating, setIsScoreAnimating] = useState<boolean>(false)

  // Add state for level animation
  const [levelAnimationKey, setLevelAnimationKey] = useState<number>(0)
  const [isLevelAnimating, setIsLevelAnimating] = useState<boolean>(false)

  // Add state for frame flash
  const [isFrameFlashing, setIsFrameFlashing] = useState<boolean>(false)

  // Add a new ref for shootBeam
  const shootBeamRef = useRef<() => void>(() => {})

  // Add effect to detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window)
  }, [])

  // Clear all timers helper
  const clearAllTimers = useCallback(() => {
    if (beamTimerRef.current) clearTimeout(beamTimerRef.current)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (impactTimerRef.current) clearTimeout(impactTimerRef.current)
    if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current)
    if (shieldTimerRef.current) {
      clearTimeout(shieldTimerRef.current)
      shieldTimerRef.current = null
    }
  }, [])

  // Get current difficulty settings
  const getCurrentDifficulty = useCallback(() => {
    return DIFFICULTY_LEVELS[Math.min(difficultyLevel, DIFFICULTY_LEVELS.length - 1)]
  }, [difficultyLevel])

  // Declare shootBeam and scheduleNextBeam with proper types
  const scheduleNextBeam = useCallback((): void => {
    if (isGameOver) return
    clearAllTimers() // Clear any existing timers before scheduling new one
    const currentDifficulty = getCurrentDifficulty()
    const delay = Math.random() * (currentDifficulty.beamDelay.max - currentDifficulty.beamDelay.min) + currentDifficulty.beamDelay.min
    beamTimerRef.current = setTimeout(() => shootBeamRef.current?.(), delay)
  }, [isGameOver, clearAllTimers, getCurrentDifficulty])

  const shootBeam = useCallback((): void => {
    if (isGameOver) return

    const eyeStalk = EYE_STALKS[Math.floor(Math.random() * EYE_STALKS.length)]
    setIsWarningFlash(true)
    setActiveEyeStalk(eyeStalk)
    
    // Set the beam color as a CSS variable
    if (gameAreaRef.current) {
      gameAreaRef.current.style.setProperty('--beam-color', eyeStalk.color);
      gameAreaRef.current.style.setProperty('--flash-color', eyeStalk.color);
    }
    
    const currentDifficulty = getCurrentDifficulty()
    
    warningTimerRef.current = setTimeout(() => {
      if (isGameOver) return
      setIsWarningFlash(false)
      setIsBeamActive(true)
      setCanBlock(true)
      setIsFrameFlashing(true)
      
      // Beam hit check
      impactTimerRef.current = setTimeout(() => {
        setCanBlock(prev => {
          if (prev) { // If still can block, player missed
            setIsGameOver(true)
            setTimeout(() => {
              setCanRestart(true)
            }, 1000) // Wait 1 second before allowing restart
            return false
          }
          return prev
        })
      }, 150)

      // Clean up beam
      cleanupTimerRef.current = setTimeout(() => {
        setIsBeamActive(false)
        setActiveEyeStalk(null)
        setCanBlock(false)
        setIsFrameFlashing(false)
        if (!isGameOver) {
          scheduleNextBeam()
        }
      }, 200)
    }, currentDifficulty.warningDuration)
  }, [isGameOver, getCurrentDifficulty, scheduleNextBeam])

  // Store the shootBeam function in the ref
  useEffect(() => {
    shootBeamRef.current = shootBeam
  }, [shootBeam])

  // Game initialization
  useEffect(() => {
    if (!isGameOver) {
      scheduleNextBeam()
    } else {
      clearAllTimers() // Clear all timers when game is over
    }

    return () => {
      clearAllTimers() // Clear all timers on cleanup
      setIsWarningFlash(false)
      setIsBeamActive(false)
      setActiveEyeStalk(null)
      setCanBlock(false)
    }
  }, [isGameOver, scheduleNextBeam, clearAllTimers])

  // Update difficulty level when blocked count changes
  useEffect(() => {
    const newLevel = Math.floor(blockedCount / 5)
    if (newLevel !== difficultyLevel) {
      setDifficultyLevel(newLevel)
      // Update CSS variable for float animation speed
      if (gameAreaRef.current) {
        const currentDifficulty = DIFFICULTY_LEVELS[Math.min(newLevel, DIFFICULTY_LEVELS.length - 1)]
        gameAreaRef.current.style.setProperty('--float-duration', `${currentDifficulty.floatSpeed}s`)
      }
      // Trigger level animation
      setIsLevelAnimating(true)
      setLevelAnimationKey(prev => prev + 1)
      setTimeout(() => {
        setIsLevelAnimating(false)
      }, 1000)
    }
  }, [blockedCount, difficultyLevel])

  // Split the keypress handler into keydown and keyup handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !isSpacebarDown) {
        setIsSpacebarDown(true)
        
        if (isGameOver && canRestart) {
          // Reset all game states
          setIsGameOver(false)
          setCanRestart(false)  // Reset the restart flag
          setBlockedCount(0)
          setDifficultyLevel(0)  // Reset difficulty level
          setIsWarningFlash(false)
          setIsBeamActive(false)
          setActiveEyeStalk(null)
          setCanBlock(false)
          setIsShieldAnimating(false)
          setAnimationKey(prev => prev + 1)
          setIsSpacebarDown(false)  // Reset spacebar state too
          setBeamStyle(null)
          clearAllTimers()
          if (shieldTimerRef.current) {
            clearTimeout(shieldTimerRef.current)
            shieldTimerRef.current = null
          }
          setTimeout(() => {
            scheduleNextBeam()
          }, 100)
        } else if (!isGameOver) {
          // Clear any existing shield timer
          if (shieldTimerRef.current) {
            clearTimeout(shieldTimerRef.current)
            shieldTimerRef.current = null
          }
          
          // Activate shield and animation
          setIsShieldAnimating(true)
          setAnimationKey(prev => prev + 1)
          
          // Check for block immediately
          if (canBlock) {
            setBlockedCount(prev => prev + 1)
            setCanBlock(false)
            setIsScoreAnimating(true)  // Start score animation
            setScoreAnimationKey(prev => prev + 1)  // Force animation restart
            
            // Reset score animation after it completes
            setTimeout(() => {
              setIsScoreAnimating(false)
            }, 1000)
          }

          // Set shield timer to deactivate after 1 second
          shieldTimerRef.current = setTimeout(() => {
            setIsShieldAnimating(false)
          }, 1000)
        }
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setIsSpacebarDown(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      if (shieldTimerRef.current) {
        clearTimeout(shieldTimerRef.current)
        shieldTimerRef.current = null
      }
    }
  }, [canBlock, isGameOver, canRestart, scheduleNextBeam, clearAllTimers, isSpacebarDown])

  // Continuously update beam position during animation
  useEffect(() => {
    const updateBeamPosition = () => {
      if (activeEyeStalk && gameAreaRef.current && beholderRef.current) {
        const gameRect = gameAreaRef.current.getBoundingClientRect()

        // Get eye stalk position in pixels
        const eyeX = parseFloat(activeEyeStalk.left) / 100 * gameRect.width
        const eyeY = parseFloat(activeEyeStalk.top) / 100 * gameRect.height

        // Target point is at bottom center
        const targetX = gameRect.width / 2
        const targetY = gameRect.height

        // Calculate angle and length for the beam
        const deltaX = targetX - eyeX
        const deltaY = targetY - eyeY
        const angle = (Math.atan2(deltaY, deltaX) * (180 / Math.PI)) - 90
        
        // Add a small buffer to the length to ensure beams reach the bottom
        const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY) + 20

        setBeamStyle({ angle, length })
      }
      animationFrameRef.current = requestAnimationFrame(updateBeamPosition)
    }

    if (isBeamActive) {
      animationFrameRef.current = requestAnimationFrame(updateBeamPosition)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isBeamActive, activeEyeStalk])

  // At the top of the component, add a useEffect to set up the fog animation
  useEffect(() => {
    // Set random starting points for each fog layer
    const root = document.documentElement;
    root.style.setProperty('--fog1-start', `${Math.random() * 360}deg`);
    root.style.setProperty('--fog2-start', `${Math.random() * 360}deg`);
    root.style.setProperty('--fog3-start', `${Math.random() * 360}deg`);
  }, []); // Empty dependency array so it only runs once

  // Add effect to set up touch event listeners with passive: false
  useEffect(() => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    const touchStartHandler = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(`.${styles.fullscreenButton}`)) {
        return;
      }
      e.preventDefault();
      
      if (!isSpacebarDown) {
        setIsSpacebarDown(true)
        
        if (isGameOver && canRestart) {
          // Reset all game states
          setIsGameOver(false)
          setCanRestart(false)
          setBlockedCount(0)
          setDifficultyLevel(0)
          setIsWarningFlash(false)
          setIsBeamActive(false)
          setActiveEyeStalk(null)
          setCanBlock(false)
          setIsShieldAnimating(false)
          setAnimationKey(prev => prev + 1)
          setIsSpacebarDown(false)
          setBeamStyle(null)
          clearAllTimers()
          if (shieldTimerRef.current) {
            clearTimeout(shieldTimerRef.current)
            shieldTimerRef.current = null
          }
          setTimeout(() => {
            scheduleNextBeam()
          }, 100)
          return
        }

        if (!isGameOver) {
          // Clear any existing shield timer
          if (shieldTimerRef.current) {
            clearTimeout(shieldTimerRef.current)
            shieldTimerRef.current = null
          }
          
          // Activate shield and animation
          setIsShieldAnimating(true)
          setAnimationKey(prev => prev + 1)
          
          // Check for block immediately
          if (canBlock) {
            setBlockedCount(prev => prev + 1)
            setCanBlock(false)
            setIsScoreAnimating(true)  // Start score animation
            setScoreAnimationKey(prev => prev + 1)  // Force animation restart
            
            // Reset score animation after it completes
            setTimeout(() => {
              setIsScoreAnimating(false)
            }, 1000)
          }

          // Set shield timer to deactivate after 1 second
          shieldTimerRef.current = setTimeout(() => {
            setIsShieldAnimating(false)
          }, 1000)
        }
      }
    };

    const touchEndHandler = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(`.${styles.fullscreenButton}`)) {
        return;
      }
      e.preventDefault();
      setIsSpacebarDown(false)
    };

    const touchMoveHandler = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.fullscreenButton}`)) {
        e.preventDefault();
      }
    };

    // Add touch event listeners with passive: false
    gameArea.addEventListener('touchstart', touchStartHandler, { passive: false });
    gameArea.addEventListener('touchend', touchEndHandler, { passive: false });
    gameArea.addEventListener('touchmove', touchMoveHandler, { passive: false });

    return () => {
      gameArea.removeEventListener('touchstart', touchStartHandler);
      gameArea.removeEventListener('touchend', touchEndHandler);
      gameArea.removeEventListener('touchmove', touchMoveHandler);
    };
  }, [isSpacebarDown, isGameOver, canRestart, canBlock, clearAllTimers, scheduleNextBeam]);

  const toggleFullscreen = async () => {
    if (!gameCanvasRef.current) return;

    try {
      if (isFullscreen) {
        const doc = document as FullscreenDocument;
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
        // Exit presentation mode for iOS
        const webkitElement = gameCanvasRef.current as WebKitFullscreenElement;
        if (webkitElement.webkitExitFullscreen) {
          await webkitElement.webkitExitFullscreen();
        }
      } else {
        const element = gameCanvasRef.current as unknown as FullscreenElement;
        const webkitElement = gameCanvasRef.current as WebKitFullscreenElement;
        
        // Try iOS-specific presentation mode first
        if (webkitElement.webkitEnterFullscreen) {
          try {
            await webkitElement.webkitEnterFullscreen();
            setIsFullscreen(true);
            return;
          } catch {
            console.log('iOS presentation mode failed, falling back to standard fullscreen');
          }
        }

        // Fall back to standard methods
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Update fullscreen change listener to handle iOS presentation mode
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as FullscreenDocument;
      const isInFullscreen = !!document.fullscreenElement || 
                            !!doc.webkitFullscreenElement || 
                            !!doc.mozFullScreenElement || 
                            !!doc.msFullscreenElement;
      
      // Check for iOS presentation mode
      const webkitElement = gameCanvasRef.current as WebKitFullscreenElement;
      const isInPresentationMode = webkitElement?.webkitDisplayingFullscreen;
      
      setIsFullscreen(isInFullscreen || !!isInPresentationMode);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    // Add iOS-specific event listener
    const currentCanvas = gameCanvasRef.current;
    if (currentCanvas) {
      currentCanvas.addEventListener('webkitbeginfullscreen', handleFullscreenChange);
      currentCanvas.addEventListener('webkitendfullscreen', handleFullscreenChange);
    }
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      
      if (currentCanvas) {
        currentCanvas.removeEventListener('webkitbeginfullscreen', handleFullscreenChange);
        currentCanvas.removeEventListener('webkitendfullscreen', handleFullscreenChange);
      }
    };
  }, []);

  return (
    <div 
      ref={gameAreaRef} 
      className={`${styles.gameArea} ${isFrameFlashing ? styles.frameFlash : ''}`}
    >
      <button 
        onClick={toggleFullscreen}
        className={styles.fullscreenButton}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? "⤓" : "⤢"}
      </button>
      <div 
        ref={gameCanvasRef} 
        className={`${styles.gameCanvas} ${isWarningFlash ? styles.warningFlash : ''}`}
      >
        <div className={styles.backgroundLayer}>
          <Image
            src="/images/beholder_lair.png"
            alt="Beholder's Lair Background"
            fill
            priority
            className={styles.backgroundImageContent}
          />
          <div className={styles.fogContainer}>
            <div className={styles.fogLayer1} />
            <div className={styles.fogLayer2} />
            <div className={styles.fogLayer3} />
          </div>
        </div>
        <div ref={beholderRef} className={styles.beholder}>
          <Image 
            src={isGameOver ? "/images/beholder_closed.png" : "/images/beholder_blink_loop.gif"} 
            alt="Beholder"
            width={300}
            height={300}
            priority
            className={styles.beholderImage}
          />
          {activeEyeStalk && isBeamActive && (
            <>
              <div 
                className={styles.eyeGlow}
                style={{
                  top: activeEyeStalk.top,
                  left: activeEyeStalk.left,
                  background: `radial-gradient(circle, ${activeEyeStalk.color}dd 0%, ${activeEyeStalk.color}88 30%, ${activeEyeStalk.color}44 60%, transparent 100%)`
                }}
              />
              <div 
                className={styles.beamContainer}
                style={{
                  top: activeEyeStalk.top,
                  left: activeEyeStalk.left,
                }}
              >
                <div 
                  className={styles.eyeBeam}
                  style={{
                    height: `${beamStyle?.length}px`,
                    background: activeEyeStalk.color
                  }}
                />
              </div>
            </>
          )}
        </div>
        <div className={styles.shadow} />
        <div className={styles.whiteFogOverlay} />
        {isGameOver && (
          <div className={styles.gameOverOverlay}>
            <div className={styles.gameOverText}>Game Over</div>
            {canRestart && (
              <div className={styles.retryText}>
                {isTouchDevice ? 'Tap to retry' : 'Press SPACE to retry'}
              </div>
            )}
          </div>
        )}
        <div className={styles.levelContainer}>
          <div 
            key={levelAnimationKey}
            className={`${styles.levelContent} ${isLevelAnimating ? styles.scoreAnimate : ''}`}
          >
            Level: {difficultyLevel + 1}
          </div>
        </div>
        <div className={styles.scoreContainer}>
          <div 
            key={scoreAnimationKey}
            className={`${styles.scoreContent} ${isScoreAnimating ? styles.scoreAnimate : ''}`}
          >
            Blocked: {blockedCount}
          </div>
        </div>
        <div 
          key={animationKey}
          className={`${styles.shieldIndicator} ${isShieldAnimating ? styles.shieldActive : ''}`}
        >
          <div className={styles.shieldText}>
            {isTouchDevice ? 'Tap to block beams' : 'Press SPACE to block beams'}
          </div>
        </div>
      </div>
    </div>
  )
}