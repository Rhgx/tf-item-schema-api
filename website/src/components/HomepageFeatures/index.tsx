import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  icon: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Consistent Item Model',
    icon: 'API',
    description: (
      <>
        Get a stable response shape across all items, including quality,
        tradability, unusual effects, killstreak data, spells, crate metadata,
        and schema-backed attributes.
      </>
    ),
  },
  {
    title: 'Powerful Filtering',
    icon: 'FLT',
    description: (
      <>
        Filter by quality, names, trade flags, crate series, and now by
        assigned item attributes like defindex, class, and decoded value.
      </>
    ),
  },
  {
    title: 'Docs for Real Users',
    icon: 'DOC',
    description: (
      <>
        Follow step-by-step setup, practical API and SDK examples, and clear
        explanations of each filter and output field without boilerplate fluff.
      </>
    ),
  },
];

function Feature({title, icon, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}>
        <div className={styles.iconBadge} aria-hidden>
          {icon}
        </div>
        <div className="text--left">
          <Heading as="h3">{title}</Heading>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
