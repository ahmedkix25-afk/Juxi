import React from 'react';
import { ProductLandingView } from '@/components/landing/ProductLandingView';

export default async function ProductLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductLandingView slug={slug} />;
}
