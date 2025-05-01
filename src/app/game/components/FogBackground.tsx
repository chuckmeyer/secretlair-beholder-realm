'use client'
import { memo, useEffect, useRef } from 'react'
import styles from './FogBackground.module.css'

const FogBackground = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null)
  const layer1Ref = useRef<HTMLDivElement>(null)
  const layer2Ref = useRef<HTMLDivElement>(null)
  const layer3Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const startRotation = () => {
      if (layer1Ref.current) layer1Ref.current.style.transform = 'rotate(360deg) scale(1)'
      if (layer2Ref.current) layer2Ref.current.style.transform = 'rotate(-360deg) scale(1.2)'
      if (layer3Ref.current) layer3Ref.current.style.transform = 'rotate(360deg) scale(1.1)'
    }

    // Start the rotation after a small delay to ensure the transition is applied
    const timeoutId = setTimeout(startRotation, 100)

    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <div ref={containerRef} className={styles.fogContainer}>
      <div ref={layer1Ref} className={styles.fogLayer1}></div>
      <div ref={layer2Ref} className={styles.fogLayer2}></div>
      <div ref={layer3Ref} className={styles.fogLayer3}></div>
    </div>
  )
})

FogBackground.displayName = 'FogBackground'

export default FogBackground 