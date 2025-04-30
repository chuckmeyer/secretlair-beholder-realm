'use client'
import { useEffect, useRef } from 'react'
import styles from './Game.module.css'

export default function Game() {
  const beholderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Any initialization code will go here
  }, [])

  return (
    <div className={styles.gameArea}>
      <div className={styles.shadow}></div>
      <div ref={beholderRef} className={styles.beholder}>
        <img 
          src="/images/beholder_blink_loop.gif" 
          alt="Blinking Beholder" 
          width={300}
          height={300}
        />
      </div>
    </div>
  )
} 