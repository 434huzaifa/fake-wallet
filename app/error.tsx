'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';
import { useRouter } from 'next/navigation';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';

export const dynamic = 'force-dynamic';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Result
        status="500"
        title="500"
        subTitle="Sorry, something went wrong."
        extra={[
          <Button 
            key="retry"
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={() => reset()}
          >
            Try Again
          </Button>,
          <Button 
            key="home"
            icon={<HomeOutlined />}
            onClick={() => router.push('/')}
          >
            Back Home
          </Button>
        ]}
      />
    </div>
  );
}
