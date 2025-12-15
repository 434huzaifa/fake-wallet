'use client';

import { Button, Result } from 'antd';
import { useRouter } from 'next/navigation';
import { HomeOutlined } from '@ant-design/icons';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Button 
            type="primary" 
            icon={<HomeOutlined />}
            onClick={() => router.push('/')}
          >
            Back Home
          </Button>
        }
      />
    </div>
  );
}
