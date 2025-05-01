import Link from 'next/link'
import Image from 'next/image'
import styles from './game.module.css'
import Game from './components/Game'

export default function GamePage() {
  return (
    <main className={styles.gameMain}>
      <Link href="/" className={styles.backLink}>
        <span className={styles.arrow}>←</span> Back to Home
      </Link>
      <div className={styles.gameContainer}>
        <h1 className={styles.title}>Beholder&apos;s Realm</h1>
        <div className={styles.gameCanvasWrapper}>
          <div className={styles.backgroundImage}>
            <Image
              src="/images/beholder_lair.png"
              alt="Beholder's Lair Background"
              fill
              priority
              className={styles.backgroundImageContent}
            />
          </div>
          <div className={styles.fogLayer1}></div>
          <div className={styles.fogLayer2}></div>
          <div className={styles.fogLayer3}></div>
          <div className={styles.gameCanvas}>
            <Game />
          </div>
        </div>
        <div className={styles.instructions}>
          <p>Press SPACE or tap to block the beams!</p>
          <p className={styles.mobileNote}>Tap anywhere on the screen to play on mobile</p>
        </div>
      </div>
    </main>
  )
} 