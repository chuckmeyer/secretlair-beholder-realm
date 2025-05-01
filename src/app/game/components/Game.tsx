'use client'
import { useEffect, useRef, useState } from 'react'
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

  useEffect(() => {
    const shootBeam = () => {
      const eyeStalk = EYE_STALKS[Math.floor(Math.random() * EYE_STALKS.length)]
      
      setIsWarningFlash(true)
      setActiveEyeStalk(eyeStalk)
      
      setTimeout(() => {
        setIsWarningFlash(false)
        setIsBeamActive(true)
        
        setTimeout(() => {
          setIsImpactFlash(true)
          setTimeout(() => setIsImpactFlash(false), 50)
        }, 150)

        setTimeout(() => {
          setIsBeamActive(false)
          setActiveEyeStalk(null)
          scheduleNextBeam()
        }, 200)
      }, 300)
    }

    const scheduleNextBeam = () => {
      const delay = Math.random() * 13000 + 2000
      setTimeout(shootBeam, delay)
    }

    scheduleNextBeam()

    return () => {
      setIsWarningFlash(false)
      setIsImpactFlash(false)
      setIsBeamActive(false)
      setActiveEyeStalk(null)
    }
  }, [])

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
      
      <div className={styles.shadow}></div>
      <div ref={beholderRef} className={styles.beholder}>
        <img 
          src="/images/beholder_blink_loop.gif" 
          alt="Blinking Beholder" 
          width={300}
          height={300}
        />
        {isBeamActive && activeEyeStalk && beamStyle && (
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