'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
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

  // Clear all timers helper
  const clearAllTimers = useCallback(() => {
    if (beamTimerRef.current) clearTimeout(beamTimerRef.current)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (impactTimerRef.current) clearTimeout(impactTimerRef.current)
    if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current)
  }, [])

  const shootBeam = useCallback(() => {
    if (isGameOver) return

    const eyeStalk = EYE_STALKS[Math.floor(Math.random() * EYE_STALKS.length)]
    setIsWarningFlash(true)
    setActiveEyeStalk(eyeStalk)
    
    warningTimerRef.current = setTimeout(() => {
      if (isGameOver) return
      setIsWarningFlash(false)
      setIsBeamActive(true)
      setCanBlock(true)
      
      // Beam hit check
      impactTimerRef.current = setTimeout(() => {
        setCanBlock(prev => {
          if (prev) { // If still can block, player missed
            setIsGameOver(true)
            setIsImpactFlash(true)
            setTimeout(() => setIsImpactFlash(false), 50)
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

  // Keypress handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        if (isGameOver) {
          // Reset all game states
          setIsGameOver(false)
          setBlockedCount(0)
          setIsWarningFlash(false)
          setIsImpactFlash(false)
          setIsBeamActive(false)
          setActiveEyeStalk(null)
          setCanBlock(false)
          setBeamStyle(null)
          clearAllTimers()
          // Schedule first beam after a short delay to let states settle
          setTimeout(() => {
            scheduleNextBeam()
          }, 100)
        } else if (canBlock) {
          // Successful block
          setBlockedCount(prev => prev + 1)
          setCanBlock(false)
          setIsImpactFlash(true)
          setTimeout(() => setIsImpactFlash(false), 50)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [canBlock, isGameOver, scheduleNextBeam, clearAllTimers])

  // Continuously update beam position during animation
  useEffect(() => {
    const updateBeamPosition = () => {
      if (activeEyeStalk && gameAreaRef.current && beholderRef.current) {
        const gameRect = gameAreaRef.current.getBoundingClientRect()
        const beholderRect = beholderRef.current.getBoundingClientRect()

        // Calculate start position relative to the beholder's position
        const startX = beholderRect.left - gameRect.left + 
                      (parseFloat(activeEyeStalk.left) / 100) * beholderRect.width
        const startY = beholderRect.top - gameRect.top + 
                      (parseFloat(activeEyeStalk.top) / 100) * beholderRect.height

        // Target is bottom center of game area
        const targetX = gameRect.width / 2
        const targetY = gameRect.height

        // Calculate angle and length from current position to target
        const deltaX = targetX - startX
        const deltaY = targetY - startY
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) - 90

        // Calculate length to ensure beam reaches bottom
        const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 1.5 // Add some extra length to ensure it reaches

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

  return (
    <div ref={gameAreaRef} className={`${styles.gameArea} ${isWarningFlash ? styles.warningFlash : ''}`}>
      {/* Color flash overlay using the active beam color */}
      {isImpactFlash && activeEyeStalk && (
        <div 
          className={styles.impactFlash} 
          style={{
            backgroundColor: `${activeEyeStalk.color}CC`, // CC = 80% opacity in hex
            boxShadow: `inset 0 0 50px ${activeEyeStalk.color}`
          }}
        />
      )}
      
      {isGameOver ? (
        <div className={styles.gameOverOverlay}>
          <h1 className={styles.gameOverText}>Game Over</h1>
          <p className={styles.retryText}>press space bar to retry</p>
        </div>
      ) : (
        <>
          <div className={styles.instructions}>
            Press SPACE to block the beams!
          </div>
          <div className={styles.scoreDisplay}>
            Blocked: {blockedCount}
          </div>
        </>
      )}

      <div className={styles.shadow}></div>
      <div ref={beholderRef} className={styles.beholder}>
        <img 
          src={isGameOver ? "/images/beholder_closed.png" : "/images/beholder_blink_loop.gif"}
          alt={isGameOver ? "Defeated Beholder" : "Blinking Beholder"}
          width={300}
          height={300}
        />
        {isBeamActive && activeEyeStalk && beamStyle && !isGameOver && (
          <div className={styles.effectsContainer}>
            <div 
              className={styles.eyeGlow}
              style={{
                top: activeEyeStalk.top,
                left: activeEyeStalk.left,
              }}
            />
            <div 
              className={styles.beamContainer}
              style={{
                top: activeEyeStalk.top,
                left: activeEyeStalk.left,
                transform: `rotate(${beamStyle.angle}deg)`,
              }}
            >
              <div 
                className={styles.eyeBeam} 
                style={{ 
                  backgroundColor: activeEyeStalk.color,
                  boxShadow: `0 0 10px ${activeEyeStalk.color}, 0 0 20px ${activeEyeStalk.color}`,
                  height: `${beamStyle.length}px`,
                }} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 