'use client';

import { useEffect } from 'react';
import docsearch from '@docsearch/js';
import '@docsearch/css';
import styles from './Header.module.css';

export default function Header() {
  useEffect(() => {
    docsearch({
      container: '#docsearch',
      appId: 'betaBQUQ3VS1UP',
      indexName: 'Secretlair',
      apiKey: 'fcb535b57cc0ab52cb8cc1bb23eb6101'
    });
  }, []);

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Welcome to the Secret Lair!</h1>
      <div id="docsearch" className={styles.searchContainer} />
    </header>
  );
} 