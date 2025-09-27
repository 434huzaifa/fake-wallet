'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Typography, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser, registerUser, clearError } from '../../store/slices/authSlice';
import { LoginInput, RegisterInput } from '../../lib/validations';
import EmojiAvatarPicker from '../../components/EmojiAvatarPicker';

const { Title, Text, Link } = Typography;

export default function AuthPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  const handleSubmit = async (values: LoginInput | RegisterInput) => {
    try {
      if (isLoginMode) {
        const result = await dispatch(loginUser(values as LoginInput));
        if (loginUser.fulfilled.match(result)) {
          router.push('/dashboard');
        }
      } else {
        const result = await dispatch(registerUser(values as RegisterInput));
        if (registerUser.fulfilled.match(result)) {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    form.resetFields();
    dispatch(clearError());
  };

  const handleFormChange = () => {
    if (error) {
      dispatch(clearError());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Title level={2} className="text-gray-900">
            {isLoginMode ? 'Sign in to your account' : 'Create new account'}
          </Title>
          <Text className="text-gray-600">
            {isLoginMode 
              ? 'Welcome back! Please sign in to continue.' 
              : 'Join us to start managing your digital wallets.'
            }
          </Text>
        </div>

        <Card className="shadow-lg">
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              closable
              onClose={() => dispatch(clearError())}
              className="mb-4"
            />
          )}

          <Form
            form={form}
            name={isLoginMode ? 'login' : 'register'}
            onFinish={handleSubmit}
            onChange={handleFormChange}
            layout="vertical"
            size="large"
          >
            {!isLoginMode && (
              <>
                <Form.Item
                  name="name"
                  label="Full Name"
                  rules={[
                    { required: true, message: 'Please input your name!' },
                    { min: 2, message: 'Name must be at least 2 characters!' },
                    { max: 50, message: 'Name cannot exceed 50 characters!' },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined className="text-gray-400" />}
                    placeholder="Enter your full name"
                  />
                </Form.Item>

                <Form.Item
                  name="avatar"
                  label="Avatar"
                  initialValue="😀"
                  rules={[
                    { max: 4, message: 'Avatar must be a single emoji!' },
                  ]}
                >
                  <EmojiAvatarPicker />
                </Form.Item>
              </>
            )}

            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="Enter your email"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 6, message: 'Password must be at least 6 characters!' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Enter your password"
                autoComplete={isLoginMode ? 'current-password' : 'new-password'}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                className="h-12 text-base font-medium"
              >
                {isLoginMode ? 'Sign In' : 'Create Account'}
              </Button>
            </Form.Item>
          </Form>

          <Divider>
            <Text className="text-gray-400">or</Text>
          </Divider>

          <div className="text-center">
            <Text className="text-gray-600">
              {isLoginMode ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <Link onClick={switchMode} className="font-medium">
              {isLoginMode ? 'Sign up here' : 'Sign in here'}
            </Link>
          </div>
        </Card>

        <div className="text-center">
          <Text className="text-sm text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </div>
      </div>
    </div>
  );
}