'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import styles from './Game.module.css'
import FogBackground from './FogBackground'

// Define eye stalk positions but let angles be calculated
const EYE_STALKS = [
  { top: '32%', left: '28%', color: '#ff0000' },    // Red, upper left
  { top: '22%', left: '38%', color: '#00ff00' },    // Green, top left
  { top: '18%', left: '52%', color: '#0000ff' },    // Blue, top
  { top: '22%', left: '65%', color: '#ff00ff' },    // Magenta, top right
  { top: '32%', left: '75%', color: '#ffff00' },    // Yellow, right
  { top: '42%', left: '25%', color: '#00ffff' },    // Cyan, left
];

// Calculate target point (bottom center)
const TARGET_POINT = { x: 50, y: 100 };

export default function Game() {
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const beholderRef = useRef<HTMLDivElement>(null)
  const [isWarningFlash, setIsWarningFlash] = useState(false)
  const [isImpactFlash, setIsImpactFlash] = useState(false)
  const [activeEyeStalk, setActiveEyeStalk] = useState<typeof EYE_STALKS[0] | null>(null)
  const [isBeamActive, setIsBeamActive] = useState(false)
  const [beamStyle, setBeamStyle] = useState<{ angle: number, length: number } | null>(null)
  const animationFrameRef = useRef<number>()
  const [canBlock, setCanBlock] = useState(false)
  const [blockedCount, setBlockedCount] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)

  // Add refs for our timers
  const beamTimerRef = useRef<NodeJS.Timeout>()
  const warningTimerRef = useRef<NodeJS.Timeout>()
  const impactTimerRef = useRef<NodeJS.Timeout>()
  const cleanupTimerRef = useRef<NodeJS.Timeout>()

  // Add new state for tracking if player's shield is active
  const [isShieldActive, setIsShieldActive] = useState(false)
  const shieldTimerRef = useRef<NodeJS.Timeout>()

  // Add new state for controlling restart availability
  const [canRestart, setCanRestart] = useState(false)

  // Add state for tracking if the spacebar is being held down
  const [isSpacebarDown, setIsSpacebarDown] = useState(false)

  // Add state to track animation key
  const [animationKey, setAnimationKey] = useState(0)

  // Add a new state for the visual effect
  const [isShieldAnimating, setIsShieldAnimating] = useState(false)

  // Add state for score animation
  const [scoreAnimationKey, setScoreAnimationKey] = useState(0)
  const [isScoreAnimating, setIsScoreAnimating] = useState(false)

  // Add new state for frame flash
  const [frameFlashKey, setFrameFlashKey] = useState(0)

  // Clear all timers helper
  const clearAllTimers = useCallback(() => {
    if (beamTimerRef.current) clearTimeout(beamTimerRef.current)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (impactTimerRef.current) clearTimeout(impactTimerRef.current)
    if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current)
    if (shieldTimerRef.current) {
      clearTimeout(shieldTimerRef.current)
      shieldTimerRef.current = undefined
      setIsShieldActive(false)  // Ensure shield is deactivated when clearing timers
    }
  }, [])

  const shootBeam = useCallback(() => {
    if (isGameOver) return

    const eyeStalk = EYE_STALKS[Math.floor(Math.random() * EYE_STALKS.length)]
    setIsWarningFlash(true)
    setActiveEyeStalk(eyeStalk)
    
    // Set the beam color as a CSS variable
    if (gameAreaRef.current) {
      gameAreaRef.current.style.setProperty('--beam-color', eyeStalk.color);
    }
    
    warningTimerRef.current = setTimeout(() => {
      if (isGameOver) return
      setIsWarningFlash(false)
      setIsBeamActive(true)
      setCanBlock(true)
      setFrameFlashKey(prev => prev + 1) // Trigger frame flash animation
      
      // Beam hit check
      impactTimerRef.current = setTimeout(() => {
        setCanBlock(prev => {
          if (prev) { // If still can block, player missed
            setIsGameOver(true)
            setIsImpactFlash(true)
            setTimeout(() => setIsImpactFlash(false), 50)
            // Add delay before allowing restart
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
        if (!isGameOver) {
          scheduleNextBeam()
        }
      }, 200)
    }, 300)
  }, [isGameOver])

  const scheduleNextBeam = useCallback(() => {
    if (isGameOver) return
    clearAllTimers() // Clear any existing timers before scheduling new one
    const delay = Math.random() * 8000 + 2000  // Random delay between 2000ms (2s) and 10000ms (10s)
    beamTimerRef.current = setTimeout(shootBeam, delay)
  }, [isGameOver, clearAllTimers, shootBeam])

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
      setIsImpactFlash(false)
      setIsBeamActive(false)
      setActiveEyeStalk(null)
      setCanBlock(false)
    }
  }, [isGameOver, scheduleNextBeam, clearAllTimers])

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
          setIsWarningFlash(false)
          setIsImpactFlash(false)
          setIsBeamActive(false)
          setActiveEyeStalk(null)
          setCanBlock(false)
          setIsShieldActive(false)
          setIsSpacebarDown(false)  // Reset spacebar state too
          setBeamStyle(null)
          clearAllTimers()
          if (shieldTimerRef.current) {
            clearTimeout(shieldTimerRef.current)
          }
          setTimeout(() => {
            scheduleNextBeam()
          }, 100)
        } else if (!isGameOver) {
          // Clear any existing shield timer
          if (shieldTimerRef.current) {
            clearTimeout(shieldTimerRef.current)
            shieldTimerRef.current = undefined
          }
          
          // Activate shield and animation
          setIsShieldActive(true)
          setIsShieldAnimating(true)
          setAnimationKey(prev => prev + 1)
          
          // Check for block immediately
          if (canBlock) {
            setBlockedCount(prev => prev + 1)
            setCanBlock(false)
            setIsImpactFlash(true)
            setIsScoreAnimating(true)  // Start score animation
            setScoreAnimationKey(prev => prev + 1)  // Force animation restart
            
            // Reset score animation after it completes
            setTimeout(() => {
              setIsScoreAnimating(false)
            }, 1000)
            
            setTimeout(() => setIsImpactFlash(false), 50)
          }

          // Set shield timer to deactivate after 1 second
          shieldTimerRef.current = setTimeout(() => {
            setIsShieldActive(false)
            shieldTimerRef.current = undefined
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
        shieldTimerRef.current = undefined
        setIsShieldActive(false)  // Ensure shield is deactivated on cleanup
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

        // Target point is at bottom center, 10px from bottom
        const targetX = gameRect.width / 2
        const targetY = gameRect.height - 10  // Adjusted to match new shield position

        // Calculate angle and length for the beam
        const deltaX = targetX - eyeX
        const deltaY = targetY - eyeY
        const angle = (Math.atan2(deltaY, deltaX) * (180 / Math.PI)) - 90
        const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

        // Set the beam angle as a CSS variable
        if (gameAreaRef.current) {
          gameAreaRef.current.style.setProperty('--beam-angle', `${angle}deg`)
        }

        setBeamStyle({ angle, length })
      }
      animationFrameRef.current = requestAnimationFrame(updateBeamPosition)
    }

    if (isBeamActive) {
      updateBeamPosition()
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isBeamActive, activeEyeStalk])

  // Add cleanup for shield timer in the game reset
  const resetGame = () => {
    setIsGameOver(false)
    setCanRestart(false)
    setBlockedCount(0)
    setIsWarningFlash(false)
    setIsImpactFlash(false)
    setIsBeamActive(false)
    setActiveEyeStalk(null)
    setCanBlock(false)
    setIsShieldActive(false)
    setIsSpacebarDown(false)  // Reset spacebar state too
    setBeamStyle(null)
    clearAllTimers()
    setTimeout(() => {
      scheduleNextBeam()
    }, 100)
  }

  // At the top of the component, add a useEffect to set up the fog animation
  useEffect(() => {
    // Set random starting points for each fog layer
    const root = document.documentElement;
    root.style.setProperty('--fog1-start', `${Math.random() * 360}deg`);
    root.style.setProperty('--fog2-start', `${Math.random() * 360}deg`);
    root.style.setProperty('--fog3-start', `${Math.random() * 360}deg`);
  }, []); // Empty dependency array so it only runs once

  return (
    <div ref={gameAreaRef} className={`${styles.gameArea} ${isWarningFlash ? styles.warningFlash : ''} ${isBeamActive ? styles.frameFlash : ''}`}>
      <div className={styles.backgroundLayer}>
        <div className={styles.fogContainer}>
          <div className={styles.fogLayer1} />
          <div className={styles.fogLayer2} />
          <div className={styles.fogLayer3} />
        </div>
      </div>
      <div ref={beholderRef} className={styles.beholder}>
        <img 
          src={isGameOver ? "/images/beholder_closed.png" : "/images/beholder_blink_loop.gif"} 
          alt="Beholder" 
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
      {isGameOver && (
        <div className={styles.gameOverOverlay}>
          <div className={styles.gameOverText}>Game Over</div>
          {canRestart && <div className={styles.retryText}>Press SPACE to retry</div>}
        </div>
      )}
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
      />
    </div>
  )
} 