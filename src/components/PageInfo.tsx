'use client';

import { Page } from '@/services/pageService';
import { Card } from 'primereact/card';

interface Props {
  info: Page;
}

export default function PageInfo({ info }: Props) {
  return (
    <Card title={info.name || 'de baby'}>
      <p>{info.description}</p>
      {info.city && (
        <p>
          {info.street}, {info.postalcode} {info.city}
        </p>
      )}
    </Card>
  );
}
