import Link from 'next/link'
import Image from 'next/image'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <div className={styles.titleGroup}>
          <Image
            src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDJ3bTdpYWE4ZGJyOWF6eHJyNmRzZGJyYmN2NmJxbGxvNnBqcmxqZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/hvRJCLFzcasrR4ia7z/giphy.gif"
            alt="Waving hand"
            width={80}
            height={80}
            className={styles.wavingHand}
          />
          <h1 className={styles.title}>Hello, World!</h1>
        </div>
        <nav className={styles.navigation}>
          <Link href="/about" className={styles.link}>
            About the author
          </Link>
          <Link href="/game" className={styles.link}>
            Play the Game
          </Link>
        </nav>
      </div>
    </main>
  )
}
