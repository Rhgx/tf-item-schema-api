import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          TF2 Inventory Data, Made Practical
        </Heading>
        <p className="hero__subtitle">
          Query any TF2 profile and get clean, predictable item metadata for web apps, bots, dashboards, and tools.
        </p>
        <div className={styles.badges}>
          <span className={styles.badge}>HTTP API</span>
          <span className={styles.badge}>TypeScript SDK</span>
          <span className={styles.badge}>Normalized Output</span>
        </div>
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/docs/getting-started">
            Start in 5 minutes
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/http-api">
            View API Reference
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="TF2 inventory metadata API and TypeScript SDK docs">
      <HomepageHeader />
    </Layout>
  );
}
