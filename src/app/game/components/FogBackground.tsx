'use client'
import { memo } from 'react'
import styles from './FogBackground.module.css'

const FogBackground = memo(() => {
  return (
    <>
      <div className={styles.fogLayer1}></div>
      <div className={styles.fogLayer2}></div>
      <div className={styles.fogLayer3}></div>
    </>
  )
})

FogBackground.displayName = 'FogBackground'

export default FogBackground 