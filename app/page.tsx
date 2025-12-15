'use client';

import { useRouter } from 'next/navigation';
import { Typography, Button, Card } from 'antd';
import { WalletOutlined, LoginOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export const dynamic = 'force-dynamic';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card className="text-center shadow-lg">
          <div className="mb-6">
            <WalletOutlined className="text-6xl text-blue-600 mb-4" />
            <Title level={2} className="!mb-2">
              Welcome to Fake Wallet
            </Title>
            <Paragraph className="text-gray-600">
              Your digital wallet management solution. Organize your finances with ease.
            </Paragraph>
          </div>

          <div className="space-y-4">
            <Button
              type="primary"
              size="large"
              icon={<LoginOutlined />}
              block
              onClick={() => router.push('/auth')}
              className="h-12 text-base font-medium"
            >
              Get Started
            </Button>
            
            <div className="pt-4 border-t">
              <Paragraph className="text-sm text-gray-500">
                Create an account or sign in to start managing your wallets
              </Paragraph>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}