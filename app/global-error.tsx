'use client';

import { Button, Result } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

export const dynamic = 'force-dynamic';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Result
            status="500"
            title="500"
            subTitle="Sorry, something went wrong with the application."
            extra={[
              <Button 
                key="retry"
                type="primary" 
                onClick={() => reset()}
              >
                Try Again
              </Button>,
              <Button 
                key="home"
                icon={<HomeOutlined />}
                onClick={() => window.location.href = '/'}
              >
                Back Home
              </Button>
            ]}
          />
        </div>
      </body>
    </html>
  );
}
