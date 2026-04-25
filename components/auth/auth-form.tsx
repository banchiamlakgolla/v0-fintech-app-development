'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Wallet, ArrowRight, Shield, Loader2 } from 'lucide-react'
import { userApi, otpApi } from '@/lib/api'
import { useAuth } from '@/context/auth-context'

type AuthStep = 'credentials' | 'otp' | 'pin'

interface FormData {
  name: string
  email: string
  phone: string
  pin: string
}

export function AuthForm() {
  const { login } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [step, setStep] = useState<AuthStep>('credentials')
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    pin: '',
  })
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isLogin) {
        // Check if user exists
        const existingUser = await userApi.getByEmail(formData.email)
        if (!existingUser) {
          setError('No account found with this email. Please register first.')
          setIsLoading(false)
          return
        }
      }

      // Send OTP
      await otpApi.send(formData.email)
      setStep('otp')
    } catch (err) {
      setError('Failed to send OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpVerify = async () => {
    if (otp.length !== 6) return
    
    setError('')
    setIsLoading(true)

    try {
      const result = await otpApi.verify(formData.email, otp)
      
      if (result.success) {
        if (isLogin && result.user) {
          login(result.user)
        } else {
          setStep('pin')
        }
      } else {
        setError('Invalid OTP. Please try again.')
      }
    } catch (err) {
      setError('Verification failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePinSubmit = async () => {
    if (formData.pin.length !== 4) return
    
    setError('')
    setIsLoading(true)

    try {
      const user = await userApi.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        pin: formData.pin,
      })
      login(user)
    } catch (err) {
      setError('Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setStep('credentials')
    setOtp('')
    setFormData({ name: '', email: '', phone: '', pin: '' })
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Eqde</h1>
          <p className="text-muted-foreground mt-2">Smart Budget Management</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {step === 'credentials' && (isLogin ? 'Welcome back' : 'Create account')}
              {step === 'otp' && 'Verify your identity'}
              {step === 'pin' && 'Set your PIN'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 'credentials' && (isLogin ? 'Enter your email to continue' : 'Enter your details to get started')}
              {step === 'otp' && 'Enter the 6-digit code sent to your email'}
              {step === 'pin' && 'Create a 4-digit PIN for secure transactions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'credentials' && (
              <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(v) => { setIsLogin(v === 'login'); resetForm(); }}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required={!isLogin}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+251 912 345 678"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        required={!isLogin}
                      />
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4 mr-2" />
                    )}
                    Continue
                  </Button>
                </form>
              </Tabs>
            )}

            {step === 'otp' && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Check your browser console for the OTP code (simulated)
                </p>

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <Button 
                  className="w-full" 
                  onClick={handleOtpVerify}
                  disabled={otp.length !== 6 || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  Verify OTP
                </Button>

                <Button variant="ghost" className="w-full" onClick={resetForm}>
                  Back to login
                </Button>
              </div>
            )}

            {step === 'pin' && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={4}
                    value={formData.pin}
                    onChange={(value) => setFormData(prev => ({ ...prev, pin: value }))}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  This PIN will be required for payment approvals
                </p>

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <Button 
                  className="w-full" 
                  onClick={handlePinSubmit}
                  disabled={formData.pin.length !== 4 || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  Complete Registration
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
